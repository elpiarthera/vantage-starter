import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Voice Models Queries
 * Fetches voice model schemas from Convex for dynamic UI rendering
 * Mirrors imageModels.ts pattern
 */

/** Get all active TTS schemas, sorted by sortOrder */
export const listTTSSchemas = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db
			.query("voiceModelSchemas")
			.withIndex("by_type_active", (q) =>
				q.eq("type", "tts").eq("isActive", true),
			)
			.collect();
	},
});

/** Get schema by schemaId (app ID like "minimax-speech-28-hd") */
export const getBySchemaId = query({
	args: { schemaId: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("voiceModelSchemas")
			.withIndex("by_schema_id", (q) => q.eq("schemaId", args.schemaId))
			.first();
	},
});

/** Get schema by FAL modelId */
export const getByModelId = query({
	args: { modelId: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("voiceModelSchemas")
			.withIndex("by_model_id", (q) => q.eq("modelId", args.modelId))
			.first();
	},
});

/**
 * Get voice history from audioTracks table (BUG-01 fix).
 * Auth is enforced server-side; caller does not need to pass userId.
 */
export const listVoiceHistoryFromTracks = query({
	args: {
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return [];
		const limit = args.limit ?? 20;
		return await ctx.db
			.query("audioTracks")
			.withIndex("by_user", (q) => q.eq("userId", identity.subject))
			.order("desc")
			.take(limit);
	},
});

/**
 * Get voice tracks by project from audioTracks table (BUG-01 fix).
 * Auth is enforced server-side; ownership verified via project record.
 */
export const listVoicesByProjectFromTracks = query({
	args: {
		projectId: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return [];

		// Verify project ownership before returning data
		const project = await ctx.db
			.query("projects")
			.filter((q) => q.eq(q.field("_id"), args.projectId))
			.first();
		if (!project) return [];

		// project.userId is a Convex user _id, not a Clerk id
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();
		if (!user || project.userId !== user._id) return [];

		return await ctx.db
			.query("audioTracks")
			.withIndex("by_project", (q) =>
				// biome-ignore lint/suspicious/noExplicitAny: audioTracks.projectId is v.optional(v.string()); Id<"projects"> is a branded string and compatible at runtime
				q.eq("projectId", args.projectId as any),
			)
			.collect();
	},
});
