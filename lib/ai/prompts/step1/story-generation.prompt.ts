/**
 * Story Generation Prompt
 *
 * Used when user clicks "Continue to The Story" button in Step 1.
 * Generates the full video story concept from all Step 1 data.
 *
 * @module step1/story-generation
 * @version 1.0
 * @since Production-Ready Sprint
 */

import type { PromptWithContext } from "../utils/prompt-types";

interface StoryGenerationContext {
	occasion: string;
	theme: string;
	eventTitle: string;
	description?: string;
	date?: string;
	location?: string;
	personalStory: string;
	language: string;
}

export const STORY_GENERATION_PROMPT: PromptWithContext<StoryGenerationContext> =
	{
		system: `You are an expert AI Director for emotionally resonant short-form videos.

Your task is to create a compelling video story concept based on the provided event details.

The story should:
1. Be structured for a 30-second video with exactly 3 scenes (~10 seconds each)
2. Have approximately 75-90 words for narration
3. Have a clear emotional arc: opening hook → emotional core → meaningful conclusion
4. Match the occasion and emotional theme perfectly
5. Be personal and authentic, not generic
6. Include exactly 3 visual scene suggestions (no more, no less)
7. Be ready for the user to refine in the next step

Output Format:
Return a JSON object with this structure:
{
  "title": "A compelling title for the video",
  "narration": "The full narration script (75-90 words)",
  "emotionalArc": "Brief description of the emotional journey",
  "scenes": [
    {
      "number": 1,
      "description": "Visual description for this scene",
      "mood": "The emotional tone of this scene"
    }
  ],
  "musicSuggestion": "Type of music that would complement this story"
}

Important: Return ONLY valid JSON, no markdown code blocks or explanations.`,

		metadata: {
			version: "1.0",
			model: "gpt-4o",
			temperature: 0.8,
			maxTokens: 1000,
			updatedAt: "2026-02-23",
			author: "VantageStarter",
			notes: "Used for 'Continue to The Story' button in Step 1",
		},

		getPrompt: (context?: StoryGenerationContext) => {
			if (!context) {
				return STORY_GENERATION_PROMPT.system;
			}

			let contextDetails = `
Occasion: ${context.occasion}
Emotional Theme: ${context.theme}
Event Title: ${context.eventTitle}
Language: ${context.language}`;

			if (context.description) {
				contextDetails += `\nDescription: ${context.description}`;
			}
			if (context.date) {
				contextDetails += `\nDate: ${context.date}`;
			}
			if (context.location) {
				contextDetails += `\nLocation: ${context.location}`;
			}

			return `${STORY_GENERATION_PROMPT.system}

Event Details:
${contextDetails}

Personal Story from the creator:
"${context.personalStory}"

Create a compelling video story concept for this ${context.occasion}. The story should feel ${context.theme} and deeply personal. Return only valid JSON.`;
		},
	};
