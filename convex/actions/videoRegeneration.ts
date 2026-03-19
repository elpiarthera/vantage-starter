"use node";

import { v } from "convex/values";
import { buildRegenerationPrompt } from "../../lib/ai/prompts";
import { api } from "../_generated/api";
import { action } from "../_generated/server";

const FAL_KEY = process.env.FAL_KEY;

const KLING_MODEL_ID = "fal-ai/kling-video/v2.5-turbo/pro/image-to-video";

/**
 * Regenerate video with user feedback
 *
 * This action allows users to regenerate a video by providing feedback
 * on what they want changed. The feedback is integrated into the prompt
 * using the modular prompts system.
 *
 * Features:
 * - Incorporates user feedback into regeneration prompt
 * - Tracks regeneration history in scene
 * - Increments video version number
 * - Preserves original video generation data
 * - Reuses start/end frames from original generation
 * - Full error handling and cost tracking
 *
 * Use cases:
 * - "Make it faster paced"
 * - "Add more dramatic lighting"
 * - "Slow down the camera movement"
 * - "Make it more cinematic"
 *
 * Model: fal.ai Kling Video v2.5 Turbo Pro
 * @see lib/ai/prompts/video/generation.prompt.ts::buildRegenerationPrompt
 */
export const regenerateVideo = action({
	args: {
		sceneId: v.id("scenes"),
		feedback: v.string(), // User feedback for regeneration
		sceneDescription: v.optional(v.string()), // Optional: override scene description
		cinematicStyles: v.optional(v.array(v.string())), // Optional: override styles
	},
	handler: async (
		ctx,
		args,
	): Promise<{
		success: boolean;
		requestId: string;
		videoVersion: number;
		message: string;
	}> => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");

		if (!FAL_KEY) {
			throw new Error("FAL_KEY not configured");
		}

		const userId = identity.subject;
		const startTime = Date.now();

		try {
			console.log(
				`[VideoRegen] Starting regeneration for scene ${args.sceneId}`,
			);

			// Get scene and verify ownership
			const scene = await ctx.runQuery(api.scenes.get, {
				sceneId: args.sceneId,
			});

			if (!scene) throw new Error("Scene not found");
			if (scene.userId !== userId) throw new Error("Unauthorized");

			// Check if scene has previous video generation
			if (!scene.videoGeneration) {
				throw new Error(
					"Cannot regenerate: no previous video generation found",
				);
			}

			// Get previous prompt and frame URLs
			const previousPrompt: string = scene.videoGeneration.prompt ?? "";
			const startFrameUrl: string = scene.videoGeneration.startFrameUrl ?? "";
			const endFrameUrl: string | undefined = scene.videoGeneration.endFrameUrl;

			// Build regeneration prompt with feedback
			const regenerationPrompt = buildRegenerationPrompt(
				previousPrompt,
				args.feedback,
			);

			console.log(
				`[VideoRegen] Generated prompt with feedback: ${regenerationPrompt.substring(0, 100)}...`,
			);

			// Save current generation to history before regenerating
			const previousGeneration = {
				version: scene.videoVersion || 1,
				feedback: args.feedback,
				previousVideoUrl: scene.videoUrl || "",
				regeneratedAt: Date.now(),
			};

			// Get current regeneration history
			const regenerationHistory = scene.regenerationHistory || [];

			// Prepare fal.ai request payload
			const falInput: {
				prompt: string;
				image_url: string;
				duration: string;
				cfg_scale: number;
				negative_prompt: string;
				tail_image_url?: string;
			} = {
				prompt: regenerationPrompt,
				image_url: startFrameUrl,
				duration: scene.duration === 10 ? "10" : "5",
				cfg_scale: 0.5,
				negative_prompt: "blur, distort, and low quality",
				...(endFrameUrl && { tail_image_url: endFrameUrl }),
			};

			console.log("[VideoRegen] Submitting regeneration job to fal.ai...");

			// Submit job to fal.ai Queue API
			const response: Response = await fetch(
				`https://queue.fal.run/${KLING_MODEL_ID}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Key ${FAL_KEY}`,
					},
					body: JSON.stringify(falInput),
				},
			);

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`fal.ai API error: ${response.status} - ${errorText}`);
			}

			const data: { request_id: string } = await response.json();
			const requestId: string = data.request_id;

			if (!requestId) {
				throw new Error("No request_id received from fal.ai");
			}

			console.log(
				`[VideoRegen] Regeneration job submitted. Request ID: ${requestId}`,
			);

			// Update scene with new video generation tracking
			await ctx.runMutation(api.scenes.updateVideoGeneration, {
				sceneId: args.sceneId,
				videoGeneration: {
					requestId,
					provider: "fal-ai",
					model: KLING_MODEL_ID,
					prompt: regenerationPrompt,
					startFrameUrl,
					endFrameUrl,
					status: "pending",
					progress: 0,
					retryCount: 0,
					startedAt: Date.now(),
				},
				status: "generating",
			});

			// Add previous generation to history and increment version
			await ctx.runMutation(api.scenes.updateRegenerationHistory, {
				sceneId: args.sceneId,
				regenerationHistory: [...regenerationHistory, previousGeneration],
				videoVersion: (scene.videoVersion || 1) + 1,
			});

			const latency = Date.now() - startTime;
			console.log(
				`[VideoRegen] Scene updated with regeneration status (${latency}ms)`,
			);

			return {
				success: true,
				requestId,
				videoVersion: (scene.videoVersion || 1) + 1,
				message:
					"Video regeneration started. Use pollVideoStatus to check progress.",
			};
		} catch (error) {
			console.error("[VideoRegen] Error:", error);

			// Update scene with error status
			try {
				const scene = await ctx.runQuery(api.scenes.get, {
					sceneId: args.sceneId,
				});

				if (scene?.videoGeneration) {
					await ctx.runMutation(api.scenes.updateVideoGeneration, {
						sceneId: args.sceneId,
						videoGeneration: {
							requestId: scene.videoGeneration.requestId,
							provider: "fal-ai",
							model: KLING_MODEL_ID,
							prompt: scene.videoGeneration.prompt ?? "",
							startFrameUrl: scene.videoGeneration.startFrameUrl ?? "",
							endFrameUrl: scene.videoGeneration.endFrameUrl,
							status: "failed",
							progress: 0,
							error: {
								message:
									error instanceof Error ? error.message : "Unknown error",
								code: "REGENERATION_ERROR",
								retryable: true,
							},
							retryCount: scene.videoGeneration.retryCount || 0,
							startedAt: scene.videoGeneration.startedAt || Date.now(),
						},
						status: "failed",
					});
				}
			} catch (updateError) {
				console.error(
					"[VideoRegen] Failed to update error status:",
					updateError,
				);
			}

			// Log error to usage tracking
			try {
				const scene = await ctx.runQuery(api.scenes.get, {
					sceneId: args.sceneId,
				});

				if (scene) {
					await ctx.runMutation(api.usageTracking.logAIUsage, {
						userId: identity.subject,
						projectId: scene.projectId as string,
						resourceType: "video",
						resourceId: args.sceneId as string,
						eventType: "generation",
						service: "fal",
						model: "kling-video-v2.5-turbo-pro",
						creditsUsed: 0,
						cost: 0,
						metadata: {
							success: false,
							error: error instanceof Error ? error.message : "Unknown error",
							latency: Date.now() - startTime,
						},
					});
				}
			} catch (trackingError) {
				console.error("[VideoRegen] Failed to log error:", trackingError);
			}

			throw error;
		}
	},
});
