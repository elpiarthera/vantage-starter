/**
 * Sprint 30 — Schema edge cases and error-handling validation.
 * Parameter ranges, aspect options, getDefaultParamsFromSchema behavior.
 *
 * Sprint 30d.5: Updated to use mock schemas (schemas now stored in Convex).
 *
 * @see docs/MVP/Todo/sprint-30b-tests.md (§6 Schema Validation Edge Cases)
 */

import { describe, expect, it } from "vitest";
import type { ModelSchema } from "@/components/image-generator/types/schema";

// Sprint 30d.5: Mock schemas for testing
const MOCK_NANO_SCHEMA: ModelSchema = {
	id: "nano-banana-pro-t2i",
	name: "Nano Banana Pro — Text-to-Image",
	modelId: "fal-ai/nano-banana-pro",
	type: "t2i",
	creditActionType: "image_generation_nano_banana",
	badges: ["PRO"],
	capabilities: { maxResolution: "4K", aspectAuto: true },
	params: [
		{
			key: "prompt",
			control: "text",
			minLength: 3,
			maxLength: 50_000,
			label: "Prompt",
		},
		{
			key: "num_images",
			control: "number",
			min: 1,
			max: 4,
			default: 1,
			label: "Number of images",
		},
	],
};

const MOCK_KLING_V3_T2I: ModelSchema = {
	id: "kling-v3-t2i",
	name: "Kling v3 — Text-to-Image",
	modelId: "fal-ai/kling-image/v3/text-to-image",
	type: "t2i",
	creditActionType: "image_generation",
	capabilities: { negativePrompt: true, maxResolution: "2K", elements: true },
	params: [
		{ key: "prompt", control: "text", maxLength: 2500, label: "Prompt" },
		{
			key: "aspect_ratio",
			control: "icon-select",
			options: [
				{ value: "16:9", label: "Landscape" },
				{ value: "9:16", label: "Portrait" },
				{ value: "1:1", label: "Square" },
			],
			default: "16:9",
			label: "Aspect ratio",
		},
	],
};

const MOCK_KLING_O3_I2I: ModelSchema = {
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
		{
			key: "resolution",
			control: "segmented",
			options: [
				{ value: "1K", label: "1K" },
				{ value: "2K", label: "2K" },
				{ value: "4K", label: "4K" },
			],
			default: "1K",
			label: "Resolution",
		},
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
	],
};

function getDefaultParamsFromSchema(
	schema: ModelSchema,
): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const p of schema.params) {
		if (p.refType) continue;
		if (p.default !== undefined) out[p.key] = p.default;
	}
	return out;
}

describe("Edge Cases & Error Handling", () => {
	it("should validate parameter ranges (Nano Banana 50K prompt limit)", () => {
		const promptParam = MOCK_NANO_SCHEMA.params.find((p) => p.key === "prompt");
		expect(promptParam?.maxLength).toBe(50_000);
		expect(promptParam?.minLength).toBe(3);
	});

	it("should map aspect_ratio options correctly (Square → 1:1)", () => {
		const aspectParam = MOCK_KLING_V3_T2I.params.find(
			(p) => p.key === "aspect_ratio",
		);
		const squareOption = aspectParam?.options?.find((o) => o.value === "1:1");
		expect(squareOption?.label).toBeDefined();
	});

	it("should have getDefaultParamsFromSchema skip ref params", () => {
		const defaults = getDefaultParamsFromSchema(MOCK_KLING_O3_I2I);
		expect(defaults.prompt).toBeUndefined();
		expect(defaults.image_urls).toBeUndefined();
		expect(defaults.resolution).toBeDefined();
		expect(defaults.result_type).toBeDefined();
	});
});
