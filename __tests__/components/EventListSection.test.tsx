/**
 * Coverage for the mcpcn `event-card` / `event-list` blocks wired into
 * `EventListSection` (docs/mcpcn-block-mapping.md §4 "Events", Batch 4
 * fourth bullet).
 */

import { fireEvent, render, screen } from "@testing-library/react";
import en from "@/messages/en.json";

type Dict = Record<string, unknown>;

function resolve(
	dict: Dict,
	ns: string,
	key: string,
	params?: Record<string, string | number>,
): string {
	let value: unknown = (dict[ns] as Dict | undefined) ?? {};
	for (const segment of key.split(".")) {
		value = (value as Dict | undefined)?.[segment];
	}
	if (typeof value !== "string") return key;
	if (!params) return value;
	return Object.entries(params).reduce(
		(acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
		value,
	);
}

jest.mock("next-intl", () => ({
	useTranslations:
		(ns: string) => (key: string, params?: Record<string, string | number>) =>
			resolve(en, ns, key, params),
}));

const mockPush = jest.fn();
jest.mock("@/i18n/routing", () => ({
	useRouter: () => ({ push: mockPush }),
}));

let mockEvents:
	| {
			_id: string;
			slug: string;
			title: string;
			description: string;
			startDateTime: string;
			timezone: string;
			capacity: number;
			registeredCount: number;
	  }[]
	| undefined;

jest.mock("convex/react", () => ({
	useQuery: () => mockEvents,
}));

jest.mock("@/convex/_generated/api", () => ({
	api: { events: { list: "events.list" } },
}));

import { EventListSection } from "@/components/events/EventListSection";

beforeEach(() => {
	jest.clearAllMocks();
	mockEvents = [
		{
			_id: "event_1",
			slug: "underground-techno-night",
			title: "Underground Techno Night",
			description: "Raw, unfiltered techno in a warehouse setting.",
			startDateTime: "2026-08-01T22:00:00-04:00",
			timezone: "America/New_York",
			capacity: 5,
			registeredCount: 1,
		},
	];
});

describe("EventListSection — event-card / event-list blocks", () => {
	test("renders one event-card per returned event and navigates to its detail route on click", () => {
		render(<EventListSection />);

		const card = screen.getByText("Underground Techno Night");
		expect(card).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button"));
		expect(mockPush).toHaveBeenCalledWith("/events/underground-techno-night");
	});

	test("shows an empty state when no events are returned, and no card is offered", () => {
		mockEvents = [];
		render(<EventListSection />);

		expect(screen.getByText(en.events.empty)).toBeInTheDocument();
		expect(screen.queryByRole("button")).not.toBeInTheDocument();
	});
});
