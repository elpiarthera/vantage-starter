"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { MenuAccentPicker } from "./accent-picker";
import { BaseColorPicker } from "./base-color-picker";
import { ChartColorPicker } from "./chart-color-picker";
import { FontPicker } from "./font-picker";
import { IconLibraryPicker } from "./icon-library-picker";
import { MenuColorPicker } from "./menu-picker";
import { RadiusPicker } from "./radius-picker";
import { StylePicker } from "./style-picker";
import { ThemePicker } from "./theme-picker";

function FieldSeparator({ className }: { className?: string }) {
	return <hr className={cn("border-border", className)} />;
}

export function Customizer({ className }: { className?: string }) {
	const t = useTranslations("design_system");
	return (
		<aside
			className={cn(
				"flex w-full flex-col gap-0 rounded-2xl border border-border",
				"bg-card/90 shadow-xl backdrop-blur-xl",
				"md:w-64",
				className,
			)}
		>
			{/* Header */}
			<div className="flex items-center gap-2 border-b border-border px-4 py-3">
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
					className="text-muted-foreground"
					aria-hidden="true"
				>
					<circle cx="12" cy="12" r="3" />
					<path d="M19.07 4.93A10 10 0 0 0 12 2C6.49 2 2 6.49 2 12s4.49 10 10 10a10 10 0 0 0 7.07-2.93" />
					<path d="M22 12a10 10 0 0 0-2.93-7.07" />
				</svg>
				<span className="text-sm font-medium text-foreground">
					{t("customizer_title")}
				</span>
			</div>

			{/* Pickers */}
			<div className="flex flex-col gap-1 p-2">
				<StylePicker />
				<FieldSeparator className="my-1" />
				<BaseColorPicker />
				<ThemePicker />
				<ChartColorPicker />
				<FieldSeparator className="my-1" />
				<FontPicker label="Heading" param="fontHeading" />
				<FontPicker label="Font" param="font" />
				<FieldSeparator className="my-1" />
				<IconLibraryPicker />
				<RadiusPicker />
				<FieldSeparator className="my-1" />
				<MenuColorPicker />
				<MenuAccentPicker />
			</div>
		</aside>
	);
}
