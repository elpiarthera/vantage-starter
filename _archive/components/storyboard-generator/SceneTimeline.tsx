"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { SceneCard } from "./SceneCard";
import type { SceneData, VideoModelSchema } from "./types/schema";

interface SceneTimelineProps {
	scenes: SceneData[];
	selectedSchema: VideoModelSchema | null;
	onSceneUpdate: (id: string, patch: Partial<SceneData>) => void;
	onSceneGenerate: (id: string) => void;
	onSceneRemove: (id: string) => void;
	onAddScene: () => void;
	disabled?: boolean;
}

export function SceneTimeline({
	scenes,
	selectedSchema,
	onSceneUpdate,
	onSceneGenerate,
	onSceneRemove,
	onAddScene,
	disabled,
}: SceneTimelineProps) {
	const t = useTranslations("storyboard");

	if (scenes.length === 0) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="flex flex-col items-center gap-4 text-center">
					<div className="flex size-16 items-center justify-center rounded-2xl bg-muted/40">
						<Plus
							className="size-8 text-muted-foreground/60"
							aria-hidden="true"
						/>
					</div>
					<div className="space-y-1">
						<p className="text-sm font-medium text-foreground">
							{t("add_scene")}
						</p>
						<p className="text-xs text-muted-foreground">
							{t("scenes_count", { count: 0 })}
						</p>
					</div>
					<Button type="button" onClick={onAddScene} className="min-h-[44px]">
						{t("add_scene")}
					</Button>
				</div>
			</div>
		);
	}

	return (
		<ScrollArea className="absolute inset-0">
			<div
				className={cn(
					"flex gap-4 px-4 pb-24 pt-28",
					"snap-x snap-mandatory",
					"md:snap-none md:flex-wrap md:gap-6 md:px-6",
				)}
			>
				{scenes.map((scene, i) => (
					<div
						key={scene.id}
						className="snap-start shrink-0 w-[85vw] max-w-sm md:w-[300px]"
					>
						<SceneCard
							scene={scene}
							sceneNumber={i + 1}
							schema={selectedSchema}
							onUpdate={onSceneUpdate}
							onGenerate={onSceneGenerate}
							onRemove={onSceneRemove}
							disabled={disabled}
						/>
					</div>
				))}

				{/* Add scene button */}
				<div className="snap-start shrink-0 w-[85vw] max-w-sm md:w-[300px] flex items-start pt-2">
					<Button
						type="button"
						variant="ghost"
						onClick={onAddScene}
						disabled={disabled}
						className="min-h-[44px] w-full rounded-xl border border-dashed border-border/50 text-muted-foreground transition-smooth hover:border-border hover:bg-muted/30"
					>
						<Plus className="mr-2 size-4" />
						{t("add_scene")}
					</Button>
				</div>
			</div>
			<ScrollBar orientation="horizontal" className="md:hidden" />
		</ScrollArea>
	);
}
