"use node";

/**
 * Generic FAL video action (Storyboard Generator Sprint 37).
 * Scheduled by videoTool.startGenericVideoGeneration only. Not exposed to client.
 *
 * Uses scheduler-chained polling (NOT in-action polling loop) because video
 * generation takes 30–120s — blocking a Convex action for that long is not allowed.
 *
 * All model config read from Convex `videoModelSchemas` table.
 * Pattern mirrors: voiceToolGeneric.ts (queue API) + imageToolGeneric.ts
 */
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { internalAction } from "../_generated/server";

const FAL_KEY = process.env.FAL_KEY;
const BASE = "https://queue.fal.run";

const MAX_POLL_COUNT = 18; // 18 × 10s = 3 minutes

type QueueStatus = "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
interface QueueStatusResponse {
	status: QueueStatus;
	request_id: string;
	error?: string;
}
interface VideoFile {
	url: string;
	content_type?: string;
	file_name?: string;
}
interface FalVideoResult {
	video?: VideoFile;
}

/**
 * Submit a video generation request to FAL queue.
 * Saves requestId to scene, then schedules pollVideoGeneration.
 */
export const generateGenericVideo = internalAction({
	args: {
		sceneId: v.id("scenes"),
		modelId: v.string(),
		filteredParams: v.any(),
		startImageUrl: v.optional(v.string()),
		inputVideoUrl: v.optional(v.string()),
		clerkUserId: v.string(),
		creditTransactionId: v.id("creditTransactions"),
		pollCount: v.number(),
	},
	handler: async (ctx, args) => {
		if (!FAL_KEY) {
			await ctx.runMutation(internal.credits.refundVideoCredits, {
				creditTransactionId: args.creditTransactionId,
				clerkUserId: args.clerkUserId,
			});
			await ctx.runMutation(internal.scenes.updateVideoGenerationStatus, {
				sceneId: args.sceneId,
				status: "failed",
				error: "FAL API key not configured",
			});
			throw new Error("FAL API key not set in deployment (env FAL_KEY)");
		}

		// 1. Load schema from videoModelSchemas to get startImageParam / videoInputParam
		const schema = await ctx.runQuery(api.videoModels.getByModelId, {
			modelId: args.modelId,
		});
		if (!schema) {
			await ctx.runMutation(internal.credits.refundVideoCredits, {
				creditTransactionId: args.creditTransactionId,
				clerkUserId: args.clerkUserId,
			});
			await ctx.runMutation(internal.scenes.updateVideoGenerationStatus, {
				sceneId: args.sceneId,
				status: "failed",
				error: `Unknown video model: ${args.modelId}`,
			});
			throw new Error(`Unknown video model: ${args.modelId}`);
		}

		// 2. Filter params via schema.allowedParams
		const rawParams = args.filteredParams as Record<string, unknown>;
		const filteredParams: Record<string, unknown> = {};
		for (const key of schema.allowedParams) {
			if (key in rawParams && rawParams[key] !== undefined) {
				filteredParams[key] = rawParams[key];
			}
		}

		// 3. Inject start image / video input — driven by schema fields, no type branching
		if (schema.startImageParam && args.startImageUrl) {
			filteredParams[schema.startImageParam] = args.startImageUrl;
		}
		if (schema.videoInputParam && args.inputVideoUrl) {
			filteredParams[schema.videoInputParam] = args.inputVideoUrl;
		}

		// 4. Handle "auto" aspect ratio — omit param so model decides from reference video
		if (filteredParams.aspect_ratio === "auto") {
			delete filteredParams.aspect_ratio;
		}

		// 5. Convert voice_ids textarea string → string[] (split on "\n", trim, max 2)
		if (typeof filteredParams.voice_ids === "string") {
			filteredParams.voice_ids = (filteredParams.voice_ids as string)
				.split("\n")
				.map((s) => s.trim())
				.filter(Boolean)
				.slice(0, 2);
		}

		// 6. Sanitize prompt length
		if (typeof filteredParams.prompt === "string" && schema.maxPromptLength) {
			filteredParams.prompt = (filteredParams.prompt as string).slice(
				0,
				schema.maxPromptLength,
			);
		}

		// 7. POST to FAL queue
		const url = `${BASE}/${schema.modelId}`;
		let requestId: string;
		try {
			const response = await fetch(url, {
				method: "POST",
				headers: {
					Authorization: `Key ${FAL_KEY}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ input: filteredParams }),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(
					`FAL API request failed: ${response.status} ${errorText}`,
				);
			}

			const queueStatus = (await response.json()) as QueueStatusResponse;
			requestId = queueStatus.request_id;
		} catch (error) {
			await ctx.runMutation(internal.credits.refundVideoCredits, {
				creditTransactionId: args.creditTransactionId,
				clerkUserId: args.clerkUserId,
			});
			await ctx.runMutation(internal.scenes.updateVideoGenerationStatus, {
				sceneId: args.sceneId,
				status: "failed",
				error: `FAL API request failed: ${error instanceof Error ? error.message : String(error)}`,
			});
			throw new Error(
				`Failed to queue video generation: ${error instanceof Error ? error.message : String(error)}`,
			);
		}

		// 8. Save requestId to scene as "generating"
		await ctx.runMutation(internal.scenes.updateVideoGenerationStatus, {
			sceneId: args.sceneId,
			status: "generating",
			requestId,
			modelId: schema.modelId,
		});

		// 9. Schedule first poll after 15s
		await ctx.scheduler.runAfter(
			15_000,
			internal.actions.videoToolGeneric.pollVideoGeneration,
			{
				sceneId: args.sceneId,
				requestId,
				modelId: args.modelId,
				clerkUserId: args.clerkUserId,
				creditTransactionId: args.creditTransactionId,
				pollCount: 0,
			},
		);
	},
});

/**
 * Poll FAL queue status for a video generation request.
 * Scheduler-chained: calls itself recursively via ctx.scheduler.runAfter.
 * Max 18 polls × 10s = 3 minutes before timeout.
 */
export const pollVideoGeneration = internalAction({
	args: {
		sceneId: v.id("scenes"),
		requestId: v.string(),
		modelId: v.string(),
		clerkUserId: v.string(),
		creditTransactionId: v.id("creditTransactions"),
		pollCount: v.number(),
	},
	handler: async (ctx, args) => {
		// Timeout guard — 3 minutes max
		if (args.pollCount >= MAX_POLL_COUNT) {
			await ctx.runMutation(internal.credits.refundVideoCredits, {
				creditTransactionId: args.creditTransactionId,
				clerkUserId: args.clerkUserId,
			});
			await ctx.runMutation(internal.scenes.updateVideoGenerationStatus, {
				sceneId: args.sceneId,
				status: "failed",
				error: "Video generation timed out (3 minutes)",
			});
			return;
		}

		if (!FAL_KEY) {
			await ctx.runMutation(internal.credits.refundVideoCredits, {
				creditTransactionId: args.creditTransactionId,
				clerkUserId: args.clerkUserId,
			});
			await ctx.runMutation(internal.scenes.updateVideoGenerationStatus, {
				sceneId: args.sceneId,
				status: "failed",
				error: "FAL API key not configured",
			});
			return;
		}

		const url = `${BASE}/${args.modelId}`;
		const statusUrl = `${url}/requests/${args.requestId}/status`;

		let statusData: QueueStatusResponse;
		try {
			const statusResponse = await fetch(statusUrl, {
				headers: { Authorization: `Key ${FAL_KEY}` },
			});
			if (!statusResponse.ok) {
				// Non-fatal: schedule next poll
				await ctx.scheduler.runAfter(
					10_000,
					internal.actions.videoToolGeneric.pollVideoGeneration,
					{ ...args, pollCount: args.pollCount + 1 },
				);
				return;
			}
			statusData = (await statusResponse.json()) as QueueStatusResponse;
		} catch {
			// Network error — schedule next poll
			await ctx.scheduler.runAfter(
				10_000,
				internal.actions.videoToolGeneric.pollVideoGeneration,
				{ ...args, pollCount: args.pollCount + 1 },
			);
			return;
		}

		if (statusData.status === "COMPLETED") {
			// Fetch result
			const resultUrl = `${url}/requests/${args.requestId}`;
			let result: FalVideoResult | null = null;
			try {
				const resultResponse = await fetch(resultUrl, {
					headers: { Authorization: `Key ${FAL_KEY}` },
				});
				if (resultResponse.ok) {
					result = (await resultResponse.json()) as FalVideoResult;
				}
			} catch {
				// Fall through to failure handling
			}

			const videoUrl = result?.video?.url;
			if (!videoUrl) {
				await ctx.runMutation(internal.credits.refundVideoCredits, {
					creditTransactionId: args.creditTransactionId,
					clerkUserId: args.clerkUserId,
				});
				await ctx.runMutation(internal.scenes.updateVideoGenerationStatus, {
					sceneId: args.sceneId,
					status: "failed",
					error: "No video URL in FAL response",
				});
				return;
			}

			await ctx.runMutation(internal.scenes.updateVideoGenerationStatus, {
				sceneId: args.sceneId,
				status: "completed",
				videoUrl,
			});
			return;
		}

		if (statusData.status === "FAILED") {
			const errorMsg = statusData.error ?? "Video generation failed";
			await ctx.runMutation(internal.credits.refundVideoCredits, {
				creditTransactionId: args.creditTransactionId,
				clerkUserId: args.clerkUserId,
			});
			await ctx.runMutation(internal.scenes.updateVideoGenerationStatus, {
				sceneId: args.sceneId,
				status: "failed",
				error: errorMsg,
			});
			return;
		}

		// IN_QUEUE or IN_PROGRESS — schedule next poll in 10s
		await ctx.scheduler.runAfter(
			10_000,
			internal.actions.videoToolGeneric.pollVideoGeneration,
			{ ...args, pollCount: args.pollCount + 1 },
		);
	},
});
