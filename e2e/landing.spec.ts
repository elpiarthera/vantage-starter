import { expect, test } from "./fixtures";

/**
 * Landing page smoke tests
 *
 * Tests the public-facing landing page at /en (default locale).
 * No auth required — all assertions are against static/rendered content.
 */

test.describe("Landing page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/en");
	});

	test("page loads with correct title", async ({ page }) => {
		await expect(page).toHaveTitle(/VantageStarter/);
	});

	test("hero section is visible with Born agentic text", async ({ page }) => {
		const heroSection = page.getByRole("region", {
			name: /hero|agentic/i,
		});
		await expect(heroSection).toBeVisible();

		// h1 contains the primary headline
		const h1 = page.getByRole("heading", { level: 1 });
		await expect(h1).toContainText("Born agentic");
	});

	test("features section is visible with 6 feature cards", async ({ page }) => {
		const featuresSection = page.locator("#features");
		await expect(featuresSection).toBeVisible();

		// Each feature card has an article role or is inside the grid
		// The FeaturesSection renders 6 items with a heading per card
		const featureHeadings = featuresSection.getByRole("heading", {
			level: 3,
		});
		await expect(featureHeadings).toHaveCount(6);
	});

	test("pricing section is visible with 2 tiers", async ({ page }) => {
		const pricingSection = page.locator("#pricing");
		await expect(pricingSection).toBeVisible();

		// PricingSection renders 2 tier cards — locate by heading level inside section
		const tierCards = pricingSection.getByRole("heading", { level: 3 });
		await expect(tierCards).toHaveCount(2);
	});

	test("FAQ section is visible with accordion items", async ({ page }) => {
		const faqSection = page.locator("#faq");
		await expect(faqSection).toBeVisible();

		// Accordion items render as buttons with aria-expanded
		const accordionTriggers = faqSection.getByRole("button");
		const count = await accordionTriggers.count();
		expect(count).toBeGreaterThan(0);
	});

	test("nav Features link scrolls to features section", async ({ page }) => {
		// The landing nav renders <a href="#features"> (plain anchor, not Link).
		// Select by href attribute — avoids ambiguity with dashboard sidebar.
		const featuresLink = page.locator('a[href="#features"]').first();
		await featuresLink.click();

		// After scroll, features section should be in view
		const featuresSection = page.locator("#features");
		await expect(featuresSection).toBeInViewport({ ratio: 0.1 });
	});

	test("nav Pricing link scrolls to pricing section", async ({ page }) => {
		const pricingLink = page.locator('a[href="#pricing"]').first();
		await pricingLink.click();

		const pricingSection = page.locator("#pricing");
		await expect(pricingSection).toBeInViewport({ ratio: 0.1 });
	});
});
