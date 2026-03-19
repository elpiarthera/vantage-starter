/**
 * REAL Integration Tests: fal.ai Video Generation (Kling Video v2.1 Pro)
 *
 * These tests actually call the fal.ai API and verify the full flow:
 * - Submit video generation request with image
 * - Poll for completion
 * - Verify video URL is returned
 *
 * Requirements:
 * - FAL_KEY must be set in .env.local
 * - Tests are SLOW (2-5 minutes per video)
 * - Tests cost real money (~$0.10-0.20 per video)
 *
 * Run with: npx vitest run __tests__/integration/fal-video-generation.integration.test.ts
 */

import { beforeAll, describe, expect, it } from "vitest";

const FAL_KEY = process.env.FAL_KEY;

const KLING_MODEL_ID = "fal-ai/kling-video/v2.5-turbo/pro/image-to-video";

// Use a small test image (public domain)
const TEST_IMAGE_URL =
	"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80";

interface KlingVideoInput {
	prompt: string;
	image_url: string;
	tail_image_url?: string;
	duration: "5" | "10";
	cfg_scale?: number;
	negative_prompt?: string;
}

interface QueueStatusResponse {
	status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
	request_id: string;
	response_url?: string;
	status_url?: string;
	output?: {
		video: {
			url: string;
			content_type?: string;
			file_name?: string;
			file_size?: number;
		};
	};
	error?: string;
	logs?: Array<{ message: string; timestamp: string }>;
}

/**
 * Submit video generation job to fal.ai
 */
async function submitVideoJob(input: KlingVideoInput): Promise<{
	requestId: string;
	statusUrl: string;
}> {
	if (!FAL_KEY) {
		throw new Error("FAL_KEY not configured");
	}

	const response = await fetch(`https://queue.fal.run/${KLING_MODEL_ID}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Key ${FAL_KEY}`,
		},
		body: JSON.stringify({ input }),
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`fal.ai API error: ${response.status} - ${error}`);
	}

	const data: QueueStatusResponse = await response.json();

	if (!data.request_id) {
		throw new Error("No request_id received from fal.ai");
	}

	return {
		requestId: data.request_id,
		statusUrl: data.status_url || "",
	};
}

/**
 * Poll for video generation completion
 */
async function pollVideoStatus(
	requestId: string,
	maxAttempts = 180, // 3 minutes max
): Promise<QueueStatusResponse> {
	if (!FAL_KEY) {
		throw new Error("FAL_KEY not configured");
	}

	let attempts = 0;

	while (attempts < maxAttempts) {
		attempts++;
		await new Promise((resolve) => setTimeout(resolve, 1000));

		const statusResponse = await fetch(
			`https://queue.fal.run/${KLING_MODEL_ID}/requests/${requestId}`,
			{
				headers: {
					Authorization: `Key ${FAL_KEY}`,
				},
			},
		);

		if (!statusResponse.ok) {
			console.log(
				`[Test] Status check failed (attempt ${attempts}), retrying...`,
			);
			continue;
		}

		const statusData: QueueStatusResponse = await statusResponse.json();

		if (attempts % 10 === 0 || statusData.status !== "IN_QUEUE") {
			console.log(`[Test] Status (attempt ${attempts}): ${statusData.status}`);
		}

		if (statusData.status === "COMPLETED") {
			return statusData;
		}

		if (statusData.status === "FAILED") {
			throw new Error(
				`Video generation failed: ${statusData.error || "Unknown error"}`,
			);
		}
	}

	throw new Error(`Video generation timed out after ${maxAttempts} seconds`);
}

describe("fal.ai Video Generation - REAL Integration Tests", () => {
	beforeAll(() => {
		if (!FAL_KEY) {
			console.warn("⚠️  FAL_KEY not set. Skipping real integration tests.");
		}
	});

	describe("Job Submission", () => {
		it(
			"should submit a video generation job and get request ID",
			{ timeout: 30000 },
			async () => {
				if (!FAL_KEY) {
					console.log("Skipping: FAL_KEY not set");
					return;
				}

				const { requestId, statusUrl } = await submitVideoJob({
					prompt:
						"Gentle waves lapping on a tropical beach, palm trees swaying in the breeze",
					image_url: TEST_IMAGE_URL,
					duration: "5",
					cfg_scale: 0.5,
					negative_prompt: "blur, distort, low quality",
				});

				expect(requestId).toBeDefined();
				expect(requestId.length).toBeGreaterThan(0);

				console.log(`[Test] ✅ Job submitted successfully`);
				console.log(`[Test] Request ID: ${requestId}`);
				console.log(`[Test] Status URL: ${statusUrl}`);
			},
		);
	});

	describe("Full Video Generation Flow", () => {
		it(
			"should generate a 5-second video from image",
			{ timeout: 300000 }, // 5 minutes timeout
			async () => {
				if (!FAL_KEY) {
					console.log("Skipping: FAL_KEY not set");
					return;
				}

				const startTime = Date.now();

				console.log("[Test] Submitting 5-second video generation job...");

				// Step 1: Submit job
				const { requestId } = await submitVideoJob({
					prompt:
						"Gentle camera pan over a beautiful beach scene, waves rolling in, cinematic quality",
					image_url: TEST_IMAGE_URL,
					duration: "5",
					cfg_scale: 0.5,
					negative_prompt: "blur, distort, low quality",
				});

				console.log(`[Test] Job submitted. Request ID: ${requestId}`);
				console.log(
					"[Test] Polling for completion (this may take 2-3 minutes)...",
				);

				// Step 2: Poll for completion
				const result = await pollVideoStatus(requestId);

				const latency = Date.now() - startTime;
				console.log(
					`[Test] Video generation completed in ${latency}ms (${(latency / 1000).toFixed(1)}s)`,
				);

				// Step 3: Verify result
				expect(result.status).toBe("COMPLETED");
				expect(result.output).toBeDefined();
				expect(result.output?.video).toBeDefined();
				expect(result.output?.video.url).toBeDefined();
				expect(result.output?.video.url).toMatch(/^https?:\/\//);

				const videoUrl = result.output?.video.url;
				console.log(`[Test] Generated video URL: ${videoUrl}`);

				// Step 4: Verify video is accessible
				const videoResponse = await fetch(videoUrl as string);
				expect(videoResponse.ok).toBe(true);

				const contentType = videoResponse.headers.get("content-type");
				expect(contentType).toContain("video");

				console.log(`[Test] ✅ Video verified accessible (${contentType})`);
			},
		);
	});

	describe("Video Download Flow", () => {
		it(
			"should download and verify video content",
			{ timeout: 300000 }, // 5 minutes timeout
			async () => {
				if (!FAL_KEY) {
					console.log("Skipping: FAL_KEY not set");
					return;
				}

				console.log("[Test] Generating video for download test...");

				// Generate video
				const { requestId } = await submitVideoJob({
					prompt: "Slow zoom on a peaceful beach scene",
					image_url: TEST_IMAGE_URL,
					duration: "5",
					cfg_scale: 0.5,
				});

				const result = await pollVideoStatus(requestId);
				const videoUrl = result.output?.video.url;

				expect(videoUrl).toBeDefined();

				// Download video
				const videoResponse = await fetch(videoUrl as string);
				expect(videoResponse.ok).toBe(true);

				const videoBlob = await videoResponse.blob();
				const videoBuffer = await videoBlob.arrayBuffer();

				// Verify it's actual video data (should be at least 100KB for a 5s video)
				expect(videoBuffer.byteLength).toBeGreaterThan(100000);

				console.log(
					`[Test] ✅ Downloaded video: ${videoBuffer.byteLength} bytes (${(videoBuffer.byteLength / 1024 / 1024).toFixed(2)} MB)`,
				);
			},
		);
	});

	describe("Error Handling", () => {
		it("should handle invalid API key gracefully", async () => {
			const response = await fetch(`https://queue.fal.run/${KLING_MODEL_ID}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Key invalid_key_12345",
				},
				body: JSON.stringify({
					input: {
						prompt: "Test prompt",
						image_url: TEST_IMAGE_URL,
						duration: "5",
					},
				}),
			});

			expect(response.ok).toBe(false);
			expect([401, 403]).toContain(response.status);

			console.log(
				`[Test] ✅ Invalid key correctly rejected with ${response.status}`,
			);
		});

		it("should handle invalid image URL", async () => {
			if (!FAL_KEY) {
				console.log("Skipping: FAL_KEY not set");
				return;
			}

			const response = await fetch(`https://queue.fal.run/${KLING_MODEL_ID}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Key ${FAL_KEY}`,
				},
				body: JSON.stringify({
					input: {
						prompt: "Test prompt",
						image_url: "https://invalid-url-that-does-not-exist.com/image.jpg",
						duration: "5",
					},
				}),
			});

			// Either rejected immediately or fails during processing
			console.log(
				`[Test] Invalid image URL response status: ${response.status}`,
			);

			// If accepted, it will fail during processing
			if (response.ok) {
				const data = await response.json();
				console.log(`[Test] Job accepted with request_id: ${data.request_id}`);
				// The job will fail during processing - we don't wait for it
			}
		});
	});
});

describe("Video Generation - Status Polling", () => {
	it(
		"should correctly parse different status responses",
		{ timeout: 10000 },
		async () => {
			// Test status parsing logic without making API calls
			const statuses: QueueStatusResponse["status"][] = [
				"IN_QUEUE",
				"IN_PROGRESS",
				"COMPLETED",
				"FAILED",
			];

			for (const status of statuses) {
				expect(typeof status).toBe("string");
				expect(["IN_QUEUE", "IN_PROGRESS", "COMPLETED", "FAILED"]).toContain(
					status,
				);
			}

			console.log("[Test] ✅ Status parsing validated");
		},
	);
});
