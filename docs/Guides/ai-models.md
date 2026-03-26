# AI Models Guide

This guide covers how VantageStarter manages AI models: the architecture, the database schema, how to add or remove models, and how to configure providers.

**Target audience:** A developer who bought VantageStarter and wants to control which AI models are available in their app.

---

## 1. How AI Models Work

### Architecture overview

```
User selects model in UI
        |
        v
ModelSelector.tsx  ──reads──>  aiModels.list (Convex query)
        |
        v
POST /api/chat/route.ts
  1. Authenticates user (Clerk)
  2. Deducts 1 credit
  3. Fetches model record: aiModels.getByModelId(modelId)
  4. Calls getModelFromGateway(modelId, record.gatewayModel)
  5. Streams via Vercel AI Gateway → Provider
  6. Logs tokens + cost to usageTracking
```

### Vercel AI Gateway

VantageStarter uses `@ai-sdk/gateway` — a single endpoint that routes requests to any supported provider. You configure one environment variable (`AI_GATEWAY_API_KEY`) and the gateway handles authentication with Anthropic, OpenAI, Google, xAI, DeepSeek, and Mistral on your behalf.

This means:
- No per-provider API keys in your environment
- Switching providers requires only changing `gatewayModel` in the database
- Adding a new provider requires no code changes

The gateway model path format is `provider/model-name`, for example:
- `anthropic/claude-sonnet-4.5`
- `openai/gpt-4o`
- `google/gemini-2.5-flash`

Reference: [Vercel AI Gateway model list](https://vercel.com/ai-gateway/models)

### Resolution priority

When a chat request arrives, `getModelFromGateway` in `lib/ai/providers.ts` resolves the model in this order:

1. `gatewayModel` field from the Convex `aiModels` record (most authoritative)
2. `DEFAULT_GATEWAY_MODELS` fallback map in `lib/ai/providers.ts`
3. The raw `modelId` string, used as-is as a gateway path (last resort)

---

## 2. AI Models Table Schema

Defined in `convex/schema.ts` at the `aiModels` table. Implemented in `convex/aiModels.ts`.

### Identifiers

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `modelId` | `string` | Yes | Internal stable ID used in code and stored in chats. Never change this once in use. Example: `"gpt-4o"` |
| `gatewayModel` | `string` | Yes | Vercel AI Gateway path. Example: `"openai/gpt-4o"` |

### Display info

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `displayName` | `string` | Yes | Human-readable name shown in the UI. Example: `"GPT-4o"` |
| `description` | `string` | Yes | Short description shown in the model selector. |
| `bestAt` | `string` | Yes | One-liner about the model's strength. Shown as subtitle in the selector. |
| `logoUrl` | `string` | No | Provider logo URL. Vercel AI Gateway provides these at their docs. |

### Provider and capabilities

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `provider` | `enum` | Yes | One of: `anthropic`, `openai`, `google`, `xai`, `deepseek`, `meta`, `mistral` |
| `contextWindow` | `number` | Yes | Max input tokens. Example: `200000` |
| `maxOutput` | `number` | Yes | Max output tokens. Example: `64000` |
| `category` | `enum` | Yes | One of: `flagship`, `balanced`, `fast`, `reasoning`, `coding`, `vision` |

### Pricing (per million tokens)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `inputCostPerMillion` | `number` | No | USD cost per 1M input tokens. Example: `3.0` = $3.00/M |
| `outputCostPerMillion` | `number` | No | USD cost per 1M output tokens. Example: `15.0` = $15.00/M |
| `supportsCache` | `boolean` | No | Whether prompt caching is available |
| `cacheReadCostPerMillion` | `number` | No | Cost to read from cache per 1M tokens |
| `cacheWriteCostPerMillion` | `number` | No | Cost to write to cache per 1M tokens |
| `supportsWebSearch` | `boolean` | No | Whether the model supports built-in web search |
| `webSearchCostPer1K` | `number` | No | USD cost per 1K web search queries |

### Feature flags

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `supportsVision` | `boolean` | No | Can process images |
| `supportsTools` | `boolean` | No | Supports function/tool calling |
| `supportsStreaming` | `boolean` | No | Supports streaming responses |
| `supportsReasoning` | `boolean` | No | Extended chain-of-thought reasoning |

### Availability

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `isEnabled` | `boolean` | Yes | Controls visibility in the model selector |
| `isDefault` | `boolean` | No | Marks this as the platform default model. Only one model should have this set to `true` |
| `orderPosition` | `number` | No | Sort order within a category. Lower = first |

### Timestamps

`createdAt` and `updatedAt` are Unix timestamps (milliseconds). Set automatically on create/update.

### Indexes

| Index | Fields | Used by |
|-------|--------|---------|
| `by_model_id` | `modelId` | `getByModelId` query in API route |
| `by_provider` | `provider` | Admin filtering |
| `by_category` | `category` | Admin filtering |
| `by_enabled` | `isEnabled` | `list` query (model selector) |

---

## 3. How to Add a New Model

### Step 1: Find the gateway model path

Go to [https://vercel.com/ai-gateway/models](https://vercel.com/ai-gateway/models) and find the model. The gateway path is in `provider/model-name` format.

### Step 2: Add via Convex dashboard

1. Open your Convex dashboard
2. Navigate to **Functions** > **aiModels** > **create**
3. Run the mutation with the required arguments (see below)

Alternatively, use the Convex CLI.

### Step 3: Add via CLI

```bash
npx convex run aiModels:create '{
  "modelId": "claude-opus-4.5",
  "gatewayModel": "anthropic/claude-opus-4.5",
  "displayName": "Claude Opus 4.5",
  "description": "Best reasoning (premium)",
  "provider": "anthropic",
  "contextWindow": 200000,
  "maxOutput": 64000,
  "bestAt": "Complex reasoning, vision",
  "category": "reasoning",
  "inputCostPerMillion": 5.0,
  "outputCostPerMillion": 25.0,
  "supportsVision": true,
  "supportsTools": true,
  "supportsStreaming": true,
  "supportsReasoning": true,
  "orderPosition": 1
}'
```

### Required vs optional fields

**Required:** `modelId`, `gatewayModel`, `displayName`, `description`, `provider`, `contextWindow`, `maxOutput`, `bestAt`, `category`

**Optional (but recommended):** `inputCostPerMillion`, `outputCostPerMillion`, `supportsVision`, `supportsTools`, `supportsStreaming`, `orderPosition`

**Defaults applied automatically:** `isEnabled: true`, `orderPosition: 0`

### Important constraints

- `modelId` must be unique. The `create` mutation will throw if a duplicate is detected.
- `modelId` is a stable reference key — once chats store it, changing it will break those chats. Treat it as immutable.
- The `create` mutation requires admin role. See [HOW-TO-SET-ADMIN.md](HOW-TO-SET-ADMIN.md).

---

## 4. How to Disable or Remove a Model

### Disable (recommended)

Disabling a model hides it from the model selector immediately without deleting data. Existing chats that reference the model continue to work — the API route will still resolve the model and stream responses. Only the UI selector filters by `isEnabled: true`.

Via CLI (use the Convex document ID, not the modelId):

```bash
npx convex run aiModels:toggle '{"id": "jd7abc123..."}'
```

Via the Convex dashboard: navigate to **Data** > **aiModels**, find the record, and set `isEnabled` to `false`.

Alternatively, use the `update` mutation to set it directly:

```bash
npx convex run aiModels:update '{"id": "jd7abc123...", "isEnabled": false}'
```

### Delete permanently

```bash
npx convex run aiModels:remove '{"id": "jd7abc123..."}'
```

**Impact on existing chats:** Deleting a model does not break existing chat history — the messages are stored as text. However, if a user tries to continue a chat that was using the deleted model, the API route will fall back to `DEFAULT_GATEWAY_MODELS` or use the raw `modelId` as a gateway path. If neither resolves, the stream will fail with a gateway error. Disable instead of delete unless you are certain the model is no longer reachable.

---

## 5. How to Set the Default Model

The default model is used when no model is explicitly selected. The `getDefault` query returns the model with `isDefault: true`, falling back to the first `balanced` model, then the first enabled model.

Set a new default via CLI (use the document ID):

```bash
npx convex run aiModels:setDefault '{"id": "jd7abc123..."}'
```

The `setDefault` mutation:
1. Clears `isDefault` from all other models
2. Sets `isDefault: true` on the target model
3. Force-enables the model (`isEnabled: true`) — a disabled model cannot be default

Only one model has `isDefault: true` at any time. If no model has the flag set, `getDefault` falls back gracefully.

---

## 6. Seeded Models

VantageStarter ships with 24 pre-seeded models. The seed is defined in `convex/aiModels.ts` in the `seed` internal mutation.

### Flagship

| modelId | Provider | Best at |
|---------|----------|---------|
| `claude-sonnet-4.5` | Anthropic | Complex reasoning & analysis (default) |
| `gpt-5.2` | OpenAI | General & agentic tasks |
| `gemini-3-pro-preview` | Google | Coding, planning, reasoning |
| `grok-4` | xAI | Math, reasoning, general |

### Balanced

| modelId | Provider | Best at |
|---------|----------|---------|
| `gpt-5-chat` | OpenAI | Chat & general tasks |
| `gemini-2.5-flash` | Google | Price/performance balance |
| `claude-3.7-sonnet` | Anthropic | Coding, content, analysis |
| `deepseek-v3.2` | DeepSeek | Code & technical tasks |

### Fast

| modelId | Provider | Best at |
|---------|----------|---------|
| `claude-haiku-4.5` | Anthropic | Coding, agents, computer use |
| `gemini-3-flash` | Google | Speed-critical tasks |
| `gemini-2.5-flash-lite` | Google | Bulk processing |
| `gpt-5-mini` | OpenAI | Speed, cost, capability |
| `gpt-5-nano` | OpenAI | Classification, simple tasks |
| `grok-4-fast` | xAI | Speed with huge context (2M tokens) |

### Reasoning

| modelId | Provider | Best at |
|---------|----------|---------|
| `claude-opus-4.5` | Anthropic | Complex reasoning, vision |
| `o3` | OpenAI | Coding, math, science |
| `o3-mini` | OpenAI | Quick reasoning tasks |
| `o4-mini` | OpenAI | Math, coding, visual |
| `deepseek-v3.2-thinking` | DeepSeek | Step-by-step reasoning |
| `deepseek-r1` | DeepSeek | Deep reasoning |

### Coding

| modelId | Provider | Best at |
|---------|----------|---------|
| `gpt-5-codex` | OpenAI | Code generation & review |
| `gpt-5.2-codex` | OpenAI | Long-horizon coding |
| `grok-code-fast-1` | xAI | Code completion & debug |
| `mistral-codestral` | Mistral | Fill-in-middle, tests |

### Seed commands

`seed` and `clearAll` are `internalMutation` — they cannot be called via `npx convex run` from the CLI (that only works for public mutations). Use the Convex dashboard instead:

1. Open your Convex dashboard → **Functions**
2. Navigate to **aiModels** → **seed** (or **clearAll**)
3. Click **Run Function** (no arguments required)

Run `seed` to populate the 24 default models (skips if models already exist).

Run `clearAll` first if you want to reset and re-seed from scratch.

The functions require no auth and are safe to run in development and production.

---

## 7. Provider Configuration

### Environment variable

The only variable you need:

```
AI_GATEWAY_API_KEY=vgw_...
```

Set this in your Vercel project environment variables (Production, Preview, Development). In local development, add it to `.env.local`.

### How Vercel AI Gateway handles provider auth

You authenticate once to the Vercel AI Gateway. Vercel holds the individual provider API keys on their infrastructure. Your application never touches Anthropic, OpenAI, or Google API keys directly.

Billing flows: your Vercel account is billed for gateway usage, which you recover via the VantageStarter credit system.

### Supported providers

| Provider | Enum value | Example gatewayModel |
|----------|-----------|---------------------|
| Anthropic | `anthropic` | `anthropic/claude-sonnet-4.5` |
| OpenAI | `openai` | `openai/gpt-4o` |
| Google | `google` | `google/gemini-2.5-flash` |
| xAI | `xai` | `xai/grok-4` |
| DeepSeek | `deepseek` | `deepseek/deepseek-v3.2` |
| Meta | `meta` | `meta/llama-3.1-70b` |
| Mistral | `mistral` | `mistral/codestral` |

---

## 8. Model Categories

Categories group models in the `ModelSelector` dropdown. They appear in this fixed order:

| Category | Intent |
|----------|--------|
| `flagship` | Latest, most capable models per provider |
| `balanced` | Good quality/speed/cost ratio for daily use |
| `fast` | Optimized for latency and low cost |
| `reasoning` | Extended thinking / chain-of-thought models |
| `coding` | Fine-tuned or optimized for code tasks |
| `vision` | Multimodal models with strong image understanding |

The UI (`components/chat/ModelSelector.tsx`) filters to enabled models only, groups by category in the order above, and within each category sorts by `orderPosition` ascending.

To control display order within a category, set `orderPosition` (lower = higher in the list). Models with the same position are sorted by database insertion order.

---

## 9. Pricing Fields

Pricing fields are used by the chat API route (`app/api/chat/route.ts`) to calculate the dollar cost of each conversation and log it to the `usageTracking` table.

### Token pricing

```
cost = (inputTokens * inputCostPerMillion / 1_000_000)
     + (outputTokens * outputCostPerMillion / 1_000_000)
```

Fallback rates when `inputCostPerMillion` / `outputCostPerMillion` are not set: `$3.00/M` input, `$15.00/M` output.

### Cache pricing

When `supportsCache: true`, providers offer reduced rates for prompt caching:
- `cacheReadCostPerMillion` — cost to retrieve a cached prompt prefix
- `cacheWriteCostPerMillion` — cost to store a new cache entry (Anthropic only)

The current implementation logs cost but does not yet differentiate cache vs. non-cache token costs. These fields are stored for future use when cache-aware billing is implemented.

### Web search pricing

`webSearchCostPer1K` is the cost per 1,000 web search queries when `supportsWebSearch: true`. Currently stored for reference — web search cost is not separately tracked in `usageTracking`.

### Where cost data goes

Every completed chat stream logs a record to `usageTracking` with:
- `model` — the `modelId` used
- `cost` — calculated dollar amount
- `inputTokens` / `outputTokens` — from the AI SDK usage callback
- `creditsUsed` — always 1 per message

---

## 10. Fallback System

`lib/ai/providers.ts` contains `DEFAULT_GATEWAY_MODELS` — a hardcoded map of `modelId → gatewayModel` paths.

### When it is used

The fallback map activates when the Convex `getByModelId` query fails (network error, cold start, etc.). It ensures the chat API continues working without database access.

### How model resolution works

```typescript
// lib/ai/providers.ts
export function getModelFromGateway(modelId: string, gatewayModelOverride?: string): LanguageModel {
  if (gatewayModelOverride) return gateway(gatewayModelOverride);           // 1. Convex record
  const gatewayModel = DEFAULT_GATEWAY_MODELS[modelId];
  if (gatewayModel) return gateway(gatewayModel);                          // 2. Fallback map
  return gateway(modelId);                                                  // 3. Raw ID as path
}
```

### Keeping the fallback map current

When you add a new model to Convex, add a corresponding entry to `DEFAULT_GATEWAY_MODELS` in `lib/ai/providers.ts` to ensure it works even if the database lookup fails:

```typescript
const DEFAULT_GATEWAY_MODELS: Record<string, string> = {
  // existing entries ...
  "my-new-model": "provider/model-name",
};
```

This is optional but strongly recommended for production resilience.

---

## 11. Admin Access

All write operations (`create`, `update`, `toggle`, `remove`, `setDefault`) call `requireAdmin(ctx)` internally. This checks that the authenticated Clerk user has admin role in the Convex auth context.

If you receive a "Not authorized" error when running mutations, you need to grant yourself admin access first.

See [HOW-TO-SET-ADMIN.md](HOW-TO-SET-ADMIN.md) for instructions.

The `seed` and `clearAll` mutations are internal — they bypass the auth check and are only callable from the Convex CLI or dashboard, not from the frontend.
