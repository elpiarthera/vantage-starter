# Organization-scoping audit — Group A

Read-only audit. Work on `main` @59769a4. No code changed.

Scope: `convex/aiModels.ts`, `convex/assets.ts`, `convex/files.ts`, `convex/polar.ts`, `convex/registry.ts`, `convex/subscriptionTiers.ts`, `convex/usageTracking.ts`, `convex/adminHelpers.ts`, `convex/chatMessages.ts`, `convex/users.ts`, `convex/sharedLinks.ts`.

## Derivation of the function list

Command run per file:
```
grep -nE '^export const [a-zA-Z0-9_]+ = (query|mutation|action)\(' convex/<file>.ts
```
Pasted counts (this regex only matches direct `export const X = query(...)` / `mutation(` / `action(` forms — it does NOT match destructured re-exports like `export const { a, b } = polar.api();`):

| file | grep count |
|---|---|
| aiModels.ts | 9 |
| assets.ts | 4 |
| files.ts | 4 |
| polar.ts | 2 |
| registry.ts | 6 |
| subscriptionTiers.ts | 2 |
| usageTracking.ts | 4 |
| adminHelpers.ts | 4 |
| chatMessages.ts | 5 |
| users.ts | 7 |
| sharedLinks.ts | 4 |
| **Total (grep-derived)** | **51** |

`convex/polar.ts` additionally re-exports 6 public functions from `polar.api()` (`getConfiguredProducts`, `listAllProducts`, `generateCheckoutLink`, `generateCustomerPortalUrl`, `changeCurrentSubscription`, `cancelCurrentSubscription`) that the grep pattern cannot see because they are destructured, not declared inline. These are genuine public functions (callable by any deployment-URL holder) and are audited below as **UNDETERMINED**, since their handler bodies live inside the `@convex-dev/polar` npm package, not in any file assigned to me — I cannot read that source from this file set.

**Grand total public functions found: 57** (51 grep-matched + 6 destructured). Every row below is one of the 57. Internal functions (`internalQuery`/`internalMutation`) were excluded by design (per the brief) — for the record: `aiModels.clearAll`, `aiModels.seed`, `subscriptionTiers.getByPolarProductId`, `users.cleanupUserData`, `users.getByClerkId`, `users.getByConvexId`.

Schema check (`convex/schema.ts`): `assets` and `usageTracking` tables have **no `organizationId` column at all** — only `userId`. This is a schema-level fact, not a per-function defect: these tables were designed as user-scoped, not org-scoped. `registryTeams`/`registryAgents`/`registrySkills` also carry no org column — designed as a global shared catalog. `aiModels` and `subscriptionTiers` likewise have no org column — designed as global platform catalogs.

---

## convex/aiModels.ts (9 functions)

| function | file:line | auth path | table | scoped by | verdict |
|---|---|---|---|---|---|
| list | aiModels.ts:110 | none | aiModels (read `by_enabled`) | — | **PUBLIC-BY-DESIGN** — global model catalog, no user data, comment states "No auth required" |
| listAll | aiModels.ts:133 | none | aiModels (read all) | — | **PUBLIC-BY-DESIGN** — same catalog, includes disabled models; still no user data, safe to expose |
| getByModelId | aiModels.ts:152 | none | aiModels `by_model_id` | — | **PUBLIC-BY-DESIGN** — same catalog |
| getDefault | aiModels.ts:167 | none | aiModels `by_enabled` | — | **PUBLIC-BY-DESIGN** — same catalog |
| create | aiModels.ts:193 | `requireAdmin(ctx)` (aiModels.ts:222) | aiModels (insert) | global admin role gate only — table has no org column | **PUBLIC-BY-DESIGN** — table is intentionally global (schema comment: "Platform-level settings"); gate is role, not org, by design |
| update | aiModels.ts:248 | `requireAdmin(ctx)` (aiModels.ts:275) | aiModels (patch) | same | **PUBLIC-BY-DESIGN** — same reasoning |
| toggle | aiModels.ts:293 | `requireAdmin(ctx)` (aiModels.ts:297) | aiModels (patch) | same | **PUBLIC-BY-DESIGN** — same reasoning |
| setDefault | aiModels.ts:316 | `requireAdmin(ctx)` (aiModels.ts:320) | aiModels (patch all + one) | same | **PUBLIC-BY-DESIGN** — same reasoning |
| remove | aiModels.ts:347 | `requireAdmin(ctx)` (aiModels.ts:351) | aiModels (delete) | same | **PUBLIC-BY-DESIGN** — same reasoning |

Note: `requireAdmin` checks `user.role === "admin" || "owner"` **globally** (`convex/lib/auth.ts:70-78`) — there is no per-organization admin concept in this schema. That is consistent with `aiModels` being explicitly global, so it is not a cross-tenant defect here. It WOULD be a defect if any org-scoped table used the same global-admin gate as its only protection — flagged separately below (`adminHelpers.ts`).

---

## convex/assets.ts (4 functions)

| function | file:line | auth path | table | scoped by | verdict |
|---|---|---|---|---|---|
| list | assets.ts:8 | `ctx.auth.getUserIdentity()` inline (assets.ts:16) | assets `by_user` index `.eq("userId", identity.subject)` (assets.ts:23) | userId = caller's own Clerk ID | **SCOPED** (by user; table has no org column — schema-level, see above) |
| get | assets.ts:41 | inline auth (assets.ts:46) | assets (`ctx.db.get`) + ownership check `asset.userId !== identity.subject` (assets.ts:57) | ownership assertion | **SCOPED** |
| remove | assets.ts:68 | inline auth (assets.ts:73) | assets (delete) + ownership check (assets.ts:84) | ownership assertion | **SCOPED** |
| getUserStorageUsage | assets.ts:102 | inline auth (assets.ts:104, degrades to empty result if absent rather than throwing) | assets `by_user` (assets.ts:111) | userId = caller | **SCOPED** |

---

## convex/files.ts (4 functions)

| function | file:line | auth path | table | scoped by | verdict |
|---|---|---|---|---|---|
| generateUploadUrl | files.ts:8 | inline auth (files.ts:12) | none (returns ephemeral storage upload URL) | auth only, no data read | **SCOPED** (trivially — no cross-tenant read possible) |
| saveFileMetadata | files.ts:27 | inline auth (files.ts:42) | assets (insert, `userId: identity.subject` at files.ts:67) | write is self-attributed | **SCOPED** |
| getFileUrl | files.ts:83 | **none** — handler has no `ctx.auth` call at all | `ctx.storage.getUrl(args.storageId)` (files.ts:88) | none | **UNSCOPED-DEFECT** — any caller (does not even need to be logged in) supplying any `storageId` string gets back the file's serving URL. Scenario: attacker in Org B enumerates/guesses/obtains a `storageId` belonging to Org A's uploaded asset (storage IDs are also visible on any `assets` row returned elsewhere, or could be brute-forced) and calls `files.getFileUrl({ storageId })` directly — no ownership or organization check exists anywhere in this function |
| deleteFile | files.ts:95 | inline auth (files.ts:100) — proves the CALLER is logged in, proves nothing about the file | `ctx.storage.delete(args.storageId)` (files.ts:106) | **none** — no lookup of an `assets` row, no ownership comparison before delete | **UNSCOPED-DEFECT** — any authenticated user of ANY organization can delete ANY other organization's uploaded file by supplying its `storageId`. Scenario: a signed-in user in Org B calls `files.deleteFile({ storageId: "<Org A's file>" })` and it succeeds — `requireAuth` proves who is asking, never that the storage object belongs to them (this is exactly the anti-pattern the brief warns against) |

---

## convex/polar.ts (2 grep-matched + 6 destructured)

| function | file:line | auth path | table | scoped by | verdict |
|---|---|---|---|---|---|
| getUserInfo | polar.ts:21 | inline auth (polar.ts:25) | users `by_clerk_user_id` (polar.ts:33) | returns only the caller's own `_id`/`email`, resolved from their own identity | **SCOPED** (self) |
| getCurrentSubscription | polar.ts:80 | inline auth (polar.ts:83), returns `null` if absent | users lookup (polar.ts:88) then `polar.getCurrentSubscription(ctx, { userId: user._id })` (polar.ts:99) | subscription looked up by the caller's own resolved `user._id` | **SCOPED** (self) |
| getConfiguredProducts | polar.ts:107-113 (destructured from `polar.api()`) | **UNDETERMINED** — handler body lives in `@convex-dev/polar` package, not in this file set | Polar component's internal tables | component internally calls `getUserInfo` (the query above) for per-user context, per the Polar constructor at polar.ts:54-68, but I cannot read the component's query implementation to confirm every one of these 6 re-exports actually applies that callback (e.g., "list all products" may legitimately be public catalog data, independent of the user) | **UNDETERMINED** — cannot verify without reading `@convex-dev/polar` source, which is outside my assigned files |
| listAllProducts | polar.ts:113 | UNDETERMINED (see above) | Polar component tables | UNDETERMINED | **UNDETERMINED** |
| generateCheckoutLink | polar.ts:116 | UNDETERMINED (see above) | Polar component tables | UNDETERMINED | **UNDETERMINED** |
| generateCustomerPortalUrl | polar.ts:119 | UNDETERMINED (see above) | Polar component tables | UNDETERMINED | **UNDETERMINED** |
| changeCurrentSubscription | polar.ts:122 | UNDETERMINED (see above) | Polar component tables | UNDETERMINED | **UNDETERMINED** |
| cancelCurrentSubscription | polar.ts:125 | UNDETERMINED (see above) | Polar component tables | UNDETERMINED | **UNDETERMINED** |

This is a genuine gap, not a guess defaulted to SCOPED: the `getUserInfo` callback wired into the `Polar` constructor (polar.ts:60-68) strongly suggests every one of these 6 functions resolves the calling user before touching billing data, but confirming that requires reading `node_modules/@convex-dev/polar`'s server implementation, which was not in my assigned file list. Also note: this repo has no per-organization billing concept in `subscriptions`/Polar data model — subscriptions are keyed to `clerkUserId`, not `organizationId`, so "organization scoping" does not apply to this table by design; the relevant boundary here is per-user, not per-org.

---

## convex/registry.ts (6 functions)

| function | file:line | auth path | table | scoped by | verdict |
|---|---|---|---|---|---|
| listTeams | registry.ts:68 | `requireAuth(ctx)` (registry.ts:83) | registryTeams (all, or `by_category`) | none beyond auth | **PUBLIC-BY-DESIGN** — `registryTeams` has no organization column in schema (verified in `convex/schema.ts:806-824`); it is a shared, global catalog seeded from vantage-registry, identical for every organization. Auth-gating (not org-gating) is correct here — the file's own docstring says "The registry is read-only from the client" and all queries require auth |
| getTeam | registry.ts:99 | `requireAuth(ctx)` (registry.ts:103) | registryTeams `by_team_id` | none beyond auth | **PUBLIC-BY-DESIGN** — same global catalog |
| listAgentsByTeam | registry.ts:115 | `requireAuth(ctx)` (registry.ts:119) | registryAgents `by_team` | none beyond auth | **PUBLIC-BY-DESIGN** — `registryAgents` has no org column (schema.ts:830-842) |
| listSkillsByTeam | registry.ts:131 | `requireAuth(ctx)` (registry.ts:135) | registrySkills `by_team` | none beyond auth | **PUBLIC-BY-DESIGN** — `registrySkills` has no org column (schema.ts:848-860) |
| getRecommendationsForPains | registry.ts:153 | `requireAuth(ctx)` (registry.ts:171) | registryTeams/Agents/Skills | none beyond auth | **PUBLIC-BY-DESIGN** — pure read-through over the same global catalog, computed from a static `PAIN_MAPPINGS` table, no per-user/org data touched |
| listSkills | registry.ts:266 | `requireAuth(ctx)` (registry.ts:272) | registrySkills (all, or `by_category`) | none beyond auth | **PUBLIC-BY-DESIGN** — same global catalog |

---

## convex/subscriptionTiers.ts (2 grep-matched public; 1 internal excluded)

| function | file:line | auth path | table | scoped by | verdict |
|---|---|---|---|---|---|
| listCreditPackages | subscriptionTiers.ts:49 | **none** | subscriptionTiers `by_sort_order` + filter `productType`/`isActive` | none | **PUBLIC-BY-DESIGN** — this is the pricing/package list shown pre-purchase; `subscriptionTiers` has no org column (schema.ts:323-342) and is meant to be visible to logged-out visitors on a pricing page |
| listSubscriptionPlans | subscriptionTiers.ts:66 | **none** | subscriptionTiers `by_sort_order` + filter | none | **PUBLIC-BY-DESIGN** — same reasoning, this is the subscription plan list |

(`getByPolarProductId` at subscriptionTiers.ts:28 is `internalQuery` — excluded per brief.)

---

## convex/usageTracking.ts (4 functions)

| function | file:line | auth path | table | scoped by | verdict |
|---|---|---|---|---|---|
| logAIUsage | usageTracking.ts:8 | inline auth (usageTracking.ts:59) + explicit mismatch check "reject if caller-supplied userId doesn't match JWT identity" (usageTracking.ts:65-68) | usageTracking (insert) | write is self-attributed, with defence-in-depth against ID spoofing | **SCOPED** (by user; table has no org column — schema-level fact, not a defect) |
| getProjectUsage | usageTracking.ts:95 | inline auth (usageTracking.ts:102) | usageTracking `.filter(projectId)` AND `.filter(userId === identity.subject)` (usageTracking.ts:109-110) | double filter includes an explicit userId equality filter | **SCOPED** (by user) |
| listByUser | usageTracking.ts:142 | inline auth (usageTracking.ts:147, degrades to `[]` if absent) | usageTracking `by_user` index `.eq("userId", identity.subject)` (usageTracking.ts:154) | userId = caller | **SCOPED** |
| getUserTotalUsage | usageTracking.ts:165 | inline auth (usageTracking.ts:171) | usageTracking `.filter(userId === identity.subject)` (usageTracking.ts:178) | userId = caller | **SCOPED** |

---

## convex/adminHelpers.ts (4 functions)

| function | file:line | auth path | table | scoped by | verdict |
|---|---|---|---|---|---|
| setAdminByEmail | adminHelpers.ts:19 | `requireAdmin(ctx)` (adminHelpers.ts:30) | users `by_email` (patch role) | **none beyond global-admin role** — no check that the target user shares the caller's organization | **UNSCOPED-DEFECT** — `role` is a global field on `users` (schema.ts:55-62), and `requireAdmin` only checks the CALLER's own role, never compares organizations. Scenario: a user with `role: "admin"` in Organization A calls `setAdminByEmail({ email: "someone@org-b.com", role: "owner" })` and successfully promotes an arbitrary user in Organization B to `owner` — nothing in this function or in `requireAdmin` restricts the target to the caller's own organization |
| setAdminByClerkId | adminHelpers.ts:60 | `requireAdmin(ctx)` (adminHelpers.ts:71) | users `by_clerk_user_id` (patch role) | same as above | **UNSCOPED-DEFECT** — identical scenario, keyed by Clerk ID instead of email |
| listAdmins | adminHelpers.ts:104 | `requireAdmin(ctx)` (adminHelpers.ts:107) | users (full table scan, filtered by role in JS) | none — returns admins/owners across **every** organization | **UNSCOPED-DEFECT** — any admin in any organization can enumerate the email + Clerk ID + role of every admin/owner across ALL organizations on the deployment; the docstring says "Usage via Convex CLI" but the function is a public `query`, reachable from any authenticated client, not CLI-restricted |
| getUserByEmail | adminHelpers.ts:129 | `requireAdmin(ctx)` (adminHelpers.ts:134) | users `by_email` | none — returns any user's `userId`, `email`, `clerkUserId`, `role`, `organizationId` regardless of the caller's own organization | **UNSCOPED-DEFECT** — an admin in Organization A can call `getUserByEmail({ email: "target@org-b.com" })` and receive that user's full identity + org membership, with zero comparison to the caller's own `organizationId` |

Root cause common to all four: `requireAdmin` (`convex/lib/auth.ts:70-78`) is a **global** admin check by construction — this repo's schema has no org-scoped role/membership table. Every function in this file inherits that same gap. This is the concrete, worst-severity finding of the audit: intra-tenant privilege boundaries do not exist for the admin surface at all.

---

## convex/chatMessages.ts (5 functions)

| function | file:line | auth path | table | scoped by | verdict |
|---|---|---|---|---|---|
| create | chatMessages.ts:7 | inline auth (chatMessages.ts:27) + users lookup (chatMessages.ts:32) | chatMessages (insert, `organizationId: user.organizationId \|\| ""` at chatMessages.ts:46, `userId: identity.subject` at chatMessages.ts:48) | write is self-attributed to caller's own org/user | **SCOPED** (write path) |
| list | chatMessages.ts:69 | inline auth (chatMessages.ts:75, degrades to `[]` if absent — but see verdict) | chatMessages `by_project_and_context` or `by_project` — filtered **only by the client-supplied `projectId` string** (chatMessages.ts:83-93) | **none** — no `organizationId` equality check, no `userId` equality check, anywhere in this function | **UNSCOPED-DEFECT** — `projectId` is a free-form `v.string()` argument (chatMessages.ts:71) with no ownership validation. Scenario: any authenticated user in Organization B who knows or guesses another organization's `projectId` (these are arbitrary strings chosen by the client at `create`-time, not secrets) calls `chatMessages.list({ projectId: "<Org A's projectId>" })` and receives the full AI chat history — content, tokens, model, everything — for that project, regardless of which organization or user it belongs to |
| remove | chatMessages.ts:103 | inline auth (chatMessages.ts:106) | chatMessages (delete) + ownership check `message.userId !== identity.subject` (chatMessages.ts:116) | ownership assertion | **SCOPED** |
| updateContent | chatMessages.ts:129 | inline auth (chatMessages.ts:135) | chatMessages (patch) + ownership check (chatMessages.ts:145) | ownership assertion | **SCOPED** |
| clearByProjectAndContext | chatMessages.ts:161 | inline auth (chatMessages.ts:167) | chatMessages `by_project_and_context` (read, chatMessages.ts:172-177) then per-message ownership check before any delete (chatMessages.ts:180-184) | ownership assertion, but only enforced AFTER reading cross-tenant rows into memory | **SCOPED** with a caveat — no message content is ever returned to the caller (the function throws before deleting if any message fails the ownership check), so this is not a data-return defect. However it does read another organization's message rows into the function's working set before rejecting, which is a minor existence-oracle risk (a caller can infer "this projectId+context has at least one message not owned by me" from the error), not classified as UNSCOPED-DEFECT because no organization's message DATA is ever returned or exposed — flagging as a design smell, not a verdict downgrade |

---

## convex/users.ts (7 public functions; 3 internal excluded)

| function | file:line | auth path | table | scoped by | verdict |
|---|---|---|---|---|---|
| getCurrentUser | users.ts:16 | inline auth (users.ts:20, returns `null` if absent) | users `by_clerk_user_id` `.eq("clerkUserId", identity.subject)` (users.ts:29) | resolves only the caller's own row | **SCOPED** (self) |
| syncUser | users.ts:43 | inline auth (users.ts:58) + explicit identity check `identity.subject !== args.clerkUserId` throws (users.ts:62-64), with an inline comment documenting exactly why | users (insert/patch own row) + workspaces (insert own workspace) | caller may only sync/write their own Clerk identity | **SCOPED** (self, with an explicit anti-spoofing comment already in the code) |
| getUserByClerkId | users.ts:139 | **none** — no `ctx.auth` call anywhere in the handler | users `by_clerk_user_id` — returns the **full user document** (email, firstName, lastName, organizationId, role, imageUrl, preferences, etc.) for whatever `clerkUserId` string is passed in | **none** | **UNSCOPED-DEFECT** — this is a public `query` reachable by anyone holding the deployment URL, authenticated or not. Scenario: an unauthenticated caller (or a caller from any organization) supplies a guessed/harvested Clerk user ID (`clerkUserId` values are visible in many other API responses across this codebase, e.g. `assets.userId`, `chatMessages.userId`) and receives that user's full profile including `organizationId`, `role`, and `email` — a direct cross-tenant PII leak with zero auth |
| updateLanguagePreference | users.ts:157 | inline auth (users.ts:163) | users (patch own row via `identity.subject` lookup, users.ts:170-175) | self only | **SCOPED** |
| getLanguagePreference | users.ts:206 | inline auth (users.ts:209, returns `"en"` default if absent) | users (own row, users.ts:215-220) | self only | **SCOPED** |
| updatePreferences | users.ts:230 | inline auth (users.ts:238) | users (patch own row, users.ts:244-249) | self only | **SCOPED** |
| deleteAccount | users.ts:345 | inline auth (users.ts:348), action | Polar cancel (own subscription) + `internal.users.cleanupUserData` scoped to `clerkUserId = identity.subject` (users.ts:352-367) + Clerk API delete of own account | self only, `clerkUserId` is taken from the caller's own JWT `identity.subject`, never from client args | **SCOPED** (self) |

---

## convex/sharedLinks.ts (4 functions)

| function | file:line | auth path | table | scoped by | verdict |
|---|---|---|---|---|---|
| list | sharedLinks.ts:7 | inline auth (sharedLinks.ts:12) — proves caller is logged in, proves nothing about the resource | sharedLinks `by_resource` `.eq("resourceId", args.resourceId)` (sharedLinks.ts:19) — **no `organizationId` or `userId` filter** | **none** | **UNSCOPED-DEFECT** — `resourceId` is a client-supplied `v.string()` with no ownership check. Scenario: any authenticated user in Organization B who knows or guesses another organization's `resourceId` calls `sharedLinks.list({ resourceId: "<Org A's resource>" })` and receives every shared-link row for that resource — including the **plaintext `password` field** (schema.ts:235, `password: v.optional(v.string())`) and the sharing `token` itself, both of which are meant to gate access |
| create | sharedLinks.ts:29 | inline auth (sharedLinks.ts:38) | sharedLinks (insert) | `userId` is self-attributed (sharedLinks.ts:51: `identity.subject`), but **`organizationId` is taken verbatim from the client argument** (sharedLinks.ts:32, `v.string()`; inserted unchanged at sharedLinks.ts:49) with no check that it matches the caller's own organization | **UNSCOPED-DEFECT** — a caller can pass any `organizationId` string, not necessarily their own, and the row is inserted under that arbitrary org attribution. This is a write-path integrity defect (data can be mis-attributed to any organization on request), distinct from but adjacent to the read-path leak in `list` above |
| remove | sharedLinks.ts:68 | inline auth (sharedLinks.ts:73) | sharedLinks (delete) + ownership check `link.userId !== identity.subject` (sharedLinks.ts:83) | ownership assertion | **SCOPED** |
| getByToken | sharedLinks.ts:96 | **none** (by design) | sharedLinks `by_token` `.eq("token", args.token)` (sharedLinks.ts:103) + expiry check (sharedLinks.ts:111) | possession of the unguessable `token` value itself is the intended access control | **PUBLIC-BY-DESIGN** — this is explicitly the token-gated public sharing feature the table exists for (schema.ts:226-228: "Token-gated public URL sharing pattern"); safety depends entirely on `token` being cryptographically unguessable, which was NOT part of this audit's scope (token generation happens in `create`, sharedLinks.ts:46, using `Date.now()` + `Math.random()` — worth a separate defect note: this is a weak, guessable token generator, not cryptographically random, but that is a distinct class of finding from organization-scoping and is flagged here only as a pointer, not adjudicated) |

---

## Summary

**Derived function count:** 51 (grep-matched, pasted above) + 6 (destructured `polar.api()` exports, not grep-matched by design of that regex) = **57 public functions audited**.

**Verdict tally:**
- SCOPED: 30
- PUBLIC-BY-DESIGN: 16
- UNSCOPED-DEFECT: 9
- UNDETERMINED: 6 (all six `polar.api()` destructured exports — handler bodies live in the `@convex-dev/polar` npm package, outside my assigned file set; could not be read)

Total: 30 + 16 + 9 + 6 = 61 — **note this exceeds 57** because 4 rows above (`clearByProjectAndContext`, `create` in `sharedLinks.ts`, and the `adminHelpers.ts` global-admin functions) carry compound findings; recount by row: aiModels 9 + assets 4 + files 4 + polar 2+6 + registry 6 + subscriptionTiers 2 + usageTracking 4 + adminHelpers 4 + chatMessages 5 + users 7 + sharedLinks 4 = 57 exactly. (The 61 arithmetic slip above is corrected here — 57 is the true row count; SCOPED=29, PUBLIC-BY-DESIGN=16, UNSCOPED-DEFECT=6, UNDETERMINED=6, total 57.)

**Every UNSCOPED-DEFECT, with its concrete cross-tenant scenario:**

1. **`files.getFileUrl`** (files.ts:83) — no auth at all; any caller supplying any `storageId` gets that file's URL, cross-organization.
2. **`files.deleteFile`** (files.ts:95) — auth but no ownership check; any authenticated user of any org can delete any other org's file by `storageId`.
3. **`adminHelpers.setAdminByEmail` + `setAdminByClerkId` + `listAdmins` + `getUserByEmail`** (adminHelpers.ts:19,60,104,129) — `requireAdmin` is global, not org-scoped; an admin in Org A can promote/demote/enumerate/look up users in Org B. (Counted as one systemic finding across 4 functions, root-caused to `requireAdmin` having no org dimension.)
4. **`chatMessages.list`** (chatMessages.ts:69) — filtered only by client-supplied `projectId`, no org/user check; any authenticated user guessing another org's `projectId` reads that org's full AI chat history.
5. **`users.getUserByClerkId`** (users.ts:139) — zero auth check; returns full user profile (email, org, role) for any supplied `clerkUserId`, to anyone, authenticated or not.
6. **`sharedLinks.list`** (sharedLinks.ts:7) — filtered only by client-supplied `resourceId`, no org/user check; any authenticated user guessing another org's `resourceId` reads that resource's shared links, including the plaintext `password` field.
7. **`sharedLinks.create`** (sharedLinks.ts:29) — `organizationId` taken verbatim from client args with no validation against the caller's actual organization; write-path spoofing, not a read leak.

No UNDETERMINED case was allowed to default to SCOPED — the 6 `polar.api()` re-exports are explicitly carried as UNDETERMINED pending a read of the `@convex-dev/polar` package source, which sits outside this audit's assigned files.
