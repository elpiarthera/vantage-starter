"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SceneData } from "./types/schema";

interface FloatingGenerateBarProps {
	scenes: SceneData[];
	onGenerateAll: () => void;
	isGenerating?: boolean;
	hasEnoughCredits: boolean;
	totalCredits: number;
}

export function FloatingGenerateBar({
	scenes,
	onGenerateAll,
	isGenerating = false,
	hasEnoughCredits,
	totalCredits,
}: FloatingGenerateBarProps) {
	const t = useTranslations("storyboard");

	const doneCount = scenes.filter((s) => s.status === "complete").length;
	const total = scenes.length;
	const hasPending = scenes.some(
		(s) => s.status === "idle" || s.status === "error",
	);

	return (
		<div className="fixed bottom-6 left-1/2 z-40 w-[90%] max-w-3xl -translate-x-1/2 pb-[env(safe-area-inset-bottom)] backdrop-blur-md bg-background/60 border border-border/50 shadow-lg rounded-xl px-4 py-3">
			{/* Mobile scene dot navigation */}
			{total > 0 && (
				<div className="mb-2 flex justify-center gap-1.5 md:hidden">
					{scenes.map((scene, i) => (
						<span
							key={scene.id}
							role="img"
							className={cn(
								"size-1.5 rounded-full transition-colors",
								scene.status === "complete"
									? "bg-success"
									: scene.status === "generating"
										? "bg-primary animate-pulse"
										: scene.status === "error"
											? "bg-destructive"
											: "bg-muted-foreground/40",
							)}
							aria-label={t("scene_label", { number: i + 1 })}
						/>
					))}
				</div>
			)}

			<div className="flex items-center justify-between gap-4">
				{/* Progress */}
				<div className="flex-1 min-w-0">
					{total > 0 ? (
						<p className="text-sm text-muted-foreground truncate">
							{t("n_of_n_complete", { done: doneCount, total })}
						</p>
					) : (
						<p className="text-sm text-muted-foreground">{t("add_scene")}</p>
					)}
					{totalCredits > 0 && (
						<p className="text-xs text-muted-foreground/60">
							{totalCredits} credits
						</p>
					)}
				</div>

				{/* Generate All */}
				<Button
					type="button"
					onClick={onGenerateAll}
					disabled={
						isGenerating || !hasPending || !hasEnoughCredits || total === 0
					}
					className="min-h-[44px] shrink-0"
				>
					{isGenerating ? t("generating") : t("generate_all")}
				</Button>
			</div>
		</div>
	);
}
