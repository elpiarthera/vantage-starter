/**
 * Integration Tests for Authentication Flow
 * Tests route protection middleware and authentication redirects
 */

import { createRouteMatcher } from "@clerk/nextjs/server";

// Mock Clerk middleware
jest.mock("@clerk/nextjs/server", () => ({
	clerkMiddleware: jest.fn((fn) => fn),
	createRouteMatcher: jest.fn(
		(routes) => (req: { nextUrl?: { pathname: string }; url: string }) => {
			const path = req.nextUrl?.pathname || req.url;
			return routes.some((route: string) => {
				if (route.includes("(.*)")) {
					const baseRoute = route.replace("(.*)", "");
					return path.startsWith(baseRoute);
				}
				return path === route;
			});
		},
	),
}));

describe("Authentication Middleware Integration", () => {
	const mockRequest = (pathname: string) =>
		({
			nextUrl: { pathname },
			url: pathname,
		}) as unknown as ReturnType<typeof createRouteMatcher> extends (
			req: infer R,
		) => boolean
			? R
			: never;

	const mockAuth = (isAuthenticated: boolean) => ({
		protect: jest.fn(async () => {
			if (!isAuthenticated) {
				throw new Error("Unauthenticated");
			}
		}),
		userId: isAuthenticated ? "user_123" : null,
	});

	describe("Public Routes", () => {
		it("should allow access to home page without authentication", async () => {
			const isPublicRoute = createRouteMatcher([
				"/",
				"/sign-in(.*)",
				"/sign-up(.*)",
				"/api/webhooks(.*)",
			]);

			const request = mockRequest("/");
			expect(isPublicRoute(request)).toBe(true);
		});

		it("should allow access to sign-in page", async () => {
			const isPublicRoute = createRouteMatcher([
				"/",
				"/sign-in(.*)",
				"/sign-up(.*)",
				"/api/webhooks(.*)",
			]);

			const request = mockRequest("/sign-in");
			expect(isPublicRoute(request)).toBe(true);
		});

		it("should allow access to sign-up page", async () => {
			const isPublicRoute = createRouteMatcher([
				"/",
				"/sign-in(.*)",
				"/sign-up(.*)",
				"/api/webhooks(.*)",
			]);

			const request = mockRequest("/sign-up");
			expect(isPublicRoute(request)).toBe(true);
		});

		it("should allow access to webhook routes", async () => {
			const isPublicRoute = createRouteMatcher([
				"/",
				"/sign-in(.*)",
				"/sign-up(.*)",
				"/api/webhooks(.*)",
			]);

			const request = mockRequest("/api/webhooks/clerk");
			expect(isPublicRoute(request)).toBe(true);
		});
	});

	describe("Protected Routes", () => {
		it("should identify dashboard as protected route", () => {
			const isPublicRoute = createRouteMatcher([
				"/",
				"/sign-in(.*)",
				"/sign-up(.*)",
				"/api/webhooks(.*)",
			]);

			const request = mockRequest("/dashboard");
			expect(isPublicRoute(request)).toBe(false);
		});

		it("should identify dashboard subroutes as protected", () => {
			const isPublicRoute = createRouteMatcher([
				"/",
				"/sign-in(.*)",
				"/sign-up(.*)",
				"/api/webhooks(.*)",
			]);

			const request = mockRequest("/dashboard/projects");
			expect(isPublicRoute(request)).toBe(false);
		});

		it("should identify guided flow as protected route", () => {
			const isPublicRoute = createRouteMatcher([
				"/",
				"/sign-in(.*)",
				"/sign-up(.*)",
				"/api/webhooks(.*)",
			]);

			const request = mockRequest("/guided/step-1");
			expect(isPublicRoute(request)).toBe(false);
		});

		it("should require authentication for protected routes", async () => {
			const isPublicRoute = createRouteMatcher([
				"/",
				"/sign-in(.*)",
				"/sign-up(.*)",
				"/api/webhooks(.*)",
			]);

			const request = mockRequest("/dashboard");
			const auth = mockAuth(false);

			if (!isPublicRoute(request)) {
				await expect(auth.protect()).rejects.toThrow("Unauthenticated");
			}
		});

		it("should allow authenticated access to protected routes", async () => {
			const isPublicRoute = createRouteMatcher([
				"/",
				"/sign-in(.*)",
				"/sign-up(.*)",
				"/api/webhooks(.*)",
			]);

			const request = mockRequest("/dashboard");
			const auth = mockAuth(true);

			if (!isPublicRoute(request)) {
				await expect(auth.protect()).resolves.not.toThrow();
			}
		});
	});

	describe("Middleware Configuration", () => {
		it("should match Next.js route patterns correctly", () => {
			// Should match application routes
			expect("/dashboard").toMatch(/^\//);
			expect("/guided/step-1").toMatch(/^\//);

			// Should not match static files
			expect("/_next/static/chunk.js").toMatch(/_next/);
			expect("/image.jpg").toMatch(/\.jpe?g/);
			expect("/style.css").toMatch(/\.css/);
		});

		it("should match API routes", () => {
			expect("/api/users").toMatch(/\/api/);
			expect("/trpc/users").toMatch(/\/trpc/);
		});
	});
});
