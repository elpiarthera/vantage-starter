/**
 * Language Expansion Coefficients
 *
 * Different languages take different amounts of time to speak the same content.
 * These coefficients adjust word count targets to achieve consistent ~30s duration.
 *
 * Based on industry standards for speech duration:
 * - English: Baseline (1.0)
 * - Romance languages: ~15% more time (0.85)
 * - German/Russian: ~25% more time (0.75)
 */
export const LANGUAGE_COEFFICIENTS: Record<string, number> = {
	en: 1.0, // English - baseline (75 words for 30s)
	fr: 0.85, // French - more syllables per word
	es: 0.85, // Spanish - similar to French
	it: 0.85, // Italian - similar to French
	pt: 0.8, // Portuguese - nasal vowels slow speech
	de: 0.75, // German - long compound words
	ru: 0.65, // Russian - complex consonant clusters + slow speech rate
};

/**
 * Get the target word count for a given language and duration
 */
export function getTargetWordCount(
	languageCode: string,
	durationSeconds: number,
): number {
	const coefficient = LANGUAGE_COEFFICIENTS[languageCode] || 1.0;
	// Base rate: 150 words per minute = 2.5 words per second
	const baseWordsPerSecond = 2.5;
	return Math.round(durationSeconds * baseWordsPerSecond * coefficient);
}

export interface NarrationScriptContext {
	// Event basics
	occasion: string;
	theme: string;
	language: string;
	languageCode?: string; // ISO code: 'en', 'fr', 'de', etc.

	// Event details (from Step 1 - matches schema)
	eventTitle?: string;
	eventDate?: string;
	eventLocation?: string;
	emotionalStory?: string;

	// Story context (from Step 2)
	storyNarration?: string;
	emotionalArc?: string;

	// Scenes (from Step 3)
	scenes: Array<{
		number: number;
		title: string;
		description: string;
		duration: number; // seconds
		mood?: string;
	}>;
	totalDuration: number; // seconds

	// Chat context
	userMessage?: string;
	conversationHistory?: Array<{ role: string; content: string }>;
}

export const NARRATION_SCRIPT_PROMPT = {
	buildPrompt(context: NarrationScriptContext): string {
		// Get language coefficient (default to English if not specified)
		const langCode = context.languageCode || "en";
		const coefficient = LANGUAGE_COEFFICIENTS[langCode] || 1.0;

		// Calculate target word count for total duration
		const targetWords = getTargetWordCount(langCode, context.totalDuration);

		// Build rich event context section
		const eventContextLines = [
			context.eventTitle && `Event: ${context.eventTitle}`,
			context.eventDate && `Date: ${context.eventDate}`,
			context.eventLocation && `Location: ${context.eventLocation}`,
		]
			.filter(Boolean)
			.join("\n");

		// Build scene descriptions
		const sceneDescriptions = context.scenes
			.map((s) => {
				const wordsForScene = Math.max(
					5,
					Math.round((s.duration / 60) * 150 * coefficient),
				);
				return `Scene ${s.number} "${s.title}" (${s.duration}s, ~${wordsForScene} words): ${s.description}${s.mood ? ` [Mood: ${s.mood}]` : ""}`;
			})
			.join("\n");

		return `You are writing a voiceover narration for a video invitation.

**OUTPUT FORMAT RULES (CRITICAL - FOLLOW EXACTLY)**:
- Write ONLY the spoken words - nothing else
- Do NOT use markdown formatting (no asterisks, no bold, no italic, no headers)
- Do NOT use section headers like "Opening" or "Scene 1:"
- Do NOT include timing markers like "(10 seconds)" in the output
- Do NOT add any explanation, commentary, or meta-text
- Do NOT wrap text in quotation marks
- Do NOT include stage directions or instructions
- Use natural sentence flow with pauses marked as <#X.X#> where X.X is seconds

**PAUSE MARKERS (MiniMax TTS format)**:
- <#1.0#> = 1 second pause (use between major sections)
- <#0.5#> = half second pause (use between sentences)
- <#0.3#> = short breath pause (use for emphasis)

**LANGUAGE**: Write in ${context.language}
**OCCASION**: ${context.occasion}
**THEME**: ${context.theme}
**TOTAL DURATION**: ${context.totalDuration} seconds
**TARGET WORD COUNT**: ~${targetWords} words (adjusted for ${context.language})

**EVENT DETAILS**:
${eventContextLines || "Not provided - create warm, welcoming generic text"}

**EMOTIONAL CONTEXT / PERSONAL STORY**:
${context.emotionalStory || "Create a warm, heartfelt, and inviting tone"}

**STORY ARC**:
${context.emotionalArc || "Build from welcome → celebration details → emotional connection → call-to-action"}

**EXISTING STORY NARRATION** (use as inspiration):
${context.storyNarration || "Not provided"}

**SCENES TO NARRATE**:
${sceneDescriptions || "3 scenes of approximately 10 seconds each"}

**EXAMPLE OF CORRECT OUTPUT** (plain spoken text only):
Welcome to Sarah and Michael's wedding celebration! <#0.5#> Join us for a magical evening filled with love, laughter, and unforgettable memories. <#0.5#> Your presence would make our special day even more beautiful. <#0.3#> Saturday, June fifteenth, two thousand twenty-four, at four PM. <#0.5#> Sunset Gardens, one twenty-three Rose Avenue, Romantic City. <#0.5#> We can't wait to celebrate with you! <#0.3#> Please RSVP by May first. <#0.5#> Let's create beautiful memories together on our wedding day.

**EXAMPLE OF WRONG OUTPUT** (do NOT do this):
**Narration Script:** Here's your personalized wedding invitation narration.
**Opening Welcome** (10 seconds)
"Welcome to Sarah and Michael's Wedding Celebration!"
*This warm, conversational script creates an intimate connection...*

Now write the narration. Output ONLY the spoken words with pause markers:`;
	},
};
