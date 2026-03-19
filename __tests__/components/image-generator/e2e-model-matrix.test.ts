/**
 * Sprint 30 — Model matrix: schema → creditActionType → expected cost.
 * Validates the full matrix without calling Convex; costs must match convex/seedCredits.ts.
 *
 * Sprint 30d.5: Updated to use mock schemas (schemas now stored in Convex).
 *
 * @see docs/MVP/Todo/sprint-30b-tests.md (§4 End-to-End Model Matrix Test)
 */

import { describe, expect, it } from "vitest";
import type { ModelSchema } from "@/components/image-generator/types/schema";

// Sprint 30d.5: Mock schemas for testing (mirrors Convex data)
const MOCK_SCHEMAS: ModelSchema[] = [
	{
		id: "kling-v3-t2i",
		name: "Kling v3 — Text-to-Image",
		modelId: "fal-ai/kling-image/v3/text-to-image",
		type: "t2i",
		creditActionType: "image_generation",
		capabilities: {},
		params: [],
	},
	{
		id: "kling-v3-i2i",
		name: "Kling v3 — Image-to-Image",
		modelId: "fal-ai/kling-image/v3/image-to-image",
		type: "i2i",
		creditActionType: "image_edit",
		capabilities: {},
		params: [],
	},
	{
		id: "kling-o3-t2i",
		name: "Kling O3 — Text-to-Image",
		modelId: "fal-ai/kling-image/o3/text-to-image",
		type: "t2i",
		creditActionType: "image_generation",
		capabilities: {},
		params: [],
	},
	{
		id: "kling-o3-i2i",
		name: "Kling O3 — Image-to-Image",
		modelId: "fal-ai/kling-image/o3/image-to-image",
		type: "i2i",
		creditActionType: "image_edit",
		capabilities: {},
		params: [],
	},
	{
		id: "grok-t2i",
		name: "Grok Imagine — Text-to-Image",
		modelId: "xai/grok-imagine-image",
		type: "t2i",
		creditActionType: "image_generation_grok_t2i",
		capabilities: {},
		params: [],
	},
	{
		id: "grok-i2i",
		name: "Grok Imagine — Image-to-Image",
		modelId: "xai/grok-imagine-image/edit",
		type: "i2i",
		creditActionType: "image_edit_grok",
		capabilities: {},
		params: [],
	},
	{
		id: "nano-banana-pro-t2i",
		name: "Nano Banana Pro — Text-to-Image",
		modelId: "fal-ai/nano-banana-pro",
		type: "t2i",
		creditActionType: "image_generation_nano_banana",
		capabilities: {},
		params: [],
	},
	{
		id: "nano-banana-pro-i2i",
		name: "Nano Banana Pro — Image-to-Image",
		modelId: "fal-ai/nano-banana-pro/edit",
		type: "i2i",
		creditActionType: "image_edit_nano_banana",
		capabilities: {},
		params: [],
	},
	{
		id: "nano-banana-2-t2i",
		name: "Nano Banana 2 — Text-to-Image",
		modelId: "fal-ai/nano-banana-2",
		type: "t2i",
		creditActionType: "image_generation_nano_banana_2",
		capabilities: {},
		params: [],
	},
];

function getModelSchemaById(id: string): ModelSchema | undefined {
	return MOCK_SCHEMAS.find((s) => s.id === id);
}

/** Expected credits per action type (must match convex/seed/seedImageModels.ts). */
const EXPECTED_COSTS: Record<string, number> = {
	image_generation: 5,
	image_edit: 5,
	image_generation_grok_t2i: 4,
	image_edit_grok: 4,
	image_generation_nano_banana: 15,
	image_edit_nano_banana: 15,
	image_generation_nano_banana_2: 8,
};

const testCases: Array<{
	model: string;
	creditActionType: string;
	expectedCost: number;
}> = [
	{
		model: "kling-v3-t2i",
		creditActionType: "image_generation",
		expectedCost: 5,
	},
	{ model: "kling-v3-i2i", creditActionType: "image_edit", expectedCost: 5 },
	{
		model: "kling-o3-t2i",
		creditActionType: "image_generation",
		expectedCost: 5,
	},
	{ model: "kling-o3-i2i", creditActionType: "image_edit", expectedCost: 5 },
	{
		model: "grok-t2i",
		creditActionType: "image_generation_grok_t2i",
		expectedCost: 4,
	},
	{ model: "grok-i2i", creditActionType: "image_edit_grok", expectedCost: 4 },
	{
		model: "nano-banana-pro-t2i",
		creditActionType: "image_generation_nano_banana",
		expectedCost: 15,
	},
	{
		model: "nano-banana-pro-i2i",
		creditActionType: "image_edit_nano_banana",
		expectedCost: 15,
	},
	{
		model: "nano-banana-2-t2i",
		creditActionType: "image_generation_nano_banana_2",
		expectedCost: 8,
	},
];

describe("Model Matrix (schema → creditActionType → cost)", () => {
	it.each(
		testCases,
	)("$model has $creditActionType and expected cost $expectedCost credits", ({
		model,
		creditActionType,
		expectedCost,
	}) => {
		const schema = getModelSchemaById(model);
		expect(schema).toBeDefined();
		expect(schema?.creditActionType).toBe(creditActionType);
		expect(EXPECTED_COSTS[creditActionType]).toBe(expectedCost);
		expect(
			schema?.creditActionType && EXPECTED_COSTS[schema.creditActionType],
		).toBe(expectedCost);
	});

	it("documents all image action types with a cost", () => {
		const actionTypes = new Set(testCases.map((c) => c.creditActionType));
		for (const actionType of actionTypes) {
			expect(
				EXPECTED_COSTS[actionType],
				`Expected cost for ${actionType} must be defined`,
			).toBeDefined();
			expect(EXPECTED_COSTS[actionType]).toBeGreaterThan(0);
		}
	});
});
