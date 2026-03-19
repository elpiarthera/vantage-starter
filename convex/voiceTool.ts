/**
 * Voice Tool (Voice Generator Phase 2.2) — client-facing mutations and internal saves.
 * Client calls startGenericVoiceGeneration.
 * Credits are deducted here; internal actions are scheduled and refund on failure.
 *
 * Pattern mirrors: imageTool.ts
 */
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation } from "./_generated/server";

/**
 * Start generic voice generation. Deducts credits and schedules internal action.
 * All model config read from Convex voiceModelSchemas table.
 */
export const startGenericVoiceGeneration = mutation({
	args: {
		modelId: v.string(),
		params: v.any(),
		title: v.string(),
		projectId: v.optional(v.id("projects")),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");

		// Get model config from Convex
		const schema = await ctx.db
			.query("voiceModelSchemas")
			.withIndex("by_model_id", (q) => q.eq("modelId", args.modelId))
			.first();

		if (!schema) {
			throw new Error(`Unknown voice model: ${args.modelId}`);
		}

		// Deduct credits by creditActionType
		const result = await ctx.runMutation(internal.credits.deductCredits, {
			clerkUserId: identity.subject,
			actionType: schema.creditActionType,
		});

		if (!result.success || !result.transactionId) {
			throw new Error(result.error ?? "Failed to deduct credits");
		}

		// Schedule internal action (NOT api.*)
		await ctx.scheduler.runAfter(
			0,
			internal.actions.voiceToolGeneric.generateGenericVoice,
			{
				modelId: args.modelId,
				params: args.params,
				transactionId: result.transactionId,
				clerkUserId: identity.subject,
				title: args.title,
				projectId: args.projectId,
			},
		);

		return { success: true, message: "Voice generation started" };
	},
});

/**
 * Start voice recording processing. Deducts 1 credit and schedules storage action.
 */
export const startRecordedVoiceProcessing = mutation({
	args: {
		storageId: v.id("_storage"),
		duration: v.number(),
		title: v.string(),
		projectId: v.optional(v.id("projects")),
		enhance: v.optional(v.boolean()),
		generateTranscript: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");

		// Deduct 1 credit for voice recording
		const result = await ctx.runMutation(internal.credits.deductCredits, {
			clerkUserId: identity.subject,
			actionType: "voice_recording",
		});

		if (!result.success) {
			throw new Error(result.error ?? "Failed to deduct credits");
		}

		if (!result.transactionId) {
			throw new Error("Transaction ID missing from credit deduction");
		}

		// Schedule internal action (pass clerkUserId - actions have no auth context)
		await ctx.scheduler.runAfter(
			0,
			internal.actions.voiceProcessing.processRecordedVoice,
			{
				clerkUserId: identity.subject,
				storageId: args.storageId,
				duration: args.duration,
				title: args.title,
				projectId: args.projectId,
				enhance: args.enhance,
				generateTranscript: args.generateTranscript,
				transactionId: result.transactionId,
			},
		);

		return { success: true, message: "Voice recording processing started" };
	},
});
