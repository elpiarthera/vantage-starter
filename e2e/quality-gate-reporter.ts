import fs from "node:fs";
import path from "node:path";
import type {
	FullConfig,
	FullResult,
	Reporter,
	Suite,
	TestCase,
	TestResult,
} from "@playwright/test/reporter";

const MARKER_PATH = "/tmp/.quality-gate-passed";

class QualityGateReporter implements Reporter {
	private failedTests: string[] = [];
	private skippedTests: string[] = [];
	private passedCount = 0;
	private declaredSpecFiles: Set<string> = new Set();
	private scopedSpecFiles: Set<string> = new Set();

	onBegin(config: FullConfig, suite: Suite): void {
		this.failedTests = [];
		this.skippedTests = [];
		this.passedCount = 0;

		// The threshold for "this is the full suite" is DERIVED from the
		// filesystem, never typed: every *.spec.ts file that actually lives in
		// each project's testDir, read fresh on every run. A run is only
		// eligible to unlock the commit gate when the set of spec files it
		// scheduled (suite.allTests()[].location.file — already filtered by
		// any CLI file arg / --grep BEFORE onBegin fires) equals that set.
		this.declaredSpecFiles = new Set();
		for (const project of config.projects) {
			let entries: string[];
			try {
				entries = fs.readdirSync(project.testDir);
			} catch {
				// testDir unreadable — cannot derive a threshold from it; skip
				// this project rather than silently trusting an empty set.
				continue;
			}
			for (const entry of entries) {
				if (entry.endsWith(".spec.ts")) {
					this.declaredSpecFiles.add(path.join(project.testDir, entry));
				}
			}
		}

		this.scopedSpecFiles = new Set(
			suite.allTests().map((test) => test.location.file),
		);
	}

	onTestEnd(test: TestCase, result: TestResult): void {
		if (result.status === "passed") {
			this.passedCount++;
		} else if (result.status === "skipped") {
			// A skip is DECLARED coverage that executed nothing — it must never
			// be mistaken for "not red" == "green". It is never made to fail
			// here (no CLERK_TESTING_TOKEN on this box is a real, documented
			// constraint, not a defect this reporter can fix), but it is always
			// named loudly in onEnd below — never silently absorbed.
			this.skippedTests.push(`${test.titlePath().join(" > ")}`);
		} else {
			this.failedTests.push(
				`${test.titlePath().join(" > ")} — ${result.status}`,
			);
		}
	}

	onEnd(_result: FullResult): void {
		const totalFailed = this.failedTests.length;
		const totalSkipped = this.skippedTests.length;

		// A run is only "the full suite" when every declared spec FILE was
		// scheduled — not merely when every scheduled test passed. This is
		// what closes the hole: `pnpm exec playwright test
		// e2e/theme-repaint.spec.ts` schedules 1 of 8 declared files, passes
		// its 1 test, and used to satisfy `totalFailed === 0 && passedCount >
		// 0` — which is exactly the false-green shape this task exists to
		// close, just one level up from the `--list` case already handled
		// below. Missing/extra files are named explicitly, never silently
		// summarised as a count.
		const missingFiles = [...this.declaredSpecFiles].filter(
			(f) => !this.scopedSpecFiles.has(f),
		);
		const isFullSuite = missingFiles.length === 0;

		// A vacuous "0 failed" (e.g. `playwright test --list`, which never
		// executes a single test — every hook still fires) must NEVER write
		// the marker: `totalFailed === 0` alone is true precisely when
		// nothing ran at all, which is the exact false-green shape this whole
		// task exists to close. The marker requires at least one test to have
		// actually PASSED, not merely zero to have failed.
		if (totalFailed === 0 && this.passedCount > 0 && isFullSuite) {
			const timestamp = new Date().toISOString();
			fs.writeFileSync(MARKER_PATH, timestamp);
			console.log(
				`\nQUALITY GATE: PASSED — marker created (${this.passedCount} tests passed, ${this.scopedSpecFiles.size}/${this.declaredSpecFiles.size} spec files ran)`,
			);
		} else if (totalFailed === 0 && this.passedCount > 0 && !isFullSuite) {
			// Remove stale marker if it exists
			if (fs.existsSync(MARKER_PATH)) {
				fs.unlinkSync(MARKER_PATH);
			}
			console.log(
				`\nQUALITY GATE: INCONCLUSIVE — SCOPED RUN (${this.scopedSpecFiles.size}/${this.declaredSpecFiles.size} spec files ran) — marker NOT created, this run cannot vouch for the files it did not schedule:`,
			);
			for (const missing of missingFiles) {
				console.log(`  - ${path.relative(process.cwd(), missing)}`);
			}
		} else if (totalFailed === 0 && this.passedCount === 0) {
			// Remove stale marker if it exists
			if (fs.existsSync(MARKER_PATH)) {
				fs.unlinkSync(MARKER_PATH);
			}
			console.log(
				"\nQUALITY GATE: INCONCLUSIVE — 0 tests passed and 0 failed (e.g. `--list`, or every test skipped) — marker NOT created, this is not a pass",
			);
		} else {
			// Remove stale marker if it exists
			if (fs.existsSync(MARKER_PATH)) {
				fs.unlinkSync(MARKER_PATH);
			}
			console.log(
				`\nQUALITY GATE: FAILED — ${totalFailed} test${totalFailed === 1 ? "" : "s"} failed`,
			);
			for (const failure of this.failedTests) {
				console.log(`  - ${failure}`);
			}
		}

		// ALWAYS printed, in both the PASSED and FAILED branches above — a
		// skip is never quiet, and "PASSED" must never be read as "every
		// declared test executed". `CLERK_TESTING_TOKEN` is the one known,
		// documented reason skips exist in this suite today; the token's
		// actual presence is checked here rather than assumed, since a
		// skip declared for a different reason must not be mislabeled.
		if (totalSkipped > 0) {
			const hasClerkToken = Boolean(process.env.CLERK_TESTING_TOKEN);
			const reasonNote = hasClerkToken
				? "CLERK_TESTING_TOKEN IS set — these skips are NOT explained by the usual reason; investigate."
				: "CLERK_TESTING_TOKEN is not set on this box — authenticated-render coverage below did not execute.";
			console.log(
				`\nQUALITY GATE: ${totalSkipped} test${totalSkipped === 1 ? "" : "s"} SKIPPED (declared, did not execute) — ${reasonNote}`,
			);
			for (const skipped of this.skippedTests) {
				console.log(`  - ${skipped}`);
			}
		}
	}
}

export default QualityGateReporter;
