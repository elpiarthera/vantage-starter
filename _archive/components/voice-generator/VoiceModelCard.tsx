"use client";

import { Mic } from "lucide-react";
import { useTranslations } from "next-intl";
import { badgeVariants, getBadgeVariant } from "@/components/ui/badge-variants";
import { cn } from "@/lib/utils";
import type { VoiceModelSchema } from "./hooks/use-convex-voice-schemas";

interface VoiceModelCardProps {
	schema: VoiceModelSchema;
	creditCost?: number;
	selected?: boolean;
	onSelect: () => void;
	className?: string;
}

/** Map raw DB badge strings (e.g. "HD", "VOICE CLONING") to voice_generator translation keys */
function badgeToTranslationKey(badge: string): string {
	const map: Record<string, string> = {
		HD: "badge_hd",
		FAST: "badge_fast",
		TURBO: "badge_turbo",
		PRO: "badge_pro",
		MULTILINGUAL: "badge_multilingual",
		"COST EFFECTIVE": "badge_cost_effective",
		"COST-EFFECTIVE": "badge_cost_effective",
		"VOICE CLONING": "badge_voice_cloning",
		"CUSTOM VOICE": "badge_custom_voice",
	};
	return (
		map[badge.toUpperCase()] ?? badge.toLowerCase().replace(/[\s-]+/g, "_")
	);
}

export function VoiceModelCard({
	schema,
	creditCost,
	selected,
	onSelect,
	className,
}: VoiceModelCardProps) {
	const t = useTranslations("voice_generator");
	const tModels = useTranslations("voice_models");

	const displayName = schema.nameTranslationKey
		? tModels(schema.nameTranslationKey.replace("voice_models.", "") as never)
		: schema.name;

	return (
		<button
			type="button"
			onClick={onSelect}
			aria-label={displayName}
			className={cn(
				"flex flex-col rounded-lg border bg-card text-left transition-smooth hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-95 min-h-[44px] min-w-[44px]",
				selected && "border-primary ring-2 ring-primary/20",
				className,
			)}
			aria-pressed={selected ?? false}
		>
			{/* Icon placeholder */}
			<div className="flex aspect-[3/2] md:aspect-video w-full items-center justify-center rounded-t-lg bg-muted/60">
				<Mic
					className="size-8 md:size-10 text-muted-foreground"
					aria-hidden="true"
				/>
			</div>

			<div className="flex flex-1 flex-col gap-2 p-3 md:p-4">
				{/* Badges */}
				{schema.badges && schema.badges.length > 0 && (
					<div className="flex flex-wrap items-center gap-1.5">
						{schema.badges.map((badge) => (
							<span
								key={badge}
								className={cn(
									badgeVariants({ variant: getBadgeVariant(badge) }),
									"text-[10px] xs:text-xs",
								)}
							>
								{t(badgeToTranslationKey(badge) as never)}
							</span>
						))}
					</div>
				)}

				{/* Model Name */}
				<h3 className="line-clamp-2 text-xs sm:text-sm font-medium leading-relaxed">
					{displayName}
				</h3>

				{/* Credit Cost */}
				{creditCost !== undefined && creditCost > 0 && (
					<p className="text-xs text-muted-foreground">
						{t("credit_count", { count: creditCost })}
					</p>
				)}

				{/* Capabilities */}
				{(() => {
					const allChips: string[] = [
						schema.capabilities.emotionControl
							? t("capability_emotion_control")
							: null,
						schema.capabilities.voiceCloning
							? t("capability_voice_cloning")
							: null,
						schema.capabilities.multiLanguage
							? t("capability_multi_language")
							: null,
						schema.capabilities.pitchControl
							? t("capability_pitch_control")
							: null,
						schema.capabilities.speedControl
							? t("capability_speed_control")
							: null,
						schema.capabilities.volumeControl
							? t("capability_volume_control")
							: null,
						schema.capabilities.voiceModification
							? t("capability_voice_modification")
							: null,
						schema.capabilities.highQualityAudio
							? t("capability_high_quality_audio")
							: null,
						schema.capabilities.interjections
							? t("capability_interjections")
							: null,
						schema.capabilities.pauseControl
							? t("capability_pause_control")
							: null,
						schema.capabilities.stylePrompts
							? t("capability_style_prompts")
							: null,
						schema.capabilities.advancedSampling
							? t("capability_advanced_sampling")
							: null,
					].filter((c): c is string => c !== null);

					if (allChips.length === 0) return null;

					const visible = allChips.slice(0, 4);
					const overflow = allChips.length - visible.length;

					return (
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
					);
				})()}
			</div>
		</button>
	);
}
