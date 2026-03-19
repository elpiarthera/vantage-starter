"use node";

import { ConvexError, v } from "convex/values";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { ActionCtx } from "../_generated/server";
import { action } from "../_generated/server";

const FAL_KEY = process.env.FAL_KEY;
const STABLE_AUDIO_MODEL = "fal-ai/stable-audio-25/text-to-audio";
const MUSIC_COST_PER_GENERATION = 0.01; // ~$0.01 per 30s track

// 250 attempts × ~2.2s average = ~550s — safe margin below Convex's 600s action ceiling
const MAX_POLL_ATTEMPTS = 250;
// Consecutive non-ok polling responses before aborting (transient network errors)
const MAX_CONSECUTIVE_ERRORS = 5;

type QueueStatus = {
	status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
	request_id: string;
	status_url?: string;
	response_url?: string;
};

type StableAudioResult = {
	audio: { url: string };
};

async function submitFalJob<TInput>(
	modelId: string,
	payload: TInput,
): Promise<QueueStatus> {
	const response = await fetch(`https://queue.fal.run/${modelId}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Key ${FAL_KEY}`,
		},
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new ConvexError({
			code: "MUSIC_SUBMIT_FAILED",
			message: `fal.ai API error: ${response.status} - ${errorText}`,
		});
	}

	return (await response.json()) as QueueStatus;
}

async function pollFalResult<TOutput>(
	statusUrl?: string,
	responseUrl?: string,
) {
	if (!statusUrl || !responseUrl) {
		throw new ConvexError({
			code: "MUSIC_FAILED",
			message: "Missing status_url or response_url from fal.ai",
		});
	}

	let attempts = 0;
	let consecutiveErrors = 0;

	while (attempts < MAX_POLL_ATTEMPTS) {
		attempts++;
		// Slow down after the first minute — saves margin vs Convex action ceiling
		const sleepMs = attempts > 30 ? 3000 : 2000;
		await new Promise((resolve) => setTimeout(resolve, sleepMs));

		console.log(
			`[MusicGen] Polling attempt ${attempts}/${MAX_POLL_ATTEMPTS}...`,
		);

		const statusRes = await fetch(statusUrl, {
			headers: { Authorization: `Key ${FAL_KEY}` },
		});

		if (!statusRes.ok) {
			consecutiveErrors++;
			console.warn(
				`[MusicGen] Poll status request failed (${statusRes.status}), consecutive errors: ${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}`,
			);
			if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
				throw new ConvexError({
					code: "MUSIC_FAILED",
					message: `Polling failed after ${MAX_CONSECUTIVE_ERRORS} consecutive errors (HTTP ${statusRes.status})`,
				});
			}
			continue;
		}
		consecutiveErrors = 0;

		const statusData = (await statusRes.json()) as QueueStatus;
		console.log(`[MusicGen] Status: ${statusData.status}`);

		if (statusData.status === "COMPLETED") {
			const resultRes = await fetch(responseUrl, {
				headers: { Authorization: `Key ${FAL_KEY}` },
			});
			if (!resultRes.ok) {
				throw new ConvexError({
					code: "MUSIC_FAILED",
					message: `Failed to fetch result: ${resultRes.status}`,
				});
			}
			return (await resultRes.json()) as TOutput;
		}

		if (statusData.status === "FAILED") {
			throw new ConvexError({
				code: "MUSIC_FAILED",
				message: "fal.ai music job failed",
			});
		}
	}

	throw new ConvexError({
		code: "MUSIC_TIMEOUT",
		message: `Music generation timed out after ${MAX_POLL_ATTEMPTS} polling attempts (~${Math.round((MAX_POLL_ATTEMPTS * 2.5) / 60)} minutes). Your credits will be refunded.`,
	});
}

/**
 * Fetch audio from Fal URL and store in Convex storage.
 * Returns Convex URL and storage ID for project/step4Data.
 */
async function storeMusicInConvex(
	ctx: ActionCtx,
	falUrl: string,
): Promise<{ url: string; storageId: Id<"_storage"> }> {
	const response = await fetch(falUrl);
	if (!response.ok) {
		throw new Error(`Failed to download music: ${response.status}`);
	}
	const blob = await response.blob();
	const contentType =
		response.headers.get("content-type") || blob.type || "audio/wav";
	const buffer = await blob.arrayBuffer();
	const storageId = await ctx.storage.store(
		new Blob([buffer], { type: contentType }),
	);
	const url = await ctx.storage.getUrl(storageId);
	if (!url) {
		throw new Error("Failed to get Convex storage URL");
	}
	return { url, storageId };
}

export const generateMusic = action({
	args: {
		projectId: v.id("projects"),
		prompt: v.string(),
		negativePrompt: v.optional(v.string()),
		seed: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		if (!FAL_KEY) {
			throw new Error("FAL_KEY not configured");
		}

		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");

		const startTime = Date.now();

		// Stable Audio 2.5 API Reference: https://fal.ai/models/fal-ai/stable-audio-25/text-to-audio/api
		// - prompt: The description of the audio to generate
		// - seconds_total: Duration in seconds (max 190)
		// - num_inference_steps: Quality (4-8)
		// - guidance_scale: Adherence to prompt (1-25)
		const payload = {
			prompt: args.prompt,
			seconds_total: 30, // Default duration for MVP
			num_inference_steps: 8,
			guidance_scale: 1,
			seed: args.seed,
		};

		const status = await submitFalJob(STABLE_AUDIO_MODEL, payload);

		// Persist job state BEFORE polling — if the action times out, the requestId
		// is preserved in the DB for future recovery.
		console.log(
			`[MusicGen] Job submitted. Request ID: ${status.request_id}. Persisting before polling...`,
		);
		await ctx.runMutation(api.projects.update, {
			projectId: args.projectId,
			step4Data: {
				pendingMusicGeneration: {
					falRequestId: status.request_id,
					statusUrl: status.status_url ?? "",
					responseUrl: status.response_url ?? "",
					startedAt: Date.now(),
					status: "pending",
				},
			},
		});

		const result = await pollFalResult<StableAudioResult>(
			status.status_url,
			status.response_url,
		);

		const latency = Date.now() - startTime;

		// Log usage to usageTracking for dashboard stats
		try {
			await ctx.runMutation(api.usageTracking.logAIUsage, {
				userId: identity.subject,
				projectId: args.projectId as string,
				resourceType: "audio",
				resourceId: args.projectId as string,
				eventType: "music_generation",
				service: "fal",
				model: "stable-audio-2.5",
				creditsUsed: 5,
				cost: MUSIC_COST_PER_GENERATION,
				metadata: {
					success: true,
					duration: 30, // 30 seconds
					latency,
				},
			});
		} catch (logError) {
			console.error("[MusicGeneration] Failed to log usage:", logError);
			// Don't fail the generation if logging fails
		}

		const stored = await storeMusicInConvex(ctx, result.audio.url);

		// Clear pending state now that we have a result
		try {
			await ctx.runMutation(api.projects.update, {
				projectId: args.projectId,
				step4Data: {
					pendingMusicGeneration: {
						falRequestId: status.request_id,
						statusUrl: status.status_url ?? "",
						responseUrl: status.response_url ?? "",
						startedAt: Date.now(),
						status: "completed",
					},
				},
			});
		} catch (clearError) {
			console.warn("[MusicGen] Failed to clear pending state:", clearError);
		}

		try {
			await ctx.runMutation(api.audioTracks.insertFromGeneration, {
				projectId: args.projectId,
				type: "music",
				storageId: stored.storageId,
				durationMs: 30000, // 30s default
				title: "Background Music",
				creditsUsed: 5,
			});
		} catch (e) {
			console.warn("[MusicGeneration] Failed to insert audioTracks row:", e);
		}
		return {
			success: true,
			audioUrl: stored.url,
			musicAudioStorageId: stored.storageId,
			modelUsed: STABLE_AUDIO_MODEL,
		};
	},
});
