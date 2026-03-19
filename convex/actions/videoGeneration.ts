"use node";

import { v } from "convex/values";
import { VIDEO_GENERATION_PROMPT } from "../../lib/ai/prompts";
import { api } from "../_generated/api";
import { action } from "../_generated/server";

const FAL_KEY = process.env.FAL_KEY;

const KLING_MODEL_ID = "fal-ai/kling-video/v2.5-turbo/pro/image-to-video";

/**
 * Generate video from image using fal.ai Kling Video v2.5 Turbo Pro
 *
 * Features:
 * - Image-to-video generation with start frame (required) and tail frame (optional)
 * - Asynchronous job submission with request ID tracking
 * - Full error handling and retry logic
 * - Cost tracking to usageTracking table
 * - Status updates to scenes.videoGeneration
 *
 * Follows fal.ai best practices:
 * - Uses Queue API (https://queue.fal.run) for async processing
 * - Stores request_id for status polling
 * - Proper authentication with Key prefix
 * - Comprehensive error handling
 *
 * API Reference:
 * @see https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/pro/image-to-video/api
 * @see https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/kling-video/v2.5-turbo/pro/image-to-video
 */
export const generateVideo = action({
	args: {
		sceneId: v.id("scenes"),
		sceneDescription: v.string(),
		startFrameUrl: v.string(), // URL of the start frame image (required)
		endFrameUrl: v.optional(v.string()), // URL of the end/tail frame image (optional)
		cinematicStyles: v.optional(v.array(v.string())),
		duration: v.optional(v.number()), // 5 or 10 seconds
		// Project-level context from Step 1 & Step 2b
		visualStyle: v.optional(v.string()), // Step 2b: cinematic, vintage, storyboard, etc.
		occasion: v.optional(v.string()), // Step 1: wedding, birthday, corporate, etc.
		theme: v.optional(v.string()), // Step 1: romantic, fun, professional, etc.
		emotionalStory: v.optional(v.string()), // Step 1: "Shape the Emotion" user input
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");

		if (!FAL_KEY) {
			throw new Error(
				"FAL_KEY not configured. Please add FAL_KEY to environment variables.",
			);
		}

		const startTime = Date.now();

		// Look up user from database to get internal Convex user ID
		const user = await ctx.runQuery(api.users.getUserByClerkId, {
			clerkUserId: identity.subject,
		});
		if (!user) throw new Error("User not found - please sync user first");

		try {
			console.log(
				`[VideoGen] Starting video generation for scene ${args.sceneId}`,
			);

			// Get scene to verify ownership and get projectId
			const scene = await ctx.runQuery(api.scenes.get, {
				sceneId: args.sceneId,
			});
			if (!scene) throw new Error("Scene not found");
			// Compare scene.userId with Convex internal user ID (not Clerk ID)
			if (scene.userId !== user._id) throw new Error("Unauthorized");

			// Build prompt using modular prompts system with full project context
			const videoPrompt = VIDEO_GENERATION_PROMPT.buildPrompt({
				sceneDescription: args.sceneDescription,
				cinematicStyles: args.cinematicStyles || [],
				frameType: args.endFrameUrl ? "transition" : "static",
				duration: (args.duration as 5 | 10) || 5,
				visualStyle: args.visualStyle,
				occasion: args.occasion,
				theme: args.theme,
				emotionalStory: args.emotionalStory,
			});

			console.log(
				`[VideoGen] Generated prompt: ${videoPrompt.substring(0, 100)}...`,
			);

			// Prepare fal.ai request payload according to official API spec
			// @see https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/kling-video/v2.5-turbo/pro/image-to-video
			const falInput: KlingVideoInput = {
				prompt: videoPrompt,
				image_url: args.startFrameUrl, // Required: URL of the image to be used for the video
				duration: args.duration === 10 ? "10" : "5", // String enum: "5" or "10"
				cfg_scale: 0.5, // Default: 0.5 (range 0-1)
				negative_prompt: "blur, distort, and low quality", // Default negative prompt
			};

			// Add tail frame if provided (for smooth scene-to-scene transitions)
			if (args.endFrameUrl) {
				falInput.tail_image_url = args.endFrameUrl;
			}

			console.log("[VideoGen] Submitting job to fal.ai Queue API...");

			// Submit job to fal.ai Queue API
			// Uses the queue.fal.run endpoint for async processing
			const response = await fetch(`https://queue.fal.run/${KLING_MODEL_ID}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Key ${FAL_KEY}`,
				},
				body: JSON.stringify(falInput), // Direct payload, NOT wrapped in { input: ... }
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`fal.ai API error: ${response.status} - ${errorText}`);
			}

			const data: QueueStatusResponse = await response.json();
			const requestId = data.request_id;

			if (!requestId) {
				throw new Error("No request_id received from fal.ai");
			}

			console.log(
				`[VideoGen] Job submitted successfully. Request ID: ${requestId}`,
			);
			console.log(`[VideoGen] Status URL: ${data.status_url}`);

			// Update scene with video generation tracking
			await ctx.runMutation(api.scenes.updateVideoGeneration, {
				sceneId: args.sceneId,
				videoGeneration: {
					requestId,
					provider: "fal-ai",
					model: KLING_MODEL_ID,
					prompt: videoPrompt,
					startFrameUrl: args.startFrameUrl,
					endFrameUrl: args.endFrameUrl,
					status: "pending",
					progress: 0,
					retryCount: 0,
					startedAt: Date.now(),
				},
				status: "generating",
			});

			const latency = Date.now() - startTime;
			console.log(
				`[VideoGen] Scene updated with generation status (${latency}ms)`,
			);

			return {
				success: true,
				requestId,
				statusUrl: data.status_url,
				message:
					"Video generation started. Use pollVideoStatus to check progress.",
			};
		} catch (error) {
			console.error("[VideoGen] Error:", error);

			// Update scene with error status
			try {
				await ctx.runMutation(api.scenes.updateVideoGeneration, {
					sceneId: args.sceneId,
					videoGeneration: {
						provider: "fal-ai",
						model: KLING_MODEL_ID,
						prompt: "Error during submission",
						startFrameUrl: args.startFrameUrl,
						endFrameUrl: args.endFrameUrl,
						status: "failed",
						progress: 0,
						error: {
							message: error instanceof Error ? error.message : "Unknown error",
							code: "SUBMISSION_ERROR",
							retryable: true,
						},
						retryCount: 0,
						startedAt: Date.now(),
					},
					status: "failed",
				});
			} catch (updateError) {
				console.error("[VideoGen] Failed to update error status:", updateError);
			}

			// Log error to usage tracking
			try {
				const scene = await ctx.runQuery(api.scenes.get, {
					sceneId: args.sceneId,
				});

				await ctx.runMutation(api.usageTracking.logAIUsage, {
					userId: identity.subject,
					projectId: scene?.projectId,
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
			} catch (trackingError) {
				console.error("[VideoGen] Failed to log error:", trackingError);
			}

			throw error;
		}
	},
});

/**
 * Kling Video v2.5 Turbo Pro input interface
 * Based on official fal.ai OpenAPI specification
 *
 * @see https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/kling-video/v2.5-turbo/pro/image-to-video
 */
interface KlingVideoInput {
	/** Text prompt describing the video (max 2500 chars) */
	prompt: string;
	/** URL of the image to be used for the video (required) */
	image_url: string;
	/** URL of the image to be used for the end of the video (optional) */
	tail_image_url?: string;
	/** The duration of the generated video in seconds */
	duration: "5" | "10";
	/** CFG scale (0-1) - how closely to follow the prompt */
	cfg_scale?: number;
	/** Negative prompt to avoid certain features */
	negative_prompt?: string;
}

/**
 * Queue status response from fal.ai
 * Based on official fal.ai OpenAPI specification
 */
interface QueueStatusResponse {
	status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED";
	request_id: string;
	response_url?: string;
	status_url?: string;
	cancel_url?: string;
	logs?: Record<string, unknown>;
	metrics?: Record<string, unknown>;
	queue_position?: number;
}

// Note: KlingVideoOutput interface removed as it's not currently used
// Will be needed when implementing video status polling
