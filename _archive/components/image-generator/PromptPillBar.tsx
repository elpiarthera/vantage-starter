"use client";

import {
	Check,
	ChevronDown,
	Hash,
	MoreHorizontal,
	Pencil,
	Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AdaptiveModal } from "@/components/adaptive/AdaptiveModal";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDevice } from "@/contexts/DeviceContext";
import { AspectRatioIcon } from "./AspectRatioIcon";
import { DynamicField } from "./DynamicField";
import { PillButton } from "./PillButton";
import type { ModelSchema, ParamSchema } from "./types/schema";

/**
 * PromptPillBar - Inline pills for primary settings
 * Sprint 30e.1: Inline Pills in Prompt Bar
 *
 * Shows: Model, Aspect Ratio, Resolution, Count
 * Mobile: Wraps, with overflow menu for Resolution + Count
 */

interface PromptPillBarProps {
	/** Current schema (for model name and available params) */
	schema: ModelSchema | null;
	/** Current params values */
	params: Record<string, unknown>;
	/** Callback to update a param */
	onParamChange: (key: string, value: unknown) => void;
	/** Opens the model selector modal */
	onModelSelectorOpen: () => void;
	/** Current mode (generate/edit) */
	mode: "generate" | "edit";
	/** Whether controls are disabled */
	disabled?: boolean;
}

// Primary params that appear as pills (in order).
// result_type must precede num_images/series_amount so the O3 toggle renders before the count.
const PRIMARY_PARAM_KEYS = [
	"aspect_ratio",
	"resolution",
	"result_type",
	"num_images",
	"series_amount",
] as const;

// Params hidden on mobile (shown in overflow menu)
const MOBILE_OVERFLOW_KEYS = [
	"resolution",
	"result_type",
	"num_images",
	"series_amount",
] as const;

export function PromptPillBar({
	schema,
	params,
	onParamChange,
	onModelSelectorOpen,
	mode,
	disabled,
}: PromptPillBarProps) {
	const t = useTranslations("image_generator");
	const { isMobile } = useDevice();
	const [moreOpen, setMoreOpen] = useState(false);

	// Get primary params from schema
	const getPrimaryParams = (): ParamSchema[] => {
		if (!schema) return [];
		return PRIMARY_PARAM_KEYS.map((key) =>
			schema.params.find((p) => p.key === key),
		).filter((p): p is ParamSchema => p !== undefined);
	};

	// Get overflow params (mobile only)
	const getOverflowParams = (): ParamSchema[] => {
		if (!schema) return [];
		return MOBILE_OVERFLOW_KEYS.map((key) =>
			schema.params.find((p) => p.key === key),
		).filter((p): p is ParamSchema => p !== undefined);
	};

	const primaryParams = getPrimaryParams();
	const overflowParams = getOverflowParams();

	// Get display value for a param
	const getDisplayValue = (param: ParamSchema): string => {
		const value = params[param.key] ?? param.default;
		if (param.key === "num_images" || param.key === "series_amount") {
			return `×${value}`;
		}
		return String(value);
	};

	// Check if param should be visible based on showWhen
	const isParamVisible = (param: ParamSchema): boolean => {
		if (!param.showWhen) return true;
		const current = params[param.showWhen.param];
		return current === param.showWhen.value;
	};

	// Render a pill with dropdown for changing value
	const renderParamPill = (param: ParamSchema, hideOnMobile = false) => {
		if (!isParamVisible(param)) return null;

		const value = params[param.key] ?? param.default;
		const displayValue = getDisplayValue(param);
		const isAspectRatio = param.key === "aspect_ratio";
		const hasOptions = param.options && param.options.length > 0;

		// For params with options, use dropdown
		if (hasOptions) {
			return (
				<DropdownMenu key={param.key}>
					<DropdownMenuTrigger asChild>
						<PillButton
							className={hideOnMobile ? "hidden sm:inline-flex" : undefined}
							disabled={disabled}
							aria-label={t(`pills.${param.key}`, { fallback: param.key })}
						>
							{isAspectRatio && (
								<AspectRatioIcon ratio={String(value)} className="size-4" />
							)}
							{param.key === "num_images" && <Hash className="size-3.5" />}
							<span className={isAspectRatio ? "hidden sm:inline" : undefined}>
								{displayValue}
							</span>
							<ChevronDown className="size-3 opacity-60" />
						</PillButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start" className="min-w-[120px]">
						{param.options?.map((option) => {
							const optionLabel = option.label.startsWith("schema_option_")
								? t(option.label)
								: option.label;
							return (
								<DropdownMenuItem
									key={option.value}
									onClick={() => onParamChange(param.key, option.value)}
									className="flex min-h-[44px] items-center gap-2 py-2"
								>
									{isAspectRatio && (
										<AspectRatioIcon ratio={option.value} className="size-4" />
									)}
									<span>{optionLabel}</span>
									{String(value) === option.value && (
										<Check
											className="size-3 ml-auto text-primary"
											aria-hidden="true"
										/>
									)}
								</DropdownMenuItem>
							);
						})}
					</DropdownMenuContent>
				</DropdownMenu>
			);
		}

		// For number params without options, show current value (click opens overflow)
		return (
			<PillButton
				key={param.key}
				className={hideOnMobile ? "hidden sm:inline-flex" : undefined}
				disabled={disabled}
				onClick={() => setMoreOpen(true)}
				aria-label={t(`pills.${param.key}`, { fallback: param.key })}
			>
				{param.key === "num_images" && <Hash className="size-3.5" />}
				<span>{displayValue}</span>
			</PillButton>
		);
	};

	// Mobile overflow menu content
	const renderOverflowContent = () => (
		<div className="space-y-4 p-1">
			{overflowParams.map((param) => {
				if (!isParamVisible(param)) return null;
				const value = params[param.key] ?? param.default;
				return (
					<DynamicField
						key={param.key}
						param={param}
						value={value}
						onChange={(v) => onParamChange(param.key, v)}
						disabled={disabled}
					/>
				);
			})}
		</div>
	);

	// Short model name (e.g., "Kling v3" from "Kling v3 — Text-to-Image")
	const shortModelName = schema?.name?.split(" — ")[0] ?? t("loading_models");

	return (
		<div className="flex flex-wrap items-center gap-2 md:flex-nowrap md:gap-2.5">
			{/* Model Pill */}
			<PillButton
				onClick={onModelSelectorOpen}
				disabled={disabled}
				aria-label={t("pills.model")}
			>
				{mode === "edit" ? (
					<Pencil className="size-4" />
				) : (
					<Sparkles className="size-4" />
				)}
				<span className="max-w-[100px] truncate sm:max-w-none">
					{shortModelName}
				</span>
				<ChevronDown className="size-3 opacity-60" />
			</PillButton>

			{/* Primary Param Pills */}
			{primaryParams.map((param) => {
				const hideOnMobile = MOBILE_OVERFLOW_KEYS.includes(
					param.key as (typeof MOBILE_OVERFLOW_KEYS)[number],
				);
				return renderParamPill(param, hideOnMobile);
			})}

			{/* Mobile Overflow Menu */}
			{isMobile && overflowParams.length > 0 && (
				<>
					<PillButton
						className="sm:hidden"
						aria-label={t("pills.more_options")}
						disabled={disabled}
						onClick={() => setMoreOpen(true)}
					>
						<MoreHorizontal className="size-4" />
					</PillButton>
					<AdaptiveModal
						isOpen={moreOpen}
						onClose={() => setMoreOpen(false)}
						title={t("pills.more_options")}
					>
						{renderOverflowContent()}
					</AdaptiveModal>
				</>
			)}
		</div>
	);
}
