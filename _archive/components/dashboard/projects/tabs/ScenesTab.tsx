"use client";

import { useQuery } from "convex/react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { SceneCard } from "@/components/dashboard/scenes/SceneCard";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDevice } from "@/contexts/DeviceContext";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface ScenesTabProps {
	projectId: string;
}

export function ScenesTab({ projectId }: ScenesTabProps) {
	const { isMobile } = useDevice();
	const t = useTranslations("scenes_tab");
	const tSceneManager = useTranslations("scene_manager");

	// Fetch real scenes from Convex
	const scenes = useQuery(api.scenes.list, {
		projectId: projectId as Id<"projects">,
	});

	const isLoading = scenes === undefined;

	// Sort by scene number
	const sortedScenes = [...(scenes || [])].sort(
		(a, b) => a.sceneNumber - b.sceneNumber,
	);

	if (isLoading) {
		return (
			<div className="space-y-4 md:space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<Skeleton className="h-6 w-20" />
						<Skeleton className="h-4 w-32 mt-1" />
					</div>
					<Skeleton className="h-[44px] w-[44px]" />
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
					<Skeleton className="h-[250px]" />
					<Skeleton className="h-[250px]" />
					<Skeleton className="h-[250px]" />
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4 md:space-y-6">
			{/* Header with Add Scene button - frozen with Coming soon (same as step-3) */}
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-lg md:text-xl font-semibold text-white">
						{t("title")}
					</h3>
					<p className="text-sm md:text-base text-gray-400 mt-1">
						{t("scene_count", { count: sortedScenes.length })}
					</p>
				</div>

				<Button
					disabled
					className="min-h-[44px] bg-gray-600 text-gray-400 cursor-not-allowed opacity-70"
					title={tSceneManager("add_scene_disabled_tooltip")}
				>
					<Plus className="h-4 w-4 mr-2" />
					{!isMobile && t("add_scene")}
					<span className="ml-2 text-xs bg-yellow-600 text-yellow-100 px-1.5 py-0.5 rounded">
						{tSceneManager("add_scene_coming_soon")}
					</span>
				</Button>
			</div>

			{/* Scenes Grid */}
			{sortedScenes.length > 0 ? (
				<div
					className="
            grid grid-cols-1
            md:grid-cols-2
            lg:grid-cols-3
            gap-4 md:gap-6
          "
				>
					{sortedScenes.map((scene) => (
						<SceneCard key={scene._id} scene={scene} />
					))}
				</div>
			) : (
				<EmptyState
					icon="film"
					title={t("empty_title")}
					description={t("empty_description")}
				/>
			)}
		</div>
	);
}
