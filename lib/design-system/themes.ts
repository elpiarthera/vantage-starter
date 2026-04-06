// Design system themes — assembled from split files
export type { Theme } from "./theme-type";
export { ACCENT_THEMES } from "./themes-accents";
export { THEME_NEUTRAL, THEME_STONE } from "./themes-neutral-stone";
export {
	THEME_MIST,
	THEME_OLIVE,
	THEME_TAUPE,
} from "./themes-olive-mist-taupe";
export { THEME_MAUVE, THEME_ZINC } from "./themes-zinc-mauve";

import type { Theme } from "./theme-type";
import { ACCENT_THEMES } from "./themes-accents";
import { THEME_NEUTRAL, THEME_STONE } from "./themes-neutral-stone";
import {
	THEME_MIST,
	THEME_OLIVE,
	THEME_TAUPE,
} from "./themes-olive-mist-taupe";
import { THEME_MAUVE, THEME_ZINC } from "./themes-zinc-mauve";

export const BASE_COLOR_NAMES = [
	"neutral",
	"stone",
	"zinc",
	"mauve",
	"olive",
	"mist",
	"taupe",
] as const;

export type BaseColorName = (typeof BASE_COLOR_NAMES)[number];

export const BASE_COLOR_THEMES: readonly Theme[] = [
	THEME_NEUTRAL,
	THEME_STONE,
	THEME_ZINC,
	THEME_MAUVE,
	THEME_OLIVE,
	THEME_MIST,
	THEME_TAUPE,
];

export const THEMES: readonly Theme[] = [
	...BASE_COLOR_THEMES,
	...ACCENT_THEMES,
];

export type ThemeName = Theme["name"];
export type ChartColorName = ThemeName;
export type BaseColor = Theme;

export const BASE_COLORS: readonly Theme[] = BASE_COLOR_THEMES;

export function getThemesForBaseColor(baseColorName: string): Theme[] {
	return THEMES.filter((theme) => {
		if (theme.name === baseColorName) return true;
		return !(BASE_COLOR_NAMES as readonly string[]).includes(theme.name);
	});
}

export function getTheme(name: string): Theme | undefined {
	return THEMES.find((t) => t.name === name);
}

export function getBaseColor(name: string): Theme | undefined {
	return BASE_COLOR_THEMES.find((t) => t.name === name);
}
