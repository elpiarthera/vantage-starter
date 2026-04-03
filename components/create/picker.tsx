"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as React from "react";

import { cn } from "@/lib/utils";

function Picker({ ...props }: DropdownMenu.DropdownMenuProps) {
	return <DropdownMenu.Root {...props} />;
}

function PickerTrigger({
	className,
	disabled,
	children,
	...props
}: React.ComponentProps<typeof DropdownMenu.Trigger>) {
	return (
		<DropdownMenu.Trigger
			disabled={disabled}
			className={cn(
				"relative w-36 shrink-0 touch-manipulation rounded-xl p-3 ring-1 ring-foreground/10 select-none hover:bg-muted focus-visible:ring-foreground/50 focus-visible:outline-none disabled:opacity-50 data-[state=open]:bg-muted md:w-full md:rounded-lg md:px-2.5 md:py-2",
				className,
			)}
			{...props}
		>
			{children}
		</DropdownMenu.Trigger>
	);
}

function PickerContent({
	align = "start",
	sideOffset = 8,
	side = "bottom",
	className,
	children,
	...props
}: React.ComponentProps<typeof DropdownMenu.Content>) {
	return (
		<DropdownMenu.Portal>
			<DropdownMenu.Content
				align={align}
				sideOffset={sideOffset}
				side={side}
				className={cn(
					"z-50 no-scrollbar max-h-[min(var(--radix-dropdown-menu-content-available-height),24rem)] min-w-32 overflow-x-hidden overflow-y-auto rounded-xl bg-neutral-950/85 p-1.5 text-neutral-100 ring-1 ring-neutral-950/80 backdrop-blur-xl outline-none md:w-52 dark:bg-neutral-800/90 dark:ring-neutral-700/50",
					"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
					className,
				)}
				{...props}
			>
				{children}
			</DropdownMenu.Content>
		</DropdownMenu.Portal>
	);
}

function PickerGroup({
	...props
}: React.ComponentProps<typeof DropdownMenu.Group>) {
	return <DropdownMenu.Group {...props} />;
}

function PickerLabel({
	className,
	...props
}: React.ComponentProps<typeof DropdownMenu.Label>) {
	return (
		<DropdownMenu.Label
			className={cn(
				"px-2 py-1.5 text-xs font-medium text-neutral-400",
				className,
			)}
			{...props}
		/>
	);
}

function PickerItem({
	className,
	children,
	...props
}: React.ComponentProps<typeof DropdownMenu.Item>) {
	return (
		<DropdownMenu.Item
			className={cn(
				"relative flex cursor-default items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium outline-none select-none text-neutral-100 focus:bg-neutral-600 focus:text-neutral-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
				className,
			)}
			{...props}
		>
			{children}
		</DropdownMenu.Item>
	);
}

function PickerSeparator({
	className,
	...props
}: React.ComponentProps<typeof DropdownMenu.Separator>) {
	return (
		<DropdownMenu.Separator
			className={cn(
				"-mx-1.5 my-1.5 h-px bg-neutral-600 dark:bg-neutral-700",
				className,
			)}
			{...props}
		/>
	);
}

// Radio group using controlled state (no Radix RadioGroup to avoid complexity)
function PickerRadioGroup({
	value,
	onValueChange,
	children,
}: {
	value?: string;
	onValueChange?: (value: string) => void;
	children: React.ReactNode;
}) {
	return (
		<PickerRadioContext.Provider value={{ value: value ?? "", onValueChange }}>
			{children}
		</PickerRadioContext.Provider>
	);
}

const PickerRadioContext = React.createContext<{
	value: string;
	onValueChange?: (value: string) => void;
}>({ value: "" });

function PickerRadioItem({
	className,
	value,
	children,
	closeOnClick,
	...props
}: Omit<React.ComponentProps<typeof DropdownMenu.Item>, "value"> & {
	value: string;
	closeOnClick?: boolean;
}) {
	const ctx = React.useContext(PickerRadioContext);
	const isSelected = ctx.value === value;

	return (
		<DropdownMenu.Item
			className={cn(
				"relative flex cursor-default items-center gap-2 rounded-lg py-1.5 pr-8 pl-2 text-sm font-medium outline-none select-none text-neutral-100 focus:bg-neutral-600 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
				className,
			)}
			onSelect={(e) => {
				if (!closeOnClick) e.preventDefault();
				ctx.onValueChange?.(value);
			}}
			{...props}
		>
			{children}
			{isSelected && (
				<span className="pointer-events-none absolute right-2 flex items-center justify-center">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.5"
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
					>
						<polyline points="20 6 9 17 4 12" />
					</svg>
				</span>
			)}
		</DropdownMenu.Item>
	);
}

export {
	Picker,
	PickerTrigger,
	PickerContent,
	PickerGroup,
	PickerLabel,
	PickerItem,
	PickerRadioGroup,
	PickerRadioItem,
	PickerSeparator,
};
