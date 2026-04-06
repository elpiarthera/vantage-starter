// Design system URL state — nuqs-based search params
// Default style is "luma" per VantageStarter configuration
import {
	createLoader,
	createSerializer,
	type inferParserType,
	parseAsBoolean,
	parseAsString,
	parseAsStringLiteral,
} from "nuqs/server";

import {
	BASE_COLOR_NAMES,
	type BaseColorName,
	ICON_LIBRARIES,
	type IconLibraryName,
	MENU_ACCENTS,
	MENU_COLORS,
	type MenuAccentValue,
	type MenuColorValue,
	RADII,
	type RadiusValue,
	STYLES,
	type StyleName,
	THEMES,
	type ThemeName,
} from "./config";

const styleNames = STYLES.map((s) => s.name) as [StyleName, ...StyleName[]];
const themeNames = THEMES.map((t) => t.name) as [ThemeName, ...ThemeName[]];
const baseColorNames = [...BASE_COLOR_NAMES] as [
	BaseColorName,
	...BaseColorName[],
];
const menuAccentValues = MENU_ACCENTS.map((a) => a.value) as [
	MenuAccentValue,
	...MenuAccentValue[],
];
const menuColorValues = MENU_COLORS.map((m) => m.value) as [
	MenuColorValue,
	...MenuColorValue[],
];
const radiusValues = RADII.map((r) => r.name) as [
	RadiusValue,
	...RadiusValue[],
];
const iconLibraryNames = Object.keys(ICON_LIBRARIES) as [
	IconLibraryName,
	...IconLibraryName[],
];

export const designSystemSearchParams = {
	style: parseAsStringLiteral(styleNames).withDefault("luma"),
	baseColor: parseAsStringLiteral(baseColorNames).withDefault("neutral"),
	theme: parseAsStringLiteral(themeNames).withDefault("neutral"),
	chartColor: parseAsStringLiteral(themeNames).withDefault("neutral"),
	iconLibrary: parseAsStringLiteral(iconLibraryNames).withDefault("lucide"),
	font: parseAsString.withDefault("inter"),
	fontHeading: parseAsString.withDefault("inherit"),
	menuAccent: parseAsStringLiteral(menuAccentValues).withDefault("subtle"),
	menuColor: parseAsStringLiteral(menuColorValues).withDefault("default"),
	radius: parseAsStringLiteral(radiusValues).withDefault("default"),
	rtl: parseAsBoolean.withDefault(false),
};

export const loadDesignSystemSearchParams = createLoader(
	designSystemSearchParams,
);
export const serializeDesignSystemSearchParams = createSerializer(
	designSystemSearchParams,
);

export type DesignSystemSearchParams = inferParserType<
	typeof designSystemSearchParams
>;

export function isTranslucentMenuColor(
	menuColor?: MenuColorValue | null,
): menuColor is "default-translucent" | "inverted-translucent" {
	return (
		menuColor === "default-translucent" || menuColor === "inverted-translucent"
	);
}
