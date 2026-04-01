"use client";

import {
	Picker,
	PickerContent,
	PickerGroup,
	PickerRadioGroup,
	PickerRadioItem,
	PickerSeparator,
	PickerTrigger,
} from "@/components/create/picker";
import { RADII, type RadiusValue } from "@/lib/create/config";
import { useDesignSystemSearchParams } from "@/lib/create/search-params";

export function RadiusPicker() {
	const [params, setParams] = useDesignSystemSearchParams();
	const isRadiusLocked = params.style === "lyra";
	const selectedRadiusName = isRadiusLocked ? "none" : params.radius;

	const currentRadius = RADII.find((r) => r.name === selectedRadiusName);
	const defaultRadius = RADII.find((r) => r.name === "default");
	const otherRadii = RADII.filter((r) => r.name !== "default");

	return (
		<Picker>
			<PickerTrigger disabled={isRadiusLocked}>
				<div className="flex flex-col justify-start text-left">
					<div className="text-xs text-muted-foreground">Radius</div>
					<div className="text-sm font-medium text-foreground">
						{currentRadius?.label}
					</div>
				</div>
				<div className="pointer-events-none absolute top-1/2 right-4 flex size-4 -translate-y-1/2 rotate-90 items-center justify-center text-base text-foreground select-none md:right-2.5">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						aria-hidden="true"
					>
						<path d="M4 20v-5C4 8.925 8.925 4 15 4h5" />
					</svg>
				</div>
			</PickerTrigger>
			<PickerContent side="right" align="start" sideOffset={12}>
				<PickerRadioGroup
					value={currentRadius?.name}
					onValueChange={(value) => {
						if (!isRadiusLocked) {
							setParams({ radius: value as RadiusValue });
						}
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
	);
}
