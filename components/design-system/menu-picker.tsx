"use client";

import * as React from "react";
import { useDesignSystem } from "@/hooks/use-design-system";
import type { MenuColorValue } from "@/lib/design-system/config";
import { isTranslucentMenuColor } from "@/lib/design-system/search-params";
import { LockButton } from "./lock-button";
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

type ColorChoice = "default" | "inverted";
type SurfaceChoice = "solid" | "translucent";

function getMenuColorValue(
	color: ColorChoice,
	translucent: boolean,
): MenuColorValue {
	if (color === "default")
		return translucent ? "default-translucent" : "default";
	return translucent ? "inverted-translucent" : "inverted";
}

const MENU_OPTIONS = [
	{ value: "default" as MenuColorValue, label: "Default / Solid" },
	{
		value: "default-translucent" as MenuColorValue,
		label: "Default / Translucent",
	},
	{ value: "inverted" as MenuColorValue, label: "Inverted / Solid" },
	{
		value: "inverted-translucent" as MenuColorValue,
		label: "Inverted / Translucent",
	},
];

export function MenuColorPicker() {
	const [params, setParams] = useDesignSystem();
	const lastSolidAccentRef = React.useRef(params.menuAccent);
	const currentMenu = MENU_OPTIONS.find((m) => m.value === params.menuColor);
	const colorChoice: ColorChoice =
		params.menuColor === "inverted" ||
		params.menuColor === "inverted-translucent"
			? "inverted"
			: "default";
	const surfaceChoice: SurfaceChoice = isTranslucentMenuColor(params.menuColor)
		? "translucent"
		: "solid";

	React.useEffect(() => {
		if (surfaceChoice === "solid")
			lastSolidAccentRef.current = params.menuAccent;
	}, [params.menuAccent, surfaceChoice]);

	const setColor = (color: ColorChoice) => {
		const next = getMenuColorValue(color, surfaceChoice === "translucent");
		setParams({
			menuColor: next,
			...(isTranslucentMenuColor(next) && { menuAccent: "subtle" }),
		});
	};

	const setSurface = (choice: SurfaceChoice) => {
		const isTranslucent = choice === "translucent";
		const next = getMenuColorValue(colorChoice, isTranslucent);
		setParams({
			menuColor: next,
			menuAccent: isTranslucent ? "subtle" : lastSolidAccentRef.current,
		});
	};

	return (
		<div className="group/picker relative">
			<Picker>
				<PickerTrigger>
					<div className="flex flex-col justify-start text-left">
						<div className="text-xs text-muted-foreground">Menu</div>
						<div className="line-clamp-1 max-w-[80%] truncate text-sm font-medium text-foreground">
							{currentMenu?.label}
						</div>
					</div>
					<div className="pointer-events-none absolute top-1/2 right-4 flex size-4 -translate-y-1/2 items-center justify-center text-foreground select-none md:right-2.5">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<line x1="3" y1="12" x2="21" y2="12" />
							<line x1="3" y1="6" x2="21" y2="6" />
							<line x1="3" y1="18" x2="21" y2="18" />
						</svg>
					</div>
				</PickerTrigger>
				<PickerContent>
					<PickerGroup>
						<PickerLabel>Color</PickerLabel>
						<PickerRadioGroup
							value={colorChoice}
							onValueChange={(value) => setColor(value as ColorChoice)}
						>
							<PickerRadioItem value="default">Default</PickerRadioItem>
							<PickerRadioItem value="inverted">Inverted</PickerRadioItem>
						</PickerRadioGroup>
					</PickerGroup>
					<PickerSeparator />
					<PickerGroup>
						<PickerLabel>Appearance</PickerLabel>
						<PickerRadioGroup
							value={surfaceChoice}
							onValueChange={(value) => setSurface(value as SurfaceChoice)}
						>
							<PickerRadioItem value="solid">Solid</PickerRadioItem>
							<PickerRadioItem value="translucent">Translucent</PickerRadioItem>
						</PickerRadioGroup>
					</PickerGroup>
				</PickerContent>
			</Picker>
			<LockButton
				param="menuColor"
				className="absolute top-1/2 right-8 -translate-y-1/2"
			/>
		</div>
	);
}
