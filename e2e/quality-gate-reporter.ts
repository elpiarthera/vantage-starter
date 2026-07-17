import fs from "node:fs";
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

	onBegin(_config: FullConfig, _suite: Suite): void {
		this.failedTests = [];
		this.skippedTests = [];
		this.passedCount = 0;
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

		if (totalFailed === 0) {
			const timestamp = new Date().toISOString();
			fs.writeFileSync(MARKER_PATH, timestamp);
			console.log(
				`\nQUALITY GATE: PASSED — marker created (${this.passedCount} tests passed)`,
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
