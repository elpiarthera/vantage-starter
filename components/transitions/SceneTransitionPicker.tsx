"use client";

import { useMutation, useQuery } from "convex/react";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

/**
 * Sprint 11 Phase 2: Per-Scene Transition Picker
 *
 * A compact dropdown for selecting the transition effect between two specific scenes.
 * Fetches all 46 effects from Convex and groups them by category.
 */

interface SceneTransitionPickerProps {
	sceneId: Id<"scenes">;
	fromSceneNumber: number;
	toSceneNumber: number;
	currentEffectKey?: string;
	currentDuration?: number;
	disabled?: boolean;
}

export function SceneTransitionPicker({
	sceneId,
	fromSceneNumber,
	toSceneNumber,
	currentEffectKey = "circleopen",
	currentDuration = 1.0,
	disabled = false,
}: SceneTransitionPickerProps) {
	const t = useTranslations("transitions");
	const tCategories = useTranslations("transition_categories");

	// Fetch all active effects from Convex
	const effects = useQuery(api.transitionEffects.listActive);
	const updateTransition = useMutation(api.scenes.updateTransition);

	// Group effects by category for organized display
	const groupedEffects = effects?.reduce(
		(acc, effect) => {
			if (!acc[effect.category]) acc[effect.category] = [];
			acc[effect.category].push(effect);
			return acc;
		},
		{} as Record<
			string,
			Array<{
				_id: Id<"transitionEffects">;
				key: string;
				category: string;
				sortOrder: number;
				defaultDuration: number;
			}>
		>,
	);

	// Category display order
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

	const handleChange = async (effectKey: string) => {
		// Find the effect to get its default duration
		const effect = effects?.find((e) => e.key === effectKey);
		const duration = effect?.defaultDuration ?? currentDuration;

		await updateTransition({
			sceneId,
			outgoingTransition: {
				effectKey,
				duration,
			},
		});
	};

	// Loading state
	if (!effects) {
		return (
			<div className="flex items-center gap-2 rounded-lg bg-secondary/50 p-3">
				<Skeleton className="h-4 w-16" />
				<ArrowRight className="h-4 w-4 text-muted-foreground" />
				<Skeleton className="h-4 w-16" />
				<Skeleton className="ml-auto h-9 w-[160px]" />
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2 rounded-lg bg-secondary/50 p-3 sm:flex-row sm:items-center">
			{/* Scene labels */}
			<div className="flex items-center gap-2">
				<span className="min-w-[70px] text-sm font-medium text-muted-foreground">
					Scene {fromSceneNumber}
				</span>
				<ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
				<span className="min-w-[70px] text-sm font-medium text-muted-foreground">
					Scene {toSceneNumber}
				</span>
			</div>

			{/* Effect selector */}
			<Select
				value={currentEffectKey}
				onValueChange={handleChange}
				disabled={disabled}
			>
				<SelectTrigger className="w-full bg-secondary sm:ml-auto sm:w-[160px]">
					<SelectValue placeholder={t("circleopen")} />
				</SelectTrigger>
				<SelectContent className="max-h-[300px]">
					{categoryOrder.map((category) => {
						const categoryEffects = groupedEffects?.[category];
						if (!categoryEffects || categoryEffects.length === 0) return null;

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
		</div>
	);
}
