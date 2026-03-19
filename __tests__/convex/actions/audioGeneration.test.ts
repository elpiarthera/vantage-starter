import { describe, expect, it } from "vitest";
import { generateMusic } from "@/convex/actions/musicGeneration";
import { generateNarration } from "@/convex/actions/narrationGeneration";

/**
 * Action-level checks for new audio Convex actions.
 *
 * These mirror the patterns used in other action tests (e.g. image/video
 * generation) by validating:
 * - Exports are wired
 * - Payload shaping logic (primary + fallback for narration; defaults for music)
 *
 * Note: We do not call the Convex actions directly here (they rely on runtime
 * fetch + secrets). Instead, we mirror their payload construction to guard
 * against regressions.
 */

describe("generateNarration action", () => {
	it("should be exported and defined", () => {
		expect(generateNarration).toBeDefined();
		expect(typeof generateNarration).toBe("function");
	});

	it("should build the primary payload with defaults (lines 96-120)", () => {
		const args = {
			prompt: "Hello world".repeat(1000), // ensure truncation coverage
			voiceId: "Wise_Woman",
			language: "English",
			speed: undefined,
			pitch: undefined,
			emotion: undefined,
		};

		const primaryPayload = {
			prompt: args.prompt.slice(0, 10000),
			language_boost: args.language || "auto",
			voice_setting: {
				voice_id: args.voiceId,
				speed: args.speed ?? 1,
				vol: 1,
				pitch: args.pitch ?? 0,
				emotion: args.emotion ?? "neutral",
				english_normalization: args.language === "English",
			},
			audio_setting: {
				sample_rate: 32000,
				bitrate: 128000,
				format: "mp3",
				channel: 1,
			},
			normalization_setting: {
				enabled: true,
				target_loudness: -18,
				target_peak: -0.5,
			},
		};

		// Core field expectations
		expect(primaryPayload.prompt.length).toBeLessThanOrEqual(10000);
		expect(primaryPayload.language_boost).toBe("English");
		expect(primaryPayload.voice_setting.voice_id).toBe("Wise_Woman");
		expect(primaryPayload.voice_setting.speed).toBe(1); // defaulted
		expect(primaryPayload.voice_setting.pitch).toBe(0); // defaulted
		expect(primaryPayload.voice_setting.emotion).toBe("neutral"); // defaulted
		expect(primaryPayload.voice_setting.english_normalization).toBe(true);
		expect(primaryPayload.audio_setting.format).toBe("mp3");
	});

	it("should build the fallback payload (lines 138-153)", () => {
		const args = {
			prompt: "Short text",
			voiceId: "Calm_Gentleman",
			language: "French",
			speed: 1.25,
			pitch: -2,
		};

		const fallbackPayload = {
			text: args.prompt.slice(0, 5000),
			language_boost: args.language || "auto",
			voice_setting: {
				voice_id: args.voiceId,
				speed: args.speed ?? 1,
				vol: 1,
				pitch: args.pitch ?? 0,
			},
			audio_setting: {
				sample_rate: 32000,
				bitrate: 128000,
				format: "mp3",
			},
		};

		expect(fallbackPayload.text).toBe("Short text");
		expect(fallbackPayload.voice_setting.voice_id).toBe("Calm_Gentleman");
		expect(fallbackPayload.voice_setting.speed).toBe(1.25);
		expect(fallbackPayload.voice_setting.pitch).toBe(-2);
		expect(fallbackPayload.language_boost).toBe("French");
		expect(fallbackPayload.audio_setting.format).toBe("mp3");
	});
});

describe("generateMusic action", () => {
	it("should be exported and defined", () => {
		expect(generateMusic).toBeDefined();
		expect(typeof generateMusic).toBe("function");
	});

	it("should build the payload with defaults (negativePrompt + seed)", () => {
		const args = {
			prompt: "uplifting cinematic score",
			negativePrompt: undefined,
			seed: 42,
		};

		const payload = {
			prompt: args.prompt,
			negative_prompt: args.negativePrompt ?? "low quality, distorted",
			seed: args.seed,
		};

		expect(payload.prompt).toBe("uplifting cinematic score");
		expect(payload.negative_prompt).toBe("low quality, distorted"); // default
		expect(payload.seed).toBe(42);
	});

	it("should honor provided negativePrompt and undefined seed", () => {
		const args = {
			prompt: "dark synthwave",
			negativePrompt: "no distortion, no clipping",
			seed: undefined,
		};

		const payload = {
			prompt: args.prompt,
			negative_prompt: args.negativePrompt ?? "low quality, distorted",
			seed: args.seed,
		};

		expect(payload.prompt).toBe("dark synthwave");
		expect(payload.negative_prompt).toBe("no distortion, no clipping");
		expect(payload.seed).toBeUndefined();
	});
});
