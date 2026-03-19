/**
 * Unit Tests: AI Director Prompt
 * Tests the modular chat prompt for AI Director conversations
 */

import { describe, expect, it } from "vitest";
import { AI_DIRECTOR_PROMPT } from "@/lib/ai/prompts";

describe("AI_DIRECTOR_PROMPT", () => {
	it("should have required properties", () => {
		expect(AI_DIRECTOR_PROMPT).toHaveProperty("system");
		expect(AI_DIRECTOR_PROMPT).toHaveProperty("getPrompt");
		expect(AI_DIRECTOR_PROMPT).toHaveProperty("metadata");
	});

	it("should return base system prompt when no context provided", () => {
		const prompt = AI_DIRECTOR_PROMPT.getPrompt();
		expect(prompt).toContain("AI Director for MyShortReel");
		expect(prompt).toContain("video invitations");
	});

	it("should inject project type context", () => {
		const prompt = AI_DIRECTOR_PROMPT.getPrompt({ projectType: "wedding" });
		expect(prompt).toContain("Current project type: wedding");
	});

	it("should inject scene count context", () => {
		const prompt = AI_DIRECTOR_PROMPT.getPrompt({ sceneCount: 5 });
		expect(prompt).toContain("Total scenes: 5");
	});

	it("should inject current step context", () => {
		const prompt = AI_DIRECTOR_PROMPT.getPrompt({ currentStep: 3 });
		expect(prompt).toContain("Current step: 3");
	});

	it("should inject all context fields", () => {
		const prompt = AI_DIRECTOR_PROMPT.getPrompt({
			projectType: "birthday",
			sceneCount: 4,
			currentStep: 2,
		});
		expect(prompt).toContain("Current project type: birthday");
		expect(prompt).toContain("Total scenes: 4");
		expect(prompt).toContain("Current step: 2");
	});

	it("should have valid metadata", () => {
		expect(AI_DIRECTOR_PROMPT.metadata.version).toBe("1.0");
		expect(AI_DIRECTOR_PROMPT.metadata.model).toBe("gpt-4o");
		expect(AI_DIRECTOR_PROMPT.metadata.temperature).toBe(0.7);
		expect(AI_DIRECTOR_PROMPT.metadata.maxTokens).toBe(500);
	});

	it("should contain key guidelines", () => {
		const prompt = AI_DIRECTOR_PROMPT.getPrompt();
		expect(prompt).toContain("concise and conversational");
		expect(prompt).toContain("visual storytelling");
		expect(prompt).toContain("mobile-friendly");
	});
});
