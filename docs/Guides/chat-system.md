# Chat System Guide

The chat system ships as a production-ready, credit-gated, multi-model AI chat interface built on Vercel AI SDK v6, Convex, and Clerk. This guide explains how it works and how to customize it for your SaaS.

---

## 1. Architecture Overview

```
User input
  └─> ChatPage ("use client")
        └─> useChat (AI SDK v6, DefaultChatTransport)
              └─> POST /api/chat (Next.js Route Handler)
                    ├─> Clerk auth (server-side)
                    ├─> deductCreditsPublic (Convex mutation)
                    ├─> aiModels.getByModelId (Convex query)
                    ├─> getModelFromGateway (Vercel AI Gateway)
                    └─> streamText → toUIMessageStreamResponse()
                          └─> SSE stream back to useChat
                                └─> MessageList renders UIMessage[]
```

### Key files

| File | Role |
|------|------|
| `app/api/chat/route.ts` | Streaming endpoint — auth, credits, model resolution, streaming |
| `components/chat/ChatPage.tsx` | Client shell — useChat, input, model selector |
| `components/chat/MessageList.tsx` | Renders UIMessage[] with parts[] support |
| `components/chat/ModelSelector.tsx` | Dropdown — reads `aiModels` table from Convex |
| `lib/ai/prompts/chat.ts` | System prompt builder |
| `lib/ai/providers.ts` | Gateway model resolution, fallback map |
| `convex/chats.ts` | Chat CRUD — create, list, listByProject, getById, update, remove |
| `convex/messages.ts` | Message persistence — save, list, getById |
| `convex/credits.ts` | Credit balance, deduction, refund |
| `app/[locale]/dashboard/chat/page.tsx` | Chat list page (search + project filter) |
| `app/[locale]/dashboard/chat/[chatId]/page.tsx` | Individual chat session page |

### Data flow

1. User submits a message — `sendMessage()` fires with `{ body: { selectedModel } }`.
2. `useChat` posts to `/api/chat` via `DefaultChatTransport`.
3. Route authenticates with Clerk, obtains a Convex JWT.
4. Route calls `deductCreditsPublic` — deducts 1 credit or returns 402.
5. Route queries `aiModels.getByModelId` to resolve the gateway model path.
6. `streamText` calls the Vercel AI Gateway; response streams back as SSE.
7. On finish, `usageTracking.logAIUsage` records tokens and cost (fire-and-forget).
8. On error, `refundCreditsPublic` reverses the credit deduction.

---

## 2. How Chat Works

### useChat (AI SDK v6)

`ChatPage` uses `useChat` from `@ai-sdk/react`:

```typescript
const { messages, sendMessage, stop, status, error } = useChat({
  id: chatId, // namespaces the client-side message store per session
});
```

- `id` isolates message state per chat session. Without it, all tabs share the same message array.
- `DefaultChatTransport` posts to `/api/chat` automatically — no `api` prop needed.
- `sendMessage` replaces the v5 pattern of `handleSubmit` + `handleInputChange`.
- Extra data is passed per-request via the second argument:

```typescript
await sendMessage({ text }, { body: { selectedModel } });
```

### toUIMessageStreamResponse() vs toTextStreamResponse()

The route returns `result.toUIMessageStreamResponse()`, not `toTextStreamResponse()`.

This is required by AI SDK v6. `useChat` with `DefaultChatTransport` expects the UI message stream protocol (SSE with structured `UIMessage` events). `toTextStreamResponse()` returns plain text — `useChat` cannot parse it and the message array stays empty.

### Message format: parts[] vs content

AI SDK v6 `UIMessage` objects carry a `parts` array instead of a `content` string:

```typescript
// What arrives in MessageList
interface UIMessage {
  id: string;
  role: "user" | "assistant";
  parts: Array<TextUIPart | ToolUIPart | ...>;
  content: string; // legacy — may be empty in v6
}
```

`MessageList` always reads from `parts`:

```typescript
const textContent = parts.filter(isTextUIPart).map((p) => p.text).join("");
const toolParts = parts.filter(isToolUIPart);
```

The API route handles the reverse: incoming `messages` may have `parts` but no `content`. The route extracts text from parts before passing to `streamText`:

```typescript
let text = msg.content || "";
if (!text && msg.parts) {
  text = msg.parts.filter((p) => p.type === "text" && p.text)
                  .map((p) => p.text).join("\n");
}
```

### Streaming behavior

- `status === "streaming"` — tokens arriving.
- `status === "submitted"` — request sent, waiting for first token.
- `isStreaming = status === "streaming" || status === "submitted"` — used to disable input and show the stop button.
- The textarea is disabled while streaming; `stop()` aborts the stream.

---

## 3. Chat Sessions (Convex Backend)

### chats table

Defined in `convex/chats.ts`. Fields:

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Display name (editable) |
| `workspaceId` | Id<"workspaces"> | Owner workspace |
| `projectId` | Id<"projects"> (optional) | Associated project |
| `createdBy` | string | Clerk user ID (identity.subject) |
| `visibility` | "private" \| "workspace" | Access scope |
| `isPinned` | boolean | Pinned chats sort first |
| `selectedModel` | string | Last used model |
| `createdAt` / `updatedAt` | number | Unix ms timestamps |

Available functions:

```typescript
api.chats.list            // list chats for current user's default workspace
api.chats.listByProject   // filter by project
api.chats.getById         // single chat (ownership verified)
api.chats.create          // create new chat
api.chats.update          // update title, visibility, isPinned, selectedModel
api.chats.remove          // delete chat
```

### messages table

Defined in `convex/messages.ts`. Available functions:

```typescript
api.messages.list    // list messages for a chat (ordered by createdAt)
api.messages.getById // single message (ownership chain verified)
api.messages.save    // save a message (user or assistant)
api.messages.update  // update message content
api.messages.deleteAfterTimestamp // truncate history from a point in time
```

### Workspace scoping

Every query and mutation calls `requireAuth` internally and resolves the user's default workspace via the `by_owner_and_default` index. All operations are scoped to that workspace — users cannot access chats from other workspaces.

Ownership checks compare `chat.createdBy === identity.subject` (Clerk user ID strings, not Convex document IDs).

### Chat list page

`app/[locale]/dashboard/chat/page.tsx` provides:
- Real-time chat list via `useQuery(api.chats.list)`.
- Project filter via `useQuery(api.chats.listByProject)` — only shown when projects exist.
- Client-side title search (filters the returned array).
- Pinned chats sorted first.
- "New Chat" button creates a chat via `api.chats.create` then navigates to `/{locale}/dashboard/chat/{chatId}`.

---

## 4. Credit System Integration

### creditCosts table

The system reads costs from the `creditCosts` Convex table. A row must exist for `actionType: "chat_message"` with `isActive: true`.

Seed this row in your Convex dashboard or via a seed script:

```typescript
await ctx.db.insert("creditCosts", {
  actionType: "chat_message",
  category: "chat",
  displayName: "Chat Message",
  credits: 1,
  isActive: true,
  description: "1 credit per AI chat message",
});
```

You can seed this row via the Convex dashboard (**Functions > seed/seedCreditCosts > Run Function**) or with the CLI:

```bash
npx convex run seed/seedCreditCosts:seedCreditCosts
```

If the row is missing or `isActive` is false, `deductCreditsPublic` returns `{ success: false }` and every chat request fails.

### deductCreditsPublic flow

Called at the start of every request before streaming begins:

```typescript
const creditResult = await fetchMutation(
  api.credits.deductCreditsPublic,
  { clerkUserId: userId, actionType: "chat_message", projectId, projectName },
  { token: convexToken },
);

if (!creditResult.success) {
  return new Response(
    JSON.stringify({ error: creditResult.error, code: "INSUFFICIENT_CREDITS" }),
    { status: 402 },
  );
}
transactionId = creditResult.transactionId;
```

The mutation returns `transactionId` — stored in scope so it can be refunded on error.

### refundCreditsPublic

If `streamText` throws, the catch block refunds the credit before returning 500:

```typescript
await fetchMutation(
  api.credits.refundCreditsPublic,
  { transactionId, reason: "AI streaming failed" },
  { token: convexToken },
);
```

This ensures users are not charged for failed requests.

### Auto-initialization

New users have no row in `userCredits`. On first deduction, `deductCredits` checks for a `systemConfig` row with `key: "initial_credits_default"`. If found, its `value` is used as the starting balance. Default fallback is **200 credits**.

To change the default, insert or patch the `systemConfig` row:

```typescript
await ctx.db.insert("systemConfig", {
  key: "initial_credits_default",
  value: 500, // credits to grant new users
});
```

---

## 5. System Prompt

### systemPrompt() function

Located at `lib/ai/prompts/chat.ts`. Called by the route:

```typescript
const prompt = systemPrompt({
  selectedChatModel: selectedModel,
  requestHints: {
    longitude: req.headers.get("x-vercel-ip-longitude") ?? undefined,
    latitude: req.headers.get("x-vercel-ip-latitude") ?? undefined,
    city: req.headers.get("x-vercel-ip-city") ?? undefined,
    country: req.headers.get("x-vercel-ip-country") ?? undefined,
  },
});
```

### Request hints (geolocation)

Vercel populates `x-vercel-ip-*` headers automatically on edge deployments. Locally they are undefined and the prompt omits the location section gracefully.

### How to customize the prompt for your SaaS

Replace or extend the exported `regularPrompt` string and the `systemPrompt` function body:

```typescript
// lib/ai/prompts/chat.ts

export const regularPrompt = `You are a helpful assistant for Acme Corp.
You help users manage their projects and answer questions about their data.
Never discuss competitors. Keep responses under 3 paragraphs unless asked.`;

export const systemPrompt = ({
  selectedChatModel: _selectedChatModel,
  requestHints,
}: {
  selectedChatModel: string;
  requestHints: RequestHints;
}): string => {
  return `${regularPrompt}

${requestHints.city ? `The user is located in ${requestHints.city}, ${requestHints.country}.` : ""}`;
};
```

The `selectedChatModel` parameter is available for per-model prompt tuning (e.g., giving reasoning models a different instruction set). It is intentionally unused in the default implementation.

---

## 6. Model Selection

### ModelSelector component

`components/chat/ModelSelector.tsx` reads models from Convex in real time:

```typescript
const rawModels = useQuery(api.aiModels.list);
```

Models are grouped by `category` (flagship, balanced, fast, reasoning, coding, vision) and display a provider badge. Only models with `isEnabled: true` appear.

The selected model ID is stored in `ChatPage` state:

```typescript
const [selectedModel, setSelectedModel] = useState("claude-sonnet-4-5");
```

### How selected model flows to the API

Model selection is per-request, not per-transport. It is injected into the request body:

```typescript
await sendMessage({ text }, { body: { selectedModel } });
```

The route reads it:

```typescript
const selectedModel: string = body.selectedModel ?? "claude-sonnet-4-5";
```

Then queries Convex for the gateway path:

```typescript
const aiModel = await fetchQuery(api.aiModels.getByModelId, { modelId: selectedModel });
const model = getModelFromGateway(selectedModel, aiModel?.gatewayModel);
```

### Default model

The default is `claude-sonnet-4-5`. It is set in two places — update both when changing it:

1. `ChatPage.tsx` line 16: `useState("claude-sonnet-4-5")`
2. `app/api/chat/route.ts` line 77: `body.selectedModel ?? "claude-sonnet-4-5"`

### Model resolution priority

`getModelFromGateway` in `lib/ai/providers.ts` resolves in this order:

1. `gatewayModel` from Convex `aiModels` table (most authoritative — admin-controlled).
2. `DEFAULT_GATEWAY_MODELS` fallback map (hardcoded in `providers.ts`).
3. `modelId` used as-is as a gateway path (allows `"openai/gpt-4o-2024-11-20"` style IDs).

---

## 7. Customization Guide

### Change the default model

```typescript
// components/chat/ChatPage.tsx
const [selectedModel, setSelectedModel] = useState("gpt-4o");

// app/api/chat/route.ts
const selectedModel: string = body.selectedModel ?? "gpt-4o";
```

Ensure the model exists in `aiModels` in Convex, or add it to `DEFAULT_GATEWAY_MODELS` in `lib/ai/providers.ts`.

### Customize the system prompt

Edit `lib/ai/prompts/chat.ts`. The function receives `selectedChatModel` and `requestHints`. Return any string — it becomes the system message prepended to every conversation.

### Add a new action type with its own credit cost

1. Insert a row in `creditCosts`:

```typescript
await ctx.db.insert("creditCosts", {
  actionType: "my_feature",
  displayName: "My Feature",
  credits: 5,
  isActive: true,
  description: "5 credits per my feature usage",
});
```

2. In your API route, call `deductCreditsPublic` with `actionType: "my_feature"`.

3. The credit system handles balance checks, deduction, and transaction logging automatically.

### Add a new model

Option A — via Convex dashboard: insert a row in `aiModels` with `isEnabled: true` and the correct `gatewayModel` path (e.g., `"anthropic/claude-opus-4.5"`).

Option B — via seed script, extend `DEFAULT_GATEWAY_MODELS` in `lib/ai/providers.ts`:

```typescript
const DEFAULT_GATEWAY_MODELS: Record<string, string> = {
  // ... existing entries
  "my-custom-model": "openai/gpt-4o-2024-11-20",
};
```

### Modify the chat UI

- **Input area**: `components/chat/ChatPage.tsx` — the `<form>` at the bottom.
- **Message bubbles**: `components/chat/MessageList.tsx` — `MessageBubble` component.
- **Header / branding**: `ChatPage.tsx` — the `border-b` div with the AI Agent title and avatar.
- **Tool call display**: `components/chat/ToolCallIndicator.tsx`.

All components are Server Component-safe in their tree — `ChatPage` is the only `"use client"` boundary.

### Change temperature or other model parameters

In `app/api/chat/route.ts`:

```typescript
const result = await streamText({
  model,
  messages: coreMessages,
  temperature: 0.3, // default is 0.7
  maxTokens: 4096,  // add any streamText option here
  // ...
});
```

---

## 8. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AI_GATEWAY_API_KEY` | Yes | Vercel AI Gateway API key — used by `@ai-sdk/gateway` |
| `CONVEX_DEPLOYMENT` | Yes | Convex deployment name (e.g., `dev:your-project-123`) |
| `NEXT_PUBLIC_CONVEX_URL` | Yes | Public Convex URL for client-side queries |
| `CLERK_SECRET_KEY` | Yes | Clerk secret — used by `auth()` in the route |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key — client-side auth |

The route calls `auth()` from `@clerk/nextjs/server` and then `authResult.getToken({ template: "convex" })` to obtain a Convex JWT. This requires the Convex JWT template to be configured in your Clerk dashboard under **JWT Templates**.

Local development: all variables go in `.env.local`. Production: set them in your Vercel project environment settings.

---

## 9. Troubleshooting

### "INSUFFICIENT_CREDITS" on every request

**Cause**: The `creditCosts` table has no active row for `"chat_message"`.

**Fix**: Seed the row (see Section 4). Verify in the Convex dashboard under **Data > creditCosts**.

### Chat responses are empty / messages array never updates

**Cause**: The route is returning `toTextStreamResponse()` instead of `toUIMessageStreamResponse()`, or returning a plain JSON response.

**Fix**: Ensure the route returns `result.toUIMessageStreamResponse()`. The `useChat` `DefaultChatTransport` requires the UI message stream protocol.

### "Model not found" / model falls back to gateway path

**Cause**: The `modelId` from the request has no entry in `aiModels` (Convex) and no entry in `DEFAULT_GATEWAY_MODELS` (providers.ts).

**Fix**: Either insert the model in the `aiModels` table in Convex (admin dashboard), or add it to `DEFAULT_GATEWAY_MODELS` in `lib/ai/providers.ts`. The console will log a warning: `[providers] Model "xyz" not found in defaults, using as gateway path`.

### Auth fails in the route / Convex mutations return 403

**Cause**: The Clerk JWT template for Convex is missing or misconfigured.

**Fix**: In Clerk dashboard → **JWT Templates**, ensure a template named `"convex"` exists with the Convex-required claims. See `docs/Guides/clerk-authentication-setup.md` for the full setup.

### Credits deducted but stream never starts / user not refunded

**Cause**: An exception thrown after `deductCreditsPublic` but before `streamText` — or the catch block failed to refund.

**Check**: Search server logs for `[Chat API] Failed to refund credits`. The `transactionId` is logged before streaming starts. If you see `Credits refunded for transaction: xxx` in logs, the refund succeeded. If not, query `creditTransactions` in Convex for the transaction and manually patch via the dashboard.

### useChat `status` stays "submitted" indefinitely

**Cause**: The streaming response never arrives — typically a network timeout, an error before `streamText` that returned a non-streaming response, or a CORS issue in local dev.

**Fix**: Check the `/api/chat` route response in browser DevTools → Network. If the response is JSON (not `text/event-stream`), the route threw before reaching `streamText`. Inspect the response body for the error message.
