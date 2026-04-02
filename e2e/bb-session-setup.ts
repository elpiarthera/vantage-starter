/**
 * Browserbase session setup — runs in Playwright globalSetup before tests.
 *
 * Creates a Browserbase session with the persistent context ID (BB_CONTEXT_ID)
 * so cookies, localStorage, and auth state are preserved across test runs.
 * Writes the session's wsEndpoint to BB_WS_ENDPOINT for the Playwright config
 * to consume via connectOptions.
 *
 * Only runs when BROWSERBASE_API_KEY + BROWSERBASE_PROJECT_ID are set.
 * When BB_CONTEXT_ID is absent, creates a plain session (no persistence).
 */

import Browserbase from "@browserbasehq/sdk";

export async function setupBrowserbaseSession(): Promise<void> {
	const apiKey = process.env.BROWSERBASE_API_KEY;
	const projectId = process.env.BROWSERBASE_PROJECT_ID;

	if (!apiKey || !projectId) {
		return;
	}

	const bb = new Browserbase({ apiKey });
	const contextId = process.env.BB_CONTEXT_ID;

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

	// Make the wsEndpoint available to playwright.config.ts
	process.env.BB_WS_ENDPOINT = session.connectUrl;
	process.env.BB_SESSION_ID = session.id;

	console.log(`Browserbase session created: ${session.id}`);
	if (contextId) {
		console.log(`Using persistent context: ${contextId}`);
	}
}
