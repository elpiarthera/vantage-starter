"use client";

import { useTranslations } from "next-intl";
import * as React from "react";

import {
	Picker,
	PickerContent,
	PickerGroup,
	PickerRadioGroup,
	PickerRadioItem,
	PickerTrigger,
} from "@/components/create/picker";
import { useDesignSystemSearchParams } from "@/lib/create/search-params";
import { STYLES, type Style, type StyleName } from "@/lib/create/styles";

export function StylePicker() {
	const t = useTranslations("design_system");
	const [params, setParams] = useDesignSystemSearchParams();
	const currentStyle = STYLES.find((s) => s.name === params.style);

	return (
		<Picker>
			<PickerTrigger>
				<div className="flex flex-col justify-start text-left">
					<div className="text-xs text-muted-foreground">{t("style")}</div>
					<div className="text-sm font-medium text-foreground">
						{currentStyle?.title}
					</div>
				</div>
				{currentStyle?.icon && (
					<div className="pointer-events-none absolute top-1/2 right-4 flex size-4 -translate-y-1/2 items-center justify-center select-none md:right-2.5">
						{React.cloneElement(
							currentStyle.icon as React.ReactElement<{ className?: string }>,
							{ className: "size-4" },
						)}
					</div>
				)}
			</PickerTrigger>
			<PickerContent side="right" align="start" sideOffset={12}>
				<PickerRadioGroup
					value={params.style}
					onValueChange={(value) => {
						setParams({ style: value as StyleName });
					}}
				>
					<PickerGroup>
						{(STYLES as unknown as Style[]).map((style) => (
							<PickerRadioItem key={style.name} value={style.name}>
								{style.title}
							</PickerRadioItem>
						))}
					</PickerGroup>
				</PickerRadioGroup>
			</PickerContent>
		</Picker>
	);
}
