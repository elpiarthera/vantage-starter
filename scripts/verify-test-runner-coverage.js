#!/usr/bin/env node
/**
 * verify-test-runner-coverage — the count itself must not be able to lie.
 *
 * Same family as `check-translations.js` Control 4 ("called but undefined"):
 * the only control in that file that caught a REAL loss, because it compared
 * two INDEPENDENT sources (every `t()` call site vs. every locale's key set)
 * instead of trusting a single count. This script applies the identical
 * pattern to the test suite itself: it compares
 *
 *   (a) suites ON DISK, derived by `scripts/derive-test-runner-ownership.js`
 *       (itself derived from `playwright.config.ts`'s own `testDir` + each
 *       file's own content — never a hand-typed list), against
 *   (b) suites the runner itself reports it STARTED (`jest --listTests`,
 *       `npx vitest list`, `npx playwright test --list`).
 *
 * If those two numbers disagree for any runner, THAT DISAGREEMENT is the
 * bug — exactly the shape of defect this whole task exists to close (91 of
 * 95 suites failing to load while "94/94 passed" printed above it read as a
 * perfect, false green). This script never trusts the runner's own summary
 * line in isolation; it always cross-checks against the independently
 * derived on-disk inventory.
 *
 * Usage: node scripts/verify-test-runner-coverage.js
 * Exits 1 (and names every missing file) if any runner's started-count
 * disagrees with its on-disk, derived inventory.
 */
const { execSync } = require("node:child_process");
const path = require("node:path");
const { deriveOwnership, ROOT } = require("./derive-test-runner-ownership.js");

function jestStartedFiles() {
	const out = execSync("npx jest --listTests", {
		cwd: ROOT,
		encoding: "utf8",
	});
	return out
		.split("\n")
		.map((l) => l.trim())
		.filter(Boolean)
		.map((abs) => path.relative(ROOT, abs).split(path.sep).join("/"));
}

function vitestStartedFiles() {
	// `vitest list` executes each file's top-level module body during
	// collection (not a static parse) — a file whose top level throws (e.g.
	// `fs.readFileSync` against a path that no longer exists) aborts the
	// whole `list` invocation instead of reporting a clean inventory, which
	// makes `list` unusable here as a pure inventory command. `vitest run
	// --reporter=json` instead ALWAYS names every suite it started — passed,
	// failed, or aborted during collection — in `testResults[].name`, which
	// is exactly the "started" signal this check needs, independent of
	// whether the suite's assertions themselves passed.
	let out;
	try {
		out = execSync("npx vitest run --reporter=json", {
			cwd: ROOT,
			encoding: "utf8",
		});
	} catch (err) {
		// vitest exits non-zero when any test fails — that is expected and
		// NOT a coverage-parity problem; stdout still carries the full JSON.
		out = err.stdout;
	}
	const parsed = JSON.parse(out);
	return parsed.testResults.map((r) =>
		path.relative(ROOT, r.name).split(path.sep).join("/"),
	);
}

function playwrightStartedFiles(playwrightDir) {
	const out = execSync("npx playwright test --list", {
		cwd: ROOT,
		encoding: "utf8",
	});
	// `--list` output names each test with its file path in parens, e.g.
	// "  ✓  1 [chromium] › landing.spec.ts:12:1 › ...". Extract every
	// `<file>.spec.ts` token actually referenced.
	const matches = out.matchAll(/([\w-]+\.spec\.ts)/g);
	const names = new Set(Array.from(matches, (m) => m[1]));
	return Array.from(names).map((name) => `${playwrightDir}/${name}`);
}

function diff(expected, actual) {
	const actualSet = new Set(actual);
	const expectedSet = new Set(expected);
	const missing = expected.filter((f) => !actualSet.has(f));
	const unexpected = actual.filter((f) => !expectedSet.has(f));
	return { missing, unexpected };
}

function main() {
	const ownership = deriveOwnership();
	const report = {};
	let allOk = true;

	// --- Jest ---
	try {
		const started = jestStartedFiles();
		const { missing, unexpected } = diff(ownership.jest, started);
		report.jest = {
			onDisk: ownership.jest.length,
			started: started.length,
			missing,
			unexpected,
			ok: missing.length === 0 && unexpected.length === 0,
		};
	} catch (err) {
		report.jest = { ok: false, fatal: true, error: String(err) };
	}

	// --- Vitest ---
	try {
		const started = vitestStartedFiles();
		const { missing, unexpected } = diff(ownership.vitest, started);
		report.vitest = {
			onDisk: ownership.vitest.length,
			started: started.length,
			missing,
			unexpected,
			ok: missing.length === 0 && unexpected.length === 0,
		};
	} catch (err) {
		report.vitest = { ok: false, fatal: true, error: String(err) };
	}

	// --- Playwright ---
	try {
		const started = playwrightStartedFiles(ownership.playwrightDir);
		const { missing, unexpected } = diff(ownership.playwright, started);
		report.playwright = {
			onDisk: ownership.playwright.length,
			started: started.length,
			missing,
			unexpected,
			ok: missing.length === 0 && unexpected.length === 0,
		};
	} catch (err) {
		report.playwright = { ok: false, fatal: true, error: String(err) };
	}

	if (ownership.orphans.length > 0) {
		report.orphans = ownership.orphans;
	}

	for (const [runner, result] of Object.entries(report)) {
		if (runner === "orphans") continue;
		const label = `${runner}: ${result.started ?? "?"}/${result.onDisk ?? "?"} suites started`;
		if (result.ok) {
			console.error(`PASS — ${label}`);
		} else {
			allOk = false;
			console.error(`FAIL — ${label}`);
			if (result.fatal) {
				console.error(`  fatal: ${result.error}`);
			}
			for (const m of result.missing ?? []) {
				console.error(`  MISSING (on disk, never started): ${m}`);
			}
			for (const u of result.unexpected ?? []) {
				console.error(`  UNEXPECTED (started, not in derived ownership): ${u}`);
			}
		}
	}

	if (ownership.orphans.length > 0) {
		allOk = false;
		console.error(
			`FAIL — ${ownership.orphans.length} orphan test file(s): named *.test.*/*.spec.* but call ZERO test-runner API — they run under NO runner:`,
		);
		for (const o of ownership.orphans) {
			console.error(`  ${o}`);
		}
	}

	console.error(JSON.stringify(report, null, 2));
	process.exit(allOk ? 0 : 1);
}

if (require.main === module) {
	main();
}

module.exports = {
	jestStartedFiles,
	vitestStartedFiles,
	playwrightStartedFiles,
	diff,
};
