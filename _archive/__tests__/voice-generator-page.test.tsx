/**
 * Tests for Voice Generator page — narration script banner (fix #214)
 *
 * The banner is a read-only reference displayed when the user arrives
 * from the guided flow (tab=record + returnTo + projectId all present).
 * It must NOT appear in standalone usage, and the VoiceGenerator component
 * itself must remain completely untouched.
 *
 * Covers:
 * 1. Banner visible when all 3 guided-flow params are present + script exists
 * 2. Banner hidden when NOT coming from guided flow (no returnTo)
 * 3. Banner hidden when NOT in record mode (tab=generate)
 * 4. Banner hidden when no projectId
 * 5. Banner hidden when project has no approvedNarrationScript
 * 6. Expand/collapse toggle works correctly
 * 7. Script text is user-selectable (select-all)
 * 8. i18n keys exist in all 7 locale files
 * 9. Source-structure assertions: useQuery skips when conditions not met
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useSearchParams } from "next/navigation";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/** @vitest-environment jsdom */

// ─── Mock Next.js navigation ────────────────────────────────────────────────
vi.mock("next/navigation", () => ({
	useRouter: vi.fn(() => ({
		push: vi.fn(),
		replace: vi.fn(),
		back: vi.fn(),
		prefetch: vi.fn(),
	})),
	useSearchParams: vi.fn(),
}));

// ─── Mock next-intl ──────────────────────────────────────────────────────────
vi.mock("next-intl", () => ({
	useTranslations: vi.fn(
		(ns: string) => (key: string) => `${ns}.${key}`,
	),
}));

// ─── Mock Convex useQuery ────────────────────────────────────────────────────
const mockUseQuery = vi.fn();
vi.mock("convex/react", () => ({
	useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

// ─── Mock api.projects.get ───────────────────────────────────────────────────
vi.mock("@/convex/_generated/api", () => ({
	api: {
		projects: {
			get: "api.projects.get",
		},
	},
}));

// ─── Mock VoiceGenerator (the inner component — not under test here) ─────────
vi.mock("@/components/voice-generator", () => ({
	VoiceGenerator: ({ projectId }: { projectId?: string }) => (
		<div data-testid="voice-generator" data-project-id={projectId} />
	),
}));

// Lazy import after mocks
async function getComponent() {
	const mod = await import(
		"@/app/[locale]/tools/voice-generator/page"
	);
	// The default export wraps in Suspense — render inner content function
	return mod.default;
}

function buildSearchParams(params: Record<string, string>) {
	const sp = new URLSearchParams(params);
	return {
		get: (key: string) => sp.get(key),
		toString: () => sp.toString(),
	};
}

const GUIDED_FLOW_SCRIPT = "Welcome to your baby shower! This is a joyful celebration.";

describe("VoiceGeneratorPage — narration script banner (#214)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	// ── 1. Banner visible when all conditions met ───────────────────────────
	it("shows the narration script banner when tab=record + returnTo + projectId + script", async () => {
		(useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue(
			buildSearchParams({
				tab: "record",
				projectId: "proj_123",
				returnTo: "/guided/step-4?projectId=proj_123&returnedFrom=voice-generator",
			}),
		);
		mockUseQuery.mockReturnValue({
			approvedNarrationScript: GUIDED_FLOW_SCRIPT,
		});

		const { default: Page } = await import(
			"@/app/[locale]/tools/voice-generator/page"
		);

		render(<Page />);

		// Banner toggle button must be visible
		await waitFor(() => {
			expect(
				screen.getByRole("button", {
					name: /narration_script/i,
				}),
			).toBeTruthy();
		});
	});

	// ── 2. Banner hidden — no returnTo (standalone usage) ───────────────────
	it("does NOT show the script banner when there is no returnTo param", async () => {
		vi.resetModules();
		const { default: Page } = await import(
			"@/app/[locale]/tools/voice-generator/page"
		);

		(useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue(
			buildSearchParams({
				tab: "record",
				projectId: "proj_123",
				// returnTo intentionally omitted
			}),
		);
		mockUseQuery.mockReturnValue({
			approvedNarrationScript: GUIDED_FLOW_SCRIPT,
		});

		render(<Page />);

		await waitFor(() => {
			expect(screen.queryByText(/narration_script/i)).toBeNull();
		});
	});

	// ── 3. Banner hidden — tab=generate ─────────────────────────────────────
	it("does NOT show the script banner when tab=generate (not record mode)", async () => {
		vi.resetModules();
		const { default: Page } = await import(
			"@/app/[locale]/tools/voice-generator/page"
		);

		(useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue(
			buildSearchParams({
				tab: "generate",
				projectId: "proj_123",
				returnTo: "/guided/step-4?projectId=proj_123",
			}),
		);
		mockUseQuery.mockReturnValue({
			approvedNarrationScript: GUIDED_FLOW_SCRIPT,
		});

		render(<Page />);

		await waitFor(() => {
			expect(screen.queryByText(/narration_script/i)).toBeNull();
		});
	});

	// ── 4. Banner hidden — no projectId ─────────────────────────────────────
	it("does NOT show the script banner when no projectId", async () => {
		vi.resetModules();
		const { default: Page } = await import(
			"@/app/[locale]/tools/voice-generator/page"
		);

		(useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue(
			buildSearchParams({
				tab: "record",
				returnTo: "/guided/step-4",
				// projectId intentionally omitted
			}),
		);
		mockUseQuery.mockReturnValue(null);

		render(<Page />);

		await waitFor(() => {
			expect(screen.queryByText(/narration_script/i)).toBeNull();
		});
	});

	// ── 5. Banner hidden — no approvedNarrationScript in project ────────────
	it("does NOT show the script banner when project has no approvedNarrationScript", async () => {
		vi.resetModules();
		const { default: Page } = await import(
			"@/app/[locale]/tools/voice-generator/page"
		);

		(useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue(
			buildSearchParams({
				tab: "record",
				projectId: "proj_123",
				returnTo: "/guided/step-4?projectId=proj_123",
			}),
		);
		// Project exists but no narration script yet (Step 3b not completed)
		mockUseQuery.mockReturnValue({
			approvedNarrationScript: undefined,
		});

		render(<Page />);

		await waitFor(() => {
			expect(screen.queryByText(/narration_script/i)).toBeNull();
		});
	});

	// ── 6. Expand/collapse toggle ────────────────────────────────────────────
	it("expands the script text on click and collapses on second click", async () => {
		vi.resetModules();
		const { default: Page } = await import(
			"@/app/[locale]/tools/voice-generator/page"
		);

		(useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue(
			buildSearchParams({
				tab: "record",
				projectId: "proj_123",
				returnTo: "/guided/step-4?projectId=proj_123",
			}),
		);
		mockUseQuery.mockReturnValue({
			approvedNarrationScript: GUIDED_FLOW_SCRIPT,
		});

		render(<Page />);

		// Initially collapsed — script text not visible
		await waitFor(() => {
			expect(screen.queryByText(GUIDED_FLOW_SCRIPT)).toBeNull();
		});

		// Click to expand
		const toggleBtn = screen.getByRole("button", { name: /narration_script/i });
		fireEvent.click(toggleBtn);

		// Script text now visible
		await waitFor(() => {
			expect(screen.getByText(GUIDED_FLOW_SCRIPT)).toBeTruthy();
		});

		// Click to collapse
		fireEvent.click(toggleBtn);

		await waitFor(() => {
			expect(screen.queryByText(GUIDED_FLOW_SCRIPT)).toBeNull();
		});
	});
});

// ─── Source-structure assertions ─────────────────────────────────────────────
describe("VoiceGeneratorPage — source structure assertions (#214)", () => {
	const pagePath = path.join(
		process.cwd(),
		"app/[locale]/tools/voice-generator/page.tsx",
	);
	let source: string;

	beforeEach(() => {
		source = fs.readFileSync(pagePath, "utf-8");
	});

	it('skips the Convex query with "skip" when showScriptBanner is false', () => {
		expect(source).toContain('"skip"');
	});

	it("guards useQuery behind showScriptBanner condition", () => {
		expect(source).toContain("showScriptBanner");
		// The query call uses showScriptBanner as its condition
		expect(source).toMatch(/showScriptBanner\s*\?.*projectId.*:.*"skip"/s);
	});

	it("uses api.projects.get — not a new query", () => {
		expect(source).toContain("api.projects.get");
	});

	it("renders banner only when showScriptBanner AND narrationScript are both truthy", () => {
		expect(source).toContain("showScriptBanner && narrationScript");
	});

	it("uses aria-expanded for accessibility", () => {
		expect(source).toContain("aria-expanded");
	});

	it("caps banner height with max-h-48 overflow-y-auto for long scripts", () => {
		expect(source).toContain("max-h-48");
		expect(source).toContain("overflow-y-auto");
	});

	it("uses select-all class so users can easily copy the script", () => {
		expect(source).toContain("select-all");
	});

	it("uses min-h-[44px] touch target for the toggle button", () => {
		expect(source).toContain("min-h-[44px]");
	});

	it("does NOT import anything from VoiceGenerator internals (zero coupling)", () => {
		// Should only import the public VoiceGenerator component, nothing internal
		const internalImports = source.match(
			/from "@\/components\/voice-generator\/(hooks|VoiceRecordingPanel|PremiumTabSystem|CanvasSection)/,
		);
		expect(internalImports).toBeNull();
	});
});

// ─── i18n assertions ─────────────────────────────────────────────────────────
describe("VoiceGeneratorPage — i18n keys (#214)", () => {
	const messagesDir = path.join(process.cwd(), "messages");
	const locales = ["en", "fr", "de", "es", "it", "pt", "ru"];

	for (const locale of locales) {
		it(`${locale}.json has non-empty common.your_narration_script`, () => {
			const filePath = path.join(messagesDir, `${locale}.json`);
			const messages = JSON.parse(fs.readFileSync(filePath, "utf-8"));
			const value = messages?.common?.your_narration_script;
			expect(typeof value).toBe("string");
			expect(value.length).toBeGreaterThan(0);
		});

		it(`${locale}.json has non-empty common.hide_narration_script`, () => {
			const filePath = path.join(messagesDir, `${locale}.json`);
			const messages = JSON.parse(fs.readFileSync(filePath, "utf-8"));
			const value = messages?.common?.hide_narration_script;
			expect(typeof value).toBe("string");
			expect(value.length).toBeGreaterThan(0);
		});
	}
});
