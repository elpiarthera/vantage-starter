"use node";

import { v } from "convex/values";
import { calculateAICost } from "../../lib/ai/costCalculation";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { action } from "../_generated/server";

const FAL_KEY = process.env.FAL_KEY;

const MODELS = {
	textToImage: {
		primary: "fal-ai/nano-banana-pro", // Google Gemini 3 Pro Image
		fallback: "fal-ai/bytedance/seedream/v4/text-to-image",
	},
	imageToImage: {
		primary: "fal-ai/nano-banana-pro/edit", // Google Gemini 3 Pro Image Edit
		fallback: "fal-ai/bytedance/seedream/v4/edit",
	},
};

/**
 * Generate frame image from text prompt or transform existing image
 * Uses Nano Banana Pro (Gemini 3 Pro Image) for text-to-image
 * Uses Nano Banana Pro Edit for image-to-image transformation
 * Fallback models:
 * - Text-to-image: Seedream v4 text-to-image (fal-ai/bytedance/seedream/v4/text-to-image)
 * - Image-to-image: Seedream v4 edit (fal-ai/bytedance/seedream/v4/edit)
 * Includes concrete cost tracking to usageTracking table
 *
 * @see https://fal.ai/models/fal-ai/nano-banana-pro
 * @see https://fal.ai/models/fal-ai/nano-banana-pro/edit
 * @see https://fal.ai/models/fal-ai/bytedance/seedream/v4/text-to-image
 * @see https://fal.ai/models/fal-ai/bytedance/seedream/v4/edit
 */
export const generateFrameImage = action({
	args: {
		sceneId: v.id("scenes"),
		frameType: v.union(v.literal("start"), v.literal("end")),
		prompt: v.string(),
		referenceImageUrl: v.optional(v.string()), // For image-to-image transformation
		aspectRatio: v.optional(v.string()), // "16:9", "9:16", "1:1", "auto", etc.
		resolution: v.optional(v.string()), // "1K", "2K", "4K"
		projectId: v.optional(v.id("projects")),
	},
	handler: async (
		ctx,
		args,
	): Promise<{
		success: boolean;
		assetId: Id<"assets">;
		storageId: string;
		imageUrl: string;
		modelUsed: string;
	}> => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");

		if (!FAL_KEY) {
			throw new Error("FAL_KEY not configured");
		}

		const startTime = Date.now();

		try {
			// Detect mode: image-to-image if referenceImageUrl is provided
			const isImageToImage = !!args.referenceImageUrl;
			const mode = isImageToImage ? "image-to-image" : "text-to-image";
			if (isImageToImage && !args.referenceImageUrl) {
				throw new Error("referenceImageUrl required for image-to-image");
			}
			const referenceImageUrl = args.referenceImageUrl;

			console.log(
				`[ImageGen] ${mode} generation for ${args.frameType} frame in scene ${args.sceneId}`,
				isImageToImage ? `(reference image: ${args.referenceImageUrl})` : "",
			);

			// Select model based on mode
			const primaryModel = isImageToImage
				? MODELS.imageToImage.primary // "fal-ai/nano-banana-pro/edit"
				: MODELS.textToImage.primary; // "fal-ai/nano-banana-pro"

			const fallbackModel = isImageToImage
				? MODELS.imageToImage.fallback // "fal-ai/bytedance/seedream/v4/edit"
				: MODELS.textToImage.fallback; // "fal-ai/bytedance/seedream/v4/text-to-image"

			let result: { images: Array<{ url: string }> };
			let modelUsed = isImageToImage
				? "nano-banana-pro-edit"
				: "nano-banana-pro";

			try {
				if (isImageToImage && referenceImageUrl) {
					// Image-to-image mode: requires image_urls parameter
					result = await generateWithFal(primaryModel, {
						prompt: args.prompt,
						image_urls: [referenceImageUrl], // Required for /edit endpoint
						aspect_ratio: args.aspectRatio || "auto", // "auto" default for image-to-image
						resolution: args.resolution || "1K",
						num_images: 1,
					});
					console.log(
						"[ImageGen] Transformed with Nano Banana Pro Edit (Gemini 3 Pro)",
					);
				} else {
					// Text-to-image mode: no image_urls parameter
					result = await generateWithFal(primaryModel, {
						prompt: args.prompt,
						aspect_ratio: args.aspectRatio || "16:9", // "16:9" default for text-to-image
						resolution: args.resolution || "1K",
						num_images: 1,
					});
					console.log(
						"[ImageGen] Generated with Nano Banana Pro (Gemini 3 Pro)",
					);
				}
			} catch (primaryError) {
				console.warn(
					`[ImageGen] Primary ${mode} model failed, trying fallback:`,
					primaryError,
				);

				// Fallback to Seedream v4
				if (isImageToImage && referenceImageUrl) {
					// Image-to-image fallback: Seedream v4 edit
					// Seedream v4 edit uses different parameter format:
					// - image_url (singular, not image_urls array)
					// - image_size (not aspect_ratio)
					// - num_inference_steps, guidance_scale, strength
					const imageSize =
						args.aspectRatio === "9:16"
							? "portrait_9_16"
							: args.aspectRatio === "1:1"
								? "square"
								: "landscape_16_9";

					result = await generateWithFal(fallbackModel, {
						prompt: args.prompt,
						image_url: referenceImageUrl, // Singular, not array
						image_size: imageSize,
						num_inference_steps: 20,
						guidance_scale: 7.5,
						strength: 0.8, // Default strength for editing
					});
					modelUsed = "seedream-v4-edit";
					console.log(
						"[ImageGen] Transformed with Seedream v4 Edit (fallback)",
					);
				} else {
					// Text-to-image fallback: Seedream v4
					// Convert aspect_ratio to image_size format for Seedream
					const imageSize =
						args.aspectRatio === "9:16"
							? "portrait_9_16"
							: args.aspectRatio === "1:1"
								? "square"
								: "landscape_16_9";

					result = await generateWithFal(fallbackModel, {
						prompt: args.prompt,
						image_size: imageSize,
						num_inference_steps: 20,
						guidance_scale: 7.5,
					});
					modelUsed = "seedream-v4";
					console.log("[ImageGen] Generated with Seedream v4 (fallback)");
				}
			}

			const imageUrl = result.images[0].url;

			// Download image
			const imageResponse = await fetch(imageUrl);
			if (!imageResponse.ok) {
				throw new Error(`Failed to download image: ${imageResponse.status}`);
			}

			const imageBlob = await imageResponse.blob();
			const imageBuffer = await imageBlob.arrayBuffer();

			// Upload to Convex storage
			const storageId = await ctx.storage.store(
				new Blob([imageBuffer], { type: "image/png" }),
			);

			// Get scene to find projectId
			const scene = await ctx.runQuery(api.scenes.get, {
				sceneId: args.sceneId,
			});
			if (!scene) throw new Error("Scene not found");

			// Get URL from storage
			const url = await ctx.storage.getUrl(storageId);
			if (!url) throw new Error("Failed to get image URL");

			// Save asset metadata
			// Use provided projectId or let saveFileMetadata handle it
			const { assetId } = await ctx.runMutation(api.files.saveFileMetadata, {
				storageId,
				fileName: `${args.frameType}-frame-generated.png`,
				fileType: "image/png",
				fileSize: imageBuffer.byteLength,
				assetType: "image",
				projectId: args.projectId,
				sceneId: args.sceneId,
			});

			const latency = Date.now() - startTime;

			// Calculate cost and log to usageTracking
			// Nano Banana Pro: $0.15/image, Nano Banana Pro Edit: $0.15/image
			// Seedream v4: $0.03/image, Seedream v4 Edit: $0.03/image
			const costModelName =
				modelUsed === "nano-banana-pro" || modelUsed === "nano-banana-pro-edit"
					? "nano-banana-pro"
					: "seedream-v4";
			const { cost } = calculateAICost("fal", costModelName, { imageCount: 1 });

			// Log usage to Convex
			try {
				await ctx.runMutation(api.usageTracking.logAIUsage, {
					userId: identity.subject,
					projectId: (args.projectId || scene.projectId) as string,
					resourceType: "image",
					resourceId: args.sceneId as string,
					eventType: isImageToImage ? "transformation" : "generation",
					service: "fal",
					model: modelUsed,
					creditsUsed:
						modelUsed === "nano-banana-pro" ||
						modelUsed === "nano-banana-pro-edit"
							? 5
							: 1, // 5 credits for Nano Banana Pro models, 1 for Seedream
					cost,
					metadata: {
						duration: latency,
						resolution: args.resolution || "1K",
						aspectRatio: args.aspectRatio || (isImageToImage ? "auto" : "16:9"),
						latency,
						success: true,
						...(isImageToImage && { mode: "image-to-image" }),
					},
				});
				console.log(`[ImageGen] Cost tracked: $${cost.toFixed(4)}`);
			} catch (trackingError) {
				console.error("[ImageGen] Failed to log usage:", trackingError);
				// Don't fail the request if tracking fails
			}

			console.log(
				`[ImageGen] Successfully ${isImageToImage ? "transformed" : "generated"} and stored ${args.frameType} frame`,
			);

			return {
				success: true,
				assetId,
				storageId,
				imageUrl: url,
				modelUsed,
			};
		} catch (error) {
			console.error("[ImageGen] Error:", error);
			throw error;
		}
	},
});

/**
 * Helper function to call fal.ai API with polling
 * Supports both Nano Banana Pro (Gemini 3) and Seedream v4 parameter formats
 * Supports both text-to-image and image-to-image modes
 *
 * Note: Nano Banana Pro expects parameters directly in the body (not wrapped in "input")
 * Seedream v4 expects parameters wrapped in "input" object
 *
 * @see https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/nano-banana-pro
 * @see https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/nano-banana-pro/edit
 */
async function generateWithFal(
	modelId: string,
	params: {
		prompt: string;
		// Nano Banana Pro /edit parameters (image-to-image)
		image_urls?: string[]; // Array for nano-banana-pro/edit
		// Seedream v4 edit parameters (image-to-image fallback)
		image_url?: string; // Singular for seedream/v4/edit
		strength?: number; // 0.0-1.0, how much to change
		// Nano Banana Pro parameters (text-to-image)
		aspect_ratio?: string;
		resolution?: string;
		num_images?: number;
		output_format?: string;
		// Seedream v4 parameters (text-to-image fallback)
		image_size?: string;
		num_inference_steps?: number;
		guidance_scale?: number;
	},
) {
	// Both Nano Banana Pro and Seedream v4 expect params directly in the body
	// (The fal.ai client library wraps in "input" internally, but direct HTTP calls don't need that)
	const response = await fetch(`https://queue.fal.run/${modelId}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Key ${FAL_KEY}`,
		},
		body: JSON.stringify(params),
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`fal.ai API error: ${response.status} - ${error}`);
	}

	const data = await response.json();

	// fal.ai uses queue system - use the URLs from the response
	const requestId = data.request_id;
	const statusUrl = data.status_url;
	const responseUrl = data.response_url;

	console.log(`[ImageGen] Request ID: ${requestId}`);

	// Poll for completion using the status endpoint from the API response
	let attempts = 0;
	const maxAttempts = 120; // 2 minutes max for quality-first models

	while (attempts < maxAttempts) {
		attempts++;
		await new Promise((resolve) => setTimeout(resolve, 2000)); // Poll every 2 seconds

		// Use the status URL from the API response
		const statusResponse = await fetch(statusUrl, {
			headers: {
				Authorization: `Key ${FAL_KEY}`,
			},
		});

		if (!statusResponse.ok) continue;

		const statusData = await statusResponse.json();

		if (statusData.status === "COMPLETED") {
			// Fetch the actual result using the response URL from the API
			const resultResponse = await fetch(responseUrl, {
				headers: {
					Authorization: `Key ${FAL_KEY}`,
				},
			});

			if (!resultResponse.ok) {
				throw new Error(`Failed to fetch result: ${resultResponse.status}`);
			}

			return await resultResponse.json();
		}

		if (statusData.status === "FAILED") {
			throw new Error(
				`fal.ai generation failed: ${JSON.stringify(statusData)}`,
			);
		}
	}

	throw new Error("fal.ai generation timed out");
}
