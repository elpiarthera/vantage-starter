"use client";

import { Film } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { VideoModelSchema } from "./types/schema";

interface StoryboardTopBarProps {
	selectedSchema: VideoModelSchema | null;
	onModelOpen: () => void;
	sceneCount: number;
}

export function StoryboardTopBar({
	selectedSchema,
	onModelOpen,
	sceneCount,
}: StoryboardTopBarProps) {
	const t = useTranslations("storyboard");
	const tModels = useTranslations("video_models");

	const modelName = selectedSchema
		? selectedSchema.nameTranslationKey
			? tModels(
					selectedSchema.nameTranslationKey.replace(
						"video_models.",
						"",
					) as never,
				)
			: selectedSchema.name
		: t("model_selector");

	return (
		<div className="fixed left-1/2 top-16 z-40 -translate-x-1/2 glass-panel px-4 py-2 flex items-center gap-3">
			<Film
				className="size-4 text-muted-foreground shrink-0"
				aria-hidden="true"
			/>
			<span className="text-sm font-medium text-foreground">Storyboard</span>

			{sceneCount > 0 && (
				<span className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
					{t("scenes_count", { count: sceneCount })}
				</span>
			)}

			<Button
				type="button"
				variant="ghost"
				size="sm"
				onClick={onModelOpen}
				className="min-h-[44px] rounded-lg border border-border/50 px-3 text-xs font-medium text-foreground transition-smooth hover:bg-muted/50 active:scale-95"
			>
				{modelName}
			</Button>
		</div>
	);
}
