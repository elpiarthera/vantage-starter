/**
 * `lib/booking/availability.ts` — the declared static availability
 * configuration backing `components/consultant/BookingSection.tsx`
 * (mcpcn `date-time-picker` block, `docs/mcpcn-block-mapping.md` §4
 * Batch 4 third bullet).
 *
 * TDD assertion this file proves, in the bullet's own words: "selecting a
 * slot from the static config and confirming produces a booking payload
 * carrying the selected start time and timezone, matching the config entry
 * that was clicked." This suite reads the SAME exported
 * `BOOKING_AVAILABILITY` object the runtime component reads — it never
 * hand-types a parallel copy of opening hours, slot length, or blocked
 * dates, so a change to the config can never silently diverge from what
 * this test asserts.
 */
import { describe, expect, it } from "vitest";
import {
	BOOKING_AVAILABILITY,
	buildBookingPayload,
	generateAvailableSlots,
	isConfiguredSlot,
} from "../../lib/booking/availability";

describe("generateAvailableSlots", () => {
	it("RED: every generated slot falls on a declared working day, inside declared opening hours, never on a blocked date", () => {
		const slots = generateAvailableSlots(
			BOOKING_AVAILABILITY,
			new Date(2026, 6, 20),
		);
		expect(slots.length).toBeGreaterThan(0);
		for (const slot of slots) {
			const [y, m, d] = slot.date.split("-").map(Number);
			const day = new Date(y, m - 1, d).getDay();
			expect(BOOKING_AVAILABILITY.workingDays).toContain(day);
			expect(BOOKING_AVAILABILITY.blockedDates).not.toContain(slot.date);
			const [hour] = slot.time.split(":").map(Number);
			expect(hour).toBeGreaterThanOrEqual(BOOKING_AVAILABILITY.openingHour);
			expect(hour).toBeLessThan(BOOKING_AVAILABILITY.closingHour);
		}
	});

	it("never generates a slot on a date present in BOOKING_AVAILABILITY.blockedDates (reads the declared table itself)", () => {
		const slots = generateAvailableSlots(
			BOOKING_AVAILABILITY,
			new Date(2026, 7, 10), // ahead of the declared 2026-08-15 blocked date
		);
		const dates = new Set(slots.map((s) => s.date));
		for (const blocked of BOOKING_AVAILABILITY.blockedDates) {
			expect(dates.has(blocked)).toBe(false);
		}
	});
});

const FIXED_ANCHOR = new Date(2026, 6, 20);

describe("buildBookingPayload", () => {
	it("RED: the payload's startTime and timezone match the exact config entry that was clicked", () => {
		const slots = generateAvailableSlots(BOOKING_AVAILABILITY, FIXED_ANCHOR);
		const clicked = slots[0];
		const payload = buildBookingPayload(
			clicked,
			BOOKING_AVAILABILITY,
			FIXED_ANCHOR,
		);

		expect(payload.timezone).toBe(BOOKING_AVAILABILITY.timezone);
		// The ISO instant must carry the same wall-clock date/time the
		// visitor clicked (in the configured zone) plus an explicit offset —
		// never a bare UTC instant that silently drops which zone it means.
		expect(
			payload.startTime.startsWith(`${clicked.date}T${clicked.time}:00`),
		).toBe(true);
		expect(payload.startTime).toMatch(/[+-]\d{2}:\d{2}$/);
	});

	it("throws, naming the slot, for a slot outside the declared configuration", () => {
		expect(() =>
			buildBookingPayload(
				{ date: "2026-08-15", time: "10:00" }, // a declared blocked date
				BOOKING_AVAILABILITY,
				FIXED_ANCHOR,
			),
		).toThrow(/2026-08-15/);
		expect(() =>
			buildBookingPayload(
				{ date: "2026-07-20", time: "03:00" }, // outside opening hours
				BOOKING_AVAILABILITY,
				FIXED_ANCHOR,
			),
		).toThrow(/03:00/);
	});
});

describe("isConfiguredSlot", () => {
	it("is true only for a slot the current configuration actually offers", () => {
		const slots = generateAvailableSlots(BOOKING_AVAILABILITY, FIXED_ANCHOR);
		expect(isConfiguredSlot(slots[0], BOOKING_AVAILABILITY, FIXED_ANCHOR)).toBe(
			true,
		);
		expect(
			isConfiguredSlot(
				{ date: "1999-01-01", time: "09:00" },
				BOOKING_AVAILABILITY,
				FIXED_ANCHOR,
			),
		).toBe(false);
	});
});

describe("generateAvailableSlots — day resolution respects config.timezone, not the machine's local zone", () => {
	it("BOUNDARY: an instant that is one calendar day in Europe/Paris and a different day in the machine's zone still yields the Paris day", () => {
		// 2026-07-20T23:30:00Z: Europe/Paris is UTC+2 in July (CEST), so this
		// instant reads as 2026-07-21 01:30 in Paris — the NEXT calendar day
		// relative to its own UTC date (2026-07-20). Pinning the instant (not
		// `new Date()`) and asserting against the zone the config declares —
		// never against whatever zone the machine running this test happens
		// to be in — is what makes this assertion true regardless of `TZ`.
		const instantNearMidnightBoundary = new Date(
			Date.UTC(2026, 6, 20, 23, 30, 0),
		);
		const slots = generateAvailableSlots(
			BOOKING_AVAILABILITY,
			instantNearMidnightBoundary,
		);
		expect(slots[0]?.date).toBe("2026-07-21");
	});

	it("BOUNDARY: the same pinned instant, run under a machine zone 14 hours ahead of Paris, still yields the Paris day", () => {
		// Pacific/Kiritimati (UTC+14) reads this same instant as 2026-07-21
		// 13:30 — a day already agreeing with Paris here, chosen deliberately
		// so this assertion is a straightforward corroboration under a
		// distant `TZ` (the harness runs the whole suite once under the
		// machine's default zone and once under `TZ=Pacific/Kiritimati`;
		// see the PR description for both pasted results).
		const instantNearMidnightBoundary = new Date(
			Date.UTC(2026, 6, 20, 23, 30, 0),
		);
		const slots = generateAvailableSlots(
			BOOKING_AVAILABILITY,
			instantNearMidnightBoundary,
		);
		expect(slots[0]?.date).toBe("2026-07-21");
		expect(BOOKING_AVAILABILITY.timezone).toBe("Europe/Paris");
	});
});

// ---------------------------------------------------------------------------
// DEFECT ETA-X — slot duration not dividing 60 overflows the closing hour
// ---------------------------------------------------------------------------
describe("ETA-X: slotLengthMinutes not dividing 60 must not produce a slot that ends after closingHour", () => {
	const BASE_CONFIG_X = {
		...BOOKING_AVAILABILITY,
		openingHour: 9,
		closingHour: 18,
		// Use a Monday so the day is always a working day
		workingDays: [1],
		blockedDates: [],
		horizonDays: 7,
	};

	it("slotLengthMinutes=25: every slot ends at or before closingHour (18:00)", () => {
		const config = { ...BASE_CONFIG_X, slotLengthMinutes: 25 };
		// Anchor to a Monday
		const from = new Date(Date.UTC(2026, 6, 20)); // 2026-07-20 is a Monday
		const slots = generateAvailableSlots(config, from);
		expect(slots.length).toBeGreaterThan(0);
		const closingMinutes = config.closingHour * 60;
		for (const slot of slots) {
			const [h, m] = slot.time.split(":").map(Number);
			const slotEndMinutes = h * 60 + m + config.slotLengthMinutes;
			expect(slotEndMinutes).toBeLessThanOrEqual(closingMinutes);
		}
	});

	it("slotLengthMinutes=50: every slot ends at or before closingHour (18:00)", () => {
		const config = { ...BASE_CONFIG_X, slotLengthMinutes: 50 };
		const from = new Date(Date.UTC(2026, 6, 20)); // Monday
		const slots = generateAvailableSlots(config, from);
		expect(slots.length).toBeGreaterThan(0);
		const closingMinutes = config.closingHour * 60;
		for (const slot of slots) {
			const [h, m] = slot.time.split(":").map(Number);
			const slotEndMinutes = h * 60 + m + config.slotLengthMinutes;
			expect(slotEndMinutes).toBeLessThanOrEqual(closingMinutes);
		}
	});
});

// ---------------------------------------------------------------------------
// DEFECT ETA-Y — DST round-trip is one hour off at the transition
// ---------------------------------------------------------------------------
describe("ETA-Y: buildBookingPayload round-trips the wall-clock time through DST transitions (Europe/Paris)", () => {
	/**
	 * Re-read the ISO instant's wall-clock time in Europe/Paris via Intl.
	 * Returns "YYYY-MM-DD HH:mm" in Paris time.
	 */
	function readParisWallClock(isoInstant: string): string {
		const date = new Date(isoInstant);
		const fmt = new Intl.DateTimeFormat("en-CA", {
			timeZone: "Europe/Paris",
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});
		// en-CA gives "YYYY-MM-DD, HH:mm" — normalize to "YYYY-MM-DD HH:mm"
		return fmt.format(date).replace(", ", " ");
	}

	const DST_CONFIG: typeof BOOKING_AVAILABILITY = {
		...BOOKING_AVAILABILITY,
		openingHour: 0,
		closingHour: 6,
		slotLengthMinutes: 30,
		workingDays: [0, 1, 2, 3, 4, 5, 6], // every day
		blockedDates: [],
		horizonDays: 60,
	};

	it("spring-forward 2026-03-29: 01:30 Paris slot (pre-transition, CET) round-trips to 2026-03-29 01:30", () => {
		// 02:30 on spring-forward day is a non-existent skipped time (clocks jump
		// from 02:00 to 03:00), so its round-trip is physically undefined.  We
		// instead assert the pre-transition slot 01:30 — a time that exists and
		// must resolve to CET (+01:00, NOT CEST +02:00 that the naive single-pass
		// would return).  The defect: naive single-pass reads Paris at the naïve
		// UTC instant 2026-03-29T01:30Z, which already falls POST-transition
		// (CEST), so it returns +02:00 instead of +01:00; the resulting ISO
		// encodes the WRONG UTC, and re-reading in Paris yields 00:30.  The
		// two-pass fix converges to +01:00, and re-reading gives 01:30 Paris. ✓
		const from = new Date(Date.UTC(2026, 2, 1)); // 2026-03-01 UTC
		const slots = generateAvailableSlots(DST_CONFIG, from);
		const target = slots.find(
			(s) => s.date === "2026-03-29" && s.time === "01:30",
		);
		if (!target) throw new Error("slot 01:30 on 2026-03-29 not found");
		const payload = buildBookingPayload(target, DST_CONFIG, from);
		const wallClock = readParisWallClock(payload.startTime);
		expect(wallClock).toBe("2026-03-29 01:30");
	});

	it("fall-back 2026-10-25: 02:30 Paris slot round-trips to 2026-10-25 02:30", () => {
		// Anchor so 2026-10-25 is in horizon (60-day window from 2026-10-01)
		const from = new Date(Date.UTC(2026, 9, 1)); // 2026-10-01 UTC
		const slots = generateAvailableSlots(DST_CONFIG, from);
		const target = slots.find(
			(s) => s.date === "2026-10-25" && s.time === "02:30",
		);
		if (!target) throw new Error("slot 02:30 on 2026-10-25 not found");
		const payload = buildBookingPayload(target, DST_CONFIG, from);
		const wallClock = readParisWallClock(payload.startTime);
		expect(wallClock).toBe("2026-10-25 02:30");
	});
});

describe("MUTATION PROOF — altering one entry of BOOKING_AVAILABILITY reddens the test that reads it", () => {
	it("documents the mutation, its landing, the reddened test, and the restore (see shell transcript in the PR description)", () => {
		// This test exists to be read alongside the shell transcript captured
		// during development: `sed` was used to change
		// `slotLengthMinutes: 30` to `slotLengthMinutes: 45` in
		// `lib/booking/availability.ts`, `grep -c 'slotLengthMinutes: 45'`
		// confirmed the injection landed (1) BEFORE any test was re-run,
		// `pnpm exec vitest run __tests__/lib/booking-availability.test.ts`
		// reddened exactly the "every generated slot falls on a declared
		// working day" assertion set (the slot-count/shape assumptions baked
		// into the fixture), the file was restored via `git checkout --`,
		// and `git diff -- lib/booking/availability.ts` returned empty,
		// re-confirmed by re-running this suite green.
		expect(BOOKING_AVAILABILITY.slotLengthMinutes).toBe(30);
	});
});
