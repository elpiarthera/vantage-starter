/**
 * Sprint 30 E2E Image Generator — real FAL API, no UI.
 * 1. T2I: run text-to-image for all 4 T2I models; save first generated image URL.
 * 2. I2I: run image-to-image for all 4 I2I models using that image (no placeholder).
 *
 * Same pattern as test-image-generation.ts: FAL queue.fal.run, FAL_KEY from .env.local.
 *
 * USAGE:
 *   npx tsx tests/ai-language-support/e2e-image-generator-sprint30.ts
 *   npm run e2e:sprint30-image
 *
 * Requires: FAL_KEY in .env.local
 *
 * @see docs/MVP/Todo/sprint-30-image-generator-13022026.md
 * @see convex/configs/falModels.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const FAL_KEY = process.env.FAL_KEY;
const BASE = "https://queue.fal.run";
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 60;

const E2E_PROMPT_T2I =
	"E2E Sprint 30 test: a simple red apple on a white background";
/** I2I must request a visible change so we know the edit ran (not just re-output of input). */
const E2E_PROMPT_I2I =
	"Change the apple to bright pink, keep the same composition and white background.";

// T2I models: endpoint + default params (from modelSchemas, non-ref only)
const T2I_MODELS: Array<{
	id: string;
	endpoint: string;
	defaultParams: Record<string, unknown>;
}> = [
	{
		id: "kling-v3-t2i",
		endpoint: "fal-ai/kling-image/v3/text-to-image",
		defaultParams: {
			prompt: E2E_PROMPT_T2I,
			resolution: "1K",
			num_images: 1,
			aspect_ratio: "16:9",
			output_format: "png",
		},
	},
	{
		id: "kling-o3-t2i",
		endpoint: "fal-ai/kling-image/o3/text-to-image",
		defaultParams: {
			prompt: E2E_PROMPT_T2I,
			resolution: "1K",
			result_type: "single",
			num_images: 1,
			aspect_ratio: "16:9",
			output_format: "png",
		},
	},
	{
		id: "grok-t2i",
		endpoint: "xai/grok-imagine-image",
		defaultParams: {
			prompt: E2E_PROMPT_T2I,
			num_images: 1,
			aspect_ratio: "1:1",
			output_format: "jpeg",
		},
	},
	{
		id: "nano-banana-pro-t2i",
		endpoint: "fal-ai/nano-banana-pro",
		defaultParams: {
			prompt: E2E_PROMPT_T2I,
			num_images: 1,
			aspect_ratio: "1:1",
			output_format: "png",
			safety_tolerance: "4",
			resolution: "1K",
		},
	},
	{
		id: "nano-banana-2-t2i",
		endpoint: "fal-ai/nano-banana-2",
		defaultParams: {
			prompt: E2E_PROMPT_T2I,
			num_images: 1,
			aspect_ratio: "auto",
			output_format: "png",
			safety_tolerance: "4",
			resolution: "1K",
		},
	},
];

// I2I models: endpoint + param shape (image_url vs image_urls)
const I2I_MODELS: Array<{
	id: string;
	endpoint: string;
	useImageUrls: boolean;
	defaultParams: Record<string, unknown>;
}> = [
	{
		id: "kling-v3-i2i",
		endpoint: "fal-ai/kling-image/v3/image-to-image",
		useImageUrls: false,
		defaultParams: {
			prompt: E2E_PROMPT_I2I,
			resolution: "1K",
			num_images: 1,
			output_format: "png",
		},
	},
	{
		id: "kling-o3-i2i",
		endpoint: "fal-ai/kling-image/o3/image-to-image",
		useImageUrls: true,
		defaultParams: {
			prompt: E2E_PROMPT_I2I,
			resolution: "1K",
			result_type: "single",
			num_images: 1,
			aspect_ratio: "auto",
			output_format: "png",
		},
	},
	{
		id: "grok-i2i",
		endpoint: "xai/grok-imagine-image/edit",
		useImageUrls: false,
		defaultParams: {
			prompt: E2E_PROMPT_I2I,
			num_images: 1,
			output_format: "jpeg",
		},
	},
	{
		id: "nano-banana-pro-i2i",
		endpoint: "fal-ai/nano-banana-pro/edit",
		useImageUrls: true,
		defaultParams: {
			prompt: E2E_PROMPT_I2I,
			num_images: 1,
			aspect_ratio: "auto",
			output_format: "png",
			safety_tolerance: "4",
			resolution: "1K",
		},
	},
];

const RESULTS_DIR = path.join(__dirname, "results");
const T2I_IMAGE_FILE = path.join(RESULTS_DIR, "e2e-sprint30-t2i-image.json");

type QueueStatus = {
	status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
	request_id: string;
	status_url?: string;
	response_url?: string;
};

type ImageResult = { images?: Array<{ url: string }> };

function wait(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function submitFal(
	falKey: string,
	endpoint: string,
	payload: Record<string, unknown>,
): Promise<QueueStatus> {
	const res = await fetch(`${BASE}/${endpoint}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Key ${falKey}`,
		},
		body: JSON.stringify(payload),
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`FAL submit ${res.status}: ${text}`);
	}
	return (await res.json()) as QueueStatus;
}

async function pollFal(
	falKey: string,
	statusUrl: string,
	responseUrl: string,
): Promise<ImageResult> {
	for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
		await wait(POLL_INTERVAL_MS);
		const statusRes = await fetch(statusUrl, {
			headers: { Authorization: `Key ${falKey}` },
		});
		if (!statusRes.ok) continue;
		const statusData = (await statusRes.json()) as QueueStatus;
		if (statusData.status === "COMPLETED") {
			const resultRes = await fetch(responseUrl, {
				headers: { Authorization: `Key ${falKey}` },
			});
			if (!resultRes.ok)
				throw new Error(`FAL result fetch: ${resultRes.status}`);
			return (await resultRes.json()) as ImageResult;
		}
		if (statusData.status === "FAILED") throw new Error("FAL job FAILED");
	}
	throw new Error("FAL polling timeout");
}

async function runT2I(falKey: string): Promise<string> {
	console.log("\n--- Phase 1: T2I (4 models) ---\n");
	let firstImageUrl = "";

	for (const model of T2I_MODELS) {
		process.stdout.write(`  ${model.id}... `);
		try {
			const status = await submitFal(
				falKey,
				model.endpoint,
				model.defaultParams,
			);
			if (!status.status_url || !status.response_url) {
				throw new Error("Missing status/response URL");
			}
			const result = await pollFal(
				falKey,
				status.status_url,
				status.response_url,
			);
			const url = result.images?.[0]?.url;
			if (!url) throw new Error("No image in result");
			if (!firstImageUrl) firstImageUrl = url;
			console.log("OK");
		} catch (err) {
			console.log("FAIL:", err instanceof Error ? err.message : err);
		}
		await wait(1000);
	}

	if (!firstImageUrl) {
		throw new Error("No T2I image generated; cannot run I2I.");
	}
	return firstImageUrl;
}

async function runI2I(falKey: string, imageUrl: string): Promise<void> {
	console.log("\n--- Phase 2: I2I (4 models, using T2I image) ---\n");

	for (const model of I2I_MODELS) {
		process.stdout.write(`  ${model.id}... `);
		const params = { ...model.defaultParams };
		if (model.useImageUrls) {
			(params as Record<string, unknown>).image_urls = [imageUrl];
		} else {
			(params as Record<string, unknown>).image_url = imageUrl;
		}
		try {
			const status = await submitFal(falKey, model.endpoint, params);
			if (!status.status_url || !status.response_url) {
				throw new Error("Missing status/response URL");
			}
			await pollFal(falKey, status.status_url, status.response_url);
			console.log("OK");
		} catch (err) {
			console.log("FAIL:", err instanceof Error ? err.message : err);
		}
		await wait(1000);
	}
}

async function main(): Promise<void> {
	if (!FAL_KEY) {
		console.error("❌ FAL_KEY not set. Add FAL_KEY to .env.local");
		process.exit(1);
	}
	console.log("✅ FAL_KEY found");

	if (!fs.existsSync(RESULTS_DIR)) {
		fs.mkdirSync(RESULTS_DIR, { recursive: true });
	}

	console.log("\n🖼️  Sprint 30 E2E Image Generator (T2I → I2I, real FAL API)\n");

	const t2iImageUrl = await runT2I(FAL_KEY);
	fs.writeFileSync(
		T2I_IMAGE_FILE,
		JSON.stringify(
			{
				imageUrl: t2iImageUrl,
				promptT2I: E2E_PROMPT_T2I,
				promptI2I: E2E_PROMPT_I2I,
				generatedAt: new Date().toISOString(),
			},
			null,
			2,
		),
	);
	console.log(`\n📁 T2I image URL saved to ${T2I_IMAGE_FILE}`);

	await runI2I(FAL_KEY, t2iImageUrl);
	console.log("\n✅ E2E Sprint 30 image generator done.\n");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
