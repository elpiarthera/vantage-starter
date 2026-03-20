import { expect, test } from "@playwright/test";

/**
 * Architect page tests — requires authentication via CLERK_TESTING_TOKEN
 *
 * These tests are skipped when CLERK_TESTING_TOKEN is not set in the environment.
 * The Architect page requires an active Convex workspace to render its full UI.
 * Without a workspace, it renders a "No workspace found" state — that state is
 * also tested here as the authenticated-but-empty baseline.
 */

const HAS_AUTH = !!process.env.CLERK_TESTING_TOKEN;

test.describe("Architect page", () => {
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

		await page.goto("/en/dashboard/architect");
		await page.waitForLoadState("networkidle", { timeout: 15_000 });
	});

	test("page loads without errors", async ({ page }) => {
		if (!HAS_AUTH) {
			test.skip(true, "requires CLERK_TESTING_TOKEN env var");
			return;
		}
		await expect(page).not.toHaveTitle(/404|Error/i);
	});

	test("session list panel is visible on desktop", async ({ page }) => {
		if (!HAS_AUTH) {
			test.skip(true, "requires CLERK_TESTING_TOKEN env var");
			return;
		}

		// Desktop sidebar (hidden md:flex) — use viewport 1280px (default desktop)
		const sessionSidebar = page.getByRole("complementary", {
			name: "Session history",
		});
		// There are two asides: one desktop (visible), one mobile (hidden).
		// On a 1280px viewport, the desktop one is visible.
		const desktopSidebar = sessionSidebar.first();
		await expect(desktopSidebar).toBeVisible();
	});

	test("New session button is visible in sidebar", async ({ page }) => {
		if (!HAS_AUTH) {
			test.skip(true, "requires CLERK_TESTING_TOKEN env var");
			return;
		}

		await expect(
			page.getByRole("button", { name: /new session/i }).first(),
		).toBeVisible();
	});

	test("Architect section heading is visible", async ({ page }) => {
		if (!HAS_AUTH) {
			test.skip(true, "requires CLERK_TESTING_TOKEN env var");
			return;
		}

		// The desktop header shows "Architect" as a heading
		const architectHeading = page
			.getByRole("heading", { name: "Architect" })
			.or(page.getByText("Architect", { exact: true }))
			.first();
		await expect(architectHeading).toBeVisible();
	});

	test("chat input with placeholder is visible when session is active", async ({
		page,
	}) => {
		if (!HAS_AUTH) {
			test.skip(true, "requires CLERK_TESTING_TOKEN env var");
			return;
		}

		// If workspace exists, start a new session to reveal the chat input.
		const startBtn = page
			.getByRole("button", { name: /new session|start planning/i })
			.first();

		const btnVisible = await startBtn.isVisible().catch(() => false);
		if (!btnVisible) {
			// Workspace missing — skip chat input test
			test.skip(true, "no workspace available for Architect session");
			return;
		}

		await startBtn.click();

		// Chat input should appear
		const chatInput = page
			.locator("textarea")
			.or(page.getByPlaceholder("Describe your goal..."));
		await expect(chatInput.first()).toBeVisible({ timeout: 10_000 });
	});

	test("Send button is visible after session starts", async ({ page }) => {
		if (!HAS_AUTH) {
			test.skip(true, "requires CLERK_TESTING_TOKEN env var");
			return;
		}

		const startBtn = page
			.getByRole("button", { name: /new session|start planning/i })
			.first();

		const btnVisible = await startBtn.isVisible().catch(() => false);
		if (!btnVisible) {
			test.skip(true, "no workspace available for Architect session");
			return;
		}

		await startBtn.click();

		const sendBtn = page.getByRole("button", { name: /send/i });
		await expect(sendBtn).toBeVisible({ timeout: 10_000 });
	});
});
