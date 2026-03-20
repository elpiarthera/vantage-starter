import { expect, test } from "@playwright/test";

/**
 * Dashboard tests — requires authentication via CLERK_TESTING_TOKEN
 *
 * These tests are skipped when CLERK_TESTING_TOKEN is not set in the environment.
 * To run them: set CLERK_TESTING_TOKEN=<your_token> pnpm test:e2e
 *
 * See: https://clerk.com/docs/testing/overview
 */

const HAS_AUTH = !!process.env.CLERK_TESTING_TOKEN;

test.describe("Dashboard", () => {
	test.beforeEach(async ({ page }) => {
		if (!HAS_AUTH) {
			test.skip(true, "requires CLERK_TESTING_TOKEN env var");
			return;
		}

		// Inject Clerk testing token so the session is treated as authenticated
		await page.addInitScript(() => {
			(
				window as Window & { __clerk_testing_token?: string }
			).__clerk_testing_token = process.env.CLERK_TESTING_TOKEN;
		});

		await page.goto("/en/dashboard");
		// Wait for dashboard content to mount (Convex hydration may take a moment)
		await page.waitForLoadState("networkidle", { timeout: 15_000 });
	});

	test("dashboard page loads", async ({ page }) => {
		if (!HAS_AUTH) {
			test.skip(true, "requires CLERK_TESTING_TOKEN env var");
			return;
		}
		await expect(page).not.toHaveTitle(/404|Error/i);
		await expect(page.locator("#main-content")).toBeVisible();
	});

	test("sidebar shows 5 nav items", async ({ page }) => {
		if (!HAS_AUTH) {
			test.skip(true, "requires CLERK_TESTING_TOKEN env var");
			return;
		}

		// AppSidebar nav: Dashboard, Chat, Missions, Architect (OVERVIEW group) + Settings (WORKSPACE group)
		const sidebar = page.getByRole("navigation", { name: "Main navigation" });
		await expect(sidebar).toBeVisible();

		// Count nav links in the sidebar (Dashboard, Chat, Missions, Architect, Settings)
		const navLinks = sidebar.getByRole("link");
		// 5 nav items + VantageStarter logo link = 6 total links
		const count = await navLinks.count();
		expect(count).toBeGreaterThanOrEqual(5);
	});

	test("credit balance card is visible", async ({ page }) => {
		if (!HAS_AUTH) {
			test.skip(true, "requires CLERK_TESTING_TOKEN env var");
			return;
		}

		await expect(
			page.getByText("Credit balance", { exact: true }),
		).toBeVisible();
	});

	test("Start with the Architect CTA is visible", async ({ page }) => {
		if (!HAS_AUTH) {
			test.skip(true, "requires CLERK_TESTING_TOKEN env var");
			return;
		}

		await expect(
			page.getByRole("heading", { name: "Start with the Architect" }),
		).toBeVisible();
	});

	test("clicking Architect nav item navigates to /dashboard/architect", async ({
		page,
	}) => {
		if (!HAS_AUTH) {
			test.skip(true, "requires CLERK_TESTING_TOKEN env var");
			return;
		}

		const sidebar = page.getByRole("navigation", { name: "Main navigation" });
		await sidebar.getByRole("link", { name: /architect/i }).click();

		await page.waitForURL("**/dashboard/architect");
		expect(page.url()).toMatch(/\/dashboard\/architect/);
	});

	test("clicking Missions nav item navigates to /dashboard/missions", async ({
		page,
	}) => {
		if (!HAS_AUTH) {
			test.skip(true, "requires CLERK_TESTING_TOKEN env var");
			return;
		}

		const sidebar = page.getByRole("navigation", { name: "Main navigation" });
		await sidebar.getByRole("link", { name: /missions/i }).click();

		await page.waitForURL("**/dashboard/missions");
		expect(page.url()).toMatch(/\/dashboard\/missions/);
	});
});
