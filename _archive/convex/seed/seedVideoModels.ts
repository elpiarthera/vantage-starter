import { internalMutation } from "../_generated/server";

/**
 * Seed Video Model Schemas + Credit Costs
 * Seeds 5 Kling Pro video models with full configurations.
 * Based on: docs/Analysis/video-generator/VIDEO-MODELS-ANALYSIS.md
 * Pattern: mirrors seedVoiceModels.ts structure
 *
 * Models:
 * 1. kling-v3-pro-i2v  — Kling v3 Pro Image-to-Video
 * 2. kling-o3-pro-i2v  — Kling O3 Pro Image-to-Video
 * 3. kling-o3-pro-r2v  — Kling O3 Pro Reference-to-Video
 * 4. kling-o3-pro-v2v-edit      — Kling O3 Pro Video-to-Video Edit
 * 5. kling-o3-pro-v2v-reference — Kling O3 Pro Video-to-Video Reference
 *
 * Credit costs: 11 rows (3 tiers × v3, 2 tiers × each O3 model, 1 flat × V2V)
 */

const VIDEO_CREDIT_ACTION_TYPES = [
	"video_i2v_kling_v3_no_audio",
	"video_i2v_kling_v3_audio",
	"video_i2v_kling_v3_voice",
	"video_i2v_kling_o3_no_audio",
	"video_i2v_kling_o3_audio",
	"video_r2v_kling_o3_no_audio",
	"video_r2v_kling_o3_audio",
	"video_v2v_kling_o3_edit_no_audio",
	"video_v2v_kling_o3_edit_audio",
	"video_v2v_kling_o3_ref_no_audio",
	"video_v2v_kling_o3_ref_audio",
];

export const seedVideoModels = internalMutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();

		// ─── Idempotent: delete all existing video model schemas ───
		const existingSchemas = await ctx.db.query("videoModelSchemas").collect();
		await Promise.all(existingSchemas.map((s) => ctx.db.delete(s._id)));

		// ─── Idempotent: delete existing video credit costs ───
		const existingCosts = await ctx.db.query("creditCosts").collect();
		await Promise.all(
			existingCosts
				.filter((c) => VIDEO_CREDIT_ACTION_TYPES.includes(c.actionType))
				.map((c) => ctx.db.delete(c._id)),
		);

		// ============================================================
		// MODEL 1: Kling v3 Pro — Image to Video
		// FAL: fal-ai/kling-video/v3/pro/image-to-video
		// Tiers: no_audio (56cr) | audio (84cr) | voice (98cr)
		// ============================================================

		const klingV3I2V = await ctx.db.insert("videoModelSchemas", {
			// ─── Identifiers ───
			schemaId: "kling-v3-pro-i2v",
			name: "Kling v3 Pro",
			nameTranslationKey: "video_models.kling_v3_pro",

			// ─── FAL Config ───
			modelId: "fal-ai/kling-video/v3/pro/image-to-video",
			type: "i2v",

			// ─── Param name mapping ───
			startImageParam: "start_image_url",

			// ─── Required Params ───
			requiredParams: ["start_image_url"],

			// ─── Credit System ───
			creditBaseDuration: 5,
			supportsDurationScaling: true,
			creditTiers: [
				{
					tier: "no_audio",
					actionType: "video_i2v_kling_v3_no_audio",
					labelKey: "video_generator.tier_no_audio",
				},
				{
					tier: "audio",
					actionType: "video_i2v_kling_v3_audio",
					labelKey: "video_generator.tier_audio",
				},
				{
					tier: "voice",
					actionType: "video_i2v_kling_v3_voice",
					labelKey: "video_generator.tier_voice",
				},
			],

			// ─── UI Capabilities ───
			capabilities: {
				requiresStartImage: true,
				supportsEndImage: true,
				audioGeneration: true,
				voiceIds: true,
				supportsDuration: true,
				negativePrompt: true,
				cfgScale: true,
				multiShot: true,
				supportsElements: true,
				aspectRatios: ["16:9", "9:16", "1:1"],
			},

			// ─── UI Badges ───
			badges: ["PRO", "CINEMATIC", "AUDIO"],

			// ─── UI Parameters ───
			params: [
				{
					key: "prompt",
					control: "textarea",
					label: "video_generator.prompt_label",
					placeholder: "video_generator.prompt_placeholder",
					hint: "video_generator.prompt_hint_kling",
					maxLength: 2500,
					rows: 4,
					required: false,
					advanced: false,
					scope: "scene",
				},
				{
					key: "aspect_ratio",
					control: "aspectratio",
					label: "video_generator.aspect_ratio_label",
					default: "16:9",
					required: false,
					advanced: false,
					scope: "global",
					options: [
						{ value: "16:9", label: "16:9" },
						{ value: "9:16", label: "9:16" },
						{ value: "1:1", label: "1:1" },
					],
				},
				{
					key: "duration",
					control: "select",
					label: "video_generator.duration_label",
					hint: "video_generator.duration_hint",
					default: "5",
					required: false,
					advanced: false,
					scope: "global",
					unit: "s",
					options: [
						{ value: "3", label: "3s" },
						{ value: "5", label: "5s" },
						{ value: "8", label: "8s" },
						{ value: "10", label: "10s" },
						{ value: "12", label: "12s" },
						{ value: "15", label: "15s" },
					],
				},
				{
					key: "generate_audio",
					control: "toggle",
					label: "video_generator.generate_audio_label",
					hint: "video_generator.generate_audio_hint",
					default: true,
					required: false,
					advanced: false,
					scope: "global",
				},
				{
					key: "negative_prompt",
					control: "textarea",
					label: "video_generator.negative_prompt_label",
					default: "blur, distort, and low quality",
					maxLength: 2500,
					rows: 2,
					required: false,
					advanced: true,
					scope: "scene",
				},
				{
					key: "cfg_scale",
					control: "slider",
					label: "video_generator.cfg_scale_label",
					hint: "video_generator.cfg_scale_hint",
					min: 0,
					max: 1,
					step: 0.05,
					default: 0.5,
					required: false,
					advanced: true,
					scope: "scene",
				},
				{
					key: "voice_ids",
					control: "textarea",
					label: "video_generator.voice_ids_label",
					hint: "video_generator.voice_ids_hint",
					placeholder: "video_generator.voice_ids_placeholder",
					rows: 2,
					required: false,
					advanced: true,
					scope: "scene",
					showWhen: { param: "generate_audio", value: true },
				},
			],

			// ─── Backend Config ───
			allowedParams: [
				"prompt",
				"start_image_url",
				"end_image_url",
				"duration",
				"generate_audio",
				"aspect_ratio",
				"negative_prompt",
				"cfg_scale",
				"voice_ids",
				"elements",
				"multi_prompt",
				"shot_type",
			],
			maxPromptLength: 2500,

			// ─── Metadata ───
			sortOrder: 10,
			isActive: true,
			createdAt: now,
			updatedAt: now,
		});

		// ============================================================
		// MODEL 2: Kling O3 Pro — Image to Video (Transition)
		// FAL: fal-ai/kling-video/o3/pro/image-to-video
		// ⚠️ Start image param: "image_url" (NOT "start_image_url")
		// Tiers: no_audio (56cr) | audio (70cr)
		// ============================================================

		const klingO3I2V = await ctx.db.insert("videoModelSchemas", {
			schemaId: "kling-o3-pro-i2v",
			name: "Kling O3 Pro",
			nameTranslationKey: "video_models.kling_o3_pro",

			modelId: "fal-ai/kling-video/o3/pro/image-to-video",
			type: "i2v",

			// ⚠️ O3 Pro I2V uses "image_url" not "start_image_url"
			startImageParam: "image_url",

			requiredParams: ["image_url"],

			creditBaseDuration: 5,
			supportsDurationScaling: true,
			creditTiers: [
				{
					tier: "no_audio",
					actionType: "video_i2v_kling_o3_no_audio",
					labelKey: "video_generator.tier_no_audio",
				},
				{
					tier: "audio",
					actionType: "video_i2v_kling_o3_audio",
					labelKey: "video_generator.tier_audio",
				},
			],

			capabilities: {
				requiresStartImage: true,
				supportsEndImage: true,
				audioGeneration: true,
				supportsDuration: true,
				multiShot: true,
			},

			badges: ["PRO", "TRANSITION"],

			params: [
				{
					key: "prompt",
					control: "textarea",
					label: "video_generator.prompt_label",
					placeholder: "video_generator.prompt_placeholder",
					maxLength: 2500,
					rows: 4,
					required: false,
					advanced: false,
					scope: "scene",
				},
				{
					key: "duration",
					control: "select",
					label: "video_generator.duration_label",
					hint: "video_generator.duration_hint",
					default: "5",
					required: false,
					advanced: false,
					scope: "global",
					unit: "s",
					options: [
						{ value: "3", label: "3s" },
						{ value: "5", label: "5s" },
						{ value: "8", label: "8s" },
						{ value: "10", label: "10s" },
						{ value: "12", label: "12s" },
						{ value: "15", label: "15s" },
					],
				},
				{
					key: "generate_audio",
					control: "toggle",
					label: "video_generator.generate_audio_label",
					hint: "video_generator.generate_audio_hint",
					default: false,
					required: false,
					advanced: false,
					scope: "global",
				},
			],

			allowedParams: [
				"prompt",
				"image_url",
				"end_image_url",
				"duration",
				"generate_audio",
				"multi_prompt",
				"shot_type",
			],
			maxPromptLength: 2500,

			sortOrder: 20,
			isActive: true,
			createdAt: now,
			updatedAt: now,
		});

		// ============================================================
		// MODEL 3: Kling O3 Pro — Reference to Video
		// FAL: fal-ai/kling-video/o3/pro/reference-to-video
		// No required params — generation from elements alone is valid
		// Tiers: no_audio (56cr) | audio (70cr)
		// ============================================================

		const klingO3R2V = await ctx.db.insert("videoModelSchemas", {
			schemaId: "kling-o3-pro-r2v",
			name: "Kling O3 Pro Reference",
			nameTranslationKey: "video_models.kling_o3_pro_r2v",

			modelId: "fal-ai/kling-video/o3/pro/reference-to-video",
			type: "r2v",

			startImageParam: "start_image_url",
			// No videoInputParam — not V2V

			// ⚠️ Nothing required — generation can start from elements alone
			requiredParams: [],

			creditBaseDuration: 5,
			supportsDurationScaling: true,
			creditTiers: [
				{
					tier: "no_audio",
					actionType: "video_r2v_kling_o3_no_audio",
					labelKey: "video_generator.tier_no_audio",
				},
				{
					tier: "audio",
					actionType: "video_r2v_kling_o3_audio",
					labelKey: "video_generator.tier_audio",
				},
			],

			capabilities: {
				// start image optional for R2V
				supportsEndImage: true,
				supportsStyleImages: true,
				supportsElements: true,
				audioGeneration: true,
				supportsDuration: true,
				multiShot: true,
				aspectRatios: ["16:9", "9:16", "1:1"],
			},

			badges: ["PRO", "REFERENCE", "ELEMENTS"],

			params: [
				{
					key: "prompt",
					control: "textarea",
					label: "video_generator.prompt_label",
					placeholder: "video_generator.prompt_placeholder_r2v",
					hint: "video_generator.prompt_hint_r2v",
					maxLength: 2500,
					rows: 4,
					required: false,
					advanced: false,
					scope: "scene",
				},
				{
					key: "aspect_ratio",
					control: "aspectratio",
					label: "video_generator.aspect_ratio_label",
					default: "16:9",
					required: false,
					advanced: false,
					scope: "global",
					options: [
						{ value: "16:9", label: "16:9" },
						{ value: "9:16", label: "9:16" },
						{ value: "1:1", label: "1:1" },
					],
				},
				{
					key: "duration",
					control: "select",
					label: "video_generator.duration_label",
					hint: "video_generator.duration_hint",
					default: "5",
					required: false,
					advanced: false,
					scope: "global",
					unit: "s",
					options: [
						{ value: "3", label: "3s" },
						{ value: "5", label: "5s" },
						{ value: "8", label: "8s" },
						{ value: "10", label: "10s" },
						{ value: "12", label: "12s" },
						{ value: "15", label: "15s" },
					],
				},
				{
					key: "generate_audio",
					control: "toggle",
					label: "video_generator.generate_audio_label",
					hint: "video_generator.generate_audio_hint",
					default: false,
					required: false,
					advanced: false,
					scope: "global",
				},
			],

			allowedParams: [
				"prompt",
				"start_image_url",
				"end_image_url",
				"image_urls",
				"elements",
				"duration",
				"generate_audio",
				"aspect_ratio",
				"multi_prompt",
				"shot_type",
			],
			maxPromptLength: 2500,

			sortOrder: 30,
			isActive: true,
			createdAt: now,
			updatedAt: now,
		});

		// ============================================================
		// MODEL 4: Kling O3 Pro — Video to Video Edit
		// FAL: fal-ai/kling-video/o3/pro/video-to-video/edit
		// Requires: prompt + video_url. No duration control. Flat rate.
		// Tiers: no_audio (56cr flat) | audio (84cr flat)
		// ============================================================

		const klingO3V2VEdit = await ctx.db.insert("videoModelSchemas", {
			schemaId: "kling-o3-pro-v2v-edit",
			name: "Kling O3 Pro Edit",
			nameTranslationKey: "video_models.kling_o3_pro_v2v_edit",

			modelId: "fal-ai/kling-video/o3/pro/video-to-video/edit",
			type: "v2v",

			videoInputParam: "video_url",

			// Both required
			requiredParams: ["prompt", "video_url"],

			// ⚠️ Flat rate — output duration = input duration, not selectable
			creditBaseDuration: 5,
			supportsDurationScaling: false,
			creditTiers: [
				{
					tier: "no_audio",
					actionType: "video_v2v_kling_o3_edit_no_audio",
					labelKey: "video_generator.tier_no_audio",
				},
				{
					tier: "audio",
					actionType: "video_v2v_kling_o3_edit_audio",
					labelKey: "video_generator.tier_audio",
				},
			],

			capabilities: {
				requiresVideoInput: true,
				requiresTextPrompt: true,
				keepAudio: true,
				supportsStyleImages: true,
				supportsElements: true,
				// No supportsDuration — output duration = input duration
				// No aspectRatios — inherits from input video
			},

			badges: ["PRO", "EDIT", "V2V"],

			params: [
				{
					key: "prompt",
					control: "textarea",
					label: "video_generator.prompt_label",
					placeholder: "video_generator.prompt_placeholder_v2v",
					hint: "video_generator.prompt_hint_v2v",
					maxLength: 2500,
					rows: 4,
					required: true,
					advanced: false,
					scope: "scene",
				},
				{
					key: "keep_audio",
					control: "toggle",
					label: "video_generator.keep_audio_label",
					hint: "video_generator.keep_audio_hint",
					default: true,
					required: false,
					advanced: false,
					scope: "global",
				},
			],

			allowedParams: [
				"prompt",
				"video_url",
				"image_urls",
				"elements",
				"keep_audio",
				"shot_type",
			],
			maxPromptLength: 2500,

			sortOrder: 40,
			isActive: true,
			createdAt: now,
			updatedAt: now,
		});

		// ============================================================
		// MODEL 5: Kling O3 Pro — Video to Video Reference
		// FAL: fal-ai/kling-video/o3/pro/video-to-video/reference
		// Requires: prompt + video_url. Duration control restored. "auto" aspect ratio.
		// Tiers: no_audio (56cr) | audio (70cr)
		// ============================================================

		const klingO3V2VRef = await ctx.db.insert("videoModelSchemas", {
			schemaId: "kling-o3-pro-v2v-reference",
			name: "Kling O3 Pro Style Reference",
			nameTranslationKey: "video_models.kling_o3_pro_v2v_reference",

			modelId: "fal-ai/kling-video/o3/pro/video-to-video/reference",
			type: "v2v",

			videoInputParam: "video_url",

			requiredParams: ["prompt", "video_url"],

			creditBaseDuration: 5,
			supportsDurationScaling: true,
			creditTiers: [
				{
					tier: "no_audio",
					actionType: "video_v2v_kling_o3_ref_no_audio",
					labelKey: "video_generator.tier_no_audio",
				},
				{
					tier: "audio",
					actionType: "video_v2v_kling_o3_ref_audio",
					labelKey: "video_generator.tier_audio",
				},
			],

			capabilities: {
				requiresVideoInput: true,
				requiresTextPrompt: true,
				keepAudio: true,
				supportsStyleImages: true,
				supportsElements: true,
				supportsDuration: true,
				// ⚠️ "auto" is the new default for V2V Reference
				aspectRatios: ["auto", "16:9", "9:16", "1:1"],
			},

			badges: ["PRO", "STYLE", "V2V"],

			params: [
				{
					key: "prompt",
					control: "textarea",
					label: "video_generator.prompt_label",
					placeholder: "video_generator.prompt_placeholder_v2v_ref",
					hint: "video_generator.prompt_hint_v2v",
					maxLength: 2500,
					rows: 4,
					required: true,
					advanced: false,
					scope: "scene",
				},
				{
					key: "aspect_ratio",
					control: "aspectratio",
					label: "video_generator.aspect_ratio_label",
					default: "auto",
					required: false,
					advanced: false,
					scope: "global",
					options: [
						{ value: "auto", label: "video_generator.aspect_ratio_auto" },
						{ value: "16:9", label: "16:9" },
						{ value: "9:16", label: "9:16" },
						{ value: "1:1", label: "1:1" },
					],
				},
				{
					key: "duration",
					control: "select",
					label: "video_generator.duration_label",
					hint: "video_generator.duration_hint",
					default: "5",
					required: false,
					advanced: false,
					scope: "global",
					unit: "s",
					options: [
						{ value: "3", label: "3s" },
						{ value: "5", label: "5s" },
						{ value: "8", label: "8s" },
						{ value: "10", label: "10s" },
						{ value: "12", label: "12s" },
						{ value: "15", label: "15s" },
					],
				},
				{
					key: "keep_audio",
					control: "toggle",
					label: "video_generator.keep_audio_label",
					hint: "video_generator.keep_audio_hint",
					default: true,
					required: false,
					advanced: false,
					scope: "global",
				},
			],

			allowedParams: [
				"prompt",
				"video_url",
				"image_urls",
				"elements",
				"keep_audio",
				"duration",
				"aspect_ratio",
				"shot_type",
			],
			maxPromptLength: 2500,

			sortOrder: 50,
			isActive: true,
			createdAt: now,
			updatedAt: now,
		});

		console.log("✅ Seeded 5 video model schemas:", {
			klingV3I2V,
			klingO3I2V,
			klingO3R2V,
			klingO3V2VEdit,
			klingO3V2VRef,
		});

		// ============================================================
		// CREDIT COSTS — 11 rows
		// Assumes 1 credit = $0.02. Base = 5s.
		// Scaling: Math.ceil(baseCredits × requestedDuration / 5)
		// ============================================================

		// ── Kling v3 Pro I2V ──
		await ctx.db.insert("creditCosts", {
			actionType: "video_i2v_kling_v3_no_audio",
			displayName: "Kling v3 Pro I2V — No Audio",
			credits: 56,
			description:
				"Kling v3 Pro image-to-video, audio off (5s baseline, $1.12)",
			category: "video",
			isActive: true,
			updatedAt: now,
		});

		await ctx.db.insert("creditCosts", {
			actionType: "video_i2v_kling_v3_audio",
			displayName: "Kling v3 Pro I2V — Audio",
			credits: 84,
			description: "Kling v3 Pro image-to-video, audio on (5s baseline, $1.68)",
			category: "video",
			isActive: true,
			updatedAt: now,
		});

		await ctx.db.insert("creditCosts", {
			actionType: "video_i2v_kling_v3_voice",
			displayName: "Kling v3 Pro I2V — Audio + Voice",
			credits: 98,
			description:
				"Kling v3 Pro image-to-video, audio + voice control (5s baseline, $1.96)",
			category: "video",
			isActive: true,
			updatedAt: now,
		});

		// ── Kling O3 Pro I2V ──
		await ctx.db.insert("creditCosts", {
			actionType: "video_i2v_kling_o3_no_audio",
			displayName: "Kling O3 Pro I2V — No Audio",
			credits: 56,
			description:
				"Kling O3 Pro image-to-video, audio off (5s baseline, $1.12)",
			category: "video",
			isActive: true,
			updatedAt: now,
		});

		await ctx.db.insert("creditCosts", {
			actionType: "video_i2v_kling_o3_audio",
			displayName: "Kling O3 Pro I2V — Audio",
			credits: 70,
			description: "Kling O3 Pro image-to-video, audio on (5s baseline, $1.40)",
			category: "video",
			isActive: true,
			updatedAt: now,
		});

		// ── Kling O3 Pro R2V ──
		await ctx.db.insert("creditCosts", {
			actionType: "video_r2v_kling_o3_no_audio",
			displayName: "Kling O3 Pro R2V — No Audio",
			credits: 56,
			description:
				"Kling O3 Pro reference-to-video, audio off (5s baseline, $1.12)",
			category: "video",
			isActive: true,
			updatedAt: now,
		});

		await ctx.db.insert("creditCosts", {
			actionType: "video_r2v_kling_o3_audio",
			displayName: "Kling O3 Pro R2V — Audio",
			credits: 70,
			description:
				"Kling O3 Pro reference-to-video, audio on (5s baseline, $1.40)",
			category: "video",
			isActive: true,
			updatedAt: now,
		});

		// ── Kling O3 Pro V2V Edit (flat rate — no duration scaling) ──
		await ctx.db.insert("creditCosts", {
			actionType: "video_v2v_kling_o3_edit_no_audio",
			displayName: "Kling O3 Pro V2V Edit — No Audio",
			credits: 56,
			description:
				"Kling O3 Pro video edit, audio off (flat per input video, ~5s = $1.12)",
			category: "video",
			isActive: true,
			updatedAt: now,
		});

		await ctx.db.insert("creditCosts", {
			actionType: "video_v2v_kling_o3_edit_audio",
			displayName: "Kling O3 Pro V2V Edit — Audio",
			credits: 84,
			description:
				"Kling O3 Pro video edit, audio on (flat per input video, ~5s = $1.68)",
			category: "video",
			isActive: true,
			updatedAt: now,
		});

		// ── Kling O3 Pro V2V Reference ──
		await ctx.db.insert("creditCosts", {
			actionType: "video_v2v_kling_o3_ref_no_audio",
			displayName: "Kling O3 Pro V2V Reference — No Audio",
			credits: 56,
			description:
				"Kling O3 Pro style-reference video, audio off (5s baseline, $1.12)",
			category: "video",
			isActive: true,
			updatedAt: now,
		});

		await ctx.db.insert("creditCosts", {
			actionType: "video_v2v_kling_o3_ref_audio",
			displayName: "Kling O3 Pro V2V Reference — Audio",
			credits: 70,
			description:
				"Kling O3 Pro style-reference video, audio on (5s baseline, $1.40)",
			category: "video",
			isActive: true,
			updatedAt: now,
		});

		console.log("✅ Seeded 11 credit costs for video generation");

		return {
			success: true,
			modelsCount: 5,
			creditsCount: 11,
		};
	},
});
