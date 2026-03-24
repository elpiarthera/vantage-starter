# VantageStudio → VantageStarter Feature Port — Implementation Plan

**Date**: 2026-03-24
**Author**: dev-senior-dev
**Branch**: `Day-17-app-ui-alignment` (backend) → new branch per phase
**Status**: Planning
**Priority**: P0 Critical
**Estimated Effort**: 20–26 hours
**Dependencies**: workspaces table (Done), missions system (Done)

---

## Executive Summary

### What

Port the chat session system (`chats` + `messages` tables), the project organization system (`projects` table), and the custom roles/personas/frameworks CRUD API from vantage-studio to vantage-starter. Concretely: add two new schema tables (`chats`, `projects`) and two new Convex function files (`convex/chats.ts`, `convex/projects.ts`), enhance `convex/messages.ts` with `toolCalls` support, create three new CRUD files (`convex/customRoles.ts`, `convex/customPersonas.ts`, `convex/customFrameworks.ts`), add new app routes (`/dashboard/chat/[chatId]/page.tsx`, `/dashboard/chat/page.tsx` rebuilt as list), and wire up a project selector in the chat UI.

### Why

The current `app/[locale]/dashboard/chat/page.tsx` is a single-session dead end — every page load starts a fresh context with no history. Users cannot return to previous conversations or group work into projects. The `customRoles`/`customPersonas`/`customFrameworks` schema tables exist in the target but have no API — agents reference `roleId`/`personaId`/`frameworkId` but users cannot create or edit those records through any UI.

### Impact

- **Users**: Chat sessions persist. Users can browse history, pin conversations, filter by project.
- **Revenue**: Session persistence is required for the billing credit model to be auditable (credits per chat, not per page load).
- **Architecture**: Adds the `chats` + `projects` dependency chain that unlocks artifacts, streams, and votes (P2) without introducing circular references.

### Feasibility: HIGH

80% of source code is a direct copy with a single auth adapter. No greenfield architecture required.

---

## Prerequisites

Before writing any new code, the following must be true:

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| 1 | `workspaces` table exists in `convex/schema.ts` | Done | Verified at line 348 |
| 2 | `customRoles`, `customPersonas`, `customFrameworks` schema tables exist | Done | Lines 451–511 in schema.ts |
| 3 | `convex/lib/auth.ts` exports `requireAuth` and `requireAuthWithWorkspace` | Done | Used in `missions.ts` |
| 4 | Source files readable at `/home/laurentperello/coding/vantage-studio/convex/` | Done | Audited |
| 5 | `ChatPage` component exists at `components/chat/ChatPage` | Done | Imported in current chat/page.tsx |

**Pre-build blockers** — fix before starting Phase 1:

| # | Issue | Fix |
|---|-------|-----|
| 1 | `schema.ts` `chatMessages` table uses `organizationId`/`projectId` as `v.string()` — this is the old generic table, not the new chat session model. The new `chats` table uses `v.id("workspaces")`. Do NOT delete `chatMessages` — it's used by existing chat UI. Add `chats` and `messages` as separate tables. | Add new tables alongside existing ones |
| 2 | Source `chats.ts` uses `by_workspace_created` index on `chats` table — must declare this as a composite index `["workspaceId", "createdAt"]` in schema, not just `by_workspace`. | Add composite index in schema Task 1.1 |
| 3 | Source `messages.ts` `deleteAfterTimestamp` references `votes` table — vantage-starter has no `votes` table. Strip the votes cleanup block from the ported version (deferred to P2). | Remove 10-line votes block in Task 4.1 |
| 4 | Source `chats.ts` `remove` mutation references `messages` table by index `by_chat` — must ensure `messages` table has `by_chat` index in schema. | Declare in schema Task 1.1 |
| 5 | **BLOCKER** — starter's `users` table has no `activeWorkspaceId` field (confirmed `convex/schema.ts` lines 51–90). Any ported function calling `user.activeWorkspaceId` will silently return `undefined` at runtime. Fix: replace ALL `user.activeWorkspaceId` lookups with workspace resolution via `by_owner_and_default` index: `await ctx.db.query('workspaces').withIndex('by_owner_and_default', q => q.eq('ownerId', user.clerkUserId).eq('isDefault', true)).unique()`. This applies to `customRoles.ts`, `customPersonas.ts`, `customFrameworks.ts`, and any helper that resolves the active workspace. Tasks 1.2, 1.3, and 3.1–3.3 must each apply this pattern — see per-task notes below. | Apply `by_owner_and_default` resolution in every function that needs the active workspace |

---

## Out of Scope

- **Artifacts, streams, votes tables** — deferred to post-MVP (P2). Source files exist in vantage-studio but depend on `chats` being stable first.
- **Timeline/wizard UI** (6 components: `mission-timeline.tsx`, `timeline-bar.tsx`, etc.) — deferred to P2.
- **`convex/seed.ts` system data** for roles/personas/frameworks — separate task, not blocking CRUD API.
- **Chat UI redesign** — Phase 2 only adds routing shell. Full redesign routes to `dev-frontend`.
- **Project management UI** — creating/editing projects from UI is out of scope. API only.

---

## Architecture

### Current State

`app/[locale]/dashboard/chat/page.tsx` renders `<ChatPage />` directly. `ChatPage` is a stateless component — no `chatId` in the URL, no Convex persistence of the session container. Messages may be stored in `chatMessages` but there is no parent `chats` row scoping them.

The `customRoles`, `customPersonas`, `customFrameworks` tables exist in schema but have zero corresponding `.ts` files in `convex/`. Any mutation against those tables is currently impossible.

### Proposed Architecture

```
convex/schema.ts
  + chats table (workspaceId, projectId, createdBy, visibility, selectedModel, ...)
  + projects table (workspaceId, createdBy, name, icon, color, isArchived, taskCount, ...)
  + messages table (chatId, role, content, parts, attachments, toolCalls, createdAt)

convex/chats.ts        ← port from vantage-studio (397 LOC)
convex/projects.ts     ← port from vantage-studio (233 LOC)
convex/messages.ts     ← port from vantage-studio (332 LOC, strip votes block)
convex/customRoles.ts      ← port from vantage-studio (178 LOC)
convex/customPersonas.ts   ← port from vantage-studio (185 LOC)
convex/customFrameworks.ts ← port from vantage-studio (183 LOC)

app/[locale]/dashboard/chat/page.tsx          ← REPLACE: becomes chat list
app/[locale]/dashboard/chat/[chatId]/page.tsx ← CREATE: session view (wraps ChatPage)
```

### Key Decisions

| Decision | Choice | Rejected alternatives |
|----------|--------|----------------------|
| Auth field name | `clerkUserId` (starter pattern) | `clerkId` (studio pattern) — rejected to match existing `missions.ts:11` |
| Index lookup | `by_clerk_user_id` | `by_clerk_id` — rejected, does not exist in starter's `users` table |
| `chatMessages` table | Keep as-is | Delete and replace — rejected, breaks existing chat UI until Phase 2 is complete |
| `messages` table | Port as separate table from `chatMessages` | Merge into `chatMessages` — rejected, schema conflict on required fields |
| Project scoping in missions | Add `projectId` to `missions` table | Leave out — rejected as pre-mature; keep `missions.ts` comment "projectId post-MVP" |

---

## Locked Decisions (non-negotiable)

| Decision | Choice | Rejected alternatives |
|----------|--------|----------------------|
| Auth pattern | `by_clerk_user_id` index, `clerkUserId` field | `clerkId` / `by_clerk_id` — studio pattern, does not exist in starter schema |
| Status enums | Keep starter's enums (missions: pending/executing/awaiting_checkpoint/completed/failed) | Studio's brainstorm/plan/execute/validate/complete — already ported differently |
| Workspace scoping | All new tables use `workspaceId: v.id("workspaces")` | organizationId — wrong scope level for chat sessions |
| `chatMessages` preservation | Do NOT touch chatMessages table or its functions | Migrate existing rows — out of scope, no user data in production yet |
| `votes` table | Excluded from messages port | Include — deferred to P2 |
| Auth call mandatory | Every exported `query` and `mutation` MUST call `requireAuth()` or `requireAuthWithWorkspace()` as its first statement — no exceptions. This is the pattern established in `convex/missions.ts` and is the security baseline for all ported functions. | Inline identity checks — inconsistent, easier to miss |
| `v.any()` banned in new schema | `v.any()` is BANNED in new schema definitions. All fields must use typed validators. Exception: AI SDK response fields (`parts`, `toolCalls.args`, `toolCalls.result`) where the shape is controlled by the provider or the user's tool registry — these MUST carry an inline comment explaining why, and a `// TODO Phase 5: typed validators planned` note. No silent `v.any()` without justification. | Untyped fields silently accept corrupt data at write time, causing runtime errors at read time — impossible to catch without typed validators |
| Typography | Geist (sans) + Geist Mono (mono) as defined in `DESIGN-SYSTEM.md`. References to Space Grotesk / Inter in `CLAUDE.md` are outdated and must be ignored. `DESIGN-SYSTEM.md` is the single source of truth for typography. | Space Grotesk / Inter — referenced in CLAUDE.md but superseded |

---

## Port vs Build Map

| Component | Source | Action |
|-----------|--------|--------|
| `convex/chats.ts` | EXISTS — 397 LOC, 11 functions | PORT + auth adapter |
| `convex/projects.ts` | EXISTS — 233 LOC, 6 functions | PORT + auth adapter |
| `convex/messages.ts` | EXISTS — 332 LOC, 9 functions | PORT + auth adapter + strip votes |
| `convex/customRoles.ts` | EXISTS — 178 LOC, 5 functions | PORT as-is (auth already matches) |
| `convex/customPersonas.ts` | EXISTS — 185 LOC, 5 functions | PORT as-is |
| `convex/customFrameworks.ts` | EXISTS — 183 LOC, 5 functions | PORT as-is |
| `convex/schema.ts` (`chats`, `projects`, `messages` tables) | MISSING | ADD to existing schema |
| `app/[locale]/dashboard/chat/page.tsx` | EXISTS — single session | REPLACE with chat list |
| `app/[locale]/dashboard/chat/[chatId]/page.tsx` | MISSING | BUILD (thin shell) |

---

## Implementation Phases

> **Briefing discipline**: Write each task's Problem, Fix, and Acceptance Criteria in full before delegating. Do not patch iteratively — a comprehensive brief sent once beats three rounds of back-and-forth corrections.

---

### Phase 1 — Convex Backend: Schema + Functions (Complexity: L)

**Goal**: All new tables deployed and all Convex functions verified via `npx convex dev`.
**Prerequisite**: None — can start immediately.

#### Tasks

---

##### Task 1.1 — Add `chats`, `projects`, `messages` tables to schema.ts

**Priority**: P0
**Files**: `convex/schema.ts`
**Estimated**: 1.5 hours

**Problem / Context**:
`schema.ts` has no `chats`, `projects`, or `messages` tables. The existing `chatMessages` table (table 4, line 113) is a different shape — it uses `organizationId` + `projectId` as strings, not a parent chat row with `workspaceId`. New tables must be added without modifying existing ones.

**Fix / Implementation**:
Append three new table definitions after table 25 (`architectMessages`, line 744). Each table definition below is the exact schema to use:

```typescript
// 26. Chats Table
chats: defineTable({
  title: v.string(),
  workspaceId: v.id("workspaces"),
  projectId: v.optional(v.id("projects")),
  createdBy: v.string(), // Clerk user ID
  visibility: v.optional(
    v.union(v.literal("private"), v.literal("workspace")),
  ),
  isPinned: v.optional(v.boolean()),
  enabledToolkits: v.optional(
    v.array(
      v.object({
        slug: v.string(),
        isConnected: v.boolean(),
      }),
    ),
  ),
  selectedModel: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_workspace", ["workspaceId"])
  .index("by_workspace_created", ["workspaceId", "createdAt"])
  .index("by_project", ["projectId"])
  .index("by_creator", ["createdBy"]),

// 27. Projects Table
projects: defineTable({
  name: v.string(),
  description: v.optional(v.string()),
  icon: v.optional(v.string()),
  color: v.optional(v.string()),
  workspaceId: v.id("workspaces"),
  createdBy: v.string(), // Clerk user ID
  settings: v.optional(v.object({
    defaultView: v.optional(v.union(v.literal("board"), v.literal("list"), v.literal("timeline"))),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
  })),
  orderPosition: v.optional(v.number()),
  isArchived: v.optional(v.boolean()),
  taskCount: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_workspace", ["workspaceId"])
  .index("by_creator", ["createdBy"]),

// 28. Messages Table
// Distinct from chatMessages (table 4) — parent-scoped by chats._id
messages: defineTable({
  chatId: v.id("chats"),
  role: v.union(
    v.literal("user"),
    v.literal("assistant"),
  ),
  content: v.string(),
  // v.any() justified: AI SDK v6 `parts` shape is provider-controlled (text/tool-call/tool-result
  // union). Typed validators planned for Phase 5 once the shape is stable across providers.
  // TODO Phase 5: replace with v.union(v.object({type: v.literal("text"), ...}), ...)
  parts: v.optional(v.any()),
  // v.any() justified: attachment metadata (file URLs, mime types) comes from Convex file storage
  // response whose shape may vary. Typed validators planned for Phase 5.
  // TODO Phase 5: type as v.object({ url: v.string(), name: v.string(), mimeType: v.string() })
  attachments: v.optional(v.any()),
  toolCalls: v.optional(
    v.array(
      v.object({
        id: v.string(),
        toolName: v.string(),
        // v.any() justified: tool args are user-defined JSON schemas — shape is controlled by the
        // tool definition, not by Convex. Cannot type-check without generating validators per tool.
        // TODO Phase 5: generate per-tool validators from the tool registry.
        args: v.any(),
        // v.any() justified: tool results are user-defined — same reasoning as args above.
        // TODO Phase 5: generate per-tool result validators from the tool registry.
        result: v.optional(v.any()),
        status: v.union(
          v.literal("pending"),
          v.literal("success"),
          v.literal("error"),
        ),
      }),
    ),
  ),
  createdAt: v.number(),
})
  .index("by_chat", ["chatId"])
  .index("by_chat_created", ["chatId", "createdAt"]),
```

**Acceptance criteria**:
- [ ] `npx convex dev --once` exits 0 — schema deployed with no errors
- [ ] Convex dashboard shows `chats`, `projects`, `messages` tables
- [ ] Existing `chatMessages` table unchanged (row count same)
- [ ] `npx tsc --noEmit` exits 0

**Visual verification**:
Open Convex dashboard → Data tab → verify `chats`, `projects`, `messages` appear in table list alongside `chatMessages`.

**QA**:
```bash
npx convex dev --once
npx tsc --noEmit
npx biome check --write convex/schema.ts
```

---

##### Task 1.2 — Port `convex/chats.ts` (11 functions)

**Priority**: P0
**Files**: `convex/chats.ts` (CREATE)
**Estimated**: 2 hours
**Depends on**: Task 1.1

**Problem / Context**:
No `convex/chats.ts` exists in vantage-starter. Source is at `/home/laurentperello/coding/vantage-studio/convex/chats.ts` (397 LOC).

Functions to port (11 total):
- Queries (5): `list`, `getForCurrentWorkspace` (deprecated, include), `getByWorkspace`, `getById`, `listRecent`, `listByProject`
- Mutations (5): `create`, `update`, `updateSelectedModel`, `updateEnabledToolkits`, `remove`

Note: source file has 6 queries (list, getForCurrentWorkspace, getByWorkspace, getById, listRecent, listByProject) and 5 mutations = 11 total exported functions.

**Fix / Implementation**:
1. Read source: `/home/laurentperello/coding/vantage-studio/convex/chats.ts`
2. Create `convex/chats.ts` in vantage-starter
3. Apply auth adapter throughout:
   - `by_clerk_id` → `by_clerk_user_id`
   - `clerkId` → `clerkUserId` (field name in users table)
4. Replace `checkWorkspaceAccess` import (from studio's `./lib/workspace`) with vantage-starter's equivalent — check `convex/lib/auth.ts` for the correct helper. If no equivalent exists, inline the workspace membership check.
5. In `remove` mutation: strip the `messages` cascade delete — it references `messages` table by `by_chat` index which is correct, keep it.
6. `create` mutation: `createdBy` stores `user._id` in studio, but vantage-starter pattern (see `missions.ts:line 1-13`) uses `clerkUserId` string. Use `identity.subject` directly as `createdBy`.
   - **H5 — Workspace ownership verification**: before inserting, add: `const ws = await ctx.db.get(args.workspaceId); if (!ws || ws.ownerId !== identity.subject) throw new Error('unauthorized');`. This prevents a user from creating chats in another user's workspace.
7. `getById` query: **B2 — BLOCKER — no access control**. Must add workspace ownership check after fetching the chat: `const ws = await ctx.db.get(chat.workspaceId); if (!ws || ws.ownerId !== identity.subject) throw new Error('unauthorized');`. Without this, any authenticated user can read any chat by ID.
8. **H4 — Ownership field in mutations**: ALL mutations that check ownership (`remove`, `update`, `updateSelectedModel`, `updateEnabledToolkits`) MUST compare `chat.createdBy !== identity.subject` (a Clerk user ID string). Do NOT compare against `user._id` (a Convex document ID). `createdBy` is stored as a Clerk user ID string — mismatching types will silently allow or deny access incorrectly. Flag each of these four mutations with a `// OWNERSHIP CHECK: createdBy is Clerk user ID, compare against identity.subject` comment.
9. **Workspace resolution (Pre-build blocker #5)**: if any function in this file needs the user's active workspace and does not receive `workspaceId` as an arg, resolve it via: `await ctx.db.query('workspaces').withIndex('by_owner_and_default', q => q.eq('ownerId', identity.subject).eq('isDefault', true)).unique()`. Do NOT access `user.activeWorkspaceId` — field does not exist in starter's schema.

**Acceptance criteria**:
- [ ] File created at `convex/chats.ts`
- [ ] All 11 functions exported
- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx convex dev --once` exits 0
- [ ] Calling `api.chats.list` from Convex dashboard returns `{ chats: [], hasMore: false }` for authenticated user

**Visual verification**:
Convex dashboard → Functions tab → verify `chats` module appears with 11 functions listed.

**QA**:
```bash
npx tsc --noEmit
npx biome check --write convex/chats.ts
npx convex dev --once
```

---

##### Task 1.3 — Port `convex/projects.ts` (6 functions)

**Priority**: P0
**Files**: `convex/projects.ts` (CREATE)
**Estimated**: 1 hour
**Depends on**: Task 1.1

**Problem / Context**:
No `convex/projects.ts` exists in vantage-starter. Source is at `/home/laurentperello/coding/vantage-studio/convex/projects.ts` (233 LOC).

Functions to port (6 total):
- Queries (2): `list`, `get`
- Mutations (4): `create`, `update`, `archive`, `assignTask`

**Fix / Implementation**:
1. Read source: `/home/laurentperello/coding/vantage-studio/convex/projects.ts`
2. Create `convex/projects.ts` in vantage-starter
3. Apply auth adapter (same pattern as Task 1.2): `by_clerk_id` → `by_clerk_user_id`, `clerkId` → `clerkUserId`
4. `create` mutation: `createdBy` should be `identity.subject` (Clerk user ID string), not `user._id`
5. `assignTask` mutation: **H9** — use `requireAuthWithWorkspace(ctx, project.workspaceId)` for authorization, not a raw `identity.subject` comparison. This ensures workspace access is validated consistently via the standard helper.
6. `update` mutation: **H7** — add ownership check before patching: `if (project.createdBy !== identity.subject) throw new Error('unauthorized');`. Do NOT skip this — source may omit it.
7. `archive` mutation: **H7** — same as `update`: add `if (project.createdBy !== identity.subject) throw new Error('unauthorized');` before patching.
8. **Workspace resolution (Pre-build blocker #5)**: if any function resolves the active workspace without a `workspaceId` arg, use: `await ctx.db.query('workspaces').withIndex('by_owner_and_default', q => q.eq('ownerId', identity.subject).eq('isDefault', true)).unique()`. Do NOT read `user.activeWorkspaceId`.
9. No other import changes needed beyond the auth adapter.
10. **S2 — `projects.get` access control**: after fetching the project, verify workspace ownership: `const ws = await ctx.db.get(project.workspaceId); if (!ws || ws.ownerId !== identity.subject) throw new Error('unauthorized');`. Same pattern as `chats.getById` (B2) — without this, any authenticated user can read any project by ID.

**Acceptance criteria**:
- [ ] File created at `convex/projects.ts`
- [ ] All 6 functions exported
- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx convex dev --once` exits 0

**Visual verification**:
Convex dashboard → Functions tab → verify `projects` module with 6 functions.

**QA**:
```bash
npx tsc --noEmit
npx biome check --write convex/projects.ts
npx convex dev --once
```

---

##### Task 1.4 — Port `convex/messages.ts` (9 functions, strip votes)

**Priority**: P0
**Files**: `convex/messages.ts` (CREATE)
**Estimated**: 1.5 hours
**Depends on**: Task 1.1, Task 1.2

**Problem / Context**:
No `convex/messages.ts` exists in vantage-starter (only `chatMessages` via existing functions). Source is at `/home/laurentperello/coding/vantage-studio/convex/messages.ts` (332 LOC).

Functions to port (9 total):
- Queries (2): `list`, `getById`
- Mutations (3): `save`, `update`, `deleteAfterTimestamp`
- Internal mutations (3): `saveSystem`, `createChatSystem`, `getOrCreateChatSystem`

**Fix / Implementation**:
1. Read source: `/home/laurentperello/coding/vantage-studio/convex/messages.ts`
2. Create `convex/messages.ts` in vantage-starter
3. Apply auth adapter: `by_clerk_id` → `by_clerk_user_id`
4. In `deleteAfterTimestamp` (source lines 182–241): remove the votes cascade block (lines 228–233 in source — the `votes` query and delete loop). Keep only the message delete loop.
5. Workspace membership check in `list` and `save` uses `workspaceMembers` table — vantage-starter has no `workspaceMembers` table. Replace with: check `workspace.ownerId === identity.subject` only (single-owner workspace for MVP). Add a `// TODO: add member check when workspaceMembers table is added` comment.
6. Internal mutations import `internalMutation` from `./_generated/server` — verify this import works (it does — used in `missions.ts`).
7. `getById` query: **B3 — BLOCKER — no access control**. After fetching the message, resolve the ownership chain: `const chat = await ctx.db.get(message.chatId); const ws = await ctx.db.get(chat.workspaceId); if (!ws || ws.ownerId !== identity.subject) throw new Error('unauthorized');`. Without this, any authenticated user can fetch any message by ID.
8. `update` mutation: **H6** — add ownership check before patching. Resolve: `const chat = await ctx.db.get(message.chatId); if (chat.createdBy !== identity.subject) throw new Error('unauthorized');`. Source likely omits this — it must be added explicitly.

**Acceptance criteria**:
- [ ] File created at `convex/messages.ts`
- [ ] All 9 functions exported
- [ ] No `votes` table references remain
- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx convex dev --once` exits 0

**Visual verification**:
Convex dashboard → Functions tab → verify `messages` module with 9 functions (separate from `chatMessages` functions).

**QA**:
```bash
npx tsc --noEmit
npx biome check --write convex/messages.ts
npx convex dev --once
```

---

##### Task 1.5 — Add rate limiting to all write mutations

**Priority**: P0
**Files**: `convex/chats.ts`, `convex/messages.ts`, `convex/projects.ts`, `convex/customRoles.ts`, `convex/customPersonas.ts`, `convex/customFrameworks.ts`
**Estimated**: 1.5 hours
**Depends on**: Tasks 1.2, 1.3, 1.4, 3.1, 3.2, 3.3

**Problem / Context**:
Without rate limiting, a single authenticated user can exhaust billing credits programmatically via `messages.save`. There is no throttle on `chats.create`, `projects.create`, or the custom entity create mutations — all are callable in a tight loop. This is mandatory before production deployment.

**Fix / Implementation**:
1. Check `package.json` for `@convex-dev/ratelimiter`. If not present, add the install step: `npm install @convex-dev/ratelimiter`.
2. Create `convex/ratelimit.ts` to initialize the rate limiter component (follow `@convex-dev/ratelimiter` docs — instantiate once and export).
3. Apply rate limits to the following mutations. Use `identity.subject` (Clerk user ID) as the rate limit key. Rate limit errors must throw with a clear message (e.g., `"Rate limit exceeded. Try again in X seconds."`) — this is the 429-equivalent in Convex mutations.

| Mutation | Limit | Reasoning |
|----------|-------|-----------|
| `chats.create` | 10 per minute per user | Prevents spam session creation |
| `messages.save` | 30 per minute per user | Prevents programmatic AI credit drain |
| `projects.create` | 5 per minute per user | Low-frequency operation — tight limit appropriate |
| `customRoles.create` | 10 per minute per user | Standard CRUD limit |
| `customPersonas.create` | 10 per minute per user | Standard CRUD limit |
| `customFrameworks.create` | 10 per minute per user | Standard CRUD limit |
| `messages.update` | 60 per minute per user | Prevents spam edits to message content |

4. Pattern for each mutation (after the `requireAuth()` call):
```typescript
const { ok, retryAfter } = await rateLimiter.limit(ctx, "mutationName", { key: identity.subject });
if (!ok) throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(retryAfter / 1000)} seconds.`);
```

5. Internal mutations (`saveSystem`, `createChatSystem`, `getOrCreateChatSystem`) are exempt — they are called by trusted server-side actions only, not by clients.

**Acceptance criteria**:
- [ ] `@convex-dev/ratelimiter` present in `package.json` (or install step documented)
- [ ] `convex/ratelimit.ts` created with rate limiter instance
- [ ] All 6 create mutations listed above have rate limit checks after `requireAuth()`
- [ ] Rate limit error message is human-readable (not a generic internal error)
- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx convex dev --once` exits 0

**Visual verification**:
Call `api.chats.create` 11 times in rapid succession from the Convex dashboard function runner. The 11th call should throw with the rate limit message.

**QA**:
```bash
npm install @convex-dev/ratelimiter  # if not already installed
npx tsc --noEmit
npx biome check --write convex/ratelimit.ts convex/chats.ts convex/messages.ts convex/projects.ts convex/customRoles.ts convex/customPersonas.ts convex/customFrameworks.ts
npx convex dev --once
```

---

##### Task 1.6 — Verify full Phase 1 schema deployment

**Priority**: P0
**Files**: none (verification only)
**Estimated**: 0.5 hours
**Depends on**: Tasks 1.1–1.5

**Problem / Context**:
Need to confirm all 3 new tables and 26 new functions deploy cleanly together before Phase 2 begins.

**Fix / Implementation**:
Run full QA sequence and smoke-test via Convex dashboard function runner.

**Acceptance criteria**:
- [ ] `npx convex dev --once` exits 0 with all 3 new tables
- [ ] `npx tsc --noEmit` exits 0
- [ ] `api.chats.create` callable from dashboard with test args
- [ ] `api.projects.create` callable from dashboard with test args
- [ ] `api.messages.list` callable from dashboard with a fake chatId returns `[]`

**Visual verification**:
Convex dashboard → Data → confirm `chats`, `projects`, `messages` tables exist. Functions → confirm `chats`, `projects`, `messages` modules all appear.

**QA**:
```bash
npx convex dev --once
npx tsc --noEmit
npx biome check .
```

---

##### Task 1.7 — Audit Logging for Destructive Operations

**Priority**: P0
**Files**: `convex/chats.ts`, `convex/projects.ts`
**Estimated**: 0.5 hours
**Depends on**: Tasks 1.2, 1.3

**Problem / Context**:
**S5** — Destructive operations (`chats.remove`, `projects.archive`) leave no trace in any log. Without an audit trail, there is no way to investigate credit disputes, accidental deletions, or abuse patterns after the fact. This is unacceptable for a billing-auditable SaaS boilerplate.

**Fix / Implementation**:
1. Verify the `activities` table exists in `convex/schema.ts` before starting — grep for `activities: defineTable`. If it does not exist, add it to Task 1.1 schema work and reopen that task.
2. In `convex/chats.ts`, `remove` mutation: before calling `ctx.db.delete`, count the messages being cascade-deleted, then insert an activity record:
```typescript
await ctx.db.insert("activities", {
  organizationId: workspace.organizationId,
  userId: identity.subject,
  type: "chat_deleted",
  title: chat.title,
  description: `Chat deleted (${messageCount} messages)`,
  metadata: { chatId: args.id, messageCount },
  createdAt: Date.now(),
});
```
3. In `convex/projects.ts`, `archive` mutation: before patching `isArchived: true`, insert an activity record:
```typescript
await ctx.db.insert("activities", {
  organizationId: workspace.organizationId,
  userId: identity.subject,
  type: "project_archived",
  title: project.name,
  description: "Project archived",
  metadata: { projectId: args.id },
  createdAt: Date.now(),
});
```
4. The activity insert must happen before the destructive operation — if the delete or archive fails, the activity record is rolled back atomically (Convex mutations are transactional).

**Acceptance criteria**:
- [ ] `activities` table exists in schema (verify before starting)
- [ ] `chats.remove` inserts an activity row before deleting
- [ ] `projects.archive` inserts an activity row before patching
- [ ] `npx tsc --noEmit` exits 0
- [ ] Manual smoke test: delete a chat → verify activity row appears in Convex dashboard Data → activities

**Visual verification**:
Convex dashboard → Data → activities → verify a row with `type: "chat_deleted"` appears after calling `api.chats.remove`.

**QA**:
```bash
npx tsc --noEmit
npx biome check --write convex/chats.ts convex/projects.ts
npx convex dev --once
```

---

#### Phase 1 — Files Summary

| Action | File | Lines changed (est.) |
|--------|------|----------------------|
| MODIFY | `convex/schema.ts` | +80 lines |
| CREATE | `convex/chats.ts` | ~370 lines |
| CREATE | `convex/projects.ts` | ~210 lines |
| CREATE | `convex/messages.ts` | ~290 lines |
| CREATE | `convex/ratelimit.ts` | ~20 lines |
| MODIFY | `convex/chats.ts` (Task 1.7) | +10 lines (audit insert in remove) |
| MODIFY | `convex/projects.ts` (Task 1.7) | +10 lines (audit insert in archive) |

---

### Phase 2 — Chat List UI (Complexity: M)

**Goal**: Users can navigate to `/dashboard/chat` and see their chat history, click into sessions, and create new chats.
**Prerequisite**: Phase 1 complete (`chats` and `messages` tables deployed).

#### Tasks

---

##### Task 2.0 — Add i18n keys for chat feature

**Priority**: P0
**Files**: `messages/en.json`, `messages/fr.json`
**Estimated**: 0.5 hours
**Depends on**: None — must be done before any Phase 2 UI task

**Problem / Context**:
**H11** — No i18n keys exist for the chat feature. All UI strings must go through `useTranslations()`. Adding them before the UI tasks prevents the frontend agent from hardcoding strings.

**Fix / Implementation**:
Add the following keys to both `messages/en.json` and `messages/fr.json` under a `"chat"` namespace:

| Key | English value |
|-----|--------------|
| `chat.title` | `"Chats"` |
| `chat.newChat` | `"New chat"` |
| `chat.noChats` | `"No chats yet. Start a new conversation."` |
| `chat.searchPlaceholder` | `"Search chats..."` |
| `chat.allProjects` | `"All projects"` |
| `chat.filterByProject` | `"Filter by project"` |
| `chat.pinned` | `"Pinned"` |
| `chat.delete` | `"Delete"` |
| `chat.rename` | `"Rename"` |
| `chat.confirmDelete` | `"Delete this chat? This cannot be undone."` |

Translate each key into French for `messages/fr.json`.

**Acceptance criteria**:
- [ ] All 10 keys present in `messages/en.json` under `chat` namespace
- [ ] All 10 keys present in `messages/fr.json` under `chat` namespace
- [ ] `pnpm i18n:verify` exits 0 (if script exists)

---

##### Task 2.1 — Rebuild `app/[locale]/dashboard/chat/page.tsx` as chat list

**Priority**: P0
**Files**: `app/[locale]/dashboard/chat/page.tsx`
**Estimated**: 2 hours
**Depends on**: Task 1.2 (chats.ts deployed)

**Problem / Context**:
Current `app/[locale]/dashboard/chat/page.tsx` (3 lines) renders `<ChatPage />` directly — no session management, no history. Must become a chat list page that: (1) queries `api.chats.list`, (2) renders a list of recent chats, (3) provides a "New chat" button that calls `api.chats.create` and navigates to `/dashboard/chat/[chatId]`.

**Fix / Implementation**:
Route to `dev-frontend` with this brief:

```
TASK: Replace app/[locale]/dashboard/chat/page.tsx with a chat list page.
FILE: app/[locale]/dashboard/chat/page.tsx

WHAT TO DO:
- Mark "use client" (needs useQuery and useRouter)
- Import useQuery from "convex/react", api from "@/convex/_generated/api"
- Call: const { chats, hasMore } = useQuery(api.chats.list, { limit: 30 }) ?? { chats: [], hasMore: false }
- Render a list of chat rows: title, createdAt (formatted), isPinned badge
- Each row links to /dashboard/chat/[chat._id]
- "New chat" button at top: calls useMutation(api.chats.create) then router.push to new chatId
- For create args: workspaceId must come from user's active workspace — query api.workspaces.getDefault or pass via context
- Empty state: "No chats yet. Start a new conversation."
- Loading state: skeleton rows

CONSTRAINTS:
- No shadcn/ui. No lucide-react. Inline SVGs only.
- OKLCH tokens only (no gray-*, no hex).
- i18n: all strings via useTranslations().
- lit-ui components for any form elements.
```

**Acceptance criteria**:
- [ ] Page renders chat list (empty state if no chats)
- [ ] "New chat" creates a row in `chats` table (verify in Convex dashboard)
- [ ] Clicking a chat row navigates to `/dashboard/chat/[chatId]` (404 until Task 2.2)
- [ ] `npx tsc --noEmit` exits 0

**Visual verification**:
Open `/dashboard/chat` in browser — see list or empty state. Click "New chat" — Convex dashboard shows new row in `chats` table with correct `workspaceId`.

---

##### Task 2.2 — Create `app/[locale]/dashboard/chat/[chatId]/page.tsx` (session shell)

**Priority**: P0
**Files**: `app/[locale]/dashboard/chat/[chatId]/page.tsx` (CREATE)
**Estimated**: 1.5 hours
**Depends on**: Task 2.1

**Problem / Context**:
No `[chatId]` segment exists. When user navigates to a specific chat, need a page that: (1) reads `chatId` from params, (2) passes it to the chat interface component, (3) loads existing messages from `api.messages.list`.

**Fix / Implementation**:
Route to `dev-frontend`:

```
TASK: Create app/[locale]/dashboard/chat/[chatId]/page.tsx
FILE: app/[locale]/dashboard/chat/[chatId]/page.tsx (CREATE)

WHAT TO DO:
- This is a Server Component wrapper
- Props: `{ params: Promise<{ chatId: string; locale: string }> }` — **H10 — Next.js 15**: `params` is a Promise, not a plain object. Use `const { chatId } = await params;` before accessing any param field. Direct destructure (`{ params: { chatId } }`) is a runtime error in Next.js 15.
- Import ChatPage from "@/components/chat/ChatPage"
- Pass chatId as prop: `<ChatPage chatId={chatId} />`
- Add metadata generation: fetch chat title from Convex for the page title

CONSTRAINTS:
- Server Component (no "use client")
- ChatPage must accept an optional chatId prop — you will need to check if ChatPage's
  interface accepts it; if not, document that as a follow-up for Task 2.3.
```

**Acceptance criteria**:
- [ ] Route `/dashboard/chat/abc123` renders without 404
- [ ] `chatId` prop is passed through to ChatPage
- [ ] `npx tsc --noEmit` exits 0

**Visual verification**:
Navigate to `/dashboard/chat/[any-valid-id]` — page renders (even if ChatPage ignores chatId for now).

---

##### Task 2.3 — Wire `ChatPage` to accept `chatId` prop

**Priority**: P1
**Files**: `components/chat/ChatPage.tsx` (or wherever ChatPage is defined — read first)
**Estimated**: 2 hours
**Depends on**: Task 2.2

**Problem / Context**:
The existing `ChatPage` component likely creates its own ephemeral session or uses no session at all. It needs to accept an optional `chatId?: string` prop. When `chatId` is provided: load messages via `api.messages.list`, save new messages to `api.messages.save`, update `chat.updatedAt` on each message. When no `chatId`: behave as currently (stateless, or redirect to list).

**Fix / Implementation**:
Route to `dev-frontend` after reading `components/chat/ChatPage.tsx`. Brief must include the exact current component signature and the exact fields from `api.messages.save` and `api.messages.list`.

**Acceptance criteria**:
- [ ] `<ChatPage chatId="some-id" />` loads existing messages on mount
- [ ] New messages are saved to `messages` table (verify via Convex dashboard)
- [ ] `npx tsc --noEmit` exits 0
- [ ] No regression: existing stateless usage still works if `chatId` omitted

**Visual verification**:
Send a message in a chat session. Refresh the page. Message history persists.

---

##### Task 2.4 — Add project selector/filter to chat list

**Priority**: P1
**Files**: `app/[locale]/dashboard/chat/page.tsx`
**Estimated**: 1.5 hours
**Depends on**: Task 1.3 (projects.ts), Task 2.1

**Problem / Context**:
Chat list needs a project filter. When a project is selected, show only chats in that project via `api.chats.listByProject`.

**Fix / Implementation**:
Route to `dev-frontend`. Add a project selector dropdown at top of chat list page. Use `useQuery(api.projects.list)` to populate options. When selection changes, swap between `api.chats.list` and `api.chats.listByProject`. Use `lui-select` component (load `.claude/skills/lit-ui/select.md` first).

**Acceptance criteria**:
- [ ] Project dropdown renders with projects from `api.projects.list`
- [ ] Selecting a project filters the chat list
- [ ] "All projects" option shows unfiltered list
- [ ] `npx tsc --noEmit` exits 0

**Visual verification**:
Create a project via Convex dashboard. Open `/dashboard/chat`. Project appears in dropdown. Filtering works.

---

#### Phase 2 — Files Summary

| Action | File | Lines changed (est.) |
|--------|------|----------------------|
| MODIFY | `app/[locale]/dashboard/chat/page.tsx` | ~120 lines (full replace) |
| CREATE | `app/[locale]/dashboard/chat/[chatId]/page.tsx` | ~25 lines |
| MODIFY | `components/chat/ChatPage.tsx` | +20–40 lines |

---

### Phase 3 — Custom Roles / Personas / Frameworks API (Complexity: M)

**Goal**: Users and agents can CRUD custom roles, personas, and frameworks via Convex functions.
**Prerequisite**: Phase 1 complete (schema verified). Phase 2 not required — this is purely backend.

#### Tasks

---

##### Task 3.1 — Create `convex/customRoles.ts` (5 functions)

**Priority**: P1
**Files**: `convex/customRoles.ts` (CREATE)
**Estimated**: 1 hour
**Depends on**: Task 1.5 (schema verified)

**Problem / Context**:
`customRoles` table exists in schema (line 451) but no `convex/customRoles.ts` file exists. Agents that reference `roleId` cannot be created or edited. Source: `/home/laurentperello/coding/vantage-studio/convex/customRoles.ts` (178 LOC).

Functions to port (5):
- Queries (2): `list`, `get`
- Mutations (3): `create`, `update`, `remove`

**Fix / Implementation**:
1. Read source: `/home/laurentperello/coding/vantage-studio/convex/customRoles.ts`
2. Source uses a `getUserAndWorkspace` helper (lines 9–25) that resolves `user.activeWorkspaceId` — vantage-starter users have no `activeWorkspaceId` field. Replace helper body: use `requireAuthWithWorkspace` from `convex/lib/auth.ts` instead, passing the workspace from query args, OR resolve workspace via `workspaces.getDefault`. The simplest adapter: keep the helper pattern but look up workspace using `by_owner_and_default` index.
3. `createdBy` field: store `identity.subject` (Clerk user ID) — matches starter convention.
4. System roles check: source queries `by_system` index — this index exists in starter schema (line 467).
5. **S3 — `customRoles.get` cross-workspace read**: after fetching the entity, if `!entity.isSystem`, verify workspace ownership: resolve `entity.workspaceId` → workspace → assert `ws.ownerId === identity.subject`. System entities (`isSystem: true`) are readable by all authenticated users; user-created entities are workspace-scoped.
6. **S1 — `customRoles.remove` ownership guard**: before deleting, verify ownership: `if (!entity.isSystem && entity.createdBy !== identity.subject) throw new Error('unauthorized')`. System entities (`isSystem: true`) cannot be deleted by non-admins — throw `new Error('unauthorized')` for any attempt to delete a system entity regardless of caller identity.

**Acceptance criteria**:
- [ ] File created at `convex/customRoles.ts`
- [ ] All 5 functions exported
- [ ] `api.customRoles.list` returns system roles when called
- [ ] `api.customRoles.create` inserts a row (verify in Convex dashboard)
- [ ] `npx tsc --noEmit` exits 0

**Visual verification**:
Convex dashboard → Functions → `customRoles` module shows 5 functions. Run `list` — returns any seeded system roles.

**QA**:
```bash
npx tsc --noEmit
npx biome check --write convex/customRoles.ts
npx convex dev --once
```

---

##### Task 3.2 — Create `convex/customPersonas.ts` (5 functions)

**Priority**: P1
**Files**: `convex/customPersonas.ts` (CREATE)
**Estimated**: 1 hour
**Depends on**: Task 3.1 (same pattern established)

**Problem / Context**:
`customPersonas` table exists in schema (line 473) but no API file. Source: `/home/laurentperello/coding/vantage-studio/convex/customPersonas.ts` (185 LOC).

Functions to port (5):
- Queries (2): `list`, `get`
- Mutations (3): `create`, `update`, `remove`

**Fix / Implementation**:
Identical pattern to Task 3.1. Apply same `getUserAndWorkspace` adapter. Fields: `name`, `icon`, `description`, `traits[]`, `communicationStyle`, `decisionMaking`, `systemPromptModifier`, `isSystem`, `workspaceId`, `createdBy`.

Apply the same S1 and S3 guards as Task 3.1:
- **S3 — `customPersonas.get` cross-workspace read**: after fetching, if `!entity.isSystem`, assert `ws.ownerId === identity.subject`. System personas are readable by all authenticated users.
- **S1 — `customPersonas.remove` ownership guard**: `if (!entity.isSystem && entity.createdBy !== identity.subject) throw new Error('unauthorized')`. System entities cannot be deleted by non-admins.

**Acceptance criteria**:
- [ ] File created at `convex/customPersonas.ts`
- [ ] All 5 functions exported
- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx convex dev --once` exits 0

**QA**:
```bash
npx tsc --noEmit
npx biome check --write convex/customPersonas.ts
```

---

##### Task 3.3 — Create `convex/customFrameworks.ts` (5 functions)

**Priority**: P1
**Files**: `convex/customFrameworks.ts` (CREATE)
**Estimated**: 1 hour
**Depends on**: Task 3.1

**Problem / Context**:
`customFrameworks` table exists in schema (line 495) but no API file. Source: `/home/laurentperello/coding/vantage-studio/convex/customFrameworks.ts` (183 LOC).

Functions to port (5):
- Queries (2): `list`, `get`
- Mutations (3): `create`, `update`, `remove`

**Fix / Implementation**:
Identical pattern to Task 3.1. Fields: `name`, `icon`, `description`, `methodology`, `bestFor[]`, `steps[]`, `systemPromptModifier`, `isSystem`, `workspaceId`, `createdBy`.

Apply the same S1 and S3 guards as Task 3.1:
- **S3 — `customFrameworks.get` cross-workspace read**: after fetching, if `!entity.isSystem`, assert `ws.ownerId === identity.subject`. System frameworks are readable by all authenticated users.
- **S1 — `customFrameworks.remove` ownership guard**: `if (!entity.isSystem && entity.createdBy !== identity.subject) throw new Error('unauthorized')`. System entities cannot be deleted by non-admins.

**Acceptance criteria**:
- [ ] File created at `convex/customFrameworks.ts`
- [ ] All 5 functions exported
- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx convex dev --once` exits 0

**QA**:
```bash
npx tsc --noEmit
npx biome check --write convex/customFrameworks.ts
```

---

#### Phase 3 — Files Summary

| Action | File | Lines changed (est.) |
|--------|------|----------------------|
| CREATE | `convex/customRoles.ts` | ~160 lines |
| CREATE | `convex/customPersonas.ts` | ~165 lines |
| CREATE | `convex/customFrameworks.ts` | ~160 lines |

---

### Phase 4 — Messages Enhancement: toolCalls field (Complexity: S)

**Goal**: `messages` table correctly stores tool call results from AI SDK v6.
**Prerequisite**: Phase 1 complete (messages table + functions deployed).

#### Tasks

---

##### Task 4.1 — Verify toolCalls schema matches AI SDK v6 output format

**Priority**: P1
**Files**: `convex/schema.ts`, `convex/messages.ts`
**Estimated**: 1 hour
**Depends on**: Task 1.4

**Problem / Context**:
The `messages` table's `toolCalls` field (added in Task 1.1) uses the schema from vantage-studio. AI SDK v6 may produce a different tool call shape than what the studio assumed. Need to verify the schema matches what `streamText` actually emits before the chat UI calls `api.messages.save` with tool results.

The studio's `toolCallSchema`:
```typescript
v.object({
  id: v.string(),       // AI SDK v6: toolCallId
  toolName: v.string(), // AI SDK v6: toolName ✓
  args: v.any(),        // AI SDK v6: args ✓
  result: v.optional(v.any()), // AI SDK v6: result ✓
  status: v.union(
    v.literal("pending"),
    v.literal("success"),
    v.literal("error"),
  ),                    // AI SDK v6: does not emit status — must be derived client-side
})
```

**Fix / Implementation**:
1. Read the current ChatPage implementation to see what tool call data it currently handles (if any).
2. If AI SDK v6 uses `toolCallId` instead of `id`: add `toolCallId: v.optional(v.string())` to the schema object and keep `id` for backwards compat, OR rename `id` → `toolCallId`.
3. `status` is not emitted by AI SDK — it must be set client-side when saving: pending on tool call, success/error after result arrives. Document this in a comment in `messages.ts`.
4. If schema needs updating: patch `convex/schema.ts` messages table `toolCalls` definition.

**Acceptance criteria**:
- [ ] `toolCalls` field shape documented with comment referencing AI SDK v6 shape
- [ ] `api.messages.save` accepts a `toolCalls` array without TypeScript error
- [ ] `npx tsc --noEmit` exits 0

**Visual verification**:
N/A — backend-only.

**QA**:
```bash
npx tsc --noEmit
npx biome check --write convex/schema.ts convex/messages.ts
```

---

#### Phase 4 — Files Summary

| Action | File | Lines changed (est.) |
|--------|------|----------------------|
| MODIFY | `convex/schema.ts` | +0–5 lines (conditional) |
| MODIFY | `convex/messages.ts` | +5 lines (comments + optional field) |

---

## Time Tracking

| Task | Estimated | Actual | Status | Notes |
|------|-----------|--------|--------|-------|
| Task 1.1: schema (chats, projects, messages) | 1.5h | — | Pending | |
| Task 1.2: convex/chats.ts | 2h | — | Pending | |
| Task 1.3: convex/projects.ts | 1h | — | Pending | |
| Task 1.4: convex/messages.ts | 1.5h | — | Pending | |
| Task 1.5: rate limiting | 1.5h | — | Pending | |
| Task 1.6: Phase 1 verification | 0.5h | — | Pending | |
| Task 1.7: audit logging (chats.remove, projects.archive) | 0.5h | — | Pending | |
| Task 2.1: chat list page | 2h | — | Pending | |
| Task 2.2: [chatId] route shell | 1.5h | — | Pending | |
| Task 2.3: ChatPage chatId prop | 2h | — | Pending | |
| Task 2.4: project selector | 1.5h | — | Pending | |
| Task 3.1: convex/customRoles.ts | 1h | — | Pending | |
| Task 3.2: convex/customPersonas.ts | 1h | — | Pending | |
| Task 3.3: convex/customFrameworks.ts | 1h | — | Pending | |
| Task 4.1: toolCalls verification | 1h | — | Pending | |
| **TOTAL** | **19h** | **—** | Pending | |

---

## Testing Strategy

### Unit Tests

| File | What to test | Framework |
|------|-------------|-----------|
| `__tests__/convex/chats.test.ts` | `create` inserts row, `remove` cascades messages, `update` ownership check | Vitest |
| `__tests__/convex/projects.test.ts` | `assignTask` updates taskCount on both old and new projects | Vitest |
| `__tests__/convex/messages.test.ts` | `deleteAfterTimestamp` removes correct rows, `saveSystem` bypasses auth | Vitest |

### Integration Tests

| Scenario | Steps | Expected outcome |
|----------|-------|-----------------|
| Chat creation + message persistence | 1. Call `api.chats.create`, 2. Call `api.messages.save` with returned chatId | Message row has correct `chatId` FK |
| Project assignment + task count | 1. Create project, 2. Create chat, 3. Call `assignTask` | `project.taskCount` increments to 1 |
| Chat delete cascade | 1. Create chat, 2. Save 3 messages, 3. Call `api.chats.remove` | All 3 message rows deleted |

### E2E Tests

| Flow | Route | Tool |
|------|-------|------|
| New chat → message → refresh → history persists | `/dashboard/chat` | Playwright |
| Filter by project | `/dashboard/chat` | Playwright |

### Manual Browser Checklist

- [ ] Feature works on desktop (1280px+)
- [ ] Feature works on mobile (375px)
- [ ] No console errors in browser devtools
- [ ] Auth-gated routes redirect unauthenticated users
- [ ] Touch targets meet 44px minimum (mobile)
- [ ] Focus states visible for keyboard navigation

---

## QA Protocol

Run after every task, before marking done:

```bash
# Step 1: TypeScript strict check
npx tsc --noEmit

# Step 2: Linting + formatting
npx biome check --write [list of changed files]

# Step 3: Convex (when schema or functions changed)
npx convex dev --once

# Step 4: i18n (when translation keys changed)
pnpm translate
pnpm i18n:verify
```

---

## Rollback Plan

1. **Schema changes**: Convex schema additions are non-destructive (new tables, no column drops). Rollback by reverting application code — `chats`, `projects`, `messages` tables remain but are unused. Existing `chatMessages` data unaffected.
2. **Git revert**: Each phase should be committed separately. Identify commit hash from Phase Completion Notes below. `git revert [hash]` per phase — they are independent.
3. **Data cleanup**: If `chats`/`projects`/`messages` tables need purging post-rollback, use Convex dashboard → Data → delete all rows. No automated seed was run for these tables.
4. **Feature flag**: No feature flag currently. If needed, gate the new `/dashboard/chat/[chatId]` route behind an env var in `middleware.ts`.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| `workspaceMembers` table missing — `messages.list` and `messages.save` workspace access checks break | High | Medium | Task 1.4 explicitly strips `workspaceMembers` check and replaces with owner-only for MVP |
| `getUserAndWorkspace` helper in customRoles/Personas/Frameworks uses `activeWorkspaceId` which doesn't exist in starter's `users` table | High | High | Task 3.1 explicitly documents the adapter — use `by_owner_and_default` index to resolve default workspace |
| `ChatPage` component's interface is internal and not typed for `chatId` prop | Medium | Medium | Task 2.3 reads the component first before touching it — no blind edits |
| `by_workspace_created` composite index missing from schema causes query failure in `chats.list` | High | High | Task 1.1 explicitly includes this index in the schema definition |
| Auth bypass: `messages.saveSystem` is an `internalMutation` — must not be exposed as public | Low | Critical | `internalMutation` is not callable from client by design in Convex — verify in Task 1.4 acceptance criteria |
| Credit drain: without rate limiting, a single authenticated user can call `messages.save` in a tight loop and exhaust billing credits programmatically | High | Critical | Rate limiting is mandatory before production deployment — Task 1.5 adds `@convex-dev/ratelimiter` to all create mutations with per-user keys |

---

## Success Metrics

The implementation is complete when:

- [ ] All acceptance criteria in every task are checked
- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx biome check` exits 0 on all changed files
- [ ] User can open `/dashboard/chat`, see their history, and navigate to a previous session
- [ ] Messages persist across browser refresh
- [ ] `api.customRoles.list`, `api.customPersonas.list`, `api.customFrameworks.list` return system records
- [ ] No Convex function errors in dashboard logs after smoke test

---

## Design System Compliance

### Token Mapping (Phase 2 UI tasks)

| Replace (hardcoded) | With (semantic token) |
|--------------------|-----------------------|
| `text-white` | `text-foreground` |
| `text-gray-500` | `text-muted-foreground` |
| `bg-gray-900` | `bg-primary` |
| `bg-gray-100` | `bg-muted` |
| `border-gray-200` | `border-border` |

### Mobile-First Checklist

- [ ] Layout works at 320px minimum width
- [ ] Interactive elements have `min-h-[44px]` touch targets
- [ ] Uses `px-4 md:px-6 lg:px-8` for page padding
- [ ] Stack panels: `flex-col md:flex-row`

### Anti-Patterns (never ship)

- [ ] No `shadcn/ui` or Radix imports — use lit-ui (`lui-*`)
- [ ] No `lucide-react` — inline SVGs only
- [ ] No hardcoded hex / HSL / gray-* colors — OKLCH tokens only
- [ ] No `dark:` prefix — OKLCH tokens handle dark mode automatically
- [ ] No `!important` overrides

---

## Phase Completion Notes

### Phase 1 — Convex Backend

**Completed**: —
**Actual hours**: —
**Commit**: —
**QA result**: —
**Files created**: —
**Files modified**: —
**Deferred items**: —

### Phase 2 — Chat List UI

**Completed**: —
**Actual hours**: —
**Commit**: —
**QA result**: —
**Files created**: —
**Files modified**: —

### Phase 3 — Custom Roles/Personas/Frameworks

**Completed**: —
**Actual hours**: —
**Commit**: —
**QA result**: —
**Files created**: —
**Files modified**: —

### Phase 4 — Messages Enhancement

**Completed**: —
**Actual hours**: —
**Commit**: —
**QA result**: —
**Files created**: —
**Files modified**: —

---

## Review Findings Log

**Review date**: 2026-03-24
**Reviewer**: dev-senior-dev review swarm
**Total findings**: 32 (3 BLOCKER, 15 HIGH, 14 MEDIUM/LOW — Medium/Low not tracked here)

### BLOCKER findings

| ID | Finding | Location in plan | Resolution |
|----|---------|-----------------|------------|
| B1 | `activeWorkspaceId` missing from starter `users` table — all lookups return `undefined` at runtime | Pre-build blocker #5 (added), Tasks 1.2 step 9, 1.3 step 8, 3.1–3.3 step 2 | **RESOLVED** — Pre-build blocker #5 added with exact `by_owner_and_default` index fix. Per-task notes updated. |
| B2 | `chats.getById` — no access control, any authenticated user can fetch any chat | Task 1.2 step 7 (added) | **RESOLVED** — Ownership chain check added: chat → workspace → assert `ws.ownerId === identity.subject`. |
| B3 | `messages.getById` — no access control, any authenticated user can fetch any message | Task 1.4 step 7 (added) | **RESOLVED** — Full chain resolution added: message → chat → workspace → assert ownership. |

### HIGH findings

| ID | Finding | Location in plan | Resolution |
|----|---------|-----------------|------------|
| H4 | `createdBy` ownership checks in `chats.ts` mutations use wrong type — must compare against `identity.subject` (string), not `user._id` (Convex Id) | Task 1.2 step 8 (added) | **RESOLVED** — Explicit note + comment convention added for `remove`, `update`, `updateSelectedModel`, `updateEnabledToolkits`. |
| H5 | `chats.create` — no workspace ownership verification before insert | Task 1.2 step 6 bullet (added) | **RESOLVED** — `ws.ownerId !== identity.subject` check added to create instructions. |
| H6 | `messages.update` — no ownership check | Task 1.4 step 8 (added) | **RESOLVED** — Chain resolution + ownership check explicitly mandated. |
| H7 | `projects.update` and `projects.archive` — no ownership checks | Task 1.3 steps 6–7 (added) | **RESOLVED** — `createdBy !== identity.subject` check required in both mutations. |
| H8 | Auth call not mandated on every function | Locked Decisions — Auth call mandatory (added) | **RESOLVED** — Non-negotiable rule added: every exported query/mutation must call `requireAuth()` or `requireAuthWithWorkspace()` first. |
| H9 | `assignTask` should use `requireAuthWithWorkspace` | Task 1.3 step 5 (updated) | **RESOLVED** — Changed from raw identity comparison to `requireAuthWithWorkspace(ctx, project.workspaceId)`. |
| H10 | `params` must be awaited in Next.js 15 | Task 2.2 WHAT TO DO (updated) | **RESOLVED** — Props type changed to `Promise<{...}>`, `const { chatId } = await params` mandated. |
| H11 | No i18n keys listed for chat feature | Task 2.0 (new task added) | **RESOLVED** — New P0 task added with all 10 required keys for en.json + fr.json, must complete before any Phase 2 UI work. |
| H12 | Typography conflict — CLAUDE.md says Space Grotesk/Inter, DESIGN-SYSTEM.md says Geist | Locked Decisions — Typography (added) | **RESOLVED** — DESIGN-SYSTEM.md declared authoritative. Geist/Geist Mono locked. |
| H13 | No rate limiting on any write mutation — single authenticated user can exhaust billing credits via `messages.save` in a tight loop | Task 1.5 (new), Risk Assessment (updated) | **RESOLVED** — Task 1.5 adds `@convex-dev/ratelimiter` to all 6 create mutations with per-user keys. Credit drain risk documented in Risk Assessment as High/Critical. |
| M1 | `projects.settings` used `v.any()` — accepts arbitrary JSON with no schema enforcement | Task 1.1 schema definition (updated), Locked Decisions (updated) | **RESOLVED** — Replaced with typed `v.object({ defaultView, color, icon })`. `v.any()` ban added to Locked Decisions. AI SDK fields (`parts`, `attachments`, `toolCalls.args/result`) carry inline justification comments and Phase 5 TODO. |
| S1 | `customRoles/Personas/Frameworks.remove` — no ownership guard, any authenticated user can delete any entity | Tasks 3.1 step 6, 3.2 fix block, 3.3 fix block (added) | **RESOLVED** — `if (!entity.isSystem && entity.createdBy !== identity.subject) throw new Error('unauthorized')` mandated in all three remove mutations. System entities blocked from deletion by non-admins. |
| S2 | `projects.get` — no access control, any authenticated user can read any project by ID | Task 1.3 step 10 (added) | **RESOLVED** — Workspace ownership check added: `const ws = await ctx.db.get(project.workspaceId); if (!ws || ws.ownerId !== identity.subject) throw new Error('unauthorized')`. Same pattern as B2. |
| S3 | `customRoles/Personas/Frameworks.get` — cross-workspace read, user-created entities readable across workspaces | Tasks 3.1 step 5, 3.2 fix block, 3.3 fix block (added) | **RESOLVED** — After fetching, if `!entity.isSystem`: resolve workspaceId → workspace → assert `ws.ownerId === identity.subject`. System entities remain readable by all authenticated users. |
| S4 | `messages.update` not rate-limited — unlimited spam edits possible per authenticated user | Task 1.5 rate limit table (updated) | **RESOLVED** — `messages.update` added at 60 per minute per user. |
| S5 | No audit log for destructive operations — deletions and archives leave no trace | Task 1.7 (new task added) | **RESOLVED** — New P0 Task 1.7 added: `chats.remove` and `projects.archive` both insert to `activities` table before executing the destructive operation. Atomic via Convex transaction. |

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-03-24 | Plan created — full rewrite from stub to implementation plan | dev-senior-dev |
| 2026-03-24 | Security review pass — 3 blockers + 9 high findings addressed: B1 activeWorkspaceId, B2 chats.getById ACL, B3 messages.getById ACL, H4 ownership type, H5 workspace verify, H6 messages.update ACL, H7 projects ownership, H8 auth mandate, H9 assignTask pattern, H10 Next.js 15 params, H11 i18n keys, H12 typography | dev-senior-dev |
| 2026-03-24 | Security hardening pass 2 — H13 rate limiting (Task 1.5 added, `@convex-dev/ratelimiter` on 6 mutations, Risk Assessment updated), M1 `v.any()` elimination (`projects.settings` typed, AI SDK fields annotated, `v.any()` ban in Locked Decisions) | dev-senior-dev |
