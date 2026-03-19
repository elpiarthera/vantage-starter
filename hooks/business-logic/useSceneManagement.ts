"use client";

import { useCallback } from "react";
import type { Scene } from "@/components/types";
import { trackUserInteraction } from "@/lib/monitoring/analytics";
import { useSceneStore } from "@/stores/scene-store";

export function useSceneManagement() {
	const {
		scenes,
		addScene,
		removeScene,
		updateScene,
		activeSceneId,
		setActiveSceneId,
	} = useSceneStore();

	const handleAddScene = useCallback(() => {
		addScene();
		trackUserInteraction("add_scene", "SceneManagement", {
			totalScenes: scenes.length + 1,
		});
	}, [addScene, scenes.length]);

	const handleRemoveScene = useCallback(
		(sceneId: string) => {
			removeScene(sceneId);
			trackUserInteraction("remove_scene", "SceneManagement", {
				sceneId,
				totalScenes: scenes.length - 1,
			});
		},
		[removeScene, scenes.length],
	);

	const handleUpdateScene = useCallback(
		(sceneId: string, updates: Partial<Scene>) => {
			updateScene(sceneId, updates);
			trackUserInteraction("update_scene", "SceneManagement", {
				sceneId,
				updatedFields: Object.keys(updates),
			});
		},
		[updateScene],
	);

	const handleSetActiveScene = useCallback(
		(sceneId: string) => {
			setActiveSceneId(sceneId);
			trackUserInteraction("set_active_scene", "SceneManagement", { sceneId });
		},
		[setActiveSceneId],
	);

	const getSceneById = useCallback(
		(sceneId: string): Scene | undefined => {
			return scenes.find((scene) => scene.id === sceneId);
		},
		[scenes],
	);

	const getSceneIndex = useCallback(
		(sceneId: string): number => {
			return scenes.findIndex((scene) => scene.id === sceneId);
		},
		[scenes],
	);

	const isSceneValid = useCallback(
		(sceneId: string): boolean => {
			const scene = getSceneById(sceneId);
			if (!scene) return false;

			return !!(
				scene.title.trim() &&
				scene.description.trim() &&
				scene.startFrameImage &&
				scene.endFrameImage
			);
		},
		[getSceneById],
	);

	const canAddScene = scenes.length < 10; // Reasonable limit for demo

	// Computed values
	const isAllValid = scenes.every(
		(scene) => scene.title && scene.description && scene.duration > 0,
	);
	const totalDuration = scenes.reduce(
		(sum, scene) => sum + (scene.duration || 0),
		0,
	);

	return {
		// State
		scenes,
		activeSceneId,
		isAllValid,
		totalDuration,
		canAddScene,

		// Actions
		addScene: handleAddScene,
		removeScene: handleRemoveScene,
		updateScene: handleUpdateScene,
		setActiveScene: handleSetActiveScene,

		// Utilities
		getSceneById,
		getSceneIndex,
		isSceneValid,
	};
}
