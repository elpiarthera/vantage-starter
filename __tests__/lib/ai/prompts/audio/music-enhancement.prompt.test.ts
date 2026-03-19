import { describe, expect, it } from "vitest";
import { MUSIC_ENHANCEMENT_PROMPT } from "@/lib/ai/prompts";

describe("MUSIC_ENHANCEMENT_PROMPT", () => {
	it("includes occasion, theme, visual style, and pacing hints", () => {
		const prompt = MUSIC_ENHANCEMENT_PROMPT.buildPrompt({
			userPrompt: "Soft piano with strings",
			occasion: "wedding",
			theme: "elegant",
			visualStyle: "cinematic",
			totalDuration: 30,
		});

		expect(prompt).toContain("wedding");
		expect(prompt).toContain("elegant");
		expect(prompt).toContain("cinematic");
		expect(prompt).toContain("30s"); // pacing hint
		expect(prompt.toLowerCase()).toContain("avoid vocals");
	});
});
