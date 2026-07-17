/**
 * run-test-suites — `pnpm test`'s actual body.
 *
 * `package.json`'s `"test": "jest"` ran exactly one of the TWO runners that
 * own real suites in this repo (Jest 4, Vitest 39 — see
 * `scripts/derive-test-runner-ownership.js`) and reported ITS OWN exit code
 * as the whole repo's test verdict. After `jest.config.ts`/`vitest.config.ts`
 * were given non-overlapping, derived territory, `pnpm test` went green
 * (`rc=0`, "4 passed, 4 total") while 13 Vitest suites sat red, unrun by
 * anything `pnpm test` invoked — a QUIETER version of the exact false-green
 * ratio this whole fix exists to close, not a fix of it. A loud lie that
 * screams "91 failed" next to "94/94 passed" gets noticed; a tidy "4/4, rc=0"
 * does not, and that is worse, not better.
 *
 * This script is the fix: it runs EVERY runner that owns real suites on
 * disk — Jest and Vitest — always both, regardless of whether the first one
 * failed, streams each one's own output live (so every named failure is
 * visible in the same place a human already looks), and exits non-zero if
 * EITHER runner reports a single failure. `pnpm test` cannot go green by
 * narrowing what it runs; it can only go green by every owned suite actually
 * passing.
 *
 * Playwright is deliberately NOT run here: its suites require a running dev
 * server (`pnpm dev` / a deployed preview), which `pnpm test` has never
 * started and should not silently start. Playwright's own command is
 * `pnpm test:e2e` — named, not swallowed into this one.
 */
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");

function run(label, command, args) {
	console.log(`\n${"=".repeat(72)}\n${label}\n${"=".repeat(72)}`);
	const result = spawnSync(command, args, {
		cwd: ROOT,
		stdio: "inherit",
		shell: process.platform === "win32",
	});
	const exitCode = result.status ?? 1;
	console.log(`\n${label}: exit code ${exitCode}`);
	return exitCode;
}

function main() {
	const jestExit = run("JEST (npx jest)", "npx", ["jest"]);
	const vitestExit = run("VITEST (npx vitest run)", "npx", ["vitest", "run"]);

	const allGreen = jestExit === 0 && vitestExit === 0;

	console.log(`\n${"=".repeat(72)}`);
	console.log("TEST SUITE SUMMARY (both runners that own real suites)");
	console.log("=".repeat(72));
	console.log(
		`  Jest:   exit ${jestExit} ${jestExit === 0 ? "(green)" : "(RED)"}`,
	);
	console.log(
		`  Vitest: exit ${vitestExit} ${vitestExit === 0 ? "(green)" : "(RED)"}`,
	);
	console.log(
		"  Playwright NOT run here — needs a live dev server, see `pnpm test:e2e`.",
	);
	if (!allGreen) {
		console.log(
			"\npnpm test: RED — see the named failures printed above, per runner.",
		);
	} else {
		console.log("\npnpm test: GREEN — both Jest and Vitest are clean.");
	}

	process.exit(allGreen ? 0 : 1);
}

main();
