/**
 * Consumer coverage for the M3 Radix -> Base UI `progress.tsx` migration
 * (docs/migration-base-ui.md). The mission detail page is the second of
 * `progress.tsx`'s two consumers in the repo — this test proves the
 * migrated `Progress` wrapper still renders a real `role="progressbar"`
 * with the correct `aria-valuenow` inside the real page component, with
 * the page's own source left untouched.
 */

import { render, screen } from "@testing-library/react";
import en from "@/messages/en.json";

type Dict = Record<string, unknown>;

function resolve(dict: Dict, ns: string, key: string): string {
	const nsDict = dict[ns] as Dict | undefined;
	const value = nsDict?.[key];
	return typeof value === "string" ? value : key;
}

jest.mock("next-intl", () => ({
	useTranslations: (ns: string) => (key: string) => resolve(en, ns, key),
	useFormatter: () => ({
		dateTime: () => "",
		relativeTime: () => "",
	}),
}));

jest.mock("next/navigation", () => ({
	useParams: () => ({ locale: "en", missionId: "mission_1" }),
}));

jest.mock("@/convex/_generated/api", () => ({
	api: {
		missions: { get: "missions.get" },
		operations: {
			listByMission: "operations.listByMission",
			getStatsByMission: "operations.getStatsByMission",
		},
		checkpoints: {
			listByMission: "checkpoints.listByMission",
			approve: "checkpoints.approve",
			reject: "checkpoints.reject",
		},
	},
}));

jest.mock("convex/react", () => ({
	useQuery: (query: string) => {
		switch (query) {
			case "missions.get":
				return {
					_id: "mission_1",
					name: "Launch the Q3 campaign",
					status: "executing",
					progress: 40,
					brief: null,
					objective: null,
				};
			case "operations.listByMission":
				return [];
			case "checkpoints.listByMission":
				return [];
			case "operations.getStatsByMission":
				return { completed: 2, total: 5, progress: 40 };
			default:
				return undefined;
		}
	},
	useMutation: () => jest.fn(),
}));

import MissionDetailPage from "@/app/[locale]/dashboard/missions/[missionId]/page";

describe("MissionDetailPage", () => {
	test("renders the migrated Progress bar with the mission's completion value", () => {
		render(<MissionDetailPage />);

		expect(screen.getByText("Launch the Q3 campaign")).toBeInTheDocument();

		const progressbar = screen.getByRole("progressbar");
		expect(progressbar).toBeInTheDocument();
		expect(progressbar).toHaveAttribute("aria-valuenow", "40");
	});
});
