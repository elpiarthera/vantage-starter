import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration — VantageStarter e2e suite
 *
 * baseURL: reads PLAYWRIGHT_BASE_URL env var, falls back to localhost:3000
 * Browser: Chromium only (fast CI)
 * Auth-required tests: skipped automatically when CLERK_TESTING_TOKEN is absent
 *
 * Browserbase: when BROWSERBASE_API_KEY + BROWSERBASE_PROJECT_ID are set,
 * tests connect to Browserbase cloud browsers via WebSocket instead of
 * launching a local browser. When not set, falls back to local Chromium.
 *
 * Clerk: global setup at e2e/global-setup.ts fetches Clerk testing token
 * automatically from the Clerk Backend API (requires CLERK_SECRET_KEY).
 * Skip by setting CLERK_TESTING_TOKEN directly (useful in CI).
 */

const hasBrowserbase =
	!!process.env.BROWSERBASE_API_KEY && !!process.env.BROWSERBASE_PROJECT_ID;

export default defineConfig({
	globalSetup: "./e2e/global-setup.ts",
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: [["list"], ["./e2e/quality-gate-reporter.ts"]],
	use: {
		baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
		trace: "on-first-retry",
		screenshot: "only-on-failure",
		video: "off",
		locale: "en-US",
		// Connect to Browserbase cloud browser when credentials are provided.
		// Falls back to local browser launch when env vars are absent.
		...(hasBrowserbase
			? {
					connectOptions: {
						wsEndpoint: `wss://connect.browserbase.com?apiKey=${process.env.BROWSERBASE_API_KEY}&projectId=${process.env.BROWSERBASE_PROJECT_ID}`,
					},
				}
			: {}),
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
				// Ignored when connecting to Browserbase (remote browser).
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
