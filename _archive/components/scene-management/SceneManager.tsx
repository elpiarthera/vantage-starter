"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AdaptiveNavigation } from "@/components/adaptive/AdaptiveNavigation";
import type { Scene } from "@/components/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useDevice } from "@/contexts/DeviceContext";
import { SceneEditor } from "./SceneEditor";

interface SceneManagerProps {
	projectId: string; // Required for AI chat in VideoGenerator
	scenes: Scene[];
	activeSceneId: string;
	setActiveSceneId: (id: string) => void;
	// Project-level context from Step 1 & Step 2b (for video generation)
	visualStyle?: string;
	occasion?: string;
	theme?: string;
	emotionalStory?: string;
	/** Video validation states per scene (derived from Convex) */
	videoValidationStates?: Record<string, boolean>;
	// Callbacks
	onUpdateScene: (id: string, updates: Partial<Scene>) => void;
	onRemoveScene?: (id: string) => void;
	onAddScene?: () => void;
	onValidateVideo?: (sceneId: string) => void;
	onGenerateVideo?: (sceneId: string) => void;
	onRegenerateApproved?: (sceneId: string) => void;
	onDeleteFrame?: (id: string, frameType: "start" | "end") => void;
	onFrameChanged?: (sceneId: string) => void;
}

export function SceneManager({
	projectId,
	scenes,
	activeSceneId,
	setActiveSceneId,
	visualStyle,
	occasion,
	theme,
	emotionalStory,
	videoValidationStates,
	onUpdateScene,
	onRemoveScene,
	onAddScene,
	onValidateVideo,
	onGenerateVideo,
	onRegenerateApproved,
	onDeleteFrame,
	onFrameChanged,
}: SceneManagerProps) {
	const { isMobile } = useDevice();
	const t = useTranslations("scene_manager");
	const [expandedSections, setExpandedSections] = useState<Set<string>>(
		new Set([scenes && scenes.length > 0 ? scenes[0]?.id : ""]),
	);

	// Empty state - no scenes yet (user needs to add their first scene)
	if (!scenes || scenes.length === 0) {
		return (
			<div className="space-y-6">
				{/* Add Scene Button - always show when empty */}
				<div className="flex justify-between items-center">
					<h2 className="text-xl font-bold text-white">{t("title")}</h2>
					{onAddScene && (
						<Button
							onClick={onAddScene}
							className="bg-[#0d7ff2] hover:bg-blue-600 text-white"
							size="sm"
						>
							<Plus className="h-4 w-4 mr-2" />
							{t("add_scene")}
						</Button>
					)}
				</div>

				{/* Empty state message */}
				<div className="flex justify-center items-center py-12 border-2 border-dashed border-[#314d68] rounded-lg">
					<div className="text-center">
						<h3 className="text-lg font-medium text-white mb-2">
							{t("no_scenes_title")}
						</h3>
						<p className="text-gray-400 mb-4">{t("no_scenes_description")}</p>
						{onAddScene && (
							<Button
								onClick={onAddScene}
								className="bg-[#0d7ff2] hover:bg-blue-600 text-white"
							>
								<Plus className="h-4 w-4 mr-2" />
								{t("add_first_scene")}
							</Button>
						)}
					</div>
				</div>
			</div>
		);
	}

	// MVP: Lock scene count to exactly 3
	// Add Scene is frozen with "Coming Soon" message
	const _canAddScene = false; // Frozen for MVP
	const canDeleteScene = false; // Cannot delete when at exactly 3 scenes (MVP limit)

	const toggleSection = (sceneId: string) => {
		setExpandedSections((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(sceneId)) {
				newSet.delete(sceneId);
			} else {
				newSet.add(sceneId);
			}
			return newSet;
		});
	};

	const navigationItems = scenes.map((scene) => ({
		id: scene.id,
		title: scene.title,
		duration: scene.duration,
		isComplete: !!(scene.startFrameImage && scene.endFrameImage),
		children: (
			<SceneEditor
				scene={scene}
				projectId={projectId}
				visualStyle={visualStyle}
				occasion={occasion}
				theme={theme}
				emotionalStory={emotionalStory}
				isValidated={videoValidationStates?.[scene.id]}
				onUpdateScene={onUpdateScene}
				onRemoveScene={canDeleteScene ? onRemoveScene : undefined}
				onValidateVideo={onValidateVideo}
				onGenerateVideo={onGenerateVideo}
				onRegenerateApproved={onRegenerateApproved}
				onDeleteFrame={onDeleteFrame}
				onFrameChanged={onFrameChanged}
			/>
		),
	}));

	return (
		<div className="space-y-6">
			{/* Add Scene Button */}
			<div className="flex justify-between items-center">
				<h2 className="text-xl font-bold text-white">{t("title")}</h2>
				{/* MVP: Add Scene button frozen with "Coming Soon" */}
				<Button
					disabled={true}
					className="bg-gray-600 text-gray-400 cursor-not-allowed opacity-70"
					size="sm"
					title={t("add_scene_disabled_tooltip")}
				>
					<Plus className="h-4 w-4 mr-2" />
					{t("add_scene")}
					<span className="ml-2 text-xs bg-yellow-600 text-yellow-100 px-1.5 py-0.5 rounded">
						{t("add_scene_coming_soon")}
					</span>
				</Button>
			</div>

			{/* Adaptive Navigation */}
			<AdaptiveNavigation
				items={navigationItems}
				activeItem={activeSceneId}
				onItemChange={setActiveSceneId}
				expandedItems={isMobile ? expandedSections : undefined}
				onToggleExpanded={isMobile ? toggleSection : undefined}
			/>

			{/* Desktop Tab Content */}
			{!isMobile && (
				<Tabs value={activeSceneId} onValueChange={setActiveSceneId}>
					<div className="mt-6">
						{scenes.map((scene) => (
							<TabsContent key={scene.id} value={scene.id} className="mt-0">
								<SceneEditor
									scene={scene}
									projectId={projectId}
									visualStyle={visualStyle}
									occasion={occasion}
									theme={theme}
									emotionalStory={emotionalStory}
									isValidated={videoValidationStates?.[scene.id]}
									onUpdateScene={onUpdateScene}
									onRemoveScene={canDeleteScene ? onRemoveScene : undefined}
									onValidateVideo={onValidateVideo}
									onGenerateVideo={onGenerateVideo}
									onRegenerateApproved={onRegenerateApproved}
									onDeleteFrame={onDeleteFrame}
									onFrameChanged={onFrameChanged}
								/>
							</TabsContent>
						))}
					</div>
				</Tabs>
			)}
		</div>
	);
}
