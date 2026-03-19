"use client";

import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { PillButton } from "./PillButton";

/**
 * QuickPresets - Row of preset pills that apply settings on click
 * Sprint 30e.6: Quick Presets
 *
 * Fetches presets from Convex imagePresets table.
 * Each preset applies a model + params combination in one click.
 */

interface QuickPresetsProps {
	/** Callback when user selects a preset */
	onSelectPreset: (schemaId: string, params: Record<string, unknown>) => void;
	/** Currently selected schema ID (to highlight matching preset) */
	currentSchemaId?: string | null;
	/** Current params (to highlight matching preset) */
	currentParams?: Record<string, unknown>;
	/** Whether controls are disabled */
	disabled?: boolean;
	/** Additional CSS classes */
	className?: string;
}

export function QuickPresets({
	onSelectPreset,
	currentSchemaId,
	currentParams,
	disabled,
	className,
}: QuickPresetsProps) {
	const t = useTranslations("image_generator");

	// Fetch presets from Convex
	const presets = useQuery(api.imageModels.listActivePresets);
	const isLoading = presets === undefined;

	// Check if a preset matches current state
	const isPresetActive = (
		schemaId: string,
		presetParams: Record<string, unknown>,
	): boolean => {
		if (currentSchemaId !== schemaId) return false;
		if (!currentParams) return false;

		// Check if all preset params match current params
		return Object.entries(presetParams).every(
			([key, value]) => currentParams[key] === value,
		);
	};

	// Loading skeleton - 44px height to match pills
	if (isLoading) {
		return (
			<div className={cn("flex items-center gap-2", className)}>
				{[0, 1, 2, 3].map((i) => (
					<Skeleton key={i} className="h-11 w-20 rounded-lg" />
				))}
			</div>
		);
	}

	// No presets configured
	if (!presets || presets.length === 0) {
		return null;
	}

	return (
		<div className={cn("flex flex-wrap items-center gap-2", className)}>
			<span className="text-xs text-muted-foreground mr-1">
				{t("quick_settings")}
			</span>
			{presets.map((preset) => {
				const name = preset.nameTranslationKey
					? t(preset.nameTranslationKey, { fallback: preset.name })
					: preset.name;

				const isActive = isPresetActive(
					preset.schemaId,
					preset.params as Record<string, unknown>,
				);

				return (
					<PillButton
						key={preset.key}
						size="sm"
						isActive={isActive}
						disabled={disabled}
						onClick={() =>
							onSelectPreset(
								preset.schemaId,
								preset.params as Record<string, unknown>,
							)
						}
						aria-label={name}
						title={
							preset.descriptionTranslationKey
								? t(preset.descriptionTranslationKey, {
										fallback: preset.description ?? "",
									})
								: preset.description
						}
					>
						{preset.icon && <span className="text-sm">{preset.icon}</span>}
						<span>{name}</span>
					</PillButton>
				);
			})}
		</div>
	);
}
