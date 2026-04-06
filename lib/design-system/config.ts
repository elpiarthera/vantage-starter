// Design system configuration — styles, radii, menu options, schema
import { z } from "zod";
import { STYLES } from "./styles";
import {
	BASE_COLOR_NAMES,
	BASE_COLORS,
	getBaseColor,
	getTheme,
	THEMES,
} from "./themes";

export type { Style, StyleName } from "./styles";
export type {
	BaseColor,
	BaseColorName,
	ChartColorName,
	Theme,
	ThemeName,
} from "./themes";
export { STYLES, BASE_COLORS, BASE_COLOR_NAMES, THEMES };
export { getBaseColor, getTheme, getThemesForBaseColor } from "./themes";

export const RADII = [
	{ name: "default", label: "Default", value: "" },
	{ name: "none", label: "None", value: "0" },
	{ name: "small", label: "Small", value: "0.45rem" },
	{ name: "medium", label: "Medium", value: "0.625rem" },
	{ name: "large", label: "Large", value: "0.875rem" },
] as const;

export type Radius = (typeof RADII)[number];
export type RadiusValue = Radius["name"];

export const MENU_ACCENTS = [
	{ value: "subtle", label: "Subtle" },
	{ value: "bold", label: "Bold" },
] as const;

export type MenuAccent = (typeof MENU_ACCENTS)[number];
export type MenuAccentValue = MenuAccent["value"];

export const MENU_COLORS = [
	{ value: "default", label: "Default" },
	{ value: "inverted", label: "Inverted" },
	{ value: "default-translucent", label: "Default Translucent" },
	{ value: "inverted-translucent", label: "Inverted Translucent" },
] as const;

export type MenuColor = (typeof MENU_COLORS)[number];
export type MenuColorValue = MenuColor["value"];

// Icon libraries — simplified (no external shadcn/icons dependency)
export const ICON_LIBRARIES = {
	lucide: {
		name: "lucide" as const,
		title: "Lucide",
		packages: ["lucide-react"],
	},
	hugeicons: {
		name: "hugeicons" as const,
		title: "Hugeicons",
		packages: ["@hugeicons/react"],
	},
	phosphor: {
		name: "phosphor" as const,
		title: "Phosphor",
		packages: ["phosphor-react"],
	},
	tabler: {
		name: "tabler" as const,
		title: "Tabler",
		packages: ["@tabler/icons-react"],
	},
	remixicon: {
		name: "remixicon" as const,
		title: "Remixicon",
		packages: ["remixicon"],
	},
} as const;

export type IconLibraryName = keyof typeof ICON_LIBRARIES;
export type IconLibrary = (typeof ICON_LIBRARIES)[IconLibraryName];

export const designSystemConfigSchema = z.object({
	style: z
		.enum(STYLES.map((s) => s.name) as [string, ...string[]])
		.default("luma"),
	baseColor: z
		.enum(BASE_COLOR_NAMES as unknown as [string, ...string[]])
		.default("neutral"),
	theme: z
		.enum(THEMES.map((t) => t.name) as [string, ...string[]])
		.default("neutral"),
	chartColor: z
		.enum(THEMES.map((t) => t.name) as [string, ...string[]])
		.default("neutral"),
	iconLibrary: z
		.enum(Object.keys(ICON_LIBRARIES) as [string, ...string[]])
		.default("lucide"),
	font: z.string().default("inter"),
	fontHeading: z.string().default("inherit"),
	menuAccent: z
		.enum(MENU_ACCENTS.map((a) => a.value) as [string, ...string[]])
		.default("subtle"),
	menuColor: z
		.enum(MENU_COLORS.map((m) => m.value) as [string, ...string[]])
		.default("default"),
	radius: z
		.enum(RADII.map((r) => r.name) as [string, ...string[]])
		.default("default"),
	rtl: z.boolean().default(false),
});

export type DesignSystemConfig = z.infer<typeof designSystemConfigSchema>;

export const DEFAULT_CONFIG: DesignSystemConfig = {
	style: "luma",
	baseColor: "neutral",
	theme: "neutral",
	chartColor: "neutral",
	iconLibrary: "lucide",
	font: "inter",
	fontHeading: "inherit",
	menuAccent: "subtle",
	menuColor: "default",
	radius: "default",
	rtl: false,
};

export function buildRegistryTheme(config: DesignSystemConfig) {
	const baseColor = getBaseColor(config.baseColor);
	const theme = getTheme(config.theme);

	if (!baseColor || !theme) {
		throw new Error(
			`Base color "${config.baseColor}" or theme "${config.theme}" not found`,
		);
	}

	const lightVars: Record<string, string> = {
		...(baseColor.cssVars?.light as Record<string, string>),
		...(theme.cssVars?.light as Record<string, string>),
	};
	const darkVars: Record<string, string> = {
		...(baseColor.cssVars?.dark as Record<string, string>),
		...(theme.cssVars?.dark as Record<string, string>),
	};

	// Apply chart color override
	const chartTheme = getTheme(config.chartColor);
	if (chartTheme) {
		const chartLight = chartTheme.cssVars?.light as Record<string, string>;
		const chartDark = chartTheme.cssVars?.dark as Record<string, string>;
		for (let i = 1; i <= 5; i++) {
			const key = `chart-${i}`;
			if (chartLight?.[key]) lightVars[key] = chartLight[key];
			if (chartDark?.[key]) darkVars[key] = chartDark[key];
		}
	}

	// Apply menu accent
	if (config.menuAccent === "bold") {
		lightVars.accent = lightVars.primary;
		lightVars["accent-foreground"] = lightVars["primary-foreground"];
		darkVars.accent = darkVars.primary;
		darkVars["accent-foreground"] = darkVars["primary-foreground"];
	}

	// Apply radius override
	if (config.radius && config.radius !== "default") {
		const radius = RADII.find((r) => r.name === config.radius);
		if (radius?.value) {
			lightVars.radius = radius.value;
		}
	}

	return {
		name: `${config.baseColor}-${config.theme}`,
		cssVars: { light: lightVars, dark: darkVars },
	};
}
