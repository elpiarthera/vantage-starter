/**
 * Admin Helper Functions
 *
 * Utilities for managing admin roles.
 * Use these via Convex CLI for initial setup.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
		const users = await ctx.db.query("users").collect();

		const admins = users.filter(
			(user) => user.role === "admin" || user.role === "owner",
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
