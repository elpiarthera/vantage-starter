/**
 * Per-control mapping verification for the configurator (base color, menu
 * accent, style). Each test reads a value a REAL consumer reads
 * (buildRegistryTheme's output CSS vars, or the actually-imported
 * stylesheet) — not just that a picker's own state updated.
 */
import fs from "node:fs";
import path from "node:path";
import {
	buildRegistryTheme,
	DEFAULT_CONFIG,
	STYLES,
} from "@/lib/design-system/config";

describe("buildRegistryTheme — base color control", () => {
	it("produces different --border between two base colors when theme tracks the base color (the app's own sync behavior)", () => {
		const neutral = buildRegistryTheme({
			...DEFAULT_CONFIG,
			baseColor: "neutral",
			theme: "neutral",
		});
		const zinc = buildRegistryTheme({
			...DEFAULT_CONFIG,
			baseColor: "zinc",
			theme: "zinc",
		});
		expect(neutral.cssVars.light.border).not.toEqual(zinc.cssVars.light.border);
	});

	it("is silently overridden when theme does not track base color (documents the coupling ThemePicker relies on)", () => {
		// If a caller ever builds the theme with baseColor changed but theme
		// left at its old value, the theme wins on every overlapping key —
		// this is why ThemePicker's effect must keep `theme` synced to
		// `baseColor` for the picker to have any visible effect.
		const mismatched = buildRegistryTheme({
			...DEFAULT_CONFIG,
			baseColor: "zinc",
			theme: "neutral",
		});
		const pureNeutral = buildRegistryTheme({
			...DEFAULT_CONFIG,
			baseColor: "neutral",
			theme: "neutral",
		});
		expect(mismatched.cssVars.light.border).toEqual(
			pureNeutral.cssVars.light.border,
		);
	});
});

describe("buildRegistryTheme — menu accent control", () => {
	it("bold overrides --accent to --primary (the swatch_accent panel reads this)", () => {
		const subtle = buildRegistryTheme({
			...DEFAULT_CONFIG,
			menuAccent: "subtle",
		});
		const bold = buildRegistryTheme({ ...DEFAULT_CONFIG, menuAccent: "bold" });
		expect(bold.cssVars.light.accent).toEqual(bold.cssVars.light.primary);
		expect(subtle.cssVars.light.accent).not.toEqual(
			subtle.cssVars.light.primary,
		);
	});
});

describe("style control — stylesheet wiring", () => {
	const globalsCss = fs.readFileSync(
		path.join(process.cwd(), "app/globals.css"),
		"utf-8",
	);

	for (const style of STYLES) {
		it(`imports styles/style-${style.name}.css consumed by the "style-${style.name}" body class`, () => {
			expect(globalsCss).toMatch(
				new RegExp(`@import\\s+["'].*style-${style.name}\\.css["']`),
			);
		});
	}
});
