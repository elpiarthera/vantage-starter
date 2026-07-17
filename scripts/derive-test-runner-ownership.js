/**
 * derive-test-runner-ownership — single source of truth for which test
 * runner (Playwright, Vitest, Jest) owns which file on disk. Required by
 * BOTH `jest.config.ts` and `vitest.config.ts` so ownership can never drift
 * between the two configs, and by `scripts/verify-test-runner-coverage.js`
 * so the "suites started" count can be checked against "suites on disk".
 *
 * Nothing here is a hand-typed directory list. Every classification is
 * DERIVED from a property of the file itself, or from what
 * `playwright.config.ts` already declares — never eyeballed, never retyped.
 * This is the exact defect this file exists to close: before this fix,
 * `jest.config.ts` matched EVERY `.test.*`/`.spec.*` file in the repo
 * (`testMatch: ["**\/__tests__/**\/*.[jt]s?(x)", "**\/?(*.)+(spec|test).[jt]s?(x)"]`),
 * including 6 Playwright specs under `e2e/` and 35 Vitest suites (they
 * `import` from `"vitest"`, a module Jest's own transform cannot parse) —
 * Jest then reported each as a FAILED SUITE while its "Tests: N/N passed"
 * line stayed a perfect ratio, because that line only ever counts tests
 * inside suites that actually STARTED. 91 of 95 suites failed to even load,
 * while "94/94 passed" printed directly above it read as 100% green.
 *
 * The three ownership rules, applied in order:
 *
 *   1. PLAYWRIGHT owns everything under the directory `playwright.config.ts`
 *      itself declares as `testDir` — read directly out of that file via
 *      regex, never retyped as a literal path here. If Playwright's own
 *      config shape changes, this throws loudly rather than silently
 *      returning a stale directory.
 *
 *   2. VITEST owns every remaining `.test.*`/`.spec.*` file whose SOURCE
 *      contains an import FROM the literal module string `"vitest"` — an
 *      inherent, checkable property of the file's own content, not a
 *      directory guess. Every current Vitest suite in this repo satisfies
 *      this (they call `vi.mock`/`vi.fn`/import `describe`/`it`/`expect`
 *      from `"vitest"` explicitly).
 *
 *   3. JEST owns every remaining file that contains at least one
 *      `describe(`/`test(`/`it(` call — proof it is a REAL suite (Jest
 *      injects these as globals; a file relying on them without importing
 *      them from anywhere is, by construction, written for a runtime that
 *      provides them as globals, which is Jest's `globals`/legacy model,
 *      never Playwright's or Vitest's, both of which require an explicit
 *      import).
 *
 * Anything matched by NONE of the three rules — a `.test.*`/`.spec.*` file
 * with zero test-runner call sites at all — is an ORPHAN: a file that LOOKS
 * like a suite but never runs as one under any runner. This is reported,
 * never silently dropped into whichever runner's glob happens to still
 * catch it (that silent catch-all is exactly the disease this file exists
 * to close).
 */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");

// Directories that are never test-runner territory, regardless of what a
// stray `.test.ts`/`.spec.ts` filename inside them might suggest.
const EXCLUDED_DIR_SEGMENTS = new Set([
	"node_modules",
	".next",
	"dist",
	"out",
	"_archive",
	".git",
]);

const TEST_FILE_RE = /\.(test|spec)\.(ts|tsx|js|jsx)$/;

function walk(dir, out = []) {
	if (!fs.existsSync(dir)) return out;
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		if (EXCLUDED_DIR_SEGMENTS.has(entry.name)) continue;
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			walk(full, out);
		} else if (TEST_FILE_RE.test(entry.name)) {
			out.push(full);
		}
	}
	return out;
}

// Rule 1 — derive Playwright's owned directory straight from its own
// config, never a retyped literal.
function derivePlaywrightDir() {
	const configPath = path.join(ROOT, "playwright.config.ts");
	const src = fs.readFileSync(configPath, "utf8");
	const match = src.match(/testDir:\s*["'`]\.\/(.*?)["'`]/);
	if (!match) {
		throw new Error(
			'derive-test-runner-ownership: could not parse `testDir: "./..."` out of playwright.config.ts — its shape changed, update the regex in derivePlaywrightDir().',
		);
	}
	return match[1];
}

function hasVitestImport(source) {
	return /from\s+["']vitest["']/.test(source);
}

function hasTestRunnerCallSite(source) {
	return /\b(describe|test|it)\s*\(/.test(source);
}

// Every `.test.*`/`.spec.*` file on disk (excluding the always-excluded
// dirs), classified into exactly one of: playwright / vitest / jest /
// orphan. `roots` lets callers scope the walk (both configs only need to
// walk their own plausible territory, never the whole repo tree).
function deriveOwnership(roots = ["__tests__", "src", "scripts/__tests__"]) {
	const playwrightDir = derivePlaywrightDir();
	const allFiles = [
		...roots.flatMap((r) => walk(path.join(ROOT, r))),
		...walk(path.join(ROOT, playwrightDir)),
	];
	// De-duplicate (a root could theoretically overlap another).
	const uniqueFiles = Array.from(new Set(allFiles));

	const playwright = [];
	const vitest = [];
	const jest = [];
	const orphans = [];

	for (const file of uniqueFiles) {
		const rel = path.relative(ROOT, file).split(path.sep).join("/");
		if (rel === playwrightDir || rel.startsWith(`${playwrightDir}/`)) {
			playwright.push(rel);
			continue;
		}
		const source = fs.readFileSync(file, "utf8");
		if (hasVitestImport(source)) {
			vitest.push(rel);
		} else if (hasTestRunnerCallSite(source)) {
			jest.push(rel);
		} else {
			orphans.push(rel);
		}
	}

	playwright.sort();
	vitest.sort();
	jest.sort();
	orphans.sort();

	return { playwrightDir, playwright, vitest, jest, orphans };
}

module.exports = {
	deriveOwnership,
	derivePlaywrightDir,
	hasVitestImport,
	hasTestRunnerCallSite,
	walk,
	TEST_FILE_RE,
	ROOT,
};

if (require.main === module) {
	const result = deriveOwnership();
	console.log(JSON.stringify(result, null, 2));
}
