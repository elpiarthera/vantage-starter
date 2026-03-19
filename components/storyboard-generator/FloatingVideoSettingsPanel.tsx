"use client";

import { SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AdaptiveModal } from "@/components/adaptive/AdaptiveModal";
import { DynamicField } from "@/components/image-generator/DynamicField";
import type { ParamSchema } from "@/components/image-generator/types/schema";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useDevice } from "@/contexts/DeviceContext";
import { cn } from "@/lib/utils";
import type { VideoModelSchema } from "./types/schema";

interface FloatingVideoSettingsPanelProps {
	schema: VideoModelSchema | null;
	params: Record<string, unknown>;
	onParamsChange: (params: Record<string, unknown>) => void;
	selectedTier: string;
	onTierChange: (tier: string) => void;
	disabled?: boolean;
}

/**
 * Evaluates showWhen condition — return true if param should be rendered.
 * Mirrors VoiceSettingsPanel.tsx shouldShowParam exactly.
 */
function shouldShowParam(
	param: { showWhen?: { param: string; value: string | boolean } },
	currentParams: Record<string, unknown>,
): boolean {
	if (!param.showWhen) return true;
	const dependencyValue = currentParams[param.showWhen.param];
	if (param.showWhen.value === "!empty" || param.showWhen.value === "") {
		return !!dependencyValue && dependencyValue !== "";
	}
	return dependencyValue === param.showWhen.value;
}

interface CreditTierSelectorProps {
	tiers: VideoModelSchema["creditTiers"];
	selectedTier: string;
	onSelect: (tier: string) => void;
}

function CreditTierSelector({
	tiers,
	selectedTier,
	onSelect,
}: CreditTierSelectorProps) {
	const t = useTranslations("video_generator");
	if (tiers.length <= 1) return null;

	return (
		<div className="space-y-2">
			<span className="block text-sm font-medium text-muted-foreground">
				{t("audio_mode_label" as never)}
			</span>
			<div className="flex gap-2">
				{tiers.map((tier) => (
					<button
						key={tier.tier}
						type="button"
						onClick={() => onSelect(tier.tier)}
						className={cn(
							"flex-1 rounded-lg border px-3 py-2 text-sm min-h-[44px] transition-smooth",
							selectedTier === tier.tier
								? "border-primary bg-primary/10 text-foreground"
								: "border-border bg-transparent text-muted-foreground hover:bg-muted/50",
						)}
					>
						{t(tier.labelKey.replace("video_generator.", "") as never)}
					</button>
				))}
			</div>
		</div>
	);
}

export function FloatingVideoSettingsPanel({
	schema,
	params,
	onParamsChange,
	selectedTier,
	onTierChange,
	disabled,
}: FloatingVideoSettingsPanelProps) {
	const t = useTranslations("storyboard");
	const { isMobile, orientation } = useDevice();
	const [collapsed, setCollapsed] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);

	if (!schema) return null;

	const globalParams = schema.params.filter((p) => p.scope === "global");

	const renderSettings = () => (
		<div className="space-y-4">
			<CreditTierSelector
				tiers={schema.creditTiers}
				selectedTier={selectedTier}
				onSelect={onTierChange}
			/>
			{globalParams.map((p) =>
				shouldShowParam(p, params) ? (
					<DynamicField
						key={p.key}
						param={p as unknown as ParamSchema}
						value={params[p.key]}
						onChange={(v) => onParamsChange({ ...params, [p.key]: v })}
						disabled={disabled}
						translationNamespace="video_generator"
					/>
				) : null,
			)}
		</div>
	);

	/* ── Mobile: Floating trigger + Drawer via AdaptiveModal ── */
	if (isMobile) {
		return (
			<>
				<Button
					variant="ghost"
					size="icon"
					onClick={() => setMobileOpen(true)}
					className="fixed bottom-28 right-4 z-30 min-h-[44px] min-w-[44px] rounded-xl border border-border/50 bg-background/60 shadow-lg backdrop-blur-md transition-smooth active:scale-95 mb-[env(safe-area-inset-bottom)]"
					aria-label={t("global_settings")}
				>
					<SlidersHorizontal className="size-5" />
				</Button>

				<AdaptiveModal
					isOpen={mobileOpen}
					onClose={() => setMobileOpen(false)}
					title={t("global_settings")}
				>
					<div
						className={`${
							orientation === "landscape" ? "max-h-[80vh]" : "max-h-[60vh]"
						} overflow-y-auto px-1`}
					>
						{renderSettings()}
					</div>
				</AdaptiveModal>
			</>
		);
	}

	/* ── Desktop: Floating side panel (right) with collapse ── */
	return (
		<div className="fixed right-6 top-24 z-30 hidden w-80 md:block">
			<Collapsible
				open={!collapsed}
				onOpenChange={(open) => setCollapsed(!open)}
			>
				<div className="overflow-hidden rounded-xl border border-border/50 bg-background/60 shadow-lg backdrop-blur-md">
					<div className="flex items-center justify-between border-b border-border/30 px-4 py-3">
						<span className="text-sm font-medium tracking-tight text-foreground">
							{t("global_settings")}
						</span>
						<CollapsibleTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className="min-h-[44px] px-3 text-sm text-muted-foreground transition-smooth hover:text-foreground active:scale-95"
							>
								{collapsed ? "Expand" : "Collapse"}
							</Button>
						</CollapsibleTrigger>
					</div>
					<CollapsibleContent>
						<div className="max-h-[calc(100vh-200px)] overflow-y-auto p-4 space-y-4">
							{renderSettings()}
						</div>
					</CollapsibleContent>
				</div>
			</Collapsible>
		</div>
	);
}
