"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

/**
 * Real-time video generation status hook
 *
 * Uses Convex subscriptions to automatically update when video status changes.
 * No manual polling required - Convex handles real-time updates.
 *
 * @param sceneId - The scene ID to track video status for
 * @returns Video status, progress, and completion state
 *
 * @example
 * ```tsx
 * const { status, progress, videoUrl, isGenerating, isCompleted, error } =
 *   useVideoStatus(sceneId);
 * ```
 */
export function useVideoStatus(sceneId: Id<"scenes"> | undefined) {
	const videoStatus = useQuery(
		api.videoStatus.getVideoGenerationStatus,
		sceneId ? { sceneId } : "skip",
	);

	if (!videoStatus) {
		return {
			status: "idle" as const,
			progress: 0,
			videoUrl: null,
			isGenerating: false,
			isCompleted: false,
			error: null,
			cost: null,
			creditsUsed: null,
		};
	}

	const generationStatus = videoStatus.videoGeneration?.status || "idle";
	const isGenerating =
		generationStatus === "pending" || generationStatus === "in_progress";
	const isCompleted = generationStatus === "completed";
	const isFailed = generationStatus === "failed";

	return {
		status: videoStatus.status || "draft",
		generationStatus,
		progress: videoStatus.videoGeneration?.progress || 0,
		videoUrl: videoStatus.videoUrl || null,
		isGenerating,
		isCompleted,
		isFailed,
		error: videoStatus.videoGeneration?.error || null,
		cost: videoStatus.videoGeneration?.cost || null,
		creditsUsed: videoStatus.videoGeneration?.creditsUsed || null,
		requestId: videoStatus.videoGeneration?.requestId || null,
		provider: videoStatus.videoGeneration?.provider || null,
		model: videoStatus.videoGeneration?.model || null,
	};
}
