"use client";

import { BaseColorPicker } from "@/components/create/base-color-picker";
import { FontPicker } from "@/components/create/font-picker";
import { RadiusPicker } from "@/components/create/radius-picker";
import { StylePicker } from "@/components/create/style-picker";
import { ThemePicker } from "@/components/create/theme-picker";

export function Customizer() {
	return (
		<div className="sticky top-6 isolate z-10 w-full self-start overflow-hidden rounded-2xl border border-border bg-card/90 shadow-xl backdrop-blur-xl md:w-64">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-border px-4 py-3">
				<span className="text-sm font-semibold text-foreground">
					Design System
				</span>
			</div>

			{/* Pickers — horizontal scroll on mobile, vertical stack on desktop */}
			<div className="no-scrollbar min-h-0 flex-1 overflow-x-auto overflow-y-hidden md:overflow-y-auto">
				<div className="flex flex-row gap-2.5 p-3 md:flex-col md:gap-2">
					<StylePicker />

					<div className="hidden h-px bg-border md:block" />

					<BaseColorPicker />
					<ThemePicker />

					<div className="hidden h-px bg-border md:block" />

					<FontPicker label="Heading" param="fontHeading" />
					<FontPicker label="Font" param="font" />

					<div className="hidden h-px bg-border md:block" />

					<RadiusPicker />
				</div>
			</div>
		</div>
	);
}
