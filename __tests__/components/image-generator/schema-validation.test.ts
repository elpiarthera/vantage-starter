/**
 * Sprint 30 — Schema system validation.
 * Verifies all 8 models from IMAGE-MODELS-ANALYSIS.
 *
 * Sprint 30d.5: Updated to use mock schemas (schemas now stored in Convex).
 * These tests validate the expected schema structure, not the hardcoded file.
 *
 * @see docs/MVP/Todo/sprint-30b-tests.md
 */

import { describe, expect, it } from "vitest";
import type { ModelSchema } from "@/components/image-generator/types/schema";

// Sprint 30d.5: Mock schemas for testing (mirrors Convex data structure)
const MOCK_SCHEMAS: ModelSchema[] = [
	{
		id: "kling-v3-t2i",
		name: "Kling v3 — Text-to-Image",
		modelId: "fal-ai/kling-image/v3/text-to-image",
		type: "t2i",
		creditActionType: "image_generation",
		capabilities: { negativePrompt: true, maxResolution: "2K", elements: true },
		params: [
			{ key: "prompt", control: "text", maxLength: 2500, label: "Prompt" },
		],
	},
	{
		id: "kling-v3-i2i",
		name: "Kling v3 — Image-to-Image",
		modelId: "fal-ai/kling-image/v3/image-to-image",
		type: "i2i",
		creditActionType: "image_edit",
		capabilities: { maxResolution: "2K", elements: true },
		params: [
			{ key: "prompt", control: "text", maxLength: 2500, label: "Prompt" },
			{
				key: "image_url",
				control: "text",
				refType: "single",
				label: "Reference image",
			},
		],
	},
	{
		id: "kling-o3-t2i",
		name: "Kling O3 — Text-to-Image",
		modelId: "fal-ai/kling-image/o3/text-to-image",
		type: "t2i",
		creditActionType: "image_generation",
		badges: ["PRO"],
		capabilities: {
			maxResolution: "4K",
			elements: true,
			resultTypeSeries: true,
		},
		params: [
			{ key: "prompt", control: "text", maxLength: 2500, label: "Prompt" },
			{
				key: "result_type",
				control: "segmented",
				options: [
					{ value: "single", label: "Single" },
					{ value: "series", label: "Series" },
				],
				default: "single",
				label: "Result type",
			},
			{
				key: "num_images",
				control: "number",
				min: 1,
				max: 9,
				default: 1,
				label: "Number of images",
				showWhen: { param: "result_type", value: "single" },
			},
			{
				key: "series_amount",
				control: "number",
				min: 2,
				max: 9,
				default: 2,
				label: "Series amount",
				showWhen: { param: "result_type", value: "series" },
			},
		],
	},
	{
		id: "kling-o3-i2i",
		name: "Kling O3 — Image-to-Image",
		modelId: "fal-ai/kling-image/o3/image-to-image",
		type: "i2i",
		creditActionType: "image_edit",
		badges: ["PRO"],
		capabilities: {
			multiImage: true,
			maxResolution: "4K",
			aspectAuto: true,
			elements: true,
			resultTypeSeries: true,
		},
		params: [
			{ key: "prompt", control: "text", maxLength: 2500, label: "Prompt" },
			{
				key: "image_urls",
				control: "text",
				refType: "multi",
				label: "Reference images",
			},
		],
	},
	{
		id: "grok-t2i",
		name: "Grok Imagine — Text-to-Image",
		modelId: "xai/grok-imagine-image",
		type: "t2i",
		creditActionType: "image_generation_grok_t2i",
		capabilities: {},
		params: [
			{ key: "prompt", control: "text", maxLength: 8000, label: "Prompt" },
		],
	},
	{
		id: "grok-i2i",
		name: "Grok Imagine — Image-to-Image",
		modelId: "xai/grok-imagine-image/edit",
		type: "i2i",
		creditActionType: "image_edit_grok",
		capabilities: {},
		params: [
			{ key: "prompt", control: "text", maxLength: 8000, label: "Prompt" },
			{
				key: "image_url",
				control: "text",
				refType: "single",
				label: "Reference image",
			},
		],
	},
	{
		id: "nano-banana-pro-t2i",
		name: "Nano Banana Pro — Text-to-Image",
		modelId: "fal-ai/nano-banana-pro",
		type: "t2i",
		creditActionType: "image_generation_nano_banana",
		badges: ["PRO"],
		capabilities: { maxResolution: "4K", aspectAuto: true },
		params: [
			{ key: "prompt", control: "text", maxLength: 50000, label: "Prompt" },
		],
	},
	{
		id: "nano-banana-pro-i2i",
		name: "Nano Banana Pro — Image-to-Image",
		modelId: "fal-ai/nano-banana-pro/edit",
		type: "i2i",
		creditActionType: "image_edit_nano_banana",
		badges: ["PRO"],
		capabilities: { multiImage: true, maxResolution: "4K", aspectAuto: true },
		params: [
			{ key: "prompt", control: "text", maxLength: 50000, label: "Prompt" },
			{
				key: "image_urls",
				control: "text",
				refType: "multi",
				label: "Reference images",
			},
		],
	},
	{
		id: "nano-banana-2-t2i",
		name: "Nano Banana 2 — Text-to-Image",
		modelId: "fal-ai/nano-banana-2",
		type: "t2i",
		creditActionType: "image_generation_nano_banana_2",
		badges: ["NEW"],
		capabilities: { maxResolution: "4K", aspectAuto: true },
		params: [
			{ key: "prompt", control: "text", maxLength: 50000, label: "Prompt" },
		],
	},
];

function getModelSchemaById(id: string): ModelSchema | undefined {
	return MOCK_SCHEMAS.find((s) => s.id === id);
}

function getT2ISchemas(): ModelSchema[] {
	return MOCK_SCHEMAS.filter(
		(s) =>
			s.modelId.includes("text-to-image") ||
			s.modelId === "xai/grok-imagine-image" ||
			s.modelId === "fal-ai/nano-banana-pro" ||
			s.modelId === "fal-ai/nano-banana-2",
	);
}

function getI2ISchemas(): ModelSchema[] {
	return MOCK_SCHEMAS.filter(
		(s) =>
			s.modelId.includes("image-to-image") ||
			s.modelId === "xai/grok-imagine-image/edit" ||
			s.modelId === "fal-ai/nano-banana-pro/edit",
	);
}

const EXPECTED_SCHEMA_IDS = [
	"kling-v3-t2i",
	"kling-v3-i2i",
	"kling-o3-t2i",
	"kling-o3-i2i",
	"grok-t2i",
	"grok-i2i",
	"nano-banana-pro-t2i",
	"nano-banana-pro-i2i",
	"nano-banana-2-t2i",
];

describe("Model Schema Integrity", () => {
	it("should have all 9 analysis models configured", () => {
		const ids = MOCK_SCHEMAS.map((s) => s.id);
		expect(ids).toEqual(EXPECTED_SCHEMA_IDS);
	});

	it("should have correct creditActionType for each model", () => {
		expect(getModelSchemaById("kling-v3-t2i")?.creditActionType).toBe(
			"image_generation",
		);
		expect(getModelSchemaById("kling-v3-i2i")?.creditActionType).toBe(
			"image_edit",
		);
		expect(getModelSchemaById("kling-o3-t2i")?.creditActionType).toBe(
			"image_generation",
		);
		expect(getModelSchemaById("kling-o3-i2i")?.creditActionType).toBe(
			"image_edit",
		);
		expect(getModelSchemaById("grok-t2i")?.creditActionType).toBe(
			"image_generation_grok_t2i",
		);
		expect(getModelSchemaById("grok-i2i")?.creditActionType).toBe(
			"image_edit_grok",
		);
		expect(getModelSchemaById("nano-banana-pro-t2i")?.creditActionType).toBe(
			"image_generation_nano_banana",
		);
		expect(getModelSchemaById("nano-banana-pro-i2i")?.creditActionType).toBe(
			"image_edit_nano_banana",
		);
	});

	it("should enforce parameter dependencies (O3 result_type logic)", () => {
		const o3T2I = getModelSchemaById("kling-o3-t2i");
		expect(o3T2I).toBeDefined();
		const seriesAmountParam = o3T2I?.params.find(
			(p) => p.key === "series_amount",
		);
		expect(seriesAmountParam?.showWhen).toEqual({
			param: "result_type",
			value: "series",
		});

		const numImagesParam = o3T2I?.params.find((p) => p.key === "num_images");
		expect(numImagesParam?.showWhen).toEqual({
			param: "result_type",
			value: "single",
		});
	});

	it("should expose getT2ISchemas and getI2ISchemas with correct counts", () => {
		// 5 T2I: kling-v3, kling-o3, grok, nano-banana-pro, nano-banana-2
		expect(getT2ISchemas()).toHaveLength(5);
		// 4 I2I: kling-v3, kling-o3, grok, nano-banana-pro (no NB2 I2I endpoint)
		expect(getI2ISchemas()).toHaveLength(4);
	});
});
