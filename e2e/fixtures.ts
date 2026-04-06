/**
 * Playwright fixtures — Browserbase session management.
 *
 * When BROWSERBASE_API_KEY + BROWSERBASE_PROJECT_ID are present, each test
 * worker gets its own Browserbase session via connectOverCDP. If BB_CONTEXT_ID
 * is also set, the session loads the persistent context (auth state, cookies,
 * localStorage) so tests start already authenticated after a manual login run.
 *
 * Falls back to standard Playwright browser when BB keys are absent.
 *
 * Usage in test files:
 *   import { test, expect } from "./fixtures";
 *   // instead of: import { test, expect } from "@playwright/test";
 */

import Browserbase from "@browserbasehq/sdk";
import { type Browser, test as base, chromium } from "@playwright/test";

export { expect } from "@playwright/test";

const hasBrowserbase =
	!!process.env.BROWSERBASE_API_KEY && !!process.env.BROWSERBASE_PROJECT_ID;

type BbFixtures = {
	/** The active browser — Browserbase session or local Chromium. */
	browser: Browser;
};

export const test = base.extend<BbFixtures>({
	// Override the `browser` fixture to connect to Browserbase when keys are set.
	// Each worker (not each test) gets its own browser instance.
	browser: [
		// biome-ignore lint/correctness/noEmptyPattern: Playwright requires destructuring even when no fixtures are used
		async ({}, use) => {
			if (!hasBrowserbase) {
				// Local fallback — launch Chromium directly.
				const browser = await chromium.launch({
					args: ["--no-sandbox", "--disable-setuid-sandbox"],
				});
				await use(browser);
				await browser.close();
				return;
			}

			const apiKey = process.env.BROWSERBASE_API_KEY as string;
			const projectId = process.env.BROWSERBASE_PROJECT_ID as string;
			const contextId = process.env.BB_CONTEXT_ID;

			const bb = new Browserbase({ apiKey });

			// Create a Browserbase session — optionally with a persistent context.
			const session = await bb.sessions.create({
				projectId,
				...(contextId
					? {
							browserSettings: {
								context: {
									id: contextId,
									persist: true,
								},
							},
						}
					: {}),
			});

			// Connect via CDP — Browserbase uses CDP, not Playwright Server protocol.
			const browser = await chromium.connectOverCDP(session.connectUrl, {
				timeout: 30_000,
			});

			await use(browser);

			// Disconnect — Browserbase auto-closes the session.
			await browser.close();
		},
		{ scope: "worker" },
	],
});
