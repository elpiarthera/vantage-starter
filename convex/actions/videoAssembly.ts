"use node";

import { v } from "convex/values";
import type { RendiAudioResult } from "../../lib/audio-processing";
import { deleteRendiFile, mixAudioWithRendi } from "../../lib/audio-processing";
import type {
	PerSceneTransition,
	RendiVideoResult,
	XfadeTransitionType,
} from "../../lib/rendi-video-processing";
import {
	deleteRendiFile as deleteVideoFile,
	mergeAudioVideo,
	mergeVideosConcat,
	mergeVideosWithPerSceneXfade,
	mergeVideosWithXfade,
} from "../../lib/rendi-video-processing";
import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { ActionCtx } from "../_generated/server";
import { action } from "../_generated/server";

const FAL_KEY = process.env.FAL_KEY;

/**
 * Assembly configuration constants
 */
const DEFAULT_TRANSITION_DURATION = 1.0; // seconds
const MIN_CLIP_DURATION = 3.0; // seconds (minimum per scene)
const DEFAULT_SCENE_DURATION = 10.0; // seconds per scene (fixed, not derived from narration)
/** Delay after mix so Rendi storage can propagate before merge job fetches mixed_audio.m4a */
const RENDI_STORAGE_PROPAGATION_DELAY_MS = 4000;
/** Retries for merge step (transient "Failed downloading file" from Rendi) */
const MERGE_RETRIES = 2;
const MERGE_RETRY_DELAY_MS = 4000;

type AssemblyStatus =
	| "preparing_assets"
	| "processing_media"
	| "finalizing_video"
	| "saving_video"
	| "completed"
	| "failed";

async function updateStatus(
	ctx: ActionCtx,
	projectId: Id<"projects">,
	status: AssemblyStatus,
) {
	await ctx.runMutation(api.projects.updateAssemblyStatus, {
		projectId,
		assemblyStatus: status,
	});
}

async function withRetry<T>(
	fn: () => Promise<T>,
	retries = 2,
	delayMs = 1000,
): Promise<T> {
	try {
		return await fn();
	} catch (error) {
		if (retries === 0) throw error;
		await new Promise((resolve) => setTimeout(resolve, delayMs));
		return withRetry(fn, retries - 1, delayMs);
	}
}

interface SceneWithTransition {
	videoUrl: string;
	outgoingTransition?: {
		effectKey: string;
		duration: number;
	};
}

// Note: getSceneVideoUrls replaced by getScenesWithTransitions in Sprint 11 Phase 2
// Kept for reference but could be removed in future cleanup

/**
 * Sprint 11 Phase 2: Get scene video URLs with their transition configurations
 */
async function getScenesWithTransitions(
	ctx: ActionCtx,
	sceneIds: Array<Id<"scenes">>,
): Promise<SceneWithTransition[]> {
	const scenes: SceneWithTransition[] = [];
	for (const id of sceneIds) {
		const scene = await ctx.runQuery(api.scenes.get, { sceneId: id });
		if (!scene?.videoUrl) {
			throw new Error(`Missing videoUrl for scene ${id}`);
		}
		scenes.push({
			videoUrl: scene.videoUrl,
			outgoingTransition: scene.outgoingTransition,
		});
	}
	return scenes;
}

async function downloadAndStoreVideo(
	ctx: ActionCtx,
	videoUrl: string,
	projectId: Id<"projects">,
) {
	const response = await fetch(videoUrl);
	if (!response.ok) {
		throw new Error(`Failed to download video from Fal: ${response.status}`);
	}

	const blob = await response.blob();
	const buffer = await blob.arrayBuffer();
	const storageId = await ctx.storage.store(
		new Blob([buffer], { type: "video/mp4" }),
	);
	const storedUrl = await ctx.storage.getUrl(storageId);
	if (!storedUrl) {
		throw new Error("Failed to get Convex storage URL");
	}

	await ctx.runMutation(api.projects.updateStorageId, {
		projectId,
		finalVideoStorageId: storageId,
	});

	return { storedUrl, size: buffer.byteLength, storageId };
}

/**
 * Calculate clip duration for each scene.
 *
 * SPRINT 21 FIX: Use fixed scene duration (10s by default), not narration duration.
 *
 * Video Duration Calculation:
 * - Hard Cut: numScenes × sceneDuration = 3 × 10s = 30s
 * - Xfade: (numScenes × sceneDuration) - ((numScenes-1) × transitionDuration) = 30s - 2×1s = 28s
 *
 * The sceneDuration parameter allows for future support of per-scene durations.
 */
function calculateClipDuration(
	sceneDuration: number = DEFAULT_SCENE_DURATION,
): number {
	// Ensure minimum clip duration (at least 3 seconds per scene)
	return Math.max(sceneDuration, MIN_CLIP_DURATION);
}

export async function buildFinalVideoHandler(
	ctx: ActionCtx,
	args: {
		projectId: Id<"projects">;
		sceneIds: Id<"scenes">[];
		narrationUrl: string;
		musicUrl: string; // Always required - user must select music before assembly
		narrationDurationMs?: number;
		targetResolution?: string;
		transitionConfig?: {
			mode: "hard_cut" | "xfade";
			xfadeType?: string;
			transitionDuration?: number;
		};
	},
) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new Error("Not authenticated");
	}

	if (!FAL_KEY) {
		throw new Error("FAL_KEY not configured");
	}

	let transactionId: Id<"creditTransactions"> | undefined;
	let rendiFileId: string | undefined;
	let mergedVideoResult: RendiVideoResult | undefined;
	let finalResult: RendiVideoResult | undefined;

	// Extract transition configuration
	const transitionMode = args.transitionConfig?.mode ?? "hard_cut";
	const transitionType = args.transitionConfig?.xfadeType ?? "circleopen";
	const transitionDuration =
		args.transitionConfig?.transitionDuration ?? DEFAULT_TRANSITION_DURATION;

	// Calculate clip duration - use fixed scene duration (not narration duration)
	const numScenes = args.sceneIds.length;
	const clipDuration = calculateClipDuration(DEFAULT_SCENE_DURATION);

	// Calculate expected final video duration
	const expectedDuration =
		transitionMode === "hard_cut"
			? numScenes * clipDuration
			: numScenes * clipDuration - (numScenes - 1) * transitionDuration;

	console.log(
		`[VideoAssembly] Scene clip: ${clipDuration.toFixed(2)}s per clip, ${numScenes} scenes, mode: ${transitionMode}, expected duration: ${expectedDuration.toFixed(2)}s`,
	);

	// Use the longer of: expected video duration OR narration duration
	// to prevent narration from being truncated during audio mix.
	const narrationDurationSec = args.narrationDurationMs
		? args.narrationDurationMs / 1000
		: 0;

	const mixDuration = Math.max(expectedDuration, narrationDurationSec);

	console.log(
		`[VideoAssembly] Mix duration: ${mixDuration.toFixed(2)}s (video: ${expectedDuration.toFixed(2)}s, narration: ${narrationDurationSec.toFixed(2)}s)`,
	);

	// Log audio URLs for debugging
	console.log(
		`[VideoAssembly] Audio inputs - narration: ${args.narrationUrl?.substring(0, 60)}..., music: ${args.musicUrl?.substring(0, 60)}...`,
	);

	try {
		// Deduct credits up front
		const creditResult = await ctx.runMutation(internal.credits.deductCredits, {
			clerkUserId: identity.subject,
			actionType: "video_assembly",
			projectId: args.projectId,
		});

		if (!creditResult.success || !creditResult.transactionId) {
			throw new Error(creditResult.error || "Unable to deduct credits");
		}

		transactionId = creditResult.transactionId;

		await updateStatus(ctx, args.projectId, "preparing_assets");

		// Sprint 11 Phase 2: Get scenes with their per-scene transitions
		const scenesWithTransitions = await getScenesWithTransitions(
			ctx,
			args.sceneIds,
		);
		const sceneUrls = scenesWithTransitions.map((s) => s.videoUrl);

		// Check if we have per-scene transitions configured (project mode takes precedence)
		const hasPerSceneTransitions =
			transitionMode !== "hard_cut" &&
			scenesWithTransitions.some((s) => s.outgoingTransition);

		await updateStatus(ctx, args.projectId, "processing_media");

		let audioResult: RendiAudioResult;

		// Choose merge method based on transition mode
		if (transitionMode === "hard_cut") {
			// Hard cut: simple concatenation (no transitions)
			[audioResult, mergedVideoResult] = await Promise.all([
				withRetry(() =>
					mixAudioWithRendi(args.narrationUrl, args.musicUrl, mixDuration),
				),
				withRetry(() => mergeVideosConcat(sceneUrls, { clipDuration })),
			]);
		} else if (hasPerSceneTransitions) {
			// Sprint 11 Phase 2: Per-scene transitions (each scene pair can have different effect)
			const perSceneTransitions: PerSceneTransition[] = scenesWithTransitions
				.slice(0, -1) // All scenes except last (no outgoing transition)
				.map((scene) => ({
					effectKey: scene.outgoingTransition?.effectKey ?? "circleopen",
					duration: scene.outgoingTransition?.duration ?? transitionDuration,
				}));

			console.log(
				`[VideoAssembly] Using per-scene transitions: ${JSON.stringify(perSceneTransitions)}`,
			);

			[audioResult, mergedVideoResult] = await Promise.all([
				withRetry(() =>
					mixAudioWithRendi(args.narrationUrl, args.musicUrl, mixDuration),
				),
				withRetry(() =>
					mergeVideosWithPerSceneXfade(sceneUrls, {
						transitions: perSceneTransitions,
						clipDuration,
					}),
				),
			]);
		} else {
			// Legacy: uniform xfade transitions (backward compatibility)
			[audioResult, mergedVideoResult] = await Promise.all([
				withRetry(() =>
					mixAudioWithRendi(args.narrationUrl, args.musicUrl, mixDuration),
				),
				withRetry(() =>
					mergeVideosWithXfade(sceneUrls, {
						transitionType: transitionType as XfadeTransitionType,
						transitionDuration,
						clipDuration,
					}),
				),
			]);
		}

		if (
			!mergedVideoResult ||
			!mergedVideoResult.success ||
			!mergedVideoResult.videoUrl
		) {
			throw new Error(mergedVideoResult?.error || "Video merge failed");
		}

		// Log audio mixing result for debugging
		console.log(
			`[VideoAssembly] Audio mixing result: success=${audioResult.success}, hasUrl=${!!audioResult.mixedAudioUrl}, error=${audioResult.error || "none"}`,
		);

		let finalAudioUrl = args.narrationUrl;
		if (audioResult.success && audioResult.mixedAudioUrl) {
			finalAudioUrl = audioResult.mixedAudioUrl;
			rendiFileId = audioResult.fileId;
			console.log("[VideoAssembly] Using mixed audio (narration + music)");
			// Allow Rendi storage to propagate so merge job can fetch mixed_audio.m4a
			await new Promise((resolve) =>
				setTimeout(resolve, RENDI_STORAGE_PROPAGATION_DELAY_MS),
			);
		} else {
			console.warn(
				`[VideoAssembly] Audio mixing failed, falling back to narration only. Reason: ${audioResult.error || "unknown"}`,
			);
		}

		const mergedVideoUrl = mergedVideoResult.videoUrl;

		await updateStatus(ctx, args.projectId, "finalizing_video");

		finalResult = await withRetry(
			() => mergeAudioVideo(mergedVideoUrl, finalAudioUrl),
			MERGE_RETRIES,
			MERGE_RETRY_DELAY_MS,
		);

		if (!finalResult.success || !finalResult.videoUrl) {
			throw new Error(finalResult.error || "Final merge failed");
		}

		const assemblyVideoUrl = finalResult.videoUrl;

		await updateStatus(ctx, args.projectId, "saving_video");

		const { storedUrl, size, storageId } = await downloadAndStoreVideo(
			ctx,
			assemblyVideoUrl,
			args.projectId,
		);

		await ctx.runMutation(api.projects.updateFinalVideo, {
			projectId: args.projectId,
			finalVideoUrl: storedUrl,
			finalVideoSize: size,
			assemblyStatus: "completed",
		});

		try {
			await ctx.runMutation(api.videos.insertFromAssembly, {
				projectId: args.projectId,
				fileStorageId: storageId,
				url: storedUrl,
				metadata: {
					size,
					duration: expectedDuration,
					resolution: "1920x1080",
					fps: 30,
					format: "mp4",
					processingTime: 0,
					sceneCount: numScenes,
				},
				renderConfig: {
					sceneIds: args.sceneIds as string[],
					audioTrackIds: [],
					transitions: args.transitionConfig ? [args.transitionConfig] : [],
					effects: [],
				},
				creditsUsed: 5,
			});
		} catch (e) {
			console.warn("[VideoAssembly] Failed to insert videos row:", e);
		}

	await ctx.runMutation(api.usageTracking.logAIUsage, {
		userId: identity.subject,
		service: "rendi",
		model:
			transitionMode === "hard_cut"
				? "rendi-ffmpeg-concat+audio-merge"
				: `rendi-ffmpeg-xfade-${transitionType}+audio-merge`,
		resourceType: "video",
		resourceId: args.projectId,
		eventType: "generation",
		projectId: args.projectId,
		creditsUsed: 5,
		cost: 0.1,
		metadata: {
			success: true,
			duration: clipDuration,
			numScenes,
		},
	});

		return {
			success: true,
			finalUrl: storedUrl,
			audioMixMethod: audioResult.success
				? "rendi-ducking"
				: "fallback-narration-only",
			clipDuration,
		};
	} catch (error) {
		await updateStatus(ctx, args.projectId, "failed");

		if (transactionId) {
		await ctx.runMutation(internal.credits.refundCredits, {
			transactionId,
			reason: "assembly_failed",
		});
		}

		throw error;
	} finally {
		if (rendiFileId) {
			await deleteRendiFile(rendiFileId);
		}
		if (mergedVideoResult?.fileId) {
			await deleteVideoFile(mergedVideoResult.fileId);
		}
		if (finalResult?.fileId) {
			await deleteVideoFile(finalResult.fileId);
		}
	}
}

export const buildFinalVideo = action({
	args: {
		projectId: v.id("projects"),
		sceneIds: v.array(v.id("scenes")),
		narrationUrl: v.string(),
		musicUrl: v.string(), // Always required - user must select music before assembly
		narrationDurationMs: v.optional(v.number()),
		targetResolution: v.optional(v.string()),
		// Sprint 11: Transition configuration
		transitionConfig: v.optional(
			v.object({
				mode: v.union(v.literal("hard_cut"), v.literal("xfade")),
				xfadeType: v.optional(v.string()),
				transitionDuration: v.optional(v.number()),
			}),
		),
	},
	handler: buildFinalVideoHandler,
});
