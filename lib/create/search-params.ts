"use client";

import { useQueryStates } from "nuqs";
import { type Options, parseAsString, parseAsStringLiteral } from "nuqs/server";

import {
	DEFAULT_BASE_COLOR,
	DEFAULT_FONT,
	DEFAULT_FONT_HEADING,
	DEFAULT_RADIUS,
	DEFAULT_STYLE,
	DEFAULT_THEME,
	RADII,
	type RadiusValue,
} from "@/lib/create/config";
import { STYLES, type StyleName } from "@/lib/create/styles";
import {
	BASE_COLOR_NAMES,
	type BaseColorName,
	THEMES,
	type ThemeName,
} from "@/lib/create/themes";

export type DesignSystemParams = {
	style: StyleName;
	baseColor: BaseColorName;
	theme: ThemeName;
	font: string;
	fontHeading: string;
	radius: RadiusValue;
};

const designSystemSearchParams = {
	style: parseAsStringLiteral<StyleName>(STYLES.map((s) => s.name)).withDefault(
		DEFAULT_STYLE as StyleName,
	),
	baseColor: parseAsStringLiteral<BaseColorName>(
		BASE_COLOR_NAMES as unknown as BaseColorName[],
	).withDefault(DEFAULT_BASE_COLOR as BaseColorName),
	theme: parseAsStringLiteral<ThemeName>(
		THEMES.map((t) => t.name) as ThemeName[],
	).withDefault(DEFAULT_THEME as ThemeName),
	font: parseAsString.withDefault(DEFAULT_FONT),
	fontHeading: parseAsString.withDefault(DEFAULT_FONT_HEADING),
	radius: parseAsStringLiteral<RadiusValue>(
		RADII.map((r) => r.name),
	).withDefault(DEFAULT_RADIUS),
};

export function useDesignSystemSearchParams(options: Options = {}) {
	return useQueryStates(designSystemSearchParams, {
		shallow: true,
		history: "replace",
		...options,
	});
}
