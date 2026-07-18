/**
 * Admin Helper Functions
 *
 * Utilities for managing admin roles.
 * Use these via Convex CLI for initial setup.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/auth";

/**
 * Set admin role for a user by email
 *
 * Usage:
 * npx convex run adminHelpers:setAdminByEmail '{"email": "your@email.com", "role": "admin"}'
 * npx convex run adminHelpers:setAdminByEmail '{"email": "your@email.com", "role": "owner"}'
 */
export const setAdminByEmail = mutation({
	args: {
		email: v.string(),
		role: v.union(
			v.literal("owner"),
			v.literal("admin"),
			v.literal("member"),
			v.literal("client"),
		),
	},
	handler: async (ctx, args) => {
		const user = await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", args.email))
			.unique();

		// Enforce the org boundary against the TARGET row's organizationId,
		// even when the target does not exist yet (undefined still binds the
		// caller to admins whose own organizationId is also undefined) — the
		// lookup happens before authorization so we have something to check
		// the caller's org against, but no row data is ever returned pre-auth.
		await requireAdmin(ctx, { targetOrganizationId: user?.organizationId });

		if (!user) {
			throw new Error(`User with email ${args.email} not found`);
		}

		await ctx.db.patch(user._id, {
			role: args.role,
		});

		return {
			success: true,
			userId: user._id,
			email: user.email,
			role: args.role,
			message: `User role updated to ${args.role}`,
		};
	},
});

/**
 * Set admin role for a user by Clerk User ID
 *
 * Usage:
 * npx convex run adminHelpers:setAdminByClerkId '{"clerkUserId": "user_xxxxx", "role": "admin"}'
 */
export const setAdminByClerkId = mutation({
	args: {
		clerkUserId: v.string(),
		role: v.union(
			v.literal("owner"),
			v.literal("admin"),
			v.literal("member"),
			v.literal("client"),
		),
	},
	handler: async (ctx, args) => {
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", args.clerkUserId),
			)
			.unique();

		await requireAdmin(ctx, { targetOrganizationId: user?.organizationId });

		if (!user) {
			throw new Error(`User with Clerk ID ${args.clerkUserId} not found`);
		}

		await ctx.db.patch(user._id, {
			role: args.role,
		});

		return {
			success: true,
			userId: user._id,
			email: user.email,
			clerkUserId: user.clerkUserId,
			role: args.role,
			message: `User role updated to ${args.role}`,
		};
	},
});

/**
 * List all admin and owner users
 *
 * Usage:
 * npx convex run adminHelpers:listAdmins
 */
export const listAdmins = query({
	args: {},
	handler: async (ctx) => {
		const caller = await requireAdmin(ctx);
		const users = await ctx.db.query("users").collect();

		// Org-scoped: an admin only enumerates admins within their OWN
		// organization (or the "no organization" bucket if the caller has
		// none) — never other tenants' admin rosters.
		const admins = users.filter(
			(user) =>
				(user.role === "admin" || user.role === "owner") &&
				user.organizationId === caller.organizationId,
		);

		return admins.map((admin) => ({
			userId: admin._id,
			email: admin.email,
			clerkUserId: admin.clerkUserId,
			role: admin.role,
		}));
	},
});

/**
 * Get user info by email
 *
 * Usage:
 * npx convex run adminHelpers:getUserByEmail '{"email": "your@email.com"}'
 */
export const getUserByEmail = query({
	args: {
		email: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", args.email))
			.unique();

		await requireAdmin(ctx, { targetOrganizationId: user?.organizationId });

		if (!user) {
			throw new Error(`User with email ${args.email} not found`);
		}

		return {
			userId: user._id,
			email: user.email,
			clerkUserId: user.clerkUserId,
			role: user.role,
			organizationId: user.organizationId,
		};
	},
});
