import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test } from "@playwright/test";

/**
 * Auth flow tests — uses @clerk/testing for OTP bypass.
 *
 * Unauthenticated redirect test runs always.
 * Sign-in test requires CLERK_TESTING_TOKEN to be set (Clerk Testing Mode).
 *
 * Clerk Testing Mode: phone +15555550100, OTP bypass code 424242.
 * See: https://clerk.com/docs/testing/playwright
 */

test.describe("Authentication", () => {
	test("should redirect unauthenticated user to sign-in", async ({ page }) => {
		await page.goto("/en/dashboard");

		await page.waitForURL((url) => {
			const path = url.pathname;
			return path.includes("/sign-up") || path.includes("/sign-in");
		});

		expect(page.url()).toMatch(/sign-up|sign-in/);
	});

	test("should sign in with Clerk test credentials", async ({ page }) => {
		if (!process.env.CLERK_TESTING_TOKEN) {
			test.skip(true, "requires CLERK_TESTING_TOKEN env var");
			return;
		}

		await setupClerkTestingToken({ page });
		await page.goto("/en/sign-in", { waitUntil: "domcontentloaded" });

		// Fill phone number — Clerk testing mode test identity
		await page.getByLabel(/phone/i).first().fill("+15555550100");
		await page.getByRole("button", { name: /continue/i }).click();

		// Enter OTP bypass code — 424242 always works in Clerk testing mode
		const otpInput = page.locator('input[name="code"]').first();
		await otpInput.waitFor({ timeout: 10_000 });
		await otpInput.fill("424242");

		// Should land on dashboard after sign-in
		await expect(page).toHaveURL(/dashboard/, { timeout: 15_000 });
	});

	test("should sign out successfully", async ({ page }) => {
		if (!process.env.CLERK_TESTING_TOKEN) {
			test.skip(true, "requires CLERK_TESTING_TOKEN env var");
			return;
		}

		await setupClerkTestingToken({ page });
		await page.goto("/en/dashboard");
		await expect(page).toHaveURL(/dashboard/, { timeout: 15_000 });

		// Sign out via Clerk
		await clerk.signOut({ page });

		await page.waitForURL((url) => {
			const path = url.pathname;
			return path.includes("/sign-up") || path.includes("/sign-in");
		});

		expect(page.url()).toMatch(/sign-up|sign-in/);
	});
});
