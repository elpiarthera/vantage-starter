"use client";

import * as React from "react";
import { useDesignSystem } from "@/hooks/use-design-system";
import { STYLES, type Style, type StyleName } from "@/lib/design-system/config";
import { LockButton } from "./lock-button";
import {
	Picker,
	PickerContent,
	PickerGroup,
	PickerRadioGroup,
	PickerRadioItem,
	PickerTrigger,
} from "./picker";

export function StylePicker() {
	const [params, setParams] = useDesignSystem();
	const currentStyle = STYLES.find((s) => s.name === params.style);

	return (
		<div className="group/picker relative">
			<Picker>
				<PickerTrigger>
					<div className="flex flex-col justify-start text-left">
						<div className="text-xs text-muted-foreground">Style</div>
						<div className="text-sm font-medium text-foreground">
							{currentStyle?.title}
						</div>
					</div>
					{currentStyle?.icon && (
						<div className="pointer-events-none absolute top-1/2 right-4 flex size-4 -translate-y-1/2 items-center justify-center select-none md:right-2.5">
							{React.cloneElement(
								currentStyle.icon as React.ReactElement<{ className?: string }>,
								{
									className: "size-4",
								},
							)}
						</div>
					)}
				</PickerTrigger>
				<PickerContent>
					<PickerRadioGroup
						value={currentStyle?.name}
						onValueChange={(value) => setParams({ style: value as StyleName })}
					>
						<PickerGroup>
							{(STYLES as readonly Style[]).map((style) => (
								<PickerRadioItem key={style.name} value={style.name}>
									{style.title}
								</PickerRadioItem>
							))}
						</PickerGroup>
					</PickerRadioGroup>
				</PickerContent>
			</Picker>
			<LockButton
				param="style"
				className="absolute top-1/2 right-8 -translate-y-1/2"
			/>
		</div>
	);
}
