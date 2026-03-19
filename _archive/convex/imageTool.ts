/**
 * Image Tool (Sprint 29 + 30) — client-facing mutations only.
 * All generation flows use startGenericGeneration (zero-code model onboarding via imageModelSchemas).
 * Legacy startKlingT2IGeneration / startKlingI2IGeneration removed in Sprint 38 (dead code cleanup).
 *
 * Sprint 30d.5: Model config now read from Convex `imageModelSchemas` table (zero-code model onboarding).
 */
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation } from "./_generated/server";

/**
 * Start generic FAL image generation (Sprint 30 Phase 1, updated 30d.5).
 * Deducts credits by creditActionType from Convex `imageModelSchemas` table.
 * Client sends modelId (e.g. fal-ai/kling-image/o3/text-to-image) and API-shaped params.
 *
 * Sprint 30d.5: Model config now read from Convex (zero-code model onboarding).
 */
export const startGenericGeneration = mutation({
	args: {
		modelId: v.string(),
		params: v.any(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");

		// Sprint 30d.5: Get model config from Convex instead of hardcoded falModels.ts
		const schema = await ctx.db
			.query("imageModelSchemas")
			.withIndex("by_model_id", (q) => q.eq("modelId", args.modelId))
			.first();

		if (!schema) {
			throw new Error(`Unknown model: ${args.modelId}`);
		}

		if (!schema.isActive) {
			throw new Error(`Model is not available: ${args.modelId}`);
		}

		const result = await ctx.runMutation(internal.credits.deductCredits, {
			clerkUserId: identity.subject,
			actionType: schema.creditActionType,
		});

		if (!result.success || !result.transactionId) {
			throw new Error(result.error ?? "Failed to deduct credits");
		}

		ctx.scheduler.runAfter(
			0,
			internal.actions.imageToolGeneric.generateGeneric,
			{
				modelId: args.modelId,
				params: args.params,
				transactionId: result.transactionId,
				clerkUserId: identity.subject,
			},
		);

		return { success: true, message: "Generation started" };
	},
});
