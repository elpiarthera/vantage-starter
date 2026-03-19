/**
 * AI Prompts - Central Export Hub
 *
 * This file serves as the single entry point for all prompts in the system.
 * Import prompts from here rather than directly from individual files.
 *
 * @example
 * ```typescript
 * import { AI_DIRECTOR_PROMPT, VIDEO_GENERATION_PROMPT } from "@/lib/ai/prompts"
 * ```
 *
 * @module ai/prompts
 * @since Sprint 6
 */

export { MUSIC_ENHANCEMENT_PROMPT } from "./audio/music-enhancement.prompt";
// Audio Prompts
export { NARRATION_SCRIPT_PROMPT } from "./audio/narration-script.prompt";
// Chat Prompts
export { AI_DIRECTOR_PROMPT } from "./chat/ai-director.prompt";
// Image Prompts
export { IMAGE_ENHANCEMENT_PROMPT } from "./image/enhancement.prompt";
// Step 1 Prompts
export { STORY_GENERATION_PROMPT } from "./step1/story-generation.prompt";
export { STORY_REFINEMENT_PROMPT } from "./step1/story-refinement.prompt";
// Utility Types
export type {
	BasePrompt,
	PromptBuilder,
	PromptMetadata,
	PromptWithContext,
} from "./utils/prompt-types";
// Video Prompts
export {
	buildRegenerationPrompt,
	VIDEO_GENERATION_PROMPT,
	type VideoGenerationContext,
} from "./video/generation.prompt";
