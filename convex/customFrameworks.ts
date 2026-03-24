/**
 * Custom Framework management functions
 *
 * Ported from vantage-studio/convex/customFrameworks.ts.
 * Auth adapter applied: by_clerk_id → by_clerk_user_id, clerkId → clerkUserId.
 * createdBy stores Clerk user ID string, NOT Convex document ID.
 * Workspace resolution: by_owner_and_default index (no user.activeWorkspaceId).
 *
 * Security guards applied (per MIGRATION-PLAN.md Task 3.3):
 * - S3: get — system entities readable by all auth users; user entities workspace-scoped
 * - S1: remove — system entities non-deletable; user entities creator-scoped
 * - H5: create — workspace ownership verified before insert
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./lib/auth";
import { rateLimiter } from "./ratelimit";

// D1: Typed document validator for the customFrameworks table.
// Includes _id and _creationTime (system fields added by Convex to every document).
const customFrameworkDoc = v.object({
	_id: v.id("customFrameworks"),
	_creationTime: v.number(),
	name: v.string(),
	icon: v.string(),
	description: v.string(),
	methodology: v.string(),
	bestFor: v.array(v.string()),
	steps: v.array(v.string()),
	systemPromptModifier: v.string(),
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
 * List all custom frameworks visible to the current user.
 * Returns system frameworks + workspace-specific frameworks combined.
 * Unauthenticated: returns system frameworks only (public catalog).
 */
export const list = query({
	args: {},
	returns: v.array(customFrameworkDoc),
	handler: async (ctx) => {
		// System frameworks are always visible to everyone
		const systemFrameworks = await ctx.db
			.query("customFrameworks")
			.withIndex("by_system", (q) => q.eq("isSystem", true))
			.collect();

		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return systemFrameworks;

		// Resolve default workspace via by_owner_and_default — no user.activeWorkspaceId
		const workspace = await ctx.db
			.query("workspaces")
			.withIndex("by_owner_and_default", (q) =>
				q.eq("ownerId", identity.subject).eq("isDefault", true),
			)
			.unique();

		if (!workspace) return systemFrameworks;

		// Workspace-specific frameworks
		const workspaceFrameworks = await ctx.db
			.query("customFrameworks")
			.withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
			.collect();

		// Combine and deduplicate by _id
		const allFrameworks = [...systemFrameworks, ...workspaceFrameworks];
		const uniqueFrameworks = Array.from(
			new Map(allFrameworks.map((f) => [f._id, f])).values(),
		);

		return uniqueFrameworks;
	},
});

/**
 * Get a single custom framework by ID.
 * S3 FIX: system entities readable by all auth users; user entities require workspace ownership.
 */
export const get = query({
	args: { id: v.id("customFrameworks") },
	returns: v.union(customFrameworkDoc, v.null()),
	handler: async (ctx, { id }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const framework = await ctx.db.get(id);
		if (!framework) return null;

		// S3: system frameworks are readable by all authenticated users
		if (framework.isSystem) return framework;

		// User framework — verify workspace ownership
		if (!framework.workspaceId) return null;

		const ws = await ctx.db.get(framework.workspaceId);
		if (!ws || ws.ownerId !== identity.subject) {
			throw new Error("Forbidden");
		}

		return framework;
	},
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new custom framework in the user's default workspace.
 * H5 FIX: workspace ownership verified before insert.
 * Rate limit: 10 per minute per user.
 */
export const create = mutation({
	args: {
		name: v.string(),
		icon: v.string(),
		description: v.string(),
		methodology: v.string(),
		bestFor: v.array(v.string()),
		steps: v.array(v.string()),
		systemPromptModifier: v.string(),
	},
	returns: v.id("customFrameworks"),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);

		// D5: server-side length validation
		if (args.name.length > 200)
			throw new Error("Name must be 200 characters or less");
		if (args.description.length > 5000)
			throw new Error("Description must be 5000 characters or less");

		// Rate limit: 10 custom frameworks per minute per user
		const { ok, retryAfter } = await rateLimiter.limit(
			ctx,
			"createCustomFramework",
			{ key: user.clerkUserId },
		);
		if (!ok) {
			throw new Error(
				`Rate limit exceeded. Try again in ${Math.ceil((retryAfter ?? 60_000) / 1000)} seconds.`,
			);
		}

		// H5: resolve default workspace and verify ownership
		const workspace = await ctx.db
			.query("workspaces")
			.withIndex("by_owner_and_default", (q) =>
				q.eq("ownerId", user.clerkUserId).eq("isDefault", true),
			)
			.unique();

		if (!workspace) throw new Error("Workspace not found");

		return await ctx.db.insert("customFrameworks", {
			name: args.name,
			icon: args.icon,
			description: args.description,
			methodology: args.methodology,
			bestFor: args.bestFor,
			steps: args.steps,
			systemPromptModifier: args.systemPromptModifier,
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
 * Update an existing custom framework.
 * Only the creator can update their framework. System frameworks are immutable.
 */
export const update = mutation({
	args: {
		id: v.id("customFrameworks"),
		name: v.optional(v.string()),
		icon: v.optional(v.string()),
		description: v.optional(v.string()),
		methodology: v.optional(v.string()),
		bestFor: v.optional(v.array(v.string())),
		steps: v.optional(v.array(v.string())),
		systemPromptModifier: v.optional(v.string()),
	},
	returns: v.null(),
	handler: async (ctx, { id, ...updates }) => {
		const user = await requireAuth(ctx);

		// D5: server-side length validation on provided fields
		if (updates.name !== undefined && updates.name.length > 200)
			throw new Error("Name must be 200 characters or less");
		if (updates.description !== undefined && updates.description.length > 5000)
			throw new Error("Description must be 5000 characters or less");

		const framework = await ctx.db.get(id);
		if (!framework) throw new Error("Framework not found");

		// System frameworks are immutable
		if (framework.isSystem) throw new Error("Forbidden");

		// Ownership check — createdBy is Clerk user ID, compare against user.clerkUserId
		if (framework.createdBy !== user.clerkUserId) {
			throw new Error("Forbidden");
		}

		await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
		return null;
	},
});

/**
 * Delete a custom framework.
 * S1 FIX: system frameworks cannot be deleted; only creator can delete user frameworks.
 */
export const remove = mutation({
	args: { id: v.id("customFrameworks") },
	returns: v.null(),
	handler: async (ctx, { id }) => {
		const user = await requireAuth(ctx);

		const framework = await ctx.db.get(id);
		if (!framework) throw new Error("Framework not found");

		// S1: system entities are non-deletable
		if (framework.isSystem) throw new Error("Forbidden");

		// Ownership check — createdBy is Clerk user ID, compare against user.clerkUserId
		if (framework.createdBy !== user.clerkUserId) {
			throw new Error("Forbidden");
		}

		await ctx.db.delete(id);
		return null;
	},
});
