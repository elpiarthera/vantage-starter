/**
 * Sprint 30 — UI component integration tests for Image Generator.
 * ModelSelector, RefsPanel, OptionsPanel with mocked next-intl.
 *
 * Sprint 30d.5: Updated to use mock schemas instead of hardcoded file imports.
 * Schemas are now stored in Convex and fetched dynamically.
 *
 * @see docs/MVP/Todo/sprint-30b-tests.md (§3 UI Component Integration)
 */

/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ModelSelector } from "@/components/image-generator/ModelSelector";
import { OptionsPanel } from "@/components/image-generator/OptionsPanel";
import { RefsPanel } from "@/components/image-generator/RefsPanel";
import type { ModelSchema } from "@/components/image-generator/types/schema";

vi.mock("next-intl", () => ({
	useTranslations: () => (key: string) => key,
}));

vi.mock("next/image", () => ({
	default: function MockImage({ alt }: { src: string; alt: string }) {
		return <span data-testid="mock-img" role="img" aria-label={alt} />;
	},
}));

// ModelCard calls useCreditCost (Convex hook) — mock to avoid needing ConvexProvider
vi.mock("@/hooks/business-logic/useCredits", () => ({
	useCreditCost: () => ({ cost: null, isLoading: false }),
	useHasEnoughCredits: () => ({
		hasEnough: true,
		required: 0,
		balance: 100,
		isLoading: false,
	}),
}));

// Sprint 30d.5: Mock schemas for testing (mirrors Convex data structure)
const MOCK_T2I_SCHEMAS: ModelSchema[] = [
	{
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
];

const MOCK_I2I_SCHEMAS: ModelSchema[] = [
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
];

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

const mockRef1 = { id: "1", url: "https://example.com/1.png" };
const mockRef2 = { id: "2", url: "https://example.com/2.png" };

describe("Premium UI Components", () => {
	it("should render ModelSelector with all 9 models when open", () => {
		render(
			<ModelSelector
				open={true}
				onOpenChange={vi.fn()}
				selectedSchema={null}
				onSelectSchema={vi.fn()}
				t2iSchemas={MOCK_T2I_SCHEMAS}
				i2iSchemas={MOCK_I2I_SCHEMAS}
			/>,
		);
		expect(screen.getAllByText(/Kling v3/i).length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText(/Kling O3/i).length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText(/Grok/i).length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText(/Nano Banana/i).length).toBeGreaterThanOrEqual(
			1,
		);
	});

	it("should show single vs multi ref UI based on schema", () => {
		const v3I2I = MOCK_I2I_SCHEMAS.find((s) => s.id === "kling-v3-i2i");
		if (!v3I2I) throw new Error("v3 I2I schema not found");
		const { container } = render(
			<RefsPanel
				schema={v3I2I}
				refs={[]}
				onRefsChange={vi.fn()}
				onUpload={vi.fn()}
			/>,
		);
		const dragButtons = container.querySelectorAll(
			'button[aria-label="refs_drag_reorder"]',
		);
		expect(dragButtons.length).toBe(0);

		const o3I2I = MOCK_I2I_SCHEMAS.find((s) => s.id === "kling-o3-i2i");
		if (!o3I2I) throw new Error("o3 I2I schema not found");
		const { container: c2 } = render(
			<RefsPanel
				schema={o3I2I}
				refs={[mockRef1, mockRef2]}
				onRefsChange={vi.fn()}
				onUpload={vi.fn()}
			/>,
		);
		const dragButtonsMulti = c2.querySelectorAll(
			'button[aria-label="refs_drag_reorder"]',
		);
		expect(dragButtonsMulti.length).toBeGreaterThanOrEqual(1);
	});

	it("should show parameter dependencies (O3 result_type) in OptionsPanel", () => {
		const o3T2I = MOCK_T2I_SCHEMAS.find((s) => s.id === "kling-o3-t2i");
		if (!o3T2I) throw new Error("o3 T2I schema not found");
		const defaultParams = getDefaultParamsFromSchema(o3T2I);
		// advancedOnly={false} so primary pill params (num_images) are also rendered,
		// allowing us to test showWhen conditional visibility
		render(
			<OptionsPanel
				schema={o3T2I}
				params={defaultParams}
				onParamsChange={vi.fn()}
				advancedOnly={false}
			/>,
		);
		expect(
			screen.getAllByLabelText(/Number of images/i).length,
		).toBeGreaterThanOrEqual(1);
	});

	it("should show series_amount when result_type is series in OptionsPanel", () => {
		const o3T2I = MOCK_T2I_SCHEMAS.find((s) => s.id === "kling-o3-t2i");
		if (!o3T2I) throw new Error("o3 T2I schema not found");
		const paramsSeries = {
			...getDefaultParamsFromSchema(o3T2I),
			result_type: "series",
		};
		// advancedOnly={false} so series_amount (now a primary pill param) is also rendered
		render(
			<OptionsPanel
				schema={o3T2I}
				params={paramsSeries}
				onParamsChange={vi.fn()}
				advancedOnly={false}
			/>,
		);
		expect(
			screen.getAllByLabelText(/Series amount/i).length,
		).toBeGreaterThanOrEqual(1);
	});
});
