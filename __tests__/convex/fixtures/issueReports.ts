/**
 * Domain-valid args for `api.issueReports.submit`, extracted to its own
 * (non-test) module — same rationale as
 * `__tests__/convex/fixtures/contactSubmissions.ts`: this lets
 * `__tests__/convex/global-rate-limit-guard.test.ts` import a known-good args
 * template WITHOUT re-executing `issueReports.test.ts`'s own suite.
 *
 * `issueReports.test.ts` imports this SAME object rather than hand-typing its
 * own copy, so the two can never drift apart.
 */

export const VALID_ARGS = {
	name: "Ada Lovelace",
	email: "ada@example.com",
	category: "Software",
	subcategory: "Browser",
	issueTitle: "Login button does nothing",
	description: "Clicking Sign In produces no navigation and no error.",
	urgency: "immediate",
};
