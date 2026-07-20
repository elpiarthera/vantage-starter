/**
 * Coverage for the mcpcn `stat-card` wiring into `MissionStats`.
 *
 * Before this change, `StatCard`/`StatCardSkeleton` were hand-rolled
 * `<div>`s and the four icons were hand-coded inline SVG functions
 * (`IconTarget`, `IconCog`, `IconCheckCircle`, `IconAlertTriangle`) instead
 * of `lucide-react` imports. This test asserts each stat renders through
 * the ported `StatCardItem` block (`data-slot` is not emitted by our local
 * wrapper, so the ported container class `rounded-md`/`rounded-lg` +
 * `bg-card` combination and the four `lucide-react` icons are used instead
 * of local inline SVGs).
 */

import { render, screen } from "@testing-library/react";
import en from "@/messages/en.json";

type Dict = Record<string, unknown>;

function resolve(dict: Dict, ns: string, key: string): string {
	let value: unknown = dict;
	for (const segment of [...ns.split("."), ...key.split(".")]) {
		value = (value as Dict | undefined)?.[segment];
	}
	return typeof value === "string" ? value : key;
}

jest.mock("next-intl", () => ({
	useTranslations:
		(ns: string) => (key: string, vars?: Record<string, unknown>) => {
			const resolved = resolve(en, ns, key);
			if (vars && typeof resolved === "string") {
				return Object.entries(vars).reduce(
					(acc, [k, v]) => acc.replace(`{${k}}`, String(v)),
					resolved,
				);
			}
			return resolved;
		},
}));

const mockStats = {
	total: 12,
	byStatus: { executing: 2, awaiting_checkpoint: 1, completed: 5, failed: 1 },
	byPriority: { urgent: 1 },
};

jest.mock("convex/react", () => ({
	useQuery: () => mockStats,
}));

jest.mock("@/convex/_generated/api", () => ({
	api: { missions: { getStats: "getStats" } },
}));

import { MissionStats } from "@/components/missions/mission-stats";

describe("MissionStats", () => {
	it("renders each stat through the ported StatCardItem block", () => {
		const { container } = render(
			<MissionStats workspaceId={"workspace-1" as never} />,
		);

		expect(screen.getByText("Total Missions")).toBeInTheDocument();
		expect(screen.getByText("12")).toBeInTheDocument();

		// The ported StatCardItem's own base classes always include the
		// `sm:rounded-lg` / `sm:space-y-1` responsive breakpoints (upstream
		// mcpcn class signature) — the pre-change hand-rolled StatCard used
		// no responsive rounding/spacing classes at all.
		const matches = container.innerHTML.match(/sm:rounded-lg/g) ?? [];
		expect(matches.length).toBe(4);
	});

	// Coverage hole found by Eta while gating #56: the assertions above check
	// that "12" appears SOMEWHERE and that there are 4 tiles — never which
	// number sits in which tile. Swapping `value={inProgress}` for
	// `value={completed}` in mission-stats.tsx left the suite fully green, so
	// the dashboard could show the in-progress count under "Completed" with
	// nothing failing. The code shipped is correct; the coverage was not.
	//
	// The four mocked values are deliberately distinct (12 / 3 / 5 / 2) — with
	// two equal values a swap would be undetectable by construction.
	it("puts each value in its own tile — a swap between tiles must fail", () => {
		render(<MissionStats workspaceId={"workspace-1" as never} />);

		const expected: ReadonlyArray<readonly [string, string]> = [
			["Total Missions", "12"],
			["In Progress", "3"],
			["Completed", "5"],
			["Needs Attention", "2"],
		];

		// Anchor read from the real markup, not assumed: `StatCard` renders the
		// label inside a flex `div` and the value as a sibling `<p>`, both direct
		// children of the `StatCardItem` tile — so the tile is the label span's
		// grandparent.
		// Assert the VALUE ELEMENT, never the whole tile. A first version of this
		// test used `toHaveTextContent` on the tile and did NOT catch the swap:
		// that matcher does substring matching over all descendant text, and the
		// trend caption still carried the old number ("3 active"), so the tile
		// contained "3" even while its headline read 5. The probe that proved
		// this was the swap itself — the test only counts once it reddens on it.
		for (const [label, value] of expected) {
			const tile = screen.getByText(label).closest("div")?.parentElement;
			expect(tile).not.toBeNull();
			const headline = tile?.querySelector("p");
			expect(headline?.textContent).toBe(value);
		}
	});

	it("renders lucide-react icons, not hand-coded inline SVG icon functions", () => {
		const { container } = render(
			<MissionStats workspaceId={"workspace-1" as never} />,
		);

		// lucide-react icons always ship `class="lucide lucide-<name>"` — the
		// pre-change inline SVGs (`IconTarget`, `IconCog`, ...) carried no such
		// class.
		const lucideIcons = container.querySelectorAll("svg.lucide");
		expect(lucideIcons.length).toBe(4);
	});
});
