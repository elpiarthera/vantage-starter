"use node";

import { v } from "convex/values";
import { calculateAICost } from "../../lib/ai/costCalculation";
import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { action } from "../_generated/server";

const FAL_KEY = process.env.FAL_KEY;

// Base model path for queue status/result endpoints
// Note: fal.ai queue system uses the base path (fal-ai/kling-video) not the full versioned path
// even though submissions go to the full path (fal-ai/kling-video/v2.5-turbo/pro/image-to-video)
const KLING_BASE_MODEL = "fal-ai/kling-video";

/**
 * Download a video from a URL with exponential-backoff retry on 5xx errors.
 * Retries up to 3 total attempts with 2s → 4s → 8s delays.
 * 4xx errors are not retried (they are permanent failures).
 */
async function downloadVideoWithRetry(
	videoUrl: string,
): Promise<{ buffer: ArrayBuffer; ok: true } | { ok: false; status: number }> {
	const MAX_ATTEMPTS = 3;
	let lastStatus = 0;

	for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
		console.log(`[VideoPoll] Download attempt ${attempt}/${MAX_ATTEMPTS}...`);

		const response = await fetch(videoUrl);

		if (response.ok) {
			const blob = await response.blob();
			const buffer = await blob.arrayBuffer();
			return { ok: true, buffer };
		}

		lastStatus = response.status;

		// Don't retry on 4xx — these are permanent failures
		if (response.status >= 400 && response.status < 500) {
			console.error(
				`[VideoPoll] Download failed with ${response.status} (non-retryable), aborting.`,
			);
			return { ok: false, status: lastStatus };
		}

		// 5xx — transient, retry with backoff
		console.warn(
			`[VideoPoll] Download attempt ${attempt}/${MAX_ATTEMPTS} failed with ${response.status}. ${attempt < MAX_ATTEMPTS ? "Retrying..." : "All attempts exhausted."}`,
		);

		if (attempt < MAX_ATTEMPTS) {
			const delayMs = 2000 * 2 ** (attempt - 1); // 2s, 4s, 8s
			await new Promise((resolve) => setTimeout(resolve, delayMs));
		}
	}

	return { ok: false, status: lastStatus };
}

/**
 * Poll video generation status from fal.ai
 *
 * This action should be called periodically (e.g., every 5-10 seconds)
 * to check the status of an in-progress video generation job.
 *
 * Features:
 * - Polls fal.ai Queue API for job status
 * - Updates scene with progress, status, and video URL
 * - Downloads and stores completed video in Convex storage
 * - Creates asset metadata for the video
 * - Logs cost and usage to usageTracking table
 * - Handles errors and retry logic
 *
 * Status Flow:
 * - IN_QUEUE → IN_PROGRESS → COMPLETED
 * - Any status can transition to FAILED on error
 *
 * @see https://docs.fal.ai/model-apis/model-endpoints
 */
export const pollVideoStatus = action({
	args: {
		sceneId: v.id("scenes"),
	},
	handler: async (
		ctx,
		args,
	): Promise<
		| {
				success: boolean;
				status: string;
				progress?: number;
				queuePosition?: number;
				videoUrl?: string;
				assetId?: Id<"assets">;
				cost?: number;
				error?: string;
				retryable?: boolean;
				message: string;
		  }
		| {
				success: boolean;
				status: string;
				error?: string;
				retryable?: boolean;
				message: string;
		  }
	> => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");

		if (!FAL_KEY) {
			throw new Error("FAL_KEY not configured");
		}

		// Look up user from database to get internal Convex user ID
		const user = await ctx.runQuery(api.users.getUserByClerkId, {
			clerkUserId: identity.subject,
		});
		if (!user) throw new Error("User not found - please sync user first");

		try {
			// Get scene and verify ownership
			const scene = await ctx.runQuery(api.scenes.get, {
				sceneId: args.sceneId,
			});

			if (!scene) throw new Error("Scene not found");
			// Compare scene.userId with Convex internal user ID (not Clerk ID)
			if (scene.userId !== user._id) throw new Error("Unauthorized");

			// Check if scene has video generation in progress
			if (!scene.videoGeneration) {
				throw new Error("No video generation in progress for this scene");
			}

			const requestId = scene.videoGeneration.requestId;
			const currentStatus = scene.videoGeneration.status;

			if (!requestId) {
				throw new Error("No request ID found for video generation");
			}

			// Don't poll if already completed or failed
			if (currentStatus === "completed" || currentStatus === "failed") {
				return {
					success: true,
					status: currentStatus,
					message: `Video generation already ${currentStatus}`,
				};
			}

			console.log(
				`[VideoPoll] Polling status for scene ${args.sceneId}, request ${requestId}`,
			);

			// Poll fal.ai Queue API for status
			// Note: v2.5 Turbo Pro requires full model path for queue operations
			const statusResponse = await fetch(
				`https://queue.fal.run/${KLING_BASE_MODEL}/requests/${requestId}/status`,
				{
					headers: {
						Authorization: `Key ${FAL_KEY}`,
					},
				},
			);

			if (!statusResponse.ok) {
				throw new Error(`fal.ai status check failed: ${statusResponse.status}`);
			}

			const statusData: QueueStatusResponse = await statusResponse.json();

			console.log(
				`[VideoPoll] Status: ${statusData.status}, Queue Position: ${statusData.queue_position || "N/A"}`,
			);

			// Handle different status states
			switch (statusData.status) {
				case "IN_QUEUE": {
					// Update progress based on queue position
					const progress = statusData.queue_position
						? Math.max(5, Math.min(20, 20 - statusData.queue_position * 2))
						: 10;

					await ctx.runMutation(api.scenes.updateVideoGeneration, {
						sceneId: args.sceneId,
						videoGeneration: {
							requestId: scene.videoGeneration.requestId,
							provider: scene.videoGeneration.provider,
							model: scene.videoGeneration.model,
							prompt: scene.videoGeneration.prompt ?? "",
							startFrameUrl: scene.videoGeneration.startFrameUrl || "",
							endFrameUrl: scene.videoGeneration.endFrameUrl,
							status: "pending",
							progress,
							retryCount: scene.videoGeneration.retryCount || 0,
							startedAt: scene.videoGeneration.startedAt || Date.now(),
						},
					});

					return {
						success: true,
						status: "pending",
						progress,
						queuePosition: statusData.queue_position,
						message: "Video generation queued",
					};
				}

				case "IN_PROGRESS": {
					// Estimate progress (30-90% range during processing)
					const currentProgress = scene.videoGeneration.progress || 30;
					const newProgress = Math.min(90, currentProgress + 5);

					await ctx.runMutation(api.scenes.updateVideoGeneration, {
						sceneId: args.sceneId,
						videoGeneration: {
							requestId: scene.videoGeneration.requestId,
							provider: scene.videoGeneration.provider,
							model: scene.videoGeneration.model,
							prompt: scene.videoGeneration.prompt ?? "",
							startFrameUrl: scene.videoGeneration.startFrameUrl || "",
							endFrameUrl: scene.videoGeneration.endFrameUrl,
							status: "in_progress",
							progress: newProgress,
							retryCount: scene.videoGeneration.retryCount || 0,
							startedAt: scene.videoGeneration.startedAt || Date.now(),
						},
						status: "generating",
					});

					return {
						success: true,
						status: "in_progress",
						progress: newProgress,
						message: "Video generation in progress",
					};
				}

				case "COMPLETED": {
					console.log("[VideoPoll] Video generation completed!");

					// Fetch the result from the main endpoint (not /status)
					// Note: v2.5 Turbo Pro requires full model path for queue operations
					const resultResponse = await fetch(
						`https://queue.fal.run/${KLING_BASE_MODEL}/requests/${requestId}`,
						{
							headers: {
								Authorization: `Key ${FAL_KEY}`,
							},
						},
					);

					if (!resultResponse.ok) {
						throw new Error(
							`Failed to fetch video result: ${resultResponse.status}`,
						);
					}

					const resultData = await resultResponse.json();
					console.log("[VideoPoll] Result data:", JSON.stringify(resultData));

					// Get video output from result
					if (!resultData?.video?.url) {
						throw new Error("No video URL in completed response");
					}

					const videoUrl = resultData.video.url;
					console.log(`[VideoPoll] Video URL: ${videoUrl}`);

					// Download video from fal.ai — with retry on 5xx errors
					const downloadResult = await downloadVideoWithRetry(videoUrl);

					if (!downloadResult.ok) {
						console.error(
							`[VideoPoll] All download attempts failed (HTTP ${downloadResult.status}). Preserving fal.ai URL for recovery.`,
						);

						// Preserve the fal.ai URL so we can retry the download later without
						// re-running the expensive video generation job
						await ctx.runMutation(api.scenes.updateVideoGeneration, {
							sceneId: args.sceneId,
							videoGeneration: {
								requestId: scene.videoGeneration.requestId,
								provider: scene.videoGeneration.provider,
								model: scene.videoGeneration.model,
								prompt: scene.videoGeneration.prompt ?? "",
								startFrameUrl: scene.videoGeneration.startFrameUrl || "",
								endFrameUrl: scene.videoGeneration.endFrameUrl,
								status: "failed",
								progress: 90,
								falVideoUrl: videoUrl,
								creditTransactionId: scene.videoGeneration.creditTransactionId,
								error: {
									message: `Video was generated but could not be retrieved (HTTP ${downloadResult.status}). Your credits have been refunded.`,
									code: "DOWNLOAD_FAILED",
									retryable: true,
								},
								retryCount: scene.videoGeneration.retryCount || 0,
								startedAt: scene.videoGeneration.startedAt || Date.now(),
							},
							status: "failed",
						});

						// Refund credits — the video was generated but the user can't use it
						if (scene.videoGeneration.creditTransactionId) {
							try {
								await ctx.runMutation(internal.credits.refundVideoCredits, {
									creditTransactionId:
										scene.videoGeneration.creditTransactionId,
									clerkUserId: identity.subject,
								});
								console.log(
									`[VideoPoll] Credits refunded for transaction ${scene.videoGeneration.creditTransactionId}`,
								);
							} catch (refundError) {
								console.error(
									"[VideoPoll] Credit refund failed (non-fatal):",
									refundError,
								);
							}
						}

						return {
							success: false,
							status: "failed",
							error: `Download failed after retries (HTTP ${downloadResult.status})`,
							retryable: true,
							message:
								"Video was generated but could not be downloaded. Credits refunded.",
						};
					}

					const videoBuffer = downloadResult.buffer;

					console.log(
						`[VideoPoll] Downloaded video: ${videoBuffer.byteLength} bytes`,
					);

					// Upload to Convex storage
					const storageId = await ctx.storage.store(
						new Blob([videoBuffer], { type: "video/mp4" }),
					);

					// Get URL from storage
					const storedUrl = await ctx.storage.getUrl(storageId);
					if (!storedUrl)
						throw new Error("Failed to get video URL from storage");

					console.log("[VideoPoll] Video uploaded to Convex storage");

					// Save asset metadata
					const { assetId } = await ctx.runMutation(
						api.files.saveFileMetadata,
						{
							storageId,
							fileName: `scene-${scene.sceneNumber}-video.mp4`,
							fileType: "video/mp4",
							fileSize: videoBuffer.byteLength,
							assetType: "video",
							projectId: scene.projectId as Id<"projects">,
							sceneId: args.sceneId,
						},
					);

					console.log(`[VideoPoll] Asset created: ${assetId}`);

					// Calculate cost based on video duration
					const duration = scene.duration || 5; // Default to 5 seconds
					const { cost } = calculateAICost(
						"fal",
						"kling-video-v2.5-turbo-pro",
						{
							videoSeconds: duration,
						},
					);

					// Update scene with completed video
					await ctx.runMutation(api.scenes.updateVideoGeneration, {
						sceneId: args.sceneId,
						videoGeneration: {
							requestId: scene.videoGeneration.requestId,
							provider: scene.videoGeneration.provider,
							model: scene.videoGeneration.model,
							prompt: scene.videoGeneration.prompt ?? "",
							startFrameUrl: scene.videoGeneration.startFrameUrl || "",
							endFrameUrl: scene.videoGeneration.endFrameUrl,
							status: "completed",
							progress: 100,
							retryCount: scene.videoGeneration.retryCount || 0,
							cost,
							creditsUsed: duration * 10, // 10 credits per second (Kling pricing)
							startedAt: scene.videoGeneration.startedAt || Date.now(),
							completedAt: Date.now(),
						},
						status: "completed",
					});

					// Update scene with video URL
					await ctx.runMutation(api.scenes.update, {
						sceneId: args.sceneId,
						videoUrl: storedUrl,
					});

					// Log usage to tracking table
					await ctx.runMutation(api.usageTracking.logAIUsage, {
						userId: identity.subject,
						projectId: scene.projectId as string,
						resourceType: "video",
						resourceId: args.sceneId as string,
						eventType: "generation",
						service: "fal",
						model: "kling-video-v2.5-turbo-pro",
						creditsUsed: duration * 10,
						cost,
						metadata: {
							duration:
								Date.now() - (scene.videoGeneration.startedAt || Date.now()),
							success: true,
							latency:
								Date.now() - (scene.videoGeneration.startedAt || Date.now()),
						},
					});

					console.log(`[VideoPoll] Cost tracked: $${cost.toFixed(4)}`);

					return {
						success: true,
						status: "completed",
						progress: 100,
						videoUrl: storedUrl,
						assetId,
						cost,
						message: "Video generation completed successfully",
					};
				}

				default: {
					// Handle FAILED or unknown status
					const errorMessage =
						statusData.error || `Unknown status: ${statusData.status}`;

					console.error("[VideoPoll] Video generation failed:", errorMessage);

					// Determine if error is retryable
					const retryable = isRetryableError(errorMessage);
					const retryCount = scene.videoGeneration.retryCount || 0;

					await ctx.runMutation(api.scenes.updateVideoGeneration, {
						sceneId: args.sceneId,
						videoGeneration: {
							...scene.videoGeneration,
							prompt: scene.videoGeneration.prompt ?? "",
							startFrameUrl: scene.videoGeneration.startFrameUrl || "",
							status: "failed",
							progress: 0,
							error: {
								message: errorMessage,
								code: "GENERATION_FAILED",
								retryable,
							},
							retryCount: retryCount + 1,
							startedAt: scene.videoGeneration.startedAt || Date.now(),
							completedAt: Date.now(),
						},
						status: "failed",
					});

					// Log failed usage
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
							error: errorMessage,
							duration:
								Date.now() - (scene.videoGeneration.startedAt || Date.now()),
							latency:
								Date.now() - (scene.videoGeneration.startedAt || Date.now()),
						},
					});

					return {
						success: false,
						status: "failed",
						error: errorMessage,
						retryable,
						message: `Video generation failed: ${errorMessage}`,
					};
				}
			}
		} catch (error) {
			console.error("[VideoPoll] Error:", error);

			// Update scene with error
			try {
				const scene = await ctx.runQuery(api.scenes.get, {
					sceneId: args.sceneId,
				});

				if (scene?.videoGeneration) {
					const retryCount = scene.videoGeneration.retryCount || 0;

					await ctx.runMutation(api.scenes.updateVideoGeneration, {
						sceneId: args.sceneId,
						videoGeneration: {
							requestId: scene.videoGeneration.requestId,
							provider: scene.videoGeneration.provider,
							model: scene.videoGeneration.model,
							prompt: scene.videoGeneration.prompt ?? "",
							startFrameUrl: scene.videoGeneration.startFrameUrl || "",
							endFrameUrl: scene.videoGeneration.endFrameUrl,
							status: "failed",
							progress: scene.videoGeneration.progress || 0,
							error: {
								message:
									error instanceof Error ? error.message : "Unknown error",
								code: "POLLING_ERROR",
								retryable: true,
							},
							retryCount: retryCount + 1,
							startedAt: scene.videoGeneration.startedAt || Date.now(),
						},
						status: "failed",
					});
				}
			} catch (updateError) {
				console.error(
					"[VideoPoll] Failed to update error status:",
					updateError,
				);
			}

			throw error;
		}
	},
});

/**
 * Determine if an error is retryable
 */
function isRetryableError(errorMessage: string): boolean {
	const nonRetryablePatterns = [
		"nsfw",
		"inappropriate",
		"invalid prompt",
		"invalid image",
		"unsupported format",
		"quota exceeded",
		"insufficient credits",
	];

	const lowerMessage = errorMessage.toLowerCase();
	return !nonRetryablePatterns.some((pattern) =>
		lowerMessage.includes(pattern),
	);
}

/**
 * Queue status response from fal.ai
 * Based on official fal.ai OpenAPI specification
 */
interface QueueStatusResponse {
	status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
	request_id: string;
	response_url?: string;
	status_url?: string;
	cancel_url?: string;
	logs?: Array<{ message: string; timestamp: number }>;
	metrics?: {
		inference_time?: number;
		queue_time?: number;
	};
	queue_position?: number;
	output?: KlingVideoOutput;
	error?: string;
}

/**
 * Video output from Kling Video v2.5 Turbo Pro
 * Based on official fal.ai OpenAPI specification
 */
interface KlingVideoOutput {
	video: {
		url: string;
		content_type?: string;
		file_name?: string;
		file_size?: number;
	};
}
