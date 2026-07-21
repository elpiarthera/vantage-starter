"use client";

import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog";
import * as React from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AlertDialog = AlertDialogPrimitive.Root;

// Base UI's Trigger has no `asChild` prop (confirmed in `AlertDialogTriggerProps`
// / `DialogTriggerProps` — no `asChild` field, unlike Radix's). Both this repo's
// consumers (`ProfileTab.tsx`'s delete-account trigger, the mission detail
// page's reject trigger) rely on `<AlertDialogTrigger asChild><Button/></AlertDialogTrigger>`.
// The wrapper keeps `asChild` in its own public prop surface and maps it to
// Base UI's `render` prop (the general asChild -> render mapping used across
// this migration, e.g. `TooltipTrigger`) so neither consumer needs to change.
function AlertDialogTrigger({
	asChild,
	children,
	...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger> & {
	asChild?: boolean;
}) {
	if (asChild && React.isValidElement(children)) {
		return <AlertDialogPrimitive.Trigger render={children} {...props} />;
	}
	return (
		<AlertDialogPrimitive.Trigger {...props}>
			{children}
		</AlertDialogPrimitive.Trigger>
	);
}

const AlertDialogPortal = AlertDialogPrimitive.Portal;

const AlertDialogOverlay = React.forwardRef<
	React.ComponentRef<typeof AlertDialogPrimitive.Backdrop>,
	React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Backdrop>
>(({ className, ...props }, ref) => (
	<AlertDialogPrimitive.Backdrop
		className={cn(
			"fixed inset-0 z-50 bg-black/80  data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[open]:fade-in-0",
			className,
		)}
		{...props}
		ref={ref}
	/>
));
AlertDialogOverlay.displayName = "AlertDialogOverlay";

const AlertDialogContent = React.forwardRef<
	React.ComponentRef<typeof AlertDialogPrimitive.Popup>,
	React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Popup>
>(({ className, ...props }, ref) => (
	<AlertDialogPortal>
		<AlertDialogOverlay />
		<AlertDialogPrimitive.Popup
			ref={ref}
			className={cn(
				"fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[open]:fade-in-0 data-[closed]:zoom-out-95 data-[open]:zoom-in-95 data-[closed]:slide-out-to-left-1/2 data-[closed]:slide-out-to-top-[48%] data-[open]:slide-in-from-left-1/2 data-[open]:slide-in-from-top-[48%] sm:rounded-lg",
				className,
			)}
			{...props}
		/>
	</AlertDialogPortal>
));
AlertDialogContent.displayName = "AlertDialogContent";

const AlertDialogHeader = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn(
			"flex flex-col space-y-2 text-center sm:text-left",
			className,
		)}
		{...props}
	/>
);
AlertDialogHeader.displayName = "AlertDialogHeader";

const AlertDialogFooter = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn(
			"flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
			className,
		)}
		{...props}
	/>
);
AlertDialogFooter.displayName = "AlertDialogFooter";

const AlertDialogTitle = React.forwardRef<
	React.ComponentRef<typeof AlertDialogPrimitive.Title>,
	React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
	<AlertDialogPrimitive.Title
		ref={ref}
		className={cn("text-lg font-semibold", className)}
		{...props}
	/>
));
AlertDialogTitle.displayName = "AlertDialogTitle";

// Base UI's `Description` has no `asChild` prop either (it always renders its
// own `<p>`). `ProfileTab.tsx`'s delete-confirmation dialog renders a `<div>`
// of mixed content (paragraph + conditional warning blocks) as the
// description via `<AlertDialogDescription asChild><div>...</div></...>`,
// which requires an element other than `<p>` — the same `asChild` -> `render`
// mapping used on `AlertDialogTrigger` above preserves this without touching
// the consumer.
const AlertDialogDescription = React.forwardRef<
	React.ComponentRef<typeof AlertDialogPrimitive.Description>,
	React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description> & {
		asChild?: boolean;
	}
>(({ className, asChild, children, ...props }, ref) => {
	if (asChild && React.isValidElement(children)) {
		return (
			<AlertDialogPrimitive.Description
				ref={ref}
				className={cn("text-sm text-muted-foreground", className)}
				render={children}
				{...props}
			/>
		);
	}
	return (
		<AlertDialogPrimitive.Description
			ref={ref}
			className={cn("text-sm text-muted-foreground", className)}
			{...props}
		>
			{children}
		</AlertDialogPrimitive.Description>
	);
});
AlertDialogDescription.displayName = "AlertDialogDescription";

// Base UI's alert-dialog package has no separate Action/Cancel parts — Radix's
// `Action` (confirms + closes) and `Cancel` (dismisses + closes) both map onto
// Base UI's single `Close` part (a button that closes the dialog on click).
// `Close`'s own `onClick` only closes; it does not know about a consumer-supplied
// `onClick` (e.g. the destructive confirm handler). The wrapper composes both:
// it fires the consumer's `onClick` first, then lets Base UI's internal
// `handleClick` close the dialog — this preserves the pre-migration public API
// (`<AlertDialogAction onClick={handleReject}>`) with zero consumer changes.
const AlertDialogAction = React.forwardRef<
	React.ComponentRef<typeof AlertDialogPrimitive.Close>,
	React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Close>
>(({ className, ...props }, ref) => (
	<AlertDialogPrimitive.Close
		ref={ref}
		className={cn(buttonVariants(), className)}
		{...props}
	/>
));
AlertDialogAction.displayName = "AlertDialogAction";

const AlertDialogCancel = React.forwardRef<
	React.ComponentRef<typeof AlertDialogPrimitive.Close>,
	React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Close>
>(({ className, ...props }, ref) => (
	<AlertDialogPrimitive.Close
		ref={ref}
		className={cn(
			buttonVariants({ variant: "outline" }),
			"mt-2 sm:mt-0",
			className,
		)}
		{...props}
	/>
));
AlertDialogCancel.displayName = "AlertDialogCancel";

export {
	AlertDialog,
	AlertDialogPortal,
	AlertDialogOverlay,
	AlertDialogTrigger,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogFooter,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogAction,
	AlertDialogCancel,
};
