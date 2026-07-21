/**
 * Adapted from mcpcn (https://www.mcpcn.dev) — MIT License.
 * The upstream source ships no license header of its own; this attribution
 * notice is added here per this repo's licensing policy, it is not a
 * preserved original notice.
 *
 * Ported for VantageStarter: already used only tokens present in this
 * repo's OKLCH theme (`border-border`, `bg-card`, `bg-muted`, `text-primary`,
 * `text-foreground`, `text-background`), so no color remapping was needed.
 * Wired into `components/dashboard/account/tabs/UsageCreditsTab.tsx` (Batch 2,
 * docs/mcpcn-block-mapping.md §4 "amount-input"): a manual credit top-up
 * control calling `api.credits.recordManualTopUp`. Replaces nothing — the tab
 * had no top-up control before this. Presets are read from Convex
 * `systemConfig` key `manual_topup_presets`, never hardcoded here.
 */
"use client";

import { Minus, Plus } from "lucide-react";
import type { ChangeEvent, ComponentProps, KeyboardEvent } from "react";
import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AmountInputContextValue {
	amount: number;
	currencySymbol: string;
	decreaseLabel: string;
	editing: boolean;
	increaseLabel: string;
	inputRef: React.RefObject<HTMLInputElement | null>;
	label: string;
	max: number;
	min: number;
	onConfirm?: (value: number) => void;
	presets: number[];
	setAmount: (value: number) => void;
	setEditing: (editing: boolean) => void;
	step: number;
}

const AmountInputContext = createContext<AmountInputContextValue | null>(null);

export const useAmountInput = () => {
	const context = useContext(AmountInputContext);

	if (!context) {
		throw new Error("AmountInput components must be used within AmountInput");
	}

	return context;
};

// Upstream mcpcn generic fallback, used only when a consumer renders this
// block WITHOUT passing `data.presets` — traced survivor of the
// "no top-up tier literal" sweep in docs/mcpcn-block-mapping.md §4
// "amount-input" (Batch 2): `UsageCreditsTab.tsx` always supplies
// `data={{ presets: topUpPresets }}` sourced from Convex `systemConfig`, so
// this literal is dead code on that path and never reaches a real tier
// decision. Left in place because it belongs to the ported block's own
// generic API contract (any future consumer that forgets to pass presets
// falls back to this, not to a runtime crash), not to this repo's top-up
// feature.
const DEFAULT_PRESETS = [10, 25, 50, 100];

export interface AmountInputProps extends ComponentProps<"div"> {
	actions?: {
		onConfirm?: (value: number) => void;
	};
	appearance?: {
		currency?: string;
		/**
		 * i18n override for the decrement button's accessible name. Defaults to
		 * the English literal "Decrease amount" — a caller rendering this block
		 * in a user-facing surface should always pass a `useTranslations()`
		 * string here (see `UsageCreditsTab.tsx`).
		 */
		decreaseLabel?: string;
		/** i18n override for the increment button's accessible name, see `decreaseLabel`. */
		increaseLabel?: string;
		label?: string;
		max?: number;
		min?: number;
		step?: number;
	};
	control?: {
		value?: number;
	};
	data?: {
		presets?: number[];
	};
}

export const AmountInputDisplay = ({
	children,
	className,
	...props
}: ComponentProps<"div">) => {
	const {
		amount,
		currencySymbol,
		decreaseLabel,
		editing,
		increaseLabel,
		inputRef,
		label,
		max,
		min,
		setAmount,
		setEditing,
		step,
	} = useAmountInput();

	const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
		const value = Number.parseInt(
			event.target.value.replaceAll(/[^0-9]/g, ""),
			10,
		);
		if (!Number.isNaN(value)) {
			setAmount(value);
		}
	};

	const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter") {
			setEditing(false);
		}
	};

	return (
		<div
			className={cn(
				"flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
				className,
			)}
			{...props}
		>
			{children ?? (
				<>
					<span className="text-muted-foreground text-xs sm:text-sm">
						{label}
					</span>
					<div className="flex items-center justify-center gap-2">
						<button
							aria-label={decreaseLabel}
							className="flex size-8 cursor-pointer items-center justify-center rounded-full border border-border transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
							disabled={amount <= min}
							onClick={() => setAmount(amount - step)}
							type="button"
						>
							<Minus className="size-4" />
						</button>
						<div className="min-w-24 text-center sm:min-w-28">
							{editing ? (
								<div className="flex items-center justify-center gap-1">
									<span className="font-bold text-muted-foreground text-xl sm:text-2xl">
										{currencySymbol}
									</span>
									<input
										ref={inputRef}
										aria-label={label}
										className="w-16 border-foreground border-b-2 bg-transparent text-center font-bold text-xl outline-none sm:w-20 sm:text-2xl"
										onBlur={() => setEditing(false)}
										onChange={handleInputChange}
										onKeyDown={handleInputKeyDown}
										type="text"
										value={amount}
									/>
								</div>
							) : (
								<button
									aria-label={`${label}: ${currencySymbol}${amount}`}
									className="cursor-pointer font-bold text-xl transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-2xl"
									onClick={() => setEditing(true)}
									type="button"
								>
									{currencySymbol}
									{amount}
								</button>
							)}
						</div>
						<button
							aria-label={increaseLabel}
							className="flex size-8 cursor-pointer items-center justify-center rounded-full border border-border transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
							disabled={amount >= max}
							onClick={() => setAmount(amount + step)}
							type="button"
						>
							<Plus className="size-4" />
						</button>
					</div>
				</>
			)}
		</div>
	);
};

export const AmountInputPresets = ({
	children,
	className,
	...props
}: ComponentProps<"div">) => {
	const { amount, currencySymbol, presets, setAmount } = useAmountInput();

	return (
		<div
			className={cn(
				"flex flex-wrap justify-center gap-2 sm:justify-start",
				className,
			)}
			{...props}
		>
			{children ??
				presets.map((preset) => (
					<button
						aria-pressed={amount === preset}
						className={cn(
							"cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm",
							amount === preset
								? "border-foreground ring-1 ring-foreground"
								: "border-border hover:bg-muted",
						)}
						key={preset}
						onClick={() => setAmount(preset)}
						type="button"
					>
						{currencySymbol}
						{preset}
					</button>
				))}
		</div>
	);
};

export const AmountInputActions = ({
	children,
	className,
	...props
}: ComponentProps<"div">) => {
	const { amount, onConfirm } = useAmountInput();

	if (!(children || onConfirm)) {
		return null;
	}

	return (
		<div className={className} {...props}>
			{children ?? (
				<Button
					className="w-full sm:w-auto"
					onClick={() => onConfirm?.(amount)}
					size="sm"
				>
					Confirm
				</Button>
			)}
		</div>
	);
};

export const AmountInputControls = ({
	children,
	className,
	...props
}: ComponentProps<"div"> & { children: React.ReactNode }) => (
	<div
		className={cn(
			"flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2",
			className,
		)}
		{...props}
	>
		{children}
	</div>
);

const AmountInputRoot = ({
	actions,
	appearance,
	children,
	className,
	control,
	data,
	...props
}: AmountInputProps & { children: React.ReactNode }) => {
	const currency = appearance?.currency ?? "EUR";
	const max = appearance?.max ?? 10_000;
	const min = appearance?.min ?? 0;
	const [amount, setAmountState] = useState(control?.value ?? 0);
	const [editing, setEditing] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setAmountState(control?.value ?? 0);
	}, [control?.value]);

	useEffect(() => {
		if (editing) {
			inputRef.current?.focus();
			inputRef.current?.select();
		}
	}, [editing]);

	const currencySymbol = useMemo(
		() =>
			new Intl.NumberFormat("en-US", {
				currency,
				minimumFractionDigits: 0,
				style: "currency",
			})
				.formatToParts(0)
				.find((part) => part.type === "currency")?.value ?? currency,
		[currency],
	);

	const setAmount = (value: number) => {
		setAmountState(Math.max(min, Math.min(max, value)));
	};

	const context: AmountInputContextValue = {
		amount,
		currencySymbol,
		decreaseLabel: appearance?.decreaseLabel ?? "Decrease amount",
		editing,
		increaseLabel: appearance?.increaseLabel ?? "Increase amount",
		inputRef,
		label: appearance?.label ?? "Amount",
		max,
		min,
		onConfirm: actions?.onConfirm,
		presets: data?.presets ?? DEFAULT_PRESETS,
		setAmount,
		setEditing,
		step: appearance?.step ?? 10,
	};

	return (
		<AmountInputContext.Provider value={context}>
			<div
				className={cn(
					"w-full space-y-3 rounded-md bg-card p-3 sm:rounded-lg sm:p-2",
					className,
				)}
				{...props}
			>
				{children}
			</div>
		</AmountInputContext.Provider>
	);
};

export const AmountInput = AmountInputRoot;
