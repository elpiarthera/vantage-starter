import { describe, expect, it } from "vitest";
import {
	ALL_MINIMAX_VOICE_IDS,
	LANGUAGE_BOOST_MAP,
	MINIMAX_VOICES,
	THEME_EMOTION_MAP,
} from "@/lib/constants/audio";

describe("audio constants", () => {
	it("maps UI voice labels to MiniMax voice IDs", () => {
		expect(MINIMAX_VOICES["Emma - Warm & Friendly"]).toBe("Wise_Woman");
		expect(MINIMAX_VOICES["Marcus - Deep & Authoritative"]).toBe(
			"Deep_Voice_Man",
		);
	});

	it("lists supported MiniMax voice IDs", () => {
		expect(ALL_MINIMAX_VOICE_IDS).toContain("Wise_Woman");
		expect(ALL_MINIMAX_VOICE_IDS).toContain("Deep_Voice_Man");
	});

	it("maps Step 1 languages to language_boost", () => {
		expect(LANGUAGE_BOOST_MAP.English).toBe("English");
		expect(LANGUAGE_BOOST_MAP.Spanish).toBe("Spanish");
	});

	it("maps themes to default emotions", () => {
		expect(THEME_EMOTION_MAP.Romantic).toBe("happy");
		expect(THEME_EMOTION_MAP.Professional).toBe("neutral");
	});
});
