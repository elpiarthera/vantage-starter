import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { buildCsp } from "@/lib/csp.mjs";

// Create the intl middleware
const intlMiddleware = createIntlMiddleware(routing);

// The policy itself lives in lib/csp.mjs — one source shared with next.config.mjs.
// It is applied here (not only via next.config headers()) so it lands on every
// Vercel Edge response, including static/rewrite paths where Next.js skips the
// config headers().
const CSP = buildCsp();

function applyCSP(response: NextResponse): NextResponse {
	response.headers.set("Content-Security-Policy", CSP);
	return response;
}

// Define public routes (include locale prefixes explicitly to avoid broad matching)
export const isPublicRoute = createRouteMatcher([
	"/",
	"/(en|fr|de|it|es|pt|ru)",
	"/(en|fr|de|it|es|pt|ru)/sign-in(.*)",
	"/sign-in(.*)",
	"/(en|fr|de|it|es|pt|ru)/sign-up(.*)",
	"/sign-up(.*)",
	"/api/webhooks(.*)", // Webhooks are public (Clerk validates signatures)
	// Legal/accessibility pages are a regulatory obligation -- must be
	// readable without an account, in every locale and without prefix.
	"/(en|fr|de|it|es|pt|ru)/legal(.*)",
	"/legal(.*)",
	"/(en|fr|de|it|es|pt|ru)/privacy(.*)",
	"/privacy(.*)",
	"/(en|fr|de|it|es|pt|ru)/accessibility(.*)",
	"/accessibility(.*)",
	"/(en|fr|de|it|es|pt|ru)/accessibility-plan(.*)",
	"/accessibility-plan(.*)",
	"/(en|fr|de|it|es|pt|ru)/accessibilite(.*)",
	"/accessibilite(.*)",
	"/(en|fr|de|it|es|pt|ru)/schema-accessibilite(.*)",
	"/schema-accessibilite(.*)",
	// Public lead-capture form (mcpcn `contact-form` block,
	// docs/mcpcn-block-mapping.md §4 "contact-form") — unauthenticated by
	// design, same reasoning as the legal/accessibility pages above.
	"/(en|fr|de|it|es|pt|ru)/contact(.*)",
	"/contact(.*)",
	// Note: /api/chat and other protected API routes are NOT listed here
	// They will be authenticated by Clerk middleware before the route handler runs
]);

// Check if this is an API route - should NOT go through intl middleware
const isApiRoute = (pathname: string) => pathname.startsWith("/api");

export default clerkMiddleware(
	async (auth, request) => {
		const pathname = request.nextUrl.pathname;
		const isPublic = isPublicRoute(request);
		const method = request.method;

		// Skip intl middleware for API routes - they should NOT be locale-prefixed
		if (isApiRoute(pathname)) {
			// Protect non-public API routes
			if (!isPublic) {
				await auth.protect();
			}
			return applyCSP(NextResponse.next());
		}

		// Protect non-public routes BEFORE intl middleware
		if (!isPublic) {
			const url = new URL(request.url);
			// Derive the active locale from the request path so the auth redirect
			// lands on the sign-up page in the user's own locale. With
			// localePrefix: "as-needed" the defaultLocale carries NO prefix, so
			// the sign-up path must omit the prefix entirely when the locale is
			// the default one -- emitting "/en/sign-up" would 307-loop back to
			// "/sign-up" under next-intl's "as-needed" rewrite.
			const segments = pathname.split("/");
			const maybeLocale = segments[1];
			const matchedLocale = (routing.locales as readonly string[]).includes(
				maybeLocale,
			)
				? maybeLocale
				: routing.defaultLocale;
			const signUpPath =
				matchedLocale === routing.defaultLocale
					? "/sign-up"
					: `/${matchedLocale}/sign-up`;
			const signUpUrl = new URL(signUpPath, request.url);
			signUpUrl.searchParams.set("redirect_url", url.toString());

			await auth.protect({
				unauthenticatedUrl: signUpUrl.toString(),
			});
		}

		// Skip intl middleware for non-GET requests to pages
		// This handles Clerk's internal POST requests for session syncing
		// which might otherwise be interfered with by next-intl's rewrites/redirects.
		if (method !== "GET") {
			return applyCSP(NextResponse.next());
		}

		// Run i18n middleware for locale detection and routing (pages only)
		const response = intlMiddleware(request);
		return applyCSP(response);
	},
	{
		// NOTE: these are clerkMiddleware's static top-level fallback URLs,
		// evaluated once at middleware creation with no access to the incoming
		// request -- they CANNOT be made locale-aware here. The actual
		// unauthenticated redirect used on every real page load is the
		// locale-derived `unauthenticatedUrl` passed to `auth.protect()` above,
		// which is what determines the URL a French/German user actually sees.
		// These two remain the English-default fallback Clerk itself would use
		// if auth.protect() were ever called without an explicit unauthenticatedUrl.
		signInUrl: "/sign-in",
		signUpUrl: "/sign-up",
	},
);

export const config = {
	matcher: [
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		"/(api|trpc)(.*)",
	],
};
