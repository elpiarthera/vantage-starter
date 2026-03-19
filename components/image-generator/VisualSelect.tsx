"use client";

import type React from "react";
import { cn } from "@/lib/utils";

export interface VisualSelectOption<T extends string = string> {
	value: T;
	label: string;
	icon?: React.ReactNode;
}

interface VisualSelectProps<T extends string = string> {
	options: VisualSelectOption<T>[];
	value: T;
	onChange: (value: T) => void;
	type: "grid" | "segmented";
	/** Optional: hide 4K when false (e.g. for v3 model) */
	show4K?: boolean;
	"aria-label"?: string;
}

export function VisualSelect<T extends string = string>({
	options,
	value,
	onChange,
	type,
	"aria-label": ariaLabel,
}: VisualSelectProps<T>) {
	// Grid layout with glass styling (Sprint 30e.5)
	if (type === "grid") {
		return (
			<div
				className="inline-flex flex-wrap gap-1.5"
				role="radiogroup"
				aria-label={ariaLabel}
			>
				{options.map((opt) => (
					// biome-ignore lint/a11y/useSemanticElements: custom visual radio with icons, aria-checked and radiogroup used for a11y
					<button
						key={opt.value}
						type="button"
						role="radio"
						aria-checked={value === opt.value}
						onClick={() => onChange(opt.value as T)}
						className={cn(
							"flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border transition-smooth focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
							value === opt.value
								? "ring-2 ring-primary bg-primary/20 border-primary/50 text-foreground"
								: "bg-background/30 border-border/30 text-muted-foreground hover:bg-background/50 hover:border-border/50 hover:text-foreground",
						)}
						title={opt.label}
					>
						{opt.icon ?? <span className="text-xs">{opt.label}</span>}
					</button>
				))}
			</div>
		);
	}

	// segmented: pill toggles with glass styling (Sprint 30e.5)
	return (
		<fieldset
			className="inline-flex rounded-lg border border-border/30 bg-background/30 p-0.5 backdrop-blur-sm"
			aria-label={ariaLabel}
		>
			<div className="flex flex-wrap gap-0.5">
				{options.map((opt) => (
					// biome-ignore lint/a11y/useSemanticElements: custom pill radio, aria-checked and fieldset used for a11y
					<button
						key={opt.value}
						type="button"
						role="radio"
						aria-checked={value === opt.value}
						onClick={() => onChange(opt.value as T)}
						className={cn(
							"min-h-[44px] rounded-md px-3 py-2 text-sm font-medium transition-smooth focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
							value === opt.value
								? "ring-2 ring-primary bg-primary/20 text-foreground"
								: "text-muted-foreground hover:bg-background/40 hover:text-foreground",
						)}
					>
						{opt.label}
					</button>
				))}
			</div>
		</fieldset>
	);
}
