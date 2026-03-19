"use client";

import { useAction, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

/**
 * Video regeneration hook
 *
 * Handles video regeneration with feedback tracking and regeneration limits.
 *
 * @param sceneId - The scene ID to regenerate video for
 * @returns Regeneration function, count, and availability
 *
 * @example
 * ```tsx
 * const { regenerate, regenerationCount, canRegenerate, maxRegenerations } =
 *   useVideoRegeneration(sceneId);
 *
 * await regenerate({
 *   feedback: "Make it faster paced",
 *   sceneDescription: "A dramatic scene",
 *   cinematicStyles: ["fast-paced", "action"],
 * });
 * ```
 */
export function useVideoRegeneration(sceneId: Id<"scenes"> | undefined) {
	const [isRegenerating, setIsRegenerating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Get current video status to check regeneration history
	const videoStatus = useQuery(
		api.videoStatus.getVideoGenerationStatus,
		sceneId ? { sceneId } : "skip",
	);

	// Regeneration action
	const regenerateAction = useAction(
		api.actions.videoRegeneration.regenerateVideo,
	);

	const maxRegenerations = 5;
	const regenerationCount = videoStatus?.videoGeneration?.retryCount || 0;
	const canRegenerate = regenerationCount < maxRegenerations;

	const regenerate = async (params: {
		feedback: string;
		sceneDescription?: string;
		cinematicStyles?: string[];
	}) => {
		if (!sceneId) {
			throw new Error("Scene ID is required for regeneration");
		}

		if (!canRegenerate) {
			throw new Error(
				`Maximum regeneration limit reached (${maxRegenerations})`,
			);
		}

		setIsRegenerating(true);
		setError(null);

		try {
			await regenerateAction({
				sceneId,
				feedback: params.feedback,
				sceneDescription: params.sceneDescription,
				cinematicStyles: params.cinematicStyles,
			});

			console.log("[useVideoRegeneration] Regeneration started successfully");
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : "Unknown error";
			setError(errorMessage);
			console.error("[useVideoRegeneration] Regeneration failed:", err);
			throw err;
		} finally {
			setIsRegenerating(false);
		}
	};

	return {
		regenerate,
		regenerationCount,
		canRegenerate,
		maxRegenerations,
		isRegenerating,
		error,
	};
}
