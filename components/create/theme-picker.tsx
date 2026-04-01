"use client";

import * as React from "react";

import {
	Picker,
	PickerContent,
	PickerGroup,
	PickerRadioGroup,
	PickerRadioItem,
	PickerSeparator,
	PickerTrigger,
} from "@/components/create/picker";
import { useDesignSystemSearchParams } from "@/lib/create/search-params";
import {
	BASE_COLOR_NAMES,
	getThemesForBaseColor,
	type ThemeName,
} from "@/lib/create/themes";

export function ThemePicker() {
	const [params, setParams] = useDesignSystemSearchParams();

	const availableThemes = React.useMemo(
		() => getThemesForBaseColor(params.baseColor),
		[params.baseColor],
	);

	const currentTheme = React.useMemo(
		() => availableThemes.find((t) => t.name === params.theme),
		[availableThemes, params.theme],
	);

	const currentThemeIsBaseColor = BASE_COLOR_NAMES.includes(
		params.theme as (typeof BASE_COLOR_NAMES)[number],
	);

	// Auto-correct if theme is no longer valid for the selected base color
	React.useEffect(() => {
		if (!currentTheme && availableThemes.length > 0) {
			setParams({ theme: availableThemes[0].name as ThemeName });
		}
	}, [currentTheme, availableThemes, setParams]);

	const baseColorThemes = availableThemes.filter((t) =>
		BASE_COLOR_NAMES.includes(t.name as (typeof BASE_COLOR_NAMES)[number]),
	);
	const accentThemes = availableThemes.filter(
		(t) =>
			!BASE_COLOR_NAMES.includes(t.name as (typeof BASE_COLOR_NAMES)[number]),
	);

	return (
		<Picker>
			<PickerTrigger>
				<div className="flex flex-col justify-start text-left">
					<div className="text-xs text-muted-foreground">Theme</div>
					<div className="text-sm font-medium text-foreground">
						{currentTheme?.title}
					</div>
				</div>
				<div
					style={
						{
							"--color":
								currentTheme?.cssVars?.dark?.[
									currentThemeIsBaseColor ? "muted-foreground" : "primary"
								],
						} as React.CSSProperties
					}
					className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 rounded-full bg-(--color) select-none md:right-2.5"
				/>
			</PickerTrigger>
			<PickerContent
				side="right"
				align="start"
				sideOffset={12}
				className="max-h-96"
			>
				<PickerRadioGroup
					value={params.theme}
					onValueChange={(value) => {
						setParams({ theme: value as ThemeName });
					}}
				>
					<PickerGroup>
						{baseColorThemes.map((t) => (
							<PickerRadioItem key={t.name} value={t.name}>
								{t.title}
							</PickerRadioItem>
						))}
					</PickerGroup>
					{accentThemes.length > 0 && (
						<>
							<PickerSeparator />
							<PickerGroup>
								{accentThemes.map((t) => (
									<PickerRadioItem key={t.name} value={t.name}>
										{t.title}
									</PickerRadioItem>
								))}
							</PickerGroup>
						</>
					)}
				</PickerRadioGroup>
			</PickerContent>
		</Picker>
	);
}
