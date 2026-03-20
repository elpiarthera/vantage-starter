# Orchestration Plan — VantageStarter Agent Workforce
**Status: FINAL — Ready to execute**
**Last updated: 2026-03-20**

**Goal:** Port the full vantage-studio orchestration data model into VantageStarter. Buyers create their own agent workforce (4-Pillars composition: Role + Persona + Framework + Skills), assign agents to missions, and watch them execute operations with dependency resolution and human checkpoint gates. The Architect chat UI is the flagship admin feature — it's how buyers design their workforce and plan missions.

**Auth split:**
- Human-facing mutations: Clerk JWT
- Agent-facing endpoints: per-agent DB token (agentId + secret), not a shared API key
- Internal resolution logic: Convex internalMutation (no auth needed)

---

## Pre-Build Blockers

These 6 issues will cause silent failures or incorrect behavior. Fix before writing any new code.

| # | Issue | Fix |
|---|-------|-----|
| 1 | `agentComposer.ts` uses `QueryCtx` but is called from `httpAction` (which has `ActionCtx`) | Make `composeAgentSystemPrompt` an `internalQuery`; call it via `ctx.runQuery(internal.lib.agentComposer.composeAgentSystemPrompt, { agentId })` from the action |
| 2 | `missions.projectId` and `architectSessions.projectId` reference a `projects` table that does not exist | Remove both `projectId` fields from the schema; also drop the `by_project` indexes; add a `projects` table post-MVP |
| 3 | `commitPlan` uses temp IDs in `dependsOn` but never resolves them to real Convex IDs | Two-pass insert: (1) insert all operations and collect `tempId → realId` map, (2) patch each operation's `dependsOn` array by replacing every tempId with its real ID |
| 4 | `agents` schema uses `v.string()` for `roleId`, `personaId`, `frameworkId` — should be typed foreign keys | Use `v.id("customRoles")`, `v.id("customPersonas")`, `v.optional(v.id("customFrameworks"))` — enables referential integrity and typed queries |
| 5 | MVP with Phase 8 deferred = every operation stays `"pending"` forever — the system cannot demonstrate itself | Add Phase 8 back to MVP scope (see updated cut line below) |
| 6 | `ctx.scheduler.runAfter` calls are missing `await` | Add `await` — without it the scheduler call is fire-and-forget with no error propagation; silent failure |

---

## Locked Decisions (non-negotiable)

| Decision | Choice | Rejected alternatives |
|----------|--------|----------------------|
| Generative UI | json-render (Vercel ecosystem, Zod v4, SpecStream) | tambo, CopilotKit |
| Knowledge / RAG | @convex-dev/rag (already wired in VantageStarter) | Vercel Sandbox |
| Model routing | Complexity router pattern (classify → cheap vs capable) | Single-model approach |
| Orchestration tables | Port ALL from vantage-studio (80% exists) | Greenfield rewrite |
| Agent identity | Per-agent DB tokens (agentId + secret) | Shared API key |
| Architect plan rendering | json-render SpecStream | Proprietary vantage-studio format |
| Plan commit | `commitPlan` atomic Convex mutation | Multi-step write |
| Execution engine | Claim/complete/fail HTTP endpoints + dependency resolution | Push-based / cron |
| Framework alignment | Maximize Vercel OSS (Next.js 15, AI SDK v6, json-render, @vercel/analytics) | Custom tooling |
| Phase 0 prerequisite | Install json-render + verify SpecStream compatibility — Next.js 15 already at 15.3.9 | Upgrade first |
| Knowledge agent template | Steal complexity router pattern only — skip porting full codebase | Full port |

---

## Stack Overview

```
Next.js 15+ (App Router, async params)
  ↕ streaming
AI SDK v6 (streamText, useChat)
  + json-render (SpecStream for plan rendering)
  ↕ real-time
Convex (schema, queries, mutations, HTTP actions)
  + @convex-dev/rag (knowledge injection into Architect)
  ↕ auth
Clerk (middleware, per-user auth)
  + per-agent DB tokens (X-Agent-Id + X-Agent-Token headers)
```

---

## Port vs Build — Component Map

| Component | Status | Action |
|-----------|--------|--------|
| `skills` schema | EXISTS in vantage-studio | PORT as-is |
| `customRoles` schema | EXISTS | PORT as-is |
| `customPersonas` schema | EXISTS | PORT as-is |
| `customFrameworks` schema | EXISTS | PORT as-is |
| `agents` schema | EXISTS — missing `token` field | PORT + add token |
| `missions` schema | EXISTS | PORT as-is |
| `operations` schema | EXISTS | PORT as-is |
| `checkpoints` schema | EXISTS | PORT as-is |
| `architectSessions` schema | EXISTS | PORT as-is |
| `architectMessages` schema | EXISTS | PORT as-is |
| `convex/missions.ts` | EXISTS (full CRUD + createFromProposal) | PORT as-is |
| `convex/operations.ts` | EXISTS (full CRUD + status timestamps) | PORT as-is |
| `convex/agents.ts` | EXISTS (list, get, create, update, remove) | PORT + add token mutations |
| `convex/skills.ts` | EXISTS (CRUD + importFromUrl) | PORT as-is |
| `convex/architectSessions.ts` | EXISTS (full session + message management) | PORT as-is |
| `convex/schemas/architect.ts` | EXISTS (Zod + Convex validators) | PORT as-is |
| `convex/lib/auth.ts` | EXISTS (requireAuth, workspace validation) | PORT as-is |
| `convex/lib/workspace.ts` | EXISTS (role-based access validation) | PORT as-is |
| `lib/architect/schemas.ts` | EXISTS (discriminated union, Zod) | PORT as-is |
| `lib/architect/prompts.ts` | EXISTS — uses vantage-studio output format | PORT + adapt to json-render SpecStream |
| `convex/seed.ts` | EXISTS (421 lines) | PORT + audit for vantage-studio specifics |
| `app/api/architect/chat/route.ts` | EXISTS — uses json-render SpecStream | PORT as-is (json-render is now the standard) |
| `convex/checkpoints.ts` | MISSING — embedded in missions.ts | BUILD (approve, reject, listByMission) |
| `convex/orchestration.ts` | MISSING | BUILD (onOperationCompleted, onCheckpointApproved) |
| `convex/http.ts` | MISSING | BUILD (httpRouter + agent endpoints) |
| `convex/lib/agentAuth.ts` | MISSING | BUILD |
| `convex/lib/agentComposer.ts` | MISSING | BUILD |
| Architect UI | MISSING in vantage-starter | BUILD (uses json-render SpecStream) |
| Agent management pages | UNKNOWN | BUILD after schema confirmed |
| Mission board | UNKNOWN | BUILD after schema confirmed |

---

## Phase 0 — json-render Install + SpecStream Verification (Complexity: S)

**Next.js is already at 15.3.9. No upgrade needed.**

This phase installs json-render and verifies that vantage-studio's `prompts.ts` SpecStream output format is compatible before any porting begins.

### Step 0.1 — Install json-render

```bash
pnpm add @json-render/core @json-render/react
```

### Step 0.2 — Verify SpecStream API compatibility

Open `vantage-studio/lib/architect/prompts.ts`. Check the SpecStream output format used in the system prompt instructions against the installed `@json-render/core` API surface. Specifically verify:
- The `type` discriminator field name matches json-render expectations
- The streaming delimiter format matches `SpecStream` parser in `@json-render/react`
- No breaking API changes between the version vantage-studio was built against and the installed version

If there are mismatches, document them here before porting prompts.ts. Do not port prompts.ts with known format mismatches.

### Step 0.3 — Smoke test

Create a minimal `app/api/test-spec-stream/route.ts` that returns a hardcoded SpecStream object and verify `@json-render/react` renders it in a test page. Delete after passing.

**Estimated complexity:** S — 30–60 min.
**Hard dependency:** Phase 6 (Architect UI) cannot start without this confirmed.

---

## Phase 0.5 — Auth Field Mapping (Complexity: S, MUST DO BEFORE PHASE 2)

**Prerequisite:** None — do this before porting any function.

vantage-studio and vantage-starter use different field names for the same auth concept. Every ported function that touches auth fields needs adaptation, not just import fixes.

### Field mapping

| vantage-studio field | vantage-starter field | Notes |
|----------------------|-----------------------|-------|
| `clerkId` | `clerkUserId` | On the `users` table and anywhere user identity is stored |
| `workspaceId` (from user session) | Lookup via `activeWorkspaceId` → `workspaces` table | vantage-starter resolves workspace from the user's active workspace preference |

### Resolution pattern in vantage-starter

```typescript
// vantage-studio pattern (DO NOT PORT as-is):
const { clerkId, workspaceId } = await requireAuth(ctx);

// vantage-starter pattern (USE THIS):
const identity = await ctx.auth.getUserIdentity();
if (!identity) throw new ConvexError("Unauthorized");
const clerkUserId = identity.subject;

// Resolve active workspace:
const user = await ctx.db
  .query("users")
  .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", clerkUserId))
  .first();
const workspaceId = user?.activeWorkspaceId;
```

### What this means for porting

Every ported function in Phase 2 that calls `requireAuth` or reads `clerkId` must be updated to use the vantage-starter pattern above. This is a systematic adaptation, not just a find-and-replace. Review every ported file for auth field access before considering it done.

**Estimated complexity:** S — 30 min to document, then applied per-file during Phase 2.

---

## Phase 1 — Schema (Complexity: M)

**Prerequisite:** Phase 0 complete.

File: `convex/schema.ts`

Add after the existing `workspaces` table. All tables below are ported from vantage-studio verbatim, with one change: `agents` gets a `token` field.

> **CONCERN:** Schema ports as-is, but all functions referencing auth fields (`clerkId`, `workspaceId` resolution) need adaptation per Phase 0.5 — not just import fixes. Do not assume a function is done because it compiles.

---

### Table: `skills`

```typescript
skills: defineTable({
  name: v.string(),
  slug: v.string(),
  description: v.string(),
  instructions: v.string(),          // Markdown — the SKILL.md body
  category: v.union(
    v.literal("document"),
    v.literal("analysis"),
    v.literal("research"),
    v.literal("communication"),
    v.literal("development"),
    v.literal("creative"),
  ),
  isSystem: v.boolean(),
  createdBy: v.optional(v.string()),  // Clerk user ID
  workspaceId: v.optional(v.id("workspaces")),
  visibility: v.union(
    v.literal("system"),
    v.literal("workspace"),
    v.literal("private"),
  ),
  sourceUrl: v.optional(v.string()),
  usageCount: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_workspace", ["workspaceId"])
  .index("by_category", ["category"])
  .index("by_system", ["isSystem"])
  .index("by_slug", ["slug"])
```

---

### Table: `customRoles`

```typescript
customRoles: defineTable({
  name: v.string(),
  icon: v.string(),
  description: v.string(),
  category: v.string(),
  expertise: v.array(v.string()),
  systemPrompt: v.string(),
  isSystem: v.optional(v.boolean()),
  workspaceId: v.optional(v.id("workspaces")),
  createdBy: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_workspace", ["workspaceId"])
  .index("by_creator", ["createdBy"])
  .index("by_category", ["category"])
  .index("by_system", ["isSystem"])
```

---

### Table: `customPersonas`

```typescript
customPersonas: defineTable({
  name: v.string(),
  icon: v.string(),
  description: v.string(),
  traits: v.array(v.string()),
  communicationStyle: v.string(),
  decisionMaking: v.string(),
  systemPromptModifier: v.string(),
  isSystem: v.optional(v.boolean()),
  workspaceId: v.optional(v.id("workspaces")),
  createdBy: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_workspace", ["workspaceId"])
  .index("by_creator", ["createdBy"])
  .index("by_system", ["isSystem"])
```

---

### Table: `customFrameworks`

```typescript
customFrameworks: defineTable({
  name: v.string(),
  icon: v.string(),
  description: v.string(),
  methodology: v.string(),
  bestFor: v.array(v.string()),
  steps: v.array(v.string()),
  systemPromptModifier: v.string(),
  isSystem: v.optional(v.boolean()),
  workspaceId: v.optional(v.id("workspaces")),
  createdBy: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_workspace", ["workspaceId"])
  .index("by_creator", ["createdBy"])
  .index("by_system", ["isSystem"])
```

---

### Table: `agents`

```typescript
agents: defineTable({
  workspaceId: v.optional(v.id("workspaces")), // undefined = system agent
  createdBy: v.string(),

  // Identity
  name: v.string(),
  description: v.optional(v.string()),
  avatar: v.optional(v.string()),

  // 4-Pillars composition
  // Pre-build blocker #4: use typed IDs, not v.string()
  roleId: v.id("customRoles"),
  roleName: v.string(),
  roleSystemPrompt: v.string(),
  personaId: v.id("customPersonas"),
  personaName: v.string(),
  personaModifier: v.string(),
  frameworkId: v.optional(v.id("customFrameworks")),
  frameworkName: v.optional(v.string()),
  frameworkModifier: v.optional(v.string()),
  skillIds: v.array(v.id("skills")),

  // Model selection
  model: v.string(),
  provider: v.string(),
  customInstructions: v.optional(v.string()),
  temperature: v.optional(v.number()),
  maxTokens: v.optional(v.number()),

  // Per-agent auth token (NOT in vantage-studio — added here)
  token: v.optional(v.string()),        // 32-char hex, generated at creation
  tokenCreatedAt: v.optional(v.number()),

  // Status
  isSystem: v.boolean(),
  isActive: v.boolean(),
  usageCount: v.number(),
  visibility: v.union(v.literal("private"), v.literal("workspace")),

  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_workspace", ["workspaceId"])
  .index("by_creator", ["createdBy"])
  .index("by_workspace_active", ["workspaceId", "isActive"])
  .index("by_system", ["isSystem"])
```

---

### Table: `missions`

```typescript
missions: defineTable({
  name: v.string(),
  description: v.optional(v.string()),
  brief: v.optional(v.string()),
  objective: v.optional(v.string()),
  status: v.union(
    v.literal("pending"),
    v.literal("executing"),
    v.literal("awaiting_checkpoint"),
    v.literal("completed"),
    v.literal("failed"),
  ),
  intent: v.optional(v.union(
    v.literal("delivery"),
    v.literal("experiment"),
    v.literal("internal"),
  )),
  structure: v.optional(v.union(
    v.literal("linear"),
    v.literal("milestones"),
    v.literal("multi-stream"),
  )),
  priority: v.optional(v.union(
    v.literal("urgent"),
    v.literal("high"),
    v.literal("medium"),
    v.literal("low"),
  )),
  successCriteria: v.optional(v.array(v.string())),
  progress: v.optional(v.number()),
  startDate: v.optional(v.number()),
  targetDate: v.optional(v.number()),
  workspaceId: v.id("workspaces"),
  // Pre-build blocker #2: projectId removed — projects table does not exist yet.
  // Add back when projects table is added post-MVP.
  createdBy: v.string(),
  ownerId: v.optional(v.string()),
  isArchived: v.optional(v.boolean()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_workspace", ["workspaceId"])
  .index("by_workspace_status", ["workspaceId", "status"])
  .index("by_workspace_priority", ["workspaceId", "priority"])
  .index("by_workspace_archived", ["workspaceId", "isArchived"])
  .index("by_created_by", ["createdBy"])
```

---

### Table: `operations`

```typescript
operations: defineTable({
  missionId: v.id("missions"),
  workspaceId: v.id("workspaces"),
  name: v.string(),
  description: v.optional(v.string()),
  type: v.union(v.literal("ai"), v.literal("human")),
  status: v.union(
    v.literal("pending"),
    v.literal("blocked"),
    v.literal("in_progress"),
    v.literal("awaiting_review"),
    v.literal("completed"),
    v.literal("failed"),
  ),
  assignedAgentId: v.optional(v.id("agents")),   // FK to agents table
  assignedTo: v.optional(v.string()),              // Clerk user ID for human ops
  dependsOn: v.optional(v.array(v.id("operations"))),
  requiresReview: v.optional(v.boolean()),
  requiredTools: v.optional(v.array(v.string())),
  prompt: v.optional(v.string()),
  output: v.optional(v.string()),
  error: v.optional(v.string()),
  artifacts: v.optional(v.array(v.string())),
  priority: v.optional(v.union(
    v.literal("urgent"),
    v.literal("high"),
    v.literal("medium"),
    v.literal("low"),
  )),
  estimatedMinutes: v.optional(v.number()),
  actualMinutes: v.optional(v.number()),
  claimedAt: v.optional(v.number()),
  startedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
  orderPosition: v.optional(v.number()),
  createdBy: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_mission", ["missionId"])
  .index("by_workspace", ["workspaceId"])
  .index("by_workspace_status", ["workspaceId", "status"])
  .index("by_mission_status", ["missionId", "status"])
  .index("by_assigned_agent", ["assignedAgentId"])
  .index("by_assigned_to", ["assignedTo"])
  .index("by_created_by", ["createdBy"])
```

---

### Table: `checkpoints`

```typescript
checkpoints: defineTable({
  missionId: v.id("missions"),
  afterOperationId: v.id("operations"),
  description: v.string(),
  status: v.union(
    v.literal("pending"),
    v.literal("approved"),
    v.literal("rejected"),
  ),
  approvedBy: v.optional(v.string()),
  approvedAt: v.optional(v.number()),
  rejectionReason: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_mission", ["missionId"])
  .index("by_operation", ["afterOperationId"])
  .index("by_mission_status", ["missionId", "status"])
```

---

### Table: `architectSessions`

```typescript
architectSessions: defineTable({
  workspaceId: v.id("workspaces"),
  status: v.union(
    v.literal("active"),
    v.literal("completed"),
    v.literal("abandoned"),
  ),
  existingMissionId: v.optional(v.id("missions")),
  missionContext: v.optional(v.object({
    missionId: v.string(),
    missionName: v.string(),
    missionBrief: v.optional(v.string()),
  })),
  createdBy: v.string(),
  title: v.optional(v.string()),
  // Pre-build blocker #2: projectId removed — projects table does not exist yet.
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_workspace", ["workspaceId"])
  .index("by_workspace_created", ["workspaceId", "createdAt"])
  .index("by_user", ["createdBy"])
  .index("by_status", ["status"])
  .index("by_existing_mission", ["existingMissionId"])
```

---

### Table: `architectMessages`

```typescript
architectMessages: defineTable({
  sessionId: v.id("architectSessions"),
  role: v.union(v.literal("user"), v.literal("assistant")),
  content: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_session", ["sessionId"])
  .index("by_session_created", ["sessionId", "createdAt"])
```

**Estimated complexity:** M — 9 tables, ~220 lines. No logic.

---

## Phase 2 — Port Convex Functions (Complexity: M)

**Prerequisite:** Phase 1 complete. Phase 0.5 mapping applied to every ported file.
**Source:** vantage-studio Convex layer — confirmed production-grade.

**Port as-is (copy + adjust imports only):**

```
convex/missions.ts              Full CRUD + createFromProposal (atomic)
convex/operations.ts            Full CRUD + status timestamps + grouped queries
convex/agents.ts                list, get, create, update, remove, incrementUsage
convex/skills.ts                CRUD + importFromUrl action
convex/architectSessions.ts    create, get, getMessages, addMessage, complete, listRecent
convex/schemas/architect.ts    missionProposalValidator + operationProposalValidator
convex/lib/auth.ts              requireAuth, validateWorkspaceAccess, getWorkspaceContext
convex/lib/workspace.ts         validateWorkspaceAccess with role-based result
lib/architect/schemas.ts        Zod discriminated union for ArchitectOutput
```

> **REMINDER:** Every file above that touches `clerkId` or workspace resolution needs the Phase 0.5 adaptation applied. It is NOT sufficient to just fix imports.

**Port + extend:**
- `convex/agents.ts` — add `generateToken`, `rotateToken` mutations after copy

**Build from scratch:**
- `convex/checkpoints.ts` — standalone `approve`, `reject`, `listByMission` (currently embedded in missions.ts in vantage-studio)

**Estimated complexity:** M — mostly copy. 2–3 hours including checkpoints.ts build.

---

## Phase 3 — Seed Data (Complexity: S)

**Prerequisite:** Phase 2 complete.

Source: `convex/seed.ts` in vantage-studio (421 lines).

**Audit before porting:** Remove vantage-studio-specific seeds (any seed referencing vantage-studio product features). Keep:
- 8–10 system roles (PM, Developer, Designer, Strategist, Analyst, Writer, Growth Hacker...)
- 5–6 system personas (Analytical, Creative, Pragmatic, Empathetic, Challenger...)
- 4–5 system frameworks (First Principles, Design Thinking, JTBD, OKR, Agile Sprint)
- 10–15 system skills (competitive-analysis, code-review, content-writing, data-viz...)

All system items: `isSystem: true`, `workspaceId: undefined`.

Idempotent — check before insert.

Run: `npx convex run seed:systemData`

**Estimated complexity:** S — 1 hour.

---

## Phase 4 — Agent Auth + Composition (Complexity: S)

**Prerequisite:** Phase 2 complete.

### Step 4.1 — `convex/lib/agentAuth.ts` (BUILD)

```typescript
export async function requireAgentAuth(
  ctx: ActionCtx,
  request: Request
): Promise<Doc<"agents">> {
  const agentId = request.headers.get("X-Agent-Id");
  const token = request.headers.get("X-Agent-Token");
  if (!agentId || !token) throw new ConvexError("Unauthorized");

  const agent = await ctx.runQuery(internal.agents.getById, { agentId });
  if (!agent || !agent.isActive) throw new ConvexError("Unauthorized");

  // Constant-time comparison — prevents timing attacks
  // NOTE: Convex V8 runtime does NOT have node:crypto. timingSafeEqual from
  // node:crypto will not work here. Use manual XOR comparison over Uint8Array.
  if (!timingSafeEqualV8(agent.token, token)) throw new ConvexError("Unauthorized");

  return agent;
}

// V8-compatible constant-time string comparison (no node:crypto).
// Both strings must be the same length to be constant-time — length difference
// leaks timing info, but for fixed-length hex tokens (64 chars) this is safe.
function timingSafeEqualV8(a: string | undefined, b: string): boolean {
  if (!a || a.length !== b.length) return false;
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) {
    diff |= aBytes[i] ^ bBytes[i];
  }
  return diff === 0;
}
```

> **Why not `===` for MVP:** A simple `===` comparison short-circuits on the first differing character, leaking timing information that an attacker can use to oracle-guess token bytes. The XOR approach above is a V8-safe constant-time replacement. The `node:crypto` `timingSafeEqual` is unavailable in Convex's V8 runtime — do not attempt to import it.

**Why per-agent tokens over shared API key:**
- Auditability — every operation write is attributable to a specific agent
- Scoping — agent can only claim operations assigned to `agent._id`
- Revocability — one compromised agent doesn't expose all operations
- Rotation — each agent rotates independently

### Step 4.2 — `convex/lib/agentComposer.ts` (BUILD)

> **Pre-build blocker #1:** This cannot be a plain async function taking `QueryCtx`. The claim endpoint is an `httpAction` which has `ActionCtx`, not `QueryCtx`. Plain functions are not callable across that boundary. Expose it as an `internalQuery` and call via `ctx.runQuery`.

```typescript
// convex/lib/agentComposer.ts
import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

export const composeAgentSystemPrompt = internalQuery({
  args: { agentId: v.id("agents") },
  handler: async (ctx, { agentId }): Promise<string> => {
    const agent = await ctx.db.get(agentId);
    if (!agent) throw new Error("Agent not found");

    const skills = await Promise.all(
      agent.skillIds.map(id => ctx.db.get(id))
    );
    const activeSkills = skills.filter(Boolean);

    let prompt = agent.roleSystemPrompt;
    prompt += `\n\nCommunication style:\n${agent.personaModifier}`;

    if (agent.frameworkModifier) {
      prompt += `\n\nMethodology:\n${agent.frameworkModifier}`;
    }

    if (activeSkills.length > 0) {
      prompt += `\n\nCapabilities:\n`;
      prompt += activeSkills.map(s => s!.instructions).join("\n\n---\n\n");
    }

    if (agent.customInstructions) {
      prompt += `\n\nCustom instructions:\n${agent.customInstructions}`;
    }

    return prompt;
  },
});
```

Called from the `/agent/operations/claim` httpAction via:

```typescript
const agentSystemPrompt = await ctx.runQuery(
  internal.lib.agentComposer.composeAgentSystemPrompt,
  { agentId: agent._id }
);
```

The response includes the composed system prompt so the agent has its full identity before executing.

**Estimated complexity:** S — 2 files, pure logic.

---

## Phase 5 — @convex-dev/rag Activation (Complexity: S) [DEFERRED — post-MVP]

> **MVP CUT:** Phase 5 is deferred. Ship without RAG. The Architect will inject workspace context manually (cheaper at small scale). Add RAG when workspace knowledge volume makes manual injection expensive.

**Prerequisite:** Phase 2 complete.
**Note:** @convex-dev/rag is already wired in VantageStarter. This phase activates it for the Architect.

### What the Architect gains from RAG

The Architect's system prompt can include real workspace knowledge:
- Existing agents, their skills, roles
- Past mission briefs (so it doesn't duplicate)
- Custom roles/personas/frameworks defined by the workspace owner

Without RAG, this context is manually injected (expensive token count). With RAG, the Architect queries the vector index for relevant context before responding.

### Step 5.1 — Index workspace knowledge

Convex action that embeds and indexes:
- Agent descriptions + composed system prompts
- Mission briefs + objectives
- Skill instructions

> **NOTE:** RAG indexing must go through `ctx.scheduler.runAfter(0, internal.rag.indexWorkspaceItem, {...})` — you cannot call actions inline from mutations. Any mutation that creates an agent, mission, or skill must schedule the indexing action, not call it directly.

Trigger: on agent create, on mission create, on skill create.

### Step 5.2 — Inject into Architect prompt

In `app/api/architect/chat/route.ts`, before calling `streamText`:

```typescript
const relevantContext = await convex.action(
  internal.rag.searchWorkspaceKnowledge,
  { query: userMessage, workspaceId, limit: 5 }
);
```

Inject `relevantContext` into the system prompt as structured context blocks.

### Step 5.3 — Port complexity router pattern from Vercel knowledge agent

The Vercel knowledge agent classifies queries before routing:

```
Simple factual question → cheap model (e.g., claude-haiku-3-5)
Complex reasoning / plan generation → capable model (e.g., claude-sonnet-4-5)
```

Apply this in the Architect route:

```typescript
const complexity = classifyQuery(userMessage);
// "simple" = factual about workspace, listing, status checks
// "complex" = plan generation, agent design, dependency reasoning

const model = complexity === "simple"
  ? anthropic("claude-haiku-3-5")
  : anthropic("claude-sonnet-4-5");
```

`classifyQuery` — lightweight heuristic: check for planning keywords ("create mission", "design", "plan"), fallback to simple.

**Estimated complexity:** S — 3 steps, mostly wiring existing RAG infrastructure.

---

## Phase 6 — Architect Chat Feature (Complexity: L)

**Prerequisite:** Phases 0, 2 complete. json-render installed and verified (Phase 0). Phase 5 deferred — inject workspace context manually for MVP.

The Architect is the flagship admin feature. It replaces any manual mission-creation flow with a conversational UI that renders structured plans via json-render SpecStream.

### What it does

Admin opens Architect → describes what they want → the AI assistant:
1. Defines the mission (name, brief, objective, success criteria)
2. Designs the agent workforce (create/assign agents, configure 4-Pillars)
3. Plans the operations (dependency graph, assign agents to each op)
4. Sets checkpoints
5. Renders the plan via json-render SpecStream (human can see it structured, not just as text)
6. Confirms → `commitPlan` atomic mutation creates everything in DB

### Step 6.1 — json-render SpecStream integration

The Architect AI streams a structured plan in json-render SpecStream format. The client renders it as an interactive plan card — not a JSON blob in the chat.

**Output format the AI produces:**

```json
{
  "type": "mission-proposal",
  "mission": {
    "name": "...",
    "brief": "...",
    "objective": "...",
    "successCriteria": ["..."]
  },
  "operations": [
    {
      "tempId": "op-1",
      "name": "...",
      "type": "ai",
      "assignedAgentId": "...",
      "dependsOn": [],
      "requiresReview": false
    }
  ],
  "checkpoints": [
    {
      "afterTempId": "op-1",
      "description": "..."
    }
  ]
}
```

json-render renders this as a structured mission card in the chat. The "Confirm Plan" button triggers `commitPlan`.

**Port `lib/architect/prompts.ts`** from vantage-studio. The output format instruction already targets json-render SpecStream — port as-is. No adapter needed.

### Step 6.2 — `app/api/architect/chat/route.ts` (PORT from vantage-studio)

Port as-is. Core logic:
- Auth: Clerk `auth()` → must be admin or workspace owner
- Input: `{ sessionId, message, workspaceId }`
- Manual context injection: load workspace agents + recent missions + roles/personas/frameworks, inject into system prompt (no RAG until Phase 5)
- Complexity router: classify → select model
- Load session history from `architectMessages`
- Call AI SDK `streamText` with Architect system prompt
- Return SpecStream response

### Step 6.3 — Convex mutations for Architect (PORT from vantage-studio)

File: `convex/architect.ts`

```typescript
// Create session
mutation createSession(workspaceId, title?): Id<"architectSessions">  // projectId removed — projects table is post-MVP

// Append message
mutation addMessage(sessionId, role, content): Id<"architectMessages">

// Commit plan — creates mission + operations + checkpoints atomically
mutation commitPlan(sessionId, missionProposal): Id<"missions">
  // Validates proposal
  // Inserts mission
  //
  // TWO-PASS OPERATION INSERT (pre-build blocker #3):
  // The AI uses string tempIds ("op-1", "op-2") in the dependsOn array.
  // These must be resolved to real Convex IDs before the row is final.
  //
  // Pass 1: Insert all operations with dependsOn = [] (empty).
  //         Collect tempId → realId map:
  //           const idMap = new Map<string, Id<"operations">>();
  //           for (const op of proposal.operations) {
  //             const realId = await ctx.db.insert("operations", { ...op, dependsOn: [] });
  //             idMap.set(op.tempId, realId);
  //           }
  //
  // Pass 2: Patch each operation's dependsOn with resolved real IDs:
  //           for (const op of proposal.operations) {
  //             if (op.dependsOn?.length) {
  //               const resolvedDeps = op.dependsOn.map(tid => {
  //                 const id = idMap.get(tid);
  //                 if (!id) throw new Error(`Unknown tempId: ${tid}`);
  //                 return id;
  //               });
  //               await ctx.db.patch(idMap.get(op.tempId)!, {
  //                 dependsOn: resolvedDeps,
  //                 status: "blocked",   // has real deps → starts blocked
  //               });
  //             }
  //           }
  //
  // Operations with no dependsOn entries → status = "pending"
  // Operations with dependsOn entries → status = "blocked"
  // (this logic lives HERE, not split into Phase 8 — keeping it split would
  //  require rewriting commitPlan when Phase 8 lands)
  //
  // Inserts checkpoints — afterTempId resolved via idMap
  // Updates session.status = "completed", session.existingMissionId = missionId
  // Returns missionId

// Load session + messages
query getSessionWithMessages(sessionId): { session, messages }

// List sessions
query listSessions(workspaceId): architectSessions[]
```

`commitPlan` is atomic — if anything fails, nothing is written. No partial state.

**Initial status assignment is IN commitPlan.** Operations with `dependsOn` entries start as `blocked`. Operations with no dependencies start as `pending`. This is the only correct location — splitting this logic into Phase 8 would force a rewrite of `commitPlan` later.

### Step 6.4 — Architect UI (BUILD)

File: `app/(dashboard)/architect/page.tsx`

Two panels:
- Left: session list + new session button
- Right: chat interface with json-render plan rendering + "Confirm Plan" button

The "Confirm Plan" button appears when the AI's last message contains a SpecStream mission-proposal block. Clicking it calls `architect.commitPlan`.

**Estimated complexity:** L — streaming AI, json-render integration, atomic commit.

---

## Phase 6.5 — Mission Board (Complexity: M)

**Prerequisite:** Phase 6 complete (commitPlan writes missions + operations).

The Mission Board is the post-commit landing page. Without it, `commitPlan` has no visible output. The user commits a plan and sees nothing — that's a broken UX. This phase is MVP, not optional.

### What it shows

Read-only list of all committed missions in the workspace, with their operations and status badges.

```
[Mission Name]               status: executing
  op-1: Research competitors   status: completed
  op-2: Draft brief            status: in_progress   (assigned: Senior Dev)
  op-3: Review brief           status: blocked       (depends on op-2)
  [Checkpoint: Review gate]
  op-4: Publish report         status: blocked       (depends on op-3 + checkpoint)
```

### Step 6.5.1 — File: `app/(dashboard)/missions/page.tsx`

- List missions via `missions.listByWorkspace` query
- Real-time via Convex `useQuery` — status updates push instantly

### Step 6.5.2 — File: `app/(dashboard)/missions/[missionId]/page.tsx`

- Mission detail: brief, objective, success criteria
- Operations list with status badges (pending / blocked / in_progress / completed / failed)
- Checkpoint cards with approve/reject buttons (Clerk auth required)

### Step 6.5.3 — Status badge design

| Status | Badge color |
|--------|-------------|
| pending | gray |
| blocked | amber |
| in_progress | blue |
| awaiting_review | purple |
| awaiting_checkpoint | orange |
| completed | green |
| failed | red |

**Estimated complexity:** M — read-only data display, real-time via useQuery, checkpoint action buttons.

---

## Phase 7 — Agent CRUD (Complexity: M) [DEFERRED — post-MVP]

> **MVP CUT:** Phase 7 is deferred. Use seed data agents for the first end-to-end test. Build the full CRUD UI after the execution loop works.

**Prerequisite:** Phase 2 complete (port base), Phase 4 complete (token generation).

File: `convex/agents.ts` — extend the ported version with token mutations.

**New mutations (add to ported agents.ts):**

```typescript
// Create agent — generates token
mutation createAgent(workspaceId, name, roleId, personaId, frameworkId?, skillIds[], model, ...): {
  agent: Doc<"agents">,
  token: string  // Printed once, not retrievable again
}

// Rotate token
mutation rotateToken(agentId): { token: string }
```

Token generation: `crypto.getRandomValues` → 32 bytes → hex string. Stored in plain (Convex DB is at-rest encrypted; hashing bcrypt cost not justified at this stage).

**Estimated complexity:** M — adding to ported base.

---

## Phase 8 — Execution Engine (Complexity: M) [MVP — back in scope]

> **MVP INCLUDED:** Phase 8 is back in MVP scope. Without the execution engine, every operation stays `"pending"` forever — the system cannot demonstrate itself. "Born agentic" is a lie without it. Include in the first shipment alongside Phases 0, 0.5, 1, 2, 3, 4, 6, 6.5.

**Prerequisite:** Phases 4, 7 complete.

This is the only component with zero vantage-studio equivalent. Everything else is port work.

### Step 8.1 — `convex/orchestration.ts` (BUILD)

```typescript
internalMutation onOperationCompleted(operationId):
  1. Load the completed operation
  2. Check if checkpoint exists with afterOperationId === operationId AND checkpoint.status === "pending":
     - If YES: set mission.status = "awaiting_checkpoint" and RETURN immediately.
       Do NOT unblock downstream ops — checkpoint approval triggers that via onCheckpointApproved.
  3. If no blocking checkpoint: find all operations in same mission with status "blocked"
     where dependsOn includes operationId
  4. For each candidate:
     a. Load all its dependsOn operations
     b. If ALL are "completed": patch status "blocked" → "pending"
  5. Recalculate mission.progress = (completed / total) * 100
  6. If all operations completed: mission.status = "completed"

internalMutation onCheckpointApproved(checkpointId):
  load checkpoint → get afterOperationId →
  call onOperationCompleted(afterOperationId) →   // now proceeds past the checkpoint
  patch mission.status = "executing"
```

> **Branch ordering is critical.** Check for blocking checkpoint FIRST before unblocking downstream. If the order is reversed, operations after a checkpoint will be unblocked before the human approves — defeating the checkpoint's purpose.

**Initial status assignment lives in `commitPlan` (Phase 6.3), not here.** Operations with `dependsOn` entries → `blocked`. Operations with no dependencies → `pending`. This is set at plan commit time.

### Step 8.2 — Agent HTTP Endpoints (BUILD)

File: `convex/http.ts`

Each endpoint calls `requireAgentAuth` first. The returned agent row scopes all DB access.

**`POST /agent/operations/claim`**

Body: `{ operationId: string }`
1. `requireAgentAuth` → get agent
2. Load operation → verify `assignedAgentId === agent._id`
3. Verify status is `pending` (not `blocked`)
4. Verify all `dependsOn` are `completed` → 409 + `{ blockedBy }` if not
5. Patch: `status = "in_progress"`, `claimedAt`, `startedAt`
6. Load mission brief + compose agent system prompt (via `composeAgentSystemPrompt`)
7. Return `{ operation, missionBrief, agentSystemPrompt, siblingStatuses }`

Agent gets full identity (4-Pillars system prompt) in this response. No second call needed.

**`POST /agent/operations/complete`**

Body: `{ operationId: string, output: string, artifacts?: string[] }`
1. Auth + scope check
2. Verify `status === "in_progress"`
3. If `requiresReview: true` → `status = "awaiting_review"`
4. Else → `status = "completed"`, `completedAt`, increment `agent.usageCount`
5. `await ctx.runMutation(internal.orchestration.onOperationCompleted, { operationId })`
   // Pre-build blocker #6: must await — silent failure without it
6. Return `{ status, nextPendingOperations }`

**`POST /agent/operations/fail`**

Body: `{ operationId: string, error: string }`

Auth → scope check → `status = "failed"` → write error → return.

**`GET /agent/missions/context?missionId=<id>`**

> **Note:** Convex httpRouter has no path parameter support. Route parameters like `:missionId` in the path do not work. Use query string: `?missionId=<id>`. Extract with `new URL(request.url).searchParams.get("missionId")`.

1. Auth
2. Verify agent has at least one operation in this mission (no cross-mission reads)
3. Return: mission brief + objective + successCriteria + all operations (id, name, assignedAgentId, status, output capped at 500 chars)

**`GET /agent/operations/pending`**
1. Auth → get agent
2. Return all `pending` operations where `assignedAgentId === agent._id` and all `dependsOn` are `completed`

Agents poll this endpoint. No push needed for MVP.

**Estimated complexity:** M — 5 endpoints + dep resolution. 3–4 hours.

---

## Phase 9 — Checkpoint Flow (Complexity: S) [DEFERRED — post-MVP]

> **MVP CUT:** Phase 9 is deferred. Checkpoint UI is in Phase 6.5. The Convex mutations (approve/reject) can be wired once Phase 8 is live.
> **Note on rejection:** Rejection is a hard kill — `mission.status = "failed"` with no recovery path. This is intentional MVP simplification. A revision flow (reset operations to pending, allow re-execution) is a post-MVP enhancement.

**Prerequisite:** Phase 8 complete.

File: `convex/checkpoints.ts` (standalone — BUILD, currently embedded in missions.ts in vantage-studio)

```typescript
// Human approves (Clerk auth)
mutation approveCheckpoint(checkpointId):
  requireAuth → load checkpoint → verify pending →
  patch: approved, approvedBy, approvedAt →
  call internal.orchestration.onCheckpointApproved(checkpointId)

// Human rejects (Clerk auth) — HARD KILL, no recovery
mutation rejectCheckpoint(checkpointId, rejectionReason):
  requireAuth → patch: rejected, rejectionReason →
  patch mission.status = "failed"
  // No downstream unblocking. Mission is terminal.
  // Post-MVP: add revision flow that resets affected operations.

// Query
query listByMission(missionId, status?): checkpoints[]
```

**Estimated complexity:** S

---

## Phase 10 — HTTP Router Wiring (Complexity: S) [DEFERRED — post-MVP]

> **MVP CUT:** Deferred. Part of Phase 8 deliverable when execution engine is built.

**Prerequisite:** Phases 8, 9 complete.

File: `convex/http.ts`

```typescript
// Agent-facing (per-agent token auth)
http.route({ path: "/agent/operations/claim", method: "POST", handler: claimOperation });
http.route({ path: "/agent/operations/complete", method: "POST", handler: completeOperation });
http.route({ path: "/agent/operations/fail", method: "POST", handler: failOperation });
http.route({ path: "/agent/missions/context", method: "GET", handler: getMissionContext });
http.route({ path: "/agent/operations/pending", method: "GET", handler: getPendingOperations });

// Human-facing (Clerk auth)
http.route({ path: "/orchestration/checkpoint/approve", method: "POST", handler: approveCheckpoint });
http.route({ path: "/orchestration/checkpoint/reject", method: "POST", handler: rejectCheckpoint });
http.route({ path: "/orchestration/missions/create", method: "POST", handler: createMission });
```

**Estimated complexity:** S

---

## Phase 11 — Python CLI (Complexity: M) [DEFERRED — post-MVP]

> **MVP CUT:** Deferred. Integration testing can use the Mission Board UI + Convex dashboard for the first end-to-end test.
> **Note on auth:** The CLI uses the Convex Python SDK directly, not raw HTTP endpoints. Do not use "Clerk admin token" against the HTTP endpoints — that's ambiguous and fragile. Use `ConvexClient` from the Python SDK for human-facing mutations (Clerk JWT injected via SDK auth helpers), and `X-Agent-Id` + `X-Agent-Token` headers only for the agent-facing HTTP endpoints.

**Prerequisite:** Phases 8, 9 complete.

File: `scripts/orchestrate.py`

For humans who want to create missions and approve checkpoints without the Architect UI. Also the primary integration testing tool.

```bash
# Mission management
python scripts/orchestrate.py create-mission --file mission.json --workspace-id <id>
python scripts/orchestrate.py list-missions --workspace-id <id>
python scripts/orchestrate.py list-ops --mission-id <id>
python scripts/orchestrate.py status --mission-id <id>

# Checkpoint management
python scripts/orchestrate.py approve --checkpoint-id <id>
python scripts/orchestrate.py reject --checkpoint-id <id> --reason "needs revision"

# Agent management
python scripts/orchestrate.py create-agent --name "Senior Dev" --role-id <id> --persona-id <id> --workspace-id <id>
```

Reads `CONVEX_URL` from `.env.local`. Uses Convex Python SDK for human-facing calls. Uses `X-Agent-Id` + `X-Agent-Token` headers for agent-facing HTTP endpoints.

**Estimated complexity:** M — ~250 lines.

---

## MVP Cut Line

**Ship first (Phases 0, 0.5, 1, 2, 3, 4, 6, 6.5, 8):**

| Phase | What |
|-------|------|
| 0 | json-render install + SpecStream verification |
| 0.5 | Auth field mapping (clerkId → clerkUserId) |
| 1 | Schema — 9 tables |
| 2 | Port Convex functions |
| 3 | Seed data |
| 4 | Agent auth + composer |
| 6 | Architect chat + commitPlan + json-render UI |
| 6.5 | Mission Board (list + detail + checkpoint buttons) |
| 8 | Execution engine (HTTP + dep resolution) |

> **Why Phase 8 is back:** Without the execution engine, every operation committed by the Architect stays `"pending"` forever. The Mission Board shows a static list that never changes. That is not a working demo — it is a mockup. Phase 8 is required for "born agentic" to be true.

**Defer post-MVP:**

| Phase | What | Dependency |
|-------|------|------------|
| 5 | RAG activation + complexity router | Phase 2 |
| 7 | Agent CRUD UI (token mutations) | Phase 2, 4 |
| 9 | Checkpoint Convex mutations (full flow) | Phase 8 |
| 10 | HTTP router wiring (full) | Phase 8, 9 |
| 11 | Python CLI | Phase 8, 9 |
| 12 | Changelog Monitor | Phase 8 |

---

## Security Fixes

### Fix before deploying (live code, fix now)

These are issues in the existing vantage-starter codebase before any orchestration phases are built.

| ID | Issue | Fix |
|----|-------|-----|
| H4 | Model injection in `ai.ts` + `agent.ts` — model name passed from client without validation | Add allowlist: `const ALLOWED_MODELS = ["claude-sonnet-4-5", "claude-haiku-3-5", ...]; if (!ALLOWED_MODELS.includes(model)) throw new Error("Invalid model")` |
| H5 | `systemPrompt` field — no length limit, no null byte stripping | Add `maxLength: 10000` validator in schema + strip null bytes: `systemPrompt.replace(/\0/g, "")` before use |
| H6 | Next.js CVEs in current dependencies | Run `npm audit fix` — check for breaking changes before applying |
| M1 | CORS wildcard `*` in Convex HTTP actions | Restrict to app domain: `"Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_APP_URL ?? "https://yourapp.com"` |
| L3 | `workspaceId` in `agent.ts` — no ownership validation | Verify the calling user is a member of the workspace before allowing agent access |

### Fix before building orchestration phases (new code)

These apply to Phases 4, 6, 8, 9 as they are built.

| ID | Issue | Fix |
|----|-------|-----|
| C1 | Timing-safe token comparison | Use `timingSafeEqualV8` from Phase 4.1 (XOR over Uint8Array, no node:crypto) |
| H1 | Agent tokens stored in plain — if DB dump leaked, all tokens exposed | Hash tokens with HMAC-SHA256 using an env var key: `HMAC(token, process.env.TOKEN_SIGNING_KEY)`. Store hash, compare hash. Post-MVP if compliance required. |
| H2 | No rate limiting on agent HTTP endpoints | Add `@convex-dev/ratelimiter`: 60 requests/min per agentId |
| H3 | No rate limiting on checkpoint approve/reject | Add `@convex-dev/ratelimiter`: 10 requests/min per userId |
| M4 | No audit trail for checkpoint approvals + token rotations | Log to a `auditLog` table: `{ actor, action, targetId, timestamp }` |
| M5 | Checkpoint approve/reject — no workspace membership check | Verify `approvedBy` user is a member of the mission's workspace before patching |

---

## RBAC Summary

| Actor | Can Read | Can Write | Cannot Access |
|-------|----------|-----------|---------------|
| Agent (DB token) | Own operations, own mission brief, sibling op names+status, own system prompt | Own operation status/output/error/artifacts | Other agents' tokens, other missions, user profiles, billing |
| Human (Clerk) | All missions/ops/agents in workspace | Create missions, manage agents, approve/reject checkpoints | Agent tokens (printed once at creation) |
| Architect AI | Workspace agents list, roles/personas/frameworks/skills catalog (via RAG) | Proposes mission structure (human confirms before commit) | Nothing directly |
| System (internal) | Everything | Status transitions, progress, dependency resolution | N/A |

**Enforcement points:**
- Agent HTTP endpoints: `requireAgentAuth` + `assignedAgentId === agent._id` on every operation access
- Human mutations: Clerk auth + workspace membership
- Architect commit: Clerk auth + proposal validation before any DB write
- `getMissionContext`: agent must have at least one operation in the mission

---

## Minimum Viable Build (First Working End-to-End)

The absolute minimum to see the system work:

**Tables:** `skills` + `customRoles` + `customPersonas` + `agents` + `missions` + `operations`

**Functions:**
1. `seed.systemData` — seed roles, personas, skills
2. `agents.createAgent` — create one agent with token
3. `missions.createFromProposal` — create mission with operations
4. `POST /agent/operations/claim` — agent claims work + gets system prompt
5. `POST /agent/operations/complete` — agent submits output
6. `internal.orchestration.onOperationCompleted` — unblocks downstream

**CLI:**
- `orchestrate.py create-agent` + `create-mission` + `list-ops`

**Skip for first test:** checkpoints, Architect UI, customFrameworks custom creation (seed data is enough), RAG activation.

Once one real delegation works (Architect creates mission → agent claims operation → completes → downstream unblocks), add Architect UI and checkpoint flow.

---

## File Map

```
convex/
  schema.ts                     MODIFY — add 9 new tables
  seed.ts                       PORT + AUDIT — system roles, personas, frameworks, skills
  missions.ts                   PORT as-is
  operations.ts                 PORT as-is
  agents.ts                     PORT + EXTEND — add token mutations
  skills.ts                     PORT as-is
  architectSessions.ts          PORT as-is
  checkpoints.ts                BUILD — approve, reject, listByMission
  orchestration.ts              BUILD — onOperationCompleted, onCheckpointApproved
  http.ts                       BUILD — httpRouter + agent endpoints + checkpoint endpoints
  architect.ts                  BUILD — createSession, addMessage, commitPlan, getSessionWithMessages, listSessions
  schemas/
    architect.ts                PORT as-is
  lib/
    auth.ts                     PORT as-is
    workspace.ts                PORT as-is
    agentAuth.ts                BUILD — requireAgentAuth + timingSafeEqualV8
    agentComposer.ts            BUILD — composeAgentSystemPrompt

lib/
  architect/
    schemas.ts                  PORT as-is (Zod discriminated union)
    prompts.ts                  PORT as-is (already targets json-render SpecStream)

app/
  api/
    architect/
      chat/route.ts             PORT as-is + complexity router addition
  (dashboard)/
    architect/
      page.tsx                  BUILD — two-panel Architect admin UI
      _components/
        session-list.tsx        BUILD
        chat-interface.tsx      BUILD (json-render SpecStream rendering)
        plan-confirm-modal.tsx  BUILD
    missions/
      page.tsx                  BUILD — mission list (Phase 6.5)
      [missionId]/
        page.tsx                BUILD — mission detail + ops + checkpoint buttons (Phase 6.5)

scripts/
  orchestrate.py                BUILD — CLI for human orchestration + integration testing
```

---

## Phase Dependencies

```
Phase 0 (json-render install + SpecStream verify)
  → Phase 6 (Architect UI — needs json-render confirmed)

Phase 0.5 (auth field mapping)
  → Phase 2 (all ported functions need adaptation applied)

Phase 1 (schema)
  → Phase 2 (port functions)
  → Phase 3 (seed data)
  → Phase 4 (agent auth + composer)
    → Phase 8 (execution engine — HTTP endpoints) [MVP]
      → Phase 9 (checkpoints) [POST-MVP]
        → Phase 10 (HTTP router) [POST-MVP]
          → Phase 11 (CLI) [POST-MVP]
    → Phase 7 (agent CRUD — token mutations) [POST-MVP]
  → Phase 5 (RAG activation) [POST-MVP]
    → Phase 6 (Architect — RAG injection, post-MVP upgrade)

Phase 6 (Architect commitPlan)
  → Phase 6.5 (Mission Board — needs committed missions to display)

Phase 12 (Changelog Monitor) — FUTURE, non-blocking
  → Requires Phase 8 (execution engine)
  → Runs independently as a background cron mission after core orchestration is live
```

---

## Complexity Summary

| Phase | What | Complexity | Type | Blocker | MVP? |
|-------|------|------------|------|---------|------|
| 0 | json-render install + SpecStream verify | S | Install + verify | None | YES |
| 0.5 | Auth field mapping | S | Research + doc | None | YES |
| 1 | Schema — 9 tables | M | Port | 0 | YES |
| 2 | Port Convex functions | M | Port | 0.5, 1 | YES |
| 3 | Seed data | S | Port + audit | 2 | YES |
| 4 | Agent auth + composer | S | Build | 2 | YES |
| 6 | Architect chat + json-render UI | L | Port + Build | 0, 2 | YES |
| 6.5 | Mission Board (read-only + checkpoint buttons) | M | Build | 6 | YES |
| 8 | Execution engine (HTTP + dep resolution) | M | Build | 4 | YES |
| 5 | @convex-dev/rag + complexity router | S | Wire + Build | 2 | NO |
| 7 | Agent CRUD (token mutations) | M | Port + Extend | 2, 4 | NO |
| 9 | Checkpoints Convex mutations | S | Build | 1, 8 | NO |
| 10 | HTTP router wiring | S | Build | 8, 9 | NO |
| 11 | Python CLI | M | Build | 3, 7, 8, 10 | NO |
| 12 | Changelog Monitor (FUTURE) | M | Build | 8 | NO |

**Total: 1 L + 5 M + 6 S. Estimated build time: 10–14 focused hours (MVP with Phase 8: 8–10h, post-MVP phases: 2–4h additional).**

S = <1h, M = 1–2h, L = 2–4h

The 80% port ratio from vantage-studio holds. Greenfield work is limited to: execution engine (Phase 8), agent auth helpers (Phase 4), checkpoints.ts (Phase 9), Architect UI (Phase 6 frontend portion), Mission Board (Phase 6.5).

---

## Pre-Ship Checklist

Must-fix before shipping to buyers. These are UX gaps that will confuse or block first-time users.

| # | Issue | Fix | Effort |
|---|-------|-----|--------|
| 1 | No onboarding into agentic concepts — first-time buyers won't understand Roles/Personas/Missions | Build a 3-screen explainer modal on first login: what an Agent is, what a Mission is, how the Architect works | 2h |
| 2 | `SETUP.md` references Next.js 14 — wrong version | Update version string to 15.x in SETUP.md | 5 min |
| 3 | Empty state on first login — no agents, no missions, no seed data visible | Auto-trigger `seed.systemData` on workspace creation; show populated catalog immediately | 30 min |
| 4 | Checkpoint reject = silent mission kill — no confirmation | Add a destructive action confirmation modal before `rejectCheckpoint`: "This will permanently fail the mission. There is no undo." | 1h |
| 5 | No sidebar nav to Architect or Missions pages — features are unreachable from the dashboard | Add placeholder nav items: Architect, Missions, Agents. Link to Phase 6 and 6.5 routes | 30 min |
| 6 | Agent token shown nowhere after creation — buyer cannot configure their real agent | Add a modal on agent creation that displays the token with a copy button. "Save this token — it will not be shown again." | 1h |

---

## Strategic Decisions

Locked choices that shaped the architecture. Reference before changing anything.

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Include Phase 8 in MVP | Yes | Without execution, "born agentic" is a lie. Every operation stays `"pending"` forever. The demo is a mockup, not a product. |
| Architect as hero feature | No — Feature #3 | Hero headline stays "Born agentic." Architect gets full-width demo GIF and dedicated section. Vibe coders see AI features first; builders discover orchestration on scroll. |
| Progressive disclosure | Yes | Surface AI features at the top. Architect/orchestration lives deeper. Two audiences, one product. |
| Pricing | $99 | Undercutting ShipFast ($299) and Supastarter ($299). Lower barrier = faster initial traction. |
| Competitive window | 3–6 months | No competing boilerplate has agentic orchestration + checkpoint gates. Window closes when they catch up. |
| Best pitch | "ShipFast gives you a login page. VantageStarter gives you an AI operations center." | Positions against the category leader, not against no-name competitors. |

---

## Key Design Decisions

**1. Next.js 15 already at 15.3.9 — no upgrade needed**
Phase 0 was originally the Next.js upgrade. That work is done. Phase 0 is now json-render install + SpecStream verification — the actual unresolved dependency before building.

**2. json-render for all plan rendering**
The Architect doesn't stream text — it streams structured plans that the client renders as interactive cards. json-render SpecStream is the correct abstraction. The vantage-studio architect prompts already target this format — port without modification.

**3. Complexity router saves cost at scale**
Listing agents, checking mission status, simple factual queries = Haiku. Plan generation, agent design, dependency reasoning = Sonnet. One classification call saves 10x token cost on simple queries.

**4. @convex-dev/rag over Vercel Sandbox**
Already wired in VantageStarter. No new infrastructure. Vercel Sandbox is a heavier dependency with different lifecycle semantics. Deferred to post-MVP.

**5. Per-agent tokens over shared API key**
No auditability, no scoping, no revocability with a shared key. Per-agent tokens solve all three. Cost: one extra DB lookup per request — acceptable.

**6. `commitPlan` is atomic AND owns initial status logic**
Architect proposes → human confirms → everything (mission + operations + checkpoints) written in a single internalMutation. `blocked`/`pending` initial status is set here, not in the execution engine. Splitting this logic would force a rewrite.

**7. `onOperationCompleted` checks for checkpoint BEFORE unblocking**
Branch order matters: checkpoint check first, downstream unblocking second. Reversing this order would defeat checkpoints by unblocking ops before human approval.

**8. Agents poll, not push (MVP)**
Assigned agents poll `GET /agent/operations/pending`. No push notification infrastructure needed for MVP. Real-time updates via Convex reactive queries handle the UI side.

**9. Token storage is plain, not hashed (MVP)**
Convex DB is at-rest encrypted. Hashing would require bcrypt in an action on every auth call — latency not justified. HMAC-SHA256 hashing with env var key is the post-MVP upgrade path (see Security Fixes, H1).

**10. V8-safe timing-safe comparison**
`node:crypto`'s `timingSafeEqual` is not available in Convex's V8 runtime. Manual XOR over `Uint8Array` is the correct replacement. Simple `===` is not acceptable — it short-circuits and leaks timing info.

**11. Rejection is a hard kill (MVP simplification)**
`rejectCheckpoint` sets `mission.status = "failed"` with no recovery. A revision flow (reset operations, allow re-execution) is explicitly flagged as post-MVP. The code should have a comment documenting this so the next engineer knows it's intentional.

---

## Phase 12 — Changelog Monitor (Complexity: M, FUTURE — not blocking core orchestration)

**Prerequisite:** Phase 8 (execution engine) complete. Phase 12 runs independently as a background cron mission.

Automated dependency drift detection. The boilerplate monitors its own tech stack for updates using its own orchestration infrastructure.

### What it does

A Convex cron job fires weekly. It spawns a mission with one operation per dependency. Each operation delegates to a specialized agent for analysis. Output is a structured report per dependency. A human checkpoint gates any upgrade action.

### Step 12.1 — Convex cron job

```typescript
// convex/crons.ts
crons.weekly("changelog-monitor", { dayOfWeek: "monday", hourUTC: 6, minuteUTC: 0 },
  internal.changelogMonitor.run
);
```

### Step 12.2 — Firecrawl scrape targets

Dependencies monitored:

| Dependency | Changelog URL |
|-----------|--------------|
| Next.js | github.com/vercel/next.js/releases |
| React | github.com/facebook/react/releases |
| Convex | news.convex.dev + github.com/get-convex/convex-backend/releases |
| Clerk | clerk.com/changelog |
| Polar | polar.sh/changelog |
| AI SDK | sdk.vercel.ai/docs/changelog |
| json-render | github.com/vercel/json-render/releases |
| fal.ai | fal.ai/changelog |
| Firecrawl | github.com/mendableai/firecrawl/releases |
| shadcn/ui | ui.shadcn.com/docs/changelog |
| Tailwind | tailwindcss.com/blog |

### Step 12.3 — Agent delegation

For each dependency scraped, delegate analysis to:

- `dev-senior-dev` — breaking changes impact analysis (what breaks in our codebase)
- `dev-sentinel` — CVE / security advisory detection
- `dev-tech-researcher` — new features worth adopting

### Step 12.4 — Output format per dependency

```json
{
  "dependency": "next",
  "currentVersion": "15.0.4",
  "latestVersion": "15.2.1",
  "breakingChanges": ["..."],
  "relevantNewFeatures": ["..."],
  "upgradeEffort": "S",
  "recommendation": "upgrade now | wait | skip"
}
```

`upgradeEffort` scale: S = <1h mechanical, M = 1–4h with testing, L = >4h with risk.

### Step 12.5 — Human checkpoint

After report generation, a checkpoint blocks automatic action. Human reviews the report and approves or rejects each upgrade recommendation individually.

No upgrade is executed automatically. The monitor informs — it does not act.

**Why this matters:**
- The changelog monitor uses the orchestration system's own infrastructure — the product monitors itself
- No competing boilerplate has this
- Demonstrates the agent execution loop in a real production use case visible to every buyer

**Estimated complexity:** M — Convex cron + Firecrawl action + report template. Builds on Phase 8. Does not block Phases 1–11.

---

## Hackathon Context

The ElevenLabs x Firecrawl hackathon ("Combine Firecrawl Search with ElevenAgents") runs until ~March 26. The hackathon app will be built ON VantageStarter, demonstrating the orchestration system in production. The app concept and the boilerplate development are AND, not OR — they happen in parallel.
