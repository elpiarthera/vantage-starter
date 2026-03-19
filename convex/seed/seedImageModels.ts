/**
 * Seed Script: Image Model Schemas (Sprint 30d.5)
 * Populates imageModelSchemas table with all 9 models from IMAGE-MODELS-ANALYSIS.md.
 * Also seeds missing creditCosts entries for Grok and Nano Banana models.
 *
 * Run with: npx convex run seed/seedImageModels:seedAll
 *
 * @see docs/Analysis/image-generator/IMAGE-MODELS-ANALYSIS.md
 */

import { internalMutation } from "../_generated/server";

// ─── Shared option arrays (from IMAGE-MODELS-ANALYSIS.md) ───────────────────

const ASPECT_KLING_8 = [
	{ value: "16:9", label: "schema_option_landscape" },
	{ value: "9:16", label: "schema_option_portrait" },
	{ value: "1:1", label: "schema_option_square" },
	{ value: "4:3", label: "4:3" },
	{ value: "3:4", label: "3:4" },
	{ value: "3:2", label: "3:2" },
	{ value: "2:3", label: "2:3" },
	{ value: "21:9", label: "21:9" },
];

const ASPECT_KLING_O3_I2I = [
	{ value: "auto", label: "schema_option_auto_from_input" },
	...ASPECT_KLING_8,
];

const ASPECT_GROK_13 = [
	{ value: "2:1", label: "2:1" },
	{ value: "20:9", label: "20:9" },
	{ value: "19.5:9", label: "19.5:9" },
	{ value: "16:9", label: "schema_option_landscape" },
	{ value: "4:3", label: "4:3" },
	{ value: "3:2", label: "3:2" },
	{ value: "1:1", label: "schema_option_square" },
	{ value: "2:3", label: "2:3" },
	{ value: "3:4", label: "3:4" },
	{ value: "9:16", label: "schema_option_portrait" },
	{ value: "9:19.5", label: "9:19.5" },
	{ value: "9:20", label: "9:20" },
	{ value: "1:2", label: "1:2" },
];

const ASPECT_NANO_11 = [
	{ value: "auto", label: "schema_option_auto_from_prompt" },
	{ value: "21:9", label: "21:9" },
	{ value: "16:9", label: "schema_option_landscape" },
	{ value: "3:2", label: "3:2" },
	{ value: "4:3", label: "4:3" },
	{ value: "5:4", label: "5:4" },
	{ value: "1:1", label: "schema_option_square" },
	{ value: "4:5", label: "4:5" },
	{ value: "3:4", label: "3:4" },
	{ value: "2:3", label: "2:3" },
	{ value: "9:16", label: "schema_option_portrait" },
];

const RESOLUTION_1K_2K = [
	{ value: "1K", label: "schema_option_1k" },
	{ value: "2K", label: "schema_option_2k" },
];

const RESOLUTION_1K_2K_4K = [
	{ value: "1K", label: "schema_option_1k" },
	{ value: "2K", label: "schema_option_2k" },
	{ value: "4K", label: "schema_option_4k" },
];

// Nano Banana 2: includes 0.5K (512px, 0.75× rate)
const RESOLUTION_0_5K_1K_2K_4K = [
	{ value: "0.5K", label: "schema_option_0_5k" },
	{ value: "1K", label: "schema_option_1k" },
	{ value: "2K", label: "schema_option_2k" },
	{ value: "4K", label: "schema_option_4k" },
];

const OUTPUT_FORMAT = [
	{ value: "jpeg", label: "schema_option_jpeg" },
	{ value: "png", label: "schema_option_png" },
	{ value: "webp", label: "schema_option_webp" },
];

const RESULT_TYPE = [
	{ value: "single", label: "schema_option_single" },
	{ value: "series", label: "schema_option_series" },
];

const SAFETY_TOLERANCE = [
	{ value: "1", label: "schema_option_safety_1" },
	{ value: "2", label: "schema_option_safety_2" },
	{ value: "3", label: "schema_option_safety_3" },
	{ value: "4", label: "schema_option_safety_4" },
	{ value: "5", label: "schema_option_safety_5" },
	{ value: "6", label: "schema_option_safety_6" },
];

// ─── All 9 Model Schemas ────────────────────────────────────────────────────

const IMAGE_MODEL_SCHEMAS = [
	// ─── Model 1: Kling v3 — Text-to-Image ─────────────────────────────────────
	{
		schemaId: "kling-v3-t2i",
		name: "Kling v3 — Text-to-Image",
		nameTranslationKey: "image_generator.models.kling_v3_t2i",
		modelId: "fal-ai/kling-image/v3/text-to-image",
		type: "t2i" as const,
		creditActionType: "image_generation_kling_v3",
		capabilities: {
			negativePrompt: true,
			maxResolution: "2K",
			elements: true,
		},
		params: [
			{
				key: "prompt",
				control: "text",
				maxLength: 2500,
				label: "schema_label_prompt",
			},
			{
				key: "negative_prompt",
				control: "text",
				maxLength: 2500,
				label: "schema_label_negative_prompt",
				advanced: true,
			},
			{
				key: "elements",
				control: "text",
				refType: "elements",
				label: "schema_label_elements_hint",
			},
			{
				key: "resolution",
				control: "segmented",
				options: RESOLUTION_1K_2K,
				default: "1K",
				label: "schema_label_resolution",
			},
			{
				key: "num_images",
				control: "number",
				min: 1,
				max: 9,
				default: 1,
				label: "schema_label_num_images",
			},
			{
				key: "aspect_ratio",
				control: "icon-select",
				options: ASPECT_KLING_8,
				default: "16:9",
				label: "schema_label_aspect_ratio",
			},
			{
				key: "output_format",
				control: "select",
				options: OUTPUT_FORMAT,
				default: "png",
				label: "schema_label_output_format",
			},
		],
		allowedParams: [
			"prompt",
			"negative_prompt",
			"elements",
			"resolution",
			"num_images",
			"aspect_ratio",
			"output_format",
		],
		maxPromptLength: 2500,
		sortOrder: 1,
	},

	// ─── Model 2: Kling v3 — Image-to-Image ─────────────────────────────────────
	{
		schemaId: "kling-v3-i2i",
		name: "Kling v3 — Image-to-Image",
		nameTranslationKey: "image_generator.models.kling_v3_i2i",
		modelId: "fal-ai/kling-image/v3/image-to-image",
		type: "i2i" as const,
		creditActionType: "image_edit_kling_v3",
		capabilities: {
			maxResolution: "2K",
			elements: true,
		},
		params: [
			{
				key: "prompt",
				control: "text",
				maxLength: 2500,
				label: "schema_label_prompt",
			},
			{
				key: "image_url",
				control: "text",
				refType: "single",
				label: "schema_label_reference_image",
			},
			{
				key: "elements",
				control: "text",
				refType: "elements",
				label: "schema_label_elements_hint",
			},
			{
				key: "resolution",
				control: "segmented",
				options: RESOLUTION_1K_2K,
				default: "1K",
				label: "schema_label_resolution",
			},
			{
				key: "num_images",
				control: "number",
				min: 1,
				max: 9,
				default: 1,
				label: "schema_label_num_images",
			},
			{
				key: "aspect_ratio",
				control: "icon-select",
				options: ASPECT_KLING_8,
				default: "16:9",
				label: "schema_label_aspect_ratio",
			},
			{
				key: "output_format",
				control: "select",
				options: OUTPUT_FORMAT,
				default: "png",
				label: "schema_label_output_format",
			},
		],
		allowedParams: [
			"prompt",
			"image_url",
			"elements",
			"resolution",
			"num_images",
			"aspect_ratio",
			"output_format",
		],
		maxPromptLength: 2500,
		sortOrder: 2,
	},

	// ─── Model 3: Kling O3 — Text-to-Image ──────────────────────────────────────
	{
		schemaId: "kling-o3-t2i",
		name: "Kling O3 — Text-to-Image",
		nameTranslationKey: "image_generator.models.kling_o3_t2i",
		modelId: "fal-ai/kling-image/o3/text-to-image",
		type: "t2i" as const,
		creditActionType: "image_generation_kling_o3",
		badges: ["PRO"],
		capabilities: {
			maxResolution: "4K",
			elements: true,
			resultTypeSeries: true,
		},
		params: [
			{
				key: "prompt",
				control: "text",
				maxLength: 2500,
				label: "schema_label_prompt",
			},
			{
				key: "elements",
				control: "text",
				refType: "elements",
				label: "schema_label_elements_hint",
			},
			{
				key: "resolution",
				control: "segmented",
				options: RESOLUTION_1K_2K_4K,
				default: "1K",
				label: "schema_label_resolution",
			},
			{
				key: "result_type",
				control: "segmented",
				options: RESULT_TYPE,
				default: "single",
				label: "schema_label_result_type",
			},
			{
				key: "num_images",
				control: "number",
				min: 1,
				max: 9,
				default: 1,
				label: "schema_label_num_images",
				showWhen: { param: "result_type", value: "single" },
			},
			{
				key: "series_amount",
				control: "number",
				min: 2,
				max: 9,
				default: 2,
				label: "schema_label_series_amount",
				showWhen: { param: "result_type", value: "series" },
			},
			{
				key: "aspect_ratio",
				control: "icon-select",
				options: ASPECT_KLING_8,
				default: "16:9",
				label: "schema_label_aspect_ratio",
			},
			{
				key: "output_format",
				control: "select",
				options: OUTPUT_FORMAT,
				default: "png",
				label: "schema_label_output_format",
			},
		],
		allowedParams: [
			"prompt",
			"elements",
			"resolution",
			"result_type",
			"num_images",
			"series_amount",
			"aspect_ratio",
			"output_format",
		],
		conditionalParams: [
			{
				param: "num_images",
				showWhen: { param: "result_type", value: "single" },
			},
			{
				param: "series_amount",
				showWhen: { param: "result_type", value: "series" },
			},
		],
		maxPromptLength: 2500,
		sortOrder: 3,
	},

	// ─── Model 4: Kling O3 — Image-to-Image ──────────────────────────────────────
	{
		schemaId: "kling-o3-i2i",
		name: "Kling O3 — Image-to-Image",
		nameTranslationKey: "image_generator.models.kling_o3_i2i",
		modelId: "fal-ai/kling-image/o3/image-to-image",
		type: "i2i" as const,
		creditActionType: "image_edit_kling_o3",
		badges: ["PRO"],
		capabilities: {
			multiImage: true,
			maxResolution: "4K",
			aspectAuto: true,
			elements: true,
			resultTypeSeries: true,
		},
		params: [
			{
				key: "prompt",
				control: "text",
				maxLength: 2500,
				label: "schema_label_prompt_with_refs",
			},
			{
				key: "image_urls",
				control: "text",
				refType: "multi",
				label: "schema_label_reference_images",
			},
			{
				key: "elements",
				control: "text",
				refType: "elements",
				label: "schema_label_elements_hint",
			},
			{
				key: "resolution",
				control: "segmented",
				options: RESOLUTION_1K_2K_4K,
				default: "1K",
				label: "schema_label_resolution",
			},
			{
				key: "result_type",
				control: "segmented",
				options: RESULT_TYPE,
				default: "single",
				label: "schema_label_result_type",
			},
			{
				key: "num_images",
				control: "number",
				min: 1,
				max: 9,
				default: 1,
				label: "schema_label_num_images",
				showWhen: { param: "result_type", value: "single" },
			},
			{
				key: "series_amount",
				control: "number",
				min: 2,
				max: 9,
				default: 2,
				label: "schema_label_series_amount",
				showWhen: { param: "result_type", value: "series" },
			},
			{
				key: "aspect_ratio",
				control: "icon-select",
				options: ASPECT_KLING_O3_I2I,
				default: "auto",
				label: "schema_label_aspect_ratio",
			},
			{
				key: "output_format",
				control: "select",
				options: OUTPUT_FORMAT,
				default: "png",
				label: "schema_label_output_format",
			},
		],
		allowedParams: [
			"prompt",
			"image_urls",
			"elements",
			"resolution",
			"result_type",
			"num_images",
			"series_amount",
			"aspect_ratio",
			"output_format",
		],
		conditionalParams: [
			{
				param: "num_images",
				showWhen: { param: "result_type", value: "single" },
			},
			{
				param: "series_amount",
				showWhen: { param: "result_type", value: "series" },
			},
		],
		maxPromptLength: 2500,
		sortOrder: 4,
	},

	// ─── Model 5: xAI Grok Imagine Image — Text-to-Image ────────────────────────
	{
		schemaId: "grok-t2i",
		name: "Grok Imagine — Text-to-Image",
		nameTranslationKey: "image_generator.models.grok_t2i",
		modelId: "xai/grok-imagine-image",
		type: "t2i" as const,
		creditActionType: "image_generation_grok_t2i",
		capabilities: {},
		params: [
			{
				key: "prompt",
				control: "text",
				maxLength: 8000,
				label: "schema_label_prompt",
			},
			{
				key: "num_images",
				control: "number",
				min: 1,
				max: 4,
				default: 1,
				label: "schema_label_num_images",
			},
			{
				key: "aspect_ratio",
				control: "icon-select",
				options: ASPECT_GROK_13,
				default: "1:1",
				label: "schema_label_aspect_ratio",
			},
			{
				key: "output_format",
				control: "select",
				options: OUTPUT_FORMAT,
				default: "jpeg",
				label: "schema_label_output_format",
			},
		],
		allowedParams: ["prompt", "num_images", "aspect_ratio", "output_format"],
		maxPromptLength: 8000,
		sortOrder: 5,
	},

	// ─── Model 6: xAI Grok Imagine Image Edit — Image-to-Image ───────────────────
	{
		schemaId: "grok-i2i",
		name: "Grok Imagine — Image-to-Image",
		nameTranslationKey: "image_generator.models.grok_i2i",
		modelId: "xai/grok-imagine-image/edit",
		type: "i2i" as const,
		creditActionType: "image_edit_grok",
		capabilities: {},
		params: [
			{
				key: "prompt",
				control: "text",
				maxLength: 8000,
				label: "schema_label_prompt",
			},
			{
				key: "image_url",
				control: "text",
				refType: "single",
				label: "schema_label_reference_image",
			},
			{
				key: "num_images",
				control: "number",
				min: 1,
				max: 4,
				default: 1,
				label: "schema_label_num_images",
			},
			{
				key: "output_format",
				control: "select",
				options: OUTPUT_FORMAT,
				default: "jpeg",
				label: "schema_label_output_format",
			},
		],
		allowedParams: ["prompt", "image_url", "num_images", "output_format"],
		maxPromptLength: 8000,
		sortOrder: 6,
	},

	// ─── Model 7: Nano Banana Pro — Text-to-Image ────────────────────────────────
	{
		schemaId: "nano-banana-pro-t2i",
		name: "Nano Banana Pro — Text-to-Image",
		nameTranslationKey: "image_generator.models.nano_banana_t2i",
		modelId: "fal-ai/nano-banana-pro",
		type: "t2i" as const,
		creditActionType: "image_generation_nano_banana",
		badges: ["PRO"],
		capabilities: {
			maxResolution: "4K",
			aspectAuto: true,
		},
		params: [
			{
				key: "prompt",
				control: "text",
				minLength: 3,
				maxLength: 50000,
				label: "schema_label_prompt",
			},
			{
				key: "num_images",
				control: "number",
				min: 1,
				max: 4,
				default: 1,
				label: "schema_label_num_images",
			},
			{
				key: "seed",
				control: "number",
				label: "schema_label_seed",
				advanced: true,
			},
			{
				key: "aspect_ratio",
				control: "icon-select",
				options: ASPECT_NANO_11,
				default: "1:1",
				label: "schema_label_aspect_ratio",
			},
			{
				key: "output_format",
				control: "select",
				options: OUTPUT_FORMAT,
				default: "png",
				label: "schema_label_output_format",
			},
			{
				key: "safety_tolerance",
				control: "select",
				options: SAFETY_TOLERANCE,
				default: "4",
				label: "schema_label_safety_tolerance",
			},
			{
				key: "resolution",
				control: "segmented",
				options: RESOLUTION_1K_2K_4K,
				default: "1K",
				label: "schema_label_resolution",
			},
			{
				key: "limit_generations",
				control: "toggle",
				default: false,
				label: "schema_label_limit_generations",
				advanced: true,
			},
			{
				key: "enable_web_search",
				control: "toggle",
				default: false,
				label: "schema_label_enable_web_search",
			},
		],
		allowedParams: [
			"prompt",
			"num_images",
			"seed",
			"aspect_ratio",
			"output_format",
			"safety_tolerance",
			"resolution",
			"limit_generations",
			"enable_web_search",
		],
		maxPromptLength: 50000,
		sortOrder: 7,
	},

	// ─── Model 8: Nano Banana Pro — Image-to-Image ───────────────────────────────
	{
		schemaId: "nano-banana-pro-i2i",
		name: "Nano Banana Pro — Image-to-Image",
		nameTranslationKey: "image_generator.models.nano_banana_i2i",
		modelId: "fal-ai/nano-banana-pro/edit",
		type: "i2i" as const,
		creditActionType: "image_edit_nano_banana",
		badges: ["PRO"],
		capabilities: {
			multiImage: true,
			maxResolution: "4K",
			aspectAuto: true,
		},
		params: [
			{
				key: "prompt",
				control: "text",
				minLength: 3,
				maxLength: 50000,
				label: "schema_label_prompt",
			},
			{
				key: "image_urls",
				control: "text",
				refType: "multi",
				label: "schema_label_reference_images",
			},
			{
				key: "num_images",
				control: "number",
				min: 1,
				max: 4,
				default: 1,
				label: "schema_label_num_images",
			},
			{
				key: "seed",
				control: "number",
				label: "schema_label_seed",
				advanced: true,
			},
			{
				key: "aspect_ratio",
				control: "icon-select",
				options: ASPECT_NANO_11,
				default: "auto",
				label: "schema_label_aspect_ratio",
			},
			{
				key: "output_format",
				control: "select",
				options: OUTPUT_FORMAT,
				default: "png",
				label: "schema_label_output_format",
			},
			{
				key: "safety_tolerance",
				control: "select",
				options: SAFETY_TOLERANCE,
				default: "4",
				label: "schema_label_safety_tolerance",
			},
			{
				key: "resolution",
				control: "segmented",
				options: RESOLUTION_1K_2K_4K,
				default: "1K",
				label: "schema_label_resolution",
			},
			{
				key: "limit_generations",
				control: "toggle",
				default: false,
				label: "schema_label_limit_generations",
				advanced: true,
			},
			{
				key: "enable_web_search",
				control: "toggle",
				default: false,
				label: "schema_label_enable_web_search",
			},
		],
		allowedParams: [
			"prompt",
			"image_urls",
			"num_images",
			"seed",
			"aspect_ratio",
			"output_format",
			"safety_tolerance",
			"resolution",
			"limit_generations",
			"enable_web_search",
		],
		maxPromptLength: 50000,
		sortOrder: 8,
	},

	// ─── Model 9: Nano Banana 2 — Text-to-Image ────────────────────────────────
	{
		schemaId: "nano-banana-2-t2i",
		name: "Nano Banana 2 — Text-to-Image",
		nameTranslationKey: "image_generator.models.nano_banana_2_t2i",
		modelId: "fal-ai/nano-banana-2",
		type: "t2i" as const,
		creditActionType: "image_generation_nano_banana_2",
		badges: ["NEW"],
		capabilities: {
			maxResolution: "4K",
			aspectAuto: true,
		},
		params: [
			{
				key: "prompt",
				control: "text",
				minLength: 3,
				maxLength: 50000,
				label: "schema_label_prompt",
			},
			{
				key: "num_images",
				control: "number",
				min: 1,
				max: 4,
				default: 1,
				label: "schema_label_num_images",
			},
			{
				key: "seed",
				control: "number",
				label: "schema_label_seed",
				advanced: true,
			},
			{
				key: "aspect_ratio",
				control: "icon-select",
				options: ASPECT_NANO_11,
				default: "auto",
				label: "schema_label_aspect_ratio",
			},
			{
				key: "output_format",
				control: "select",
				options: OUTPUT_FORMAT,
				default: "png",
				label: "schema_label_output_format",
			},
			{
				key: "safety_tolerance",
				control: "select",
				options: SAFETY_TOLERANCE,
				default: "4",
				label: "schema_label_safety_tolerance",
			},
			{
				key: "resolution",
				control: "segmented",
				options: RESOLUTION_0_5K_1K_2K_4K,
				default: "1K",
				label: "schema_label_resolution",
			},
			{
				key: "limit_generations",
				control: "toggle",
				default: true,
				label: "schema_label_limit_generations",
				advanced: true,
			},
			{
				key: "enable_web_search",
				control: "toggle",
				default: false,
				label: "schema_label_enable_web_search",
			},
		],
		allowedParams: [
			"prompt",
			"num_images",
			"seed",
			"aspect_ratio",
			"output_format",
			"safety_tolerance",
			"resolution",
			"limit_generations",
			"enable_web_search",
		],
		maxPromptLength: 50000,
		sortOrder: 9,
	},
];

// ─── All 9 creditCosts entries (one per model) ──────────────────────────────
// Pricing from IMAGE-MODELS-ANALYSIS.md:
// - Kling v3/O3: $0.028/image (5 credits)
// - Grok: $0.02/image (4 credits)
// - Nano Banana Pro: $0.15/image (15 credits)
// - Nano Banana 2: $0.08/image (8 credits)

const ALL_CREDIT_COSTS = [
	// Kling v3
	{
		actionType: "image_generation_kling_v3",
		displayName: "Generate Image (Kling v3)",
		credits: 5,
		description: "Generate image using Kling v3",
		category: "image",
		isActive: true,
	},
	{
		actionType: "image_edit_kling_v3",
		displayName: "Edit Image (Kling v3)",
		credits: 5,
		description: "Edit image using Kling v3",
		category: "image",
		isActive: true,
	},
	// Kling O3 (PRO)
	{
		actionType: "image_generation_kling_o3",
		displayName: "Generate Image (Kling O3)",
		credits: 5,
		description: "Generate image using Kling O3 (PRO)",
		category: "image",
		isActive: true,
	},
	{
		actionType: "image_edit_kling_o3",
		displayName: "Edit Image (Kling O3)",
		credits: 5,
		description: "Edit image using Kling O3 (PRO)",
		category: "image",
		isActive: true,
	},
	// Grok
	{
		actionType: "image_generation_grok_t2i",
		displayName: "Generate Image (Grok)",
		credits: 4,
		description: "Generate image using xAI Grok Imagine",
		category: "image",
		isActive: true,
	},
	{
		actionType: "image_edit_grok",
		displayName: "Edit Image (Grok)",
		credits: 4,
		description: "Edit image using xAI Grok Imagine",
		category: "image",
		isActive: true,
	},
	// Nano Banana Pro
	{
		actionType: "image_generation_nano_banana",
		displayName: "Generate Image (Nano Banana Pro)",
		credits: 15,
		description: "Generate image using Nano Banana Pro",
		category: "image",
		isActive: true,
	},
	{
		actionType: "image_edit_nano_banana",
		displayName: "Edit Image (Nano Banana Pro)",
		credits: 15,
		description: "Edit image using Nano Banana Pro",
		category: "image",
		isActive: true,
	},
	// Nano Banana 2 (T2I only; $0.08/image base)
	{
		actionType: "image_generation_nano_banana_2",
		displayName: "Generate Image (Nano Banana 2)",
		credits: 8,
		description: "Generate image using Nano Banana 2",
		category: "image",
		isActive: true,
	},
];

// ─── Seed Mutation ──────────────────────────────────────────────────────────

export const seedAll = internalMutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		let modelsSeeded = 0;
		let creditCostsSeeded = 0;

		// 1. Seed image model schemas
		for (const schema of IMAGE_MODEL_SCHEMAS) {
			// Check if already exists
			const existing = await ctx.db
				.query("imageModelSchemas")
				.withIndex("by_schema_id", (q) => q.eq("schemaId", schema.schemaId))
				.first();

			if (existing) {
				// Update existing
				await ctx.db.patch(existing._id, {
					...schema,
					updatedAt: now,
				});
			} else {
				// Insert new
				await ctx.db.insert("imageModelSchemas", {
					...schema,
					isActive: true,
					createdAt: now,
					updatedAt: now,
				});
				modelsSeeded++;
			}
		}

		// 2. Seed all credit costs (insert or update)
		for (const cost of ALL_CREDIT_COSTS) {
			// Check if already exists
			const existing = await ctx.db
				.query("creditCosts")
				.withIndex("by_action_type", (q) => q.eq("actionType", cost.actionType))
				.first();

			if (existing) {
				// Update existing (in case credits changed)
				await ctx.db.patch(existing._id, {
					...cost,
					updatedAt: now,
				});
			} else {
				// Insert new
				await ctx.db.insert("creditCosts", {
					...cost,
					updatedAt: now,
				});
				creditCostsSeeded++;
			}
		}

		return {
			modelsSeeded,
			creditCostsSeeded,
			totalModels: IMAGE_MODEL_SCHEMAS.length,
			totalCreditCosts: ALL_CREDIT_COSTS.length,
			message: `✅ Seeded ${modelsSeeded} new models, ${creditCostsSeeded} new credit costs. Total: ${IMAGE_MODEL_SCHEMAS.length} models, ${ALL_CREDIT_COSTS.length} credit costs configured.`,
		};
	},
});

/**
 * Clear all image model schemas (for testing/reset).
 */
export const clearAll = internalMutation({
	args: {},
	handler: async (ctx) => {
		const schemas = await ctx.db.query("imageModelSchemas").collect();
		for (const schema of schemas) {
			await ctx.db.delete(schema._id);
		}
		return { deleted: schemas.length };
	},
});

// ─── Image Presets (Sprint 30e.6) ────────────────────────────────────────────

const IMAGE_PRESETS = [
	{
		key: "fast",
		name: "Fast",
		nameTranslationKey: "presets.fast",
		icon: "⚡",
		description: "Quick generation with standard quality",
		descriptionTranslationKey: "presets.fast_desc",
		schemaId: "kling-v3-t2i",
		params: { resolution: "1K", num_images: 1 },
		sortOrder: 1,
	},
	{
		key: "quality",
		name: "Quality",
		nameTranslationKey: "presets.quality",
		icon: "✨",
		description: "Higher resolution for detailed images",
		descriptionTranslationKey: "presets.quality_desc",
		schemaId: "kling-o3-t2i",
		params: { resolution: "2K", num_images: 1 },
		sortOrder: 2,
	},
	{
		key: "cinematic",
		name: "Cinematic",
		nameTranslationKey: "presets.cinematic",
		icon: "🎬",
		description: "Wide aspect ratio for film-like images",
		descriptionTranslationKey: "presets.cinematic_desc",
		schemaId: "kling-o3-t2i",
		params: { resolution: "2K", aspect_ratio: "21:9" },
		sortOrder: 3,
	},
	{
		key: "batch",
		name: "Batch",
		nameTranslationKey: "presets.batch",
		icon: "📦",
		description: "Generate multiple variations at once",
		descriptionTranslationKey: "presets.batch_desc",
		schemaId: "kling-v3-t2i",
		params: { resolution: "1K", num_images: 4 },
		sortOrder: 4,
	},
];

/**
 * Seed image presets (Sprint 30e.6)
 * Run with: npx convex run seed/seedImageModels:seedPresets
 */
export const seedPresets = internalMutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		let presetsSeeded = 0;

		for (const preset of IMAGE_PRESETS) {
			// Check if already exists
			const existing = await ctx.db
				.query("imagePresets")
				.withIndex("by_key", (q) => q.eq("key", preset.key))
				.first();

			if (existing) {
				// Update existing
				await ctx.db.patch(existing._id, {
					...preset,
					updatedAt: now,
				});
			} else {
				// Insert new
				await ctx.db.insert("imagePresets", {
					...preset,
					isActive: true,
					createdAt: now,
					updatedAt: now,
				});
				presetsSeeded++;
			}
		}

		return {
			presetsSeeded,
			totalPresets: IMAGE_PRESETS.length,
			message: `✅ Seeded ${presetsSeeded} new presets. Total: ${IMAGE_PRESETS.length} presets configured.`,
		};
	},
});
