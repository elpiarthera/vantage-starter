"use node";

/**
 * Generic FAL image action (Sprint 30 Phase 1, updated 30d.5).
 * Scheduled by imageTool.startGenericGeneration only. Not exposed to client.
 *
 * Sprint 30d.5: All model config now read from Convex `imageModelSchemas` table:
 * - allowedParams: Filter out invalid params before sending to FAL
 * - conditionalParams: Remove params that don't apply based on other param values
 * - maxPromptLength: Truncate prompt to model-specific max length
 *
 * This enables zero-code model onboarding — add a row to Convex, done.
 */
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";

const FAL_KEY = process.env.FAL_KEY;
const BASE = "https://queue.fal.run";

type QueueStatus = "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
interface QueueStatusResponse {
	status: QueueStatus;
	request_id: string;
	status_url?: string;
	response_url?: string;
}
interface ImageResult {
	url: string;
	content_type?: string;
	file_name?: string;
	file_size?: number;
	width?: number;
	height?: number;
}
interface FalImageResult {
	images?: ImageResult[];
	revised_prompt?: string; // Grok T2I and Edit
	description?: string; // Nano Banana Pro T2I/Edit and Nano Banana 2
}

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 60;

export const generateGeneric = internalAction({
	args: {
		modelId: v.string(),
		params: v.any(),
		transactionId: v.id("creditTransactions"),
		clerkUserId: v.string(),
	},
	handler: async (ctx, args) => {
		if (!FAL_KEY) {
			await ctx.runMutation(internal.credits.refundCredits, {
				transactionId: args.transactionId,
				reason: "FAL API key not set in deployment (env FAL_KEY)",
			});
			throw new Error("FAL API key not set in deployment (env FAL_KEY)");
		}

		// Sprint 30d.5: Get model schema from Convex (NOT hardcoded config)
		const schema = await ctx.runQuery(
			internal.imageModels.getByModelIdInternal,
			{
				modelId: args.modelId,
			},
		);
		if (!schema) {
			await ctx.runMutation(internal.credits.refundCredits, {
				transactionId: args.transactionId,
				reason: `Unknown model: ${args.modelId}`,
			});
			throw new Error(`Unknown model: ${args.modelId}`);
		}

		const url = `${BASE}/${schema.modelId}`;
		const rawParams = args.params as Record<string, unknown>;

		// Sprint 30d.5: Filter params based on schema.allowedParams
		const filteredParams: Record<string, unknown> = {};
		for (const key of schema.allowedParams) {
			if (key in rawParams && rawParams[key] !== undefined) {
				filteredParams[key] = rawParams[key];
			}
		}

		// Sprint 30d.5: Apply conditional param filtering from schema.conditionalParams
		if (schema.conditionalParams) {
			for (const cond of schema.conditionalParams) {
				const conditionMet =
					filteredParams[cond.showWhen.param] === cond.showWhen.value;
				if (!conditionMet) {
					delete filteredParams[cond.param];
				}
			}
		}

		// Sprint 30d.5: Sanitize prompt length from schema.maxPromptLength
		if (typeof filteredParams.prompt === "string") {
			filteredParams.prompt = filteredParams.prompt.slice(
				0,
				schema.maxPromptLength,
			);
		}

		const body = filteredParams;

		let requestId: string;
		let statusUrl: string;
		let resultUrl: string;
		try {
			const res = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Key ${FAL_KEY}`,
				},
				body: JSON.stringify(body),
			});
			if (!res.ok) {
				const text = await res.text();
				await ctx.runMutation(internal.credits.refundCredits, {
					transactionId: args.transactionId,
					reason: `FAL submit failed: ${res.status} ${text}`,
				});
				throw new Error(`FAL submit failed: ${res.status}`);
			}
			const data = (await res.json()) as QueueStatusResponse;
			requestId = data.request_id;
			if (!requestId) {
				await ctx.runMutation(internal.credits.refundCredits, {
					transactionId: args.transactionId,
					reason: "FAL: No request_id in queue response",
				});
				// Prefix with "FAL" so the catch block's early-exit guard fires
				// and does NOT call refundCredits a second time
				throw new Error("FAL: No request_id in queue response");
			}
			statusUrl =
				data.status_url ??
				`${BASE}/${schema.modelId}/requests/${requestId}/status`;
			resultUrl =
				data.response_url ?? `${BASE}/${schema.modelId}/requests/${requestId}`;
		} catch (e) {
			if (e instanceof Error && e.message.startsWith("FAL")) throw e;
			if (e instanceof Error && e.message.startsWith("Unknown")) throw e;
			await ctx.runMutation(internal.credits.refundCredits, {
				transactionId: args.transactionId,
				reason: e instanceof Error ? e.message : "FAL request failed",
			});
			throw e;
		}

		const headers = { Authorization: `Key ${FAL_KEY}` };

		for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
			await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
			const statusRes = await fetch(statusUrl, { headers });
			if (!statusRes.ok) {
				await ctx.runMutation(internal.credits.refundCredits, {
					transactionId: args.transactionId,
					reason: `FAL status check failed: ${statusRes.status}`,
				});
				throw new Error(`FAL status check failed: ${statusRes.status}`);
			}
			const statusData = (await statusRes.json()) as QueueStatusResponse;
			if (statusData.status === "COMPLETED") {
				const resultRes = await fetch(resultUrl, { headers });
				if (!resultRes.ok) {
					await ctx.runMutation(internal.credits.refundCredits, {
						transactionId: args.transactionId,
						reason: "FAL result fetch failed",
					});
					throw new Error("FAL result fetch failed");
				}
				const result = (await resultRes.json()) as FalImageResult;
				const images = result?.images ?? [];
				if (images.length === 0) {
					await ctx.runMutation(internal.credits.refundCredits, {
						transactionId: args.transactionId,
						reason: "No images in FAL result",
					});
					throw new Error("No images in FAL result");
				}
				const imageUrls = images.map((img) => img.url);
				const firstUrl = imageUrls[0];
				const now = Date.now();
				// Sprint 30d.5: Use schema.type from Convex
				const mode = schema.type === "t2i" ? "generate" : "edit";
				await ctx.runMutation(internal.imageToolHistory.insertImageToolEntry, {
					userId: args.clerkUserId,
					mode,
					prompt: String(body.prompt ?? ""),
					imageUrl: firstUrl,
					imageUrls: imageUrls.length > 1 ? imageUrls : undefined,
					sourceImageUrl:
						mode === "edit" && typeof body.image_url === "string"
							? (body.image_url as string)
							: undefined,
					sourceImageUrls:
						mode === "edit" && Array.isArray(body.image_urls)
							? (body.image_urls as string[])
							: undefined,
					model: args.modelId,
					resolution:
						typeof body.resolution === "string"
							? (body.resolution as string)
							: undefined,
					aspectRatio:
						typeof body.aspect_ratio === "string"
							? (body.aspect_ratio as string)
							: undefined,
					resultType:
						typeof body.result_type === "string"
							? (body.result_type as string)
							: undefined,
					metadata: {
						num_images: body.num_images,
						series_amount: body.series_amount,
						negative_prompt: body.negative_prompt ?? undefined,
						revised_prompt: result.revised_prompt ?? undefined,
						description: result.description ?? undefined,
					},
					createdAt: now,
				});
				return { success: true, imageUrl: firstUrl, imageUrls };
			}
			if (statusData.status === "FAILED") {
				await ctx.runMutation(internal.credits.refundCredits, {
					transactionId: args.transactionId,
					reason: "FAL job failed",
				});
				throw new Error("FAL job failed");
			}
		}

		await ctx.runMutation(internal.credits.refundCredits, {
			transactionId: args.transactionId,
			reason: "FAL polling timeout",
		});
		throw new Error("FAL polling timeout");
	},
});
