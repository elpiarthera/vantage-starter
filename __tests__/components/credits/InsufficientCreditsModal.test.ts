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
	});

	test("modal uses semantic color tokens", () => {
		expect(modalSource).toContain("bg-card");
		expect(modalSource).toContain("text-foreground");
		expect(modalSource).toContain("text-muted-foreground");
		expect(modalSource).toContain("border-border");
		expect(modalSource).toContain("text-warning");
	});

	test("modal contains zero raw Tailwind color classes (OKLCH tokens only)", () => {
		expect(modalSource).not.toMatch(
			/\b(amber|gray|orange|red|slate|blue|green)-\d{2,3}\b/,
		);
	});
});
