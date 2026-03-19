"use client";

import { useCallback, useState } from "react";
import type { VideoGenerationState } from "@/components/types";
import { trackUserInteraction } from "@/lib/monitoring/analytics";
import { generateVideo, regenerateVideo } from "@/services/videoGeneration";

interface VideoWorkflowState {
	[sceneId: string]: VideoGenerationState;
}

interface GeneratedVideos {
	[sceneId: string]: string;
}

export function useVideoWorkflow() {
	const [videoStates, setVideoStates] = useState<VideoWorkflowState>({});
	const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideos>({});

	const handleGenerateVideo = useCallback(
		async (
			sceneId: string,
			startFrameImage: string,
			endFrameImage: string,
			duration: number,
			cinematicStyles?: any,
		) => {
			// Set generating state
			setVideoStates((prev) => ({
				...prev,
				[sceneId]: { status: "generating", progress: 0 },
			}));

			trackUserInteraction("generate_video", "VideoWorkflow", {
				sceneId,
				duration,
			});

			try {
				const result = await generateVideo({
					sceneId,
					startFrameImage,
					endFrameImage,
					duration,
					cinematicStyles,
				});

				if (result.success && result.videoUrl) {
					setVideoStates((prev) => ({
						...prev,
						[sceneId]: { status: "completed" },
					}));
					setGeneratedVideos((prev) => ({
						...prev,
						[sceneId]: result.videoUrl!,
					}));
				} else {
					setVideoStates((prev) => ({
						...prev,
						[sceneId]: { status: "idle", error: result.error },
					}));
				}
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Unknown error";
				setVideoStates((prev) => ({
					...prev,
					[sceneId]: { status: "idle", error: errorMessage },
				}));
			}
		},
		[],
	);

	const handleRegenerateVideo = useCallback(
		async (sceneId: string, feedback: string, originalOptions: any) => {
			setVideoStates((prev) => ({
				...prev,
				[sceneId]: { status: "generating", progress: 0 },
			}));

			trackUserInteraction("regenerate_video", "VideoWorkflow", {
				sceneId,
				feedback,
			});

			try {
				const result = await regenerateVideo(
					sceneId,
					feedback,
					originalOptions,
				);

				if (result.success && result.videoUrl) {
					setVideoStates((prev) => ({
						...prev,
						[sceneId]: { status: "completed" },
					}));
					setGeneratedVideos((prev) => ({
						...prev,
						[sceneId]: result.videoUrl!,
					}));
				} else {
					setVideoStates((prev) => ({
						...prev,
						[sceneId]: { status: "idle", error: result.error },
					}));
				}
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Unknown error";
				setVideoStates((prev) => ({
					...prev,
					[sceneId]: { status: "idle", error: errorMessage },
				}));
			}
		},
		[],
	);

	const getVideoState = useCallback(
		(sceneId: string): VideoGenerationState => {
			return videoStates[sceneId] || { status: "idle" };
		},
		[videoStates],
	);

	const getGeneratedVideo = useCallback(
		(sceneId: string): string | undefined => {
			return generatedVideos[sceneId];
		},
		[generatedVideos],
	);

	const resetVideoState = useCallback((sceneId: string) => {
		setVideoStates((prev) => {
			const newState = { ...prev };
			delete newState[sceneId];
			return newState;
		});
		setGeneratedVideos((prev) => {
			const newVideos = { ...prev };
			delete newVideos[sceneId];
			return newVideos;
		});
	}, []);

	return {
		// State
		videoStates,
		generatedVideos,

		// Actions
		generateVideo: handleGenerateVideo,
		regenerateVideo: handleRegenerateVideo, // Export the regenerateVideo function
		resetVideoState,

		// Utilities
		getVideoState,
		getGeneratedVideo,
	};
}
