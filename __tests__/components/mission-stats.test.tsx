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
