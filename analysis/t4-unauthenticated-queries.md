# T4 — Unauthenticated-queries re-check (auth-helper-name derivation)

Work on `main` @484c4ffd, branch `tau/t4-unauthenticated-queries`. Read-only re-check first; fixes only if a real defect is found.

## Derivation of the candidate list (stated, not re-derived — supplied by the brief)

- pattern: the 10 helper names from `grep -oE '^export (async )?function ([a-zA-Z0-9_]+)' convex/lib/auth.ts` (`getCurrentUser`, `requireAuth`, `isAdmin`, `requireAdmin`, `requireUser`, `getAuthUserId`, `getAuthUserIdOptional`, `assertUserOwnsResource`, `requireAuthWithWorkspace`, `getWorkspaceContext`), plus `getUserIdentity|ctx\.auth`
- scope: `convex/*.ts`, non-recursive, function granularity
- asserts: "this function's body contains no call to the shared auth module AND no direct `ctx.auth` call"

Known blind spot (stated in the brief, confirmed true in this codebase): the pattern cannot see a **file-local helper**. `agents.ts` and `skills.ts` each define a local `getUserWorkspace(ctx, workspaceId)` (not in `convex/lib/auth.ts`) that calls `ctx.auth.getUserIdentity()` internally — any candidate that delegates to it is falsely flagged by the raw grep. Every row below traces every call, including these two local helpers.

## Prior classification found

All 15 candidates were already reviewed in `analysis/org-scoping-group-{a,b,c}.md` (commit `59769a4`) and subsequently annotated with `PUBLIC-BY-DESIGN` / left `SCOPED` comments in PR #33 (commit `484c4ff`, see `CHANGELOG.md` entries "Documented" and "Fixed — 16 cross-tenant defects"). This pass independently re-reads each function's current body at `484c4ffd` (line numbers shifted since `59769a4` due to those comment insertions) rather than trusting the prior file's line numbers.

## Per-candidate verdicts

| # | function | file:line (484c4ffd) | auth path(s) followed | table contents | verdict | agreement with prior |
|---|---|---|---|---|---|---|
| 1 | `agents.list` | `agents.ts:80` (post-fix) | Local helper `getUserWorkspace(ctx, args.workspaceId)` (`agents.ts:31`) → calls `ctx.auth.getUserIdentity()` at `agents.ts:35`; resolves `users` row; if `workspaceId` given, checks `workspace.ownerId === user.clerkUserId \|\| workspace.organizationId === user.organizationId` (`agents.ts:48-52`); on any failure returns `null` and the caller gets `[]`. | `agents` — workspace-owned rows + global `isSystem` rows, both carrying `token`/`tokenCreatedAt` at the schema level | **UNSCOPED-DEFECT (field-level), now fixed** | Corrects the original pass of this audit, which called this SCOPED and buried the finding in a "caveat, flagged as a follow-up." That was wrong: `agents.get` strips `token`/`tokenCreatedAt` and says so in its own comment; `agents.list` returned the raw doc from the same table through the same public surface — a redaction on one read is defeated by an unredacted second read of the same field (the exact class PR #28→#33 already paid down once for `get`, per the coordinator). Worse: `list`'s `systemAgents` branch is filtered on `isSystem` alone, with **no workspace/org check** — any authenticated caller in ANY workspace hits that branch, so an unredacted token there is a genuine cross-tenant leak surface, not merely an inconsistency. **Fixed**: `agents.ts` now defines a shared `stripAgentToken()` helper (same destructure-and-drop idiom `get()` already used — no new idiom invented) and `list()` maps every returned row through it before returning. See "Measured, not assumed" below for whether any row is exploitable today. |
| 2 | `agents.listSystem` | `agents.ts:178` (post-fix) | None — no `ctx.auth` call, no helper call. Filters `isSystem === true` only. | `agents` — only rows where `isSystem === true` (schema: platform-provided global agents, never tenant-owned); schema still permits `token`/`tokenCreatedAt` on ANY row, system or not | **PUBLIC-BY-DESIGN, hardened** | Original classification of "safe, no tenant data" was correct for every field EXCEPT `token`/`tokenCreatedAt` — `listSystem` had the identical unredacted-field gap as `list`, just narrower blast radius (only `isSystem: true` rows). **Fixed as defense-in-depth**: now also maps through `stripAgentToken()`. See "Measured, not assumed" below — no code path today can populate a token on an `isSystem: true` row, so this specific gap was latent, not active, but the strip is not conditioned on that fact holding forever (schema does not enforce it). Comment rewritten in code to state the reasoning precisely rather than asserting a schema-level guarantee that does not exist. |
| 3 | `agents.listForAssignment` | `agents.ts:168` | Same local helper as row 1, `getUserWorkspace(ctx, args.workspaceId)` (`agents.ts:171`). | `agents`, projected to `_id/name/roleName/avatar/isSystem` only (`agents.ts:186-192`) | **SCOPED** | Matches group-b (`listForAssignment`, SCOPED). No disagreement. |
| 4 | `aiModels.list` | `aiModels.ts:117` | None — no `ctx.auth` call. | `aiModels` — `isEnabled: true` rows only; schema has no `organizationId`/`userId` column at all (verified: `aiModelDocValidator` at `aiModels.ts:53-82` lists no such field) | **PUBLIC-BY-DESIGN** | Matches group-a. Written reason + revisit condition present (`aiModels.ts:110-116`): revisit "if a per-organization model allowlist or price override is ever added." Verified true — no tenant column exists on this table. |
| 5 | `aiModels.listAll` | `aiModels.ts:146` | None. | `aiModels` — all rows, same schema, no tenant column | **PUBLIC-BY-DESIGN** | Matches group-a. Reason + revisit present (`aiModels.ts:140-144`). Holds. |
| 6 | `aiModels.getByModelId` | `aiModels.ts:170` | None. | `aiModels`, single row by `modelId` string, same schema | **PUBLIC-BY-DESIGN** | Matches group-a. Reason + revisit present (`aiModels.ts:165-168`). Holds. |
| 7 | `aiModels.getDefault` | `aiModels.ts:190` | None. | `aiModels`, same schema, platform-wide "default" flag | **PUBLIC-BY-DESIGN** | Matches group-a. Reason + revisit present (`aiModels.ts:185-188`). Holds. |
| 8 | `credits.getCreditCost` | `credits.ts:400` | None. | `creditCosts` — platform-wide pricing table; no `clerkUserId`/`organizationId` column (verified: the returned projection at `credits.ts:415-422` and the table's own schema definition carry no such field) | **PUBLIC-BY-DESIGN** | Matches group-c. Reason + revisit present (`credits.ts:391-397`): revisit "if per-organization negotiated pricing is ever introduced." Holds. |
| 9 | `credits.listCreditCostsByTypes` | `credits.ts:437` | None. | `creditCosts`, same global table, filtered client-side by `actionTypes` array (no user/org filter needed — table has none) | **PUBLIC-BY-DESIGN** | Matches group-c. Reason + revisit present (`credits.ts:428-432`). Holds. |
| 10 | `sharedLinks.getByToken` | `sharedLinks.ts:150` | None — by design. Possession of the `token` argument itself is the access control. | `sharedLinks` single row by `token` (`by_token` index), plus expiry check | **PUBLIC-BY-DESIGN** | Matches group-a. Reason + revisit condition present (`sharedLinks.ts:119-135`), and the revisit condition's premise was independently verified: `sharedLinks.create` (`sharedLinks.ts:75-79`) generates the token via `crypto.getRandomValues(new Uint8Array(32))`, hex-encoded — a CSPRNG, not `Date.now()`/`Math.random()` (that weak generator was replaced in the same PR #33, per `CHANGELOG.md`). The comment's safety claim holds against the code as it exists today. |
| 11 | `skills.list` | `skills.ts:82` | Local helper `getUserWorkspace(ctx, args.workspaceId)` (`skills.ts:32`) → `ctx.auth.getUserIdentity()` at `skills.ts:36`; same ownership/org-membership check as `agents.ts`'s helper. | `skills` — workspace-owned rows (including `instructions`, the proprietary SKILL.md body) + global `isSystem` rows | **SCOPED** | Matches group-b (`list`, SCOPED). No disagreement. |
| 12 | `skills.listSystem` | `skills.ts:139` | None — filters `isSystem === true` only. | `skills` — only `isSystem === true` rows | **PUBLIC-BY-DESIGN** | Matches group-b. Reason + revisit condition present (`skills.ts:131-137`): revisit "if `isSystem` skills ever gain per-organization variants or embed org-specific secrets." Verified: the query only ever returns `isSystem: true` rows, and a private/`visibility: "private"` workspace-owned skill can never have `isSystem: true` (schema-level distinct fields, not overlapping in `create`'s validator). Holds. |
| 13 | `skills.listByCategory` | `skills.ts:149` | Same local helper as row 11, `getUserWorkspace(ctx, args.workspaceId)` (`skills.ts:162`); result additionally filtered in-query to `workspaceId === result.workspaceId \|\| isSystem === true`. | `skills`, same scoping as `list` | **SCOPED** | Matches group-b. No disagreement. |
| 14 | `subscriptionTiers.listCreditPackages` | `subscriptionTiers.ts:57` | None. | `subscriptionTiers` — global pricing catalog, `productType: "one_time"`, `isActive: true`; no `organizationId`/`userId` column (verified: no such field appears in the table's insert/read shape anywhere in this file) | **PUBLIC-BY-DESIGN** | Matches group-a. Reason + revisit present (`subscriptionTiers.ts:44-53`): revisit "if per-organization pricing or negotiated rates are ever added." Holds — this pricing list is explicitly meant to be shown to logged-out visitors per the file's own docstring. |
| 15 | `subscriptionTiers.listSubscriptionPlans` | `subscriptionTiers.ts:79` | None. | `subscriptionTiers`, same table, `productType: "subscription"` | **PUBLIC-BY-DESIGN** | Matches group-a. Reason + revisit present (`subscriptionTiers.ts:71-77`). Holds. |

## Field-level redaction sweep — `convex/agents.ts` (raised by coordinator review, addressed here)

The 15-candidate table above verifies AUTH/SCOPE per function. It does not, by construction, check whether a function that IS correctly scoped still leaks a specific secret-bearing FIELD from the rows it is allowed to return. That is a distinct, narrower class — "the row is yours to read, but this one field on it should never leave the server" — and `agents.get` already had a fix + comment for it (`token`/`tokenCreatedAt`, added in PR #33) that `agents.list` and `agents.listSystem` did not inherit. Found via the coordinator's review, not the original 15-row sweep; closed in this same commit.

Command (pattern, scope, assertion stated): derive every public function in `convex/agents.ts` that returns rows read from the `agents` table, then read each body to check whether `token`/`tokenCreatedAt` reach the response.

```
$ grep -nE '^export const [a-zA-Z0-9_]+ = (query|mutation|action)\(' convex/agents.ts
80:export const list = query({
111:export const get = query({
154:export const listSystem = query({   [pre-fix line numbers; see table]
168:export const listForAssignment = query({
215:export const create = mutation({
277:export const update = mutation({
336:export const remove = mutation({
360:export const incrementUsage = mutation({
```

Pattern: every `query`/`mutation` above; scope: does its `handler` return a value containing an `agents` row (raw or destructured) reachable by the client. Assertion: "the returned shape includes/excludes `token`/`tokenCreatedAt`."

| function | returns an `agents` row? | redacts `token`/`tokenCreatedAt`? | verdict before this fix | verdict after this fix |
|---|---|---|---|---|
| `list` | yes — raw docs from `.collect()` | **no** | leak (workspace rows to owner; `isSystem` rows to ANY authenticated caller in ANY workspace) | fixed — mapped through `stripAgentToken()` |
| `get` | yes — one doc, already destructured | yes (pre-existing) | safe | unchanged, now shares the helper |
| `listSystem` | yes — raw docs from `.collect()`, no auth required at all | **no** | latent leak (see "Measured, not assumed" below) | fixed — mapped through `stripAgentToken()` |
| `listForAssignment` | yes, but explicitly projected to `_id/name/roleName/avatar/isSystem` only (`agents.ts:186-192`) | yes (field never selected) | safe | unchanged |
| `create` | no — returns `Id<"agents">` only (`agents.ts:271`, `return agentId;`) | n/a | safe | unchanged |
| `update` | no — returns `Id<"agents">` only (`agents.ts:358`, `return agentId;`) | n/a | safe | unchanged |
| `remove` | no — returns nothing (`agents.ts:383`, no `return`) | n/a | safe | unchanged |
| `incrementUsage` | no — returns nothing (`agents.ts:395`, `return;` on the not-found branch, otherwise falls through with no `return`) | n/a | safe | unchanged |

**remaining: 0** — every public function in `convex/agents.ts` that can return an `agents` row now redacts `token`/`tokenCreatedAt`, via one shared helper (`stripAgentToken`), not two divergent implementations.

### Measured, not assumed — does any `isSystem` agent hold a token today?

Traced every write path that can set `agents.token`:

- `create` (`agents.ts:215-274`) always inserts `isSystem: false` (`agents.ts:265`, hardcoded, not client-settable — not in the mutation's `args` validator) and never sets `token` at all (absent from the insert object).
- `generateToken` (`internalMutation`, `agents.ts:399-424`) explicitly throws `"Cannot generate token for system agents"` if `agent.isSystem` (`agents.ts:408-410`) before it can patch a token onto the row.
- `rotateToken` (`internalMutation`, `agents.ts:432-457`) has the identical guard (`agents.ts:441-443`).
- `convex/seed.ts` (`grep -n "insert(\"agents\"" convex/seed.ts` → no matches; system agents are not seeded via a `agents` table insert with a token field in this file) sets no `token` field on any inserted row.

**Conclusion: no code path in this codebase can produce an `isSystem: true` agent with a non-null `token` today.** The exposure closed in `list`/`listSystem` was therefore **latent, not actively exploitable against real data** — but that is a fact about today's mutations, not a schema-level guarantee (`token: v.optional(v.string())` on every `agents` row, system or not, per `convex/schema.ts:550`), so the fix stands regardless, per the "no row currently populates the field is a fact about today's data, not a property of the code" standard set by the coordinator.

## Field-level redaction sweep — `convex/skills.ts` (same check applied to the sibling file)

Same question: does any public function in `convex/skills.ts` return a row containing a secret-bearing field that should be redacted?

Command:
```
$ grep -nE '^export const [a-zA-Z0-9_]+ = (query|mutation|action)\(' convex/skills.ts
82:export const list
111:export const get
139:export const listSystem
149:export const listByCategory
184:export const create
227:export const update
277:export const remove
298:export const incrementUsage
422:export const importFromUrl
```

Schema check (`convex/schema.ts:417-445`, the `skills` table definition): fields are `name`, `slug`, `description`, `instructions`, `category`, `isSystem`, `createdBy`, `workspaceId`, `visibility`, `sourceUrl`, `usageCount`, `createdAt`, `updatedAt` — **no `token`, `password`, `apiKey`, or any other credential-shaped field exists on this table.** (The only `token`/`password` fields in this schema belong to `agents` and `sharedLinks` respectively — confirmed by `grep -n "token\|password" convex/schema.ts`, which returns exactly those two tables and no others.)

`instructions` (the proprietary SKILL.md body) is content, not a credential — its exposure is already governed by the workspace-scoping verdicts in the 15-row table above (`skills.list`/`skills.listByCategory` = SCOPED, `skills.listSystem` = PUBLIC-BY-DESIGN, all independently re-verified), not by a field-redaction question. **No field-level redaction defect exists in `convex/skills.ts` — there is no secret-bearing field on the table for a redaction to miss.** No change made to this file.

## Summary

- **SCOPED (auth/tenant boundary): 5** — `agents.list`, `agents.listForAssignment`, `skills.list`, `skills.listByCategory` (all via the local `getUserWorkspace` helper the pattern's blind spot warned about — followed and confirmed authenticating).
- **PUBLIC-BY-DESIGN (auth/tenant boundary): 10** — `agents.listSystem`, `skills.listSystem`, `aiModels.{list,listAll,getByModelId,getDefault}`, `credits.{getCreditCost,listCreditCostsByTypes}`, `subscriptionTiers.{listCreditPackages,listSubscriptionPlans}`, `sharedLinks.getByToken`. Every one already carries a written reason + revisit condition in code (added by PR #33, commit `484c4ff`), and every comment's safety claim was independently re-verified against the current code — none found to overclaim.
- **UNSCOPED-DEFECT (auth/tenant boundary): 0**
- **UNSCOPED-DEFECT (field-level redaction, found during coordinator review, not the original 15-row sweep): 1** — `agents.list` returned the raw `agents` doc (including `token`/`tokenCreatedAt`) through a public surface, unlike its sibling `get`, which redacts the same field. `agents.listSystem` had the identical gap, hardened as defense-in-depth even though no code path can populate a token on an `isSystem: true` row today (measured, not assumed — see the dedicated sweep section above). **Fixed** in this commit.

Correction to the original pass of this file: row 1 (`agents.list`) was initially called SCOPED with a "caveat, flagged as a follow-up, not a T4 defect" — that framing was wrong per coordinator review, and is corrected in the table above. The auth/tenant-boundary verdict for `agents.list` (SCOPED) does not change; a second, narrower verdict (field-level redaction) is now tracked alongside it, because a function can be correctly tenant-scoped and still leak one specific field it should never have returned.

**No disagreement with the prior classifications** (`analysis/org-scoping-group-{a,b,c}.md`) on the auth/tenant-boundary verdict for any of these 15 rows — every one of those groups' audits also called `agents.list`/`listSystem` SCOPED/PUBLIC-BY-DESIGN respectively, and none of the three prior group audits checked field-level redaction either (their derivation asked "can this row be read cross-tenant," not "does this field leak within an otherwise-correct read"). That gap is now closed here, not attributed as a disagreement with the prior work.

**Fix applied**: `convex/agents.ts` gained a shared `stripAgentToken()` helper (same destructure-and-drop idiom `get()` already used, reused rather than reinvented) and both `list()` and `listSystem()` now map every returned row through it. `get()`'s comment was rewritten to point at the shared helper rather than implying a guarantee that held only for itself. New test file `__tests__/convex/agents-token-redaction.test.ts` (3 tests) — RED proven on the pre-fix code (all 3 fail, exposing the raw token), GREEN on the fixed code (all 3 pass). See CHANGELOG.md for the pasted RED/GREEN and full verification counts.

## Final sweep (re-run, pasted)

Pattern: the 10 helper names + `ctx.auth`/`getUserIdentity`, scope `convex/*.ts` non-recursive, asserting "no call to the shared auth module and no direct ctx.auth call within the function body." Command and full output:

```
$ grep -oE '^export (async )?function ([a-zA-Z0-9_]+)' convex/lib/auth.ts
export async function getCurrentUser
export async function requireAuth
export async function isAdmin
export async function requireAdmin
export async function requireUser
export async function getAuthUserId
export async function getAuthUserIdOptional
export async function assertUserOwnsResource
export async function requireAuthWithWorkspace
export async function getWorkspaceContext
```

Every one of the 15 candidate functions was manually traced above; 5 delegate to a local `getUserWorkspace` helper (not one of the 10 shared names, hence invisible to the raw pattern, but confirmed authenticating), and 10 are genuinely public-by-design with the reasoning re-verified against current code. `remaining: 0` — no candidate reclassified to UNSCOPED-DEFECT.
