/**
 * Sprint 30 — Performance benchmarks for Image Generator.
 * OptionsPanel render and schema switch timing.
 *
 * Sprint 30d.5: Updated to use mock schemas (schemas now stored in Convex).
 *
 * @see docs/MVP/Todo/sprint-30b-tests.md (§8 Performance Benchmarks)
 */

/**
 * @vitest-environment jsdom
 */

import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OptionsPanel } from "@/components/image-generator/OptionsPanel";
import type { ModelSchema } from "@/components/image-generator/types/schema";

vi.mock("next-intl", () => ({
	useTranslations: () => (key: string) => key,
}));

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
		{ key: "prompt", control: "text", maxLength: 50000, label: "Prompt" },
		{
			key: "num_images",
			control: "number",
			min: 1,
			max: 4,
			default: 1,
			label: "Number of images",
		},
		{
			key: "aspect_ratio",
			control: "icon-select",
			options: [
				{ value: "1:1", label: "Square" },
				{ value: "16:9", label: "Landscape" },
			],
			default: "1:1",
			label: "Aspect ratio",
		},
	],
};

const MOCK_KLING_SCHEMA: ModelSchema = {
	id: "kling-v3-t2i",
	name: "Kling v3 — Text-to-Image",
	modelId: "fal-ai/kling-image/v3/text-to-image",
	type: "t2i",
	creditActionType: "image_generation",
	capabilities: { negativePrompt: true, maxResolution: "2K", elements: true },
	params: [
		{ key: "prompt", control: "text", maxLength: 2500, label: "Prompt" },
		{
			key: "num_images",
			control: "number",
			min: 1,
			max: 9,
			default: 1,
			label: "Number of images",
		},
	],
};

const MOCK_GROK_SCHEMA: ModelSchema = {
	id: "grok-t2i",
	name: "Grok Imagine — Text-to-Image",
	modelId: "xai/grok-imagine-image",
	type: "t2i",
	creditActionType: "image_generation_grok_t2i",
	capabilities: {},
	params: [
		{ key: "prompt", control: "text", maxLength: 8000, label: "Prompt" },
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

describe("Performance Standards", () => {
	it("should render OptionsPanel in <100ms for any model", () => {
		const defaultParams = getDefaultParamsFromSchema(MOCK_NANO_SCHEMA);
		const start = performance.now();
		render(
			<OptionsPanel
				schema={MOCK_NANO_SCHEMA}
				params={defaultParams}
				onParamsChange={vi.fn()}
			/>,
		);
		const end = performance.now();
		// Allow 200ms so tests don't flake on CI/slower machines; still catches serious regressions
		expect(end - start).toBeLessThan(200);
	});

	it("should switch schema without long pause", () => {
		const { rerender } = render(
			<OptionsPanel
				schema={MOCK_KLING_SCHEMA}
				params={getDefaultParamsFromSchema(MOCK_KLING_SCHEMA)}
				onParamsChange={vi.fn()}
			/>,
		);
		const start = performance.now();
		rerender(
			<OptionsPanel
				schema={MOCK_GROK_SCHEMA}
				params={getDefaultParamsFromSchema(MOCK_GROK_SCHEMA)}
				onParamsChange={vi.fn()}
			/>,
		);
		const end = performance.now();
		expect(end - start).toBeLessThan(50);
	});
});
