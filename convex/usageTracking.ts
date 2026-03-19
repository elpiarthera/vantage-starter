import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Log AI service usage for cost tracking and monitoring
 * Called after every successful AI operation
 */
export const logAIUsage = mutation({
	args: {
		// Who used it (optional - will use auth if not provided)
		userId: v.optional(v.string()),

		// What was used
		service: v.string(), // 'openai', 'together', 'fal'
		model: v.string(), // 'gpt-4o', 'gemini-25-flash-image', etc.

		// Resource tracking
		projectId: v.optional(v.string()),
		resourceType: v.string(), // 'chat', 'prompt', 'image', 'video', 'audio'
		resourceId: v.optional(v.string()), // sceneId, projectId, etc.
		eventType: v.string(), // 'generation', 'enhancement', 'conversation'

		// Usage metrics
		creditsUsed: v.number(), // Normalized credit count (e.g., 1 per image)
		cost: v.number(), // Actual USD cost

		// Metadata (optional)
		metadata: v.optional(
			v.object({
				inputTokens: v.optional(v.number()),
				outputTokens: v.optional(v.number()),
				imageCount: v.optional(v.number()),
				duration: v.optional(v.number()), // ms
				success: v.optional(v.boolean()),
				error: v.optional(v.string()),
				latency: v.optional(v.number()), // ms
				resolution: v.optional(v.string()), // "1K", "2K", "4K"
				aspectRatio: v.optional(v.string()), // "16:9", "9:16", "1:1"
				refunded: v.optional(v.boolean()),
				// Narration-specific fields
				durationMs: v.optional(v.number()), // Audio duration in ms
				speedFactor: v.optional(v.number()), // TTS speed factor applied
				wasRetried: v.optional(v.boolean()), // Was this a retry due to duration
				originalDurationMs: v.optional(v.number()), // Duration before retry
				isFallback: v.optional(v.boolean()), // Was fallback model used
				languageCode: v.optional(v.string()), // ISO language code
				// Video assembly fields
				narrationDurationMs: v.optional(v.number()), // For video assembly
				calculatedClipDuration: v.optional(v.number()), // Calculated clip duration
				numScenes: v.optional(v.number()), // Number of scenes
				// Image generation: image-to-image vs text-to-image
				mode: v.optional(v.string()), // "image-to-image" when applicable
			}),
		),
	},
	handler: async (ctx, args) => {
		// Get userId from args or from auth context
		let userId = args.userId;
		const identity = await ctx.auth.getUserIdentity();
		if (!userId) {
			if (!identity) {
				throw new Error("Not authenticated and no userId provided");
			}
			userId = identity.subject;
		} else if (identity && userId !== identity.subject) {
			// Defence-in-depth: reject if caller-supplied userId doesn't match JWT identity
			throw new Error("Unauthorized: userId mismatch");
		}

		// Insert usage record
		await ctx.db.insert("usageTracking", {
			userId,
			service: args.service,
			model: args.model,
			projectId: args.projectId,
			resourceType: args.resourceType,
			resourceId: args.resourceId,
			eventType: args.eventType,
			creditsUsed: args.creditsUsed,
			cost: args.cost,
			metadata: args.metadata,
			timestamp: Date.now(),
		});

		console.log(
			`[UsageTracking] Logged ${args.service}/${args.model}: $${args.cost.toFixed(4)} ` +
				`(${args.creditsUsed} credits) for ${args.resourceType}:${args.eventType}`,
		);
	},
});

/**
 * Query usage by project for cost monitoring
 */
export const getProjectUsage = query({
	args: {
		projectId: v.string(),
		startTime: v.optional(v.number()),
		endTime: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const records = await ctx.db
			.query("usageTracking")
			.filter((q) => q.eq(q.field("projectId"), args.projectId))
			.filter((q) => q.eq(q.field("userId"), identity.subject))
			.collect();

		// Filter by time range if provided
		let filtered = records;
		if (args.startTime !== undefined) {
			const startTime = args.startTime;
			filtered = filtered.filter((r) => r.timestamp >= startTime);
		}
		if (args.endTime !== undefined) {
			const endTime = args.endTime;
			filtered = filtered.filter((r) => r.timestamp <= endTime);
		}

		// Calculate totals
		const totalCost = filtered.reduce((sum, r) => sum + r.cost, 0);
		const totalCredits = filtered.reduce((sum, r) => sum + r.creditsUsed, 0);

		return {
			records: filtered,
			summary: {
				totalCost,
				totalCredits,
				recordCount: filtered.length,
			},
		};
	},
});

/**
 * List usage records for a user (for usage history display)
 */
export const listByUser = query({
	args: {
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return [];
		}

		const records = await ctx.db
			.query("usageTracking")
			.withIndex("by_user", (q) => q.eq("userId", identity.subject))
			.order("desc")
			.take(args.limit || 50);

		return records;
	},
});

/**
 * Get total usage across all projects for a user
 */
export const getUserTotalUsage = query({
	args: {
		startTime: v.optional(v.number()),
		endTime: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const records = await ctx.db
			.query("usageTracking")
			.filter((q) => q.eq(q.field("userId"), identity.subject))
			.collect();

		// Filter by time range if provided
		let filtered = records;
		if (args.startTime !== undefined) {
			const startTime = args.startTime;
			filtered = filtered.filter((r) => r.timestamp >= startTime);
		}
		if (args.endTime !== undefined) {
			const endTime = args.endTime;
			filtered = filtered.filter((r) => r.timestamp <= endTime);
		}

		// Calculate totals by service
		const byService = filtered.reduce(
			(acc, r) => {
				if (!acc[r.service]) {
					acc[r.service] = { cost: 0, credits: 0, count: 0 };
				}
				acc[r.service].cost += r.cost;
				acc[r.service].credits += r.creditsUsed;
				acc[r.service].count += 1;
				return acc;
			},
			{} as Record<string, { cost: number; credits: number; count: number }>,
		);

		return {
			totalCost: filtered.reduce((sum, r) => sum + r.cost, 0),
			totalCredits: filtered.reduce((sum, r) => sum + r.creditsUsed, 0),
			recordCount: filtered.length,
			byService,
		};
	},
});
