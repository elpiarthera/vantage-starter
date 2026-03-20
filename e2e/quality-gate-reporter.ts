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
	private passedCount = 0;

	onBegin(_config: FullConfig, _suite: Suite): void {
		this.failedTests = [];
		this.passedCount = 0;
	}

	onTestEnd(test: TestCase, result: TestResult): void {
		if (result.status === "passed") {
			this.passedCount++;
		} else if (result.status !== "skipped") {
			// Skipped tests (e.g. auth tests without CLERK_TESTING_TOKEN) are not failures.
			this.failedTests.push(
				`${test.titlePath().join(" > ")} — ${result.status}`,
			);
		}
	}

	onEnd(_result: FullResult): void {
		const totalFailed = this.failedTests.length;

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
	}
}

export default QualityGateReporter;
