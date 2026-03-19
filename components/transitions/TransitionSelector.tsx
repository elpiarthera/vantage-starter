"use client";

import { useMutation, useQuery } from "convex/react";
import { Clock, Copy, Scissors, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
} from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { SceneTransitionPicker } from "./SceneTransitionPicker";

/**
 * Sprint 11 Phase 2: Transition Selector with Per-Scene Support
 *
 * Features:
 * - Hard Cut / Xfade mode toggle
 * - Per-scene transition pickers (when xfade mode)
 * - "Apply to All" bulk operation
 * - All 46 effects from Convex
 */

export type TransitionMode = "hard_cut" | "xfade";
export type XfadeTransitionType =
	| "circleopen"
	| "circleclose"
	| "fade"
	| "dissolve"
	| "wipeleft"
	| "wiperight"
	| "slideup"
	| "slidedown"
	| "slideleft"
	| "slideright"
	| "zoomin"
	| "fadeblack"
	| "fadewhite"
	| "pixelize"
	| "smoothleft"
	| "smoothright";

export interface TransitionConfig {
	mode: TransitionMode;
	xfadeType?: XfadeTransitionType;
	transitionDuration?: number;
}

interface Scene {
	_id: Id<"scenes">;
	sceneNumber: number;
	title: string;
	outgoingTransition?: {
		effectKey: string;
		duration: number;
	};
}

interface TransitionSelectorProps {
	value: TransitionConfig;
	onChange: (config: TransitionConfig) => void;
	disabled?: boolean;
	sceneCount?: number;
	// Phase 2: Per-scene support
	projectId?: Id<"projects">;
	scenes?: Scene[];
}

export function TransitionSelector({
	value,
	onChange,
	disabled = false,
	sceneCount = 3,
	projectId,
	scenes,
}: TransitionSelectorProps) {
	const t = useTranslations("transitions");
	const tStep5 = useTranslations("guided_step5");
	const tCategories = useTranslations("transition_categories");

	const transitionDuration = value.transitionDuration ?? 1.0;
	const numTransitions = sceneCount - 1;

	// State for "Apply to All" dropdown
	const [applyAllOpen, setApplyAllOpen] = useState(false);

	// Fetch all effects for "Apply to All" dropdown
	const effects = useQuery(api.transitionEffects.listActive);
	const applyTransitionToAll = useMutation(api.scenes.applyTransitionToAll);

	// Group effects by category
	const groupedEffects = effects?.reduce(
		(acc, effect) => {
			if (!acc[effect.category]) acc[effect.category] = [];
			acc[effect.category].push(effect);
			return acc;
		},
		{} as Record<
			string,
			Array<{
				key: string;
				category: string;
				defaultDuration: number;
			}>
		>,
	);

	const categoryOrder = [
		"fades",
		"wipes",
		"slides",
		"circles",
		"shapes",
		"diagonals",
		"slices",
		"effects",
		"zoom",
	];

	// Calculate video durations
	const hardCutDuration = sceneCount * 10; // 30s for 3 scenes
	const xfadeDuration = sceneCount * 10 - numTransitions * transitionDuration; // 28s for 3 scenes

	const handleModeChange = (mode: TransitionMode) => {
		onChange({
			mode,
			xfadeType:
				mode === "xfade" ? (value.xfadeType ?? "circleopen") : undefined,
			transitionDuration: mode === "xfade" ? transitionDuration : undefined,
		});
	};

	const handleApplyToAll = async (effectKey: string) => {
		if (!projectId) return;

		const effect = effects?.find((e) => e.key === effectKey);
		const duration = effect?.defaultDuration ?? 1.0;

		await applyTransitionToAll({
			projectId,
			effectKey,
			duration,
		});

		setApplyAllOpen(false);
	};

	// Scenes to show pickers for (all except the last one)
	const scenesWithTransitions = scenes?.slice(0, -1) ?? [];

	// Smooth Transitions (xfade) frozen: always show hard_cut as selected in UI (see Post-MVP-Improvement.md)
	const radioValue = value.mode === "xfade" ? "hard_cut" : value.mode;
	const smoothTransitionsEnabled = false;

	return (
		<Card className="border-border bg-card">
			<CardHeader className="p-4 md:p-6">
				<CardTitle className="flex items-center gap-2 text-lg text-foreground md:text-xl">
					<Sparkles className="h-5 w-5 text-primary" />
					{tStep5("transition_style")}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6 p-4 pt-0 md:p-6 md:pt-0">
				{/* Mode Selection - Hard cut selectable; Smooth Transitions frozen with Coming soon (COMMENT DO NOT DELETE) */}
				<RadioGroup
					value={radioValue}
					onValueChange={(v) => handleModeChange(v as TransitionMode)}
					className="grid grid-cols-1 gap-4 sm:grid-cols-2"
					disabled={disabled}
				>
					{/* Hard Cut Option */}
					<Label
						htmlFor="mode-hard-cut"
						className={cn(
							"flex min-h-[100px] cursor-pointer flex-col items-start rounded-lg border-2 p-4 transition-all",
							radioValue === "hard_cut"
								? "border-primary bg-primary/10"
								: "border-border hover:border-muted",
							disabled && "cursor-not-allowed opacity-50",
						)}
					>
						<div className="flex w-full items-center gap-3">
							<RadioGroupItem value="hard_cut" id="mode-hard-cut" />
							<Scissors className="h-5 w-5 text-muted-foreground" />
							<span className="font-medium text-foreground">
								{tStep5("transition_mode_hard_cut")}
							</span>
						</div>
						<p className="ml-8 mt-2 text-sm text-muted-foreground">
							{tStep5("transition_mode_hard_cut_desc")}
						</p>
						<Badge variant="secondary" className="ml-8 mt-2">
							<Clock className="mr-1 h-3 w-3" />
							{hardCutDuration}s
						</Badge>
					</Label>

					{/* COMMENT DO NOT DELETE - Smooth Transitions (xfade) option: to implement later (see Post-MVP-Improvement.md)
					<Label
						htmlFor="mode-xfade"
						className={cn(
							"flex min-h-[100px] cursor-pointer flex-col items-start rounded-lg border-2 p-4 transition-all",
							value.mode === "xfade"
								? "border-primary bg-primary/10"
								: "border-border hover:border-muted",
							disabled && "cursor-not-allowed opacity-50",
						)}
					>
						<div className="flex w-full items-center gap-3">
							<RadioGroupItem value="xfade" id="mode-xfade" />
							<Sparkles className="h-5 w-5 text-primary" />
							<span className="font-medium text-foreground">
								{tStep5("transition_mode_xfade")}
							</span>
						</div>
						<p className="ml-8 mt-2 text-sm text-muted-foreground">
							{tStep5("transition_mode_xfade_desc")}
						</p>
						<Badge variant="secondary" className="ml-8 mt-2">
							<Clock className="mr-1 h-3 w-3" />
							{xfadeDuration}s
						</Badge>
					</Label>
				</RadioGroup>
				*/}

					{/* Smooth Transitions - Frozen with Coming soon (do not delete; uncomment xfade option above when implementing) */}
					<div
						className={cn(
							"flex min-h-[100px] flex-col items-start rounded-lg border-2 border-border bg-muted/30 p-4 opacity-80",
							"cursor-not-allowed",
						)}
						aria-hidden
					>
						<div className="flex w-full items-center gap-3">
							<div className="h-4 w-4 rounded-full border-2 border-muted-foreground/50 bg-muted" />
							<Sparkles className="h-5 w-5 text-muted-foreground" />
							<span className="font-medium text-muted-foreground">
								{tStep5("transition_mode_xfade")}
							</span>
							<span className="ml-2 rounded bg-yellow-600 px-1.5 py-0.5 text-xs font-medium text-yellow-100">
								{tStep5("smooth_transitions_coming_soon")}
							</span>
						</div>
						<p className="ml-8 mt-2 text-sm text-muted-foreground">
							{tStep5("transition_mode_xfade_desc")}
						</p>
						<Badge variant="secondary" className="ml-8 mt-2 opacity-70">
							<Clock className="mr-1 h-3 w-3" />
							{xfadeDuration}s
						</Badge>
					</div>
				</RadioGroup>

				{/* Per-Scene Transitions: only when Smooth Transitions enabled (COMMENT DO NOT DELETE - see Post-MVP-Improvement.md) */}
				{smoothTransitionsEnabled &&
					value.mode === "xfade" &&
					scenes &&
					scenes.length > 1 && (
						<div className="space-y-4">
							{/* Header with "Apply to All" */}
							<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
								<Label className="text-sm font-medium text-muted-foreground">
									{tStep5("scene_transitions")}
								</Label>

								{/* Apply to All dropdown */}
								{projectId && effects && (
									<Select
										open={applyAllOpen}
										onOpenChange={setApplyAllOpen}
										onValueChange={handleApplyToAll}
										disabled={disabled}
									>
										<SelectTrigger className="w-full bg-secondary sm:w-[180px]">
											<div className="flex items-center gap-2">
												<Copy className="h-4 w-4" />
												<span>{tStep5("apply_to_all")}</span>
											</div>
										</SelectTrigger>
										<SelectContent className="max-h-[300px]">
											{categoryOrder.map((category) => {
												const categoryEffects = groupedEffects?.[category];
												if (!categoryEffects || categoryEffects.length === 0)
													return null;

												return (
													<SelectGroup key={category}>
														<SelectLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
															{tCategories(category)}
														</SelectLabel>
														{categoryEffects.map((effect) => (
															<SelectItem key={effect.key} value={effect.key}>
																{t(effect.key)}
															</SelectItem>
														))}
													</SelectGroup>
												);
											})}
										</SelectContent>
									</Select>
								)}
							</div>

							{/* Per-scene pickers */}
							<div className="space-y-2">
								{scenesWithTransitions.map((scene) => (
									<SceneTransitionPicker
										key={scene._id}
										sceneId={scene._id}
										fromSceneNumber={scene.sceneNumber}
										toSceneNumber={scene.sceneNumber + 1}
										currentEffectKey={scene.outgoingTransition?.effectKey}
										currentDuration={scene.outgoingTransition?.duration}
										disabled={disabled}
									/>
								))}
							</div>

							{/* Preview placeholder */}
							<div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-border bg-secondary">
								<div className="text-center text-muted-foreground">
									<Sparkles className="mx-auto mb-2 h-8 w-8" />
									<p className="text-sm">
										{scenesWithTransitions[0]?.outgoingTransition?.effectKey
											? t(scenesWithTransitions[0].outgoingTransition.effectKey)
											: t("circleopen")}
									</p>
									<p className="mt-1 text-xs text-muted-foreground/60">
										{tStep5("preview_coming_soon")}
									</p>
								</div>
							</div>
						</div>
					)}

				{/* Fallback for legacy mode (no scenes provided) - only when Smooth Transitions enabled */}
				{smoothTransitionsEnabled &&
					value.mode === "xfade" &&
					(!scenes || scenes.length <= 1) && (
						<div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-border bg-secondary">
							<div className="text-center text-muted-foreground">
								<Sparkles className="mx-auto mb-2 h-8 w-8" />
								<p className="text-sm">{t(value.xfadeType ?? "circleopen")}</p>
								<p className="mt-1 text-xs text-muted-foreground/60">
									{tStep5("preview_coming_soon")}
								</p>
							</div>
						</div>
					)}
			</CardContent>
		</Card>
	);
}
