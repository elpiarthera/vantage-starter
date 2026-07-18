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
 * SCHEMA GAP (declared, not fixed here — see org-scoping audit,
 * analysis/org-scoping-group-a.md): `role` is a GLOBAL field on `users`.
 * This check verifies the caller's own role only; it does NOT verify that
 * the caller and the target of an admin action share an organization,
 * because this schema has no org-scoped role/membership table to check
 * against. Every function gated solely by `requireAdmin` (see
 * convex/adminHelpers.ts) therefore lets any admin/owner in ANY organization
 * act on users in ANY other organization — promote/demote roles, enumerate
 * admins, and look up any user's full profile by email. Closing this
 * properly requires adding an org-scoped membership/role table (or an
 * `organizationId` equality check against the target row) — a data-model
 * change, out of scope for a per-function auth fix. Do not assume this
 * function provides organization-level isolation; it only proves global
 * role.
 */
export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
	const user = await requireAuth(ctx);

	if (user.role !== "admin" && user.role !== "owner") {
		throw new Error("Forbidden: Admin access required");
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
 */
export async function assertUserOwnsResource(
	ctx: QueryCtx | MutationCtx | ActionCtx,
	resourceClerkUserId: string,
): Promise<void> {
	const userId = await getAuthUserId(ctx);
	if (userId !== resourceClerkUserId) {
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
