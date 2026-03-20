import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration — VantageStarter e2e suite
 *
 * baseURL: reads PLAYWRIGHT_BASE_URL env var, falls back to localhost:3000
 * Browser: Chromium only (fast CI)
 * Auth-required tests: skipped automatically when CLERK_TESTING_TOKEN is absent
 */
export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: [["list"], ["./e2e/quality-gate-reporter.ts"]],
	use: {
		baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
		trace: "off",
		screenshot: "only-on-failure",
		video: "off",
		locale: "en-US",
	},
	timeout: 30_000,
	expect: {
		timeout: 10_000,
	},
	projects: [
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				// Use the full Chromium build (not headless shell) for sandbox compatibility.
				// The headless shell is SIGKILL'd in restricted environments.
				channel: "chromium",
				launchOptions: {
					args: ["--no-sandbox", "--disable-setuid-sandbox"],
				},
			},
		},
	],
	// Dev server is expected to be running externally before tests execute.
	// If needed, uncomment the webServer block and adjust to your setup.
	// webServer: {
	//   command: "pnpm dev",
	//   url: "http://localhost:3000",
	//   reuseExistingServer: true,
	// },
});
