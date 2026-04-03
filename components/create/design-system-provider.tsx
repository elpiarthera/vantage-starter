"use client";

import * as React from "react";

import { RADII } from "@/lib/create/config";
import { FONTS } from "@/lib/create/fonts";
import { useDesignSystemSearchParams } from "@/lib/create/search-params";
import {
	BASE_COLOR_NAMES,
	getBaseColor,
	getTheme,
	getThemesForBaseColor,
} from "@/lib/create/themes";

const THEME_STYLE_ELEMENT_ID = "design-system-theme-vars";
const MANAGED_BODY_CLASS_PREFIXES = ["style-", "base-color-"] as const;

function removeManagedBodyClasses(body: Element) {
	for (const className of Array.from(body.classList)) {
		if (
			MANAGED_BODY_CLASS_PREFIXES.some((prefix) => className.startsWith(prefix))
		) {
			body.classList.remove(className);
		}
	}
}

function buildCssRule(selector: string, cssVars?: Record<string, string>) {
	const declarations = Object.entries(cssVars ?? {})
		.filter(([, value]) => Boolean(value))
		.map(([key, value]) => `  --${key}: ${value};`)
		.join("\n");

	if (!declarations) {
		return `${selector} {}\n`;
	}

	return `${selector} {\n${declarations}\n}\n`;
}

function buildThemeCssText(
	lightVars: Record<string, string>,
	darkVars: Record<string, string>,
) {
	return [
		buildCssRule(":root", lightVars),
		buildCssRule(".dark", darkVars),
	].join("\n");
}

export function DesignSystemProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [params, setParams] = useDesignSystemSearchParams();
	const [isReady, setIsReady] = React.useState(false);

	const { style, theme, font, fontHeading, baseColor, radius } = params;

	const effectiveRadius = style === "lyra" ? "none" : radius;

	const selectedFont = React.useMemo(
		() => FONTS.find((f) => f.value === font),
		[font],
	);

	const selectedHeadingFont = React.useMemo(() => {
		if (fontHeading === "inherit" || fontHeading === font) {
			return selectedFont;
		}
		return FONTS.find((f) => f.value === fontHeading);
	}, [font, fontHeading, selectedFont]);

	const initialFontSansRef = React.useRef<string | null>(null);
	const initialFontHeadingRef = React.useRef<string | null>(null);

	React.useEffect(() => {
		initialFontSansRef.current =
			document.documentElement.style.getPropertyValue("--font-sans");
		initialFontHeadingRef.current =
			document.documentElement.style.getPropertyValue("--font-heading");

		return () => {
			removeManagedBodyClasses(document.body);
			document.getElementById(THEME_STYLE_ELEMENT_ID)?.remove();

			if (initialFontSansRef.current) {
				document.documentElement.style.setProperty(
					"--font-sans",
					initialFontSansRef.current,
				);
			} else {
				document.documentElement.style.removeProperty("--font-sans");
			}

			if (initialFontHeadingRef.current) {
				document.documentElement.style.setProperty(
					"--font-heading",
					initialFontHeadingRef.current,
				);
			} else {
				document.documentElement.style.removeProperty("--font-heading");
			}
		};
	}, []);

	// Enforce lyra radius lock
	React.useEffect(() => {
		if (style === "lyra" && radius !== "none") {
			setParams({ radius: "none" });
		}
	}, [style, radius, setParams]);

	// Validate theme against baseColor, auto-correct if needed
	React.useEffect(() => {
		if (!baseColor || !theme) return;
		const available = getThemesForBaseColor(baseColor);
		const themeValid = available.some((t) => t.name === theme);
		if (!themeValid && available.length > 0) {
			setParams({ theme: available[0].name });
		}
	}, [baseColor, theme, setParams]);

	// Sync body classes + CSS vars synchronously
	React.useLayoutEffect(() => {
		if (!style || !theme || !font || !baseColor) return;

		removeManagedBodyClasses(document.body);
		document.body.classList.add(`style-${style}`, `base-color-${baseColor}`);

		if (selectedFont) {
			document.documentElement.style.setProperty(
				"--font-sans",
				selectedFont.font.style.fontFamily,
			);
		}

		if (selectedHeadingFont) {
			document.documentElement.style.setProperty(
				"--font-heading",
				selectedHeadingFont.font.style.fontFamily,
			);
		}

		setIsReady(true);
	}, [style, theme, font, baseColor, selectedFont, selectedHeadingFont]);

	// Inject theme CSS vars
	React.useLayoutEffect(() => {
		if (!baseColor || !theme) return;

		const baseColorData = getBaseColor(baseColor);
		const themeData = getTheme(theme);

		if (!baseColorData || !themeData) return;

		const isBaseColorTheme = BASE_COLOR_NAMES.includes(
			theme as (typeof BASE_COLOR_NAMES)[number],
		);

		const lightVars: Record<string, string> = {
			...(baseColorData.cssVars.light as Record<string, string>),
			// Only overlay theme vars if it's an accent theme (not a base color)
			...(!isBaseColorTheme
				? (themeData.cssVars.light as Record<string, string>)
				: {}),
		};
		const darkVars: Record<string, string> = {
			...(baseColorData.cssVars.dark as Record<string, string>),
			...(!isBaseColorTheme
				? (themeData.cssVars.dark as Record<string, string>)
				: {}),
		};

		// Apply radius override
		if (effectiveRadius && effectiveRadius !== "default") {
			const radiusData = RADII.find((r) => r.name === effectiveRadius);
			if (radiusData?.value) {
				lightVars.radius = radiusData.value;
			}
		}

		let styleElement = document.getElementById(
			THEME_STYLE_ELEMENT_ID,
		) as HTMLStyleElement | null;

		if (!styleElement) {
			styleElement = document.createElement("style");
			styleElement.id = THEME_STYLE_ELEMENT_ID;
			document.head.appendChild(styleElement);
		}

		styleElement.textContent = buildThemeCssText(lightVars, darkVars);
	}, [baseColor, theme, effectiveRadius]);

	if (!isReady) {
		return null;
	}

	return <>{children}</>;
}
