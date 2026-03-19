/**
 * Static source analysis tests for convex/actions/voiceProcessing.ts
 *
 * Verifies sprint-39 changes to processRecordedVoice:
 * - Accepts storageId arg (not audioBlob: string)
 * - logAIUsage called on success
 * - Credit refund on storage failure path
 * - No dead ctx.auth.getUserIdentity guard
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
	path.resolve(process.cwd(), "convex/actions/voiceProcessing.ts"),
	"utf-8",
);

describe("voiceProcessing.ts — processRecordedVoice", () => {
	describe("storageId arg (not audioBlob: string)", () => {
		it("declares storageId in args validator", () => {
			expect(source).toMatch(/storageId\s*:\s*v\.id\(/);
		});

		it("does NOT accept audioBlob as a string arg", () => {
			expect(source).not.toMatch(/audioBlob\s*:\s*v\.string\(\)/);
		});
	});

	describe("logAIUsage on success path", () => {
		it("calls logAIUsage", () => {
			expect(source).toMatch(/logAIUsage/);
		});

		it("logAIUsage call includes eventType for voice recording", () => {
			expect(source).toMatch(/eventType\s*:\s*["']voice_recording["']/);
		});
	});

	describe("Credit refund on storage failure", () => {
		it("calls internal.credits.refundCredits", () => {
			expect(source).toMatch(/internal\.credits\.refundCredits/);
		});

		it("refunds on storage retrieval failure", () => {
			expect(source).toMatch(/refundCredits[\s\S]*?storage retrieval failed/i);
		});
	});

	describe("No dead auth guard", () => {
		it("does NOT call ctx.auth.getUserIdentity", () => {
			expect(source).not.toMatch(/ctx\.auth\.getUserIdentity/);
		});
	});
});
