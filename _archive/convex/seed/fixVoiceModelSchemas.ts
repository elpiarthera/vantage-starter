import { internalMutation } from "../_generated/server";

/**
 * Fix voice model schemas - flatten nested keys to match image generator pattern
 *
 * PROBLEM: Voice models use nested keys like "voice_setting.voice_id"
 * but the DynamicField component and params system expect FLAT keys like "voice_id"
 *
 * Image generator uses: "aspect_ratio", "resolution", "num_images"
 * Voice generator SHOULD use: "voice_id", "speed", "pitch", "emotion", "language"
 *
 * This fixes the seed data to use FLAT keys everywhere.
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

export const fixVoiceModelSchemas = internalMutation({
	args: {},
	handler: async (ctx) => {
		const allModels = await ctx.db.query("voiceModelSchemas").collect();

		console.log(`Found ${allModels.length} voice models to fix`);

		for (const model of allModels) {
			let needsUpdate = false;
			let newParams = model.params;

			// Fix MiniMax models (HD and Turbo)
			if (
				model.schemaId === "minimax-speech-28-hd" ||
				model.schemaId === "minimax-speech-28-turbo"
			) {
				needsUpdate = true;
				newParams = [
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
						key: "emotion",
						control: "select",
						label: "voice_generator.settings.emotion_label",
						options: [
							{
								value: "neutral",
								label: "voice_generator.settings.emotion_neutral",
							},
							{
								value: "happy",
								label: "voice_generator.settings.emotion_happy",
							},
							{ value: "sad", label: "voice_generator.settings.emotion_sad" },
							{
								value: "angry",
								label: "voice_generator.settings.emotion_angry",
							},
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
				];
			}

			// Fix Qwen 3 TTS model
			if (model.schemaId === "qwen-3-tts-17b") {
				needsUpdate = true;
				newParams = [
					{
						key: "text",
						control: "textarea",
						label: "voice_generator.prompt_label",
						maxLength: 8000,
						default: "",
					},
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
						advanced: false,
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
							{ value: "Italian", label: "voice_generator.languages.italian" },
							{
								value: "Japanese",
								label: "voice_generator.languages.japanese",
							},
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
				];
			}

			if (needsUpdate) {
				await ctx.db.patch(model._id, {
					params: newParams as never,
				});
				console.log(`✅ Fixed ${model.schemaId} - flattened param keys`);
			}
		}

		console.log("✅ All voice models fixed - params are now flat keys");
		return { success: true, modelsFixed: allModels.length };
	},
});
