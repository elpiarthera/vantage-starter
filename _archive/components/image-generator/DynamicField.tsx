"use client";

import { useTranslations } from "next-intl";
import type React from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { AspectRatioIcon } from "./AspectRatioIcon";
import type { ParamSchema } from "./types/schema";
import type { VisualSelectOption } from "./VisualSelect";
import { VisualSelect } from "./VisualSelect";

interface DynamicFieldProps {
	param: ParamSchema;
	value: unknown;
	onChange: (value: unknown) => void;
	/** Optional: override options with React nodes for icons (e.g. aspect ratio from constants). */
	optionIcons?: Record<string, React.ReactNode>;
	disabled?: boolean;
	"aria-label"?: string;
	/** Optional: override the translation namespace (defaults to "image_generator") */
	translationNamespace?: string;
}

export function DynamicField({
	param,
	value,
	onChange,
	optionIcons,
	disabled,
	"aria-label": ariaLabel,
	translationNamespace = "image_generator",
}: DynamicFieldProps) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	// biome-ignore lint/suspicious/noExplicitAny: Dynamic translation namespace requires type flexibility for voice_generator and image_generator
	const t = useTranslations(translationNamespace as any) as any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	// biome-ignore lint/suspicious/noExplicitAny: Voices namespace translation requires type flexibility
	const tVoices = useTranslations("voices") as any;

	// Helper to translate labels with different formats
	const translateLabel = (rawLabel: string): string => {
		// 1. "schema_label_xxx" or "schema_option_xxx" -> translate with t("schema_xxx")
		if (
			rawLabel.startsWith("schema_label_") ||
			rawLabel.startsWith("schema_option_")
		) {
			return t(rawLabel);
		}
		// 2. "voice_generator.xxx" with namespace="voice_generator" -> translate with t("xxx")
		if (rawLabel.startsWith(`${translationNamespace}.`)) {
			const keyWithoutNamespace = rawLabel.slice(
				translationNamespace.length + 1,
			);
			return t(keyWithoutNamespace);
		}
		// 3. "voices.xxx" -> translate with tVoices("xxx")
		if (rawLabel.startsWith("voices.")) {
			const keyWithoutNamespace = rawLabel.slice("voices.".length);
			return tVoices(keyWithoutNamespace);
		}
		// 4. Other -> use as-is
		return rawLabel;
	};

	const rawLabel = param.label ?? param.key;
	const label = translateLabel(rawLabel);
	const effectiveValue = value ?? param.default;

	if (param.control === "text") {
		return (
			<div className="space-y-1">
				<label
					htmlFor={`param-${param.key}`}
					className="block text-sm font-medium tracking-tight text-muted-foreground"
				>
					{label}
				</label>
				<input
					id={`param-${param.key}`}
					type="text"
					value={(effectiveValue as string) ?? ""}
					onChange={(e) => onChange(e.target.value)}
					maxLength={param.maxLength}
					disabled={disabled}
					className="min-h-[44px] w-full rounded-lg border border-border/30 bg-transparent px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
					aria-label={ariaLabel ?? label}
				/>
			</div>
		);
	}

	if (param.control === "number") {
		const num =
			typeof effectiveValue === "number"
				? effectiveValue
				: (Number(effectiveValue) ?? param.min ?? 0);
		return (
			<div className="space-y-1">
				<label
					htmlFor={`param-${param.key}`}
					className="block text-sm font-medium tracking-tight text-muted-foreground"
				>
					{label}
				</label>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() =>
							onChange(Math.max(param.min ?? 0, num - (param.step ?? 1)))
						}
						disabled={disabled || (param.min != null && num <= param.min)}
						className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-border/30 bg-transparent text-muted-foreground hover:bg-background/30 disabled:opacity-50"
						aria-label={t("field_decrease", { label })}
					>
						−
					</button>
					<input
						id={`param-${param.key}`}
						type="number"
						value={num}
						onChange={(e) => onChange(Number(e.target.value))}
						min={param.min}
						max={param.max}
						step={param.step ?? 1}
						disabled={disabled}
						className="min-h-[44px] w-16 rounded-lg border border-border/30 bg-transparent px-2 text-center text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
						aria-label={ariaLabel ?? label}
					/>
					<button
						type="button"
						onClick={() =>
							onChange(Math.min(param.max ?? 99, num + (param.step ?? 1)))
						}
						disabled={disabled || (param.max != null && num >= param.max)}
						className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-border/30 bg-transparent text-muted-foreground hover:bg-background/30 disabled:opacity-50"
						aria-label={t("field_increase", { label })}
					>
						+
					</button>
				</div>
			</div>
		);
	}

	if (param.control === "toggle") {
		const checked = Boolean(effectiveValue);
		return (
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-2">
					<label
						htmlFor={`param-${param.key}`}
						className="text-sm font-medium tracking-tight text-muted-foreground"
					>
						{label}
					</label>
					{param.costHint && (
						<span className="text-xs text-muted-foreground">
							{param.costHint}
						</span>
					)}
				</div>
				<Switch
					id={`param-${param.key}`}
					checked={checked}
					onCheckedChange={(v) => onChange(v)}
					disabled={disabled}
					aria-label={ariaLabel ?? label}
				/>
			</div>
		);
	}

	if (param.control === "icon-select" && param.options?.length) {
		// Sprint 30e.3: Auto-generate aspect ratio icons if this is an aspect_ratio param
		const isAspectRatio = param.key === "aspect_ratio";
		const options: VisualSelectOption[] = param.options.map((o) => ({
			value: o.value,
			label: translateLabel(o.label),
			icon:
				optionIcons?.[o.value] ??
				(isAspectRatio ? (
					<AspectRatioIcon ratio={o.value} className="size-5" />
				) : undefined),
		}));
		const strValue = String(
			effectiveValue ?? param.default ?? param.options[0].value,
		);
		return (
			<div className="space-y-1">
				<span className="block text-sm font-medium tracking-tight text-muted-foreground">
					{label}
				</span>
				<VisualSelect
					type="grid"
					options={options}
					value={strValue}
					onChange={(v) => onChange(v)}
					aria-label={ariaLabel ?? label}
				/>
			</div>
		);
	}

	if (param.control === "segmented" && param.options?.length) {
		const strValue = String(
			effectiveValue ?? param.default ?? param.options[0].value,
		);
		const options: VisualSelectOption[] = param.options.map((o) => ({
			value: o.value,
			label: translateLabel(o.label),
		}));
		return (
			<div className="space-y-1">
				<span className="block text-sm font-medium tracking-tight text-muted-foreground">
					{label}
				</span>
				<VisualSelect
					type="segmented"
					options={options}
					value={strValue}
					onChange={(v) => onChange(v)}
					aria-label={ariaLabel ?? label}
				/>
			</div>
		);
	}

	if (param.control === "select" && param.options?.length) {
		const strValue = String(
			effectiveValue ?? param.default ?? param.options[0].value,
		);
		return (
			<div className="space-y-1">
				<label
					htmlFor={`param-${param.key}`}
					className="block text-sm font-medium tracking-tight text-muted-foreground"
				>
					{label}
				</label>
				<Select
					value={strValue}
					onValueChange={(v) => onChange(v)}
					disabled={disabled}
				>
					<SelectTrigger
						id={`param-${param.key}`}
						className="min-h-[44px] w-full bg-transparent border-border/30 text-base"
						aria-label={ariaLabel ?? label}
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{param.options.map((o) => (
							<SelectItem key={o.value} value={o.value}>
								{translateLabel(o.label)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		);
	}

	if (param.control === "textarea") {
		return (
			<div className="space-y-1">
				<label
					htmlFor={`param-${param.key}`}
					className="block text-sm font-medium tracking-tight text-muted-foreground"
				>
					{label}
				</label>
				<textarea
					id={`param-${param.key}`}
					value={(effectiveValue as string) ?? ""}
					onChange={(e) => onChange(e.target.value)}
					maxLength={param.maxLength}
					placeholder={
						param.placeholder ? translateLabel(param.placeholder) : undefined
					}
					rows={param.rows ?? 3}
					disabled={disabled}
					className="min-h-[44px] w-full rounded-lg border border-border/30 bg-transparent px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none leading-relaxed"
					aria-label={ariaLabel ?? label}
				/>
				{param.hint && (
					<p className="text-xs text-muted-foreground leading-relaxed">
						{translateLabel(param.hint)}
					</p>
				)}
			</div>
		);
	}

	if (param.control === "slider" && param.options?.length) {
		const strValue = String(
			effectiveValue ?? param.default ?? param.options[0].value,
		);
		return (
			<div className="space-y-1">
				<label
					htmlFor={`param-${param.key}`}
					className="block text-sm font-medium tracking-tight text-muted-foreground"
				>
					{label}
				</label>
				<Select
					value={strValue}
					onValueChange={(v) => onChange(v)}
					disabled={disabled}
				>
					<SelectTrigger
						id={`param-${param.key}`}
						className={cn(
							"min-h-[44px] w-full bg-transparent border-border/30 text-base",
						)}
						aria-label={ariaLabel ?? label}
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{param.options.map((o) => (
							<SelectItem key={o.value} value={o.value}>
								{translateLabel(o.label)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		);
	}

	return null;
}
