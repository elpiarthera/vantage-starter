"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import { useDesignSystem } from "@/hooks/use-design-system";
import type { BaseColorName } from "@/lib/design-system/config";
import { BASE_COLORS } from "@/lib/design-system/config";
import {
	Picker,
	PickerContent,
	PickerGroup,
	PickerRadioGroup,
	PickerRadioItem,
	PickerTrigger,
} from "./picker";

export function BaseColorPicker() {
	const t = useTranslations("design_system");
	const [params, setParams] = useDesignSystem();
	const currentBaseColor = React.useMemo(
		() => BASE_COLORS.find((c) => c.name === params.baseColor),
		[params.baseColor],
	);

	return (
		<Picker>
			<PickerTrigger>
				<div className="flex flex-col justify-start text-left">
					<div className="text-xs text-muted-foreground">{t("base_color")}</div>
					<div className="text-sm font-medium text-foreground">
						{currentBaseColor?.title}
					</div>
				</div>
				{currentBaseColor && (
					<div
						style={
							{
								"--color": currentBaseColor.cssVars?.dark?.["muted-foreground"],
							} as React.CSSProperties
						}
						className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 rounded-full bg-(--color) select-none md:right-2.5"
					/>
				)}
			</PickerTrigger>
			<PickerContent>
				<PickerRadioGroup
					value={currentBaseColor?.name}
					onValueChange={(value) =>
						setParams({ baseColor: value as BaseColorName })
					}
				>
					<PickerGroup>
						{BASE_COLORS.map((baseColor) => (
							<PickerRadioItem key={baseColor.name} value={baseColor.name}>
								{baseColor.title}
							</PickerRadioItem>
						))}
					</PickerGroup>
				</PickerRadioGroup>
			</PickerContent>
		</Picker>
	);
}
