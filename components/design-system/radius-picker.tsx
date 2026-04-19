"use client";

import { useDesignSystem } from "@/hooks/use-design-system";
import { RADII, type RadiusValue } from "@/lib/design-system/config";
import { LockButton } from "./lock-button";
import {
	Picker,
	PickerContent,
	PickerGroup,
	PickerRadioGroup,
	PickerRadioItem,
	PickerSeparator,
	PickerTrigger,
} from "./picker";

export function RadiusPicker() {
	const [params, setParams] = useDesignSystem();
	const isLocked = params.style === "lyra";
	const selectedName = isLocked ? "none" : params.radius;
	const current = RADII.find((r) => r.name === selectedName);
	const defaultRadius = RADII.find((r) => r.name === "default");
	const otherRadii = RADII.filter((r) => r.name !== "default");

	return (
		<div className="group/picker relative">
			<Picker>
				<PickerTrigger disabled={isLocked}>
					<div className="flex flex-col justify-start text-left">
						<div className="text-xs text-muted-foreground">Radius</div>
						<div className="text-sm font-medium text-foreground">
							{current?.label}
						</div>
					</div>
					<div className="pointer-events-none absolute top-1/2 right-4 flex size-4 -translate-y-1/2 rotate-90 items-center justify-center text-foreground select-none md:right-2.5">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							aria-hidden="true"
						>
							<path
								fill="none"
								stroke="currentColor"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M4 20v-5C4 8.925 8.925 4 15 4h5"
							/>
						</svg>
					</div>
				</PickerTrigger>
				<PickerContent>
					<PickerRadioGroup
						value={current?.name}
						onValueChange={(value) => {
							if (!isLocked) setParams({ radius: value as RadiusValue });
						}}
					>
						<PickerGroup>
							{defaultRadius && (
								<PickerRadioItem value={defaultRadius.name}>
									{defaultRadius.label}
								</PickerRadioItem>
							)}
						</PickerGroup>
						<PickerSeparator />
						<PickerGroup>
							{otherRadii.map((r) => (
								<PickerRadioItem key={r.name} value={r.name}>
									{r.label}
								</PickerRadioItem>
							))}
						</PickerGroup>
					</PickerRadioGroup>
				</PickerContent>
			</Picker>
			<LockButton
				param="radius"
				className="absolute top-1/2 right-8 -translate-y-1/2"
			/>
		</div>
	);
}
