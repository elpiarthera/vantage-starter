import { expect, test } from "./fixtures";

/**
 * Missions page tests — requires authentication via CLERK_TESTING_TOKEN
 *
 * These tests are skipped when CLERK_TESTING_TOKEN is not set in the environment.
 * The empty state ("No missions yet") is tested as the baseline for a fresh account.
 */

const HAS_AUTH = !!process.env.CLERK_TESTING_TOKEN;

test.describe("Missions page", () => {
	test.beforeEach(async ({ page }) => {
		if (!HAS_AUTH) {
			test.skip(true, "requires CLERK_TESTING_TOKEN env var");
			return;
		}

		await page.addInitScript(() => {
			(
				window as Window & { __clerk_testing_token?: string }
			).__clerk_testing_token = process.env.CLERK_TESTING_TOKEN;
		});

		await page.goto("/en/dashboard/missions");
		await page.waitForLoadState("networkidle", { timeout: 15_000 });
	});

	test("page loads with Missions heading", async ({ page }) => {
		if (!HAS_AUTH) {
			test.skip(true, "requires CLERK_TESTING_TOKEN env var");
			return;
		}

		await expect(
			page.getByRole("heading", { name: "Missions", level: 1 }),
		).toBeVisible();
	});

	test("shows No missions yet when no missions exist", async ({ page }) => {
		if (!HAS_AUTH) {
			test.skip(true, "requires CLERK_TESTING_TOKEN env var");
			return;
		}

		// Wait for Convex data to load (skeleton → content)
		// The page renders skeletons while loading, then either mission cards or empty state.
		await page.waitForFunction(
			() => {
				// Skeletons disappear when data arrives
				const skeletons = document.querySelectorAll("[class*='animate-pulse']");
				return skeletons.length === 0;
			},
			{ timeout: 12_000 },
		);

		// Check for either missions or the empty state
		const emptyStateHeading = page.getByRole("heading", {
			name: "No missions yet",
		});
		const missionCards = page.getByRole("link", {
			name: /view mission/i,
		});

		const hasEmpty = await emptyStateHeading.isVisible().catch(() => false);
		const hasMissions = await missionCards
			.first()
			.isVisible()
			.catch(() => false);

		// Either empty state or mission cards must be present — not neither
		expect(hasEmpty || hasMissions).toBe(true);
	});
});
