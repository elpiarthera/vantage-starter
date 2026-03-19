import { MOCK_VIDEO_URL } from "@/config/constants";
import { trackEvent } from "@/lib/monitoring/analytics";

export interface VideoGenerationOptions {
	sceneId: string;
	startFrameImage: string;
	endFrameImage: string;
	duration: number;
	cinematicStyles?: {
		ambiance: string;
		cameraMovement: string;
		colorTone: string;
		visualStyle: string;
	};
}

export interface VideoGenerationResult {
	success: boolean;
	videoUrl?: string;
	error?: string;
}

export async function generateVideo(
	options: VideoGenerationOptions,
): Promise<VideoGenerationResult> {
	const { sceneId, duration } = options;

	trackEvent("video_generation_started", { sceneId, duration });

	try {
		// Simulate API call delay based on duration
		const delay = Math.max(2000, duration * 200); // Minimum 2s, longer for longer videos

		await new Promise((resolve) => setTimeout(resolve, delay));

		// In demo mode, always return success with mock video
		const result: VideoGenerationResult = {
			success: true,
			videoUrl: MOCK_VIDEO_URL,
		};

		trackEvent("video_generation_completed", {
			sceneId,
			duration,
			success: true,
		});
		return result;
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";

		trackEvent("video_generation_failed", {
			sceneId,
			duration,
			error: errorMessage,
		});

		return {
			success: false,
			error: errorMessage,
		};
	}
}

export async function regenerateVideo(
	sceneId: string,
	feedback: string,
	_originalOptions: VideoGenerationOptions,
): Promise<VideoGenerationResult> {
	trackEvent("video_regeneration_started", { sceneId, feedback });

	try {
		// Simulate processing feedback
		await new Promise((resolve) => setTimeout(resolve, 3000));

		const result: VideoGenerationResult = {
			success: true,
			videoUrl: MOCK_VIDEO_URL,
		};

		trackEvent("video_regeneration_completed", { sceneId, success: true });
		return result;
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";

		trackEvent("video_regeneration_failed", { sceneId, error: errorMessage });

		return {
			success: false,
			error: errorMessage,
		};
	}
}
