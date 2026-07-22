/**
 * Coverage for the mcpcn `event-detail` / `event-confirmation` blocks wired
 * into `EventDetailSection` (docs/mcpcn-block-mapping.md §4 "Events",
 * Batch 4 fourth bullet).
 *
 * THE BULLET'S ASSERTION, proved here client-side (the Convex-side half is
 * `__tests__/convex/events.test.ts`): "registering for an event from
 * `event-detail` inserts exactly one `eventRegistrations` row, and
 * `event-confirmation` renders only when that insert has succeeded." The
 * MUTATION PROOF (neutralizing the `if (confirmed)` guard in
 * `EventDetailSection` and observing `renders event-confirmation only on a
 * successful registration` go red) is run from the shell and pasted in the
 * PR body — not re-implemented as a second test file.
 *
 * The three refused states this suite proves are each RENDERED, not merely
 * caught as an error afterward: signed-out, full, already-registered.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
	useLocale: () => "en",
}));

const mockPush = jest.fn();
jest.mock("@/i18n/routing", () => ({
	useRouter: () => ({ push: mockPush }),
}));

let mockUser: { id: string } | null = { id: "user_alice" };
jest.mock("@clerk/nextjs", () => ({
	useUser: () => ({ user: mockUser }),
}));

const mockRegister = jest.fn();
jest.mock("convex/react", () => ({
	useMutation: () => mockRegister,
	useQuery: () => mockEvent,
}));

jest.mock("@/convex/_generated/api", () => ({
	api: {
		events: {
			getBySlug: "events.getBySlug",
			register: "events.register",
		},
	},
}));

let mockEvent:
	| {
			_id: string;
			slug: string;
			title: string;
			description: string;
			agenda: string[];
			startDateTime: string;
			timezone: string;
			capacity: number;
			registeredCount: number;
	  }
	| null
	| undefined;

import { EventDetailSection } from "@/components/events/EventDetailSection";

const BASE_EVENT = {
	_id: "event_1",
	slug: "underground-techno-night",
	title: "Underground Techno Night",
	description: "Raw, unfiltered techno in a warehouse setting.",
	agenda: ["Doors 7pm", "Opening set 8pm", "Headliner 10pm"],
	startDateTime: "2026-08-01T22:00:00-04:00",
	timezone: "America/New_York",
	capacity: 5,
	registeredCount: 1,
};

beforeEach(() => {
	jest.clearAllMocks();
	mockUser = { id: "user_alice" };
	mockEvent = { ...BASE_EVENT };
});

describe("EventDetailSection — event-detail / event-confirmation blocks", () => {
	test("signed-out visitor sees a sign-in prompt, never a register button", () => {
		mockUser = null;
		render(<EventDetailSection slug="underground-techno-night" />);

		expect(screen.getByText(en.events.signed_out)).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: en.events.register }),
		).not.toBeInTheDocument();
	});

	test("a full event shows the full state before any attempt, and register is never called", async () => {
		mockEvent = { ...BASE_EVENT, capacity: 2, registeredCount: 2 };
		render(<EventDetailSection slug="underground-techno-night" />);

		// "Full" appears twice by design: the header badge (always-visible
		// capacity indicator) and the registration-state message — both
		// asserted present, not just one arbitrarily picked.
		expect(screen.getAllByText(en.events.full).length).toBeGreaterThanOrEqual(
			2,
		);
		expect(
			screen.queryByRole("button", { name: en.events.register }),
		).not.toBeInTheDocument();
		expect(mockRegister).not.toHaveBeenCalled();
	});

	test("a duplicate-registration rejection hides the register button and shows already-registered, without a confirmation render", async () => {
		mockRegister.mockRejectedValue(
			new Error("You are already registered for this event."),
		);
		render(<EventDetailSection slug="underground-techno-night" />);

		fireEvent.click(screen.getByRole("button", { name: en.events.register }));

		await waitFor(() => {
			expect(
				screen.getByText(en.events.already_registered),
			).toBeInTheDocument();
		});
		expect(
			screen.queryByRole("button", { name: en.events.register }),
		).not.toBeInTheDocument();
		expect(screen.queryByRole("status", { name: /registered/i })).toBeNull();
	});

	test("RED: renders event-confirmation only on a successful registration", async () => {
		mockRegister.mockResolvedValue({
			success: true,
			registrationId: "reg_1",
		});
		render(<EventDetailSection slug="underground-techno-night" />);

		expect(
			screen.queryByText(en.events.confirmation_heading),
		).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: en.events.register }));

		await waitFor(() => {
			expect(
				screen.getByText(en.events.confirmation_heading),
			).toBeInTheDocument();
		});
		expect(mockRegister).toHaveBeenCalledWith({ eventId: BASE_EVENT._id });
	});

	test("a generic registration failure surfaces an error and never renders the confirmation", async () => {
		mockRegister.mockRejectedValue(new Error("boom"));
		render(<EventDetailSection slug="underground-techno-night" />);

		fireEvent.click(screen.getByRole("button", { name: en.events.register }));

		await waitFor(() => {
			expect(screen.getByText(en.events.error_generic)).toBeInTheDocument();
		});
		expect(
			screen.queryByText(en.events.confirmation_heading),
		).not.toBeInTheDocument();
	});
});
