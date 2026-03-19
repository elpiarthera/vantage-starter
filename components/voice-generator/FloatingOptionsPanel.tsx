"use client";

import { SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AdaptiveModal } from "@/components/adaptive/AdaptiveModal";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useDevice } from "@/contexts/DeviceContext";
import { cn } from "@/lib/utils";
import type { VoiceModelSchema } from "./hooks/use-convex-voice-schemas";
import { VoiceSettingsPanel } from "./VoiceSettingsPanel";

interface FloatingOptionsPanelProps {
	schema: VoiceModelSchema;
	params: Record<string, unknown>;
	onParamsChange: (params: Record<string, unknown>) => void;
	disabled?: boolean;
}

export function FloatingOptionsPanel({
	schema,
	params,
	onParamsChange,
	disabled,
}: FloatingOptionsPanelProps) {
	const t = useTranslations("voice_generator");
	const { isMobile, orientation } = useDevice();
	const [collapsed, setCollapsed] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);

	/* ── Mobile: Floating trigger + Drawer via AdaptiveModal ── */
	if (isMobile) {
		return (
			<>
				<Button
					variant="ghost"
					size="icon"
					onClick={() => setMobileOpen(true)}
					className="fixed bottom-[calc(7rem+env(safe-area-inset-bottom))] right-4 z-30 min-h-[44px] min-w-[44px] rounded-xl border border-border/50 bg-background/60 shadow-lg backdrop-blur-md transition-smooth active:scale-95"
					aria-label={t("options_trigger_aria")}
				>
					<SlidersHorizontal className="size-5" />
				</Button>

				<AdaptiveModal
					isOpen={mobileOpen}
					onClose={() => setMobileOpen(false)}
					title={t("options_panel_title")}
				>
					<div
						className={cn(
							"overflow-y-auto px-1",
							orientation === "landscape" ? "max-h-[80vh]" : "max-h-[60vh]",
						)}
					>
						<VoiceSettingsPanel
							schema={schema}
							params={params}
							onParamsChange={onParamsChange}
							disabled={disabled}
							hidePrompt
						/>
					</div>
				</AdaptiveModal>
			</>
		);
	}

	/* ── Desktop: Floating side panel (right) with collapse ── */
	return (
		<div className="fixed right-6 top-28 z-30 hidden w-80 md:block">
			<Collapsible
				open={!collapsed}
				onOpenChange={(open) => setCollapsed(!open)}
			>
				<div className="overflow-hidden rounded-xl border border-border/50 bg-background/60 shadow-lg backdrop-blur-md">
					<div className="flex items-center justify-between border-b border-border/30 px-4 py-3">
						<span className="text-sm font-medium tracking-tight text-foreground">
							{t("options_panel_title")}
						</span>
						<CollapsibleTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className="min-h-[44px] px-3 text-sm text-muted-foreground transition-smooth hover:text-foreground active:scale-95"
							>
								{collapsed
									? t("options_panel_expand")
									: t("options_panel_collapse")}
							</Button>
						</CollapsibleTrigger>
					</div>
					<CollapsibleContent>
						<div className="max-h-[calc(100vh-200px)] overflow-y-auto p-4">
							<VoiceSettingsPanel
								schema={schema}
								params={params}
								onParamsChange={onParamsChange}
								disabled={disabled}
								hidePrompt
							/>
						</div>
					</CollapsibleContent>
				</div>
			</Collapsible>
		</div>
	);
}
