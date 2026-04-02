import { clerkSetup } from "@clerk/testing/playwright";

/**
 * Playwright global setup — initialises Clerk Testing Mode.
 *
 * Fetches the testing token from Clerk's Backend API using
 * NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY.
 * Only runs when CLERK_TESTING_TOKEN is not already set.
 */
export default async function globalSetup() {
	if (process.env.CLERK_TESTING_TOKEN) {
		// Token already injected (e.g. passed directly in CI) — skip fetch.
		return;
	}
	await clerkSetup();
}
