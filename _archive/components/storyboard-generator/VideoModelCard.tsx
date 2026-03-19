"use client";

import { Film } from "lucide-react";
import { useTranslations } from "next-intl";
import { badgeVariants, getBadgeVariant } from "@/components/ui/badge-variants";
import { cn } from "@/lib/utils";
import type { VideoModelSchema, VideoModelType } from "./types/schema";

interface VideoModelCardProps {
	schema: VideoModelSchema;
	/** Base credit cost for the default tier at 5s. */
	creditCost?: number;
	selected?: boolean;
	onSelect: () => void;
	className?: string;
}

const TYPE_GROUP_KEY: Record<VideoModelType, string> = {
	i2v: "group_i2v",
	r2v: "group_r2v",
	v2v: "group_v2v",
};

export function VideoModelCard({
	schema,
	creditCost,
	selected,
	onSelect,
	className,
}: VideoModelCardProps) {
	const tModels = useTranslations("video_models");

	const allChips: string[] = [
		schema.capabilities.audioGeneration ? tModels("chip_audio") : null,
		schema.capabilities.voiceIds ? tModels("chip_voice_ctrl") : null,
		schema.capabilities.supportsEndImage ? tModels("chip_end_frame") : null,
		schema.capabilities.supportsStyleImages ? tModels("chip_style_refs") : null,
		schema.capabilities.supportsElements ? tModels("chip_elements") : null,
		schema.capabilities.multiShot ? tModels("chip_multi_shot") : null,
		schema.capabilities.supportsDuration
			? tModels("chip_duration_range")
			: null,
	].filter((c): c is string => c !== null);

	const visible = allChips.slice(0, 4);
	const overflow = allChips.length - visible.length;

	return (
		<button
			type="button"
			onClick={onSelect}
			className={cn(
				"flex flex-col rounded-lg border bg-card text-left transition-smooth",
				"hover:bg-muted/50 active:scale-95",
				"focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
				"min-h-[44px]",
				selected && "border-primary ring-2 ring-primary/20",
				className,
			)}
			aria-pressed={selected ?? false}
		>
			{/* Thumbnail */}
			<div className="flex aspect-[3/2] md:aspect-video w-full items-center justify-center rounded-t-lg bg-muted/60">
				<Film
					className="size-8 md:size-10 text-muted-foreground"
					aria-hidden="true"
				/>
			</div>

			<div className="flex flex-1 flex-col gap-2 p-3 md:p-4">
				{/* Type badge + quality badges */}
				<div className="flex flex-wrap items-center gap-1.5">
					<span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
						{tModels(TYPE_GROUP_KEY[schema.type] as never)}
					</span>
					{schema.badges?.map((badge) => (
						<span
							key={badge}
							className={cn(
								badgeVariants({ variant: getBadgeVariant(badge) }),
								"text-[10px] xs:text-xs",
							)}
						>
							{badge}
						</span>
					))}
				</div>

				{/* Model name */}
				<h3 className="line-clamp-2 text-xs sm:text-sm font-medium leading-relaxed">
					{schema.nameTranslationKey
						? tModels(
								schema.nameTranslationKey.replace("video_models.", "") as never,
							)
						: schema.name}
				</h3>

				{/* Credit cost */}
				{creditCost !== undefined && creditCost > 0 && (
					<p className="text-xs text-muted-foreground">{creditCost} credits</p>
				)}

				{/* Capability chips */}
				{allChips.length > 0 && (
					<div className="flex flex-wrap gap-1">
						{visible.map((chip) => (
							<span
								key={chip}
								className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground"
							>
								{chip}
							</span>
						))}
						{overflow > 0 && (
							<span className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground">
								+{overflow}
							</span>
						)}
					</div>
				)}
			</div>
		</button>
	);
}
