/**
 * Coverage for the mcpcn `date-time-picker` block wired into
 * `BookingSection` (docs/mcpcn-block-mapping.md §4 "date-time-picker",
 * Batch 4 third bullet — the consultant booking surface).
 *
 * TDD assertion this file proves, in the bullet's own words: "selecting a
 * slot from the static config and confirming produces a booking payload
 * carrying the selected start time and timezone, matching the config
 * entry that was clicked." Both fields (start time AND timezone) are
 * asserted below, read out of the rendered confirmation text — never a
 * mocked payload.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
	BOOKING_AVAILABILITY,
	generateAvailableSlots,
} from "@/lib/booking/availability";
import en from "@/messages/en.json";

type Dict = Record<string, unknown>;

function resolve(
	dict: Dict,
	ns: string,
	key: string,
	params?: Record<string, string>,
): string {
	let value: unknown = (dict[ns] as Dict | undefined) ?? {};
	for (const segment of key.split(".")) {
		value = (value as Dict | undefined)?.[segment];
	}
	if (typeof value !== "string") return key;
	if (!params) return value;
	return Object.entries(params).reduce(
		(acc, [k, v]) => acc.replaceAll(`{${k}}`, v),
		value,
	);
}

jest.mock("next-intl", () => ({
	useTranslations:
		(ns: string) => (key: string, params?: Record<string, string>) =>
			resolve(en, ns, key, params),
}));

// A fixed system time, ahead of the declared blocked dates, so slot
// generation is deterministic across runs (RED before GREEN, see below,
// depends on the exact date/time pair this anchor produces).
const FIXED_NOW = new Date(2026, 6, 20, 9, 0, 0); // Monday 2026-07-20 09:00 local

beforeEach(() => {
	jest.useFakeTimers();
	jest.setSystemTime(FIXED_NOW);
});

afterEach(() => {
	jest.useRealTimers();
});

import { BookingSection } from "@/components/consultant/BookingSection";

describe("BookingSection — date-time-picker block", () => {
	test("RED: selecting a slot and confirming produces a payload carrying the selected start time and timezone, matching the clicked config entry", async () => {
		render(<BookingSection />);

		const slots = generateAvailableSlots(BOOKING_AVAILABILITY, FIXED_NOW);
		const clicked = slots[0];

		const dateButton = screen.getByLabelText(`${clicked.date}, available`);
		fireEvent.click(dateButton);

		const timeButton = await screen.findByRole("button", {
			name: clicked.time,
		});
		fireEvent.click(timeButton);

		const nextButton = await screen.findByRole("button", {
			name: en.booking.next,
		});
		fireEvent.click(nextButton);

		await waitFor(() => {
			expect(screen.getByText(en.booking.success_title)).toBeInTheDocument();
		});

		// Both fields the bullet requires, asserted independently: the start
		// time (date + time) AND the timezone, each matching the exact
		// config entry that was clicked — never a value the test invents.
		const description = screen.getByText(
			(_, element) =>
				element?.textContent ===
				resolve(en, "booking", "success_description", {
					date: clicked.date,
					time: clicked.time,
					zone: BOOKING_AVAILABILITY.timezone,
				}),
		);
		expect(description).toBeInTheDocument();
	});

	test("the fixed timezone notice names the configured zone explicitly, before any slot is picked", () => {
		render(<BookingSection />);
		expect(
			screen.getByText(new RegExp(BOOKING_AVAILABILITY.timezone)),
		).toBeInTheDocument();
	});
});
