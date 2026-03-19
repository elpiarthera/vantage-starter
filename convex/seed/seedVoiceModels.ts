import { internalMutation } from "../_generated/server";

/**
 * Seed Voice Model Schemas + Credit Costs
 * Seeds 3 TTS models (MiniMax 2.8 HD, 2.8 Turbo, Qwen 3 TTS) with full configurations
 * Based on: docs/Analysis/voice-generator/TTS-MODELS-ANALYSIS.md (v1.2)
 * Pattern: mirrors seedImageModels.ts structure
 */

// MiniMax Voice IDs (shared by HD and Turbo)
const MINIMAX_VOICES = [
	{ value: "Wise_Woman", label: "voices.wise_woman" },
	{ value: "Friendly_Person", label: "voices.friendly_person" },
	{ value: "Inspirational_girl", label: "voices.inspirational_girl" },
	{ value: "Deep_Voice_Man", label: "voices.deep_voice_man" },
	{ value: "Calm_Woman", label: "voices.calm_woman" },
	{ value: "Casual_Guy", label: "voices.casual_guy" },
	{ value: "Lively_Girl", label: "voices.lively_girl" },
	{ value: "Patient_Man", label: "voices.patient_man" },
	{ value: "Young_Knight", label: "voices.young_knight" },
	{ value: "Determined_Man", label: "voices.determined_man" },
	{ value: "Lovely_Girl", label: "voices.lovely_girl" },
	{ value: "Decent_Boy", label: "voices.decent_boy" },
	{ value: "Imposing_Manner", label: "voices.imposing_manner" },
	{ value: "Elegant_Man", label: "voices.elegant_man" },
	{ value: "Abbess", label: "voices.abbess" },
	{ value: "Sweet_Girl_2", label: "voices.sweet_girl_2" },
	{ value: "Exuberant_Girl", label: "voices.exuberant_girl" },
];

// Qwen 3 TTS Voice IDs
const QWEN_VOICES = [
	{ value: "Vivian", label: "voices.qwen_vivian" },
	{ value: "Serena", label: "voices.qwen_serena" },
	{ value: "Uncle_Fu", label: "voices.qwen_uncle_fu" },
	{ value: "Dylan", label: "voices.qwen_dylan" },
	{ value: "Eric", label: "voices.qwen_eric" },
	{ value: "Ryan", label: "voices.qwen_ryan" },
	{ value: "Aiden", label: "voices.qwen_aiden" },
	{ value: "Ono_Anna", label: "voices.qwen_ono_anna" },
	{ value: "Sohee", label: "voices.qwen_sohee" },
];

export const seedVoiceModels = internalMutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();

		// ─── Idempotent: delete all existing voice model schemas and voice credit costs ───
		const existingSchemas = await ctx.db.query("voiceModelSchemas").collect();
		await Promise.all(existingSchemas.map((s) => ctx.db.delete(s._id)));

		const voiceCreditActionTypes = [
			"voice_generation_minimax_28_hd",
			"voice_generation_minimax_28_turbo",
			"voice_generation_qwen_3",
			"voice_recording",
		];
		const existingCosts = await ctx.db.query("creditCosts").collect();
		await Promise.all(
			existingCosts
				.filter((c) => voiceCreditActionTypes.includes(c.actionType))
				.map((c) => ctx.db.delete(c._id)),
		);

		// ============================================================
		// MODEL 1: MiniMax Speech 2.8 HD
		// ============================================================

		const minimaxHD = await ctx.db.insert("voiceModelSchemas", {
			// ─── Identifiers ───
			schemaId: "minimax-speech-28-hd",
			name: "MiniMax Speech 2.8 HD",
			nameTranslationKey: "voice_models.minimax_28_hd",

			// ─── FAL Config ───
			modelId: "fal-ai/minimax/speech-2.8-hd",
			type: "tts",

			// ─── Credit System ───
			creditActionType: "voice_generation_minimax_28_hd",

			// ─── UI Capabilities ───
			capabilities: {
				emotionControl: true,
				pitchControl: true,
				speedControl: true,
				volumeControl: true,
				voiceModification: true,
				multiLanguage: true,
				customPronunciation: true,
				interjections: true,
				pauseControl: true,
				loudnessNormalization: true,
				highQualityAudio: true,
				voiceCloning: false,
				streaming: false,
			},

			// ─── UI Badges ───
			badges: ["HD", "PRO", "MULTILINGUAL"],

			// ─── UI Parameters ───
			params: [
				// Primary text input
				{
					key: "prompt",
					control: "textarea",
					label: "voice_generator.prompt_label",
					maxLength: 10000,
					default: "",
				},
				// Voice selection
				{
					key: "voice_setting.voice_id",
					control: "select",
					label: "voice_generator.voice_id_label",
					options: MINIMAX_VOICES,
					default: "Wise_Woman",
				},
				// Speed control
				{
					key: "voice_setting.speed",
					control: "slider",
					label: "voice_generator.settings.speed_label",
					hint: "voice_generator.settings.speed_hint",
					unit: "x",
					min: 0.5,
					max: 2.0,
					step: 0.1,
					default: 1.0,
					advanced: false,
				},
				// Pitch control
				{
					key: "voice_setting.pitch",
					control: "slider",
					label: "voice_generator.settings.pitch_label",
					hint: "voice_generator.settings.pitch_hint",
					unit: "semitones",
					min: -12,
					max: 12,
					step: 1,
					default: 0,
					advanced: false,
				},
				// Emotion control
				{
					key: "voice_setting.emotion",
					control: "select",
					label: "voice_generator.settings.emotion_label",
					hint: "voice_generator.settings.emotion_hint",
					options: [
						{
							value: "neutral",
							label: "voice_generator.settings.emotion_neutral",
						},
						{ value: "happy", label: "voice_generator.settings.emotion_happy" },
						{ value: "sad", label: "voice_generator.settings.emotion_sad" },
						{ value: "angry", label: "voice_generator.settings.emotion_angry" },
						{
							value: "fearful",
							label: "voice_generator.settings.emotion_fearful",
						},
						{
							value: "disgusted",
							label: "voice_generator.settings.emotion_disgusted",
						},
						{
							value: "surprised",
							label: "voice_generator.settings.emotion_surprised",
						},
					],
					default: "neutral",
					advanced: false,
				},
				// Volume control
				{
					key: "voice_setting.vol",
					control: "slider",
					label: "voice_generator.settings.volume_label",
					hint: "voice_generator.settings.volume_hint",
					min: 0.01,
					max: 10,
					step: 0.1,
					default: 1.0,
					unit: "x",
					advanced: false,
				},
				// English Normalization
				{
					key: "voice_setting.english_normalization",
					control: "toggle",
					label: "voice_generator.settings.english_normalization_label",
					hint: "voice_generator.settings.english_normalization_hint",
					default: false,
					advanced: true,
				},
				// Language Boost
				{
					key: "language_boost",
					control: "select",
					label: "voice_generator.settings.language_boost_label",
					hint: "voice_generator.settings.language_boost_hint",
					default: "auto",
					advanced: true,
					options: [
						{ value: "auto", label: "voice_generator.languages.auto" },
						{ value: "English", label: "voice_generator.languages.english" },
						{ value: "Chinese", label: "voice_generator.languages.chinese" },
						{ value: "Spanish", label: "voice_generator.languages.spanish" },
						{ value: "French", label: "voice_generator.languages.french" },
						{ value: "German", label: "voice_generator.languages.german" },
						{ value: "Japanese", label: "voice_generator.languages.japanese" },
						{ value: "Korean", label: "voice_generator.languages.korean" },
						{
							value: "Portuguese",
							label: "voice_generator.languages.portuguese",
						},
						{ value: "Italian", label: "voice_generator.languages.italian" },
						{ value: "Russian", label: "voice_generator.languages.russian" },
					],
				},
				// Audio Format
				{
					key: "audio_setting.format",
					control: "select",
					label: "voice_generator.settings.audio_format_label",
					default: "mp3",
					advanced: true,
					options: [
						{ value: "mp3", label: "MP3" },
						{ value: "pcm", label: "PCM" },
						{ value: "flac", label: "FLAC" },
					],
				},
				// Sample Rate
				{
					key: "audio_setting.sample_rate",
					control: "select",
					label: "voice_generator.settings.sample_rate_label",
					default: 32000,
					advanced: true,
					options: [
						{ value: 8000, label: "8 kHz" },
						{ value: 16000, label: "16 kHz" },
						{ value: 22050, label: "22.05 kHz" },
						{ value: 24000, label: "24 kHz" },
						{ value: 32000, label: "32 kHz (Default)" },
						{ value: 44100, label: "44.1 kHz (HD)" },
					],
				},
				// Channels
				{
					key: "audio_setting.channel",
					control: "select",
					label: "voice_generator.settings.channels_label",
					default: 1,
					advanced: true,
					options: [
						{ value: 1, label: "Mono" },
						{ value: 2, label: "Stereo" },
					],
				},
				// Bitrate
				{
					key: "audio_setting.bitrate",
					control: "select",
					label: "voice_generator.settings.bitrate_label",
					default: 128000,
					advanced: true,
					options: [
						{ value: 32000, label: "32 kbps" },
						{ value: 64000, label: "64 kbps" },
						{ value: 128000, label: "128 kbps (Default)" },
						{ value: 256000, label: "256 kbps (High Quality)" },
					],
				},
				// Voice Modify — Pitch
				{
					key: "voice_modify.pitch",
					control: "slider",
					label: "voice_generator.settings.voice_modify_pitch_label",
					hint: "voice_generator.settings.voice_modify_pitch_hint",
					min: -100,
					max: 100,
					step: 1,
					default: 0,
					advanced: true,
				},
				// Voice Modify — Intensity
				{
					key: "voice_modify.intensity",
					control: "slider",
					label: "voice_generator.settings.voice_modify_intensity_label",
					hint: "voice_generator.settings.voice_modify_intensity_hint",
					min: -100,
					max: 100,
					step: 1,
					default: 0,
					advanced: true,
				},
				// Voice Modify — Timbre
				{
					key: "voice_modify.timbre",
					control: "slider",
					label: "voice_generator.settings.voice_modify_timbre_label",
					hint: "voice_generator.settings.voice_modify_timbre_hint",
					min: -100,
					max: 100,
					step: 1,
					default: 0,
					advanced: true,
				},
				// Loudness Normalization Enable
				{
					key: "normalization_setting.enabled",
					control: "toggle",
					label: "voice_generator.settings.normalization_enabled_label",
					hint: "voice_generator.settings.normalization_enabled_hint",
					default: true,
					advanced: true,
				},
				// Target Loudness (conditional — shown only when normalization enabled)
				{
					key: "normalization_setting.target_loudness",
					control: "slider",
					label: "voice_generator.settings.target_loudness_label",
					hint: "voice_generator.settings.target_loudness_hint",
					min: -70,
					max: -10,
					step: 1,
					default: -18,
					unit: "LUFS",
					advanced: true,
					showWhen: { param: "normalization_setting.enabled", value: true },
				},
			],

			// ─── Backend Config ───
			allowedParams: [
				"prompt",
				"voice_setting",
				"audio_setting",
				"language_boost",
				"output_format",
				"voice_modify",
				"normalization_setting",
			],
			maxPromptLength: 10000,

			// ─── Conditional Params ───
			conditionalParams: [
				{
					param: "normalization_setting.target_loudness",
					showWhen: { param: "normalization_setting.enabled", value: true },
				},
			],

			// ─── Metadata ───
			sortOrder: 1,
			isActive: true,
			createdAt: now,
			updatedAt: now,
		});

		// ============================================================
		// MODEL 2: MiniMax Speech 2.8 Turbo
		// ============================================================

		const minimaxTurbo = await ctx.db.insert("voiceModelSchemas", {
			// ─── Identifiers ───
			schemaId: "minimax-speech-28-turbo",
			name: "MiniMax Speech 2.8 Turbo",
			nameTranslationKey: "voice_models.minimax_28_turbo",

			// ─── FAL Config ───
			modelId: "fal-ai/minimax/speech-2.8-turbo",
			type: "tts",

			// ─── Credit System ───
			creditActionType: "voice_generation_minimax_28_turbo",

			// ─── UI Capabilities ───
			capabilities: {
				emotionControl: true,
				pitchControl: true,
				speedControl: true,
				volumeControl: true,
				voiceModification: true,
				multiLanguage: true,
				customPronunciation: true,
				interjections: true,
				pauseControl: true,
				loudnessNormalization: true,
				highQualityAudio: true,
				voiceCloning: false,
				streaming: false,
			},

			// ─── UI Badges ───
			badges: ["TURBO", "FAST", "COST-EFFECTIVE"],

			// ─── UI Parameters (same as HD) ───
			params: [
				{
					key: "prompt",
					control: "textarea",
					label: "voice_generator.prompt_label",
					maxLength: 10000,
					default: "",
				},
				{
					key: "voice_setting.voice_id",
					control: "select",
					label: "voice_generator.voice_id_label",
					options: MINIMAX_VOICES,
					default: "Wise_Woman",
				},
				{
					key: "voice_setting.speed",
					control: "slider",
					label: "voice_generator.settings.speed_label",
					hint: "voice_generator.settings.speed_hint",
					unit: "x",
					min: 0.5,
					max: 2.0,
					step: 0.1,
					default: 1.0,
					advanced: false,
				},
				{
					key: "voice_setting.pitch",
					control: "slider",
					label: "voice_generator.settings.pitch_label",
					hint: "voice_generator.settings.pitch_hint",
					unit: "semitones",
					min: -12,
					max: 12,
					step: 1,
					default: 0,
					advanced: false,
				},
				{
					key: "voice_setting.emotion",
					control: "select",
					label: "voice_generator.settings.emotion_label",
					hint: "voice_generator.settings.emotion_hint",
					options: [
						{
							value: "neutral",
							label: "voice_generator.settings.emotion_neutral",
						},
						{ value: "happy", label: "voice_generator.settings.emotion_happy" },
						{ value: "sad", label: "voice_generator.settings.emotion_sad" },
						{ value: "angry", label: "voice_generator.settings.emotion_angry" },
						{
							value: "fearful",
							label: "voice_generator.settings.emotion_fearful",
						},
						{
							value: "disgusted",
							label: "voice_generator.settings.emotion_disgusted",
						},
						{
							value: "surprised",
							label: "voice_generator.settings.emotion_surprised",
						},
					],
					default: "neutral",
					advanced: false,
				},
				// Volume control
				{
					key: "voice_setting.vol",
					control: "slider",
					label: "voice_generator.settings.volume_label",
					hint: "voice_generator.settings.volume_hint",
					min: 0.01,
					max: 10,
					step: 0.1,
					default: 1.0,
					unit: "x",
					advanced: false,
				},
				// English Normalization
				{
					key: "voice_setting.english_normalization",
					control: "toggle",
					label: "voice_generator.settings.english_normalization_label",
					hint: "voice_generator.settings.english_normalization_hint",
					default: false,
					advanced: true,
				},
				// Language Boost
				{
					key: "language_boost",
					control: "select",
					label: "voice_generator.settings.language_boost_label",
					hint: "voice_generator.settings.language_boost_hint",
					default: "auto",
					advanced: true,
					options: [
						{ value: "auto", label: "voice_generator.languages.auto" },
						{ value: "English", label: "voice_generator.languages.english" },
						{ value: "Chinese", label: "voice_generator.languages.chinese" },
						{ value: "Spanish", label: "voice_generator.languages.spanish" },
						{ value: "French", label: "voice_generator.languages.french" },
						{ value: "German", label: "voice_generator.languages.german" },
						{ value: "Japanese", label: "voice_generator.languages.japanese" },
						{ value: "Korean", label: "voice_generator.languages.korean" },
						{
							value: "Portuguese",
							label: "voice_generator.languages.portuguese",
						},
						{ value: "Italian", label: "voice_generator.languages.italian" },
						{ value: "Russian", label: "voice_generator.languages.russian" },
					],
				},
				// Audio Format
				{
					key: "audio_setting.format",
					control: "select",
					label: "voice_generator.settings.audio_format_label",
					default: "mp3",
					advanced: true,
					options: [
						{ value: "mp3", label: "MP3" },
						{ value: "pcm", label: "PCM" },
						{ value: "flac", label: "FLAC" },
					],
				},
				// Sample Rate
				{
					key: "audio_setting.sample_rate",
					control: "select",
					label: "voice_generator.settings.sample_rate_label",
					default: 32000,
					advanced: true,
					options: [
						{ value: 8000, label: "8 kHz" },
						{ value: 16000, label: "16 kHz" },
						{ value: 22050, label: "22.05 kHz" },
						{ value: 24000, label: "24 kHz" },
						{ value: 32000, label: "32 kHz (Default)" },
						{ value: 44100, label: "44.1 kHz (HD)" },
					],
				},
				// Channels
				{
					key: "audio_setting.channel",
					control: "select",
					label: "voice_generator.settings.channels_label",
					default: 1,
					advanced: true,
					options: [
						{ value: 1, label: "Mono" },
						{ value: 2, label: "Stereo" },
					],
				},
				// Bitrate
				{
					key: "audio_setting.bitrate",
					control: "select",
					label: "voice_generator.settings.bitrate_label",
					default: 128000,
					advanced: true,
					options: [
						{ value: 32000, label: "32 kbps" },
						{ value: 64000, label: "64 kbps" },
						{ value: 128000, label: "128 kbps (Default)" },
						{ value: 256000, label: "256 kbps (High Quality)" },
					],
				},
				// Voice Modify — Pitch
				{
					key: "voice_modify.pitch",
					control: "slider",
					label: "voice_generator.settings.voice_modify_pitch_label",
					hint: "voice_generator.settings.voice_modify_pitch_hint",
					min: -100,
					max: 100,
					step: 1,
					default: 0,
					advanced: true,
				},
				// Voice Modify — Intensity
				{
					key: "voice_modify.intensity",
					control: "slider",
					label: "voice_generator.settings.voice_modify_intensity_label",
					hint: "voice_generator.settings.voice_modify_intensity_hint",
					min: -100,
					max: 100,
					step: 1,
					default: 0,
					advanced: true,
				},
				// Voice Modify — Timbre
				{
					key: "voice_modify.timbre",
					control: "slider",
					label: "voice_generator.settings.voice_modify_timbre_label",
					hint: "voice_generator.settings.voice_modify_timbre_hint",
					min: -100,
					max: 100,
					step: 1,
					default: 0,
					advanced: true,
				},
				// Loudness Normalization Enable
				{
					key: "normalization_setting.enabled",
					control: "toggle",
					label: "voice_generator.settings.normalization_enabled_label",
					hint: "voice_generator.settings.normalization_enabled_hint",
					default: true,
					advanced: true,
				},
				// Target Loudness (conditional — shown only when normalization enabled)
				{
					key: "normalization_setting.target_loudness",
					control: "slider",
					label: "voice_generator.settings.target_loudness_label",
					hint: "voice_generator.settings.target_loudness_hint",
					min: -70,
					max: -10,
					step: 1,
					default: -18,
					unit: "LUFS",
					advanced: true,
					showWhen: { param: "normalization_setting.enabled", value: true },
				},
			],

			// ─── Backend Config ───
			allowedParams: [
				"prompt",
				"voice_setting",
				"audio_setting",
				"language_boost",
				"output_format",
				"voice_modify",
				"normalization_setting",
			],
			maxPromptLength: 10000,

			// ─── Conditional Params ───
			conditionalParams: [
				{
					param: "normalization_setting.target_loudness",
					showWhen: { param: "normalization_setting.enabled", value: true },
				},
			],

			// ─── Metadata ───
			sortOrder: 2,
			isActive: true,
			createdAt: now,
			updatedAt: now,
		});

		// ============================================================
		// MODEL 3: Qwen 3 TTS 1.7B
		// ============================================================

		const qwen3TTS = await ctx.db.insert("voiceModelSchemas", {
			// ─── Identifiers ───
			schemaId: "qwen-3-tts-17b",
			name: "Qwen 3 TTS",
			nameTranslationKey: "voice_models.qwen_3_tts",

			// ─── FAL Config ───
			modelId: "fal-ai/qwen-3-tts/text-to-speech/1.7b",
			type: "tts",

			// ─── Credit System ───
			creditActionType: "voice_generation_qwen_3",

			// ─── UI Capabilities ───
			capabilities: {
				voiceCloning: true,
				stylePrompts: true,
				advancedSampling: true,
				subTalkerControl: true,
				multiLanguage: true,
				emotionControl: false,
				pitchControl: false,
				speedControl: false,
				volumeControl: false,
				voiceModification: false,
				highQualityAudio: false,
				streaming: false,
			},

			// ─── UI Badges ───
			badges: ["VOICE CLONING", "CUSTOM VOICE"],

			// ─── UI Parameters ───
			params: [
				// Primary text input
				{
					key: "text",
					control: "textarea",
					label: "voice_generator.prompt_label",
					maxLength: 8000,
					default: "",
				},
				// Voice selection
				{
					key: "voice",
					control: "select",
					label: "voice_generator.voice_id_label",
					options: QWEN_VOICES,
					default: "Vivian",
				},
				// Style prompt (emotion/guidance)
				{
					key: "style_prompt",
					control: "text",
					label: "voice_generator.settings.style_prompt_label",
					maxLength: 200,
					default: "",
					advanced: false,
				},
				// Language
				{
					key: "language",
					control: "select",
					label: "voice_generator.settings.language_label",
					options: [
						{ value: "Auto", label: "voice_generator.languages.auto" },
						{ value: "English", label: "voice_generator.languages.english" },
						{ value: "Chinese", label: "voice_generator.languages.chinese" },
						{ value: "Spanish", label: "voice_generator.languages.spanish" },
						{ value: "French", label: "voice_generator.languages.french" },
						{ value: "German", label: "voice_generator.languages.german" },
						{ value: "Italian", label: "voice_generator.languages.italian" },
						{ value: "Japanese", label: "voice_generator.languages.japanese" },
						{ value: "Korean", label: "voice_generator.languages.korean" },
						{
							value: "Portuguese",
							label: "voice_generator.languages.portuguese",
						},
						{ value: "Russian", label: "voice_generator.languages.russian" },
					],
					default: "Auto",
					advanced: false,
				},
				// Voice Cloning — Embedding URL
				{
					key: "speaker_voice_embedding_file_url",
					control: "text",
					label: "voice_generator.settings.voice_embedding_url_label",
					hint: "voice_generator.settings.voice_embedding_url_hint",
					placeholder:
						"voice_generator.settings.voice_embedding_url_placeholder",
					required: false,
					advanced: true,
				},
				// Voice Cloning — Reference Text (shown only when embedding URL is provided)
				{
					key: "reference_text",
					control: "textarea",
					label: "voice_generator.settings.reference_text_label",
					hint: "voice_generator.settings.reference_text_hint",
					placeholder: "voice_generator.settings.reference_text_placeholder",
					rows: 3,
					required: false,
					advanced: true,
					showWhen: { param: "speaker_voice_embedding_file_url", value: "" },
				},
				// Temperature
				{
					key: "temperature",
					control: "slider",
					label: "voice_generator.settings.temperature_label",
					hint: "voice_generator.settings.temperature_hint",
					min: 0,
					max: 1,
					step: 0.1,
					default: 0.9,
					advanced: true,
				},
				// Top K
				{
					key: "top_k",
					control: "slider",
					label: "voice_generator.settings.top_k_label",
					hint: "voice_generator.settings.top_k_hint",
					min: 0,
					max: 100,
					step: 1,
					default: 50,
					advanced: true,
				},
				// Top P
				{
					key: "top_p",
					control: "slider",
					label: "voice_generator.settings.top_p_label",
					hint: "voice_generator.settings.top_p_hint",
					min: 0,
					max: 1,
					step: 0.1,
					default: 1.0,
					advanced: true,
				},
				// Repetition Penalty
				{
					key: "repetition_penalty",
					control: "slider",
					label: "voice_generator.settings.repetition_penalty_label",
					hint: "voice_generator.settings.repetition_penalty_hint",
					min: 0,
					max: 2,
					step: 0.05,
					default: 1.05,
					advanced: true,
				},
				// Max New Tokens
				{
					key: "max_new_tokens",
					control: "slider",
					label: "voice_generator.settings.max_tokens_label",
					hint: "voice_generator.settings.max_tokens_hint",
					min: 1,
					max: 8192,
					step: 1,
					default: 200,
					advanced: true,
				},
				// Sub-talker Sampling Enable
				{
					key: "subtalker_dosample",
					control: "toggle",
					label: "voice_generator.settings.subtalker_enabled_label",
					default: true,
					advanced: true,
				},
			],

			// ─── Backend Config ───
			allowedParams: [
				"text",
				"style_prompt", // frontend key; voiceToolGeneric maps this to FAL "prompt"
				"voice",
				"language",
				"speaker_voice_embedding_file_url",
				"reference_text",
				"top_k",
				"top_p",
				"temperature",
				"repetition_penalty",
				"max_new_tokens",
				"subtalker_dosample",
				"subtalker_top_k",
				"subtalker_top_p",
				"subtalker_temperature",
			],
			maxPromptLength: 8000,

			// ─── Conditional Params ───
			conditionalParams: [
				{
					param: "reference_text",
					showWhen: { param: "speaker_voice_embedding_file_url", value: "" },
				},
			],

			// ─── Metadata ───
			sortOrder: 3,
			isActive: true,
			createdAt: now,
			updatedAt: now,
		});

		console.log("✅ Seeded 3 voice model schemas:", {
			minimaxHD,
			minimaxTurbo,
			qwen3TTS,
		});

		// ============================================================
		// CREDIT COSTS
		// ============================================================

		await ctx.db.insert("creditCosts", {
			actionType: "voice_generation_minimax_28_hd",
			displayName: "MiniMax Speech 2.8 HD",
			credits: 5,
			description: "High-quality voice synthesis (per 1000 characters)",
			category: "audio",
			isActive: true,
			updatedAt: now,
		});

		await ctx.db.insert("creditCosts", {
			actionType: "voice_generation_minimax_28_turbo",
			displayName: "MiniMax Speech 2.8 Turbo",
			credits: 3,
			description: "Fast voice synthesis (per 1000 characters)",
			category: "audio",
			isActive: true,
			updatedAt: now,
		});

		await ctx.db.insert("creditCosts", {
			actionType: "voice_generation_qwen_3",
			displayName: "Qwen 3 TTS",
			credits: 5,
			description: "Voice cloning TTS (per 1000 characters)",
			category: "audio",
			isActive: true,
			updatedAt: now,
		});

		await ctx.db.insert("creditCosts", {
			actionType: "voice_recording",
			displayName: "Voice Recording",
			credits: 1,
			description: "Upload and store voice recording",
			category: "audio",
			isActive: true,
			updatedAt: now,
		});

		console.log("✅ Seeded 4 credit costs for voice generation");

		return {
			success: true,
			modelsCount: 3,
			creditsCount: 4,
		};
	},
});
