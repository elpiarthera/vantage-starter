"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import * as React from "react";

import { cn } from "@/lib/utils";

function TooltipProvider({
	delayDuration = 0,
	...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider> & {
	delayDuration?: number;
}) {
	return (
		<TooltipPrimitive.Provider
			data-slot="tooltip-provider"
			delay={delayDuration}
			{...props}
		/>
	);
}

function Tooltip({
	...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
	return (
		<TooltipProvider>
			<TooltipPrimitive.Root data-slot="tooltip" {...props} />
		</TooltipProvider>
	);
}

function TooltipTrigger({
	asChild,
	children,
	...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger> & {
	asChild?: boolean;
}) {
	if (asChild && React.isValidElement(children)) {
		return (
			<TooltipPrimitive.Trigger
				data-slot="tooltip-trigger"
				render={children}
				{...props}
			/>
		);
	}
	return (
		<TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props}>
			{children}
		</TooltipPrimitive.Trigger>
	);
}

function TooltipContent({
	className,
	sideOffset = 0,
	side,
	align,
	children,
	ArrowColor = "bg-primary fill-primary",
	...props
}: React.ComponentProps<typeof TooltipPrimitive.Popup> &
	Pick<
		React.ComponentProps<typeof TooltipPrimitive.Positioner>,
		"sideOffset" | "side" | "align"
	> & {
		ArrowColor?: string;
	}) {
	return (
		<TooltipPrimitive.Portal>
			<TooltipPrimitive.Positioner
				sideOffset={sideOffset}
				side={side}
				align={align}
			>
				<TooltipPrimitive.Popup
					data-slot="tooltip-content"
					role="tooltip"
					className={cn(
						"bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[closed]:animate-out data-[closed]:fade-out-0 data-[closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--transform-origin) rounded-md px-3 py-1.5 text-xs text-balance",
						className,
					)}
					{...props}
				>
					{children}
					<TooltipPrimitive.Arrow
						className={cn(
							"z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]",
							ArrowColor,
						)}
					/>
				</TooltipPrimitive.Popup>
			</TooltipPrimitive.Positioner>
		</TooltipPrimitive.Portal>
	);
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
