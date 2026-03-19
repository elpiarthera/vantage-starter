"use client";

import { Pencil, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDevice } from "@/contexts/DeviceContext";

export interface PremiumTabSystemProps {
	mode: "generate" | "edit";
	setMode: (mode: "generate" | "edit") => void;
	/** Display name of the currently selected model. */
	selectedModelName?: string;
	/** Opens the ModelSelector modal. */
	onModelSelectorOpen?: () => void;
	/**
	 * Sprint 30e.7: Whether to show the model selector button.
	 * Set to false when model selection is handled elsewhere (e.g., inline pills).
	 * Default: true for backward compatibility.
	 */
	showModelSelector?: boolean;
}

/** Premium floating glassmorphic tab bar for Generate | Edit with model selector trigger. */
export function PremiumTabSystem({
	mode,
	setMode,
	selectedModelName,
	onModelSelectorOpen,
	showModelSelector = true,
}: PremiumTabSystemProps) {
	const t = useTranslations("image_generator");
	const { isMobile, orientation } = useDevice();
	const isLandscapeMobile = isMobile && orientation === "landscape";

	// Sprint 30e.7: Only show model button if enabled and not in landscape mobile
	const shouldShowModelButton =
		showModelSelector && onModelSelectorOpen && !isLandscapeMobile;

	return (
		<div className="fixed left-1/2 -translate-x-1/2 top-16 sm:top-20 md:top-24 z-40">
			<div className="flex items-center gap-3 rounded-xl backdrop-blur-md bg-background/60 border border-border/50 shadow-lg p-1 max-w-[calc(100vw-2rem)] w-max">
				<Tabs
					value={mode}
					onValueChange={(v) => setMode(v as "generate" | "edit")}
				>
					<TabsList
						className="bg-transparent"
						aria-label={t("tabs_aria_label")}
					>
						<TabsTrigger
							value="generate"
							className="min-h-[44px] px-3 py-2 sm:px-4 rounded-lg transition-smooth active:scale-95
								data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:ring-1 data-[state=active]:ring-primary/50"
						>
							{isLandscapeMobile ? (
								<>
									<Sparkles className="size-4" aria-hidden />
									<span className="sr-only">{t("tab_generate")}</span>
								</>
							) : (
								t("tab_generate")
							)}
						</TabsTrigger>
						<TabsTrigger
							value="edit"
							className="min-h-[44px] px-3 py-2 sm:px-4 rounded-lg transition-smooth active:scale-95
								data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:ring-1 data-[state=active]:ring-primary/50"
						>
							{isLandscapeMobile ? (
								<>
									<Pencil className="size-4" aria-hidden />
									<span className="sr-only">{t("tab_edit")}</span>
								</>
							) : (
								t("tab_edit")
							)}
						</TabsTrigger>
					</TabsList>
				</Tabs>

				{/* Model Selector Trigger — Sprint 30e.7: Compact pill, hidden when pills handle it */}
				{shouldShowModelButton && (
					<Button
						variant="outline"
						size="sm"
						onClick={onModelSelectorOpen}
						className="min-h-[44px] min-w-0 max-w-[min(140px,50vw)] sm:max-w-none rounded-lg border-border/50 bg-background/40 active:scale-95 transition-smooth"
					>
						<span className="truncate max-w-[120px] sm:max-w-none">
							{selectedModelName ? selectedModelName.split(" — ")[0] : "..."}
						</span>
					</Button>
				)}
			</div>
		</div>
	);
}
