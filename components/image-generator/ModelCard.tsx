"use client";

import {
	ImageIcon,
	Layers,
	Maximize2,
	Palette,
	Sparkles,
	Square,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { badgeVariants, getBadgeVariant } from "@/components/ui/badge-variants";
import { useCreditCost } from "@/hooks/business-logic/useCredits";
import { cn } from "@/lib/utils";
import type { ModelCapabilities, ModelSchema } from "./types/schema";

interface ModelCardProps {
	schema: ModelSchema;
	/** Credits cost from Convex creditCosts (optional). */
	creditCost?: number;
	selected?: boolean;
	onSelect: () => void;
	className?: string;
}

function CapabilityIcons({ caps }: { caps: ModelCapabilities }) {
	const t = useTranslations("image_generator");
	const items: { key: string; label: string; show: boolean }[] = [
		{ key: "4k", label: t("capability_4k"), show: caps.maxResolution === "4K" },
		{ key: "2k", label: t("capability_2k"), show: caps.maxResolution === "2K" },
		{
			key: "neg",
			label: t("capability_negative_prompt"),
			show: !!caps.negativePrompt,
		},
		{
			key: "series",
			label: t("capability_series"),
			show: !!caps.resultTypeSeries,
		},
		{
			key: "multi",
			label: t("capability_multi_ref"),
			show: !!caps.multiImage,
		},
		{
			key: "elements",
			label: t("capability_elements"),
			show: !!caps.elements,
		},
		{
			key: "auto",
			label: t("capability_auto_aspect"),
			show: !!caps.aspectAuto,
		},
	];
	const visible = items.filter((i) => i.show);
	if (visible.length === 0) return null;
	return (
		<div
			className="flex flex-wrap items-center gap-1.5"
			title={visible.map((i) => i.label).join(", ")}
		>
			{caps.maxResolution === "4K" && (
				<Maximize2 className="size-3.5 text-muted-foreground" aria-hidden />
			)}
			{caps.negativePrompt && (
				<Square className="size-3.5 text-muted-foreground" aria-hidden />
			)}
			{caps.resultTypeSeries && (
				<Layers className="size-3.5 text-muted-foreground" aria-hidden />
			)}
			{caps.multiImage && (
				<ImageIcon className="size-3.5 text-muted-foreground" aria-hidden />
			)}
			{caps.elements && (
				<Palette className="size-3.5 text-muted-foreground" aria-hidden />
			)}
			{caps.aspectAuto && (
				<Sparkles className="size-3.5 text-muted-foreground" aria-hidden />
			)}
		</div>
	);
}

export function ModelCard({
	schema,
	creditCost,
	selected,
	onSelect,
	className,
}: ModelCardProps) {
	const t = useTranslations("image_generator");
	const { cost: hookCost } = useCreditCost(schema.creditActionType);
	const displayCost = hookCost?.credits ?? creditCost;
	return (
		<button
			type="button"
			onClick={onSelect}
			className={cn(
				"flex flex-col rounded-lg border bg-card text-left transition-smooth hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 active:scale-95",
				selected && "border-primary ring-2 ring-primary/20",
				className,
			)}
			aria-pressed={selected}
			aria-label={schema.name}
		>
			{/* Thumbnail placeholder (schema has no thumbnail URL) */}
			<div className="flex aspect-video w-full items-center justify-center rounded-t-lg bg-muted/60">
				<ImageIcon className="size-10 text-muted-foreground" aria-hidden />
			</div>
			<div className="flex flex-1 flex-col gap-1.5 p-3">
				{schema.badges && schema.badges.length > 0 && (
					<div className="flex flex-wrap items-center gap-1.5">
						{schema.badges.map((badge) => (
							<span
								key={badge}
								className={badgeVariants({ variant: getBadgeVariant(badge) })}
							>
								{badge}
							</span>
						))}
					</div>
				)}
				<div className="flex items-start justify-between gap-1">
					<h3 className="line-clamp-2 text-sm font-medium leading-relaxed">
						{schema.nameTranslationKey
							? t(
									schema.nameTranslationKey.replace(
										"image_generator.",
										"",
									) as Parameters<typeof t>[0],
									{ fallback: schema.name },
								)
							: schema.name}
					</h3>
					{displayCost !== undefined && displayCost > 0 && (
						<span className="shrink-0 text-xs text-muted-foreground">
							{displayCost}c
						</span>
					)}
				</div>
				<CapabilityIcons caps={schema.capabilities} />
			</div>
		</button>
	);
}
