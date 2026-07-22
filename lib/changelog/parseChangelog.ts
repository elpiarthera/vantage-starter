import { readFileSync } from "node:fs";
import path from "node:path";

// `formatChangelogDate` moved to its own module (`formatChangelogDate.ts`,
// no `node:fs`/`node:path`) so the Client Component renderers
// (`post-card.tsx`, `post-detail.tsx`) can import it without pulling Node
// built-ins into the client bundle. See that file's header for the full
// reasoning.

/**
 * `parseChangelog` — turns `CHANGELOG.md` itself into post records for the
 * public "what's new" surface (mcpcn `post-card` / `post-list` / `post-detail`
 * blocks, docs/mcpcn-block-mapping.md §4 "Content / blog", Batch 4's fifth
 * bullet).
 *
 * NO CONVEX TABLE — this is a committed decision, not an option
 * (docs/mcpcn-block-mapping.md line ~392: "a Convex table or MDX source
 * parsing `CHANGELOG.md` entries into post records"; the MDX-source branch
 * is the one taken). The content already exists as version-controlled text;
 * duplicating it into a table would be a second source of truth for the
 * exact same words.
 *
 * ENTRY SHAPE RECOGNIZED: only headings of the form
 * `### <Type> (<YYYY-MM-DD> — <title>)` are entries (e.g. this file's own
 * repo history: `### Added (2026-07-22 — the browse-pick-register-confirm
 * flow, over two new tables)`). Older undated headings in this same file
 * (`### Fixed`, `### Changed (copy-source pass)`, `### Known gaps, named
 * rather than left silent`) do NOT match this shape and are silently
 * excluded from the post surface by design — they predate the
 * `Type (date — title)` convention adopted partway through this changelog's
 * life and carry no single title/date to hang a post on. This exclusion is
 * a designed filter on a recognized shape, not the "silent empty return"
 * this function refuses elsewhere (see below): every heading that DOES
 * match the shape becomes exactly one entry, and if the shape's own regex
 * matches zero headings at all in a file that exists and is readable, that
 * is treated as a parse failure (see `NO ENTRIES IS NEVER SILENT` below),
 * not as "nothing to show".
 *
 * SLUG IS DERIVED, NEVER TYPED (`.claude/rules/derive-never-type.md`): each
 * slug is `<date>-<slugified-title>`. Two entries can share the same date
 * and, in principle, produce the same slugified title (two entries the same
 * day with near-identical wording) — rather than let the second silently
 * overwrite the first at the same URL, a numeric suffix (`-2`, `-3`, ...) is
 * appended on collision, so both remain independently reachable. This is
 * the "suffix" branch named in the brief, not the "fail loudly" branch,
 * because a same-day title collision is expected editorial reality (see
 * this very file's own history: three `### Fixed (2026-07-21 — ...)`
 * entries with different titles same day), not a corrupt input.
 *
 * NO ENTRIES IS NEVER SILENT: `if (entries.length === 0) return []` is
 * exactly the blind spot this repository spends its time closing (see this
 * function's own header reasoning, and `middleware.ts`'s `/report` fix a
 * few commits before this one) — a page rendering "no entries" because the
 * parse silently failed looks IDENTICAL to a changelog that is genuinely
 * empty, and only one of those is true. An unreadable file or a file with
 * zero recognized entries both throw, naming the file and what could not be
 * parsed, rather than returning an empty array a caller cannot tell apart
 * from "really nothing there".
 */

export interface ChangelogEntry {
	/** Derived from date + title; never hand-typed, see this file's header. */
	slug: string;
	/** "Added" | "Fixed" | "Changed" | any other heading-level word used. */
	type: string;
	/** ISO calendar date, `YYYY-MM-DD`, as authored in the heading. */
	date: string;
	title: string;
	/** Raw body text between this heading and the next, trimmed. */
	body: string;
}

const ENTRY_HEADING_RE = /^### (\w+) \((\d{4}-\d{2}-\d{2})(?: — (.+))?\)\s*$/gm;

function slugify(input: string): string {
	return input
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 80);
}

/**
 * `filePath` defaults to the repository's own `CHANGELOG.md` (resolved from
 * `process.cwd()`, the convention every other repo-root read in this
 * codebase uses). Tests pass an explicit fixture path to prove the loud
 * failure paths without mutating the real file.
 */
export function parseChangelog(
	filePath: string = path.join(process.cwd(), "CHANGELOG.md"),
): ChangelogEntry[] {
	let raw: string;
	try {
		raw = readFileSync(filePath, "utf-8");
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		throw new Error(
			`parseChangelog: could not read changelog source "${filePath}" — ${reason}`,
		);
	}

	const headings: {
		type: string;
		date: string;
		title: string;
		index: number;
	}[] = [];
	for (const match of raw.matchAll(ENTRY_HEADING_RE)) {
		headings.push({
			type: match[1],
			date: match[2],
			title: (match[3] ?? "").trim(),
			index: match.index ?? 0,
		});
	}

	if (headings.length === 0) {
		throw new Error(
			`parseChangelog: "${filePath}" was read successfully but yielded zero entries matching "### <Type> (<YYYY-MM-DD> — <title>)" — either the file is empty, or every heading in it predates that convention. A page cannot tell "genuinely no entries" apart from "parsing silently failed", so this throws instead of returning [].`,
		);
	}

	const slugCounts = new Map<string, number>();
	const entries: ChangelogEntry[] = headings.map((heading, i) => {
		const start = heading.index + raw.slice(heading.index).indexOf("\n") + 1;
		const end = headings[i + 1]?.index ?? raw.length;
		const body = raw.slice(start, end).trim();

		const baseSlug = `${heading.date}-${slugify(heading.title || heading.type)}`;
		const seen = slugCounts.get(baseSlug) ?? 0;
		slugCounts.set(baseSlug, seen + 1);
		const slug = seen === 0 ? baseSlug : `${baseSlug}-${seen + 1}`;

		return {
			slug,
			type: heading.type,
			date: heading.date,
			title: heading.title || heading.type,
			body,
		};
	});

	return entries;
}
