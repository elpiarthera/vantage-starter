"use client";

import { Menu as DropdownMenuPrimitive } from "@base-ui/react/menu";
import * as React from "react";

import { cn } from "@/lib/utils";

const DropdownMenu = DropdownMenuPrimitive.Root;

// Base UI's Trigger has no `asChild` prop (confirmed in `MenuTriggerProps` —
// no `asChild` field, unlike Radix's). Five real consumers rely on
// `<DropdownMenuTrigger asChild><Button/></DropdownMenuTrigger>`:
// DashboardHeader.tsx:170, LanguageSwitcher.tsx:69, step-header.tsx:96,
// sidebar-user-nav.tsx:53, message-bubble.tsx:443. The wrapper keeps `asChild`
// in its own public prop surface and maps it to Base UI's `render` prop (the
// same asChild -> render mapping established for AlertDialogTrigger in M4),
// so none of the five consumers need to change.
function DropdownMenuTrigger({
	asChild,
	children,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger> & {
	asChild?: boolean;
}) {
	if (asChild && React.isValidElement(children)) {
		return <DropdownMenuPrimitive.Trigger render={children} {...props} />;
	}
	return (
		<DropdownMenuPrimitive.Trigger {...props}>
			{children}
		</DropdownMenuPrimitive.Trigger>
	);
}

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

// Radix's `Sub` -> Base UI's `SubmenuRoot` (renamed).
const DropdownMenuSub = DropdownMenuPrimitive.SubmenuRoot;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubTrigger = React.forwardRef<
	React.ComponentRef<typeof DropdownMenuPrimitive.SubmenuTrigger>,
	React.ComponentPropsWithoutRef<
		typeof DropdownMenuPrimitive.SubmenuTrigger
	> & {
		inset?: boolean;
	}
>(({ className, inset, children, ...props }, ref) => (
	<DropdownMenuPrimitive.SubmenuTrigger
		ref={ref}
		className={cn(
			"flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[popup-open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
			inset && "pl-8",
			className,
		)}
		{...props}
	>
		{children}
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="ml-auto"
			aria-hidden="true"
		>
			<path d="m9 18 6-6-6-6" />
		</svg>
	</DropdownMenuPrimitive.SubmenuTrigger>
));
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger";

// Base UI has no single `SubContent` part — like `DropdownMenuContent` below,
// a submenu's popup requires the `Portal > Positioner > Popup` structure
// (Radix's `SubContent` combined position + surface into one part).
const DropdownMenuSubContent = React.forwardRef<
	React.ComponentRef<typeof DropdownMenuPrimitive.Popup>,
	React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Popup>
>(({ className, ...props }, ref) => (
	<DropdownMenuPrimitive.Portal>
		<DropdownMenuPrimitive.Positioner>
			<DropdownMenuPrimitive.Popup
				ref={ref}
				className={cn(
					"z-50 min-w-[8rem] overflow-hidden rounded-xl border border-border p-1.5 shadow-lg data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[open]:fade-in-0 data-[closed]:zoom-out-95 data-[open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
					className,
				)}
				style={{
					backgroundColor: "oklch(0.269 0 0)",
					color: "oklch(0.985 0 0)",
				}}
				{...props}
			/>
		</DropdownMenuPrimitive.Positioner>
	</DropdownMenuPrimitive.Portal>
));
DropdownMenuSubContent.displayName = "DropdownMenuSubContent";

// STRUCTURAL: Radix's `Content` (rendered inside `Portal`) combined anchor
// positioning + visual surface into one part. Base UI splits these: `Portal`
// > `Positioner` (owns side/align/sideOffset) > `Popup` (owns only the
// visual surface). `Positioner` must be inserted here — omitting it is a
// migration-risk surface (the popup would render unpositioned).
const DropdownMenuContent = React.forwardRef<
	React.ComponentRef<typeof DropdownMenuPrimitive.Popup>,
	React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Popup> & {
		sideOffset?: number;
		side?: "top" | "bottom" | "left" | "right";
		align?: "start" | "center" | "end";
	}
>(({ className, sideOffset = 4, side, align, style, ...props }, ref) => (
	<DropdownMenuPrimitive.Portal>
		<DropdownMenuPrimitive.Positioner
			sideOffset={sideOffset}
			side={side}
			align={align}
		>
			<DropdownMenuPrimitive.Popup
				ref={ref}
				className={cn(
					"z-50 min-w-[8rem] overflow-hidden rounded-xl border border-border p-1.5 shadow-lg data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[open]:fade-in-0 data-[closed]:zoom-out-95 data-[open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
					className,
				)}
				style={{
					backgroundColor: "oklch(0.269 0 0)",
					color: "oklch(0.985 0 0)",
					...style,
				}}
				{...props}
			/>
		</DropdownMenuPrimitive.Positioner>
	</DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = "DropdownMenuContent";

// Base UI's `Item` has no `asChild` prop either. Four real consumers rely on
// `<DropdownMenuItem asChild>`: DashboardHeader.tsx:221,239, step-header.tsx:122,
// sidebar-user-nav.tsx:95 — each wraps a `<Link>`. Same render-bridge mapping
// as `DropdownMenuTrigger` above.
const DropdownMenuItem = React.forwardRef<
	React.ComponentRef<typeof DropdownMenuPrimitive.Item>,
	React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
		inset?: boolean;
		asChild?: boolean;
	}
>(({ className, inset, asChild, children, ...props }, ref) => {
	const itemClassName = cn(
		"relative flex cursor-default select-none items-center gap-2 rounded-md px-3 py-2 text-sm outline-none transition-colors data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
		inset && "pl-8",
		className,
	);
	if (asChild && React.isValidElement(children)) {
		return (
			<DropdownMenuPrimitive.Item
				ref={ref}
				className={itemClassName}
				render={children}
				{...props}
			/>
		);
	}
	return (
		<DropdownMenuPrimitive.Item ref={ref} className={itemClassName} {...props}>
			{children}
		</DropdownMenuPrimitive.Item>
	);
});
DropdownMenuItem.displayName = "DropdownMenuItem";

const DropdownMenuCheckboxItem = React.forwardRef<
	React.ComponentRef<typeof DropdownMenuPrimitive.CheckboxItem>,
	React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
	<DropdownMenuPrimitive.CheckboxItem
		ref={ref}
		className={cn(
			"relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
			className,
		)}
		checked={checked}
		{...props}
	>
		<span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
			<DropdownMenuPrimitive.CheckboxItemIndicator>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
				>
					<path d="M20 6 9 17l-5-5" />
				</svg>
			</DropdownMenuPrimitive.CheckboxItemIndicator>
		</span>
		{children}
	</DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

const DropdownMenuRadioItem = React.forwardRef<
	React.ComponentRef<typeof DropdownMenuPrimitive.RadioItem>,
	React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
	<DropdownMenuPrimitive.RadioItem
		ref={ref}
		className={cn(
			"relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
			className,
		)}
		{...props}
	>
		<span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
			<DropdownMenuPrimitive.RadioItemIndicator>
				<svg
					width="8"
					height="8"
					viewBox="0 0 8 8"
					fill="currentColor"
					aria-hidden="true"
				>
					<circle cx="4" cy="4" r="4" />
				</svg>
			</DropdownMenuPrimitive.RadioItemIndicator>
		</span>
		{children}
	</DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem";

// DIVERGENCE: Base UI's menu package has no standalone `Label` part — only
// `GroupLabel`, which requires a `Group` ancestor (confirmed: `ls
// node_modules/@base-ui/react/menu` has no `label` dir, only `group-label`).
// This repo's sole consumer, DashboardHeader.tsx:196, renders
// `<DropdownMenuLabel>` standalone (not inside a `DropdownMenuGroup`), so
// `GroupLabel` cannot be used there without also wrapping it in a `Group`
// (a markup change to the consumer this migration avoids per M5 doctrine).
// The wrapper renders a plain styled `<div>` instead — identical visual
// result, no semantic loss (Radix's `Label` was already a plain `<div>` with
// no ARIA role).
const DropdownMenuLabel = React.forwardRef<
	HTMLDivElement,
	React.ComponentPropsWithoutRef<"div"> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			"px-2 py-1.5 text-sm font-medium text-muted-foreground",
			inset && "pl-8",
			className,
		)}
		{...props}
	/>
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

// DIVERGENCE: Base UI's menu package has no dedicated `separator` part of its
// own (confirmed: `ls node_modules/@base-ui/react/menu` has no `separator`
// dir) — but `Menu`'s own export index re-exports the standalone
// `@base-ui/react/separator` package's `Separator` component as
// `Menu.Separator` (confirmed in `index.parts.d.ts`:
// `export { Separator } from "../separator/Separator.js"`), so no extra
// import is needed.
const DropdownMenuSeparator = React.forwardRef<
	React.ComponentRef<typeof DropdownMenuPrimitive.Separator>,
	React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
	<DropdownMenuPrimitive.Separator
		ref={ref}
		className={cn("-mx-1 my-1 h-px bg-border", className)}
		{...props}
	/>
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

const DropdownMenuShortcut = ({
	className,
	...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
	return (
		<span
			className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
			{...props}
		/>
	);
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

export {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuCheckboxItem,
	DropdownMenuRadioItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuGroup,
	DropdownMenuPortal,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuRadioGroup,
};
