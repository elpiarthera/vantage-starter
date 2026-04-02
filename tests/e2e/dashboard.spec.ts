import { setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test } from "@playwright/test";

/**
 * Dashboard tests — requires CLERK_TESTING_TOKEN (Clerk Testing Mode).
 *
 * All tests in this file are skipped when CLERK_TESTING_TOKEN is absent.
 * See: https://clerk.com/docs/testing/playwright
 */

const HAS_AUTH = !!process.env.CLERK_TESTING_TOKEN;

test.describe("Dashboard", () => {
	test.beforeEach(async ({ page }) => {
		if (!HAS_AUTH) {
			test.skip(true, "requires CLERK_TESTING_TOKEN env var");
			return;
		}

		await setupClerkTestingToken({ page });

		// Sign in with Clerk test identity
		await page.goto("/en/sign-in", { waitUntil: "domcontentloaded" });
		await page.getByLabel(/phone/i).first().fill("+15555550100");
		await page.getByRole("button", { name: /continue/i }).click();

		const otpInput = page.locator('input[name="code"]').first();
		await otpInput.waitFor({ timeout: 10_000 });
		await otpInput.fill("424242");

		await expect(page).toHaveURL(/dashboard/, { timeout: 15_000 });
		await page.waitForLoadState("networkidle", { timeout: 15_000 });
	});

	test("should load dashboard after authentication", async ({ page }) => {
		if (!HAS_AUTH) {
			test.skip(true, "requires CLERK_TESTING_TOKEN env var");
			return;
		}

		await expect(page).not.toHaveTitle(/404|Error/i);
		await expect(page.locator("#main-content")).toBeVisible();
	});

	test("should show sidebar navigation", async ({ page }) => {
		if (!HAS_AUTH) {
			test.skip(true, "requires CLERK_TESTING_TOKEN env var");
			return;
		}

		const sidebar = page.getByRole("navigation", { name: "Main navigation" });
		await expect(sidebar).toBeVisible();

		const navLinks = sidebar.getByRole("link");
		const count = await navLinks.count();
		expect(count).toBeGreaterThanOrEqual(5);
	});
});
