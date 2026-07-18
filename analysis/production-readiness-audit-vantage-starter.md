# Production-readiness audit — vantage-starter

**Scope:** read-only. Nothing was fixed inline; every finding below is a task, not a patch.
**Commit audited:** `ef3aa0d` (origin/main).

> **Snapshot warning — read this before quoting any number below.** These counts describe `ef3aa0d`, which is no longer `main`. PR #28 has since landed and closed the 12 unauthenticated mutations. Re-measured on `main` after that merge, with the same script:
>
> ```
> exports: mutation 85 | query 83 | action 4 | internalMutation 42 | internalQuery 17 | httpAction 8
> public without auth -> mutations: 0 | queries: 24 | actions: 0
> ```
>
> So §2 is **fixed** and §5.1's mutation half is **closed**; the 24 unauthenticated queries and everything in §3 and §4 remain open. This block exists because an audit that keeps asserting a superseded state becomes the stale claim it was written to catch.
**Auditor:** Tau. **Task:** `k177t5f0e69jy4kzk8h5ge2jds8ar95y` (T0, mission `vantage-starter-production-ready-v1`).

> This starter is the base every other app inherits. Its debt becomes their debt — which is why the numbers below are derived by sweep and pasted, never typed.

---

## 0. Method, and a false alarm I caught before publishing it

Every count here is produced by a script over `convex/**/*.ts` (excluding `_generated`), not by hand.

**My first classifier reported "132 of 177 public functions have no auth check". That was wrong**, and it is worth recording why. It matched only inline `ctx.auth.getUserIdentity` / `getAuthUserId`, so it missed every function delegating to a helper in `convex/lib/auth.ts`. `adminHelpers.ts:19 setAdminByEmail` was flagged as unauthenticated while its first statement is `await requireAdmin(ctx)`.

Publishing that number would have been a catastrophic false alarm and would have cost the audit its credibility. The corrected classifier follows the helper layer:

- **ENFORCED** — calls a helper that *throws*: `requireAuth`, `requireAdmin`, `requireUser`, `requireAuthWithWorkspace`, `assertUserOwnsResource`
- **SOFT** — obtains an identity but does not necessarily throw: `getCurrentUser`, `getAuthUserId`, `getAuthUserIdOptional`, `getWorkspaceContext`, or a raw `ctx.auth.getUserIdentity()`
- **NONE** — no reference to identity or to any auth helper anywhere in the function body

A residual limitation, stated rather than hidden: the classifier is lexical. It proves a *reference* exists, not that the reference is used correctly on every branch. SOFT in particular spans "returns [] when logged out" (safe) and "ignores the null and proceeds" (not safe). Each SOFT function needs a human read; that is scoped as its own task, not asserted here.

---

## 1. Derived inventory

```
find convex -name "*.ts" -not -path "*_generated*" | wc -l            -> 50 files
grep -rhoE "^export const [A-Za-z0-9_]+ = [a-zA-Z]+\(" convex/ ...    -> 239 exports
```

| surface | count | reachable by |
|---|---|---|
| `query` / `mutation` / `action` | **177** | any client holding the deployment URL |
| `internalQuery` / `internalMutation` | 54 | other Convex functions only |
| `httpAction` | 8 (3 routes: `/ai/chat`, `/ai/agent`, `/polar/events`) | public HTTP |

**Auth classification of the 177 public functions:**

| class | count |
|---|---|
| ENFORCED (throws) | **96** |
| SOFT (identity referenced, enforcement unproven) | **45** |
| NONE (no auth reference at all) | **36** — of which **12 are mutations** |
| references `organizationId` / `workspaceId` / `tenantId` | 91 |

---

## 2. CRITICAL — public mutations with no authorization

Convex `mutation` exports are callable by anyone who has the deployment URL. These 12 carry no identity reference and no ownership check. Two verified by hand, in full:

**`convex/agents.ts:297` — `remove`**
```ts
export const remove = mutation({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) throw new Error("Agent not found");
    if (agent.isSystem) throw new Error("Cannot delete system agents");
    await ctx.db.patch(args.agentId, { isActive: false, updatedAt: Date.now() });
  },
});
```
The only guard is "is it a system agent". Any caller can soft-delete **any** non-system agent in **any** workspace, by id.

**`convex/subscriptions.ts:319` — `cancel`**
```ts
export const cancel = mutation({
  args: { polarSubscriptionId: v.string() },
  handler: async (ctx, args) => {
    const sub = await ctx.db.query("subscriptions")
      .withIndex("by_polar_subscription_id", q => q.eq("polarSubscriptionId", args.polarSubscriptionId))
      .first();
    if (sub) await ctx.db.patch(sub._id, { status: "canceled", ... });
  },
});
```
Anyone holding or guessing a Polar subscription id can cancel a paying customer's subscription. No identity, no ownership, no webhook-signature path — this is a plain public mutation.

The remaining 10 unauthenticated mutations are listed in §5 and need the same line-by-line read; I verified two rather than asserting twelve.

---

## 3. Tenant isolation — the dispatch brief's premise needs correcting

The brief states multi-tenancy is a facade, citing `convex/projects.ts:70` as `if (!ws || ws.ownerId !== identity.subject) return [];`.

**That line does not exist on `ef3aa0d`.** The current code at that location is:

```ts
const isOwner = ws.ownerId === user.clerkUserId;
const isOrgMember =
  ws.organizationId !== null && ws.organizationId !== undefined &&
  ws.organizationId === user.organizationId;
if (!isOwner && !isOrgMember) return [];
```

Org membership **is** honoured here, and the same pattern lives in `convex/lib/auth.ts:170-172`. So "the server scopes by USER" is not accurate as a blanket statement.

The real defect is **inconsistency, not absence**: 91 of 177 public functions reference a tenant id; **86 do not**. A tenant boundary enforced in some functions and absent in others is arguably worse than one uniformly missing, because it reads as protected. The correct scope for T1 is therefore *"make org scoping uniform and prove it per function"*, not *"introduce org scoping"* — and that re-scoping is exactly what T0 exists to produce.

Not verified here: whether `user.organizationId` is kept in sync with the active Clerk organization (a stale value would silently widen or narrow access). That deserves its own task.

---

## 4. Other production blockers

**Fork residue — another product's auth domain is in our CSP.** `middleware.ts:20,35` and `next.config.mjs:25,67` both allow `https://clerk.myreeldream.ai` in `connect-src` and `frame-src`. This is a third party's Clerk instance trusted by our Content-Security-Policy. It should be configuration, never a literal.

**Zero error tracking.** `grep -cE "sentry|posthog|betterstack|@logtail" package.json` -> **0**. Nothing reports a production exception. (T3 targets Better Stack; its token is provisioned, and it stays in `.env.local` and the hosting environment — never a repo, a served page, or a subagent prompt.)

---

## 5. Full tables

Every exported function, as required. Counts derived by the sweep above.

### 5.1 Public functions with NO auth reference (36)

- `agents.ts:337` **generateToken** (mutation)
- `agents.ts:105` **get** (query)
- `agents.ts:314` **incrementUsage** (mutation)
- `agents.ts:80` **list** (query) — references org/ws
- `agents.ts:136` **listForAssignment** (query) — references org/ws
- `agents.ts:122` **listSystem** (query)
- `agents.ts:297` **remove** (mutation)
- `agents.ts:368` **rotateToken** (mutation)
- `agents.ts:245` **update** (mutation)
- `aiModels.ts:152` **getByModelId** (query)
- `aiModels.ts:167` **getDefault** (query)
- `aiModels.ts:110` **list** (query)
- `aiModels.ts:133` **listAll** (query)
- `credits.ts:373` **getCreditCost** (query)
- `credits.ts:421` **getTransactionHistory** (query)
- `credits.ts:31` **getUserCredits** (query)
- `credits.ts:314` **hasEnoughCredits** (query)
- `credits.ts:404` **listCreditCostsByTypes** (query)
- `files.ts:83` **getFileUrl** (query)
- `sharedLinks.ts:96` **getByToken** (query)
- `skills.ts:96` **get** (query)
- `skills.ts:248` **incrementUsage** (mutation)
- `skills.ts:76` **list** (query) — references org/ws
- `skills.ts:113` **listByCategory** (query) — references org/ws
- `skills.ts:103` **listSystem** (query)
- `skills.ts:234` **remove** (mutation)
- `skills.ts:191` **update** (mutation)
- `subscriptions.ts:319` **cancel** (mutation)
- `subscriptions.ts:142` **create** (mutation) — references org/ws
- `subscriptions.ts:20` **getByClerkUserId** (query) — references org/ws
- `subscriptions.ts:62` **getFormattedSubscription** (query)
- `subscriptionTiers.ts:49` **listCreditPackages** (query)
- `subscriptionTiers.ts:66` **listSubscriptionPlans** (query)
- `users.ts:127` **getUserByClerkId** (query)
- `users.ts:43` **syncUser** (mutation) — references org/ws
- `workspaces.ts:181` **ensureDefault** (mutation) — references org/ws
### 5.2 All 177 public functions

| # | file:line | function | kind | auth | tenant ref |
|---|---|---|---|---|---|
| 1 | `actions/scrapeClient.ts:271` | `run` | action | ENFORCED | — |
| 2 | `actions/scrapeCompetitor.ts:229` | `run` | action | ENFORCED | — |
| 3 | `adminHelpers.ts:129` | `getUserByEmail` | query | ENFORCED | org/ws |
| 4 | `adminHelpers.ts:104` | `listAdmins` | query | ENFORCED | — |
| 5 | `adminHelpers.ts:60` | `setAdminByClerkId` | mutation | ENFORCED | — |
| 6 | `adminHelpers.ts:19` | `setAdminByEmail` | mutation | ENFORCED | — |
| 7 | `agents.ts:183` | `create` | mutation | ENFORCED | org/ws |
| 8 | `agents.ts:337` | `generateToken` | mutation | NONE | — |
| 9 | `agents.ts:105` | `get` | query | NONE | — |
| 10 | `agents.ts:314` | `incrementUsage` | mutation | NONE | — |
| 11 | `agents.ts:80` | `list` | query | NONE | org/ws |
| 12 | `agents.ts:136` | `listForAssignment` | query | NONE | org/ws |
| 13 | `agents.ts:122` | `listSystem` | query | NONE | — |
| 14 | `agents.ts:297` | `remove` | mutation | NONE | — |
| 15 | `agents.ts:368` | `rotateToken` | mutation | NONE | — |
| 16 | `agents.ts:245` | `update` | mutation | NONE | — |
| 17 | `aiModels.ts:193` | `create` | mutation | ENFORCED | — |
| 18 | `aiModels.ts:152` | `getByModelId` | query | NONE | — |
| 19 | `aiModels.ts:167` | `getDefault` | query | NONE | — |
| 20 | `aiModels.ts:110` | `list` | query | NONE | — |
| 21 | `aiModels.ts:133` | `listAll` | query | NONE | — |
| 22 | `aiModels.ts:347` | `remove` | mutation | ENFORCED | — |
| 23 | `aiModels.ts:316` | `setDefault` | mutation | ENFORCED | — |
| 24 | `aiModels.ts:293` | `toggle` | mutation | ENFORCED | — |
| 25 | `aiModels.ts:248` | `update` | mutation | ENFORCED | — |
| 26 | `architectSessions.ts:59` | `addMessage` | mutation | ENFORCED | org/ws |
| 27 | `architectSessions.ts:91` | `complete` | mutation | ENFORCED | org/ws |
| 28 | `architectSessions.ts:19` | `create` | mutation | ENFORCED | org/ws |
| 29 | `architectSessions.ts:154` | `get` | query | SOFT | — |
| 30 | `architectSessions.ts:170` | `getMessages` | query | SOFT | — |
| 31 | `architectSessions.ts:189` | `listRecent` | query | SOFT | org/ws |
| 32 | `architectSessions.ts:130` | `remove` | mutation | ENFORCED | org/ws |
| 33 | `architectSessions.ts:111` | `updateTitle` | mutation | ENFORCED | org/ws |
| 34 | `assets.ts:41` | `get` | query | SOFT | — |
| 35 | `assets.ts:102` | `getUserStorageUsage` | query | SOFT | — |
| 36 | `assets.ts:8` | `list` | query | SOFT | — |
| 37 | `assets.ts:68` | `remove` | mutation | SOFT | — |
| 38 | `chatMessages.ts:161` | `clearByProjectAndContext` | mutation | SOFT | — |
| 39 | `chatMessages.ts:7` | `create` | mutation | SOFT | org/ws |
| 40 | `chatMessages.ts:69` | `list` | query | SOFT | — |
| 41 | `chatMessages.ts:103` | `remove` | mutation | SOFT | — |
| 42 | `chatMessages.ts:129` | `updateContent` | mutation | SOFT | — |
| 43 | `chats.ts:310` | `create` | mutation | ENFORCED | org/ws |
| 44 | `chats.ts:178` | `getById` | query | ENFORCED | org/ws |
| 45 | `chats.ts:145` | `getByWorkspace` | query | ENFORCED | org/ws |
| 46 | `chats.ts:105` | `getForCurrentWorkspace` | query | ENFORCED | org/ws |
| 47 | `chats.ts:55` | `list` | query | ENFORCED | org/ws |
| 48 | `chats.ts:262` | `listByProject` | query | ENFORCED | org/ws |
| 49 | `chats.ts:205` | `listRecent` | query | ENFORCED | org/ws |
| 50 | `chats.ts:455` | `remove` | mutation | ENFORCED | org/ws |
| 51 | `chats.ts:363` | `update` | mutation | ENFORCED | — |
| 52 | `chats.ts:423` | `updateEnabledToolkits` | mutation | ENFORCED | — |
| 53 | `chats.ts:393` | `updateSelectedModel` | mutation | ENFORCED | — |
| 54 | `checkpoints.ts:102` | `approve` | mutation | ENFORCED | org/ws |
| 55 | `checkpoints.ts:193` | `create` | mutation | ENFORCED | org/ws |
| 56 | `checkpoints.ts:57` | `get` | query | ENFORCED | org/ws |
| 57 | `checkpoints.ts:27` | `listByMission` | query | ENFORCED | org/ws |
| 58 | `checkpoints.ts:72` | `listPendingByMission` | query | ENFORCED | org/ws |
| 59 | `checkpoints.ts:148` | `reject` | mutation | ENFORCED | org/ws |
| 60 | `consultantProjects.ts:223` | `addCompetitor` | mutation | ENFORCED | — |
| 61 | `consultantProjects.ts:77` | `create` | mutation | ENFORCED | org/ws |
| 62 | `consultantProjects.ts:390` | `get` | query | SOFT | org/ws |
| 63 | `consultantProjects.ts:432` | `list` | query | SOFT | org/ws |
| 64 | `consultantProjects.ts:121` | `update` | mutation | ENFORCED | — |
| 65 | `consultantProjects.ts:180` | `updateStatus` | mutation | ENFORCED | — |
| 66 | `credits.ts:968` | `deductCreditsPublic` | mutation | SOFT | org/ws |
| 67 | `credits.ts:373` | `getCreditCost` | query | NONE | — |
| 68 | `credits.ts:421` | `getTransactionHistory` | query | NONE | — |
| 69 | `credits.ts:31` | `getUserCredits` | query | NONE | — |
| 70 | `credits.ts:314` | `hasEnoughCredits` | query | NONE | — |
| 71 | `credits.ts:404` | `listCreditCostsByTypes` | query | NONE | — |
| 72 | `credits.ts:1074` | `refundCreditsPublic` | mutation | SOFT | org/ws |
| 73 | `customFrameworks.ts:140` | `create` | mutation | ENFORCED | org/ws |
| 74 | `customFrameworks.ts:102` | `get` | query | ENFORCED | org/ws |
| 75 | `customFrameworks.ts:48` | `list` | query | ENFORCED | org/ws |
| 76 | `customFrameworks.ts:245` | `remove` | mutation | ENFORCED | — |
| 77 | `customFrameworks.ts:204` | `update` | mutation | ENFORCED | — |
| 78 | `customPersonas.ts:136` | `create` | mutation | ENFORCED | org/ws |
| 79 | `customPersonas.ts:98` | `get` | query | ENFORCED | org/ws |
| 80 | `customPersonas.ts:48` | `list` | query | ENFORCED | org/ws |
| 81 | `customPersonas.ts:255` | `remove` | mutation | ENFORCED | — |
| 82 | `customPersonas.ts:200` | `update` | mutation | ENFORCED | — |
| 83 | `customRoles.ts:141` | `create` | mutation | ENFORCED | org/ws |
| 84 | `customRoles.ts:102` | `get` | query | ENFORCED | org/ws |
| 85 | `customRoles.ts:47` | `list` | query | ENFORCED | org/ws |
| 86 | `customRoles.ts:244` | `remove` | mutation | ENFORCED | — |
| 87 | `customRoles.ts:203` | `update` | mutation | ENFORCED | — |
| 88 | `files.ts:95` | `deleteFile` | mutation | SOFT | — |
| 89 | `files.ts:8` | `generateUploadUrl` | mutation | SOFT | — |
| 90 | `files.ts:83` | `getFileUrl` | query | NONE | — |
| 91 | `files.ts:27` | `saveFileMetadata` | mutation | SOFT | — |
| 92 | `memory.ts:285` | `deleteAllMemories` | mutation | SOFT | — |
| 93 | `memory.ts:93` | `listMemories` | query | SOFT | org/ws |
| 94 | `memory.ts:174` | `readMemory` | query | SOFT | org/ws |
| 95 | `messages.ts:252` | `deleteAfterTimestamp` | mutation | ENFORCED | org/ws |
| 96 | `messages.ts:111` | `getById` | query | SOFT | org/ws |
| 97 | `messages.ts:81` | `list` | query | SOFT | org/ws |
| 98 | `messages.ts:144` | `save` | mutation | ENFORCED | org/ws |
| 99 | `messages.ts:205` | `update` | mutation | ENFORCED | — |
| 100 | `missions.ts:523` | `addOperationsFromProposal` | mutation | ENFORCED | org/ws |
| 101 | `missions.ts:351` | `archive` | mutation | ENFORCED | org/ws |
| 102 | `missions.ts:155` | `create` | mutation | ENFORCED | org/ws |
| 103 | `missions.ts:416` | `createFromProposal` | mutation | ENFORCED | org/ws |
| 104 | `missions.ts:106` | `get` | query | ENFORCED | org/ws |
| 105 | `missions.ts:119` | `getStats` | query | ENFORCED | org/ws |
| 106 | `missions.ts:28` | `list` | query | ENFORCED | org/ws |
| 107 | `missions.ts:81` | `listByStatus` | query | ENFORCED | org/ws |
| 108 | `missions.ts:60` | `listByWorkspace` | query | ENFORCED | org/ws |
| 109 | `missions.ts:368` | `markComplete` | mutation | ENFORCED | org/ws |
| 110 | `missions.ts:317` | `remove` | mutation | ENFORCED | org/ws |
| 111 | `missions.ts:253` | `update` | mutation | ENFORCED | org/ws |
| 112 | `missions.ts:386` | `updateBrief` | mutation | ENFORCED | org/ws |
| 113 | `missions.ts:227` | `updateStatus` | mutation | ENFORCED | org/ws |
| 114 | `operations.ts:418` | `clearAgentAssignment` | mutation | ENFORCED | org/ws |
| 115 | `operations.ts:229` | `create` | mutation | ENFORCED | org/ws |
| 116 | `operations.ts:147` | `get` | query | ENFORCED | org/ws |
| 117 | `operations.ts:77` | `getStatsByMission` | query | ENFORCED | org/ws |
| 118 | `operations.ts:163` | `listAll` | query | ENFORCED | org/ws |
| 119 | `operations.ts:26` | `listByMission` | query | ENFORCED | org/ws |
| 120 | `operations.ts:49` | `listByMissionGrouped` | query | ENFORCED | org/ws |
| 121 | `operations.ts:329` | `remove` | mutation | ENFORCED | org/ws |
| 122 | `operations.ts:353` | `update` | mutation | ENFORCED | org/ws |
| 123 | `operations.ts:293` | `updateStatus` | mutation | ENFORCED | org/ws |
| 124 | `polar.ts:80` | `getCurrentSubscription` | query | SOFT | — |
| 125 | `polar.ts:21` | `getUserInfo` | query | SOFT | — |
| 126 | `projects.ts:275` | `archive` | mutation | ENFORCED | org/ws |
| 127 | `projects.ts:317` | `assignTask` | mutation | ENFORCED | org/ws |
| 128 | `projects.ts:154` | `create` | mutation | ENFORCED | org/ws |
| 129 | `projects.ts:121` | `get` | query | ENFORCED | org/ws |
| 130 | `projects.ts:56` | `list` | query | ENFORCED | org/ws |
| 131 | `projects.ts:233` | `update` | mutation | ENFORCED | — |
| 132 | `rateLimits.ts:68` | `deductCreditsRateLimited` | mutation | SOFT | org/ws |
| 133 | `registry.ts:153` | `getRecommendationsForPains` | query | ENFORCED | — |
| 134 | `registry.ts:99` | `getTeam` | query | ENFORCED | — |
| 135 | `registry.ts:115` | `listAgentsByTeam` | query | ENFORCED | — |
| 136 | `registry.ts:266` | `listSkills` | query | ENFORCED | — |
| 137 | `registry.ts:131` | `listSkillsByTeam` | query | ENFORCED | — |
| 138 | `registry.ts:68` | `listTeams` | query | ENFORCED | — |
| 139 | `sharedLinks.ts:29` | `create` | mutation | SOFT | org/ws |
| 140 | `sharedLinks.ts:96` | `getByToken` | query | NONE | — |
| 141 | `sharedLinks.ts:7` | `list` | query | SOFT | — |
| 142 | `sharedLinks.ts:68` | `remove` | mutation | SOFT | — |
| 143 | `skills.ts:148` | `create` | mutation | ENFORCED | org/ws |
| 144 | `skills.ts:96` | `get` | query | NONE | — |
| 145 | `skills.ts:319` | `importFromUrl` | action | ENFORCED | org/ws |
| 146 | `skills.ts:248` | `incrementUsage` | mutation | NONE | — |
| 147 | `skills.ts:76` | `list` | query | NONE | org/ws |
| 148 | `skills.ts:113` | `listByCategory` | query | NONE | org/ws |
| 149 | `skills.ts:103` | `listSystem` | query | NONE | — |
| 150 | `skills.ts:234` | `remove` | mutation | NONE | — |
| 151 | `skills.ts:191` | `update` | mutation | NONE | — |
| 152 | `subscriptions.ts:319` | `cancel` | mutation | NONE | — |
| 153 | `subscriptions.ts:142` | `create` | mutation | NONE | org/ws |
| 154 | `subscriptions.ts:20` | `getByClerkUserId` | query | NONE | org/ws |
| 155 | `subscriptions.ts:62` | `getFormattedSubscription` | query | NONE | — |
| 156 | `subscriptionTiers.ts:49` | `listCreditPackages` | query | NONE | — |
| 157 | `subscriptionTiers.ts:66` | `listSubscriptionPlans` | query | NONE | — |
| 158 | `usageTracking.ts:95` | `getProjectUsage` | query | SOFT | — |
| 159 | `usageTracking.ts:165` | `getUserTotalUsage` | query | SOFT | — |
| 160 | `usageTracking.ts:142` | `listByUser` | query | SOFT | — |
| 161 | `usageTracking.ts:8` | `logAIUsage` | mutation | SOFT | — |
| 162 | `users.ts:333` | `deleteAccount` | action | SOFT | — |
| 163 | `users.ts:16` | `getCurrentUser` | query | SOFT | — |
| 164 | `users.ts:194` | `getLanguagePreference` | query | SOFT | — |
| 165 | `users.ts:127` | `getUserByClerkId` | query | NONE | — |
| 166 | `users.ts:43` | `syncUser` | mutation | NONE | org/ws |
| 167 | `users.ts:145` | `updateLanguagePreference` | mutation | SOFT | — |
| 168 | `users.ts:218` | `updatePreferences` | mutation | SOFT | — |
| 169 | `workspaces.ts:138` | `create` | mutation | SOFT | org/ws |
| 170 | `workspaces.ts:181` | `ensureDefault` | mutation | NONE | org/ws |
| 171 | `workspaces.ts:214` | `ensureMyWorkspace` | mutation | SOFT | org/ws |
| 172 | `workspaces.ts:90` | `getById` | query | SOFT | org/ws |
| 173 | `workspaces.ts:68` | `getDefault` | query | SOFT | — |
| 174 | `workspaces.ts:21` | `list` | query | SOFT | org/ws |
| 175 | `workspaces.ts:314` | `remove` | mutation | ENFORCED | org/ws |
| 176 | `workspaces.ts:248` | `switchTo` | mutation | SOFT | org/ws |
| 177 | `workspaces.ts:269` | `update` | mutation | ENFORCED | org/ws |

### 5.3 All 62 internal / httpAction functions

| # | file:line | function | kind | auth |
|---|---|---|---|---|
| 1 | `agents.ts:168` | `getById` | internalQuery | NONE |
| 2 | `agents.ts:402` | `incrementUsageInternal` | internalMutation | NONE |
| 3 | `aiModels.ts:368` | `clearAll` | internalMutation | NONE |
| 4 | `aiModels.ts:393` | `seed` | internalMutation | NONE |
| 5 | `consultantProjects.ts:366` | `getForOwnerCheck` | internalQuery | NONE |
| 6 | `consultantProjects.ts:282` | `updateBrandKit` | internalMutation | NONE |
| 7 | `consultantProjects.ts:310` | `updateCompetitorProfile` | internalMutation | NONE |
| 8 | `credits.ts:218` | `addCredits` | internalMutation | NONE |
| 9 | `credits.ts:649` | `addMonthlyRenewalCredits` | internalMutation | NONE |
| 10 | `credits.ts:777` | `addMonthlyRenewalCreditsFixed` | internalMutation | NONE |
| 11 | `credits.ts:558` | `addPurchaseCredits` | internalMutation | NONE |
| 12 | `credits.ts:83` | `deductCredits` | internalMutation | NONE |
| 13 | `credits.ts:540` | `getTransaction` | internalQuery | NONE |
| 14 | `credits.ts:899` | `initializeForSubscription` | internalMutation | NONE |
| 15 | `credits.ts:447` | `refundCredits` | internalMutation | NONE |
| 16 | `email.ts:94` | `sendBillingConfirmationEmail` | internalMutation | NONE |
| 17 | `email.ts:32` | `sendWelcomeEmail` | internalMutation | NONE |
| 18 | `http/agent.ts:58` | `agentChat` | httpAction | SOFT |
| 19 | `http/ai.ts:43` | `chat` | httpAction | SOFT |
| 20 | `http/orchestration.ts:66` | `agentOptionsHandler` | httpAction | NONE |
| 21 | `http/orchestration.ts:85` | `claimOperation` | httpAction | NONE |
| 22 | `http/orchestration.ts:199` | `completeOperation` | httpAction | NONE |
| 23 | `http/orchestration.ts:298` | `failOperation` | httpAction | NONE |
| 24 | `http/orchestration.ts:370` | `getMissionContext` | httpAction | NONE |
| 25 | `http/orchestration.ts:348` | `getPendingOperations` | httpAction | NONE |
| 26 | `lib/agentComposer.ts:26` | `composeAgentSystemPrompt` | internalQuery | NONE |
| 27 | `memory.ts:131` | `createMemory` | internalMutation | NONE |
| 28 | `memory.ts:263` | `deleteMemory` | internalMutation | NONE |
| 29 | `memory.ts:73` | `getCoreMemory` | internalQuery | NONE |
| 30 | `memory.ts:36` | `getFile` | internalQuery | NONE |
| 31 | `memory.ts:197` | `replaceInMemory` | internalMutation | NONE |
| 32 | `memory.ts:228` | `searchMemory` | internalQuery | NONE |
| 33 | `messages.ts:331` | `createChatSystem` | internalMutation | NONE |
| 34 | `messages.ts:356` | `getOrCreateChatSystem` | internalMutation | NONE |
| 35 | `messages.ts:297` | `saveSystem` | internalMutation | NONE |
| 36 | `missions.ts:631` | `getById` | internalQuery | NONE |
| 37 | `operations.ts:529` | `agentHasMissionAccess` | internalQuery | NONE |
| 38 | `operations.ts:574` | `claimInternal` | internalMutation | NONE |
| 39 | `operations.ts:594` | `completeInternal` | internalMutation | NONE |
| 40 | `operations.ts:620` | `failInternal` | internalMutation | NONE |
| 41 | `operations.ts:443` | `getById` | internalQuery | NONE |
| 42 | `operations.ts:454` | `getDepStatuses` | internalQuery | NONE |
| 43 | `operations.ts:548` | `getMissionContextOps` | internalQuery | NONE |
| 44 | `operations.ts:472` | `getPendingForAgent` | internalQuery | NONE |
| 45 | `operations.ts:503` | `getSiblingStatuses` | internalQuery | NONE |
| 46 | `orchestration.ts:142` | `onCheckpointApproved` | internalMutation | NONE |
| 47 | `orchestration.ts:38` | `onOperationCompleted` | internalMutation | NONE |
| 48 | `rateLimits.ts:218` | `addCreditsRateLimited` | internalMutation | NONE |
| 49 | `rateLimits.ts:326` | `checkAiStreamingRateLimit` | internalMutation | NONE |
| 50 | `seed.ts:20` | `seedOrchestration` | internalMutation | NONE |
| 51 | `seed/seedCreditCosts.ts:93` | `seedCreditCosts` | internalMutation | NONE |
| 52 | `seed/seedRegistry.ts:1005` | `seedRegistry` | internalMutation | NONE |
| 53 | `seedCredits.ts:118` | `patchSubscriptionTiersPolarIds` | internalMutation | NONE |
| 54 | `seedCredits.ts:259` | `patchTierMonthlyCredits` | internalMutation | NONE |
| 55 | `seedCredits.ts:19` | `seedAll` | internalMutation | NONE |
| 56 | `skills.ts:265` | `createFromImport` | internalMutation | NONE |
| 57 | `subscriptions.ts:217` | `updateTier` | internalMutation | NONE |
| 58 | `subscriptions.ts:256` | `updateTierByWebhook` | internalMutation | NONE |
| 59 | `subscriptionTiers.ts:28` | `getByPolarProductId` | internalQuery | NONE |
| 60 | `users.ts:270` | `cleanupUserData` | internalMutation | NONE |
| 61 | `users.ts:392` | `getByClerkId` | internalQuery | NONE |
| 62 | `users.ts:409` | `getByConvexId` | internalQuery | NONE |

---

## 6. Proposed task split (Pi opens these; nothing fixed inline)

| # | finding | severity |
|---|---|---|
| A | 12 public mutations with no authorization (`agents.remove`, `subscriptions.cancel` verified) | critical |
| B | 45 SOFT functions need a per-function read: does the null identity actually stop the branch? | high |
| C | tenant scoping present in 91/177 — make it uniform and prove it per function (re-scopes T1) | high |
| D | `user.organizationId` sync with the active Clerk org — unverified | high |
| E | `clerk.myreeldream.ai` out of CSP; tenant values become configuration (T2) | medium |
| F | no error tracking (T3) | medium |

---

*Orchestrator: Tau — VantageOS Team | 2026-07-18*
