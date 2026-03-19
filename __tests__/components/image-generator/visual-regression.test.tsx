/**
 * Sprint 30 — Visual regression tests for Image Generator UI.
 * Asserts glass design tokens on FloatingPromptBar and PremiumTabSystem.
 *
 * Sprint 34: Updated class names to match current implementation;
 * added DeviceProvider mock required by PremiumTabSystem.
 *
 * @see docs/MVP/Todo/sprint-30b-tests.md (§5 Visual Regressions Test)
 */

/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FloatingPromptBar } from "@/components/image-generator/FloatingPromptBar";
import { PremiumTabSystem } from "@/components/image-generator/PremiumTabSystem";

vi.mock("next-intl", () => ({
	useTranslations: () => (key: string) => key,
}));

// PremiumTabSystem calls useDevice — mock the DeviceContext
vi.mock("@/contexts/DeviceContext", () => ({
	useDevice: () => ({
		isMobile: false,
		isTablet: false,
		isDesktop: true,
		orientation: "landscape" as const,
	}),
}));

describe("Visual Components", () => {
	it("should render floating glass prompt bar with design tokens", () => {
		render(
			<FloatingPromptBar
				prompt=""
				onPromptChange={vi.fn()}
				onGenerate={vi.fn()}
				creditCost={5}
				canGenerate={true}
			/>,
		);
		const textbox = screen.getByRole("textbox");
		// Current class: backdrop-blur-md (was backdrop-blur-xl in Sprint 30)
		const promptBar = textbox.closest(".backdrop-blur-md");
		expect(promptBar).toBeInTheDocument();
		expect(promptBar).toHaveClass("backdrop-blur-md");
		expect(promptBar).toHaveClass("bg-background/60");
		expect(promptBar).toHaveClass("border-border/50");
	});

	it("should render premium glass tabs with correct styling", () => {
		render(<PremiumTabSystem mode="generate" setMode={vi.fn()} />);
		const tablist = screen.getByRole("tablist");
		const inner = tablist.closest(".backdrop-blur-md");
		expect(inner).toBeInTheDocument();
		expect(inner).toHaveClass("backdrop-blur-md");
		expect(inner).toHaveClass("bg-background/60");
		expect(inner).toHaveClass("border-border/50");
		expect(inner).toHaveClass("rounded-xl");
		expect(inner).toHaveClass("shadow-lg");
	});

	it("should show Generate and Edit tabs with correct labels", () => {
		render(<PremiumTabSystem mode="generate" setMode={vi.fn()} />);
		expect(screen.getByRole("tab", { name: /generate/i })).toBeInTheDocument();
		expect(screen.getByRole("tab", { name: /edit/i })).toBeInTheDocument();
	});
});
