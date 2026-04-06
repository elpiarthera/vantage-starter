"use client";

import * as React from "react";
import { useDesignSystem } from "@/hooks/use-design-system";
import {
	BASE_COLORS,
	type ChartColorName,
	getThemesForBaseColor,
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

export function ChartColorPicker() {
	const [params, setParams] = useDesignSystem();
	const available = React.useMemo(
		() => getThemesForBaseColor(params.baseColor),
		[params.baseColor],
	);
	const current = React.useMemo(
		() => available.find((t) => t.name === params.chartColor),
		[available, params.chartColor],
	);
	const isBaseColor = React.useMemo(
		() => BASE_COLORS.some((b) => b.name === params.chartColor),
		[params.chartColor],
	);

	React.useEffect(() => {
		if (!current && available.length > 0) {
			setParams({ chartColor: available[0].name as ChartColorName });
		}
	}, [current, available, setParams]);

	const baseColorThemes = available.filter((t) =>
		BASE_COLORS.some((b) => b.name === t.name),
	);
	const accentThemes = available.filter(
		(t) => !BASE_COLORS.some((b) => b.name === t.name),
	);

	return (
		<Picker>
			<PickerTrigger>
				<div className="flex flex-col justify-start text-left">
					<div className="text-xs text-muted-foreground">Chart Color</div>
					<div className="text-sm font-medium text-foreground">
						{current?.title}
					</div>
				</div>
				{current && (
					<div
						style={
							{
								"--color":
									current.cssVars?.dark?.[
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
					value={current?.name}
					onValueChange={(value) =>
						setParams({ chartColor: value as ChartColorName })
					}
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
