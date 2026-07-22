/**
 * `formatChangelogDate` — the ONE function every renderer (`post-card`,
 * `post-list`, `post-detail`) calls to turn an entry's `date` (a bare
 * `YYYY-MM-DD` calendar date, no time-of-day) into display text, rather
 * than re-deriving it at each call site (same reasoning as
 * `lib/events/formatEventDateTime.ts`).
 *
 * DATE CARRIES ITS ZONE, EXPLICITLY: `new Date("YYYY-MM-DD")` parses as UTC
 * midnight; formatting it with the VIEWER's local timezone can shift the
 * displayed calendar day backward for any negative-offset zone (e.g. a
 * reader in `America/Los_Angeles` would see 2026-07-21 for an entry authored
 * 2026-07-22). `timeZone: "UTC"` is passed explicitly so the calendar date
 * displayed is always the one the entry was authored under, never
 * reinterpreted through the reader's own offset — the same class of bug
 * `lib/events/formatEventDateTime.ts`'s header names for the events surface.
 *
 * LIVES IN ITS OWN MODULE, separate from `parseChangelog.ts`: that module
 * imports `node:fs`/`node:path` to read `CHANGELOG.md` from disk, and
 * `post-card.tsx`/`post-detail.tsx` are Client Components (they share state
 * across sub-exports via `createContext`) that call this formatter. A single
 * shared module would pull `node:fs`/`node:path` into the client bundle the
 * moment either renderer imported it — `next build` fails closed on that
 * ("Reading from node:fs is not handled by plugins"). Splitting the pure,
 * client-safe formatter out is the lift, not a `"use client"` workaround.
 */
export function formatChangelogDate(date: string, locale = "en"): string {
	const parsed = new Date(`${date}T00:00:00Z`);
	return new Intl.DateTimeFormat(locale, {
		timeZone: "UTC",
		dateStyle: "long",
	}).format(parsed);
}
