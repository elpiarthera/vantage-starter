"use client";

import { useTranslations } from "next-intl";
import * as React from "react";

import {
	Picker,
	PickerContent,
	PickerGroup,
	PickerLabel,
	PickerRadioGroup,
	PickerRadioItem,
	PickerSeparator,
	PickerTrigger,
} from "@/components/create/picker";
import {
	FONT_HEADING_OPTIONS,
	FONTS,
	type FontOption,
} from "@/lib/create/fonts";
import { useDesignSystemSearchParams } from "@/lib/create/search-params";

type FontPickerOption = {
	name: string;
	value: string;
	type: string;
	font: { style: { fontFamily: string } } | null;
};

export function FontPicker({
	label,
	param,
}: {
	label: string;
	param: "font" | "fontHeading";
}) {
	const t = useTranslations("design_system");
	const [params, setParams] = useDesignSystemSearchParams();
	const currentValue = param === "font" ? params.font : params.fontHeading;

	const fonts: readonly FontPickerOption[] =
		param === "fontHeading"
			? (FONT_HEADING_OPTIONS as unknown as FontPickerOption[])
			: (FONTS as unknown as FontPickerOption[]);

	const handleFontChange = React.useCallback(
		(value: string) => {
			if (param === "font") {
				setParams({ font: value });
			} else {
				setParams({ fontHeading: value });
			}
		},
		[param, setParams],
	);

	const currentFont = fonts.find((f) => f.value === currentValue);
	const currentBodyFont = FONTS.find((f) => f.value === params.font);
	const inheritsBodyFont =
		param === "fontHeading" && currentValue === "inherit";
	const displayFontName = inheritsBodyFont
		? currentBodyFont?.name
		: currentFont?.name;
	const inheritFontLabel = currentBodyFont
		? currentBodyFont.name
		: t("body_font");

	const groupedFonts = React.useMemo(() => {
		const pickerFonts =
			param === "fontHeading"
				? (fonts as FontPickerOption[]).filter((f) => f.value !== "inherit")
				: (fonts as FontPickerOption[]);

		const groups = new Map<string, FontPickerOption[]>();
		for (const font of pickerFonts) {
			const existing = groups.get(font.type);
			if (existing) {
				existing.push(font);
			} else {
				groups.set(font.type, [font]);
			}
		}
		return Array.from(groups.entries()).map(([type, items]) => ({
			type,
			label:
				type === "default"
					? t("default")
					: `${type.charAt(0).toUpperCase()}${type.slice(1)}`,
			items,
		}));
	}, [fonts, param, t]);

	return (
		<Picker>
			<PickerTrigger>
				<div className="flex flex-col justify-start text-left">
					<div className="text-xs text-muted-foreground">{label}</div>
					<div className="line-clamp-1 max-w-[80%] truncate text-sm font-medium text-foreground">
						{displayFontName}
					</div>
				</div>
				<div
					className="pointer-events-none absolute top-1/2 right-4 flex size-4 -translate-y-1/2 items-center justify-center text-base text-foreground select-none md:right-2.5"
					style={{
						fontFamily:
							(currentFont as FontOption | undefined)?.font?.style.fontFamily ??
							currentBodyFont?.font.style.fontFamily,
					}}
				>
					{t("font_sample")}
				</div>
			</PickerTrigger>
			<PickerContent
				side="right"
				align="start"
				sideOffset={12}
				className="max-h-96"
			>
				<PickerRadioGroup value={currentValue} onValueChange={handleFontChange}>
					{param === "fontHeading" && (
						<>
							<PickerGroup>
								<PickerRadioItem value="inherit">
									{inheritFontLabel}
								</PickerRadioItem>
							</PickerGroup>
							<PickerSeparator />
						</>
					)}
					{groupedFonts.map((group) => (
						<PickerGroup key={group.type}>
							{group.type !== "default" && (
								<PickerLabel>{group.label}</PickerLabel>
							)}
							{group.items.map((font) => (
								<PickerRadioItem key={font.value} value={font.value}>
									{font.name}
								</PickerRadioItem>
							))}
						</PickerGroup>
					))}
				</PickerRadioGroup>
			</PickerContent>
		</Picker>
	);
}
