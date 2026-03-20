# Orchestration Gap Analysis — vantage-studio → vantage-starter

Date: 2026-03-20
Source: vantage-studio codebase audit against ORCHESTRATION-PLAN.md requirements

---

## Executive Summary

vantage-studio has built the full data layer and planning UI. It has NOT built the execution engine. That is the only major gap. The porting effort is primarily copy + adapter work, not greenfield architecture.

**Total effort breakdown:**
- Port as-is: ~70% of the work is done
- Needs modification: ~20% (adapter layer, per-agent auth, starter-specific adjustments)
- Must build from scratch: ~10% (execution engine only)

---

## Component-by-Component Analysis

### Schema Tables

| Component | Status | Notes |
|-----------|--------|-------|
| `skills` | EXISTS — port as-is | Identical to ORCHESTRATION-PLAN spec. 6 categories, system + workspace visibility, `isSystem`, `slug`, `usageCount`. |
| `agents` | EXISTS — needs modification | Schema matches but missing `token` field (per-agent auth). Add `v.optional(v.string())` field `token`. Rest ports verbatim. |
| `customRoles` | EXISTS — port as-is | Full field set present: name, icon, description, category, expertise[], systemPrompt, isSystem. |
| `customPersonas` | EXISTS — port as-is | Full field set: name, icon, traits[], communicationStyle, decisionMaking, systemPromptModifier, isSystem. |
| `customFrameworks` | EXISTS — port as-is | Full field set: name, icon, methodology, bestFor[], steps[], systemPromptModifier, isSystem. |
| `missions` | EXISTS — port as-is | 5-status lifecycle (brainstorm→plan→execute→validate→complete), intent, structure, priority, successCriteria[], progress. All fields present. |
| `operations` | EXISTS — port as-is | Correct 2-type model (ai/human), 6-status lifecycle including `blocked` and `awaiting_review`, dependsOn[], assignedAgentId, requiredTools[], requiresReview, prompt, output fields. |
| `checkpoints` | EXISTS — port as-is | afterOperationId, description, status (pending/approved/rejected), approvedBy, rejectionReason. Complete. |
| `architectSessions` | EXISTS — port as-is | workspaceId, existingMissionId, missionContext object, status, projectId. Composite indexes present. |
| `architectMessages` | EXISTS — port as-is | sessionId, role, content, composite index by_session_created for ordered retrieval. |

**Schema gap:** `agents` table is missing the `token` field for per-agent HTTP auth. One line addition.

---

### Convex Functions

| Component | Status | Notes |
|-----------|--------|-------|
| `missions.ts` | EXISTS — port as-is | Full CRUD: create, update, updateStatus, archive, markComplete, updateBrief, assignToProject, remove. Plus `createFromProposal` and `addOperationsFromProposal` — the two Architect mutations that atomically create missions + operations + checkpoints with dependency ID remapping. These are production-grade. |
| `operations.ts` | EXISTS — port as-is | Full CRUD: create, update, updateStatus, clearAgentAssignment, remove. listByMission, listByMissionGrouped, listAll with workspace-scoped filtering, getStatsByMission. Status timestamps (startedAt, completedAt) handled. |
| `agents.ts` | EXISTS — port as-is | list, get, listSystem, listForAssignment, create, update, remove (soft delete), incrementUsage. |
| `skills.ts` | EXISTS — port as-is | Full CRUD + importFromUrl action (parses SKILL.md format from GitHub raw URLs). listByCategory. |
| `architectSessions.ts` | EXISTS — port as-is | create, get, getMessages, addMessage, updateProposal, complete, listRecent (paginated), updateTitle, remove. |
| `checkpoints.ts` | MISSING — must build | No standalone checkpoints.ts exists. Checkpoint creation is embedded inside `missions.createFromProposal`. Need: `approve`, `reject`, `listByMission` functions. |
| `orchestration.ts` | MISSING — must build | No dependency resolution engine exists. No function that reads `dependsOn`, checks all deps are `completed`, then unblocks operations. |
| `lib/auth.ts` | EXISTS — port as-is | requireAuth, validateWorkspaceAccess, getWorkspaceContext, getOrCreateUser. The full auth helper stack is complete and follows Convex Master patterns. |
| `lib/workspace.ts` | EXISTS — port as-is | validateWorkspaceAccess with role-based result (owner/admin/editor/viewer), canWrite flag. |
| `schemas/architect.ts` | EXISTS — port as-is | operationProposalValidator, checkpointProposalValidator, missionProposalValidator — Zod schemas AND Convex validators both present in lib/architect/schemas.ts and convex/schemas/architect.ts. |

---

### API Routes

| Component | Status | Notes |
|-----------|--------|-------|
| `app/api/architect/chat/route.ts` | EXISTS — needs modification | Full implementation: session load, history load, KB search injection, streamText with Claude Sonnet 4.5, saves user message pre-stream. Uses json-render SpecStream format for structured output. **Must modify:** json-render is vantage-studio's proprietary rendering system. vantage-starter likely uses a different rendering approach. Core streaming logic is portable; UI rendering layer needs adapter. |
| Agent execution endpoint | MISSING — must build | No HTTP endpoint exists for agents to claim operations, report progress, or submit output. This is the #1 missing piece. |
| Checkpoint approval endpoint | MISSING — must build | No endpoint for humans to approve/reject checkpoints via the UI. |
| `convex/http.ts` | MISSING — must build | No HTTP router file. Agent endpoints require httpRouter + httpAction. |

---

### Execution Engine

**This is the only full greenfield build required.**

What exists: zero. The operations table has `status`, `prompt`, `output`, `assignedAgentId` fields. Nothing reads those fields and triggers AI work.

What must be built:

1. **`convex/http.ts`** — httpRouter with agent-facing endpoints:
   - `POST /agent/claim` — agent claims an operation, sets status → `in_progress`
   - `POST /agent/complete` — agent submits output, sets status → `completed` or `awaiting_review`
   - `POST /agent/fail` — agent reports error, sets status → `failed`
   - `POST /checkpoint/approve` — human approves checkpoint, unblocks downstream ops
   - `POST /checkpoint/reject` — human rejects, operation goes back to pending

2. **`convex/orchestration.ts`** — dependency resolution:
   - `internalMutation resolveDependencies(missionId)` — after any operation completes, check all `blocked` or `pending` ops in the mission; if their `dependsOn` are all `completed`, set them to `pending` (ready to claim)
   - Called from the agent `/complete` endpoint

3. **Per-agent token auth** — `convex/lib/agentAuth.ts`:
   - `authenticateAgent(agentId, token)` — constant-time token comparison, returns agent row or throws
   - Scope check: agent can only claim operations where `assignedAgentId === agent._id`

4. **`convex/checkpoints.ts`** — standalone checkpoint mutations:
   - `approve(checkpointId, reason?)` — sets approved, triggers resolveDependencies for ops after this checkpoint
   - `reject(checkpointId, reason)` — sets rejected
   - `listByMission(missionId)` — with status filter

---

### UI / App Pages

| Component | Status | Notes |
|-----------|--------|-------|
| Architect chat page | EXISTS in vantage-studio — needs port | `app/(factory)/workspace/[workspaceId]/architect/[sessionId]/page.tsx` exists. Uses json-render SpecStream. Port requires adapting the rendering system to whatever vantage-starter uses. The session management, streaming, and Convex mutations are portable. |
| Agent management pages | UNKNOWN | Not audited — check `app/(factory)/workspace/[workspaceId]/` for agents/ and skills/ pages. Likely exists given the full Convex layer is there. |
| Mission board | UNKNOWN | Check for missions/ page in the workspace routes. |
| Operations view | UNKNOWN | Check for operations/ page. |

---

### Seed Data

| Component | Status | Notes |
|-----------|--------|-------|
| `convex/seed.ts` | EXISTS — review before porting | 421 lines. Contains system agents, skills, roles, personas, frameworks. This is critical — it's what makes the product usable on first login. Need to audit which seeds are vantage-studio-specific vs generic. |
| `convex/seed/seedActionFlows.ts` | EXISTS — skip | Action flows are not part of the orchestration system. |

---

### Client-Side Architect Logic

| Component | Status | Notes |
|-----------|--------|-------|
| `lib/architect/prompts.ts` | EXISTS — needs modification | Full system prompt for new mission and add-operations flows. Uses json-render SpecStream output format. The prompt logic is solid; the output format instruction must be changed to match vantage-starter's rendering approach. |
| `lib/architect/schemas.ts` | EXISTS — port as-is | Zod schemas for OperationProposal, MissionProposal, ArchitectOutput discriminated union. No vantage-studio dependencies. Direct copy. |

---

## The Critical Missing Piece: Execution Engine

vantage-studio is a **planning system** — it can plan missions, create operations, assign agents. It cannot execute them. There is no code anywhere that:

- Watches for `pending` operations with all deps met
- Pushes them to an AI model
- Saves the output back
- Advances the status machine

This was Sprint 4's scope in vantage-studio and was never built.

**For vantage-starter, the execution model should be:**

```
Agent claims operation via HTTP POST /agent/claim
  → sets status = in_progress
  → Agent runs its work (external to Convex)
  → Agent POSTs output to /agent/complete
    → if requiresReview: status = awaiting_review
    → else: status = completed → trigger resolveDependencies
      → resolveDependencies: unblock ops whose all dependsOn are completed
        → newly unblocked ops notify assigned agents (via Convex reactive query or polling)
```

The "notify" mechanism for vantage-starter can be simple: assigned agents poll `GET /agent/operations?agentId=X&status=pending`. No push needed for MVP.

---

## Revised Build Plan

### Phase 1 — Schema (1–2 hours)
Port schema tables verbatim. Add `token: v.optional(v.string())` to `agents` table. No other changes.

### Phase 2 — Convex Functions (2–3 hours)
Port these files directly (copy + adjust imports):
- `convex/missions.ts`
- `convex/operations.ts`
- `convex/agents.ts`
- `convex/skills.ts`
- `convex/architectSessions.ts`
- `convex/schemas/architect.ts`
- `convex/lib/auth.ts`
- `convex/lib/workspace.ts`

Build from scratch:
- `convex/checkpoints.ts` (approve, reject, listByMission)

### Phase 3 — Execution Engine (3–4 hours)
Build from scratch — this is the only true greenfield work:
- `convex/lib/agentAuth.ts`
- `convex/orchestration.ts` (resolveDependencies internalMutation)
- `convex/http.ts` (httpRouter + agent endpoints + checkpoint endpoints)

### Phase 4 — Architect API Route (1–2 hours)
Port `app/api/architect/chat/route.ts`. Replace json-render output format instruction with vantage-starter's approach (plain JSON or structured text). Core streaming logic unchanged.

### Phase 5 — Seed Data (1 hour)
Port `convex/seed.ts` — audit for vantage-studio-specific content, keep system agents/skills/roles/personas/frameworks.

### Phase 6 — UI Pages (separate sprint)
Architect UI, agent management, mission board — these depend on vantage-starter's design system. Route to `dev-frontend` + `impeccable` skills for execution.

---

## Total Effort Estimate

| Phase | Effort | Type |
|-------|--------|------|
| Schema | 1–2h | Port |
| Convex functions | 2–3h | Port |
| Execution engine | 3–4h | Greenfield |
| Architect API route | 1–2h | Port + adapt |
| Seed data | 1h | Port + audit |
| **Total (backend)** | **8–12h** | |

This is not a week of work. It's 2 focused days if done sequentially, 1 day if parallelized across agents.

The original estimate of "building from scratch" was wrong. 80% of the hard architectural work exists in vantage-studio and is directly portable.
