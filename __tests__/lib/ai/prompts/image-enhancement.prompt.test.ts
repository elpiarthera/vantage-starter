/**
 * Unit Tests: Image Enhancement Prompt
 * Tests the modular image prompt enhancement system
 */

import { describe, expect, it } from "vitest";
import { IMAGE_ENHANCEMENT_PROMPT } from "@/lib/ai/prompts";

describe("IMAGE_ENHANCEMENT_PROMPT", () => {
	it("should have required properties", () => {
		expect(IMAGE_ENHANCEMENT_PROMPT).toHaveProperty("system");
		expect(IMAGE_ENHANCEMENT_PROMPT).toHaveProperty("buildUserPrompt");
		expect(IMAGE_ENHANCEMENT_PROMPT).toHaveProperty("buildFallbackPrompt");
		expect(IMAGE_ENHANCEMENT_PROMPT).toHaveProperty("metadata");
	});

	it("should build user prompt with base description", () => {
		const basePrompt = "A cozy coffee shop";
		const userPrompt = IMAGE_ENHANCEMENT_PROMPT.buildUserPrompt(basePrompt);
		expect(userPrompt).toContain("Enhance this prompt");
		expect(userPrompt).toContain(basePrompt);
	});

	it("should build fallback prompt with quality enhancers", () => {
		const basePrompt = "A sunny beach scene";
		const fallback = IMAGE_ENHANCEMENT_PROMPT.buildFallbackPrompt(basePrompt);
		expect(fallback).toContain(basePrompt);
		expect(fallback).toContain("high quality");
		expect(fallback).toContain("cinematic");
		expect(fallback).toContain("professional");
		expect(fallback).toContain("4K");
		expect(fallback).toContain("detailed");
	});

	it("should have valid metadata with multiple models", () => {
		expect(IMAGE_ENHANCEMENT_PROMPT.metadata.version).toBe("1.0");
		expect(Array.isArray(IMAGE_ENHANCEMENT_PROMPT.metadata.model)).toBe(true);
		expect(IMAGE_ENHANCEMENT_PROMPT.metadata.model).toContain("gpt-4o-mini");
		expect(IMAGE_ENHANCEMENT_PROMPT.metadata.model).toContain(
			"Meta-Llama-3.1-8B-Instruct-Turbo",
		);
		expect(IMAGE_ENHANCEMENT_PROMPT.metadata.temperature).toBe(0.8);
		expect(IMAGE_ENHANCEMENT_PROMPT.metadata.maxTokens).toBe(300);
	});

	it("should contain expert guidance in system prompt", () => {
		expect(IMAGE_ENHANCEMENT_PROMPT.system).toContain("expert");
		expect(IMAGE_ENHANCEMENT_PROMPT.system).toContain("detailed");
		expect(IMAGE_ENHANCEMENT_PROMPT.system).toContain("lighting");
		expect(IMAGE_ENHANCEMENT_PROMPT.system).toContain("composition");
		expect(IMAGE_ENHANCEMENT_PROMPT.system).toContain("mood");
	});
});
