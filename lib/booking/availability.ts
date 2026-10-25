/**
 * `lib/booking/availability.ts` — the declared, static availability
 * configuration backing the consultant booking surface
 * (`docs/mcpcn-block-mapping.md` §4 "date-time-picker", Batch 4 third
 * bullet).
 *
 * This is DATA a customer edits, never constants scattered across a
 * component (`.claude/rules/derive-never-type.md`, `no-hardcoded-business-
 * knowledge` family): opening hours, slot length, working days, and blocked
 * dates all live in the single `BOOKING_AVAILABILITY` object below. Nothing
 * in `components/consultant/BookingSection.tsx` or
 * `app/[locale]/dashboard/consultant/book/page.tsx` hand-types an hour, a
 * slot length, a working day, or a blocked date — every one of those reads
 * this file. A real calendar-integration data source (Google Calendar /
 * Cal.com / etc.) is a separate, later feature — declared out of scope by
 * `docs/mcpcn-block-mapping.md` §4's own "date-time-picker" entry — this
 * file is the whole data source for this bullet.
 *
 * TIMEZONE — the entire difficulty of this feature, stated here rather than
 * left implicit:
 *
 *   `BOOKING_AVAILABILITY.timezone` is the IANA zone the opening hours,
 *   slot length, and blocked dates below are AUTHORED in. Every generated
 *   slot's wall-clock hour (e.g. "14:00") means "14:00 in that zone" — not
 *   the visitor's local time, not UTC. `buildBookingPayload` below is the
 *   ONE function that turns a generated slot into an absolute instant
 *   (an ISO-8601 string with an explicit UTC offset) plus that same
 *   timezone string, so the payload is unambiguous regardless of which
 *   timezone the browser reading it is in.
 *
 *   Consequence spelled out, not left to be discovered by a customer who
 *   missed a meeting: a visitor browsing from a DIFFERENT timezone than
 *   `BOOKING_AVAILABILITY.timezone` sees the exact same wall-clock slot
 *   labels ("9:00", "9:30", ...) that a visitor in the configured zone
 *   sees — this static, v1 configuration does NOT recompute or relabel
 *   slots per-visitor. `components/consultant/BookingSection.tsx` states
 *   this in the UI copy (the `booking.timezone_notice` string, next-intl,
 *   every locale) precisely because the picker's own visual "time zone"
 *   affordance from the upstream mcpcn block could otherwise be read as
 *   "pick your zone and the slots adjust" — they do not, and the UI says
 *   so instead of letting that be found out the hard way.
 *
 *   The DAY SET `generateAvailableSlots` produces is also resolved in
 *   `config.timezone` (via `resolveZonedYMD`, the same `Intl` mechanism
 *   `resolveUtcOffset` uses for hours) — never in the machine's or
 *   browser's local calendar, which would silently shift the horizon
 *   window and the working-day filter by a day for a visitor near a
 *   midnight boundary relative to `config.timezone`. Residual: the
 *   in-browser `from` default (`new Date()`) is still an instant read by
 *   the visitor's own clock, so a visitor whose system clock is
 *   meaningfully wrong sees a horizon computed from that wrong instant —
 *   the same trust boundary any client-clock-anchored feature has, and out
 *   of scope for this static v1 configuration.
 */

export interface AvailabilityConfig {
	/** IANA timezone identifier every hour/slot below is authored in. */
	timezone: string;
	/** 0 (Sunday) .. 6 (Saturday) — days the consultant takes bookings. */
	workingDays: number[];
	/** First bookable hour of the working day, in `timezone`, 24h clock. */
	openingHour: number;
	/** First hour that is no longer bookable, in `timezone`, 24h clock. */
	closingHour: number;
	/** Minutes per bookable slot. */
	slotLengthMinutes: number;
	/** ISO `YYYY-MM-DD` dates (in `timezone`) that are never bookable, even
	 * on an otherwise-working day (public holidays, planned time off). */
	blockedDates: string[];
	/** How many calendar days ahead slots are generated for. */
	horizonDays: number;
}

/**
 * The one declared configuration. Edit THIS object to change opening
 * hours, slot length, working days, or blocked dates — never a component.
 */
export const BOOKING_AVAILABILITY: AvailabilityConfig = {
	timezone: "Europe/Paris",
	workingDays: [1, 2, 3, 4, 5], // Monday - Friday
	openingHour: 9,
	closingHour: 18,
	slotLengthMinutes: 30,
	blockedDates: [
		"2026-08-15", // Assumption de Marie (FR public holiday)
		"2026-12-25", // Christmas
	],
	horizonDays: 21,
};

/** One bookable slot, as generated from `BOOKING_AVAILABILITY`. */
export interface AvailabilitySlot {
	/** `YYYY-MM-DD`, a calendar date in `BOOKING_AVAILABILITY.timezone`. */
	date: string;
	/** `HH:mm`, a wall-clock time in `BOOKING_AVAILABILITY.timezone`. */
	time: string;
}

/** The payload produced when a visitor confirms a slot. */
export interface BookingPayload {
	/** ISO-8601 instant, carrying the UTC offset of `timezone` at that date
	 * (correct across DST transitions — never a fixed offset constant). */
	startTime: string;
	/** The IANA timezone the slot was authored in and expressed against. */
	timezone: string;
}

function pad(n: number): string {
	return n.toString().padStart(2, "0");
}

/** The calendar date (year/month/day) `instant` falls on WHEN READ IN
 * `timezone` — the same `Intl`-based mechanism `resolveUtcOffset` already
 * uses for hours, applied here to days. Never derived from the machine's
 * (or browser's) local calendar, which is what `Date.getFullYear()` /
 * `getMonth()` / `getDate()` read and is a DIFFERENT date than `timezone`'s
 * near a day boundary. */
function resolveZonedYMD(
	instant: Date,
	timezone: string,
): { year: number; month: number; day: number } {
	const formatter = new Intl.DateTimeFormat("en-US", {
		timeZone: timezone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
	const parts = Object.fromEntries(
		formatter.formatToParts(instant).map((p) => [p.type, p.value]),
	);
	return {
		year: Number(parts.year),
		month: Number(parts.month),
		day: Number(parts.day),
	};
}

/**
 * Every slot the configured availability produces over its `horizonDays`
 * window, reading ONLY `config` (defaults to the declared
 * `BOOKING_AVAILABILITY`) — never a hand-typed parallel list. Weekends,
 * non-working days, and blocked dates are excluded here so a consumer never
 * has to re-derive that filtering itself.
 */
export function generateAvailableSlots(
	config: AvailabilityConfig = BOOKING_AVAILABILITY,
	from: Date = new Date(),
): AvailabilitySlot[] {
	const slots: AvailabilitySlot[] = [];
	const slotsPerHour = 60 / config.slotLengthMinutes;
	const hoursSpan = config.closingHour - config.openingHour;

	// The calendar date `from` falls on IN `config.timezone` — never the
	// machine's (or browser's) local calendar, which can read a different
	// date near a day boundary (see the file header's TIMEZONE note).
	const anchor = resolveZonedYMD(from, config.timezone);

	for (let dayOffset = 0; dayOffset < config.horizonDays; dayOffset += 1) {
		// Pure Gregorian-calendar arithmetic on the zone-resolved y/m/d above:
		// `Date.UTC` here is only a rollover-safe day-adder (it never re-reads
		// `config.timezone` or the machine's zone), so `getUTCDay()` /
		// `getUTC*()` below report the weekday and date `config.timezone`
		// itself would show — not a mix of two different zones' calendars.
		const day = new Date(
			Date.UTC(anchor.year, anchor.month - 1, anchor.day + dayOffset),
		);
		if (!config.workingDays.includes(day.getUTCDay())) continue;
		const isoDate = `${day.getUTCFullYear()}-${pad(day.getUTCMonth() + 1)}-${pad(day.getUTCDate())}`;
		if (config.blockedDates.includes(isoDate)) continue;

		// Guard: only emit a slot when its END falls at or before closingHour.
		// `hoursSpan * slotsPerHour` is NOT a safe upper bound when
		// `slotLengthMinutes` does not divide 60 (e.g. 25 or 50 minutes) —
		// the last step of that naive loop produces a slot whose end overshoots
		// closingHour. The explicit end-time check below is the minimal fix
		// that handles both dividing and non-dividing slot lengths.
		const spanMinutes = hoursSpan * 60;
		for (let step = 0; step < hoursSpan * slotsPerHour; step += 1) {
			const minutesFromOpening = step * config.slotLengthMinutes;
			if (minutesFromOpening + config.slotLengthMinutes > spanMinutes) break;
			const hour = config.openingHour + Math.floor(minutesFromOpening / 60);
			const minute = minutesFromOpening % 60;
			slots.push({ date: isoDate, time: `${pad(hour)}:${pad(minute)}` });
		}
	}
	return slots;
}

/**
 * True only for a slot that is an EXACT entry of `generateAvailableSlots`
 * for the given config — the single gate `buildBookingPayload` uses so a
 * payload can never be built for a slot the configuration does not offer.
 */
export function isConfiguredSlot(
	slot: AvailabilitySlot,
	config: AvailabilityConfig = BOOKING_AVAILABILITY,
	from: Date = new Date(),
): boolean {
	return generateAvailableSlots(config, from).some(
		(s) => s.date === slot.date && s.time === slot.time,
	);
}

/**
 * Turns a slot the visitor clicked into the payload the booking mutation
 * (or, today, the confirmation screen) carries: an absolute instant plus
 * the timezone that instant is authored against. Throws, naming the slot,
 * for anything not present in the current configuration — a booking is
 * never produced for a slot the declared availability does not offer.
 *
 * `from` MUST be the same anchor date the caller used to generate the
 * slot list the visitor picked from (`BookingSection` passes today's
 * date to both) — otherwise a slot legitimately shown in one horizon
 * window could fail validation against a different one.
 */
export function buildBookingPayload(
	slot: AvailabilitySlot,
	config: AvailabilityConfig = BOOKING_AVAILABILITY,
	from: Date = new Date(),
): BookingPayload {
	if (!isConfiguredSlot(slot, config, from)) {
		throw new Error(
			`buildBookingPayload: ${slot.date} ${slot.time} is not a slot ${config.timezone} availability offers`,
		);
	}

	const [year, month, day] = slot.date.split("-").map(Number);
	const [hour, minute] = slot.time.split(":").map(Number);

	// Resolve the UTC offset `config.timezone` carries AT THIS SPECIFIC DATE
	// (never a fixed offset constant — DST makes the offset date-dependent).
	// `Intl.DateTimeFormat` with `timeZoneName: "longOffset"` is the
	// standard-library way to read that offset without adding a timezone
	// dependency to this repo (date-fns is present; date-fns-tz is not).
	const offset = resolveUtcOffset(
		config.timezone,
		year,
		month,
		day,
		hour,
		minute,
	);

	return {
		startTime: `${slot.date}T${slot.time}:00${offset}`,
		timezone: config.timezone,
	};
}

/** Returns e.g. "+02:00" — the offset `timezone` carries at that wall-clock
 * date/time, DST-correct because it is read from `Intl`, never hand-typed.
 *
 * Two-pass technique (genuine):
 *   Pass 1 — treat wall-clock fields as naive UTC to get a first estimate of
 *             the offset.  This is wrong at a DST boundary: at spring-forward
 *             the "wall clock" names a skipped instant, so the naive UTC falls
 *             on the wrong side of the transition.
 *   Pass 2 — subtract the pass-1 offset from the naive UTC to get a candidate
 *             real UTC, then re-read the zone's offset at THAT candidate.
 *             One iteration converges because timezone offsets change in
 *             integer-minute steps, so the second read lands on the correct
 *             side of every real-world DST transition.
 */
function resolveUtcOffset(
	timezone: string,
	year: number,
	month: number,
	day: number,
	hour: number,
	minute: number,
): string {
	const formatter = new Intl.DateTimeFormat("en-US", {
		timeZone: timezone,
		hourCycle: "h23",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});

	/** Read the numeric UTC offset (minutes, positive = ahead of UTC) that
	 *  `timezone` carries at `instant`. */
	function offsetAt(instant: Date): number {
		const parts = Object.fromEntries(
			formatter.formatToParts(instant).map((p) => [p.type, p.value]),
		);
		const localMs = Date.UTC(
			Number(parts.year),
			Number(parts.month) - 1,
			Number(parts.day),
			Number(parts.hour),
			Number(parts.minute),
			Number(parts.second),
		);
		// offset(t) = local(t) − t: how far the zone's wall clock reads
		// ahead of (or behind) UTC — NOT the reverse, which inverts the sign.
		return Math.round((localMs - instant.getTime()) / 60000);
	}

	// Pass 1: naive estimate — wall clock treated as UTC.
	const naiveUtc = new Date(Date.UTC(year, month - 1, day, hour, minute));
	const offsetPass1 = offsetAt(naiveUtc);

	// Pass 2: apply pass-1 offset to get a candidate real-UTC instant, then
	// re-read the offset AT THAT candidate.  One iteration is sufficient for
	// all real-world DST rules (offsets change in whole-minute steps).
	const candidateUtc = new Date(naiveUtc.getTime() - offsetPass1 * 60000);
	const offsetPass2 = offsetAt(candidateUtc);

	const sign = offsetPass2 >= 0 ? "+" : "-";
	const abs = Math.abs(offsetPass2);
	return `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}
