# AUTH-FIELD-MAPPING.md
# Phase 0.5 — Auth Field Mapping: vantage-studio → vantage-starter

**Status:** Complete
**Blocks:** Phase 1 (schema verification), Phase 2 (all ported functions)
**Rule:** Every ported file that touches auth fields must apply this mapping before being considered done.

---

## 1. Field Name Differences: users table

| Concept | vantage-studio field | vantage-starter field | Notes |
|---|---|---|---|
| Clerk user ID (primary key) | `clerkId` | `clerkUserId` | Different name, same value (`identity.subject`) |
| Token identifier | `tokenIdentifier` | **does not exist** | Removed in vantage-starter |
| Display name (combined) | `name` | **does not exist** | Split into `firstName` + `lastName` only |
| Avatar URL | `avatarUrl` | `imageUrl` | Different field name |
| Platform role | `role: "user" \| "admin"` | `role: "owner" \| "admin" \| "member" \| "client"` | Different enum values |
| Active workspace pointer | `activeWorkspaceId: v.id('workspaces')` | **does not exist** | Not in vantage-starter users table |
| Settings shape | `{ theme, defaultModel, notifications }` | `{ theme, language, notifications }` (nested in `preferences`) | Field name changed to `preferences` |
| Last login | `lastLoginAt` | `lastActiveAt` | Different field name |

---

## 2. Field Name Differences: organizations table

| Concept | vantage-studio field | vantage-starter field | Notes |
|---|---|---|---|
| Clerk org ID | `clerkId` | `clerkOrganizationId` | Different name, same value |
| Plan | `plan: string` | **does not exist** | Not in vantage-starter organizations |
| Image URL | `imageUrl` | **does not exist** | Not in vantage-starter organizations |
| Usage limits | `usageLimits: { maxWorkspaces, ... }` | **does not exist** | Not in vantage-starter |
| Org type | **does not exist** | `type: "individual" \| "agency" \| "team"` | New field in vantage-starter |
| Total credits | **does not exist** | `totalCreditsUsed: number` | New field in vantage-starter |
| Member/workspace count | `memberCount`, `workspaceCount` | **does not exist** | Removed from vantage-starter |

---

## 3. Index Differences: users table

| Index name | vantage-studio | vantage-starter |
|---|---|---|
| Primary Clerk lookup | `.index('by_clerk_id', ['clerkId'])` | `.index('by_clerk_user_id', ['clerkUserId'])` |
| Token lookup | `.index('by_token', ['tokenIdentifier'])` | **does not exist** — `tokenIdentifier` is gone |
| Email | `.index('by_email', ['email'])` | `.index('by_email', ['email'])` — same |
| Organization | **does not exist** | `.index('by_organization', ['organizationId'])` |
| Org + role | **does not exist** | `.index('by_organization_and_role', ['organizationId', 'role'])` |
| Last active | **does not exist** | `.index('by_last_active', ['lastActiveAt'])` |

---

## 4. Tables in vantage-studio NOT in vantage-starter

| Table | vantage-studio purpose | Status in vantage-starter |
|---|---|---|
| `memberships` | Links users ↔ organizations with roles + permissions | **Missing** — vantage-starter uses `users.organizationId` (string FK) instead |
| `workspaceMembers` | Explicit workspace membership with role | **Missing** — vantage-starter workspaces use `ownerId` only |
| `projects` | Organize work within workspaces | **Missing** |
| `chats` | Chat sessions scoped to workspace | **Missing** |
| `messages` | Chat messages | **Missing** |
| `streams` | Resumable streaming | **Missing** |
| `artifacts` | AI-generated files | **Missing** |
| `integrations` | Composio tool integrations per workspace | **Missing** |
| `votes` | Message feedback | **Missing** |
| `actionWalls` | Grouped action flows | **Missing** |
| `actionFlows` | AI flow templates | **Missing** |
| `flowExecutions` | Flow run history | **Missing** |
| `toolkits` | Admin-editable integration list | **Missing** |
| `aiModels` | Admin-editable AI model list | **Missing** |
| `missions` | High-level work containers | **Missing** |
| `operations` | Tasks within missions | **Missing** |
| `checkpoints` | Human approval gates | **Missing** |
| `agents` | Configured AI workers | **Missing** |
| `skills` | Reusable agent capabilities | **Missing** |
| `customRoles` / `customPersonas` / `customFrameworks` | Agent composition data | **Missing** |
| `comparisons` / `debates` | Brainstorm hub | **Missing** |
| `designAssets` / `folders` / `generationJobs` | Design studio | **Missing** |
| `architectSessions` / `architectMessages` | Architect agent | **Missing** |
| `knowledgeDocuments` / `kbSearchLimits` | Knowledge base | **Missing** |
| `brandKits` / `brandElements` / `projectKits` | Brand kits | **Missing** |

**Tables in vantage-starter NOT in vantage-studio:**

| Table | Purpose |
|---|---|
| `subscriptions` | Polar billing integration |
| `usageTracking` | AI cost metering |
| `activities` | User activity log |
| `sharedLinks` | Token-gated public URL sharing |
| `userCredits` | Per-user credit balance |
| `creditTransactions` | Credit audit log |
| `creditCosts` | Configurable cost per AI action |
| `subscriptionTiers` | Dynamic tier definitions |
| `agentMemory` | Convex-backed AI agent memory |
| `systemConfig` | Runtime-tunable global settings |
| `workspaces` | Present in both but with different schema (see section 6) |

---

## 5. Workspace Table Differences

| Field | vantage-studio | vantage-starter |
|---|---|---|
| Ownership type | `ownerType: "user" \| "organization"` + `ownerId: v.id('users')` + `orgId: v.optional(v.id('organizations'))` | `organizationId: v.string()` (Clerk org ID string, not a Convex ID) + `ownerId: v.string()` (Clerk user ID string) |
| Stats | `chatCount`, `flowCount`, `memberCount` | **does not exist** |
| Settings | `{ defaultModel, theme, enabledTools }` | `{ defaultModel, theme }` |
| Index names | `by_org`, `by_owner_type` | `by_organization`, `by_owner_and_default` |

**Critical difference:** vantage-studio uses typed Convex `v.id()` references for `ownerId` and `orgId`. vantage-starter uses raw Clerk ID strings (`v.string()`). This means no `.get()` shortcut — all workspace ownership lookups go through string comparisons.

---

## 6. How `requireAuth` Should Work in vantage-starter

vantage-starter's `convex/lib/auth.ts` already has a correct `requireAuth`. It uses `by_clerk_user_id` index on `clerkUserId`. **Do not change this.**

```typescript
// vantage-starter/convex/lib/auth.ts — CURRENT (correct)
export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const user = await getCurrentUser(ctx);
  if (!user) throw new Error("Unauthorized: Authentication required");
  return user;
}

// getCurrentUser uses the RIGHT index for vantage-starter:
const user = await ctx.db
  .query("users")
  .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
  .unique();
```

**What to NEVER port from vantage-studio's auth.ts to vantage-starter:**
- `withIndex('by_token', (q) => q.eq('tokenIdentifier', ...))` — index does not exist
- `withIndex('by_clerk_id', (q) => q.eq('clerkId', ...))` — field is `clerkUserId` in vantage-starter
- `getOrCreateMembership()` — memberships table does not exist in vantage-starter
- `getOrCreateOrganization()` with `clerkId` field — must use `clerkOrganizationId`
- `user.role === 'admin'` check alone — vantage-starter admin check is `role === 'admin' || role === 'owner'`

---

## 7. How Workspace Scoping Works

In vantage-studio, workspace scoping is done via Convex `Id<'workspaces'>` throughout. In vantage-starter it is done via string FK fields.

**Pattern for workspace-scoped queries in vantage-starter:**

```typescript
// Step 1: get authenticated user (returns vantage-starter user with clerkUserId)
const user = await requireAuth(ctx);

// Step 2: resolve workspace — look up by ownerId (Clerk user ID string)
const workspace = await ctx.db
  .query("workspaces")
  .withIndex("by_owner", (q) => q.eq("ownerId", user.clerkUserId))
  .first();

// Step 3: for org-scoped workspace, use user.organizationId
// user.organizationId is a Clerk org ID string (links to organizations.clerkOrganizationId)
const orgWorkspaces = await ctx.db
  .query("workspaces")
  .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId!))
  .collect();

// Step 4: verify user owns workspace before mutation
if (workspace.ownerId !== user.clerkUserId) {
  throw new Error("Unauthorized: not your workspace");
}
```

**There is no `memberships` table in vantage-starter.** Workspace access is determined by:
- `workspaces.ownerId === user.clerkUserId` (personal)
- `workspaces.organizationId === user.organizationId` (org-scoped, any member can access)

---

## 8. Adapted `requireAuth` with Workspace Context

This is the function to add to `convex/lib/auth.ts` when Phase 2 requires workspace-scoped operations:

```typescript
// convex/lib/auth.ts — ADD this function for workspace-scoped queries

import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

/**
 * Require auth AND validate workspace access.
 * Returns { user, workspace }.
 * Throws if: not authenticated, workspace not found, user has no access.
 */
export async function requireAuthWithWorkspace(
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<"workspaces">,
) {
  const user = await requireAuth(ctx);

  const workspace = await ctx.db.get(workspaceId);
  if (!workspace) {
    throw new Error("Workspace not found");
  }

  // Personal workspace: owner must match
  const isOwner = workspace.ownerId === user.clerkUserId;

  // Org workspace: user must be in same org
  const isOrgMember =
    workspace.organizationId !== null &&
    workspace.organizationId !== undefined &&
    workspace.organizationId === user.organizationId;

  if (!isOwner && !isOrgMember) {
    throw new Error("Unauthorized: no access to this workspace");
  }

  return { user, workspace };
}
```

---

## 9. Adapted `getWorkspaceContext`

vantage-studio's `getWorkspaceContext` reads `org_id` from the Clerk JWT claim. vantage-starter does not use that — it reads `organizationId` from the `users` table instead.

```typescript
// convex/lib/auth.ts — ADD this function

/**
 * Get workspace context for scoped queries.
 * Uses the users table (not raw Clerk token claims).
 * Returns the resolved user + their org context.
 */
export async function getWorkspaceContext(ctx: QueryCtx | MutationCtx): Promise<{
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
  clerkUserId: string;
  organizationId: string | undefined;
  isPersonal: boolean;
}> {
  const user = await requireAuth(ctx);

  return {
    user,
    clerkUserId: user.clerkUserId,
    organizationId: user.organizationId ?? undefined,
    isPersonal: !user.organizationId,
  };
}
```

**Key difference from vantage-studio:** vantage-studio reads `org_id` from `identity` (JWT claim, changes per active Clerk org). vantage-starter reads `organizationId` from the `users` row (set at webhook sync time, stable). Do not use `(identity as any).org_id` in vantage-starter — it is not the authoritative source here.

---

## 10. Substitution Table: Apply on Every Ported File

When porting any function from vantage-studio, apply these substitutions mechanically:

| vantage-studio pattern | vantage-starter replacement |
|---|---|
| `identity.tokenIdentifier` | Remove — not used |
| `.withIndex('by_token', q => q.eq('tokenIdentifier', ...))` | `.withIndex('by_clerk_user_id', q => q.eq('clerkUserId', identity.subject))` |
| `.withIndex('by_clerk_id', q => q.eq('clerkId', ...))` | `.withIndex('by_clerk_user_id', q => q.eq('clerkUserId', ...))` |
| `user.clerkId` | `user.clerkUserId` |
| `user.name` (combined) | `user.firstName` + `user.lastName` (separate, both optional) |
| `user.avatarUrl` | `user.imageUrl` |
| `user.lastLoginAt` | `user.lastActiveAt` |
| `user.activeWorkspaceId` | **no equivalent** — resolve workspace from ownerId query |
| `user.settings.defaultModel` | `user.preferences?.defaultModel` (`settings` → `preferences`) |
| `user.role === 'admin'` | `user.role === 'admin' || user.role === 'owner'` |
| `org.clerkId` | `org.clerkOrganizationId` |
| `.withIndex('by_clerk_id', q => q.eq('clerkId', orgId))` (orgs) | `.withIndex('by_clerk_org_id', q => q.eq('clerkOrganizationId', orgId))` |
| `workspace.ownerId` (was `v.id('users')`) | `workspace.ownerId` (now `v.string()` = Clerk user ID) |
| `workspace.orgId` | `workspace.organizationId` |
| `(identity as any).org_id` | `user.organizationId` (from DB, not JWT claim) |
| `getOrCreateMembership(...)` | No equivalent — memberships table does not exist |

---

## 11. File-by-File Status

| File | Contains auth field access | Phase 0.5 adaptation needed |
|---|---|---|
| `convex/lib/auth.ts` | YES — `getCurrentUser`, `requireAuth` | **DONE** — already uses `clerkUserId` + `by_clerk_user_id` |
| `convex/users.ts` (to port) | YES | Apply table above on every field read |
| `convex/workspaces.ts` (to port) | YES | `ownerId` is now a string; `orgId` → `organizationId` |
| `convex/organizations.ts` (to port) | YES | `clerkId` → `clerkOrganizationId`; index name changes |
| `convex/agents.ts` (to port) | YES — `createdBy` is Clerk user ID string | Verify against `user.clerkUserId` |
| `convex/missions.ts` (to port) | YES — `createdBy` is string | Same |
| `convex/operations.ts` (to port) | YES — `assignedTo` is Clerk user ID | Same |
| All other ported files | Review for `clerkId`, `tokenIdentifier`, `avatarUrl`, `org_id` | Apply table above |
