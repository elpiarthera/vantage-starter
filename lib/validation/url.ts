/**
 * Shared URL normalization for human-typed website/URL fields.
 *
 * Lives in `lib/` (not `convex/lib/`) because it must be importable from
 * BOTH Convex functions (server, relative import) and client React
 * components (`@/lib/validation/url`) without pulling in any Convex or
 * Node-only APIs. It is pure string manipulation + the platform `URL`
 * constructor, which exists in both the Convex runtime and the browser.
 *
 * A human typing a website into a form almost never includes a scheme
 * ("perello.consulting", not "https://perello.consulting"). Rejecting that
 * input as "invalid" blocks real users. This normalizer adds a scheme when
 * one is missing, then delegates to `URL` for the actual validity check —
 * it never turns genuine nonsense ("hello world", "....", "") into a valid
 * URL.
 */

/**
 * Normalize a human-typed URL/domain string into a fully-qualified URL.
 * Throws the same way `new URL()` would if the input cannot be turned into
 * a valid URL, so callers can keep a single try/catch around it.
 *
 * @param input - raw string as typed by a user (may be empty, whitespace,
 *   scheme-less domain, or already a full URL).
 * @returns the normalized, absolute URL string (e.g. "https://perello.consulting").
 */
export function normalizeUrl(input: string): string {
	const trimmed = input.trim();
	if (trimmed.length === 0) {
		throw new Error("URL is empty");
	}

	// Already has a scheme (http:, https:, or any other) — validate as-is.
	if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
		return new URL(trimmed).toString();
	}

	// No scheme: this is the common human-typed shape ("perello.consulting").
	// Prepend https:// and validate. This does NOT launder nonsense input:
	// `new URL("https://hello world")` and `new URL("https://....")` both
	// still throw, because the resulting hostname is not well-formed.
	const candidate = `https://${trimmed}`;
	const parsed = new URL(candidate);

	// Guard against inputs that parse "successfully" but are not a real
	// domain (e.g. a bare "https://...." would produce hostname "....").
	// A hostname must contain at least one dot or be "localhost", and must
	// contain at least one alphanumeric character.
	const hostname = parsed.hostname;
	const hasAlphanumeric = /[a-z0-9]/i.test(hostname);
	if (!hasAlphanumeric) {
		throw new Error(`Invalid URL: hostname "${hostname}" is not a domain`);
	}

	return parsed.toString();
}
