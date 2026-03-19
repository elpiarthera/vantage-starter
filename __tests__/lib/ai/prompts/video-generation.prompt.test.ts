/**
 * Unit tests for Video Generation Prompt Builder
 *
 * Tests that the prompt builder correctly incorporates all context:
 * - Scene description
 * - Visual style from Step 2b
 * - Occasion from Step 1
 * - Theme from Step 1
 * - Emotional story from Step 1
 * - Cinematic styles
 * - Duration-appropriate pacing
 */

import { describe, expect, it } from "vitest";
import {
	VIDEO_GENERATION_PROMPT,
	type VideoGenerationContext,
} from "@/lib/ai/prompts/video/generation.prompt";

describe("VIDEO_GENERATION_PROMPT", () => {
	describe("buildPrompt", () => {
		it("should include scene description as base", () => {
			const context: VideoGenerationContext = {
				sceneDescription: "A romantic sunset at the beach",
			};

			const prompt = VIDEO_GENERATION_PROMPT.buildPrompt(context);

			expect(prompt).toContain("A romantic sunset at the beach");
		});

		it("should include visual style from Step 2b", () => {
			const context: VideoGenerationContext = {
				sceneDescription: "A scene at the park",
				visualStyle: "cinematic",
			};

			const prompt = VIDEO_GENERATION_PROMPT.buildPrompt(context);

			expect(prompt).toContain("Visual style: cinematic");
		});

		it("should include occasion from Step 1", () => {
			const context: VideoGenerationContext = {
				sceneDescription: "A celebration scene",
				occasion: "wedding",
			};

			const prompt = VIDEO_GENERATION_PROMPT.buildPrompt(context);

			expect(prompt).toContain("for a wedding video");
		});

		it("should include theme from Step 1", () => {
			const context: VideoGenerationContext = {
				sceneDescription: "A party scene",
				theme: "romantic",
			};

			const prompt = VIDEO_GENERATION_PROMPT.buildPrompt(context);

			expect(prompt).toContain("mood is romantic");
		});

		it("should include emotional story from Step 1", () => {
			const context: VideoGenerationContext = {
				sceneDescription: "A couple walking",
				emotionalStory: "A love story that began under the stars",
			};

			const prompt = VIDEO_GENERATION_PROMPT.buildPrompt(context);

			expect(prompt).toContain("Emotional context:");
			expect(prompt).toContain("A love story that began under the stars");
		});

		it("should include cinematic styles", () => {
			const context: VideoGenerationContext = {
				sceneDescription: "A dance scene",
				cinematicStyles: ["warm lighting", "slow motion", "golden hour"],
			};

			const prompt = VIDEO_GENERATION_PROMPT.buildPrompt(context);

			expect(prompt).toContain("warm lighting");
			expect(prompt).toContain("slow motion");
			expect(prompt).toContain("golden hour");
		});

		it("should filter out empty cinematic styles", () => {
			const context: VideoGenerationContext = {
				sceneDescription: "A scene",
				cinematicStyles: ["warm", "", "cool", ""],
			};

			const prompt = VIDEO_GENERATION_PROMPT.buildPrompt(context);

			expect(prompt).toContain("warm");
			expect(prompt).toContain("cool");
			// Should not have empty strings or double spaces
			expect(prompt).not.toContain("  ");
		});

		it("should add quick pacing for 5-second duration", () => {
			const context: VideoGenerationContext = {
				sceneDescription: "A quick scene",
				duration: 5,
			};

			const prompt = VIDEO_GENERATION_PROMPT.buildPrompt(context);

			expect(prompt).toContain("Quick, dynamic pacing");
			expect(prompt).toContain("5-second clip");
		});

		it("should add smooth pacing for 10-second duration", () => {
			const context: VideoGenerationContext = {
				sceneDescription: "A longer scene",
				duration: 10,
			};

			const prompt = VIDEO_GENERATION_PROMPT.buildPrompt(context);

			expect(prompt).toContain("Smooth, deliberate pacing");
			expect(prompt).toContain("10-second clip");
		});

		it("should add transition text for transition frame type", () => {
			const context: VideoGenerationContext = {
				sceneDescription: "Scene transition",
				frameType: "transition",
			};

			const prompt = VIDEO_GENERATION_PROMPT.buildPrompt(context);

			expect(prompt).toContain("Smooth transition");
			expect(prompt).toContain("subtle camera movement");
		});

		it("should NOT add transition text for static frame type", () => {
			const context: VideoGenerationContext = {
				sceneDescription: "Static scene",
				frameType: "static",
			};

			const prompt = VIDEO_GENERATION_PROMPT.buildPrompt(context);

			expect(prompt).not.toContain("Smooth transition");
		});

		it("should always include quality enhancers", () => {
			const context: VideoGenerationContext = {
				sceneDescription: "Any scene",
			};

			const prompt = VIDEO_GENERATION_PROMPT.buildPrompt(context);

			expect(prompt).toContain("High quality");
			expect(prompt).toContain("professional production");
		});

		it("should work with minimal context (only sceneDescription)", () => {
			const context: VideoGenerationContext = {
				sceneDescription: "A simple scene",
			};

			const prompt = VIDEO_GENERATION_PROMPT.buildPrompt(context);

			// Should have scene description
			expect(prompt).toContain("A simple scene");
			// Should have quality enhancers
			expect(prompt).toContain("High quality");
			// Should have default 5-second pacing
			expect(prompt).toContain("5-second clip");
		});

		it("should build complete prompt with all context", () => {
			const context: VideoGenerationContext = {
				sceneDescription: "A romantic scene at the Eiffel Tower",
				cinematicStyles: ["warm lighting", "slow pan"],
				frameType: "transition",
				duration: 10,
				visualStyle: "cinematic",
				occasion: "wedding",
				theme: "romantic",
				emotionalStory: "A love story that began under the stars",
			};

			const prompt = VIDEO_GENERATION_PROMPT.buildPrompt(context);

			// All elements should be present
			expect(prompt).toContain("A romantic scene at the Eiffel Tower");
			expect(prompt).toContain("Emotional context:");
			expect(prompt).toContain("A love story that began under the stars");
			expect(prompt).toContain("for a wedding video");
			expect(prompt).toContain("mood is romantic");
			expect(prompt).toContain("Visual style: cinematic");
			expect(prompt).toContain("Smooth transition");
			expect(prompt).toContain("warm lighting");
			expect(prompt).toContain("slow pan");
			expect(prompt).toContain("10-second clip");
			expect(prompt).toContain("High quality");
		});
	});

	describe("metadata", () => {
		it("should have version 2.0", () => {
			expect(VIDEO_GENERATION_PROMPT.metadata.version).toBe("2.0");
		});

		it("should reference Kling Video model", () => {
			expect(VIDEO_GENERATION_PROMPT.metadata.model).toContain("kling-video");
		});

		it("should be updated for Dec 2025", () => {
			expect(VIDEO_GENERATION_PROMPT.metadata.updatedAt).toBe("2025-12-01");
		});
	});
});
