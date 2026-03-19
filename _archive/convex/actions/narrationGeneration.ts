"use node";

import { v } from "convex/values";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { ActionCtx } from "../_generated/server";
import { action } from "../_generated/server";

const FAL_KEY = process.env.FAL_KEY;

/**
 * Language Expansion Coefficients
 * Must match lib/ai/prompts/audio/narration-script.prompt.ts
 */
const LANGUAGE_COEFFICIENTS: Record<string, number> = {
	en: 1.0,
	fr: 0.85,
	es: 0.85,
	it: 0.85,
	pt: 0.8,
	de: 0.75,
	ru: 0.65, // Lowered to fix duration overflow
};

/**
 * Duration thresholds for narration
 */
const MAX_DURATION_MS = 30000; // 30 seconds - trigger retry if exceeded
const TARGET_DURATION_MS = 30000; // 30 seconds - ideal target
const MAX_SPEED_FACTOR = 1.15; // Maximum speed boost (imperceptible)

/**
 * Cost per TTS generation (MiniMax Speech 2.6 HD)
 */
const TTS_COST_PER_CALL = 0.02; // $0.02 per generation

type QueueStatus = {
	status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
	request_id: string;
	status_url?: string;
	response_url?: string;
};

type Speech26Result = {
	audio: { url: string };
	duration_ms?: number;
};

const PRIMARY_MODEL = "fal-ai/minimax/speech-2.6-hd";
const FALLBACK_MODEL = "fal-ai/minimax/speech-2.6-turbo";

/**
 * Calculate predictive speed based on word count and language
 * Returns a speed factor (1.0 = normal, 1.05 = 5% faster)
 */
function calculatePredictiveSpeed(
	prompt: string,
	languageCode: string,
): number {
	const wordCount = prompt.split(/\s+/).filter((w) => w.length > 0).length;
	const coefficient = LANGUAGE_COEFFICIENTS[languageCode] || 1.0;

	// Target words for 30s: 65 * coefficient (conservative buffer vs old 75)
	const targetWords = Math.round(65 * coefficient);

	// If word count exceeds target by >10%, start with slight speed boost
	if (wordCount > targetWords * 1.1) {
		return 1.05; // 5% faster
	}

	return 1.0;
}

/**
 * Calculate retry speed factor based on actual duration
 */
function calculateRetrySpeed(actualDurationMs: number): number {
	const requiredSpeed = actualDurationMs / TARGET_DURATION_MS;
	return Math.min(requiredSpeed, MAX_SPEED_FACTOR);
}

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
		throw new Error(`fal.ai API error: ${response.status} - ${errorText}`);
	}

	return (await response.json()) as QueueStatus;
}

async function pollFalResult<TOutput>(
	statusUrl?: string,
	responseUrl?: string,
) {
	if (!statusUrl || !responseUrl) {
		throw new Error("Missing status_url or response_url from fal.ai");
	}

	let attempts = 0;
	const maxAttempts = 120; // 2 minutes

	while (attempts < maxAttempts) {
		attempts++;
		await new Promise((resolve) => setTimeout(resolve, 2000));

		const statusRes = await fetch(statusUrl, {
			headers: { Authorization: `Key ${FAL_KEY}` },
		});
		if (!statusRes.ok) continue;

		const statusData = (await statusRes.json()) as QueueStatus;

		if (statusData.status === "COMPLETED") {
			const resultRes = await fetch(responseUrl, {
				headers: { Authorization: `Key ${FAL_KEY}` },
			});
			if (!resultRes.ok) {
				throw new Error(`Failed to fetch result: ${resultRes.status}`);
			}
			return (await resultRes.json()) as TOutput;
		}

		if (statusData.status === "FAILED") {
			throw new Error("fal.ai TTS job failed");
		}
	}

	throw new Error("fal.ai TTS job timed out");
}

/**
 * Build TTS payload for MiniMax Speech 2.6
 */
function buildTTSPayload(
	prompt: string,
	voiceId: string,
	language: string,
	speed: number,
	pitch: number,
	emotion: string,
) {
	return {
		prompt: prompt.slice(0, 10000),
		output_format: "url",
		language_boost: language || "auto",
		voice_setting: {
			voice_id: voiceId,
			speed,
			vol: 1,
			pitch,
			emotion,
			english_normalization: language === "English",
		},
		audio_setting: {
			sample_rate: 44100,
			bitrate: 256000,
			format: "mp3",
			channel: 2,
		},
		normalization_setting: {
			enabled: true,
			target_loudness: -18,
			target_range: 8,
			target_peak: -0.5,
		},
	};
}

/**
 * Fetch audio from Fal URL and store in Convex storage.
 * Returns Convex URL and storage ID for project/step4Data.
 */
async function storeNarrationInConvex(
	ctx: ActionCtx,
	falUrl: string,
): Promise<{ url: string; storageId: Id<"_storage"> }> {
	const response = await fetch(falUrl);
	if (!response.ok) {
		throw new Error(`Failed to download narration: ${response.status}`);
	}
	const blob = await response.blob();
	const contentType =
		response.headers.get("content-type") || blob.type || "audio/mpeg";
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

export const generateNarration = action({
	args: {
		projectId: v.id("projects"),
		prompt: v.string(),
		voiceId: v.string(),
		language: v.string(),
		languageCode: v.optional(v.string()), // ISO code: 'en', 'fr', 'de', etc.
		speed: v.optional(v.number()),
		pitch: v.optional(v.number()),
		emotion: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		if (!FAL_KEY) {
			throw new Error("FAL_KEY not configured");
		}

		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");

		const startTime = Date.now();
		const langCode = args.languageCode || "en";
		const baseSpeed = args.speed ?? 1;
		const pitch = args.pitch ?? 0;
		const emotion = args.emotion ?? "neutral";

		// Step B: Calculate predictive speed
		const predictiveSpeed = calculatePredictiveSpeed(args.prompt, langCode);
		const initialSpeed = Math.max(baseSpeed, predictiveSpeed);

		// Primary: Speech 2.6 HD
		try {
			const primaryPayload = buildTTSPayload(
				args.prompt,
				args.voiceId,
				args.language,
				initialSpeed,
				pitch,
				emotion,
			);

			const status = await submitFalJob(PRIMARY_MODEL, primaryPayload);
			const result = await pollFalResult<Speech26Result>(
				status.status_url,
				status.response_url,
			);

			// Step C: Check duration and retry if needed
			if (result.duration_ms && result.duration_ms > MAX_DURATION_MS) {
				console.log(
					`[Narration] Duration ${result.duration_ms}ms exceeds ${MAX_DURATION_MS}ms, retrying with speed adjustment`,
				);

				const retrySpeed = calculateRetrySpeed(result.duration_ms);
				const retryPayload = buildTTSPayload(
					args.prompt,
					args.voiceId,
					args.language,
					retrySpeed,
					pitch,
					emotion,
				);

				const retryStatus = await submitFalJob(PRIMARY_MODEL, retryPayload);
				const retryResult = await pollFalResult<Speech26Result>(
					retryStatus.status_url,
					retryStatus.response_url,
				);

				const latency = Date.now() - startTime;

				// Log usage with retry metadata
				try {
					await ctx.runMutation(api.usageTracking.logAIUsage, {
						userId: identity.subject,
						projectId: args.projectId as string,
						resourceType: "audio",
						resourceId: args.projectId as string,
						eventType: "generation",
						service: "fal",
						model: "minimax-speech-2.6-hd",
						creditsUsed: 10, // 2 TTS calls
						cost: TTS_COST_PER_CALL * 2, // Double cost for retry
						metadata: {
							success: true,
							duration: latency,
							durationMs: retryResult.duration_ms,
							speedFactor: retrySpeed,
							wasRetried: true,
							originalDurationMs: result.duration_ms,
							languageCode: langCode,
						},
					});
				} catch {
					console.warn("[Narration] Failed to log usage");
				}

				const stored = await storeNarrationInConvex(ctx, retryResult.audio.url);
				try {
					await ctx.runMutation(api.audioTracks.insertFromGeneration, {
						projectId: args.projectId,
						type: "narration",
						storageId: stored.storageId,
						durationMs: retryResult.duration_ms ?? 0,
						title: "Narration",
						creditsUsed: 10,
					});
				} catch (e) {
					console.warn("[Narration] Failed to insert audioTracks row:", e);
				}
				return {
					success: true,
					audioUrl: stored.url,
					narrationAudioStorageId: stored.storageId,
					durationMs: retryResult.duration_ms,
					modelUsed: PRIMARY_MODEL,
					speedFactor: retrySpeed,
					wasRetried: true,
					originalDurationMs: result.duration_ms,
				};
			}

			const latency = Date.now() - startTime;

			// Log successful usage
			try {
				await ctx.runMutation(api.usageTracking.logAIUsage, {
					userId: identity.subject,
					projectId: args.projectId as string,
					resourceType: "audio",
					resourceId: args.projectId as string,
					eventType: "generation",
					service: "fal",
					model: "minimax-speech-2.6-hd",
					creditsUsed: 5,
					cost: TTS_COST_PER_CALL,
					metadata: {
						success: true,
						duration: latency,
						durationMs: result.duration_ms,
						speedFactor: initialSpeed,
						wasRetried: false,
						languageCode: langCode,
					},
				});
			} catch {
				console.warn("[Narration] Failed to log usage");
			}

			const stored = await storeNarrationInConvex(ctx, result.audio.url);
			try {
				await ctx.runMutation(api.audioTracks.insertFromGeneration, {
					projectId: args.projectId,
					type: "narration",
					storageId: stored.storageId,
					durationMs: result.duration_ms ?? 0,
					title: "Narration",
					creditsUsed: 5,
				});
			} catch (e) {
				console.warn("[Narration] Failed to insert audioTracks row:", e);
			}
			return {
				success: true,
				audioUrl: stored.url,
				narrationAudioStorageId: stored.storageId,
				durationMs: result.duration_ms,
				modelUsed: PRIMARY_MODEL,
				speedFactor: initialSpeed,
				wasRetried: false,
			};
		} catch (primaryError) {
			console.warn(
				"[Narration] Primary failed, trying fallback:",
				primaryError,
			);
		}

		// Fallback: Speech 2.6 Turbo
		const fallbackPayload = buildTTSPayload(
			args.prompt,
			args.voiceId,
			args.language,
			baseSpeed,
			pitch,
			emotion,
		);

		const status = await submitFalJob(FALLBACK_MODEL, fallbackPayload);
		const result = await pollFalResult<Speech26Result>(
			status.status_url,
			status.response_url,
		);

		const latency = Date.now() - startTime;

		// Log fallback usage
		try {
			await ctx.runMutation(api.usageTracking.logAIUsage, {
				userId: identity.subject,
				projectId: args.projectId as string,
				resourceType: "audio",
				resourceId: args.projectId as string,
				eventType: "generation",
				service: "fal",
				model: "minimax-speech-2.6-turbo",
				creditsUsed: 5,
				cost: TTS_COST_PER_CALL,
				metadata: {
					success: true,
					duration: latency,
					durationMs: result.duration_ms,
					speedFactor: baseSpeed,
					wasRetried: false,
					isFallback: true,
					languageCode: langCode,
				},
			});
		} catch {
			console.warn("[Narration] Failed to log usage");
		}

		const stored = await storeNarrationInConvex(ctx, result.audio.url);
		try {
			await ctx.runMutation(api.audioTracks.insertFromGeneration, {
				projectId: args.projectId,
				type: "narration",
				storageId: stored.storageId,
				durationMs: result.duration_ms ?? 0,
				title: "Narration",
				creditsUsed: 5,
			});
		} catch (e) {
			console.warn("[Narration] Failed to insert audioTracks row:", e);
		}
		return {
			success: true,
			audioUrl: stored.url,
			narrationAudioStorageId: stored.storageId,
			durationMs: result.duration_ms,
			modelUsed: FALLBACK_MODEL,
			speedFactor: baseSpeed,
			wasRetried: false,
		};
	},
});
