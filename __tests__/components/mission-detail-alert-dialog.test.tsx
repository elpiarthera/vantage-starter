/**
 * Consumer coverage for the M4 Radix -> Base UI `alert-dialog.tsx` migration
 * (docs/migration-base-ui.md). The mission detail page is the first of
 * `alert-dialog.tsx`'s two consumers in the repo (via `CheckpointGate`'s
 * reject flow) — this test proves the migrated wrapper still renders a real
 * `role="alertdialog"` and, critically, that clicking the destructive
 * `AlertDialogAction` still fires the real `reject` mutation handler before
 * the dialog closes, with the page's own source left untouched.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import en from "@/messages/en.json";

// jsdom has no ResizeObserver; the page's ScrollArea (unrelated to this
// AlertDialog migration) reads it on mount. Polyfilled locally rather than
// in jest.setup.ts to keep this out-of-scope fix contained to this suite.
if (typeof globalThis.ResizeObserver === "undefined") {
	class ResizeObserverPolyfill {
		observe() {}
		unobserve() {}
		disconnect() {}
	}
	Object.assign(globalThis, { ResizeObserver: ResizeObserverPolyfill });
}

type Dict = Record<string, unknown>;

function resolve(dict: Dict, ns: string, key: string): string {
	let nsDict: Dict | undefined = dict;
	for (const segment of ns.split(".")) {
		nsDict = nsDict?.[segment] as Dict | undefined;
	}
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

const rejectMock = jest.fn().mockResolvedValue(undefined);
const approveMock = jest.fn().mockResolvedValue(undefined);

jest.mock("convex/react", () => ({
	useQuery: (query: string) => {
		switch (query) {
			case "missions.get":
				return {
					_id: "mission_1",
					name: "Launch the Q3 campaign",
					status: "awaiting_checkpoint",
					progress: 40,
					brief: null,
					objective: null,
				};
			case "operations.listByMission":
				return [
					{
						_id: "op_1",
						name: "Draft the brief",
						type: "ai",
						status: "completed",
					},
				];
			case "checkpoints.listByMission":
				return [
					{
						_id: "checkpoint_1",
						afterOperationId: "op_1",
						description: "Confirm the brief before launch",
						status: "pending",
					},
				];
			case "operations.getStatsByMission":
				return { completed: 1, total: 1, progress: 40 };
			default:
				return undefined;
		}
	},
	useMutation: (ref: unknown) => {
		if (ref === "checkpoints.reject") return rejectMock;
		if (ref === "checkpoints.approve") return approveMock;
		return jest.fn();
	},
}));

import MissionDetailPage from "@/app/[locale]/dashboard/missions/[missionId]/page";

describe("MissionDetailPage (AlertDialog migrated to Base UI)", () => {
	beforeEach(() => {
		rejectMock.mockClear();
		approveMock.mockClear();
	});

	test("opens the reject confirmation as a real alertdialog and fires the real reject mutation on confirm", async () => {
		const user = userEvent.setup();
		render(<MissionDetailPage />);

		const rejectTrigger = screen.getAllByRole("button", {
			name: /reject/i,
		})[0];
		await user.click(rejectTrigger);

		const dialog = await screen.findByRole("alertdialog");
		expect(dialog).toBeInTheDocument();
		expect(screen.getByText("Reject this checkpoint?")).toBeInTheDocument();

		const confirmButton = screen.getByRole("button", {
			name: /permanently fail mission/i,
		});
		await user.click(confirmButton);

		expect(rejectMock).toHaveBeenCalledWith({
			checkpointId: "checkpoint_1",
			rejectionReason: undefined,
		});
	});
});
