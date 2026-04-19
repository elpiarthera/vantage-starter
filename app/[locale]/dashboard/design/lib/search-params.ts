/**
 * Design System Search Params — nuqs URL state management
 * Ported from shadcn/ui v4. Manages design system configuration via URL params.
 * No preset encoding — stores params directly.
 */

"use client";

import { useQueryStates } from "nuqs";
import {
	createLoader,
	createSerializer,
	type inferParserType,
	type Options,
	parseAsBoolean,
	parseAsString,
	parseAsStringLiteral,
} from "nuqs/server";
import * as React from "react";

import {
	BASE_COLORS,
	BASES,
	type BaseName,
	DEFAULT_CONFIG,
	getThemesForBaseColor,
	MENU_ACCENTS,
	MENU_COLORS,
	type MenuAccentValue,
	type MenuColorValue,
	RADII,
	type RadiusValue,
	STYLES,
	type StyleName,
	THEMES,
} from "./config";
import { FONTS } from "./fonts";

// ============================================================================
// Search param parsers
// ============================================================================

const designSystemSearchParams = {
	base: parseAsStringLiteral(BASES.map((b) => b.name)).withDefault(
		DEFAULT_CONFIG.base as BaseName,
	),
	item: parseAsString.withDefault("preview-02").withOptions({ shallow: true }),
	style: parseAsStringLiteral(STYLES.map((s) => s.name)).withDefault(
		DEFAULT_CONFIG.style as StyleName,
	),
	theme: parseAsStringLiteral(THEMES.map((t) => t.name)).withDefault(
		DEFAULT_CONFIG.theme,
	),
	chartColor: parseAsStringLiteral(THEMES.map((t) => t.name)).withDefault(
		DEFAULT_CONFIG.chartColor ?? "neutral",
	),
	font: parseAsStringLiteral(FONTS.map((f) => f.value)).withDefault(
		DEFAULT_CONFIG.font,
	),
	fontHeading: parseAsStringLiteral([
		"inherit",
		...FONTS.map((f) => f.value),
	] as const).withDefault(DEFAULT_CONFIG.fontHeading),
	baseColor: parseAsStringLiteral(BASE_COLORS.map((b) => b.name)).withDefault(
		DEFAULT_CONFIG.baseColor,
	),
	menuAccent: parseAsStringLiteral<MenuAccentValue>(
		MENU_ACCENTS.map((a) => a.value),
	).withDefault(DEFAULT_CONFIG.menuAccent as MenuAccentValue),
	menuColor: parseAsStringLiteral<MenuColorValue>(
		MENU_COLORS.map((m) => m.value),
	).withDefault(DEFAULT_CONFIG.menuColor as MenuColorValue),
	radius: parseAsStringLiteral<RadiusValue>(
		RADII.map((r) => r.name),
	).withDefault("default"),
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

// ============================================================================
// Normalization helpers
// ============================================================================

export function isTranslucentMenuColor(
	menuColor?: MenuColorValue | null,
): menuColor is "default-translucent" | "inverted-translucent" {
	return (
		menuColor === "default-translucent" || menuColor === "inverted-translucent"
	);
}

function normalizeFontHeading(font: string, fontHeading: string): string {
	return fontHeading === font ? "inherit" : fontHeading;
}

function normalizePartialDesignSystemParams(
	params: Partial<DesignSystemSearchParams>,
): Partial<DesignSystemSearchParams> {
	if (
		params.menuAccent === "bold" &&
		isTranslucentMenuColor(params.menuColor ?? undefined)
	) {
		return {
			...params,
			menuAccent: "subtle",
		};
	}

	return params;
}

function normalizeDesignSystemParams(
	params: DesignSystemSearchParams,
): DesignSystemSearchParams {
	let result = {
		...params,
		fontHeading: normalizeFontHeading(params.font, params.fontHeading),
	};

	// Validate theme and chartColor against baseColor.
	if (result.baseColor) {
		const available = getThemesForBaseColor(result.baseColor);
		const themeValid = available.some((t) => t.name === result.theme);
		const chartColorValid = available.some((t) => t.name === result.chartColor);

		if (!themeValid || !chartColorValid) {
			const fallback = available[0]?.name ?? result.baseColor;
			result = {
				...result,
				...(!themeValid && { theme: fallback }),
				...(!chartColorValid && { chartColor: fallback }),
			};
		}
	}

	if (
		result.menuAccent === "bold" &&
		isTranslucentMenuColor(result.menuColor)
	) {
		return {
			...result,
			menuAccent: "subtle",
		};
	}

	return result;
}

// ============================================================================
// Hook — useDesignSystemSearchParams
// ============================================================================

export function useDesignSystemSearchParams(options: Options = {}) {
	const [rawParams, rawSetParams] = useQueryStates(designSystemSearchParams, {
		shallow: false,
		history: "push",
		...options,
	});

	const params = React.useMemo(
		() => normalizeDesignSystemParams(rawParams),
		[rawParams],
	);

	// Use ref so setParams callback stays stable across renders.
	const paramsRef = React.useRef(params);
	React.useEffect(() => {
		paramsRef.current = params;
	}, [params]);

	type RawSetParamsInput = Parameters<typeof rawSetParams>[0];

	const setParams = React.useCallback(
		(
			updates:
				| Partial<DesignSystemSearchParams>
				| ((
						old: DesignSystemSearchParams,
				  ) => Partial<DesignSystemSearchParams>),
			setOptions?: Options,
		) => {
			const resolvedUpdates = normalizePartialDesignSystemParams(
				typeof updates === "function" ? updates(paramsRef.current) : updates,
			);

			// Merge current decoded values with updates and normalize.
			const merged = normalizeDesignSystemParams({
				...paramsRef.current,
				...resolvedUpdates,
			});

			// Build the update — set all fields directly (no preset encoding).
			const rawUpdate: Record<string, unknown> = {};
			for (const [key, value] of Object.entries(merged)) {
				if (key in resolvedUpdates) {
					rawUpdate[key] = (resolvedUpdates as Record<string, unknown>)[key];
				} else {
					rawUpdate[key] = value;
				}
			}

			return rawSetParams(rawUpdate as RawSetParamsInput, setOptions);
		},
		[rawSetParams],
	);

	return [params, setParams] as const;
}
