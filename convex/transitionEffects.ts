import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Sprint 11 Phase 2: Transition Effects Queries and Mutations
 *
 * Provides access to the 46 FFmpeg xfade transition effects stored in Convex.
 * Used by TransitionSelector and SceneTransitionPicker components.
 */

/**
 * List all active transition effects, ordered by sortOrder
 */
export const listActive = query({
	args: {},
	handler: async (ctx) => {
		const effects = await ctx.db
			.query("transitionEffects")
			.withIndex("by_active", (q) => q.eq("isActive", true))
			.collect();

		// Sort by sortOrder (index doesn't support multi-field order)
		return effects.sort((a, b) => a.sortOrder - b.sortOrder);
	},
});

/**
 * List active transition effects by category
 */
export const listByCategory = query({
	args: { category: v.string() },
	handler: async (ctx, args) => {
		const effects = await ctx.db
			.query("transitionEffects")
			.withIndex("by_category", (q) => q.eq("category", args.category))
			.filter((q) => q.eq(q.field("isActive"), true))
			.collect();

		return effects.sort((a, b) => a.sortOrder - b.sortOrder);
	},
});

/**
 * Get a single transition effect by its key
 */
export const getByKey = query({
	args: { key: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("transitionEffects")
			.withIndex("by_key", (q) => q.eq("key", args.key))
			.first();
	},
});

/**
 * Get all unique categories with their effect counts
 */
export const listCategories = query({
	args: {},
	handler: async (ctx) => {
		const effects = await ctx.db
			.query("transitionEffects")
			.withIndex("by_active", (q) => q.eq("isActive", true))
			.collect();

		const categoryMap = new Map<string, number>();
		for (const effect of effects) {
			const count = categoryMap.get(effect.category) || 0;
			categoryMap.set(effect.category, count + 1);
		}

		return Array.from(categoryMap.entries()).map(([name, count]) => ({
			name,
			count,
		}));
	},
});

/**
 * Create a new transition effect (used by seed script)
 */
export const create = mutation({
	args: {
		key: v.string(),
		category: v.string(),
		defaultDuration: v.number(),
		sortOrder: v.number(),
		isActive: v.boolean(),
	},
	handler: async (ctx, args) => {
		// Check if already exists (idempotent for re-running seed)
		const existing = await ctx.db
			.query("transitionEffects")
			.withIndex("by_key", (q) => q.eq("key", args.key))
			.first();

		if (existing) {
			return existing._id;
		}

		const now = Date.now();
		return await ctx.db.insert("transitionEffects", {
			key: args.key,
			category: args.category,
			defaultDuration: args.defaultDuration,
			sortOrder: args.sortOrder,
			isActive: args.isActive,
			createdAt: now,
			updatedAt: now,
		});
	},
});

/**
 * Update a transition effect (for admin use)
 */
export const update = mutation({
	args: {
		key: v.string(),
		isActive: v.optional(v.boolean()),
		defaultDuration: v.optional(v.number()),
		sortOrder: v.optional(v.number()),
		previewGifUrl: v.optional(v.string()),
		previewVideoUrl: v.optional(v.string()),
		previewStorageId: v.optional(v.id("_storage")),
		previewR2Key: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("transitionEffects")
			.withIndex("by_key", (q) => q.eq("key", args.key))
			.first();

		if (!existing) {
			throw new Error(`Transition effect with key "${args.key}" not found`);
		}

		const updates: Record<string, unknown> = {
			updatedAt: Date.now(),
		};

		if (args.isActive !== undefined) updates.isActive = args.isActive;
		if (args.defaultDuration !== undefined)
			updates.defaultDuration = args.defaultDuration;
		if (args.sortOrder !== undefined) updates.sortOrder = args.sortOrder;
		if (args.previewGifUrl !== undefined)
			updates.previewGifUrl = args.previewGifUrl;
		if (args.previewVideoUrl !== undefined)
			updates.previewVideoUrl = args.previewVideoUrl;
		if (args.previewStorageId !== undefined)
			updates.previewStorageId = args.previewStorageId;
		if (args.previewR2Key !== undefined)
			updates.previewR2Key = args.previewR2Key;

		await ctx.db.patch(existing._id, updates);
		return existing._id;
	},
});
