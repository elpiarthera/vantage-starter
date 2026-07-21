"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import { useDesignSystem } from "@/hooks/use-design-system";
import type { MenuColorValue } from "@/lib/design-system/config";
import { isTranslucentMenuColor } from "@/lib/design-system/search-params";
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
	{ value: "default" as MenuColorValue, labelKey: "menu_option_default_solid" },
	{
		value: "default-translucent" as MenuColorValue,
		labelKey: "menu_option_default_translucent",
	},
	{
		value: "inverted" as MenuColorValue,
		labelKey: "menu_option_inverted_solid",
	},
	{
		value: "inverted-translucent" as MenuColorValue,
		labelKey: "menu_option_inverted_translucent",
	},
] as const;

// BOUNDARY (traced, not silent — see CHANGELOG.md "configurator: theme
// persistence across navigation"): no element in the app carries the
// `cn-menu-target` class that providers/DesignSystemProvider.tsx toggles
// `.dark`/`.cn-menu-translucent` on, so this control currently has no visible
// effect anywhere. The only always-present candidate surface
// (components/ui/dropdown-menu.tsx) hardcodes an inline dark background that
// bypasses the OKLCH tokens, so wiring this in would also require removing
// that override — a cross-cutting change to a shared primitive used on every
// page, out of scope for a configurator-only fix.
export function MenuColorPicker() {
	const t = useTranslations("design_system");
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
		<Picker>
			<PickerTrigger>
				<div className="flex flex-col justify-start text-left">
					<div className="text-xs text-muted-foreground">{t("menu")}</div>
					<div className="line-clamp-1 max-w-[80%] truncate text-sm font-medium text-foreground">
						{currentMenu ? t(currentMenu.labelKey) : null}
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
					<PickerLabel>{t("color")}</PickerLabel>
					<PickerRadioGroup
						value={colorChoice}
						onValueChange={(value) => setColor(value as ColorChoice)}
					>
						<PickerRadioItem value="default">{t("default")}</PickerRadioItem>
						<PickerRadioItem value="inverted">{t("inverted")}</PickerRadioItem>
					</PickerRadioGroup>
				</PickerGroup>
				<PickerSeparator />
				<PickerGroup>
					<PickerLabel>{t("appearance")}</PickerLabel>
					<PickerRadioGroup
						value={surfaceChoice}
						onValueChange={(value) => setSurface(value as SurfaceChoice)}
					>
						<PickerRadioItem value="solid">{t("solid")}</PickerRadioItem>
						<PickerRadioItem value="translucent">
							{t("translucent")}
						</PickerRadioItem>
					</PickerRadioGroup>
				</PickerGroup>
			</PickerContent>
		</Picker>
	);
}
