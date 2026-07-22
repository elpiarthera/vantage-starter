/**
 * Shared email validity check for human-typed email fields.
 *
 * Lives in `lib/` (not `convex/lib/`) because it must be importable from
 * BOTH Convex functions (server, relative import — see `convex/contactSubmissions.ts`)
 * AND client React components (`@/lib/validation/email` — see
 * `app/[locale]/contact/page.tsx`), without pulling in any Convex or
 * Node-only APIs. It is pure string manipulation + a regex, both of which
 * exist identically in the Convex runtime and the browser.
 *
 * The same function backs BOTH the client-side gate (the mutation is never
 * called for an invalid email — `docs/mcpcn-block-mapping.md` §4
 * "contact-form" TDD assertion) and the server-side check inside the
 * mutation itself (defense in depth against a caller that bypasses the
 * client, e.g. a scripted POST straight to the Convex deployment).
 */

// Deliberately not RFC 5322-complete (that grammar accepts addresses no real
// mail provider issues, e.g. quoted local parts). This is the same
// pragmatic shape most production forms use: one "@", a non-empty local
// part, and a domain with at least one dot and no whitespace.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @param input - raw string as typed by a user (may be empty or whitespace).
 * @returns true if the trimmed input looks like a deliverable email address.
 */
export function isValidEmail(input: string): boolean {
	const trimmed = input.trim();
	if (trimmed.length === 0) {
		return false;
	}
	return EMAIL_PATTERN.test(trimmed);
}
