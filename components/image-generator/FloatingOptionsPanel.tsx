"use client";

import { SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { useState } from "react";
import { AdaptiveModal } from "@/components/adaptive/AdaptiveModal";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useDevice } from "@/contexts/DeviceContext";
import { OptionsPanel } from "./OptionsPanel";
import type { ModelSchema } from "./types/schema";

interface FloatingOptionsPanelProps {
	schema: ModelSchema;
	params: Record<string, unknown>;
	onParamsChange: (key: string, value: unknown) => void;
	/** Optional: aspect ratio options with React icons. */
	aspectOptionIcons?: Record<string, React.ReactNode>;
	disabled?: boolean;
	/**
	 * Sprint 30e.2: When true, only shows advanced params (primary params are in pills).
	 * Default: true
	 */
	advancedOnly?: boolean;
	/**
	 * Current mode — used on touch to vertically stack Options above History in Edit mode
	 * (Edit mode: Refs=left, History=right, Options must be stacked above History).
	 */
	mode?: "generate" | "edit";
}

export function FloatingOptionsPanel({
	schema,
	params,
	onParamsChange,
	aspectOptionIcons,
	disabled,
	advancedOnly = true,
	mode = "generate",
}: FloatingOptionsPanelProps) {
	const t = useTranslations("image_generator");
	const { isMobile, isTablet, orientation } = useDevice();
	const isTouchDevice = isMobile || isTablet;
	const [collapsed, setCollapsed] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);
	const isLandscape = orientation === "landscape";

	// Sprint 30e.2: Use "Advanced Options" title when advancedOnly
	const panelTitle = advancedOnly
		? t("advanced_options_title")
		: t("options_panel_title");

	/* ── Tablet/Mobile: Floating trigger + Drawer via AdaptiveModal ── */
	if (isTouchDevice) {
		// In Edit mode: Refs=left, History=right at base offset, Options stacked above History.
		const optionsBottom =
			mode === "edit"
				? "calc(var(--ig-mobile-button-offset, 140px) + 3.5rem)"
				: "var(--ig-mobile-button-offset, 140px)";

		return (
			<>
				<Button
					variant="ghost"
					size="icon"
					onClick={() => setMobileOpen(true)}
					className="fixed right-4 z-30 min-h-[44px] min-w-[44px] rounded-xl backdrop-blur-md bg-background/60 border border-border/50 shadow-lg active:scale-95 transition-smooth"
					style={{ bottom: optionsBottom }}
					aria-label={panelTitle}
				>
					<SlidersHorizontal className="size-5" aria-hidden="true" />
				</Button>

				<AdaptiveModal
					isOpen={mobileOpen}
					onClose={() => setMobileOpen(false)}
					title={panelTitle}
				>
					<div
						className={`${isLandscape ? "max-h-[80vh]" : "max-h-[60vh]"} overflow-y-auto px-1`}
					>
						<OptionsPanel
							schema={schema}
							params={params}
							onParamsChange={onParamsChange}
							aspectOptionIcons={aspectOptionIcons}
							disabled={disabled}
							advancedOnly={advancedOnly}
						/>
					</div>
				</AdaptiveModal>
			</>
		);
	}

	/* ── Desktop: Floating side panel (right) with collapse ── */
	return (
		<div className="hidden lg:block fixed top-24 right-6 w-80 z-30">
			<Collapsible
				open={!collapsed}
				onOpenChange={(open) => setCollapsed(!open)}
			>
				<div className="rounded-xl backdrop-blur-md bg-background/60 border border-border/50 shadow-lg overflow-hidden">
					{/* Header with collapse toggle */}
					<div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
						<span className="text-sm font-medium tracking-tight text-foreground">
							{panelTitle}
						</span>
						<CollapsibleTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className="min-h-[44px] px-3 text-sm text-muted-foreground hover:text-foreground active:scale-95 transition-smooth"
							>
								{collapsed
									? t("options_panel_expand")
									: t("options_panel_collapse")}
							</Button>
						</CollapsibleTrigger>
					</div>

					{/* Collapsible content */}
					<CollapsibleContent>
						<div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
							<OptionsPanel
								schema={schema}
								params={params}
								onParamsChange={onParamsChange}
								aspectOptionIcons={aspectOptionIcons}
								disabled={disabled}
								advancedOnly={advancedOnly}
							/>
						</div>
					</CollapsibleContent>
				</div>
			</Collapsible>
		</div>
	);
}
