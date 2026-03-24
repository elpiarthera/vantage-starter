/**
 * Custom Role management functions
 *
 * Ported from vantage-studio/convex/customRoles.ts.
 * Auth adapter applied: getUserAndWorkspace helper replaced with requireAuth +
 * by_owner_and_default workspace resolution. No user.activeWorkspaceId field
 * exists in vantage-starter — workspace resolved via index instead.
 * createdBy stores Clerk user ID string (user.clerkUserId), NOT Convex doc ID.
 *
 * Security fixes applied (per MIGRATION-PLAN.md):
 * - S3: get — if !entity.isSystem, verify workspace ownership before returning
 * - S1: remove — system entities cannot be deleted; ownership guard on user roles
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./lib/auth";
import { rateLimiter } from "./ratelimit";

// D1: Typed document validator for the customRoles table.
// Includes _id and _creationTime (system fields added by Convex to every document).
const customRoleDoc = v.object({
	_id: v.id("customRoles"),
	_creationTime: v.number(),
	name: v.string(),
	icon: v.string(),
	description: v.string(),
	category: v.string(),
	expertise: v.array(v.string()),
	systemPrompt: v.string(),
	isSystem: v.optional(v.boolean()),
	workspaceId: v.optional(v.id("workspaces")),
	createdBy: v.optional(v.string()),
	createdAt: v.number(),
	updatedAt: v.number(),
});

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List all custom roles available to the current user.
 * Returns workspace-specific roles + system roles (deduplicated).
 * Unauthenticated callers receive only system roles.
 */
export const list = query({
	args: {},
	returns: v.array(customRoleDoc),
	handler: async (ctx) => {
		// System roles are readable by anyone (including unauthenticated)
		const systemRoles = await ctx.db
			.query("customRoles")
			.withIndex("by_system", (q) => q.eq("isSystem", true))
			.collect();

		const user = await requireAuth(ctx).catch(() => null);
		if (!user) return systemRoles;

		// 1. Try owned default workspace
		const ownedWorkspace = await ctx.db
			.query("workspaces")
			.withIndex("by_owner_and_default", (q) =>
				q.eq("ownerId", user.clerkUserId).eq("isDefault", true),
			)
			.unique();

		// 2. Fall back to org workspace
		let workspace = ownedWorkspace;
		if (!workspace && user.organizationId) {
			const orgId = user.organizationId;
			workspace = await ctx.db
				.query("workspaces")
				.withIndex("by_organization", (q) => q.eq("organizationId", orgId))
				.first();
		}

		if (!workspace) return systemRoles;

		// Get workspace-specific (user-created) roles
		const workspaceRoles = await ctx.db
			.query("customRoles")
			.withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
			.collect();

		// Combine and deduplicate by _id
		const allRoles = [...workspaceRoles, ...systemRoles];
		const uniqueRoles = Array.from(
			new Map(allRoles.map((role) => [role._id, role])).values(),
		);

		return uniqueRoles;
	},
});

/**
 * Get a single custom role by ID.
 * S3 FIX: if role is not a system role, verify workspace ownership before
 * returning — prevents cross-user role reads.
 */
export const get = query({
	args: { id: v.id("customRoles") },
	returns: v.union(customRoleDoc, v.null()),
	handler: async (ctx, { id }) => {
		const role = await ctx.db.get(id);
		if (!role) return null;

		// System roles are readable by all authenticated and unauthenticated users
		if (role.isSystem) {
			return role;
		}

		// S3: user-created roles require workspace access (owner or org member)
		const user = await requireAuth(ctx).catch(() => null);
		if (!user) return null;

		if (!role.workspaceId) return null;

		const ws = await ctx.db.get(role.workspaceId);
		if (!ws) throw new Error("Forbidden");
		const isOwner = ws.ownerId === user.clerkUserId;
		const isOrgMember =
			ws.organizationId !== null &&
			ws.organizationId !== undefined &&
			ws.organizationId === user.organizationId;
		if (!isOwner && !isOrgMember) throw new Error("Forbidden");

		return role;
	},
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new custom role in the caller's default workspace.
 * Rate limit: 10 per minute per user.
 */
export const create = mutation({
	args: {
		name: v.string(),
		icon: v.string(),
		description: v.string(),
		category: v.string(),
		expertise: v.array(v.string()),
		systemPrompt: v.string(),
	},
	returns: v.id("customRoles"),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);

		// D5: server-side length validation
		if (args.name.length > 200)
			throw new Error("Name must be 200 characters or less");
		if (args.description.length > 5000)
			throw new Error("Description must be 5000 characters or less");

		// Rate limit: 10 custom role creations per minute per user
		const { ok, retryAfter } = await rateLimiter.limit(
			ctx,
			"createCustomRole",
			{ key: user.clerkUserId },
		);
		if (!ok) {
			throw new Error(
				`Rate limit exceeded. Try again in ${Math.ceil((retryAfter ?? 60_000) / 1000)} seconds.`,
			);
		}

		// Workspace resolution via by_owner_and_default — no user.activeWorkspaceId
		const workspace = await ctx.db
			.query("workspaces")
			.withIndex("by_owner_and_default", (q) =>
				q.eq("ownerId", user.clerkUserId).eq("isDefault", true),
			)
			.unique();

		if (!workspace) throw new Error("Workspace not found");

		return await ctx.db.insert("customRoles", {
			name: args.name,
			icon: args.icon,
			description: args.description,
			category: args.category,
			expertise: args.expertise,
			systemPrompt: args.systemPrompt,
			isSystem: false,
			workspaceId: workspace._id,
			// createdBy stores Clerk user ID string — NOT Convex document ID
			createdBy: user.clerkUserId,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
	},
});

/**
 * Update an existing custom role.
 * Only the creator can update their own role. System roles cannot be updated.
 */
export const update = mutation({
	args: {
		id: v.id("customRoles"),
		name: v.optional(v.string()),
		icon: v.optional(v.string()),
		description: v.optional(v.string()),
		category: v.optional(v.string()),
		expertise: v.optional(v.array(v.string())),
		systemPrompt: v.optional(v.string()),
	},
	returns: v.null(),
	handler: async (ctx, { id, ...updates }) => {
		const user = await requireAuth(ctx);

		// D5: server-side length validation on optional fields
		if (updates.name !== undefined && updates.name.length > 200)
			throw new Error("Name must be 200 characters or less");
		if (updates.description !== undefined && updates.description.length > 5000)
			throw new Error("Description must be 5000 characters or less");

		const role = await ctx.db.get(id);
		if (!role) throw new Error("Role not found");

		// System roles cannot be updated
		if (role.isSystem) throw new Error("Forbidden");

		// Ownership check: createdBy is Clerk user ID, compare against user.clerkUserId
		if (role.createdBy !== user.clerkUserId) {
			throw new Error("Forbidden");
		}

		await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
		return null;
	},
});

/**
 * Delete a custom role.
 * S1 FIX: system entities cannot be deleted by anyone. User-created roles
 * require ownership check (createdBy === user.clerkUserId).
 */
export const remove = mutation({
	args: { id: v.id("customRoles") },
	returns: v.null(),
	handler: async (ctx, { id }) => {
		const user = await requireAuth(ctx);

		const role = await ctx.db.get(id);
		if (!role) throw new Error("Role not found");

		// S1: system entities cannot be deleted by any caller
		if (role.isSystem) throw new Error("Forbidden");

		// S1: ownership guard — only creator can delete their own role
		if (role.createdBy !== user.clerkUserId) {
			throw new Error("Forbidden");
		}

		await ctx.db.delete(id);
		return null;
	},
});
