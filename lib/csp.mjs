/**
 * Single source of truth for the Content-Security-Policy.
 *
 * Consumed by BOTH `middleware.ts` (applied on every Vercel Edge response) and
 * `next.config.mjs` (static `headers()`). Keep it here: two copies of one
 * contract diverge, and they diverge first on their failure mode.
 *
 * Authored as `.mjs` (with a sibling `.d.mts`) because `next.config.mjs` is
 * plain ESM and cannot import TypeScript.
 *
 * Clerk hosts:
 *   - `https://*.clerk.accounts.dev` is Clerk's shared DEVELOPMENT domain and is
 *     correct for every tenant, so it is always emitted.
 *   - A Clerk custom/satellite domain is tenant-specific. It comes from
 *     `NEXT_PUBLIC_CLERK_DOMAIN` and is OMITTED ENTIRELY when unset — never
 *     emitted as an empty string or the literal `undefined`, which would produce
 *     a malformed directive and silently break auth.
 *
 * Cloudflare Turnstile (Clerk CAPTCHA) requires `https://challenges.cloudflare.com`
 * in both `script-src` and `frame-src`. `script-src-elem` mirrors `script-src`
 * explicitly to suppress the "not explicitly set" browser warning.
 */

/**
 * Normalise the configured Clerk custom domain into a CSP source expression.
 * Returns an empty array when unset/blank so the caller can spread it away.
 */
function clerkCustomDomainSources(rawDomain) {
	const domain = (rawDomain ?? "").trim();
	if (domain === "") return [];
	return [domain.startsWith("http") ? domain : `https://${domain}`];
}

export function buildCsp(rawDomain = process.env.NEXT_PUBLIC_CLERK_DOMAIN) {
	const clerkCustom = clerkCustomDomainSources(rawDomain);

	const scriptSrcHosts = [
		"'self'",
		"'unsafe-eval'",
		"'unsafe-inline'",
		"https://*.clerk.accounts.dev",
		...clerkCustom,
		"https://challenges.cloudflare.com",
		"https://vercel.live",
	].join(" ");

	const frameSrcHosts = [
		"'self'",
		"https://challenges.cloudflare.com",
		...clerkCustom,
		"https://*.clerk.accounts.dev",
		"https://vercel.live",
		"https://polar.sh",
		"https://sandbox.polar.sh",
	].join(" ");

	return [
		"default-src 'self'",
		`script-src ${scriptSrcHosts}`,
		`script-src-elem ${scriptSrcHosts}`,
		"worker-src 'self' blob:",
		"style-src 'self' 'unsafe-inline' https:",
		"img-src 'self' data: blob: https:",
		"media-src 'self' blob: data: https:",
		"font-src 'self' data: https:",
		"connect-src 'self' blob: https: wss: https://r.resend.com https://click.resend.com",
		`frame-src ${frameSrcHosts}`,
		"object-src 'none'",
		"base-uri 'self'",
		"form-action 'self' https:",
		"frame-ancestors 'self'",
		"upgrade-insecure-requests",
	].join("; ");
}
