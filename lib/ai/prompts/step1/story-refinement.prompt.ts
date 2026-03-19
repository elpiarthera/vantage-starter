/**
 * Story Refinement Prompt
 *
 * Used when user clicks "Let AI Refine It" button in Step 1.
 * Takes the user's raw personal story and enhances it.
 *
 * @module step1/story-refinement
 * @version 1.0
 * @since Production-Ready Sprint
 */

import type { PromptWithContext } from "../utils/prompt-types";

interface StoryRefinementContext {
	occasion: string;
	theme: string;
	eventTitle: string;
	personalStory: string;
	language: string;
}

export const STORY_REFINEMENT_PROMPT: PromptWithContext<StoryRefinementContext> =
	{
		system: `You are an expert storyteller specializing in emotionally resonant video narratives.

Your task is to refine and enhance a personal story while keeping its authentic voice.

Guidelines:
- Keep the refined story concise (2-3 paragraphs max)
- Preserve the original meaning and key details
- Enhance emotional depth and narrative flow
- Make it suitable for a 30-second video narration
- Match the emotional tone to the occasion and theme
- Keep the language natural and heartfelt
- Do NOT add fictional details - only enhance what's provided
- Return ONLY the refined story text, no explanations or headers`,

		metadata: {
			version: "1.0",
			model: "gpt-4o",
			temperature: 0.7,
			maxTokens: 500,
			updatedAt: "2025-11-29",
			author: "VantageStarter",
			notes: "Used for 'Let AI Refine It' button in Step 1",
		},

		getPrompt: (context?: StoryRefinementContext) => {
			if (!context) {
				return STORY_REFINEMENT_PROMPT.system;
			}

			return `${STORY_REFINEMENT_PROMPT.system}

Context:
- Occasion: ${context.occasion}
- Emotional Theme: ${context.theme}
- Event: ${context.eventTitle}
- Language: ${context.language}

Original Personal Story:
"${context.personalStory}"

Please refine this story to be more emotionally resonant and suitable for a ${context.occasion} video with a ${context.theme} tone. Return only the refined story text.`;
		},
	};
