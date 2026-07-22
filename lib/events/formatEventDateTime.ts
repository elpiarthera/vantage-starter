/**
 * `formatEventDateTime` — the ONE function that turns an `events` row's
 * `startDateTime` (ISO-8601 instant, explicit UTC offset) + `timezone`
 * (IANA zone) into display text (Batch 4 fourth bullet,
 * docs/mcpcn-block-mapping.md §4 "Events").
 *
 * `convex/schema.ts`'s `events` table header names the exact defect this
 * function exists to prevent: "the previous Batch-4 bullet found hours
 * zone-resolved while days were not". Every renderer in this feature
 * (`event-card`, `event-list`, `event-detail`, `event-confirmation`) calls
 * THIS function rather than re-deriving a date string itself, so no
 * renderer can repeat that split.
 *
 * `Intl.DateTimeFormat`'s `timeZone` option resolves the display in
 * `timezone` REGARDLESS of the viewer's own locale/system timezone — the
 * viewer's browser is never consulted for the zone, only for locale-specific
 * formatting conventions (e.g. date order). The IANA zone name is always
 * appended to the formatted string so a reader is never left guessing which
 * zone the displayed wall-clock time is authored in.
 */
export function formatEventDateTime(
	startDateTime: string,
	timezone: string,
	locale = "en",
): string {
	const date = new Date(startDateTime);
	const formatted = new Intl.DateTimeFormat(locale, {
		timeZone: timezone,
		dateStyle: "long",
		timeStyle: "short",
	}).format(date);
	return `${formatted} (${timezone})`;
}
