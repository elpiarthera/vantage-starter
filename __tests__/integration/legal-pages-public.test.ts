/**
 * Regression test: legal and accessibility pages must be reachable without
 * an account (regulatory obligation). This imports the REAL `isPublicRoute`
 * matcher exported from `middleware.ts` -- not a re-typed inline copy --
 * so it fails the instant the real route list regresses.
 */

import { isPublicRoute } from "@/middleware";

// Mock next-intl surfaces middleware.ts touches at module load time. Only
// `clerkMiddleware` is mocked -- it is not what this suite verifies, and the
// real implementation requires a live request/auth context jsdom cannot
// provide. `createRouteMatcher` is kept REAL (via `jest.requireActual`):
// it is the primitive `isPublicRoute` is built on, and a re-typed regex
// clone of it disagrees with the real one on malformed entries (a malformed
// route string makes the real `createRouteMatcher` THROW -- see the
// "malformed route entry" test below -- while a hand-rolled regex clone
// would silently keep matching). A guard on a rewritten primitive proves
// nothing about the primitive itself.
jest.mock("@clerk/nextjs/server", () => ({
	...jest.requireActual("@clerk/nextjs/server"),
	clerkMiddleware: jest.fn((fn) => fn),
}));

jest.mock("next-intl/middleware", () => ({
	__esModule: true,
	default: jest.fn(() => jest.fn()),
}));

// jsdom has no global Request/Response, which `next/server` needs at import
// time -- stub it out, this test only needs `NextResponse.next()` to exist.
jest.mock("next/server", () => ({
	NextResponse: { next: jest.fn(() => ({ headers: new Map() })) },
}));

jest.mock("@/lib/csp.mjs", () => ({ buildCsp: jest.fn(() => "") }));

jest.mock("@/i18n/routing", () => ({
	routing: {
		locales: ["en", "fr", "de", "it", "es", "pt", "ru"],
		defaultLocale: "en",
	},
}));

const mockRequest = (pathname: string) =>
	({ nextUrl: { pathname }, url: `http://localhost${pathname}` }) as never;

describe("middleware isPublicRoute -- legal/accessibility pages", () => {
	const legalPaths = [
		"/en/legal",
		"/en/privacy",
		"/en/accessibility",
		"/fr/accessibilite",
		"/fr/schema-accessibilite",
		"/en/accessibility-plan",
		// Bare (no locale prefix) forms -- these are what actually serve the
		// page: next-intl's "as-needed" rewrite sends the default-locale
		// prefixed path (e.g. /en/legal) straight to the bare one (/legal)
		// before this matcher is what decides whether it 200s or 307s to
		// sign-up. Asserting only the prefixed forms leaves the form doing
		// the real work untested.
		"/legal",
		"/privacy",
		"/accessibility",
		"/accessibility-plan",
		"/accessibilite",
		"/schema-accessibilite",
	];

	it.each(legalPaths)("allows %s without authentication", (path) => {
		expect(isPublicRoute(mockRequest(path))).toBe(true);
	});

	it("still rejects the dashboard (negative control)", () => {
		expect(isPublicRoute(mockRequest("/en/dashboard"))).toBe(false);
	});

	it("no longer treats /watch or /shared as public (dead routes removed)", () => {
		expect(isPublicRoute(mockRequest("/en/watch/abc"))).toBe(false);
		expect(isPublicRoute(mockRequest("/en/shared/abc"))).toBe(false);
	});

	it("a malformed matcher entry throws on the real primitive instead of silently matching -- the class of defect a re-typed regex mock cannot catch", () => {
		const { createRouteMatcher } = jest.requireActual("@clerk/nextjs/server");
		expect(() => createRouteMatcher(["/report*"])).toThrow();
	});
});
