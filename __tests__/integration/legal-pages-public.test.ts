/**
 * Regression test: legal and accessibility pages must be reachable without
 * an account (regulatory obligation). This imports the REAL `isPublicRoute`
 * matcher exported from `middleware.ts` -- not a re-typed inline copy --
 * so it fails the instant the real route list regresses.
 */

import { isPublicRoute } from "@/middleware";

// Mock Clerk + next-intl surfaces middleware.ts touches at module load time.
jest.mock("@clerk/nextjs/server", () => ({
	clerkMiddleware: jest.fn((fn) => fn),
	createRouteMatcher: jest.fn(
		(routes: string[]) => (req: { nextUrl?: { pathname: string } }) => {
			const path = req.nextUrl?.pathname ?? "";
			return routes.some((route) => {
				const pattern = route
					.replace(/\(en\|fr\|de\|it\|es\|pt\|ru\)/g, "(en|fr|de|it|es|pt|ru)")
					.replace(/\(\.\*\)/g, ".*");
				const regex = new RegExp(`^${pattern}$`);
				return regex.test(path);
			});
		},
	),
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
});
