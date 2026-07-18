/**
 * Playwright fixtures — browser provisioning.
 *
 * NOMINAL PATH (always, including CI): local Chromium, launched directly.
 * This is the tested, budgeted default — no external service, no cost.
 *
 * OPT-IN PATH (currently DISABLED by budget decision, not by defect):
 * Browserbase remote sessions. The operator (Laurent) has banned this
 * service fleet-wide for now — the human is the visual verifier and the
 * spend is not approved. The wiring is intentionally kept in place (not
 * deleted) so it can be reactivated when budget allows; destroying it to
 * rebuild later would be waste. It only activates if BOTH
 * BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID are set in the
 * environment — which no CI workflow in this repo does. If BB_CONTEXT_ID
 * is also set, the session loads the persistent context (auth state,
 * cookies, localStorage) so tests start already authenticated after a
 * manual login run.
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
	// Nominal case: local Chromium. This is the defined, budgeted default —
	// it runs whenever the Browserbase opt-in is not fully configured
	// (either both keys absent, the normal case, or only partially set,
	// which is treated the same as absent: no crash, no silent skip).
	// Each worker (not each test) gets its own browser instance.
	browser: [
		// biome-ignore lint/correctness/noEmptyPattern: Playwright requires destructuring even when no fixtures are used
		async ({}, use) => {
			if (hasBrowserbase) {
				// Opt-in path — only reached when BOTH Browserbase keys are set.
				// Disabled by budget decision in every CI workflow in this repo.
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
				return;
			}

			// Local Chromium — the nominal, tested path.
			const browser = await chromium.launch({
				args: ["--no-sandbox", "--disable-setuid-sandbox"],
			});
			await use(browser);
			await browser.close();
		},
		{ scope: "worker" },
	],
});
