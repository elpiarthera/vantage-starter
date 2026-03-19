/**
 * Image Prompt Enhancement
 *
 * Purpose: Enhance user descriptions into detailed AI image generation prompts
 * Used by: convex/actions/aiChat.ts (enhanceImagePrompt)
 * Model: OpenAI GPT-4o-mini or Together.ai Llama 3.1 8B
 * Version: 1.0
 * Last Updated: 2025-11-19
 *
 * Changelog:
 * - 1.0 (2025-11-19): Migrated from hardcoded inline prompt
 */

import type { PromptMetadata } from "../utils/prompt-types";

export const IMAGE_ENHANCEMENT_PROMPT = {
	/**
	 * System prompt for enhancing image descriptions
	 */
	system: `You are an expert at creating detailed image generation prompts. Enhance the given prompt to be more descriptive and visually specific while keeping it under 200 words. Focus on lighting, composition, mood, and cinematic details. Do not add explanations, just return the enhanced prompt.`,

	/**
	 * Build user prompt with base description
	 */
	buildUserPrompt: (basePrompt: string): string => {
		return `Enhance this prompt for AI image generation:\n\n${basePrompt}`;
	},

	/**
	 * Build fallback enhanced prompt (when AI is unavailable)
	 */
	buildFallbackPrompt: (basePrompt: string): string => {
		return `${basePrompt}, high quality, cinematic, professional, 4K, detailed`;
	},

	/**
	 * Metadata
	 */
	metadata: {
		version: "1.0",
		model: ["gpt-4o-mini", "Meta-Llama-3.1-8B-Instruct-Turbo"],
		temperature: 0.8,
		maxTokens: 300,
		updatedAt: "2025-11-19",
		author: "MyShortReel Team",
	} as PromptMetadata,
};
