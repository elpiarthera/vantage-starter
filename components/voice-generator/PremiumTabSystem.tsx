"use client";

import { Mic, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDevice } from "@/contexts/DeviceContext";

export interface PremiumTabSystemProps {
	mode: "generate" | "record";
	setMode: (mode: "generate" | "record") => void;
	/** Display name of the currently selected model. */
	selectedModelName?: string;
	/** Opens the model selector modal. */
	onModelSelectorOpen?: () => void;
	/** Whether to show the model selector button. Default: true. */
	showModelSelector?: boolean;
}

/** Premium floating glassmorphic tab bar for Generate | Record with model selector trigger. */
export function PremiumTabSystem({
	mode,
	setMode,
	selectedModelName,
	onModelSelectorOpen,
	showModelSelector = true,
}: PremiumTabSystemProps) {
	const t = useTranslations("voice_generator");
	const { isMobile, orientation } = useDevice();
	const isLandscapeMobile = isMobile && orientation === "landscape";
	const shouldShowModelButton =
		showModelSelector && onModelSelectorOpen && !isLandscapeMobile;

	return (
		<div className="fixed left-1/2 top-14 z-40 -translate-x-1/2 sm:top-[4.5rem] md:top-24">
			<div className="flex w-max max-w-[calc(100vw-2rem)] items-center gap-3 rounded-xl border border-border/50 bg-background/60 p-1 shadow-lg backdrop-blur-md">
				<Tabs
					value={mode}
					onValueChange={(v) => setMode(v as "generate" | "record")}
				>
					<TabsList
						className="bg-transparent"
						aria-label={t("tabs_aria_label")}
					>
						<TabsTrigger
							value="generate"
							aria-label={isLandscapeMobile ? t("tab_generate") : undefined}
							className="min-h-[44px] rounded-lg px-3 py-2 transition-smooth active:scale-95 sm:px-4 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:ring-1 data-[state=active]:ring-primary/50"
						>
							{isLandscapeMobile ? (
								<Sparkles className="size-4" aria-hidden />
							) : (
								t("tab_generate")
							)}
						</TabsTrigger>
						<TabsTrigger
							value="record"
							aria-label={isLandscapeMobile ? t("tab_record") : undefined}
							className="min-h-[44px] rounded-lg px-3 py-2 transition-smooth active:scale-95 sm:px-4 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:ring-1 data-[state=active]:ring-primary/50"
						>
							{isLandscapeMobile ? (
								<Mic className="size-4" aria-hidden />
							) : (
								t("tab_record")
							)}
						</TabsTrigger>
					</TabsList>
				</Tabs>

				{shouldShowModelButton && (
					<Button
						variant="outline"
						size="sm"
						onClick={onModelSelectorOpen}
						className="min-h-[44px] min-w-0 max-w-[min(140px,50vw)] rounded-lg border-border/50 bg-background/40 transition-smooth active:scale-95 sm:max-w-none"
					>
						<span className="max-w-[120px] truncate sm:max-w-none">
							{selectedModelName ?? t("select_model_first")}
						</span>
					</Button>
				)}
			</div>
		</div>
	);
}
