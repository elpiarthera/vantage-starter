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
| 1 | `agents.list` | `agents.ts:80` | Local helper `getUserWorkspace(ctx, args.workspaceId)` (`agents.ts:31`) → calls `ctx.auth.getUserIdentity()` at `agents.ts:35`; resolves `users` row; if `workspaceId` given, checks `workspace.ownerId === user.clerkUserId \|\| workspace.organizationId === user.organizationId` (`agents.ts:48-52`); on any failure returns `null` and the caller gets `[]`. | `agents` — workspace-owned rows (tenant data: `roleSystemPrompt`, `customInstructions`, `token`... — but this function returns full docs, see caveat below) + global `isSystem` rows | **SCOPED** | Matches group-b (agents.ts:80, SCOPED). **Caveat, not a new defect**: `list` returns the raw agent doc from `ctx.db.query(...).collect()`, unlike `listForAssignment` which projects safe fields only — `list` does NOT strip `token`/`tokenCreatedAt` the way `get` explicitly does (`agents.ts:131-135`). Since access to `list` is already gated to the caller's own workspace (or system rows), this is not cross-tenant, but it means the per-agent HTTP token is returned to the workspace's own legitimate members over `list`, whereas `get` deliberately redacts it. Flagged as a follow-up hardening note, not a T4 defect (no cross-tenant read results). |
| 2 | `agents.listSystem` | `agents.ts:154` | None — no `ctx.auth` call, no helper call. Filters `isSystem === true` only. | `agents` — only rows where `isSystem === true` (schema: platform-provided global agents, never tenant-owned) | **PUBLIC-BY-DESIGN** | Matches group-b (`listSystem`, PUBLIC-BY-DESIGN). Written reason + revisit condition already present in code (`agents.ts:144-152`): revisit "if `isSystem` rows ever gain per-organization overrides or secrets." Comment's claim (`isSystem` rows carry no tenant data) verified true by reading the query — the index only ever returns `isSystem: true` rows, and nothing in `create`/`update` (read separately) permits setting `isSystem: true` from tenant-supplied input for a workspace-owned row (schema-level flag, not client-settable per `create`'s arg validator). Reasoning holds. |
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

## Summary

- **SCOPED: 5** — `agents.list`, `agents.listForAssignment`, `skills.list`, `skills.listByCategory` (all via the local `getUserWorkspace` helper the pattern's blind spot warned about — followed and confirmed authenticating), and implicitly none of the 15 required a fix.
- **PUBLIC-BY-DESIGN: 10** — `agents.listSystem`, `skills.listSystem`, `aiModels.{list,listAll,getByModelId,getDefault}`, `credits.{getCreditCost,listCreditCostsByTypes}`, `subscriptionTiers.{listCreditPackages,listSubscriptionPlans}`, `sharedLinks.getByToken`. Every one already carries a written reason + revisit condition in code (added by PR #33, commit `484c4ff`), and every comment's safety claim was independently re-verified against the current code, not just re-read — none found to overclaim.
- **UNSCOPED-DEFECT: 0**

**No disagreement with the prior classifications** (`analysis/org-scoping-group-{a,b,c}.md`) on any of these 15 rows — this pass independently re-derives each verdict from the current code rather than inheriting the prior file's conclusion, and arrives at the same answer in every case. No PUBLIC-BY-DESIGN comment was found to claim a guarantee the code does not hold.

**No fix required.** No new test needed — there is no defect to prove RED before GREEN on. All 15 candidates were correctly closed/classified in the prior PR #33 pass; this session's re-check (using a different, blind-spot-aware derivation) found no regression and no missed instance.

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
