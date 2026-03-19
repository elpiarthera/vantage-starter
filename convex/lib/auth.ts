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
