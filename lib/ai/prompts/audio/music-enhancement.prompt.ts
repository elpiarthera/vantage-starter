export interface MusicPromptContext {
	userPrompt: string;
	occasion?: string;
	theme?: string;
	visualStyle?: string;
	totalDuration?: number; // seconds
}

export const MUSIC_ENHANCEMENT_PROMPT = {
	buildPrompt(context: MusicPromptContext): string {
		const pacingHint =
			context.totalDuration && context.totalDuration > 0
				? `Match the pacing to a ${context.totalDuration}s video. Keep structure coherent for this length.`
				: `Keep pacing coherent for a short-form invitation video.`;

		return [
			`You are enhancing a music generation prompt for fal-ai/stable-audio-25 (text-to-audio).`,
			`Return ONLY the improved prompt text. Do not include metadata or JSON.`,
			`User prompt: ${context.userPrompt}`,
			`Occasion: ${context.occasion || "not specified"}`,
			`Theme: ${context.theme || "not specified"}`,
			`Visual style: ${context.visualStyle || "not specified"}`,
			pacingHint,
			`Add instrumentation and mood guidance suited for the occasion and theme.`,
			`Avoid vocals unless explicitly requested. Suggest negative prompt elements like "low quality, distorted, vocals" when appropriate.`,
		].join("\n");
	},
};
