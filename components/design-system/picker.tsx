"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ── Picker — composable dropdown built on native React state (no @base-ui/react) ──

type PickerContextValue = {
	open: boolean;
	setOpen: (v: boolean) => void;
};

const PickerContext = React.createContext<PickerContextValue>({
	open: false,
	setOpen: () => {},
});

function Picker({ children }: { children: React.ReactNode }) {
	const [open, setOpen] = React.useState(false);
	const ref = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		if (!open) return;
		function handle(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		document.addEventListener("mousedown", handle);
		return () => document.removeEventListener("mousedown", handle);
	}, [open]);

	return (
		<PickerContext.Provider value={{ open, setOpen }}>
			<div ref={ref} className="relative">
				{children}
			</div>
		</PickerContext.Provider>
	);
}

function PickerTrigger({
	className,
	children,
	disabled,
	...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
	const { open, setOpen } = React.useContext(PickerContext);
	return (
		<button
			type="button"
			aria-expanded={open}
			disabled={disabled}
			onClick={() => !disabled && setOpen(!open)}
			className={cn(
				"relative w-36 shrink-0 touch-manipulation rounded-xl p-3 text-left ring-1 ring-foreground/10",
				"select-none hover:bg-muted focus-visible:ring-foreground/50 focus-visible:outline-none",
				"disabled:opacity-50 md:w-full md:rounded-lg md:px-2.5 md:py-2",
				open && "bg-muted",
				className,
			)}
			{...props}
		>
			{children}
		</button>
	);
}

function PickerContent({
	className,
	children,
}: {
	className?: string;
	children: React.ReactNode;
}) {
	const { open } = React.useContext(PickerContext);
	if (!open) return null;
	return (
		<div
			className={cn(
				"absolute left-full top-0 z-50 ml-2 no-scrollbar",
				"max-h-96 w-52 overflow-y-auto overflow-x-hidden rounded-xl",
				"border-0 bg-neutral-950/85 p-1.5 text-neutral-100",
				"ring-1 ring-neutral-950/80 backdrop-blur-xl shadow-xl",
				"max-md:fixed max-md:left-4 max-md:right-4 max-md:bottom-4 max-md:top-auto max-md:w-auto",
				className,
			)}
		>
			{children}
		</div>
	);
}

function PickerGroup({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("flex flex-col gap-0.5", className)}>{children}</div>
	);
}

function PickerLabel({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"px-2 py-1 text-xs font-medium text-neutral-400",
				className,
			)}
		>
			{children}
		</div>
	);
}

type PickerRadioGroupProps = {
	value?: string;
	onValueChange?: (value: string) => void;
	children: React.ReactNode;
};

const PickerRadioGroupContext = React.createContext<
	Pick<PickerRadioGroupProps, "value" | "onValueChange">
>({});

function PickerRadioGroup({
	value,
	onValueChange,
	children,
}: PickerRadioGroupProps) {
	return (
		<PickerRadioGroupContext.Provider value={{ value, onValueChange }}>
			<div role="listbox" aria-orientation="vertical">
				{children}
			</div>
		</PickerRadioGroupContext.Provider>
	);
}

function PickerRadioItem({
	value,
	children,
	className,
	disabled,
	closeOnClick,
}: {
	value: string;
	children: React.ReactNode;
	className?: string;
	disabled?: boolean;
	closeOnClick?: boolean;
}) {
	const { value: selected, onValueChange } = React.useContext(
		PickerRadioGroupContext,
	);
	const { setOpen } = React.useContext(PickerContext);
	const isChecked = selected === value;

	return (
		<button
			type="button"
			role="option"
			aria-selected={isChecked}
			disabled={disabled}
			onClick={() => {
				if (!disabled) {
					onValueChange?.(value);
					if (closeOnClick) setOpen(false);
				}
			}}
			className={cn(
				"group relative flex w-full cursor-default items-center gap-2 rounded-lg px-2 py-1.5",
				"text-sm font-medium text-neutral-100 outline-none select-none",
				"hover:bg-neutral-600 focus-visible:bg-neutral-600",
				"data-disabled:pointer-events-none data-disabled:opacity-50",
				"pointer-coarse:gap-3 pointer-coarse:py-2.5 pointer-coarse:pl-3 pointer-coarse:text-base",
				className,
			)}
			data-disabled={disabled || undefined}
		>
			{children}
			{isChecked && (
				<span className="pointer-events-none absolute right-2 flex items-center justify-center">
					<svg
						width="12"
						height="12"
						viewBox="0 0 12 12"
						fill="none"
						aria-hidden="true"
					>
						<path
							d="M2 6l2.5 2.5L10 3.5"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</span>
			)}
		</button>
	);
}

function PickerSeparator({ className }: { className?: string }) {
	return (
		<div className={cn("-mx-1.5 my-1.5 h-px bg-neutral-700", className)} />
	);
}

export {
	Picker,
	PickerTrigger,
	PickerContent,
	PickerGroup,
	PickerLabel,
	PickerRadioGroup,
	PickerRadioItem,
	PickerSeparator,
};
