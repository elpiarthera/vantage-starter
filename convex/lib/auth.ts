/**
 * Authentication & Authorization Utilities
 *
 * Adapted from VantageCRM for VantageStarter's schema:
 * - users table uses `clerkUserId` (not `clerkId` / `tokenIdentifier`)
 * - roles: "owner" | "admin" | "member" | "client"
 *
 * Usage:
 *   // Require any logged-in user (queries, mutations)
 *   const user = await requireAuth(ctx);
 *
 *   // Require admin/owner access
 *   const user = await requireAdmin(ctx);
 *
 *   // In actions: require any logged-in user
 *   const identity = await requireUser(ctx);
 */

import type { OAuthCtx } from "@vantageos/cloud-identity";
import { passesScopeFilter } from "@vantageos/cloud-identity";
import type { ActionCtx, MutationCtx, QueryCtx } from "../_generated/server";

// ============================================================================
// CORE AUTH HELPERS
// ============================================================================

/**
 * Get the current authenticated user from the users table.
 * Returns null if not authenticated or user not found.
 */
export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
	const identity = await ctx.auth.getUserIdentity();

	if (!identity) {
		return null;
	}

	const user = await ctx.db
		.query("users")
		.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
		.unique();

	return user;
}

/**
 * Require authentication — throws if user not logged in.
 * Returns the user object from the database.
 */
export async function requireAuth(ctx: QueryCtx | MutationCtx) {
	const user = await getCurrentUser(ctx);

	if (!user) {
		throw new Error("Unauthorized: Authentication required");
	}

	return user;
}

/**
 * Check if the current user is an admin or owner.
 */
export async function isAdmin(ctx: QueryCtx | MutationCtx): Promise<boolean> {
	const user = await getCurrentUser(ctx);
	return user?.role === "admin" || user?.role === "owner";
}

/**
 * Require admin or owner access — throws if user is not authorized.
 * Returns the user object.
 *
 * ORG DIMENSION (schema.ts: `users.organizationId` is `v.optional(v.string())`
 * with no default — org-less rows are a REAL tenant bucket, not a schema
 * artifact: personal/solo-account users genuinely carry `organizationId:
 * undefined` (see the seed helpers in __tests__/convex/org-scoping.test.ts
 * and auth-required.test.ts). There is no separate membership table; role
 * is carried directly on the user row alongside `organizationId`.
 *
 * Callers that gate an operation touching an org-scoped row (e.g.
 * convex/adminHelpers.ts acting on another `users` row) MUST pass
 * `{ targetOrganizationId: <that row's organizationId> }` — including when
 * that value IS `undefined` — as `orgScope`, so this function can verify
 * the caller's own `organizationId` matches it EXACTLY (org-less only
 * matches org-less; `org_a` never matches `undefined`). Omitting `orgScope`
 * entirely (no second argument at all) skips the org check altogether and
 * only proves global role — reserved for the global-catalog case
 * (convex/aiModels.ts, no `organizationId` column at all on that table)
 * where no org check is possible or meaningful. The distinction is
 * deliberately structural (arg omitted vs. `{ targetOrganizationId:
 * undefined }` passed) so "org-less target" can never be silently
 * mistaken for "no target dimension to check".
 *
 * DIVERGENCE FROM `@vantageos/cloud-identity` (T4, written per
 * derive-never-type.md): this function's org check does NOT delegate to the
 * package's `requireTenantId`. `requireTenantId` REFUSES org-less callers by
 * design (VantagePeers Cloud invariant #1123 — every tenant MUST carry an
 * organization). This socle is org-OPTIONAL by design: `organizationId:
 * undefined` is a legitimate personal-account tenant bucket here, and
 * `orgScope` above deliberately treats org-less-matches-org-less as a PASS.
 * Routing this through `requireTenantId` would reject every personal
 * account. The two are opposite semantics, not two implementations of the
 * same rule — so the local exact-match comparison (`user.organizationId !==
 * orgScope.targetOrganizationId`, including `undefined === undefined`) is
 * kept, not reimplemented from the package.
 */
export async function requireAdmin(
	ctx: QueryCtx | MutationCtx,
	orgScope?: { targetOrganizationId: string | undefined },
) {
	const user = await requireAuth(ctx);

	if (user.role !== "admin" && user.role !== "owner") {
		throw new Error("Forbidden: Admin access required");
	}

	if (orgScope && user.organizationId !== orgScope.targetOrganizationId) {
		throw new Error("Forbidden: Admin access required for this organization");
	}

	return user;
}

// ============================================================================
// ACTION HELPERS (actions don't have direct ctx.db access)
// ============================================================================

/**
 * Require authenticated user in actions — throws if not logged in.
 * Returns Clerk identity (subject, tokenIdentifier, etc.).
 *
 * Usage in actions:
 *   const identity = await requireUser(ctx);
 *   const userId = identity.subject;
 */
export async function requireUser(ctx: ActionCtx) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new Error("Unauthorized: Authentication required");
	}
	return identity;
}

// ============================================================================
// CONVENIENCE HELPERS
// ============================================================================

/**
 * Get the authenticated user's Clerk ID.
 * Throws if not authenticated.
 */
export async function getAuthUserId(
	ctx: QueryCtx | MutationCtx | ActionCtx,
): Promise<string> {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new Error("Unauthenticated — user must be logged in");
	}
	return identity.subject;
}

/**
 * Get the authenticated user's Clerk ID, or null if not authenticated.
 */
export async function getAuthUserIdOptional(
	ctx: QueryCtx | MutationCtx | ActionCtx,
): Promise<string | null> {
	const identity = await ctx.auth.getUserIdentity();
	return identity?.subject ?? null;
}

/**
 * Check if the current user owns a resource (by clerkUserId).
 * Throws if the IDs don't match.
 *
 * DELEGATED to `@vantageos/cloud-identity`'s `passesScopeFilter` (T4): this
 * is a genuine semantic match — `passesScopeFilter` returns true iff
 * `row.createdBy` is a member of `oauthCtx.fromAllowList`. Feeding it
 * `fromAllowList: [callerId]` and `row: { createdBy: resourceClerkUserId }`
 * reproduces the exact `callerId === resourceClerkUserId` equality this
 * function always performed — the comparison now lives in one place across
 * the fleet instead of being reimplemented locally.
 */
export async function assertUserOwnsResource(
	ctx: QueryCtx | MutationCtx | ActionCtx,
	resourceClerkUserId: string,
): Promise<void> {
	const userId = await getAuthUserId(ctx);
	const oauthCtx: OAuthCtx = {
		fromAllowList: [userId],
		namespaceReadPrefixes: [],
		namespaceWritePrefixes: [],
	};
	const owns = passesScopeFilter(oauthCtx, { createdBy: resourceClerkUserId });
	if (!owns) {
		throw new Error("Unauthorized — you don't own this resource");
	}
}

// ============================================================================
// WORKSPACE-SCOPED AUTH HELPERS (Phase 2 — orchestration functions)
// Adapted from AUTH-FIELD-MAPPING.md section 8 & 9.
// vantage-starter has no memberships table — access is determined by:
//   - workspace.ownerId === user.clerkUserId  (personal)
//   - workspace.organizationId === user.organizationId  (org member)
// ============================================================================

import type { Id } from "../_generated/dataModel";

/**
 * Require auth AND validate workspace access.
 * Returns { user, workspace }.
 * Throws if: not authenticated, workspace not found, user has no access.
 *
 * DIVERGENCE FROM `@vantageos/cloud-identity` (T4): does NOT delegate to
 * `getEffectiveTenantId` (equality against a bearer-derived `TenantContext`)
 * or `requireTenantId` (refuses org-less). Neither matches this function's
 * shape: access here is `isOwner (personal, org-less-legitimate) OR
 * isOrgMember (organizationId match)`, resolved from the Convex `users` /
 * `workspaces` tables — there is no `TenantContext` bearer object in this
 * socle's request path, and the personal-account branch must keep working
 * for org-less users, which `requireTenantId` would reject outright.
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

	const isOwner = workspace.ownerId === user.clerkUserId;
	const isOrgMember =
		workspace.organizationId !== null &&
		workspace.organizationId !== undefined &&
		workspace.organizationId === user.organizationId;

	if (!isOwner && !isOrgMember) {
		throw new Error("Unauthorized: no access to this workspace");
	}

	return { user, workspace };
}

/**
 * Get workspace context for scoped queries.
 * Reads organizationId from users table (not raw Clerk JWT claim).
 * Returns the resolved user + their org context.
 *
 * KEY DIFFERENCE from vantage-studio: vantage-studio reads org_id from JWT.
 * vantage-starter reads organizationId from users row (stable, set at webhook sync).
 *
 * DIVERGENCE FROM `@vantageos/cloud-identity` (T4): does NOT delegate to
 * `requireTenantId` — `isPersonal: !user.organizationId` is a legitimate,
 * intentionally-returned state here (a solo account), not a refusal case.
 * `requireTenantId` throws on exactly this condition, so using it would
 * break every personal-account caller of this function.
 */
export async function getWorkspaceContext(ctx: QueryCtx | MutationCtx) {
	const user = await requireAuth(ctx);

	return {
		user,
		clerkUserId: user.clerkUserId,
		organizationId: user.organizationId ?? undefined,
		isPersonal: !user.organizationId,
	};
}
