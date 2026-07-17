/**
 * Tests for GitHub issue #186: Insufficient credits modal shows negative
 * "credits needed" and triggers even when user has sufficient balance.
 *
 * Root causes:
 * 1. InsufficientCreditsModal: creditsNeeded = required - available (no clamp)
 *    → displayed negative when available > required
 * 2. VideoGenerator: !deductResult.success opened modal for ANY failure,
 *    not just "Insufficient credits" — so a server error after a refunded
 *    generation would re-open the modal even with 103 credits vs 5 required.
 *
 * Fixes:
 * 1. creditsNeeded = Math.max(0, required - available)
 * 2. Only open modal when deductResult.error === "Insufficient credits"
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

const modalSource = fs.readFileSync(
	path.join(process.cwd(), "components/credits/InsufficientCreditsModal.tsx"),
	"utf-8",
);

const videoGeneratorSource = fs.readFileSync(
	path.join(process.cwd(), "components/video-generation/VideoGenerator.tsx"),
	"utf-8",
);

describe("Issue #186 — InsufficientCreditsModal negative creditsNeeded fix", () => {
	test("creditsNeeded uses Math.max(0, ...) to prevent negative display", () => {
		expect(modalSource).toContain("Math.max(0, required - available)");
		expect(modalSource).not.toMatch(
			/creditsNeeded\s*=\s*required\s*-\s*available(?!\s*\))/,
		);
	});

	test("modal does not use hardcoded slate/gray colors (containers/text)", () => {
		expect(modalSource).not.toContain("bg-slate-");
		expect(modalSource).not.toContain("border-slate-");
		expect(modalSource).not.toContain("text-red-400");
		// Note: text-white kept on amber CTA (intentional), text-gray-900 used for WCAG contrast on amber gradient
	});

	test("modal uses semantic color tokens", () => {
		expect(modalSource).toContain("bg-card");
		expect(modalSource).toContain("text-foreground");
		expect(modalSource).toContain("text-muted-foreground");
		expect(modalSource).toContain("border-border");
		expect(modalSource).toContain("text-destructive");
	});
});

describe("Issue #186 — VideoGenerator modal trigger fix", () => {
	test("modal only opens on Insufficient credits error, not any deduction failure", () => {
		expect(videoGeneratorSource).toContain(
			'deductResult.error === "Insufficient credits"',
		);
	});

	test("raw !deductResult.success no longer unconditionally opens the modal", () => {
		// Count occurrences of the old unsafe pattern
		const unsafePattern =
			/if\s*\(!deductResult\.success\)\s*\{\s*setShowInsufficientCreditsModal\(true\)/g;
		const matches = videoGeneratorSource.match(unsafePattern);
		expect(matches).toBeNull();
	});

	test("both generate and regenerate handlers guard the modal correctly", () => {
		const occurrences = (
			videoGeneratorSource.match(
				/deductResult\.error === "Insufficient credits"/g,
			) || []
		).length;
		// Both handleGenerateVideo and handleRegenerateApproved must be fixed
		expect(occurrences).toBeGreaterThanOrEqual(2);
	});

	test("pre-flight balance check still guards before calling deductCredits", () => {
		// The upfront currentCredits < VIDEO_GENERATION_CREDITS guard must remain
		expect(videoGeneratorSource).toContain(
			"currentCredits < VIDEO_GENERATION_CREDITS",
		);
	});
});
