/**
 * Workspace management functions
 *
 * Workspaces are scoped containers within an organization.
 * Each user gets a default personal workspace on first login.
 *
 * Generic pattern — no Studio-specific fields (missions, operations, etc.)
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId, requireAuth } from "./lib/auth";

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List all workspaces owned by the current user.
 */
export const list = query({
	args: {},
	returns: v.array(
		v.object({
			_id: v.id("workspaces"),
			_creationTime: v.number(),
			organizationId: v.string(),
			ownerId: v.string(),
			name: v.string(),
			slug: v.optional(v.string()),
			description: v.optional(v.string()),
			icon: v.optional(v.string()),
			color: v.optional(v.string()),
			isDefault: v.optional(v.boolean()),
			settings: v.optional(
				v.object({
					defaultModel: v.optional(v.string()),
					theme: v.optional(v.string()),
				}),
			),
			lastAccessedAt: v.optional(v.number()),
			createdAt: v.number(),
			updatedAt: v.number(),
		}),
	),
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return [];

		const workspaces = await ctx.db
			.query("workspaces")
			.withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
			.order("desc")
			.collect();

		return workspaces.sort((a, b) => {
			if (a.isDefault) return -1;
			if (b.isDefault) return 1;
			return (b.lastAccessedAt || 0) - (a.lastAccessedAt || 0);
		});
	},
});

/**
 * Get the current user's default workspace ID.
 * Returns null if not authenticated or no default workspace found.
 */
export const getDefault = query({
	args: {},
	returns: v.union(v.id("workspaces"), v.null()),
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const workspace = await ctx.db
			.query("workspaces")
			.withIndex("by_owner_and_default", (q) =>
				q.eq("ownerId", identity.subject).eq("isDefault", true),
			)
			.unique();

		return workspace?._id ?? null;
	},
});

/**
 * Get a specific workspace by ID.
 * Only returns workspace if the current user owns it.
 */
export const getById = query({
	args: { workspaceId: v.id("workspaces") },
	returns: v.union(
		v.object({
			_id: v.id("workspaces"),
			_creationTime: v.number(),
			organizationId: v.string(),
			ownerId: v.string(),
			name: v.string(),
			slug: v.optional(v.string()),
			description: v.optional(v.string()),
			icon: v.optional(v.string()),
			color: v.optional(v.string()),
			isDefault: v.optional(v.boolean()),
			settings: v.optional(
				v.object({
					defaultModel: v.optional(v.string()),
					theme: v.optional(v.string()),
				}),
			),
			lastAccessedAt: v.optional(v.number()),
			createdAt: v.number(),
			updatedAt: v.number(),
		}),
		v.null(),
	),
	handler: async (ctx, { workspaceId }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const workspace = await ctx.db.get(workspaceId);
		if (!workspace) return null;

		// Access control: owner only
		if (workspace.ownerId !== identity.subject) return null;

		return workspace;
	},
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new workspace.
 * First workspace for a user is automatically set as default.
 */
export const create = mutation({
	args: {
		name: v.string(),
		organizationId: v.optional(v.string()),
		slug: v.optional(v.string()),
		description: v.optional(v.string()),
		icon: v.optional(v.string()),
		color: v.optional(v.string()),
	},
	returns: v.id("workspaces"),
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);

		// Use Clerk org if provided, fall back to "personal"
		const organizationId = args.organizationId ?? "personal";

		// First workspace for this user becomes default
		const existing = await ctx.db
			.query("workspaces")
			.withIndex("by_owner", (q) => q.eq("ownerId", userId))
			.first();

		const isDefault = !existing;

		return await ctx.db.insert("workspaces", {
			name: args.name,
			organizationId,
			ownerId: userId,
			slug: args.slug,
			description: args.description,
			icon: args.icon,
			color: args.color,
			isDefault,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
	},
});

/**
 * Ensure a user has a default workspace.
 * Called during user sync (Clerk webhook). Safe to call multiple times.
 */
export const ensureDefault = mutation({
	args: {
		clerkUserId: v.string(),
		organizationId: v.optional(v.string()),
	},
	returns: v.id("workspaces"),
	handler: async (ctx, args) => {
		// Check if default already exists
		const existing = await ctx.db
			.query("workspaces")
			.withIndex("by_owner", (q) => q.eq("ownerId", args.clerkUserId))
			.filter((q) => q.eq(q.field("isDefault"), true))
			.first();

		if (existing) return existing._id;

		// Create default workspace
		return await ctx.db.insert("workspaces", {
			name: "Personal",
			organizationId: args.organizationId ?? "personal",
			ownerId: args.clerkUserId,
			isDefault: true,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
	},
});

/**
 * Ensure the currently authenticated user has a default workspace.
 * Auth-gated version of ensureDefault — safe to call from the client.
 * Returns the existing or newly created workspace ID.
 */
export const ensureMyWorkspace = mutation({
	args: {},
	returns: v.id("workspaces"),
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Unauthenticated");

		const clerkUserId = identity.subject;

		// Return existing default workspace if already present
		const existing = await ctx.db
			.query("workspaces")
			.withIndex("by_owner", (q) => q.eq("ownerId", clerkUserId))
			.first();

		if (existing) return existing._id;

		// Create default workspace
		const now = Date.now();
		return await ctx.db.insert("workspaces", {
			name: "Personal",
			organizationId: "personal",
			ownerId: clerkUserId,
			isDefault: true,
			createdAt: now,
			updatedAt: now,
		});
	},
});

/**
 * Switch the user's active workspace.
 * Updates lastAccessedAt for workspace sorting.
 */
export const switchTo = mutation({
	args: { workspaceId: v.id("workspaces") },
	returns: v.object({ success: v.boolean() }),
	handler: async (ctx, { workspaceId }) => {
		const userId = await getAuthUserId(ctx);

		const workspace = await ctx.db.get(workspaceId);
		if (!workspace) throw new Error("Workspace not found");
		if (workspace.ownerId !== userId)
			throw new Error("No access to this workspace");

		await ctx.db.patch(workspaceId, { lastAccessedAt: Date.now() });

		return { success: true };
	},
});

/**
 * Update workspace name, description, icon, color, and settings.
 * Only the owner can update.
 */
export const update = mutation({
	args: {
		workspaceId: v.id("workspaces"),
		name: v.optional(v.string()),
		slug: v.optional(v.string()),
		description: v.optional(v.string()),
		icon: v.optional(v.string()),
		color: v.optional(v.string()),
		settings: v.optional(
			v.object({
				defaultModel: v.optional(v.string()),
				theme: v.optional(v.string()),
			}),
		),
	},
	returns: v.object({ success: v.boolean() }),
	handler: async (ctx, { workspaceId, ...updates }) => {
		const user = await requireAuth(ctx);

		const workspace = await ctx.db.get(workspaceId);
		if (!workspace) throw new Error("Workspace not found");
		if (workspace.ownerId !== user.clerkUserId)
			throw new Error("Only the owner can update this workspace");

		const patch: Record<string, unknown> = { updatedAt: Date.now() };
		if (updates.name !== undefined) patch.name = updates.name;
		if (updates.slug !== undefined) patch.slug = updates.slug;
		if (updates.description !== undefined)
			patch.description = updates.description;
		if (updates.icon !== undefined) patch.icon = updates.icon;
		if (updates.color !== undefined) patch.color = updates.color;
		if (updates.settings !== undefined) {
			patch.settings = { ...(workspace.settings ?? {}), ...updates.settings };
		}

		await ctx.db.patch(workspaceId, patch);
		return { success: true };
	},
});

/**
 * Delete a workspace.
 * Cannot delete the default workspace.
 * Only the owner can delete.
 */
export const remove = mutation({
	args: { workspaceId: v.id("workspaces") },
	returns: v.object({ success: v.boolean() }),
	handler: async (ctx, { workspaceId }) => {
		const user = await requireAuth(ctx);

		const workspace = await ctx.db.get(workspaceId);
		if (!workspace) throw new Error("Workspace not found");
		if (workspace.ownerId !== user.clerkUserId)
			throw new Error("Only the owner can delete this workspace");
		if (workspace.isDefault)
			throw new Error("Cannot delete your default workspace");

		await ctx.db.delete(workspaceId);
		return { success: true };
	},
});
