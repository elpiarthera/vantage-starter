# Org-Scoping Audit — Group C

Commit audited: `59769a4` (main). Read-only, no code changed.

Files: `convex/architectSessions.ts`, `convex/checkpoints.ts`, `convex/consultantProjects.ts`,
`convex/credits.ts`, `convex/customFrameworks.ts`, `convex/customPersonas.ts`,
`convex/customRoles.ts`, `convex/memory.ts`, `convex/messages.ts`, `convex/operations.ts`,
`convex/rateLimits.ts`, `convex/subscriptions.ts`.

## Derived function count

```
$ grep -nE '^export const [a-zA-Z0-9_]+ = (query|mutation|action)\(' convex/<file>.ts
```

| file | count | names (line) |
|---|---|---|
| architectSessions.ts | 8 | create:19, addMessage:59, complete:91, updateTitle:111, remove:130, get:154, getMessages:170, listRecent:189 |
| checkpoints.ts | 6 | listByMission:27, get:57, listPendingByMission:72, approve:102, reject:148, create:193 |
| consultantProjects.ts | 6 | create:77, update:121, updateStatus:180, addCompetitor:223, get:390, list:432 |
| credits.ts | 7 | getUserCredits:31, hasEnoughCredits:314, getCreditCost:373, listCreditCostsByTypes:404, getTransactionHistory:421, deductCreditsPublic:968, refundCreditsPublic:1074 |
| customFrameworks.ts | 5 | list:48, get:102, create:140, update:204, remove:245 |
| customPersonas.ts | 5 | list:48, get:98, create:136, update:200, remove:255 |
| customRoles.ts | 5 | list:47, get:102, create:141, update:203, remove:244 |
| memory.ts | 3 | listMemories:93, readMemory:174, deleteAllMemories:285 |
| messages.ts | 5 | list:81, getById:111, save:144, update:205, deleteAfterTimestamp:252 |
| operations.ts | 10 | listByMission:26, listByMissionGrouped:49, getStatsByMission:77, get:147, listAll:163, create:229, updateStatus:293, remove:329, update:353, clearAgentAssignment:418 |
| rateLimits.ts | 1 | deductCreditsRateLimited:68 |
| subscriptions.ts | 2 | getByClerkUserId:20, getFormattedSubscription:62 |
| **TOTAL** | **63** | rows below = 63 |

`internalQuery`/`internalMutation`/`internalAction` excluded per brief (getForOwnerCheck, updateBrandKit,
updateCompetitorProfile, addCredits, deductCredits, refundCredits, getTransaction, addPurchaseCredits,
addMonthlyRenewalCredits(Fixed), initializeForSubscription, getFile, getCoreMemory, createMemory,
replaceInMemory, searchMemory, deleteMemory, getById(ops-internal), getDepStatuses, getPendingForAgent,
getSiblingStatuses, agentHasMissionAccess, getMissionContextOps, claimInternal, completeInternal,
failInternal, addCreditsRateLimited, checkAiStreamingRateLimit, create/updateTier/updateTierByWebhook/cancel
in subscriptions.ts).

## Rows

### architectSessions.ts

| function | file:line | auth path (verbatim) | table | scoped by | verdict |
|---|---|---|---|---|---|
| create | architectSessions.ts:19 | `requireAuth(ctx)` then `requireAuthWithWorkspace(ctx, args.workspaceId)` | architectSessions (insert) | workspace ownership/org-membership check in `requireAuthWithWorkspace`; `createdBy: user.clerkUserId` set server-side | SCOPED |
| addMessage | architectSessions.ts:59 | `requireAuth` + `requireAuthWithWorkspace(ctx, session.workspaceId)` + explicit `session.createdBy !== user.clerkUserId` check | architectMessages (insert), architectSessions (patch) | workspace check + creator-equality check on the fetched session | SCOPED |
| complete | architectSessions.ts:91 | `requireAuth` + `session.createdBy !== user.clerkUserId` throw + `requireAuthWithWorkspace` | architectSessions (patch) | creator check + workspace check on fetched row | SCOPED |
| updateTitle | architectSessions.ts:111 | same pattern as `complete` | architectSessions (patch) | creator check + workspace check | SCOPED |
| remove | architectSessions.ts:130 | same pattern as `complete` | architectSessions + architectMessages (delete) | creator check + workspace check before cascade delete | SCOPED |
| get | architectSessions.ts:154 | raw `ctx.auth.getUserIdentity()`; `if (session.createdBy !== identity.subject) return null` | architectSessions (read by id) | ownership check directly on fetched row's `createdBy` field (not workspace-index, but equivalent single-owner scoping since `architectSessions` has no org column) | SCOPED |
| getMessages | architectSessions.ts:170 | same pattern as `get` | architectMessages (read via session) | ownership check on parent session's `createdBy` | SCOPED |
| listRecent | architectSessions.ts:189 | raw `ctx.auth.getUserIdentity()`; query `by_workspace_created` index then `.filter(createdBy === identity.subject)` | architectSessions (list) | workspace index eq + in-memory filter on `createdBy`. Note: caller supplies `workspaceId` directly with **no workspace-membership check** — an authenticated user who knows/guesses any workspaceId still only gets rows they themselves created there (filter is on `createdBy`, their own subject), so no cross-tenant data is returned even though workspace membership itself isn't re-verified | SCOPED |

### checkpoints.ts

| function | file:line | auth path | table | scoped by | verdict |
|---|---|---|---|---|---|
| listByMission | checkpoints.ts:27 | `requireAuthWithWorkspace(ctx, mission.workspaceId)` (mission fetched first) | checkpoints (by_mission) | workspace ownership/org check on the mission's workspace | SCOPED |
| get | checkpoints.ts:57 | fetch checkpoint → fetch mission → `requireAuthWithWorkspace(ctx, mission.workspaceId)` | checkpoints (read by id) | full ownership chain checkpoint→mission→workspace before returning | SCOPED |
| listPendingByMission | checkpoints.ts:72 | `requireAuthWithWorkspace(ctx, mission.workspaceId)` | checkpoints (by_mission_status) | workspace check | SCOPED |
| approve | checkpoints.ts:102 | fetch checkpoint → fetch mission → `requireAuthWithWorkspace` | checkpoints (patch) | workspace check + `approvedBy` set from resolved user | SCOPED |
| reject | checkpoints.ts:148 | fetch checkpoint → fetch mission → `requireAuthWithWorkspace` | checkpoints + missions (patch, hard-kill) | workspace check before mutating both mission and checkpoint | SCOPED |
| create | checkpoints.ts:193 | fetch mission → `requireAuthWithWorkspace` + verify `operation.missionId === args.missionId` | checkpoints (insert) | workspace check + operation-belongs-to-mission check | SCOPED |

### consultantProjects.ts

| function | file:line | auth path | table | scoped by | verdict |
|---|---|---|---|---|---|
| create | consultantProjects.ts:77 | `requireAuthWithWorkspace(ctx, args.workspaceId)` | consultantProjects (insert) | workspace check; `createdBy` set server-side | SCOPED |
| update | consultantProjects.ts:121 | `requireAuth` + `project.createdBy !== user.clerkUserId` throw | consultantProjects (patch) | creator-equality check on fetched row (no workspace re-check, but creator is sufficient — a project has exactly one creator) | SCOPED |
| updateStatus | consultantProjects.ts:180 | same creator check as `update` | consultantProjects (patch) | creator check | SCOPED |
| addCompetitor | consultantProjects.ts:223 | same creator check | consultantProjects (patch, array append) | creator check | SCOPED |
| get | consultantProjects.ts:390 | raw `ctx.auth.getUserIdentity()`; explicit `isCreator \|\| isOwner \|\| isOrgMember` computed from fetched workspace + users-table lookup | consultantProjects (read by id) | creator OR workspace-owner OR `workspace.organizationId === user.organizationId` — full org-scoped check | SCOPED |
| list | consultantProjects.ts:432 | raw `ctx.auth.getUserIdentity()`; `isOwner \|\| user.organizationId === workspace.organizationId` before querying | consultantProjects (by_workspace index) | workspace-owner or org-membership check performed before the indexed query runs | SCOPED |

### credits.ts

| function | file:line | auth path (verbatim) | table | scoped by | verdict |
|---|---|---|---|---|---|
| getUserCredits | credits.ts:31 | **none** — handler starts directly with `const { clerkUserId } = args;`, no `ctx.auth.getUserIdentity()` call anywhere in the function | userCredits (by_clerk_user), systemConfig | none | **UNSCOPED-DEFECT** — any caller (including an unauthenticated Convex client) can pass an arbitrary `clerkUserId` string and read that user's `balance`, `totalPurchased`, `totalUsed`, `totalBonusReceived`, `subscriptionTier`. Concrete scenario: user A calls `getUserCredits({ clerkUserId: "<user B's clerkUserId>" })` (clerkUserId values are not secret — visible in URLs, webhooks, shared links) and receives B's full credit balance and subscription tier. |
| hasEnoughCredits | credits.ts:314 | **none** — no auth call | userCredits (by_clerk_user), creditCosts | none | **UNSCOPED-DEFECT** — same shape as `getUserCredits`: caller supplies any `clerkUserId` and learns that user's exact `balance` in the response (`{ hasEnough, balance, required }`), no ownership check at all. |
| getCreditCost | credits.ts:373 | none | creditCosts (by_action_type) — global config table, no user/org column | n/a — no user data returned | PUBLIC-BY-DESIGN — `creditCosts` is a platform-wide pricing table (no `clerkUserId`/org column in schema), safe to expose to any caller |
| listCreditCostsByTypes | credits.ts:404 | none | creditCosts (`.collect()` + filter) | n/a — same global config table | PUBLIC-BY-DESIGN |
| getTransactionHistory | credits.ts:421 | **none** — no auth call | creditTransactions (by_user_and_timestamp) | none | **UNSCOPED-DEFECT** — caller passes arbitrary `clerkUserId` and receives that user's full transaction history (amounts, descriptions, resourceIds, `polarOrderId`). Concrete scenario: user A calls `getTransactionHistory({ clerkUserId: "<user B>" })` and reads B's entire billing/usage audit trail. |
| deductCreditsPublic | credits.ts:968 | raw `ctx.auth.getUserIdentity()` + `if (identity.subject !== args.clerkUserId) throw new Error("Unauthorized")` | userCredits (patch), creditTransactions (insert) | explicit self-only equality check before any mutation | SCOPED |
| refundCreditsPublic | credits.ts:1074 | raw `ctx.auth.getUserIdentity()` + ownership check `originalTransaction.clerkUserId !== identity.subject` throw | creditTransactions (read + insert), userCredits (patch) | ownership check on the fetched transaction row before refunding | SCOPED |

**credits.ts is the file the brief flagged for extra care, and it is where the real defects are.** The three UNSCOPED-DEFECT queries are the read-side of exactly the same `clerkUserId`-as-arg pattern that the two mutations correctly gate — `deductCreditsPublic`/`refundCreditsPublic` both add `identity.subject !== args.clerkUserId` checks, but `getUserCredits`, `hasEnoughCredits`, and `getTransactionHistory` never got the equivalent check. This is a balance/quota/history disclosure bug, not (yet) a balance-mutation bug — but it directly undermines the mutation-side hardening: any tenant can read any other tenant's exact credit position and spend history for free.

### customFrameworks.ts / customPersonas.ts / customRoles.ts (identical shape — one row block each)

| function | file:line | auth path | table | scoped by | verdict |
|---|---|---|---|---|---|
| customFrameworks.list | customFrameworks.ts:48 | `requireAuth(ctx).catch(() => null)`; if null return system-only rows | customFrameworks (by_system, then by_workspace) | workspace resolved via `by_owner_and_default` or `by_organization`; only system rows + own-workspace rows returned | SCOPED (system rows are intentionally public-by-design within this SCOPED query; no cross-tenant workspace row leaks) |
| customFrameworks.get | customFrameworks.ts:102 | `requireAuth(ctx).catch(() => null)`; if not system, fetch workspace and check `isOwner \|\| isOrgMember` | customFrameworks (read by id) | explicit workspace ownership/org check for non-system rows | SCOPED |
| customFrameworks.create | customFrameworks.ts:140 | `requireAuth(ctx)` + rate limit + workspace resolved via `by_owner_and_default` | customFrameworks (insert) | inserted row's `workspaceId` is the caller's own resolved workspace, `createdBy` server-set | SCOPED |
| customFrameworks.update | customFrameworks.ts:204 | `requireAuth` + `framework.createdBy !== user.clerkUserId` throw (+ `isSystem` immutability) | customFrameworks (patch) | creator-equality check on fetched row | SCOPED |
| customFrameworks.remove | customFrameworks.ts:245 | same as `update` | customFrameworks (delete) | creator-equality check + system-immutability guard | SCOPED |
| customPersonas.list/get/create/update/remove | customPersonas.ts:48/98/136/200/255 | identical pattern to customFrameworks (requireAuth + workspace/creator checks) | customPersonas | same as above | SCOPED (all 5) |
| customRoles.list/get/create/update/remove | customRoles.ts:47/102/141/203/244 | identical pattern | customRoles | same as above | SCOPED (all 5) |

### memory.ts

| function | file:line | auth path | table | scoped by | verdict |
|---|---|---|---|---|---|
| listMemories | memory.ts:93 | raw `ctx.auth.getUserIdentity()`; query `by_user` index on `identity.subject` | agentMemory (by_user) | index `eq(userId, identity.subject)` — caller cannot request another user's `userId` (the arg `workspaceId` is accepted but unused; `userId` is always derived from the JWT, never taken as an argument) | SCOPED |
| readMemory | memory.ts:174 | raw `ctx.auth.getUserIdentity()`; query `by_user_and_path` on `identity.subject` | agentMemory (by_user_and_path) | same — `userId` always `identity.subject`, `path` is the only client-supplied field | SCOPED |
| deleteAllMemories | memory.ts:285 | raw `ctx.auth.getUserIdentity()`; query + delete `by_user` on `identity.subject` | agentMemory (delete, by_user) | same | SCOPED |

`agentMemory` has no organization column (schema.ts:380-395) — data is inherently per-user, and all three public functions correctly derive `userId` from the identity token rather than accepting it as a client argument (contrast with `credits.ts`, where `clerkUserId` is accepted as an argument and not checked). This is the correct pattern.

### messages.ts

| function | file:line | auth path | table | scoped by | verdict |
|---|---|---|---|---|---|
| list | messages.ts:81 | raw `ctx.auth.getUserIdentity()`; chat→workspace fetched, `if (workspace.ownerId !== identity.subject) return []` | messages (by_chat_created) | ownership chain: message list → chat.workspaceId → workspace.ownerId equality | SCOPED |
| getById | messages.ts:111 | raw `ctx.auth.getUserIdentity()`; message→chat→workspace ownership chain, throws Forbidden | messages (read by id) | full chain check before returning a single message by id — this is exactly the "ID argument fetched via ctx.db.get() without re-checking tenant" pattern the brief calls out, and here it IS re-checked (labeled "B3 FIX" in the file's own comments) | SCOPED |
| save | messages.ts:144 | `requireAuth` + rate limit + chat→workspace fetch + `workspace.ownerId !== user.clerkUserId` throw | messages (insert), chats (patch updatedAt) | ownership check on the target chat's workspace before insert | SCOPED |
| update | messages.ts:205 | `requireAuth` + rate limit + message→chat fetch + `chat.createdBy !== user.clerkUserId` throw | messages (patch) | chat-creator equality check ("H6 FIX" per file comment) before patch | SCOPED |
| deleteAfterTimestamp | messages.ts:252 | `requireAuth` + chat→workspace fetch + `workspace.ownerId !== user.clerkUserId` throw | messages (delete range) | ownership check before the indexed range delete | SCOPED |

Note: workspace scoping here is single-owner (`workspace.ownerId === caller`), not org-member-inclusive like `requireAuthWithWorkspace` elsewhere in this group — the file's own comments flag this as a known TODO ("add member check when workspaceMembers table is added"), not a defect: it is more restrictive than org-scoping, not less, so no cross-tenant leak results.

### operations.ts

| function | file:line | auth path | table | scoped by | verdict |
|---|---|---|---|---|---|
| listByMission | operations.ts:26 | mission fetched first → `requireAuthWithWorkspace(ctx, mission.workspaceId)` | operations (by_mission) | workspace check | SCOPED |
| listByMissionGrouped | operations.ts:49 | same pattern | operations (by_mission) | workspace check | SCOPED |
| getStatsByMission | operations.ts:77 | same pattern | operations (by_mission, aggregated) | workspace check | SCOPED |
| get | operations.ts:147 | `requireAuthWithWorkspace(ctx, operation.workspaceId)` (operation fetched first) | operations (read by id) | workspace check on the fetched row's own `workspaceId` — correct re-check for an ID-argument function | SCOPED |
| listAll | operations.ts:163 | `requireAuthWithWorkspace(ctx, args.workspaceId)` | operations (by_workspace / by_workspace_status) | workspace check before either indexed query path | SCOPED |
| create | operations.ts:229 | `requireAuthWithWorkspace(ctx, args.workspaceId)` | operations (insert) | workspace check; `createdBy` server-set | SCOPED |
| updateStatus | operations.ts:293 | operation fetched → `requireAuthWithWorkspace(ctx, operation.workspaceId)` | operations (patch) | workspace check on fetched row | SCOPED |
| remove | operations.ts:329 | same pattern | operations + checkpoints (cascade delete) | workspace check before cascade | SCOPED |
| update | operations.ts:353 | same pattern | operations (patch) | workspace check on fetched row | SCOPED |
| clearAgentAssignment | operations.ts:418 | same pattern | operations (patch) | workspace check on fetched row | SCOPED |

All 10 public operations.ts functions consistently re-derive `workspaceId` from the fetched row (never trust a client-supplied `workspaceId` alone when an `id` argument is also present) and gate through `requireAuthWithWorkspace`. This is the correct pattern for every ID-argument function in the file.

### rateLimits.ts

| function | file:line | auth path | table | scoped by | verdict |
|---|---|---|---|---|---|
| deductCreditsRateLimited | rateLimits.ts:68 | raw `ctx.auth.getUserIdentity()` + `if (identity.subject !== args.clerkUserId) throw new ConvexError("Unauthorized")`, then rate-limited via `rateLimiter.limit(ctx, "creditMutations", { key: args.clerkUserId })` | userCredits (patch), creditTransactions (insert), systemConfig/creditCosts (read) | self-only equality check before any balance mutation, plus per-user rate-limit key | SCOPED |

### subscriptions.ts

| function | file:line | auth path (verbatim) | table | scoped by | verdict |
|---|---|---|---|---|---|
| getByClerkUserId | subscriptions.ts:20 | **none** — handler starts `const { clerkUserId } = args;`, no `ctx.auth` call anywhere in the function | users (by_clerk_user_id), subscriptions (by_organization_and_status) | none | **UNSCOPED-DEFECT** — any caller supplies an arbitrary `clerkUserId`, the function resolves that user's `organizationId` and returns the full active `subscriptions` row for that organization: `polarSubscriptionId`, `polarCustomerId` (billing PII), `polarProductId`, `status`, `currentPeriodStart/End`, `plan`. Concrete scenario: user A calls `getByClerkUserId({ clerkUserId: "<user B>" })` and receives B's Polar customer ID and subscription/billing state — no relationship to A required. |
| getFormattedSubscription | subscriptions.ts:62 | **none** — same shape, no `ctx.auth` call | users, `polar.listAllUserSubscriptions` (component), subscriptionTiers | none | **UNSCOPED-DEFECT** — identical exposure: caller passes any `clerkUserId`, function resolves `user._id`, calls the Polar component for that user's subscriptions, and returns `polarSubscriptionId`, `polarCustomerId`, `polarProductId`, plan/tier, billing period dates. Same billing-PII disclosure as `getByClerkUserId`, via a different code path (Polar component instead of the `subscriptions` table). |

The file's own top-of-file comments on `create`, `cancel` (both `internalMutation`) explicitly document the threat model this audit is checking for ("A public version of this mutation would let anyone attach an arbitrary Polar subscription/customer ID to any Clerk user by ID" / "anyone cancel any subscription... with no ownership check") — that same reasoning was correctly applied to the two internal mutations but was never applied to the two **public queries** in the same file, which accept the identical `clerkUserId` argument shape with zero ownership check.

## Verdict tally

| verdict | count |
|---|---|
| SCOPED | 56 |
| PUBLIC-BY-DESIGN | 2 |
| UNSCOPED-DEFECT | 5 |
| UNDETERMINED | 0 |
| **TOTAL** | **63** |

Matches the derived function count (63) from the grep table above.

## Every UNSCOPED-DEFECT with concrete cross-tenant scenario

1. **`credits.getUserCredits`** (credits.ts:31) — no auth check at all. Any caller passing `{ clerkUserId: "<victim>" }` reads the victim's `balance`, `totalPurchased`, `totalUsed`, `totalBonusReceived`, `subscriptionTier`.
2. **`credits.hasEnoughCredits`** (credits.ts:314) — no auth check. Any caller passing `{ clerkUserId: "<victim>", actionType }` learns the victim's exact `balance` in the response.
3. **`credits.getTransactionHistory`** (credits.ts:421) — no auth check. Any caller passing `{ clerkUserId: "<victim>" }` reads the victim's entire credit transaction/billing history.
4. **`subscriptions.getByClerkUserId`** (subscriptions.ts:20) — no auth check. Any caller passing `{ clerkUserId: "<victim>" }` reads the victim's organization's active subscription row, including `polarCustomerId` (billing PII).
5. **`subscriptions.getFormattedSubscription`** (subscriptions.ts:62) — no auth check. Any caller passing `{ clerkUserId: "<victim>" }` reads the victim's formatted subscription/plan/billing-period data via the Polar component.

All five share one root cause: the function accepts `clerkUserId` as a plain client-supplied argument and never compares it against `ctx.auth.getUserIdentity().subject` (or any other server-derived identity) before using it to look up another user's data. The correct fix pattern already exists in this same codebase — `credits.deductCreditsPublic` (credits.ts:968), `credits.refundCreditsPublic` (credits.ts:1074), and `rateLimits.deductCreditsRateLimited` (rateLimits.ts:68) all add `if (identity.subject !== args.clerkUserId) throw ...` before proceeding.
