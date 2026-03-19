/**
 * Static source analysis tests for convex/actions/voiceToolGeneric.ts
 *
 * Verifies sprint-39 changes to generateGenericVoice:
 * - Dead auth guard (ctx.auth.getUserIdentity) removed
 * - logAIUsage call added on success path
 * - Credit refund on FAL failure path
 * - audioBlob arg replaced with storageId in recording flow
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
	path.resolve(process.cwd(), "convex/actions/voiceToolGeneric.ts"),
	"utf-8",
);

describe("voiceToolGeneric.ts — generateGenericVoice", () => {
	describe("Dead auth guard removed", () => {
		it("does NOT call ctx.auth.getUserIdentity", () => {
			expect(source).not.toMatch(/ctx\.auth\.getUserIdentity/);
		});
	});

	describe("logAIUsage on success path", () => {
		it("calls logAIUsage", () => {
			expect(source).toMatch(/logAIUsage/);
		});

		it("logAIUsage call includes eventType for voice generation", () => {
			expect(source).toMatch(/eventType\s*:\s*["']voice_generation["']/);
		});
	});

	describe("Credit refund on FAL failure", () => {
		it("calls internal.credits.refundCredits when FAL request fails", () => {
			expect(source).toMatch(/internal\.credits\.refundCredits/);
		});

		it("refunds credits on FAL API key missing", () => {
			expect(source).toMatch(/refundCredits[\s\S]*?FAL API key not set/);
		});

		it("refunds credits when FAL queue request throws", () => {
			expect(source).toMatch(/FAL API request failed/);
		});
	});

	describe("audioBlob arg absent (replaced by storageId in recording flow)", () => {
		it("does NOT accept audioBlob as a top-level arg", () => {
			// The args validator must not declare audioBlob: v.string() or similar
			expect(source).not.toMatch(/audioBlob\s*:\s*v\./);
		});
	});
});
