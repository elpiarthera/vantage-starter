export const MINIMAX_VOICES = {
	"Emma - Warm & Friendly": "Wise_Woman",
	"James - Professional & Clear": "Patient_Man",
	"Sofia - Elegant & Sophisticated": "Calm_Woman",
	"Marcus - Deep & Authoritative": "Deep_Voice_Man",
	"Luna - Soft & Romantic": "Calm_Woman",
	"Oliver - Energetic & Upbeat": "Casual_Guy",
	"Isabella - Calm & Soothing": "Lovely_Girl",
	"Noah - Confident & Strong": "Determined_Man",
} as const;

export const ALL_MINIMAX_VOICE_IDS = [
	"Wise_Woman",
	"Friendly_Person",
	"Inspirational_girl",
	"Deep_Voice_Man",
	"Calm_Woman",
	"Casual_Guy",
	"Lively_Girl",
	"Patient_Man",
	"Young_Knight",
	"Determined_Man",
	"Lovely_Girl",
	"Decent_Boy",
	"Imposing_Manner",
	"Elegant_Man",
	"Abbess",
	"Sweet_Girl_2",
	"Exuberant_Girl",
] as const;

export type VoiceId = (typeof ALL_MINIMAX_VOICE_IDS)[number];

/**
 * Maps user-facing language names to MiniMax Speech 2.6 HD API `language_boost` values.
 * API Reference: https://fal.ai/models/fal-ai/minimax/speech-2.6-hd/api
 *
 * All 37 supported languages from the API:
 * "Chinese", "Chinese,Yue", "English", "Arabic", "Russian", "Spanish", "French",
 * "Portuguese", "German", "Turkish", "Dutch", "Ukrainian", "Vietnamese", "Indonesian",
 * "Japanese", "Italian", "Korean", "Thai", "Polish", "Romanian", "Greek", "Czech",
 * "Finnish", "Hindi", "Bulgarian", "Danish", "Hebrew", "Malay", "Slovak", "Swedish",
 * "Croatian", "Hungarian", "Norwegian", "Slovenian", "Catalan", "Nynorsk", "Afrikaans", "auto"
 */
export const LANGUAGE_BOOST_MAP: Record<string, string> = {
	// Primary languages (most used)
	English: "English",
	Chinese: "Chinese",
	"Chinese (Cantonese)": "Chinese,Yue",
	Spanish: "Spanish",
	French: "French",
	Arabic: "Arabic",
	Russian: "Russian",
	Portuguese: "Portuguese",
	German: "German",
	Japanese: "Japanese",
	Korean: "Korean",
	Italian: "Italian",
	Hindi: "Hindi",
	// European languages
	Dutch: "Dutch",
	Polish: "Polish",
	Turkish: "Turkish",
	Ukrainian: "Ukrainian",
	Romanian: "Romanian",
	Greek: "Greek",
	Czech: "Czech",
	Finnish: "Finnish",
	Bulgarian: "Bulgarian",
	Danish: "Danish",
	Swedish: "Swedish",
	Norwegian: "Norwegian",
	Hungarian: "Hungarian",
	Slovak: "Slovak",
	Croatian: "Croatian",
	Slovenian: "Slovenian",
	Catalan: "Catalan",
	Nynorsk: "Nynorsk",
	// Asian languages
	Thai: "Thai",
	Vietnamese: "Vietnamese",
	Indonesian: "Indonesian",
	Malay: "Malay",
	// Middle Eastern
	Hebrew: "Hebrew",
	// African
	Afrikaans: "Afrikaans",
	// Auto-detect
	Auto: "auto",
};

export const THEME_EMOTION_MAP: Record<string, string> = {
	Romantic: "happy",
	"Joyful Celebration": "happy",
	"Elegant Sophistication": "neutral",
	"Nostalgic Memories": "sad",
	"Adventure & Fun": "happy",
	Professional: "neutral",
	Heartfelt: "happy",
};

export type Emotion =
	| "happy"
	| "sad"
	| "angry"
	| "fearful"
	| "disgusted"
	| "surprised"
	| "neutral";
