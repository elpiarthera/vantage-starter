# Org/Workspace Scoping Audit — Group B

Scope: `convex/agents.ts`, `convex/chats.ts`, `convex/projects.ts`, `convex/skills.ts`, `convex/workspaces.ts`, `convex/missions.ts`
Commit: `59769a4` (main). Read-only audit — no code changed.

## Derived function count

```
grep -nE '^export const [a-zA-Z0-9_]+ = (query|mutation|action)\(' convex/<file>.ts
```

| file | count |
|---|---|
| agents.ts | 8 |
| chats.ts | 11 |
| projects.ts | 6 |
| skills.ts | 9 |
| workspaces.ts | 8 |
| missions.ts | 14 |
| **TOTAL** | **56** |

Row count below = 56 (matches).

## Schema scoping columns (from `convex/schema.ts`)

- `workspaces`: `ownerId` (Clerk user), `organizationId` (Clerk org or `"personal"`). Indexes: `by_owner`, `by_organization`, `by_owner_and_default`.
- `agents`, `skills`, `chats`, `projects`, `missions`, `operations`, `checkpoints`: all carry `workspaceId: v.id("workspaces")` (agents/skills: optional — `undefined` = system/global). Indexed `by_workspace`.
- The org-scoping model here is **workspace-mediated**: a table row is not tagged with an org column directly — access is proven by resolving the row's `workspaceId` → `workspaces` doc → checking `ownerId === caller` or `organizationId === caller.organizationId`. `requireAuthWithWorkspace(ctx, workspaceId)` in `convex/lib/auth.ts:157` implements exactly this check.

---

## Verdict tally

| Verdict | Count |
|---|---|
| SCOPED | 47 |
| PUBLIC-BY-DESIGN | 4 |
| UNSCOPED-DEFECT | 5 |
| UNDETERMINED | 0 |
| **TOTAL** | **56** |

---

## agents.ts (8 functions)

| function | file:line | auth path (verbatim) | table | scoped by | verdict |
|---|---|---|---|---|---|
| `list` | agents.ts:80 | `getUserWorkspace(ctx, args.workspaceId)` → resolves user, then if `workspaceId` given checks `workspace.ownerId === user.clerkUserId \|\| workspace.organizationId === user.organizationId` (agents.ts:44-53); returns `null` on mismatch, caller gets `[]` | `agents` (read) | `.withIndex("by_workspace", eq(workspaceId))` for tenant rows, plus `by_system` for global rows — workspaceId itself pre-validated by `getUserWorkspace` | SCOPED |
| `get` | agents.ts:105 | **none** — no `ctx.auth.getUserIdentity()`, no `requireAuth`, no workspace check at all | `agents` (read) | none — `ctx.db.get(args.agentId)` fetches unconditionally | **UNSCOPED-DEFECT** — any caller (even unauthenticated) passing any `agentId` gets the full agent doc back, including `token`/`tokenCreatedAt` (per-agent HTTP auth secret, agents.ts:550-551), `roleSystemPrompt`, `customInstructions`, `workspaceId`. Scenario: user of workspace A enumerates or guesses agent IDs of workspace B and exfiltrates that agent's auth token. |
| `listSystem` | agents.ts:122 | none required | `agents` (read) | `.withIndex("by_system", eq(isSystem, true))` — only global/system agents, no tenant data | PUBLIC-BY-DESIGN — filtered strictly to `isSystem === true`, which by schema comment (agents.ts:521) means global agents, not tenant-owned |
| `listForAssignment` | agents.ts:136 | same as `list` — `getUserWorkspace(ctx, args.workspaceId)` (agents.ts:139) | `agents` (read) | same as `list`; also projects only `_id/name/roleName/avatar/isSystem` (no token/prompt fields) | SCOPED |
| `getById` (internal) | agents.ts:168 | `internalQuery` — not public, excluded per instructions | — | — | (excluded, internal) |
| `create` | agents.ts:183 | `requireAuthWithWorkspace(ctx, args.workspaceId)` (agents.ts:208) | `agents` (write/insert) | `requireAuthWithWorkspace` throws unless caller owns/org-member of `args.workspaceId`; inserted row uses that same `workspaceId` | SCOPED |
| `update` | agents.ts:245 | fetches agent, then `requireAuthWithWorkspace(ctx, agent.workspaceId)` (agents.ts:286) — i.e. scoping check uses the **target row's own** workspaceId, not a caller-supplied one | `agents` (write) | ownership derived from `agent.workspaceId`, verified before patch | SCOPED |
| `remove` | agents.ts:304 | same pattern — `requireAuthWithWorkspace(ctx, agent.workspaceId)` (agents.ts:319) | `agents` (write, soft-delete) | same | SCOPED |
| `incrementUsage` | agents.ts:328 | `requireAuth(ctx)` only (agents.ts:332) — proves *a* user is logged in, never that they belong to the agent's workspace | `agents` (write — `usageCount` patch) | **none** — `ctx.db.get(args.agentId)` then unconditional `ctx.db.patch` | **UNSCOPED-DEFECT** — any authenticated user of any workspace can pass an arbitrary `agentId` from another org and mutate its `usageCount`/`updatedAt`. Comment at agents.ts:331 explicitly documents this as intentional ("any authenticated user may bump usage counters") but it is still a cross-tenant write with no ownership check — counter-tampering / minor DoS on another org's usage stats. |

## chats.ts (11 functions)

| function | file:line | auth path (verbatim) | table | scoped by | verdict |
|---|---|---|---|---|---|
| `list` | chats.ts:55 | `requireAuth(ctx).catch(() => null)` (chats.ts:64); resolves owned-default workspace via `by_owner_and_default`, falls back to org workspace via `by_organization` (chats.ts:68-83) | `chats` (read) | `.withIndex("by_workspace_created", eq(workspaceId))` where `workspaceId` is the caller's own resolved workspace — no caller-supplied ID | SCOPED |
| `getForCurrentWorkspace` | chats.ts:105 | same pattern as `list` | `chats` (read) | same | SCOPED |
| `getByWorkspace` | chats.ts:145 | `requireAuth` then explicit `isOwner \|\| isOrgMember` check against `args.workspaceId`-fetched workspace (chats.ts:156-161) | `chats` (read) | caller-supplied `workspaceId`, but access-checked before query | SCOPED |
| `getById` | chats.ts:178 | `requireAuth`, fetches chat by ID, then fetches `chat.workspaceId` and checks `isOwner \|\| isOrgMember`, throws `Forbidden` otherwise (chats.ts:188-196) | `chats` (read, by ID arg) | ownership re-derived from the **row's own** workspaceId post-fetch — correct pattern for ID-argument functions | SCOPED |
| `listRecent` | chats.ts:205 | `requireAuth`; if `workspaceId` arg given, checks `isOwner \|\| isOrgMember` (chats.ts:220-225) before using it; else resolves default/org workspace | `chats` (read) | same | SCOPED |
| `listByProject` | chats.ts:262 | `requireAuth`; fetches `project`, then fetches `project.workspaceId` and checks `isOwner \|\| isOrgMember` (chats.ts:279-286) before querying chats `by_project` | `chats` (read, via `projectId` arg) | project's own workspace re-validated — correct for ID-argument function | SCOPED |
| `create` | chats.ts:310 | `requireAuth`; explicit `ws.ownerId !== user.clerkUserId` check (chats.ts:341-344) before insert (owner-only, not org-member — intentionally stricter) | `chats` (write) | workspace ownership re-checked against caller-supplied `workspaceId` | SCOPED |
| `update` | chats.ts:363 | `requireAuth`; `chat.createdBy !== user.clerkUserId` check (chats.ts:380-382) | `chats` (write, by ID arg) | row-level `createdBy` ownership check post-fetch | SCOPED |
| `updateSelectedModel` | chats.ts:393 | same — `chat.createdBy !== user.clerkUserId` (chats.ts:410-412) | `chats` (write) | same | SCOPED |
| `updateEnabledToolkits` | chats.ts:423 | same — `chat.createdBy !== user.clerkUserId` (chats.ts:441-443) | `chats` (write) | same | SCOPED |
| `remove` | chats.ts:455 | same — `chat.createdBy !== user.clerkUserId` (chats.ts:465-467); cascades to `messages` via `chatId` (already tenant-scoped via parent) | `chats`, `messages`, `activities` (write) | ownership re-checked before cascade delete | SCOPED |

## projects.ts (6 functions)

| function | file:line | auth path (verbatim) | table | scoped by | verdict |
|---|---|---|---|---|---|
| `list` | projects.ts:56 | `requireAuth(ctx).catch(() => null)`; if `workspaceId` given, checks `isOwner \|\| isOrgMember` (projects.ts:71-76); else resolves default/org workspace | `projects` (read) | `.withIndex("by_workspace_archived"/"by_workspace", eq(workspaceId))` on pre-validated workspace | SCOPED |
| `get` | projects.ts:121 | `requireAuth`; fetches project, then fetches `project.workspaceId` and checks `isOwner \|\| isOrgMember`, throws `Forbidden` (projects.ts:132-139) | `projects` (read, by ID arg) | row-level workspace re-derived post-fetch — correct for ID-argument function | SCOPED |
| `create` | projects.ts:154 | `requireAuth`; resolves default workspace if none given, then explicit `workspace.ownerId !== user.clerkUserId` check (projects.ts:198-202) | `projects` (write) | workspace ownership check before insert | SCOPED |
| `update` | projects.ts:233 | `requireAuth`; `project.createdBy !== user.clerkUserId` check (projects.ts:250-253) | `projects` (write, by ID arg) | row-level `createdBy` ownership | SCOPED |
| `archive` | projects.ts:275 | `requireAuth`; `project.createdBy !== user.clerkUserId` check (projects.ts:284-287) | `projects` (write) | same | SCOPED |
| `assignTask` | projects.ts:317 | fetches `chat`, then `requireAuthWithWorkspace(ctx, chat.workspaceId)` (projects.ts:328); if `projectId` given, cross-checks `newProject.workspaceId !== chat.workspaceId` and throws (projects.ts:331-336) | `chats`, `projects` (write) | both the chat's own workspace AND the target project's workspace are checked — prevents cross-workspace reassignment | SCOPED |

## skills.ts (9 functions)

| function | file:line | auth path (verbatim) | table | scoped by | verdict |
|---|---|---|---|---|---|
| `list` | skills.ts:76 | `getUserWorkspace(ctx, args.workspaceId)` (skills.ts:79) — same helper/logic as agents.ts | `skills` (read) | `.withIndex("by_workspace", eq(workspaceId))` + `by_system` global, workspaceId pre-validated | SCOPED |
| `get` | skills.ts:96 | **none** — `ctx.db.get(args.skillId)` with zero auth call | `skills` (read) | none | **UNSCOPED-DEFECT** — any caller (auth or not) supplying any `skillId` gets the full skill doc back, including `instructions` (the proprietary skill body, per schema comment "the SKILL.md body") regardless of `visibility: "private"`. Scenario: user of workspace A passes a `skillId` belonging to workspace B's private skill and reads its full instructions text. |
| `listSystem` | skills.ts:103 | none required | `skills` (read) | `.withIndex("by_system", eq(isSystem, true))` — global skills only | PUBLIC-BY-DESIGN |
| `listByCategory` | skills.ts:113 | `getUserWorkspace(ctx, args.workspaceId)` (skills.ts:126) | `skills` (read) | `.withIndex("by_category")` then in-memory `.filter` requiring `workspaceId === result.workspaceId \|\| isSystem === true` (skills.ts:132-137) — workspaceId pre-validated by helper | SCOPED |
| `create` | skills.ts:148 | `requireAuthWithWorkspace(ctx, args.workspaceId)` (skills.ts:167) | `skills` (write) | same as agents `create` | SCOPED |
| `update` | skills.ts:191 | fetches skill, `requireAuthWithWorkspace(ctx, skill.workspaceId)` (skills.ts:226) | `skills` (write, by ID arg) | row's own workspaceId re-validated | SCOPED |
| `remove` | skills.ts:241 | fetches skill, `requireAuthWithWorkspace(ctx, skill.workspaceId)` (skills.ts:256) | `skills` (write) | same | SCOPED |
| `incrementUsage` | skills.ts:262 | `requireAuth(ctx)` only (skills.ts:266) — no workspace check against `skill.workspaceId` | `skills` (write — `usageCount` patch) | none | **UNSCOPED-DEFECT** — identical pattern to `agents.incrementUsage`: any authenticated user of any workspace can pass an arbitrary `skillId` and mutate its `usageCount`. Cross-tenant counter write. |
| `importFromUrl` | skills.ts:336 | `requireUser(ctx)` (action-only auth, skills.ts:355) returning Clerk identity, then `ctx.runMutation(internal.skills.createFromImport, { workspaceId: args.workspaceId, ... })` (skills.ts:429) | `skills` (write, via internal mutation) | **no check that the caller has access to `args.workspaceId`** — `requireUser` only proves the caller is *a* logged-in user, never that they own/belong to `args.workspaceId`. The internal mutation `createFromImport` (skills.ts:282) itself performs no ownership check either (it's `internalMutation`, trusts its caller). | **UNSCOPED-DEFECT** — any authenticated user, from any workspace/org, can call `importFromUrl` with an arbitrary `workspaceId` belonging to a different org and have a new skill row inserted into that org's workspace (`createdBy` will show the *attacker's* Clerk ID, but the skill lands in the victim's workspace and is visible there per `list`/`listByCategory`). Contrast with `create`/`update`/`remove` in the same file, which all correctly call `requireAuthWithWorkspace`. |

## workspaces.ts (8 functions)

| function | file:line | auth path (verbatim) | table | scoped by | verdict |
|---|---|---|---|---|---|
| `list` | workspaces.ts:21 | `ctx.auth.getUserIdentity()` inline (workspaces.ts:47) | `workspaces` (read) | `.withIndex("by_owner", eq(ownerId, identity.subject))` — caller's own ID only, no caller-supplied filter | SCOPED |
| `getDefault` | workspaces.ts:68 | inline identity check (workspaces.ts:72) | `workspaces` (read) | `.withIndex("by_owner_and_default", eq(ownerId, identity.subject)...)` | SCOPED |
| `getById` | workspaces.ts:90 | inline identity check (workspaces.ts:117), then explicit `workspace.ownerId !== identity.subject` → return `null` (workspaces.ts:124) | `workspaces` (read, by ID arg) | row-level owner check post-fetch | SCOPED |
| `create` | workspaces.ts:138 | `getAuthUserId(ctx)` (workspaces.ts:149) | `workspaces` (write) | inserted row's `ownerId` is set to the caller's own ID — no cross-tenant surface | SCOPED |
| `ensureDefault` (internal) | workspaces.ts:185 | `internalMutation` — excluded per instructions | — | — | (excluded, internal) |
| `ensureMyWorkspace` | workspaces.ts:218 | inline identity check (workspaces.ts:222) | `workspaces` (write) | `ownerId` set to caller's own subject | SCOPED |
| `switchTo` | workspaces.ts:252 | `getAuthUserId(ctx)` (workspaces.ts:256), then `workspace.ownerId !== userId` throws (workspaces.ts:260-261) | `workspaces` (write — `lastAccessedAt`) | row-level owner check | SCOPED |
| `update` | workspaces.ts:273 | `requireAuth(ctx)` (workspaces.ts:290), then `workspace.ownerId !== user.clerkUserId` throws (workspaces.ts:294-295) | `workspaces` (write) | row-level owner check (owner-only, no org-member write access — intentional) | SCOPED |
| `remove` | workspaces.ts:318 | `requireAuth` (workspaces.ts:322), `workspace.ownerId !== user.clerkUserId` throws (workspaces.ts:326-327) | `workspaces` (write) | row-level owner check | SCOPED |

## missions.ts (14 functions)

| function | file:line | auth path (verbatim) | table | scoped by | verdict |
|---|---|---|---|---|---|
| `list` | missions.ts:28 | `requireAuthWithWorkspace(ctx, args.workspaceId)` (missions.ts:35) | `missions` (read) | `.withIndex("by_workspace", eq(workspaceId))`, workspaceId pre-validated | SCOPED |
| `listByWorkspace` | missions.ts:60 | `requireAuthWithWorkspace(ctx, args.workspaceId)` (missions.ts:66) | `missions` (read) | same | SCOPED |
| `listByStatus` | missions.ts:81 | `requireAuthWithWorkspace(ctx, args.workspaceId)` (missions.ts:84) | `missions` (read) | same | SCOPED |
| `get` | missions.ts:106 | fetches mission by ID first, **then** `requireAuthWithWorkspace(ctx, mission.workspaceId)` (missions.ts:113) — throws if caller lacks access | `missions` (read, by ID arg) | row's own workspaceId re-validated post-fetch — correct pattern | SCOPED |
| `getStats` | missions.ts:119 | `requireAuthWithWorkspace(ctx, args.workspaceId)` (missions.ts:122) | `missions` (read, aggregated) | same | SCOPED |
| `create` | missions.ts:155 | `requireAuthWithWorkspace(ctx, args.workspaceId)` (missions.ts:199) | `missions` (write) | same | SCOPED |
| `updateStatus` | missions.ts:227 | fetches mission, `requireAuthWithWorkspace(ctx, mission.workspaceId)` (missions.ts:242) | `missions` (write, by ID arg) | row's own workspaceId re-validated | SCOPED |
| `update` | missions.ts:253 | fetches mission, `requireAuthWithWorkspace(ctx, mission.workspaceId)` (missions.ts:300) | `missions` (write) | same | SCOPED |
| `remove` | missions.ts:317 | fetches mission, `requireAuthWithWorkspace(ctx, mission.workspaceId)` (missions.ts:323); cascades to `operations`/`checkpoints` scoped `by_mission` (already tenant-scoped via parent) | `missions`, `operations`, `checkpoints` (write) | same | SCOPED |
| `archive` | missions.ts:351 | fetches mission, `requireAuthWithWorkspace(ctx, mission.workspaceId)` (missions.ts:357) | `missions` (write) | same | SCOPED |
| `markComplete` | missions.ts:368 | fetches mission, `requireAuthWithWorkspace(ctx, mission.workspaceId)` (missions.ts:374) | `missions` (write) | same | SCOPED |
| `updateBrief` | missions.ts:386 | fetches mission, `requireAuthWithWorkspace(ctx, mission.workspaceId)` (missions.ts:395) | `missions` (write) | same | SCOPED |
| `createFromProposal` | missions.ts:416 | `requireAuthWithWorkspace(ctx, args.workspaceId)` (missions.ts:423) | `missions`, `operations`, `checkpoints` (write) | `workspaceId` on all inserted rows derived from the pre-validated `args.workspaceId` | SCOPED |
| `addOperationsFromProposal` | missions.ts:523 | `requireAuth(ctx)` (missions.ts:538) only for the top-level call, **but then** fetches `mission` and calls `requireAuthWithWorkspace(ctx, mission.workspaceId)` (missions.ts:544) before any write — the plain `requireAuth` alone is redundant/dead-end since access is actually gated by the workspace check right after | `operations`, `checkpoints` (write, mission via ID arg) | `mission.workspaceId` re-validated before insert — correct pattern despite the redundant first call | SCOPED |
| `getById` (internal) | missions.ts:631 | `internalQuery` — excluded per instructions | — | — | (excluded, internal) |

---

## Summary of UNSCOPED-DEFECT findings

1. **`agents.get`** (agents.ts:105) — zero auth/scoping. Cross-tenant read of full agent doc, including the per-agent HTTP auth `token`.
2. **`agents.incrementUsage`** (agents.ts:328) — `requireAuth` only, no workspace check on the target `agentId`. Cross-tenant write (usage counter).
3. **`skills.get`** (skills.ts:96) — zero auth/scoping. Cross-tenant read of full skill doc, including `instructions` (proprietary content), even for `visibility: "private"` skills.
4. **`skills.incrementUsage`** (skills.ts:262) — same pattern as (2), cross-tenant write.
5. **`skills.importFromUrl`** (skills.ts:336) — action authenticates the caller (`requireUser`) but never validates that the caller has access to the caller-supplied `args.workspaceId`; the internal mutation it delegates to trusts the workspaceId as given. Cross-tenant write: an authenticated user from org A can insert a new skill row into org B's workspace.

Highest blast-radius: (1) and (3) are read-side, ID-argument functions with **no auth call whatsoever** — the exact "9 of 10 scope correctly, 1 doesn't" pattern the brief called out, both hiding in plain sight next to fully-scoped sibling functions (`list`, `update`, `remove`) in the same file.

Methodology note: no case defaulted to SCOPED without a traced auth-path read; every row above cites the exact line(s) proving or disproving the scoping claim.
