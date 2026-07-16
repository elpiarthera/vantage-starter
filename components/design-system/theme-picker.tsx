"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import { useDesignSystem } from "@/hooks/use-design-system";
import {
	BASE_COLORS,
	getThemesForBaseColor,
	type ThemeName,
} from "@/lib/design-system/config";
import {
	Picker,
	PickerContent,
	PickerGroup,
	PickerRadioGroup,
	PickerRadioItem,
	PickerSeparator,
	PickerTrigger,
} from "./picker";

export function ThemePicker() {
	const t = useTranslations("design_system");
	const [params, setParams] = useDesignSystem();
	const themes = React.useMemo(
		() => getThemesForBaseColor(params.baseColor),
		[params.baseColor],
	);
	const currentTheme = React.useMemo(
		() => themes.find((t) => t.name === params.theme),
		[themes, params.theme],
	);
	const isBaseColor = React.useMemo(
		() => BASE_COLORS.some((b) => b.name === params.theme),
		[params.theme],
	);

	React.useEffect(() => {
		if (!currentTheme && themes.length > 0) {
			setParams({ theme: themes[0].name as ThemeName });
		}
	}, [currentTheme, themes, setParams]);

	const baseColorThemes = themes.filter((t) =>
		BASE_COLORS.some((b) => b.name === t.name),
	);
	const accentThemes = themes.filter(
		(t) => !BASE_COLORS.some((b) => b.name === t.name),
	);

	return (
		<Picker>
			<PickerTrigger>
				<div className="flex flex-col justify-start text-left">
					<div className="text-xs text-muted-foreground">{t("theme")}</div>
					<div className="text-sm font-medium text-foreground">
						{currentTheme?.title}
					</div>
				</div>
				{currentTheme && (
					<div
						style={
							{
								"--color":
									currentTheme.cssVars?.dark?.[
										isBaseColor ? "muted-foreground" : "primary"
									],
							} as React.CSSProperties
						}
						className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 rounded-full bg-(--color) select-none md:right-2.5"
					/>
				)}
			</PickerTrigger>
			<PickerContent className="max-h-96">
				<PickerRadioGroup
					value={currentTheme?.name}
					onValueChange={(value) => setParams({ theme: value as ThemeName })}
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
