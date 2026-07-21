/**
 * Consumer coverage for the M6 Radix -> Base UI `scroll-area.tsx` migration
 * (docs/migration-base-ui.md). The mission detail page's operations list is
 * one of `scroll-area.tsx`'s three consumers in the repo — this test proves
 * the migrated `ScrollArea` still renders the real operations content
 * (not just the primitive shell) correctly nested inside the scrollable
 * `data-slot="scroll-area-viewport"` element, since the consumer's own
 * scroll-tracking `useEffect` queries that exact selector and reads
 * `scrollHeight`/`scrollTop`/`clientHeight` off it directly.
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
	useRouter: () => ({ push: jest.fn() }),
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
				return [
					{
						_id: "op_1",
						name: "Draft the campaign brief",
						type: "ai",
						status: "completed",
					},
					{
						_id: "op_2",
						name: "Review with legal",
						type: "human",
						status: "pending",
					},
				];
			case "checkpoints.listByMission":
				return [];
			case "operations.getStatsByMission":
				return { completed: 1, total: 2, progress: 50 };
			default:
				return undefined;
		}
	},
	useMutation: () => jest.fn(),
}));

import MissionDetailPage from "@/app/[locale]/dashboard/missions/[missionId]/page";

describe("MissionDetailPage operations list (ScrollArea migrated to Base UI)", () => {
	test("renders real operation rows nested inside the scroll-area viewport", () => {
		render(<MissionDetailPage />);

		const draftOp = screen.getByText("Draft the campaign brief");
		const reviewOp = screen.getByText("Review with legal");
		expect(draftOp).toBeInTheDocument();
		expect(reviewOp).toBeInTheDocument();

		const viewport = document.querySelector(
			'[data-slot="scroll-area-viewport"]',
		);
		expect(viewport).not.toBeNull();
		expect(viewport).toContainElement(draftOp);
		expect(viewport).toContainElement(reviewOp);
	});
});
