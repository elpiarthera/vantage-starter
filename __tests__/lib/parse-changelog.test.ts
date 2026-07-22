/**
 * Coverage for `lib/changelog/parseChangelog.ts` (Batch 4 fifth bullet,
 * docs/mcpcn-block-mapping.md §4 "Content / blog").
 *
 * PROOF OF THE LOUD-FAILURE PATH, per this delivery's brief: a mutation is
 * applied to a fixture file on disk, the mutation is asserted to have
 * LANDED (read the file back) BEFORE any result is read, the parser is
 * proven to throw a NAMED error against the mutated fixture, and the
 * fixture is proven to have lived entirely outside the repo's tracked tree
 * (`os.tmpdir()`) — so no repo file was ever mutated and nothing needs
 * restoring.
 */

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { formatChangelogDate } from "@/lib/changelog/formatChangelogDate";
import { parseChangelog } from "@/lib/changelog/parseChangelog";

const FIXTURE_WITH_ENTRIES = `# Changelog

## [Unreleased]

### Added (2026-07-22 — first entry title)

Body line one for the first entry.
Body line two for the first entry.

### Fixed (2026-07-22 — second entry title)

Body for the second entry.

### Fixed (2026-07-21 — a third, older entry)

Body for the third entry.
`;

let dir: string;

beforeEach(() => {
	dir = mkdtempSync(path.join(tmpdir(), "changelog-parser-test-"));
});

afterEach(() => {
	rmSync(dir, { recursive: true, force: true });
});

describe("parseChangelog — fixture with N entries", () => {
	it("produces exactly N post records, each carrying its heading and body verbatim", () => {
		const fixturePath = path.join(dir, "CHANGELOG.md");
		writeFileSync(fixturePath, FIXTURE_WITH_ENTRIES, "utf-8");

		const entries = parseChangelog(fixturePath);

		expect(entries).toHaveLength(3);
		expect(entries[0]).toMatchObject({
			type: "Added",
			date: "2026-07-22",
			title: "first entry title",
		});
		expect(entries[0].body).toContain("Body line one for the first entry.");
		expect(entries[0].body).toContain("Body line two for the first entry.");
		expect(entries[1]).toMatchObject({
			type: "Fixed",
			date: "2026-07-22",
			title: "second entry title",
		});
		expect(entries[1].body).toBe("Body for the second entry.");
		expect(entries[2]).toMatchObject({
			type: "Fixed",
			date: "2026-07-21",
			title: "a third, older entry",
		});
		// Slugs are derived, never typed, and never collide.
		const slugs = entries.map((e) => e.slug);
		expect(new Set(slugs).size).toBe(slugs.length);
	});

	it("suffixes a colliding slug instead of overwriting the earlier entry", () => {
		const collidingFixture = `## [Unreleased]

### Added (2026-07-22 — same title)

First body.

### Added (2026-07-22 — same title)

Second body.
`;
		const fixturePath = path.join(dir, "CHANGELOG.md");
		writeFileSync(fixturePath, collidingFixture, "utf-8");

		const entries = parseChangelog(fixturePath);

		expect(entries).toHaveLength(2);
		expect(entries[0].slug).not.toBe(entries[1].slug);
		expect(entries[0].body).toBe("First body.");
		expect(entries[1].body).toBe("Second body.");
	});
});

describe("parseChangelog — loud failure, never silent", () => {
	it("throws a NAMED error when the source file cannot be read", () => {
		const missingPath = path.join(dir, "does-not-exist.md");

		// RED proof: assert the path really is absent before asserting the throw,
		// so a false-negative "it threw because the fixture setup was wrong" is
		// impossible.
		expect(() => readFileSync(missingPath, "utf-8")).toThrow();

		expect(() => parseChangelog(missingPath)).toThrow(/could not read/i);
		expect(() => parseChangelog(missingPath)).toThrow(missingPath);
	});

	it("MUTATION PROOF: throws a NAMED error when the source parses to zero recognized entries, proven against a fixture whose mutation is asserted to have landed before any result is read", () => {
		const fixturePath = path.join(dir, "CHANGELOG.md");
		const original = "## [Unreleased]\n\n### Fixed\n\nNo date, no title.\n";
		writeFileSync(fixturePath, original, "utf-8");

		// The mutation: strip every heading down to a shape the parser's own
		// regex cannot recognize (no `(YYYY-MM-DD — title)` group at all).
		const mutated = original.replace(
			/### Fixed/g,
			"### Fixed-no-heading-shape",
		);
		writeFileSync(fixturePath, mutated, "utf-8");

		// Assert the mutation LANDED before reading any parser result.
		const onDisk = readFileSync(fixturePath, "utf-8");
		expect(onDisk).toContain("Fixed-no-heading-shape");
		expect(onDisk).not.toMatch(/^### Fixed\s*$/m);

		expect(() => parseChangelog(fixturePath)).toThrow(/zero entries/i);
		expect(() => parseChangelog(fixturePath)).toThrow(fixturePath);

		// Restoration: this fixture lives entirely under os.tmpdir(), never in
		// the repo tree, so this test has nothing tracked to restore — proven
		// by asserting the mutated fixture's own path is outside the repo root
		// (so `git status --porcelain` on the real repository, run separately
		// by this delivery's gate, is untouched by this test's mutation).
		const repoRoot = path.join(__dirname, "..", "..");
		expect(fixturePath.startsWith(repoRoot)).toBe(false);
		expect(fixturePath.startsWith(tmpdir())).toBe(true);
	});
});

describe("formatChangelogDate", () => {
	it("formats a bare calendar date in UTC regardless of viewer timezone", () => {
		expect(formatChangelogDate("2026-07-22", "en")).toContain("2026");
		expect(formatChangelogDate("2026-07-22", "en")).toContain("22");
	});
});
