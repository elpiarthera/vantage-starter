/**
 * REAL Integration Tests: fal.ai Image Generation
 *
 * These tests actually call the fal.ai API and verify the full flow:
 * - Submit image generation request
 * - Poll for completion
 * - Download and verify image
 *
 * Requirements:
 * - FAL_KEY must be set in .env.local
 * - Tests cost real money ($0.15 for Nano Banana Pro, $0.03 for Seedream)
 *
 * Models (per official docs):
 * - Primary: Nano Banana Pro (Google Gemini 3 Pro Image) - $0.15/image
 *   @see https://fal.ai/models/fal-ai/nano-banana-pro/llms.txt
 * - Fallback: ByteDance Seedream v4 - $0.03/image
 *   @see https://fal.ai/models/fal-ai/bytedance/seedream/v4/text-to-image/llms.txt
 *
 * Run with: npx vitest run __tests__/integration/fal-image-generation.integration.test.ts
 */

import { beforeAll, describe, expect, it } from "vitest";

const FAL_KEY = process.env.FAL_KEY;

const MODELS = {
	primary: "fal-ai/nano-banana-pro",
	fallback: "fal-ai/bytedance/seedream/v4/text-to-image",
};

/**
 * Helper function to call fal.ai API with polling
 * Uses the queue API and polls the status/response URLs returned by the API
 */
async function generateWithFal(
	modelId: string,
	params: Record<string, unknown>,
): Promise<{ images: Array<{ url: string }> }> {
	if (!FAL_KEY) {
		throw new Error("FAL_KEY not configured");
	}

	console.log(
		`[Test] Calling ${modelId} with:`,
		JSON.stringify(params, null, 2),
	);

	// Submit to queue
	const response = await fetch(`https://queue.fal.run/${modelId}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Key ${FAL_KEY}`,
		},
		body: JSON.stringify(params),
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`fal.ai API error: ${response.status} - ${error}`);
	}

	const data = await response.json();
	const { status_url, response_url, request_id } = data;

	console.log(`[Test] Request ID: ${request_id}`);
	console.log(`[Test] Polling for completion...`);

	// Poll for completion using the URLs from the API response
	let attempts = 0;
	const maxAttempts = 60; // 2 minutes max

	while (attempts < maxAttempts) {
		attempts++;
		await new Promise((resolve) => setTimeout(resolve, 2000));

		const statusResponse = await fetch(status_url, {
			headers: { Authorization: `Key ${FAL_KEY}` },
		});

		if (!statusResponse.ok) continue;

		const statusData = await statusResponse.json();

		if (attempts % 5 === 0) {
			console.log(`[Test] Status (attempt ${attempts}): ${statusData.status}`);
		}

		if (statusData.status === "COMPLETED") {
			const resultResponse = await fetch(response_url, {
				headers: { Authorization: `Key ${FAL_KEY}` },
			});

			if (!resultResponse.ok) {
				throw new Error(`Failed to fetch result: ${resultResponse.status}`);
			}

			return await resultResponse.json();
		}

		if (statusData.status === "FAILED") {
			throw new Error(
				`fal.ai generation failed: ${JSON.stringify(statusData)}`,
			);
		}
	}

	throw new Error("fal.ai generation timed out");
}

describe("fal.ai Image Generation - REAL Integration Tests", () => {
	beforeAll(() => {
		if (!FAL_KEY) {
			console.warn("⚠️  FAL_KEY not set. Skipping real integration tests.");
		}
	});

	/**
	 * Test: Nano Banana Pro (Primary Model)
	 * Cost: $0.15 per image
	 *
	 * Parameters per official docs (https://fal.ai/models/fal-ai/nano-banana-pro/llms.txt):
	 * - prompt (required): Text description
	 * - aspect_ratio: "21:9", "16:9", "3:2", "4:3", "5:4", "1:1", "4:5", "3:4", "2:3", "9:16"
	 * - resolution: "1K", "2K", "4K"
	 * - num_images: 1-4
	 * - output_format: "jpeg", "png", "webp"
	 */
	it(
		"should generate image with Nano Banana Pro (Primary Model)",
		{ timeout: 120000 },
		async () => {
			if (!FAL_KEY) {
				console.log("Skipping: FAL_KEY not set");
				return;
			}

			const startTime = Date.now();

			const result = await generateWithFal(MODELS.primary, {
				prompt:
					"A beautiful sunset over a calm ocean, golden light reflecting on the water",
				aspect_ratio: "16:9",
				resolution: "1K",
				num_images: 1,
				output_format: "png",
			});

			const latency = Date.now() - startTime;
			console.log(`[Test] Nano Banana Pro completed in ${latency}ms`);

			// Verify result
			expect(result).toHaveProperty("images");
			expect(result.images.length).toBe(1);
			expect(result.images[0].url).toMatch(/^https?:\/\//);

			// Download and verify image
			const imageResponse = await fetch(result.images[0].url);
			expect(imageResponse.ok).toBe(true);

			const imageBlob = await imageResponse.blob();
			expect(imageBlob.size).toBeGreaterThan(1000);
			expect(imageBlob.type).toContain("image");

			console.log(
				`[Test] ✅ Nano Banana Pro: ${result.images[0].url} (${imageBlob.size} bytes, cost: $0.15)`,
			);
		},
	);

	/**
	 * Test: Seedream v4 (Fallback Model)
	 * Cost: $0.03 per image
	 *
	 * Parameters per official docs (https://fal.ai/models/fal-ai/bytedance/seedream/v4/text-to-image/llms.txt):
	 * - prompt (required): Text description
	 * - image_size: {width, height} or preset like "landscape_16_9"
	 * - num_images: 1-6
	 * - seed: Random seed
	 * - enable_safety_checker: boolean
	 * - enhance_prompt_mode: "standard" or "fast"
	 */
	it(
		"should generate image with Seedream v4 (Fallback Model)",
		{ timeout: 90000 },
		async () => {
			if (!FAL_KEY) {
				console.log("Skipping: FAL_KEY not set");
				return;
			}

			const startTime = Date.now();

			const result = await generateWithFal(MODELS.fallback, {
				prompt: "A dramatic mountain landscape with snow-capped peaks",
				image_size: { width: 1920, height: 1080 },
				num_images: 1,
				enhance_prompt_mode: "fast",
			});

			const latency = Date.now() - startTime;
			console.log(`[Test] Seedream v4 completed in ${latency}ms`);

			// Verify result
			expect(result).toHaveProperty("images");
			expect(result.images.length).toBe(1);
			expect(result.images[0].url).toMatch(/^https?:\/\//);

			// Download and verify image
			const imageResponse = await fetch(result.images[0].url);
			expect(imageResponse.ok).toBe(true);

			const imageBlob = await imageResponse.blob();
			expect(imageBlob.size).toBeGreaterThan(1000);

			console.log(
				`[Test] ✅ Seedream v4: ${result.images[0].url} (${imageBlob.size} bytes, cost: $0.03)`,
			);
		},
	);

	/**
	 * Test: Error handling with invalid API key
	 * Cost: $0 (rejected immediately)
	 */
	it("should reject invalid API key", async () => {
		const response = await fetch(`https://queue.fal.run/${MODELS.primary}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: "Key invalid_key_12345",
			},
			body: JSON.stringify({ prompt: "Test" }),
		});

		expect(response.ok).toBe(false);
		expect([401, 403]).toContain(response.status);

		console.log(`[Test] ✅ Invalid key rejected with ${response.status}`);
	});
});
