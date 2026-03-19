import { internalMutation } from "../_generated/server";

/**
 * Complete voice model schemas with ALL parameters from FAL API
 *
 * Based on TTS-MODELS-ANALYSIS.md v1.2
 * Includes all advanced parameters for production-grade TTS
 */

// MiniMax Voice IDs (17 voices)
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

// Qwen 3 TTS Voice IDs (9 voices)
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

export const seedCompleteVoiceModels = internalMutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();

		// Delete existing models
		const existing = await ctx.db.query("voiceModelSchemas").collect();
		for (const model of existing) {
			await ctx.db.delete(model._id);
		}
		console.log(`Deleted ${existing.length} existing voice models`);

		// ============================================================
		// MODEL 1: MiniMax Speech 2.8 HD - COMPLETE
		// ============================================================

		await ctx.db.insert("voiceModelSchemas", {
			schemaId: "minimax-speech-28-hd",
			name: "MiniMax Speech 2.8 HD",
			nameTranslationKey: "voice_models.minimax_28_hd",
			modelId: "fal-ai/minimax/speech-2.8-hd",
			type: "tts",
			creditActionType: "voice_generation_minimax_28_hd",
			capabilities: {
				emotionControl: true,
				pitchControl: true,
				speedControl: true,
				multiLanguage: true,
				voiceCloning: false,
			},
			badges: ["HD", "PRO", "MULTILINGUAL"],
			params: [
				// PRIMARY TEXT INPUT
				{
					key: "prompt",
					control: "textarea",
					label: "voice_generator.prompt_label",
					maxLength: 10000,
					default: "",
				},
				// BASIC VOICE SETTINGS (shown by default)
				{
					key: "voice_id",
					control: "select",
					label: "voice_generator.voice_id_label",
					options: MINIMAX_VOICES,
					default: "Wise_Woman",
				},
				{
					key: "speed",
					control: "slider",
					label: "voice_generator.settings.speed_label",
					min: 0.5,
					max: 2.0,
					step: 0.1,
					default: 1.0,
				},
				{
					key: "pitch",
					control: "slider",
					label: "voice_generator.settings.pitch_label",
					min: -12,
					max: 12,
					step: 1,
					default: 0,
				},
				{
					key: "vol",
					control: "slider",
					label: "voice_generator.settings.volume_label",
					min: 0.01,
					max: 10,
					step: 0.1,
					default: 1.0,
				},
				{
					key: "emotion",
					control: "select",
					label: "voice_generator.settings.emotion_label",
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
				},
				// ADVANCED SETTINGS (collapsible)
				{
					key: "english_normalization",
					control: "toggle",
					label: "voice_generator.settings.english_normalization_label",
					default: false,
					advanced: true,
				},
				{
					key: "language_boost",
					control: "select",
					label: "voice_generator.settings.language_boost_label",
					options: [
						{ value: "auto", label: "voice_generator.languages.auto" },
						{ value: "Chinese", label: "voice_generator.languages.chinese" },
						{ value: "English", label: "voice_generator.languages.english" },
						{ value: "Spanish", label: "voice_generator.languages.spanish" },
						{ value: "French", label: "voice_generator.languages.french" },
						{ value: "German", label: "voice_generator.languages.german" },
						{ value: "Japanese", label: "voice_generator.languages.japanese" },
						{ value: "Korean", label: "voice_generator.languages.korean" },
					],
					default: "auto",
					advanced: true,
				},
			],
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
			sortOrder: 1,
			isActive: true,
			createdAt: now,
			updatedAt: now,
		});

		// ============================================================
		// MODEL 2: MiniMax Speech 2.8 Turbo - COMPLETE
		// ============================================================

		await ctx.db.insert("voiceModelSchemas", {
			schemaId: "minimax-speech-28-turbo",
			name: "MiniMax Speech 2.8 Turbo",
			nameTranslationKey: "voice_models.minimax_28_turbo",
			modelId: "fal-ai/minimax/speech-2.8-turbo",
			type: "tts",
			creditActionType: "voice_generation_minimax_28_turbo",
			capabilities: {
				emotionControl: true,
				pitchControl: true,
				speedControl: true,
				multiLanguage: true,
				voiceCloning: false,
			},
			badges: ["TURBO", "FAST", "COST-EFFECTIVE"],
			params: [
				// Same params as HD model
				{
					key: "prompt",
					control: "textarea",
					label: "voice_generator.prompt_label",
					maxLength: 10000,
					default: "",
				},
				{
					key: "voice_id",
					control: "select",
					label: "voice_generator.voice_id_label",
					options: MINIMAX_VOICES,
					default: "Wise_Woman",
				},
				{
					key: "speed",
					control: "slider",
					label: "voice_generator.settings.speed_label",
					min: 0.5,
					max: 2.0,
					step: 0.1,
					default: 1.0,
					advanced: false,
				},
				{
					key: "pitch",
					control: "slider",
					label: "voice_generator.settings.pitch_label",
					min: -12,
					max: 12,
					step: 1,
					default: 0,
					advanced: false,
				},
				{
					key: "vol",
					control: "slider",
					label: "voice_generator.settings.volume_label",
					min: 0.01,
					max: 10,
					step: 0.1,
					default: 1.0,
					advanced: false,
				},
				{
					key: "emotion",
					control: "select",
					label: "voice_generator.settings.emotion_label",
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
				},
				{
					key: "english_normalization",
					control: "toggle",
					label: "voice_generator.settings.english_normalization_label",
					default: false,
					advanced: true,
				},
				{
					key: "language_boost",
					control: "select",
					label: "voice_generator.settings.language_boost_label",
					options: [
						{ value: "auto", label: "voice_generator.languages.auto" },
						{ value: "Chinese", label: "voice_generator.languages.chinese" },
						{ value: "English", label: "voice_generator.languages.english" },
						{ value: "Arabic", label: "voice_generator.languages.arabic" },
						{ value: "Russian", label: "voice_generator.languages.russian" },
						{ value: "Spanish", label: "voice_generator.languages.spanish" },
						{ value: "French", label: "voice_generator.languages.french" },
						{
							value: "Portuguese",
							label: "voice_generator.languages.portuguese",
						},
						{ value: "German", label: "voice_generator.languages.german" },
						{ value: "Italian", label: "voice_generator.languages.italian" },
						{ value: "Japanese", label: "voice_generator.languages.japanese" },
						{ value: "Korean", label: "voice_generator.languages.korean" },
					],
					default: "auto",
					advanced: true,
				},
			],
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
			sortOrder: 2,
			isActive: true,
			createdAt: now,
			updatedAt: now,
		});

		// ============================================================
		// MODEL 3: Qwen 3 TTS - COMPLETE
		// ============================================================

		await ctx.db.insert("voiceModelSchemas", {
			schemaId: "qwen-3-tts-17b",
			name: "Qwen 3 TTS",
			nameTranslationKey: "voice_models.qwen_3_tts",
			modelId: "fal-ai/qwen-3-tts/text-to-speech/1.7b",
			type: "tts",
			creditActionType: "voice_generation_qwen_3",
			capabilities: {
				voiceCloning: true,
				multiLanguage: true,
				emotionControl: false,
				pitchControl: false,
				speedControl: false,
			},
			badges: ["VOICE CLONING", "CUSTOM VOICE"],
			params: [
				// PRIMARY TEXT INPUT
				{
					key: "text",
					control: "textarea",
					label: "voice_generator.prompt_label",
					maxLength: 8000,
					default: "",
				},
				// BASIC VOICE SETTINGS (shown by default)
				{
					key: "voice",
					control: "select",
					label: "voice_generator.voice_id_label",
					options: QWEN_VOICES,
					default: "Vivian",
				},
				{
					key: "style_prompt",
					control: "text",
					label: "voice_generator.settings.style_prompt_label",
					maxLength: 200,
					default: "",
				},
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
						{ value: "Japanese", label: "voice_generator.languages.japanese" },
						{ value: "Korean", label: "voice_generator.languages.korean" },
					],
					default: "Auto",
				},
				// ADVANCED ML SAMPLING PARAMETERS (collapsible)
				{
					key: "temperature",
					control: "slider",
					label: "voice_generator.settings.temperature_label",
					min: 0,
					max: 1,
					step: 0.05,
					default: 0.9,
					advanced: true,
				},
				{
					key: "top_k",
					control: "number",
					label: "voice_generator.settings.top_k_label",
					min: 1,
					max: 100,
					default: 50,
					advanced: true,
				},
				{
					key: "top_p",
					control: "slider",
					label: "voice_generator.settings.top_p_label",
					min: 0,
					max: 1,
					step: 0.05,
					default: 1.0,
					advanced: true,
				},
				{
					key: "repetition_penalty",
					control: "slider",
					label: "voice_generator.settings.repetition_penalty_label",
					min: 0,
					max: 2,
					step: 0.05,
					default: 1.05,
					advanced: true,
				},
			],
			allowedParams: [
				"text",
				"prompt",
				"voice",
				"language",
				"speaker_voice_embedding_file_url",
				"reference_text",
				"top_k",
				"top_p",
				"temperature",
				"repetition_penalty",
				"max_new_tokens",
			],
			maxPromptLength: 8000,
			sortOrder: 3,
			isActive: true,
			createdAt: now,
			updatedAt: now,
		});

		console.log("✅ Seeded 3 COMPLETE voice model schemas with ALL parameters");

		return {
			success: true,
			modelsCount: 3,
		};
	},
});
