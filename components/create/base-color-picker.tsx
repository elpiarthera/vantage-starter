"use client";

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
import { BASE_COLORS, type BaseColorName } from "@/lib/create/themes";

export function BaseColorPicker() {
	const [params, setParams] = useDesignSystemSearchParams();

	const currentBaseColor = React.useMemo(
		() => BASE_COLORS.find((bc) => bc.name === params.baseColor),
		[params.baseColor],
	);

	return (
		<Picker>
			<PickerTrigger>
				<div className="flex flex-col justify-start text-left">
					<div className="text-xs text-muted-foreground">Base Color</div>
					<div className="text-sm font-medium text-foreground">
						{currentBaseColor?.title}
					</div>
				</div>
				<div
					style={
						{
							"--color": currentBaseColor?.cssVars?.dark?.["muted-foreground"],
						} as React.CSSProperties
					}
					className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 rounded-full bg-(--color) select-none md:right-2.5"
				/>
			</PickerTrigger>
			<PickerContent side="right" align="start" sideOffset={12}>
				<PickerRadioGroup
					value={params.baseColor}
					onValueChange={(value) => {
						setParams({ baseColor: value as BaseColorName });
					}}
				>
					<PickerGroup>
						{BASE_COLORS.map((bc) => (
							<PickerRadioItem key={bc.name} value={bc.name}>
								{bc.title}
							</PickerRadioItem>
						))}
					</PickerGroup>
				</PickerRadioGroup>
			</PickerContent>
		</Picker>
	);
}
