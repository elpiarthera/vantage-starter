import { expect, test } from "@playwright/test";

/**
 * Auth flow tests
 *
 * Covers unauthenticated redirect and sign-in page rendering.
 * These tests do NOT require a Clerk test user.
 */

test.describe("Auth flow", () => {
	test("unauthenticated /dashboard redirects to sign-up", async ({ page }) => {
		// The middleware redirects unauthenticated requests to /sign-up
		// (see middleware.ts → auth.protect → unauthenticatedUrl: signUpUrl)
		await page.goto("/en/dashboard");

		// Should land on sign-up (or sign-in) — not dashboard
		await page.waitForURL((url) => {
			const path = url.pathname;
			return path.includes("/sign-up") || path.includes("/sign-in");
		});

		const currentUrl = page.url();
		expect(currentUrl).toMatch(/sign-up|sign-in/);
	});

	test("sign-in page loads with Clerk component", async ({ page }) => {
		// Use domcontentloaded to avoid waiting on Clerk iframes / Cloudflare Turnstile
		// which can trigger CSP-related network aborts in headless environments.
		await page.goto("/en/sign-in", { waitUntil: "domcontentloaded" });

		// At minimum the page must load without a 404/500
		await expect(page).not.toHaveTitle(/404|Error/i);

		// Wait for Next.js to hydrate — the sign-in heading is set in translations
		await expect(
			page.getByRole("heading", { name: /sign.in|sign in/i }),
		).toBeVisible({ timeout: 10_000 });
	});
});
