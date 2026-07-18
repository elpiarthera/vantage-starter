import { expect, test } from "./fixtures";
import { lightnessOf } from "./oklch";

/**
 * Clerk widget theme-follow test
 *
 * Regression proof for the fix in app/ClientProviders.tsx: `baseTheme: dark`
 * was UNCONDITIONAL, so the Clerk auth widget stayed black even when the app
 * flipped to light via the header theme toggle. The fix points every
 * appearance.variables entry at a live CSS custom property (var(--token))
 * instead.
 *
 * This test also settles a claim that sat as "NOT VERIFIED" for three weeks:
 * whether clerk-js (loaded from a CDN, absent from node_modules, so it could
 * not be inspected statically) actually RESOLVES an unresolved `var(...)`
 * reference into a computed color, rather than only accepting an
 * already-browser-computed color. Asserting on computed values answers that
 * empirically — a class-only or DOM-presence assertion would pass even if
 * clerk-js received the literal string "var(--primary)" and rendered nothing.
 *
 * Uses the public /en/sign-in route (middleware.ts isPublicRoute) — no auth,
 * no Browserbase session needed. Toggles by adding/removing the `dark` class
 * on <html> directly (deterministic; the header toggle is not present on the
 * sign-in page).
 */

test.describe("Clerk widget theme follow", () => {
	test("Clerk primary button and card text follow the app theme", async ({
		page,
	}) => {
		await page.goto("/en/sign-in");

		// Clerk mounts late (CDN-loaded, client-side). Without this wait the DOM
		// query below reads an empty tree and produces a false pass.
		await page.waitForSelector("[class*='cl-formButtonPrimary']");

		const readComputed = () =>
			page.evaluate(() => {
				const button = document.querySelector<HTMLElement>(
					"[class*='cl-formButtonPrimary']",
				);
				const card = document.querySelector<HTMLElement>("[class*='cl-card']");
				if (!button || !card) {
					throw new Error("Clerk button or card not mounted");
				}
				const buttonStyle = getComputedStyle(button);
				const cardStyle = getComputedStyle(card);
				return {
					buttonBg: buttonStyle.backgroundColor,
					buttonText: buttonStyle.color,
					cardText: cardStyle.color,
				};
			});

		const before = await readComputed();

		// None of the computed values may be a literal, unresolved "var(" token
		// or empty — this is the exact regression this test guards: if clerk-js
		// ever stops resolving custom properties, the raw string comes back.
		for (const value of Object.values(before)) {
			expect(value.length).toBeGreaterThan(0);
			expect(value).not.toContain("var(");
		}

		// Flip the theme deterministically — the sign-in page has no header
		// toggle, so we toggle the class next-themes would toggle.
		await page.evaluate(() => {
			document.documentElement.classList.toggle("dark");
		});

		// Wait for the Clerk button background to actually repaint before
		// re-reading. Comparing the raw string is not enough: Chromium can
		// re-serialize oklch() as oklab() on the very next paint with the SAME
		// numeric value, which would make a naive string-inequality check exit
		// before the real repaint lands. Compare the parsed lightness instead.
		// This step runs inside page.evaluate/waitForFunction (browser
		// context, cannot import e2e/oklch.ts), so the parser is inlined —
		// kept explicitly percent-aware as hardening: resolved colour
		// properties serialize as fractions today, but a parser must not
		// assume which surface feeds it.
		const lightnessOfRaw = (color: string) => {
			const match = color.match(/okla?[bc]h?\(\s*([\d.]+)(%?)/);
			if (!match) return Number.NaN;
			const value = Number.parseFloat(match[1]);
			return match[2] === "%" ? value / 100 : value;
		};
		const prevLightness = lightnessOfRaw(before.buttonBg);
		await page.waitForFunction(
			({ prevLightness: prev }) => {
				const button = document.querySelector<HTMLElement>(
					"[class*='cl-formButtonPrimary']",
				);
				if (!button) return false;
				const match = getComputedStyle(button).backgroundColor.match(
					/okla?[bc]h?\(\s*([\d.]+)(%?)/,
				);
				if (!match) return false;
				const value = Number.parseFloat(match[1]);
				const parsed = match[2] === "%" ? value / 100 : value;
				return Math.abs(parsed - prev) > 0.05;
			},
			{ prevLightness },
			{ timeout: 5000 },
		);

		const after = await readComputed();

		for (const value of Object.values(after)) {
			expect(value.length).toBeGreaterThan(0);
			expect(value).not.toContain("var(");
		}

		// The widget must genuinely repaint, not just re-render with the same
		// resolved color — proves the "before" and "after" reads are not both
		// samples of a stuck/default appearance.
		expect(after.buttonBg).not.toBe(before.buttonBg);
		expect(after.buttonText).not.toBe(before.buttonText);
		expect(after.cardText).not.toBe(before.cardText);

		// Extract the OKLCH/OKLAB lightness (percent-aware; see e2e/oklch.ts)
		// from each computed value. Chromium's getComputedStyle normalizes
		// CSS oklch() input to the oklab() serialization, so match either. A
		// bare inequality would pass on two near-identical shades; this
		// proves one pairing is genuinely light-on-dark and the other
		// dark-on-light.
		const buttonLightnesses = [before.buttonBg, after.buttonBg].map(
			lightnessOf,
		);
		const lightButton = Math.max(...buttonLightnesses);
		const darkButton = Math.min(...buttonLightnesses);

		// Measured values: light-theme button ~oklch(0.3) (dark), dark-theme
		// button ~oklch(0.922) (light) — a strong light/dark split, not two
		// similar mid-tone shades.
		expect(lightButton).toBeGreaterThan(0.5);
		expect(darkButton).toBeLessThan(0.4);
	});
});
