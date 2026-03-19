import { describe, expect, it } from "vitest";
import { NARRATION_SCRIPT_PROMPT } from "@/lib/ai/prompts";

describe("NARRATION_SCRIPT_PROMPT", () => {
	it("builds a prompt with language, pause markers guidance, and scene timing", () => {
		const prompt = NARRATION_SCRIPT_PROMPT.buildPrompt({
			occasion: "wedding",
			theme: "romantic",
			emotionalStory: "A love story under the stars",
			language: "French",
			scenes: [
				{
					number: 1,
					title: "Opening",
					description: "Welcome guests warmly",
					duration: 10,
				},
				{
					number: 2,
					title: "Details",
					description: "Share date and location",
					duration: 10,
				},
			],
			totalDuration: 20,
			userMessage: "Make it heartfelt",
			conversationHistory: [{ role: "user", content: "Be warm" }],
		});

		expect(prompt).toContain("French"); // language hint
		expect(prompt).toContain("<#1.0#>"); // pause marker guidance
		expect(prompt).toContain("Scene 1: Opening");
		expect(prompt).toContain("10 seconds");
		expect(prompt).toContain("romantic"); // theme reflected
	});
});
