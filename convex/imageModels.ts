/**
 * Image Model Schemas Queries (Sprint 30d.5)
 * Provides queries to fetch model schemas from Convex for dynamic UI rendering.
 * @see docs/Analysis/image-generator/IMAGE-MODELS-ANALYSIS.md
 */

import { v } from "convex/values";
import { internalQuery, query } from "./_generated/server";

/**
 * Get all active T2I schemas (for Generate mode), sorted by sortOrder.
 */
export const listT2ISchemas = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db
			.query("imageModelSchemas")
			.withIndex("by_type_active", (q) =>
				q.eq("type", "t2i").eq("isActive", true),
			)
			.collect();
	},
});

/**
 * Get all active I2I schemas (for Edit mode), sorted by sortOrder.
 */
export const listI2ISchemas = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db
			.query("imageModelSchemas")
			.withIndex("by_type_active", (q) =>
				q.eq("type", "i2i").eq("isActive", true),
			)
			.collect();
	},
});

/**
 * Get schema by schemaId (app ID like "kling-v3-t2i").
 */
export const getBySchemaId = query({
	args: { schemaId: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("imageModelSchemas")
			.withIndex("by_schema_id", (q) => q.eq("schemaId", args.schemaId))
			.first();
	},
});

/**
 * Get schema by FAL modelId (endpoint like "fal-ai/kling-image/v3/text-to-image").
 * Used by backend to lookup model config.
 */
export const getByModelId = query({
	args: { modelId: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("imageModelSchemas")
			.withIndex("by_model_id", (q) => q.eq("modelId", args.modelId))
			.first();
	},
});

/**
 * Internal version of getByModelId for use in actions (not exposed to client).
 */
export const getByModelIdInternal = internalQuery({
	args: { modelId: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("imageModelSchemas")
			.withIndex("by_model_id", (q) => q.eq("modelId", args.modelId))
			.first();
	},
});

/**
 * Get all schemas (for admin).
 */
export const listAll = query({
	args: {},
	handler: async (ctx) => {
		const schemas = await ctx.db.query("imageModelSchemas").collect();
		return schemas.sort((a, b) => a.sortOrder - b.sortOrder);
	},
});

// ============================================================
// IMAGE PRESETS QUERIES (Sprint 30e.6)
// ============================================================

/**
 * Get all active presets, sorted by sortOrder.
 * Used by QuickPresets component.
 */
export const listActivePresets = query({
	args: {},
	handler: async (ctx) => {
		const presets = await ctx.db
			.query("imagePresets")
			.withIndex("by_active_and_sort", (q) => q.eq("isActive", true))
			.collect();
		// Sort by sortOrder (index doesn't guarantee order for second field)
		return presets.sort((a, b) => a.sortOrder - b.sortOrder);
	},
});

/**
 * Get preset by key.
 */
export const getPresetByKey = query({
	args: { key: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("imagePresets")
			.withIndex("by_key", (q) => q.eq("key", args.key))
			.first();
	},
});
