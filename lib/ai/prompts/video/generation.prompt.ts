/**
 * Video Generation Prompt (Kling Video v2.5 Turbo Pro)
 *
 * Purpose: Build prompts for image-to-video generation with full project context
 * Used by: convex/actions/videoGeneration.ts
 * Model: fal.ai Kling Video v2.5 Turbo Pro
 * Version: 2.1
 * Last Updated: 2025-12-18
 *
 * Context:
 * - Video generation requires natural language prompts
 * - Kling v2.5 Turbo Pro supports enhanced cinematic motion and prompt adherence
 * - End frame URL influences transitions
 * - Full context from Step 1 (occasion, theme, emotion) and Step 2b (visual style) improves results
 *
 * Example output:
 * "A romantic scene at the Eiffel Tower. Emotional context: A love story that began under the stars.
 * This is for a wedding video. The overall mood is romantic. Visual style: cinematic.
 * Smooth, deliberate pacing suitable for a 10-second clip. High quality, professional production."
 *
 * Changelog:
 * - 2.1 (2025-12-18): Upgraded to Kling v2.5 Turbo Pro
 * - 2.0 (2025-12-01): Added full project context (visualStyle, occasion, theme, emotionalStory, duration)
 * - 1.0 (2025-11-19): Initial implementation for Sprint 6
 */

import type { PromptBuilder, PromptMetadata } from "../utils/prompt-types";

/**
 * Context for video generation prompt building
 *
 * Includes scene-level data and project-level data from Step 1 and Step 2b
 */
export interface VideoGenerationContext {
	// Scene-level (from Step 3)
	sceneDescription: string;
	cinematicStyles?: string[];
	frameType?: "static" | "transition";
	duration?: 5 | 10;

	// Project-level (from Step 1 & Step 2b)
	visualStyle?: string; // Step 2b: cinematic, vintage, storyboard, low key, etc.
	occasion?: string; // Step 1: wedding, birthday, corporate, etc.
	theme?: string; // Step 1: romantic, fun, professional, etc.
	emotionalStory?: string; // Step 1: "Shape the Emotion" user input
}

export const VIDEO_GENERATION_PROMPT: PromptBuilder<
	VideoGenerationContext,
	string
> = {
	/**
	 * Build a complete video generation prompt with full project context
	 *
	 * @param context - Scene description, cinematic styles, frame type, duration, and project context
	 * @returns Formatted prompt for Kling Video API
	 */
	buildPrompt: (context: VideoGenerationContext): string => {
		const {
			sceneDescription,
			cinematicStyles = [],
			frameType = "static",
			duration = 5,
			visualStyle,
			occasion,
			theme,
			emotionalStory,
		} = context;

		// Start with scene description
		let prompt = sceneDescription.trim();

		// Add emotional context from Step 1 (most important for storytelling)
		if (emotionalStory) {
			prompt += ` Emotional context: ${emotionalStory}.`;
		}

		// Add occasion context
		if (occasion) {
			prompt += ` This is for a ${occasion} video.`;
		}

		// Add theme/mood
		if (theme) {
			prompt += ` The overall mood is ${theme}.`;
		}

		// Add visual style from Step 2b
		if (visualStyle) {
			prompt += ` Visual style: ${visualStyle}.`;
		}

		// Add camera movement/transition if it's a transition frame
		if (frameType === "transition") {
			prompt +=
				" Smooth transition to the next scene with subtle camera movement.";
		}

		// Add scene-specific cinematic styles
		if (cinematicStyles.length > 0) {
			const styles = cinematicStyles.filter(Boolean).join(", ");
			if (styles) {
				prompt += ` ${styles}.`;
			}
		}

		// Add duration-appropriate pacing
		if (duration === 5) {
			prompt += " Quick, dynamic pacing suitable for a 5-second clip.";
		} else {
			prompt += " Smooth, deliberate pacing suitable for a 10-second clip.";
		}

		// Add quality enhancers
		prompt += " High quality, professional production.";

		return prompt;
	},

	/**
	 * Metadata
	 */
	metadata: {
		version: "2.1",
		model: "fal-ai/kling-video/v2.5-turbo/pro/image-to-video",
		updatedAt: "2025-12-18",
		author: "MyShortReel Team",
		notes:
			"Used for image-to-video generation. Includes full project context from Step 1 (occasion, theme, emotion) and Step 2b (visual style).",
	} as PromptMetadata,
};

/**
 * Build regeneration prompt with user feedback
 *
 * Takes the original prompt and user feedback to create an improved prompt
 * that incorporates the requested changes.
 *
 * @param originalPrompt - The original video generation prompt
 * @param feedback - User feedback on what to change/improve
 * @returns Enhanced prompt with feedback incorporated
 *
 * @example
 * ```typescript
 * const newPrompt = buildRegenerationPrompt(
 *   "A cinematic tracking shot...",
 *   "Make it faster paced with more dynamic movement"
 * );
 * ```
 */
export function buildRegenerationPrompt(
	originalPrompt: string,
	feedback: string,
): string {
	// Integrate feedback into the prompt while maintaining structure
	return `${originalPrompt}\n\nUser refinement: ${feedback}. Incorporate these changes while maintaining cinematic quality and smooth motion.`;
}
