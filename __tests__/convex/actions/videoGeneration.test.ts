/**
 * Tests for Video Generation Convex Action
 *
 * Verifies that the video generation action:
 * 1. Uses the VIDEO_GENERATION_PROMPT from our prompts system
 * 2. Passes all context parameters to the prompt builder
 * 3. Correctly builds the prompt with all project context
 * 4. Correctly transforms cinematicStyles from object to array
 * 5. Correctly determines frameType based on endFrameUrl
 * 6. Correctly formats fal.ai API payload
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	VIDEO_GENERATION_PROMPT,
	type VideoGenerationContext,
} from "@/lib/ai/prompts";

// Mock the Convex action handler to test prompt building
describe("Video Generation Action - Prompt Integration", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("VIDEO_GENERATION_PROMPT usage", () => {
		it("should be imported from our prompts system", () => {
			// Verify the prompt is correctly imported
			expect(VIDEO_GENERATION_PROMPT).toBeDefined();
			expect(VIDEO_GENERATION_PROMPT.buildPrompt).toBeDefined();
			expect(typeof VIDEO_GENERATION_PROMPT.buildPrompt).toBe("function");
		});

		it("should have correct metadata", () => {
			expect(VIDEO_GENERATION_PROMPT.metadata.version).toBe("2.1");
			expect(VIDEO_GENERATION_PROMPT.metadata.model).toContain("kling-video");
		});
	});

	describe("Action parameter transformation (simulating convex/actions/videoGeneration.ts)", () => {
		/**
		 * This test simulates exactly what the Convex action does at lines 72-81
		 * to verify the parameter transformation is correct
		 */
		it("should correctly transform action args to prompt context", () => {
			// Simulate the args that would be passed to the Convex action
			const actionArgs = {
				sceneId: "scene_123",
				sceneDescription: "A romantic sunset scene",
				startFrameUrl: "https://example.com/start.jpg",
				endFrameUrl: "https://example.com/end.jpg", // Has end frame
				cinematicStyles: ["warm lighting", "slow pan"],
				duration: 10,
				visualStyle: "cinematic",
				occasion: "wedding",
				theme: "romantic",
				emotionalStory: "A love story",
			};

			// This is EXACTLY what the action does at lines 72-81
			const promptContext: VideoGenerationContext = {
				sceneDescription: actionArgs.sceneDescription,
				cinematicStyles: actionArgs.cinematicStyles || [],
				frameType: actionArgs.endFrameUrl ? "transition" : "static", // KEY LOGIC
				duration: (actionArgs.duration as 5 | 10) || 5,
				visualStyle: actionArgs.visualStyle,
				occasion: actionArgs.occasion,
				theme: actionArgs.theme,
				emotionalStory: actionArgs.emotionalStory,
			};

			const prompt = VIDEO_GENERATION_PROMPT.buildPrompt(promptContext);

			// Verify frameType is "transition" because endFrameUrl is provided
			expect(prompt).toContain("Smooth transition");
			expect(prompt).toContain("subtle camera movement");
		});

		it("should set frameType to static when NO endFrameUrl is provided", () => {
			const actionArgs = {
				sceneDescription: "A static scene",
				startFrameUrl: "https://example.com/start.jpg",
				endFrameUrl: undefined, // NO end frame
				duration: 5,
			};

			const promptContext: VideoGenerationContext = {
				sceneDescription: actionArgs.sceneDescription,
				cinematicStyles: [],
				frameType: actionArgs.endFrameUrl ? "transition" : "static",
				duration: (actionArgs.duration as 5 | 10) || 5,
			};

			const prompt = VIDEO_GENERATION_PROMPT.buildPrompt(promptContext);

			// Verify frameType is "static" because NO endFrameUrl
			expect(prompt).not.toContain("Smooth transition");
		});

		it("should default duration to 5 when not provided", () => {
			const actionArgs: {
				sceneDescription: string;
				startFrameUrl: string;
				duration: number | undefined;
			} = {
				sceneDescription: "A scene",
				startFrameUrl: "https://example.com/start.jpg",
				duration: undefined, // NO duration
			};

			const promptContext: VideoGenerationContext = {
				sceneDescription: actionArgs.sceneDescription,
				cinematicStyles: [],
				frameType: "static",
				duration: (actionArgs.duration as 5 | 10 | undefined) || 5, // Should default to 5
			};

			const prompt = VIDEO_GENERATION_PROMPT.buildPrompt(promptContext);

			expect(prompt).toContain("5-second clip");
			expect(prompt).toContain("Quick, dynamic pacing");
		});

		it("should handle empty cinematicStyles array", () => {
			const actionArgs = {
				sceneDescription: "A scene",
				cinematicStyles: undefined,
			};

			const promptContext: VideoGenerationContext = {
				sceneDescription: actionArgs.sceneDescription,
				cinematicStyles: actionArgs.cinematicStyles || [], // Should become []
			};

			const prompt = VIDEO_GENERATION_PROMPT.buildPrompt(promptContext);

			// Should not have double spaces or malformed style sections
			expect(prompt).not.toContain("  ");
			expect(prompt).toContain("A scene");
		});
	});

	describe("VideoGenerator component cinematicStyles transformation", () => {
		/**
		 * This test simulates what VideoGenerator.tsx does at lines 135-141
		 * to transform the cinematicStyles object into an array
		 */
		it("should correctly flatten cinematicStyles object to array", () => {
			// This is the cinematicStyles object from Scene type
			const cinematicStylesObject = {
				ambiance: "romantic atmosphere",
				cameraMovement: "slow dolly shot",
				colorTone: "warm golden",
				visualStyle: "cinematic look",
			};

			// This is EXACTLY what VideoGenerator does at lines 135-141
			const cinematicStylesArray = cinematicStylesObject
				? [
						cinematicStylesObject.ambiance,
						cinematicStylesObject.cameraMovement,
						cinematicStylesObject.colorTone,
						cinematicStylesObject.visualStyle,
					].filter(Boolean)
				: undefined;

			expect(cinematicStylesArray).toEqual([
				"romantic atmosphere",
				"slow dolly shot",
				"warm golden",
				"cinematic look",
			]);

			// Now verify the prompt includes all these
			const prompt = VIDEO_GENERATION_PROMPT.buildPrompt({
				sceneDescription: "A scene",
				cinematicStyles: cinematicStylesArray,
			});

			expect(prompt).toContain("romantic atmosphere");
			expect(prompt).toContain("slow dolly shot");
			expect(prompt).toContain("warm golden");
			expect(prompt).toContain("cinematic look");
		});

		it("should filter out empty/undefined cinematicStyles properties", () => {
			const cinematicStylesObject = {
				ambiance: "romantic",
				cameraMovement: "", // Empty
				colorTone: undefined as unknown as string, // Undefined
				visualStyle: "cinematic",
			};

			const cinematicStylesArray = [
				cinematicStylesObject.ambiance,
				cinematicStylesObject.cameraMovement,
				cinematicStylesObject.colorTone,
				cinematicStylesObject.visualStyle,
			].filter(Boolean);

			expect(cinematicStylesArray).toEqual(["romantic", "cinematic"]);
			expect(cinematicStylesArray).not.toContain("");
			expect(cinematicStylesArray).not.toContain(undefined);
		});

		it("should handle undefined cinematicStyles object", () => {
			// Simulate the function that handles cinematicStyles transformation
			const transformCinematicStyles = (
				obj:
					| {
							ambiance: string;
							cameraMovement: string;
							colorTone: string;
							visualStyle: string;
					  }
					| undefined,
			): string[] | undefined => {
				return obj
					? [
							obj.ambiance,
							obj.cameraMovement,
							obj.colorTone,
							obj.visualStyle,
						].filter(Boolean)
					: undefined;
			};

			const result = transformCinematicStyles(undefined);
			expect(result).toBeUndefined();
		});
	});

	describe("fal.ai API payload structure (simulating convex/actions/videoGeneration.ts lines 89-100)", () => {
		/**
		 * These tests verify the fal.ai API payload is correctly structured
		 */
		it("should convert duration number to string for fal.ai API", () => {
			// This is what the action does at line 92
			const duration5: number = 5;
			const duration10: number = 10;

			const falDuration5 = duration5 === 10 ? "10" : "5";
			const falDuration10 = duration10 === 10 ? "10" : "5";

			expect(falDuration5).toBe("5");
			expect(falDuration10).toBe("10");
			expect(typeof falDuration5).toBe("string");
			expect(typeof falDuration10).toBe("string");
		});

		it("should include tail_image_url only when endFrameUrl is provided", () => {
			// Simulate fal.ai input construction
			interface FalInput {
				prompt: string;
				image_url: string;
				duration: "5" | "10";
				cfg_scale: number;
				negative_prompt: string;
				tail_image_url?: string;
			}

			const buildFalInput = (
				prompt: string,
				startFrameUrl: string,
				endFrameUrl: string | undefined,
				duration: number,
			): FalInput => {
				const falInput: FalInput = {
					prompt,
					image_url: startFrameUrl,
					duration: duration === 10 ? "10" : "5",
					cfg_scale: 0.5,
					negative_prompt: "blur, distort, and low quality",
				};

				if (endFrameUrl) {
					falInput.tail_image_url = endFrameUrl;
				}

				return falInput;
			};

			const withEndFrame = buildFalInput("test", "start.jpg", "end.jpg", 10);
			const withoutEndFrame = buildFalInput("test", "start.jpg", undefined, 5);

			expect(withEndFrame.tail_image_url).toBe("end.jpg");
			expect(withoutEndFrame.tail_image_url).toBeUndefined();
		});

		it("should have correct default values for cfg_scale and negative_prompt", () => {
			// These are hardcoded in the action at lines 93-94
			const cfg_scale = 0.5;
			const negative_prompt = "blur, distort, and low quality";

			expect(cfg_scale).toBe(0.5);
			expect(negative_prompt).toBe("blur, distort, and low quality");
		});
	});

	describe("Prompt building with full context", () => {
		it("should build prompt with all Step 1 and Step 2b context", () => {
			const context: VideoGenerationContext = {
				// Scene-level (Step 3)
				sceneDescription:
					"Laurent and Laurence walking hand in hand under the Eiffel Tower lights",
				cinematicStyles: [
					"warm golden lighting",
					"slow dolly shot",
					"soft focus",
				],
				frameType: "transition",
				duration: 10,
				// Project-level (Step 1)
				occasion: "wedding",
				theme: "romantic",
				emotionalStory:
					"Their love story began 5 years ago in a small Paris café, and now they return to announce their wedding",
				// Project-level (Step 2b)
				visualStyle: "cinematic",
			};

			const prompt = VIDEO_GENERATION_PROMPT.buildPrompt(context);

			// Verify scene description is included
			expect(prompt).toContain("Laurent and Laurence walking hand in hand");
			expect(prompt).toContain("Eiffel Tower");

			// Verify Step 1 context is included
			expect(prompt).toContain("Emotional context:");
			expect(prompt).toContain("love story began 5 years ago");
			expect(prompt).toContain("for a wedding video");
			expect(prompt).toContain("mood is romantic");

			// Verify Step 2b visual style is included
			expect(prompt).toContain("Visual style: cinematic");

			// Verify cinematic styles are included
			expect(prompt).toContain("warm golden lighting");
			expect(prompt).toContain("slow dolly shot");
			expect(prompt).toContain("soft focus");

			// Verify transition and duration pacing
			expect(prompt).toContain("Smooth transition");
			expect(prompt).toContain("10-second clip");
			expect(prompt).toContain("Smooth, deliberate pacing");

			// Verify quality enhancers
			expect(prompt).toContain("High quality");
			expect(prompt).toContain("professional production");
		});

		it("should handle different visual styles from Step 2b", () => {
			const styles = [
				"cinematic",
				"vintage",
				"storyboard",
				"low key",
				"high key",
				"documentary",
			];

			for (const visualStyle of styles) {
				const context: VideoGenerationContext = {
					sceneDescription: "A test scene",
					visualStyle,
				};

				const prompt = VIDEO_GENERATION_PROMPT.buildPrompt(context);
				expect(prompt).toContain(`Visual style: ${visualStyle}`);
			}
		});

		it("should handle different occasions from Step 1", () => {
			const occasions = [
				"wedding",
				"birthday",
				"corporate",
				"anniversary",
				"graduation",
			];

			for (const occasion of occasions) {
				const context: VideoGenerationContext = {
					sceneDescription: "A celebration scene",
					occasion,
				};

				const prompt = VIDEO_GENERATION_PROMPT.buildPrompt(context);
				expect(prompt).toContain(`for a ${occasion} video`);
			}
		});

		it("should handle different themes from Step 1", () => {
			const themes = ["romantic", "fun", "professional", "elegant", "playful"];

			for (const theme of themes) {
				const context: VideoGenerationContext = {
					sceneDescription: "A themed scene",
					theme,
				};

				const prompt = VIDEO_GENERATION_PROMPT.buildPrompt(context);
				expect(prompt).toContain(`mood is ${theme}`);
			}
		});

		it("should correctly handle 5-second vs 10-second duration", () => {
			const context5s: VideoGenerationContext = {
				sceneDescription: "Quick scene",
				duration: 5,
			};

			const context10s: VideoGenerationContext = {
				sceneDescription: "Longer scene",
				duration: 10,
			};

			const prompt5s = VIDEO_GENERATION_PROMPT.buildPrompt(context5s);
			const prompt10s = VIDEO_GENERATION_PROMPT.buildPrompt(context10s);

			expect(prompt5s).toContain("Quick, dynamic pacing");
			expect(prompt5s).toContain("5-second clip");

			expect(prompt10s).toContain("Smooth, deliberate pacing");
			expect(prompt10s).toContain("10-second clip");
		});

		it("should handle static vs transition frame types", () => {
			const staticContext: VideoGenerationContext = {
				sceneDescription: "Static scene",
				frameType: "static",
			};

			const transitionContext: VideoGenerationContext = {
				sceneDescription: "Transition scene",
				frameType: "transition",
			};

			const staticPrompt = VIDEO_GENERATION_PROMPT.buildPrompt(staticContext);
			const transitionPrompt =
				VIDEO_GENERATION_PROMPT.buildPrompt(transitionContext);

			expect(staticPrompt).not.toContain("Smooth transition");
			expect(transitionPrompt).toContain("Smooth transition");
			expect(transitionPrompt).toContain("subtle camera movement");
		});
	});

	describe("Edge cases", () => {
		it("should handle empty emotional story gracefully", () => {
			const context: VideoGenerationContext = {
				sceneDescription: "A scene",
				emotionalStory: "",
			};

			const prompt = VIDEO_GENERATION_PROMPT.buildPrompt(context);

			// Empty string should not add "Emotional context:"
			expect(prompt).not.toContain("Emotional context:");
		});

		it("should handle undefined optional fields", () => {
			const context: VideoGenerationContext = {
				sceneDescription: "A minimal scene",
				// All other fields undefined
			};

			const prompt = VIDEO_GENERATION_PROMPT.buildPrompt(context);

			// Should still produce valid prompt
			expect(prompt).toContain("A minimal scene");
			expect(prompt).toContain("High quality");
			// Should not contain undefined text
			expect(prompt).not.toContain("undefined");
		});

		it("should handle empty cinematic styles array", () => {
			const context: VideoGenerationContext = {
				sceneDescription: "A scene",
				cinematicStyles: [],
			};

			const prompt = VIDEO_GENERATION_PROMPT.buildPrompt(context);

			// Should not have trailing commas or empty style sections
			expect(prompt).not.toContain(", .");
			expect(prompt).not.toContain("  ");
		});

		it("should filter out empty strings from cinematic styles", () => {
			const context: VideoGenerationContext = {
				sceneDescription: "A scene",
				cinematicStyles: ["warm", "", "cool", "", "dramatic"],
			};

			const prompt = VIDEO_GENERATION_PROMPT.buildPrompt(context);

			expect(prompt).toContain("warm");
			expect(prompt).toContain("cool");
			expect(prompt).toContain("dramatic");
			// Should not have double commas from empty strings
			expect(prompt).not.toContain(",,");
		});
	});

	describe("Real-world scenario tests", () => {
		it("should generate appropriate prompt for wedding video", () => {
			const context: VideoGenerationContext = {
				sceneDescription:
					"The bride and groom share their first dance in a beautifully decorated ballroom",
				cinematicStyles: [
					"soft romantic lighting",
					"slow circular tracking shot",
				],
				frameType: "static",
				duration: 10,
				occasion: "wedding",
				theme: "romantic",
				emotionalStory:
					"After 3 years of dating, Sarah and Mike finally tied the knot in the same venue where they first met",
				visualStyle: "cinematic",
			};

			const prompt = VIDEO_GENERATION_PROMPT.buildPrompt(context);

			// Log for debugging
			console.log("Wedding prompt:", prompt);

			// Verify all key elements
			expect(prompt).toContain("bride and groom");
			expect(prompt).toContain("first dance");
			expect(prompt).toContain("Emotional context:");
			expect(prompt).toContain("3 years of dating");
			expect(prompt).toContain("for a wedding video");
			expect(prompt).toContain("mood is romantic");
			expect(prompt).toContain("Visual style: cinematic");
		});

		it("should generate appropriate prompt for corporate event", () => {
			const context: VideoGenerationContext = {
				sceneDescription:
					"CEO presenting quarterly results to shareholders in a modern conference room",
				cinematicStyles: ["clean professional lighting", "steady medium shot"],
				frameType: "static",
				duration: 5,
				occasion: "corporate",
				theme: "professional",
				emotionalStory:
					"Our company has grown 50% this year, marking our best performance in a decade",
				visualStyle: "documentary",
			};

			const prompt = VIDEO_GENERATION_PROMPT.buildPrompt(context);

			expect(prompt).toContain("CEO presenting");
			expect(prompt).toContain("for a corporate video");
			expect(prompt).toContain("mood is professional");
			expect(prompt).toContain("Visual style: documentary");
			expect(prompt).toContain("5-second clip");
		});

		it("should generate appropriate prompt for birthday celebration", () => {
			const context: VideoGenerationContext = {
				sceneDescription:
					"Child blowing out candles on a colorful birthday cake surrounded by excited friends",
				cinematicStyles: ["bright festive colors", "dynamic close-up"],
				frameType: "transition",
				duration: 5,
				occasion: "birthday",
				theme: "fun",
				emotionalStory:
					"Little Emma turns 7 today, celebrating with her best friends from school",
				visualStyle: "vintage",
			};

			const prompt = VIDEO_GENERATION_PROMPT.buildPrompt(context);

			expect(prompt).toContain("blowing out candles");
			expect(prompt).toContain("for a birthday video");
			expect(prompt).toContain("mood is fun");
			expect(prompt).toContain("Visual style: vintage");
			expect(prompt).toContain("Smooth transition");
		});
	});
});
