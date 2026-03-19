import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Video Models Queries
 * Fetches video model schemas from Convex for dynamic UI rendering.
 * Mirrors voiceModels.ts pattern — substitutes videoModelSchemas.
 * Sprint 37: Storyboard Generator → Production
 */

/** Get all active video model schemas, sorted by sortOrder */
export const getActiveModels = query({
	handler: async (ctx) => {
		return ctx.db
			.query("videoModelSchemas")
			.withIndex("by_active_sort", (q) => q.eq("isActive", true))
			.order("asc")
			.collect();
	},
});

/** Get schema by FAL modelId */
export const getByModelId = query({
	args: { modelId: v.string() },
	handler: async (ctx, args) => {
		return ctx.db
			.query("videoModelSchemas")
			.withIndex("by_model_id", (q) => q.eq("modelId", args.modelId))
			.unique();
	},
});

/** Get schema by schemaId (app ID like "kling-v3-pro-i2v") */
export const getBySchemaId = query({
	args: { schemaId: v.string() },
	handler: async (ctx, args) => {
		return ctx.db
			.query("videoModelSchemas")
			.withIndex("by_schema_id", (q) => q.eq("schemaId", args.schemaId))
			.unique();
	},
});
