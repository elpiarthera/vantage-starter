"use client";

import type React from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

/**
 * PillButton - Compact pill-style button for inline settings
 * Sprint 30e.1: Inline Pills in Prompt Bar
 *
 * Design: Glass styling, 44px touch target, smooth transitions
 */

export interface PillButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	/** Visual variant */
	variant?: "default" | "ghost" | "active";
	/** Size variant */
	size?: "sm" | "md";
	/** Whether the pill is in a selected/active state */
	isActive?: boolean;
}

export const PillButton = forwardRef<HTMLButtonElement, PillButtonProps>(
	(
		{
			className,
			variant = "default",
			size = "md",
			isActive = false,
			children,
			...props
		},
		ref,
	) => {
		return (
			<button
				ref={ref}
				type="button"
				className={cn(
					// Base styles
					"inline-flex items-center justify-center gap-1.5 rounded-lg font-medium",
					"transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
					"active:scale-95 disabled:pointer-events-none disabled:opacity-50",

					// Size variants - both meet 44px touch target (WCAG 2.1 Level AA)
					size === "sm" && "min-h-[44px] px-2.5 text-xs",
					size === "md" && "min-h-[44px] px-3 text-sm",

					// Variant styles
					variant === "default" && [
						"bg-secondary/50 border border-border/50",
						"text-foreground",
						"hover:bg-muted/50 hover:border-border/70",
					],
					variant === "ghost" && [
						"bg-transparent",
						"text-muted-foreground",
						"hover:bg-muted/30 hover:text-foreground",
					],
					variant === "active" && [
						"bg-primary/20 border border-primary/50",
						"text-primary",
						"hover:bg-primary/30",
					],

					// Active state override
					isActive && [
						"bg-primary/20 border-primary/50 text-primary",
						"ring-1 ring-primary/30",
					],

					className,
				)}
				{...props}
			>
				{children}
			</button>
		);
	},
);

PillButton.displayName = "PillButton";
