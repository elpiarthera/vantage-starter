/**
 * Video Tool (Storyboard Generator Sprint 37) — client-facing mutations.
 * Client calls startGenericVideoGeneration.
 * Credits deducted here; internal actions are scheduled and refund on failure.
 *
 * Pattern mirrors: voiceTool.ts
 */
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation } from "./_generated/server";
import { deductCreditsForVideo } from "./credits";

/**
 * Start generic video generation for a storyboard scene.
 * Deducts credits (with duration scaling), patches scene to pending,
 * and schedules the generateGenericVideo internal action.
 */
export const startGenericVideoGeneration = mutation({
	args: {
		sceneId: v.id("scenes"),
		schemaId: v.string(),
		startImageUrl: v.optional(v.string()),
		inputVideoUrl: v.optional(v.string()),
		durationSeconds: v.number(),
		params: v.any(),
		selectedTier: v.string(), // "no_audio" | "audio" | "voice" | "standard"
	},
	handler: async (ctx, args) => {
		// 1. Auth check
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Unauthenticated");
		const clerkUserId = identity.subject;

		// 2. Load schema, validate it exists
		const schema = await ctx.db
			.query("videoModelSchemas")
			.withIndex("by_schema_id", (q) => q.eq("schemaId", args.schemaId))
			.unique();
		if (!schema) throw new Error(`Unknown schema: ${args.schemaId}`);

		// 3. Get tierConfig from schema.creditTiers
		const tierConfig = schema.creditTiers.find(
			(t) => t.tier === args.selectedTier,
		);
		if (!tierConfig) throw new Error(`Unknown tier: ${args.selectedTier}`);

		// 4. Duration-scaling guard — V2V Edit has supportsDurationScaling: false (flat rate)
		const effectiveDuration = schema.supportsDurationScaling
			? args.durationSeconds
			: schema.creditBaseDuration; // use base (5) → scaling ratio = 1 → flat cost

		// 5. Deduct credits via helper function (NOT a registered mutation call)
		const deductResult = await deductCreditsForVideo(ctx, {
			clerkUserId,
			actionType: tierConfig.actionType,
			durationSeconds: effectiveDuration,
			baseDurationSeconds: schema.creditBaseDuration,
		});
		if (!deductResult.success || !deductResult.transactionId) {
			throw new Error("Insufficient credits");
		}

		// 6. Patch scene to pending
		await ctx.runMutation(internal.scenes.updateVideoGenerationStatus, {
			sceneId: args.sceneId,
			status: "pending",
			modelId: schema.modelId,
		});

		// 7. Schedule action — pass creditTransactionId so polling can refund without auth
		await ctx.scheduler.runAfter(
			0,
			internal.actions.videoToolGeneric.generateGenericVideo,
			{
				sceneId: args.sceneId,
				modelId: schema.modelId,
				filteredParams: args.params,
				startImageUrl: args.startImageUrl,
				inputVideoUrl: args.inputVideoUrl,
				clerkUserId,
				creditTransactionId: deductResult.transactionId,
				pollCount: 0,
			},
		);

		return { success: true, message: "Video generation started" };
	},
});
