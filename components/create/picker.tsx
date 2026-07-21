"use client";

import { Menu as DropdownMenu } from "@base-ui/react/menu";
import * as React from "react";

import { cn } from "@/lib/utils";

function Picker({ ...props }: React.ComponentProps<typeof DropdownMenu.Root>) {
	return <DropdownMenu.Root {...props} />;
}

// Zero consumers of this Picker family pass `asChild` to `PickerTrigger`
// (verified: `git grep -n "PickerTrigger asChild"` -> no repo hits), so no
// render-bridge wrapper is added here — a speculative bridge with no
// consumer to prove it is not added, per the M7 doctrine (`DialogTrigger`
// precedent).
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
				"relative w-36 shrink-0 touch-manipulation rounded-xl p-3 ring-1 ring-foreground/10 select-none hover:bg-muted focus-visible:ring-foreground/50 focus-visible:outline-none disabled:opacity-50 data-[popup-open]:bg-muted md:w-full md:rounded-lg md:px-2.5 md:py-2",
				className,
			)}
			{...props}
		>
			{children}
		</DropdownMenu.Trigger>
	);
}

// STRUCTURAL: Radix's `Content` combined anchor positioning + visual surface
// into one part. Base UI splits these into `Portal` > `Positioner` (owns
// side/align/sideOffset) > `Popup` (owns only the visual surface) — the
// `Positioner` insertion is the migration-risk surface here: omitting it
// leaves the popup unpositioned (or, per the picker.tsx test, unmounted).
function PickerContent({
	align = "start",
	sideOffset = 8,
	side = "bottom",
	className,
	children,
	...props
}: React.ComponentProps<typeof DropdownMenu.Popup> & {
	align?: "start" | "center" | "end";
	sideOffset?: number;
	side?: "top" | "bottom" | "left" | "right";
}) {
	return (
		<DropdownMenu.Portal>
			<DropdownMenu.Positioner
				align={align}
				sideOffset={sideOffset}
				side={side}
			>
				<DropdownMenu.Popup
					className={cn(
						"z-50 no-scrollbar max-h-[min(var(--available-height),24rem)] min-w-32 overflow-x-hidden overflow-y-auto rounded-xl bg-neutral-950/85 p-1.5 text-neutral-100 ring-1 ring-neutral-950/80 backdrop-blur-xl outline-none md:w-52 dark:bg-neutral-800/90 dark:ring-neutral-700/50",
						"data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[open]:fade-in-0 data-[closed]:zoom-out-95 data-[open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
						className,
					)}
					{...props}
				>
					{children}
				</DropdownMenu.Popup>
			</DropdownMenu.Positioner>
		</DropdownMenu.Portal>
	);
}

function PickerGroup({
	...props
}: React.ComponentProps<typeof DropdownMenu.Group>) {
	return <DropdownMenu.Group {...props} />;
}

// DIVERGENCE: Base UI's menu package has no standalone `Label` part — only
// `GroupLabel`, which requires a `Group` ancestor. None of this repo's
// picker consumers wrap `PickerLabel` in a `PickerGroup`, so `GroupLabel`
// cannot be used without also changing consumer markup. A plain styled
// `<div>` preserves the pre-migration behavior (Radix's `Label` was already
// a plain `<div>` with no ARIA role) — same choice made for
// `DropdownMenuLabel` in `components/ui/dropdown-menu.tsx`.
function PickerLabel({
	className,
	...props
}: React.ComponentPropsWithoutRef<"div">) {
	return (
		<div
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
				"relative flex cursor-default items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium outline-none select-none text-neutral-100 data-[highlighted]:bg-neutral-600 data-[highlighted]:text-neutral-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
				className,
			)}
			{...props}
		>
			{children}
		</DropdownMenu.Item>
	);
}

// DIVERGENCE: no Base UI `separator` part exists directly under
// `@base-ui/react/menu`, but `Menu`'s own export index re-exports the
// standalone `@base-ui/react/separator` package's `Separator` as
// `Menu.Separator` (confirmed in `index.parts.d.ts`), so no extra import is
// needed — same finding as `components/ui/dropdown-menu.tsx`.
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

// Radio group using controlled state (no Base UI RadioGroup to avoid
// complexity — same pre-existing choice as when this was built on Radix).
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

// Base UI's `Item` ships its own `closeOnClick` prop (default `true`),
// replacing Radix's manual `onSelect` + `preventDefault` dance this wrapper
// previously needed to keep the menu open on selection.
function PickerRadioItem({
	className,
	value,
	children,
	closeOnClick = false,
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
				"relative flex cursor-default items-center gap-2 rounded-lg py-1.5 pr-8 pl-2 text-sm font-medium outline-none select-none text-neutral-100 data-[highlighted]:bg-neutral-600 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
				className,
			)}
			closeOnClick={closeOnClick}
			onClick={() => ctx.onValueChange?.(value)}
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
