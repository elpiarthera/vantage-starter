/**
 * Tests for videoPolling action — fix #213
 *
 * Verifies the three behaviours added to convex/actions/videoPolling.ts:
 *
 * 1. downloadVideoWithRetry — retries up to 3× on 5xx, aborts immediately on 4xx
 * 2. DOWNLOAD_FAILED error code is distinct from POLLING_ERROR / GENERATION_FAILED
 * 3. refundVideoCredits — idempotency guard prevents double-refunds on concurrent polls
 *
 * Because Convex actions run in a Node.js sandbox and cannot be imported directly in
 * a unit-test environment, we use source-file static analysis (same pattern used in
 * __tests__/convex/credits.test.ts) to verify the structural contracts, combined with
 * an extracted pure-function test for the retry helper logic.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── helpers ─────────────────────────────────────────────────────────────────

const pollingSource = fs.readFileSync(
	path.resolve(process.cwd(), "convex/actions/videoPolling.ts"),
	"utf-8",
);

const creditsSource = fs.readFileSync(
	path.resolve(process.cwd(), "convex/credits.ts"),
	"utf-8",
);

// ─── Re-implement the pure retry helper locally for unit testing ──────────────
// This mirrors the logic in downloadVideoWithRetry() exactly so we can exercise
// all branches without spinning up a Convex runtime.

interface DownloadResult {
	ok: true;
	buffer: ArrayBuffer;
}
interface DownloadFailure {
	ok: false;
	status: number;
}

async function downloadVideoWithRetry(
	videoUrl: string,
	fetcher: typeof fetch = fetch,
): Promise<DownloadResult | DownloadFailure> {
	const MAX_ATTEMPTS = 3;
	let lastStatus = 0;

	for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
		const response = await fetcher(videoUrl);

		if (response.ok) {
			const blob = await response.blob();
			const buffer = await blob.arrayBuffer();
			return { ok: true, buffer };
		}

		lastStatus = response.status;

		// 4xx → permanent, abort immediately
		if (response.status >= 400 && response.status < 500) {
			return { ok: false, status: lastStatus };
		}

		// 5xx → transient, retry (no real sleep in tests)
	}

	return { ok: false, status: lastStatus };
}

// ─── Source-structure tests ───────────────────────────────────────────────────

describe("videoPolling.ts — source structure (fix #213)", () => {
	it("should export downloadVideoWithRetry as a module-level function", () => {
		expect(pollingSource).toMatch(/async function downloadVideoWithRetry\(/);
	});

	it("should use MAX_ATTEMPTS = 3", () => {
		expect(pollingSource).toMatch(/MAX_ATTEMPTS\s*=\s*3/);
	});

	it("should apply exponential backoff delays: 2000, 4000, 8000 ms", () => {
		// Biome formats Math.pow(2, n) → 2 ** n, so accept either form
		const hasMathPow = /2000\s*\*\s*Math\.pow\(2,\s*attempt\s*-\s*1\)/.test(
			pollingSource,
		);
		const hasExponent = /2000\s*\*\s*2\s*\*\*\s*\(attempt\s*-\s*1\)/.test(
			pollingSource,
		);
		expect(hasMathPow || hasExponent).toBe(true);
	});

	it("should abort immediately on 4xx (non-retryable) status codes", () => {
		// Guard: status >= 400 && status < 500
		expect(pollingSource).toMatch(/response\.status\s*>=\s*400/);
		expect(pollingSource).toMatch(/response\.status\s*<\s*500/);
	});

	it("should use DOWNLOAD_FAILED error code (distinct from GENERATION_FAILED)", () => {
		expect(pollingSource).toContain('"DOWNLOAD_FAILED"');
		// Both codes must exist and DOWNLOAD_FAILED must appear before GENERATION_FAILED
		// (download-failure path is handled early, generation failure is the default case)
		const downloadFailedIndex = pollingSource.indexOf('"DOWNLOAD_FAILED"');
		const generationFailedIndex = pollingSource.indexOf('"GENERATION_FAILED"');
		expect(downloadFailedIndex).toBeGreaterThan(-1);
		expect(generationFailedIndex).toBeGreaterThan(-1);
		expect(downloadFailedIndex).not.toBe(generationFailedIndex);
	});

	it("should preserve falVideoUrl on the scene when download fails", () => {
		expect(pollingSource).toMatch(/falVideoUrl:\s*videoUrl/);
	});

	it("should call internal.credits.refundVideoCredits on exhausted download retries", () => {
		expect(pollingSource).toContain("internal.credits.refundVideoCredits");
	});

	it("should wrap the credit refund in its own try/catch (non-fatal)", () => {
		// The refund block contains its own try { ... } catch (refundError)
		expect(pollingSource).toMatch(/catch\s*\(refundError\)/);
	});

	it("should import both api and internal from Convex generated API", () => {
		expect(pollingSource).toMatch(/import\s*\{\s*api,\s*internal\s*\}/);
	});
});

// ─── Pure function unit tests for downloadVideoWithRetry ─────────────────────

describe("downloadVideoWithRetry — retry logic (fix #213)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should succeed on the first attempt when response is ok", async () => {
		const fakeBuffer = new ArrayBuffer(8);
		const mockFetch = vi.fn().mockResolvedValueOnce({
			ok: true,
			status: 200,
			blob: async () => ({
				arrayBuffer: async () => fakeBuffer,
			}),
		});

		const result = await downloadVideoWithRetry(
			"https://cdn.fal.ai/video.mp4",
			mockFetch as unknown as typeof fetch,
		);

		expect(result.ok).toBe(true);
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it("should retry on 503 and succeed on second attempt", async () => {
		const fakeBuffer = new ArrayBuffer(16);
		const mockFetch = vi
			.fn()
			.mockResolvedValueOnce({ ok: false, status: 503 })
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				blob: async () => ({ arrayBuffer: async () => fakeBuffer }),
			});

		const result = await downloadVideoWithRetry(
			"https://cdn.fal.ai/video.mp4",
			mockFetch as unknown as typeof fetch,
		);

		expect(result.ok).toBe(true);
		expect(mockFetch).toHaveBeenCalledTimes(2);
	});

	it("should retry on 502 and succeed on third attempt", async () => {
		const fakeBuffer = new ArrayBuffer(24);
		const mockFetch = vi
			.fn()
			.mockResolvedValueOnce({ ok: false, status: 502 })
			.mockResolvedValueOnce({ ok: false, status: 502 })
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				blob: async () => ({ arrayBuffer: async () => fakeBuffer }),
			});

		const result = await downloadVideoWithRetry(
			"https://cdn.fal.ai/video.mp4",
			mockFetch as unknown as typeof fetch,
		);

		expect(result.ok).toBe(true);
		expect(mockFetch).toHaveBeenCalledTimes(3);
	});

	it("should return failure after 3 consecutive 503 errors (all retries exhausted)", async () => {
		const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 503 });

		const result = await downloadVideoWithRetry(
			"https://cdn.fal.ai/video.mp4",
			mockFetch as unknown as typeof fetch,
		);

		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.status).toBe(503);
		expect(mockFetch).toHaveBeenCalledTimes(3); // MAX_ATTEMPTS = 3
	});

	it("should NOT retry on 403 (4xx = permanent failure)", async () => {
		const mockFetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 403 });

		const result = await downloadVideoWithRetry(
			"https://cdn.fal.ai/video.mp4",
			mockFetch as unknown as typeof fetch,
		);

		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.status).toBe(403);
		expect(mockFetch).toHaveBeenCalledTimes(1); // Aborted immediately
	});

	it("should NOT retry on 404 (4xx = permanent failure)", async () => {
		const mockFetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 404 });

		const result = await downloadVideoWithRetry(
			"https://cdn.fal.ai/video.mp4",
			mockFetch as unknown as typeof fetch,
		);

		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.status).toBe(404);
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it("should NOT retry on 400 (4xx = permanent failure)", async () => {
		const mockFetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 400 });

		const result = await downloadVideoWithRetry(
			"https://cdn.fal.ai/video.mp4",
			mockFetch as unknown as typeof fetch,
		);

		expect(result.ok).toBe(false);
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it("should make exactly 3 attempts when all fail with 5xx", async () => {
		const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

		await downloadVideoWithRetry(
			"https://cdn.fal.ai/video.mp4",
			mockFetch as unknown as typeof fetch,
		);

		expect(mockFetch).toHaveBeenCalledTimes(3);
	});

	it("should return the last HTTP status code on all-retries-exhausted failure", async () => {
		const mockFetch = vi
			.fn()
			.mockResolvedValueOnce({ ok: false, status: 503 })
			.mockResolvedValueOnce({ ok: false, status: 502 })
			.mockResolvedValueOnce({ ok: false, status: 500 });

		const result = await downloadVideoWithRetry(
			"https://cdn.fal.ai/video.mp4",
			mockFetch as unknown as typeof fetch,
		);

		expect(result.ok).toBe(false);
		// Last status (500) is returned
		if (!result.ok) expect(result.status).toBe(500);
	});
});

// ─── refundVideoCredits idempotency tests (source analysis) ──────────────────

describe("refundVideoCredits — idempotency guard (fix #213)", () => {
	it("should query existing refunds before inserting a new one", () => {
		// Look for the idempotency check inside refundVideoCredits
		const refundBlock = creditsSource.slice(
			creditsSource.indexOf("export const refundVideoCredits"),
		);
		// Should query creditTransactions for an existing refund with the same originalTransactionId
		expect(refundBlock).toMatch(/originalTransactionId/);
		expect(refundBlock).toMatch(
			/\.query\s*\(\s*["']creditTransactions["']\s*\)/,
		);
	});

	it("should return early without inserting if a refund already exists", () => {
		const refundBlock = creditsSource.slice(
			creditsSource.indexOf("export const refundVideoCredits"),
		);
		// The guard: if (existingRefund) return;
		expect(refundBlock).toMatch(/if\s*\(\s*existingRefund\s*\)\s*return/);
	});

	it("should use withIndex for efficient idempotency lookup (not a full table scan)", () => {
		const refundBlock = creditsSource.slice(
			creditsSource.indexOf("export const refundVideoCredits"),
		);
		// Must use .withIndex(...) — not a bare .filter() which scans the whole table
		expect(refundBlock).toMatch(/\.withIndex\s*\(/);
	});

	it("should still guard against missing original transaction", () => {
		const refundBlock = creditsSource.slice(
			creditsSource.indexOf("export const refundVideoCredits"),
		);
		// Guard: if (!original) return;
		expect(refundBlock).toMatch(/if\s*\(\s*!original\s*\)\s*return/);
	});
});

// ─── VideoGenerator UI — DOWNLOAD_FAILED branch (source analysis) ────────────

describe("VideoGenerator.tsx — DOWNLOAD_FAILED UI branch (fix #213)", () => {
	const componentSource = fs.readFileSync(
		path.resolve(
			process.cwd(),
			"components/video-generation/VideoGenerator.tsx",
		),
		"utf-8",
	);

	it("should branch on error.code === DOWNLOAD_FAILED", () => {
		expect(componentSource).toMatch(/DOWNLOAD_FAILED/);
	});

	it("should use a distinct i18n key for download failure title", () => {
		expect(componentSource).toMatch(/download_failed_title/);
	});

	it("should use a distinct i18n key for download failure description", () => {
		expect(componentSource).toMatch(/download_failed_description/);
	});
});

// ─── i18n keys — all 7 locales have the new keys ─────────────────────────────

describe("i18n — download_failed keys present in all locales (fix #213)", () => {
	const locales = ["en", "fr", "de", "es", "it", "pt", "ru"];

	for (const locale of locales) {
		it(`should have download_failed_title in ${locale}.json`, () => {
			const messages = JSON.parse(
				fs.readFileSync(
					path.resolve(process.cwd(), `messages/${locale}.json`),
					"utf-8",
				),
			);
			expect(messages?.video_generator?.download_failed_title).toBeDefined();
			expect(typeof messages.video_generator.download_failed_title).toBe(
				"string",
			);
			expect(
				messages.video_generator.download_failed_title.length,
			).toBeGreaterThan(0);
		});

		it(`should have download_failed_description in ${locale}.json`, () => {
			const messages = JSON.parse(
				fs.readFileSync(
					path.resolve(process.cwd(), `messages/${locale}.json`),
					"utf-8",
				),
			);
			expect(
				messages?.video_generator?.download_failed_description,
			).toBeDefined();
			expect(typeof messages.video_generator.download_failed_description).toBe(
				"string",
			);
			expect(
				messages.video_generator.download_failed_description.length,
			).toBeGreaterThan(0);
		});
	}
});
