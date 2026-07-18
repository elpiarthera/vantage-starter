import { expect, test } from "./fixtures";

/**
 * Theme toggle repaint test
 *
 * Regression proof for the Day-135 bug: clicking the theme toggle animated
 * the sun/moon icon but styles/presets/base.css had no `.dark` block, so
 * nothing repainted. Asserts on COMPUTED values, not classes/DOM nodes —
 * a class-only assertion previously passed while the feature was broken.
 *
 * Uses /en — verified against the running dev server that bare "/" 404s
 * (unlike the brief's assumption of a default-locale redirect) while /en
 * resolves 200, matching e2e/landing.spec.ts's own use of "/en".
 */

test.describe("Theme toggle repaint", () => {
	test("toggling the theme changes the computed --background lightness", async ({
		page,
	}) => {
		await page.goto("/en");

		const readBackgroundVar = () =>
			page.evaluate(() =>
				getComputedStyle(document.documentElement)
					.getPropertyValue("--background")
					.trim(),
			);

		const initialBackground = await readBackgroundVar();
		expect(initialBackground.length).toBeGreaterThan(0);

		// Toggle by accessible name (theme_toggle.switch_to_light / switch_to_dark
		// from messages/en.json) rather than by class/testid.
		const toggle = page.getByRole("button", {
			name: /switch to (light|dark) mode/i,
		});
		await expect(toggle).toBeVisible();
		await toggle.click();

		// Wait for the html[class] to actually flip before re-reading computed
		// style (next-themes toggles the class synchronously on click, but the
		// stylesheet cascade needs a tick to apply).
		await page.waitForFunction(
			(prevBg) => {
				const val = getComputedStyle(document.documentElement)
					.getPropertyValue("--background")
					.trim();
				return val.length > 0 && val !== prevBg;
			},
			initialBackground,
			{ timeout: 5000 },
		);

		const toggledBackground = await readBackgroundVar();

		expect(toggledBackground).not.toBe(initialBackground);

		// Extract the OKLCH lightness (first numeric token) from each value
		// and assert one reads as a light surface and the other as a dark
		// surface — a raw string inequality alone would pass on any two
		// distinct-but-still-dark values.
		const lightnessOf = (oklch: string) => {
			const match = oklch.match(/oklch\(\s*([\d.]+)/);
			if (!match) throw new Error(`unparsable oklch value: ${oklch}`);
			return Number.parseFloat(match[1]);
		};

		const lightnesses = [initialBackground, toggledBackground].map(lightnessOf);
		const lightSurface = Math.max(...lightnesses);
		const darkSurface = Math.min(...lightnesses);

		// Light background must read as genuinely light (L > 0.9) and the
		// dark background as genuinely dark (L < 0.3) — proves the pair is
		// an actual light/dark repaint, not two similar dark shades.
		expect(lightSurface).toBeGreaterThan(0.9);
		expect(darkSurface).toBeLessThan(0.3);
	});
});
