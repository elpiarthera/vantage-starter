"use client";

import * as React from "react";
import { useDesignSystem } from "@/hooks/use-design-system";
import { FONT_HEADING_OPTIONS, FONTS } from "@/lib/design-system/fonts";
import {
	Picker,
	PickerContent,
	PickerGroup,
	PickerLabel,
	PickerRadioGroup,
	PickerRadioItem,
	PickerSeparator,
	PickerTrigger,
} from "./picker";

type FontParam = "font" | "fontHeading";

export function FontPicker({
	label,
	param,
}: {
	label: string;
	param: FontParam;
}) {
	const [params, setParams] = useDesignSystem();
	const currentValue = param === "font" ? params.font : params.fontHeading;
	const fonts = param === "fontHeading" ? FONT_HEADING_OPTIONS : FONTS;
	const currentFont = fonts.find((f) => f.value === currentValue);
	const currentBodyFont = FONTS.find((f) => f.value === params.font);
	const isInheriting = param === "fontHeading" && currentValue === "inherit";
	const displayName = isInheriting ? currentBodyFont?.name : currentFont?.name;
	const displayFamily =
		(isInheriting
			? currentBodyFont?.font.style.fontFamily
			: currentFont?.font?.style.fontFamily) ?? undefined;

	const groups = React.useMemo(() => {
		const src = param === "fontHeading" ? FONTS : FONTS;
		const map = new Map<string, (typeof FONTS)[number][]>();
		for (const f of src) {
			const existing = map.get(f.type);
			if (existing) existing.push(f);
			else map.set(f.type, [f]);
		}
		return Array.from(map.entries()).map(([type, items]) => ({
			type,
			label: type.charAt(0).toUpperCase() + type.slice(1),
			items,
		}));
	}, [param]);

	return (
		<Picker>
			<PickerTrigger>
				<div className="flex flex-col justify-start text-left">
					<div className="text-xs text-muted-foreground">{label}</div>
					<div className="line-clamp-1 max-w-[80%] truncate text-sm font-medium text-foreground">
						{displayName}
					</div>
				</div>
				<div
					className="pointer-events-none absolute top-1/2 right-4 flex size-4 -translate-y-1/2 items-center justify-center text-base text-foreground select-none md:right-2.5"
					style={{ fontFamily: displayFamily }}
				>
					Aa
				</div>
			</PickerTrigger>
			<PickerContent className="max-h-96">
				<PickerRadioGroup
					value={currentValue}
					onValueChange={(value) => setParams({ [param]: value })}
				>
					{param === "fontHeading" && (
						<>
							<PickerGroup>
								<PickerRadioItem value="inherit">
									{currentBodyFont?.name ?? "Body font"}
								</PickerRadioItem>
							</PickerGroup>
							<PickerSeparator />
						</>
					)}
					{groups.map((group) => (
						<PickerGroup key={group.type}>
							<PickerLabel>{group.label}</PickerLabel>
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
