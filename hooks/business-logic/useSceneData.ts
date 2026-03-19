"use client";

import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

/**
 * Scene data structure from Convex
 */
interface SceneData {
	_id: Id<"scenes">;
	projectId: Id<"projects"> | string; // Can be ID type or string from Convex
	userId: string; // Clerk user ID
	sceneNumber: number;
	title: string;
	description: string;
	duration: number;
	startFrame?: Id<"assets"> | string;
	endFrame?: Id<"assets"> | string;
	cinematicStyles?: {
		ambiance?: string;
		cameraMovement?: string;
		colorTone?: string;
		visualStyle?: string;
	};
	videoUrl?: string;
	status: "draft" | "generating" | "completed";
	validated?: boolean; // Sprint 8: Video validation status for cross-device persistence
	// Sprint 11 Phase 2: Per-scene transition configuration
	outgoingTransition?: {
		effectKey: string;
		duration: number;
	};
	createdAt: number;
	updatedAt: number;
}

/**
 * Custom hook for managing scene data with Convex
 * Provides CRUD operations, auto-save, and optimistic updates
 */
export function useSceneData(projectId: Id<"projects"> | undefined) {
	// Convex mutations
	const createMutation = useMutation(api.scenes.create);
	const updateMutation = useMutation(api.scenes.update);
	const removeMutation = useMutation(api.scenes.remove);
	const reorderMutation = useMutation(api.scenes.reorder);

	// Query scenes for the project
	const scenes = useQuery(api.scenes.list, projectId ? { projectId } : "skip");

	// Local state for optimistic updates
	const [localScenes, setLocalScenes] = useState<SceneData[] | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [lastSaved, setLastSaved] = useState<Date | null>(null);

	// Debounce timer
	const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

	// Sync Convex data to local state
	useEffect(() => {
		if (scenes) {
			setLocalScenes(scenes as unknown as SceneData[]);
		}
	}, [scenes]);

	/**
	 * Create a new scene
	 */
	const create = useCallback(
		async (sceneData: {
			sceneNumber: number;
			title: string;
			description: string;
			duration: number;
			startFrame?: Id<"assets">;
			endFrame?: Id<"assets">;
			cinematicStyles?: {
				ambiance?: string;
				cameraMovement?: string;
				colorTone?: string;
				visualStyle?: string;
			};
			videoUrl?: string;
			status?: "draft" | "generating" | "completed";
		}) => {
			if (!projectId) {
				throw new Error("Project ID is required");
			}

			setIsSaving(true);
			try {
				const sceneId = await createMutation({
					projectId,
					...sceneData,
				});

				setLastSaved(new Date());
				return sceneId;
			} catch (error) {
				console.error("Failed to create scene:", error);
				throw error;
			} finally {
				setIsSaving(false);
			}
		},
		[projectId, createMutation],
	);

	/**
	 * Update a scene with auto-save (debounced)
	 */
	const update = useCallback(
		(
			sceneId: Id<"scenes">,
			updates: Partial<
				Omit<
					SceneData,
					"_id" | "projectId" | "userId" | "createdAt" | "updatedAt"
				>
			>,
		) => {
			if (!localScenes) return;

			// Dirty check: skip if all update fields already match current values
			const currentScene = localScenes.find((s) => s._id === sceneId);
			if (currentScene) {
				const hasChanges = Object.entries(updates).some(
					([key, value]) =>
						currentScene[key as keyof typeof currentScene] !== value,
				);
				if (!hasChanges) return;
			}

			// Optimistic update
			setLocalScenes((prev) =>
				prev
					? prev.map((scene) =>
							scene._id === sceneId ? { ...scene, ...updates } : scene,
						)
					: prev,
			);

			// Debounced save
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}

			debounceTimerRef.current = setTimeout(async () => {
				setIsSaving(true);
				try {
					// Prepare updates with proper types for mutation
					const mutationUpdates: {
						sceneId: Id<"scenes">;
						title?: string;
						description?: string;
						duration?: number;
						sceneNumber?: number;
						startFrame?: Id<"assets"> | string | null;
						endFrame?: Id<"assets"> | string | null;
						startFrameImageUrl?: string | null;
						endFrameImageUrl?: string | null;
						cinematicStyles?: {
							ambiance?: string;
							cameraMovement?: string;
							colorTone?: string;
							visualStyle?: string;
						};
						videoUrl?: string;
						status?: "draft" | "generating" | "completed";
						validated?: boolean;
					} = { sceneId };

					// Only include fields that are in updates and properly typed
					if (updates.title !== undefined)
						mutationUpdates.title = updates.title;
					if (updates.description !== undefined)
						mutationUpdates.description = updates.description;
					if (updates.duration !== undefined)
						mutationUpdates.duration = updates.duration;
					if (updates.sceneNumber !== undefined)
						mutationUpdates.sceneNumber = updates.sceneNumber;
					if (updates.cinematicStyles !== undefined)
						mutationUpdates.cinematicStyles = updates.cinematicStyles;
					if (updates.videoUrl !== undefined)
						mutationUpdates.videoUrl = updates.videoUrl;
					if (updates.status !== undefined)
						mutationUpdates.status = updates.status;
					if (updates.validated !== undefined)
						mutationUpdates.validated = updates.validated;

					// Handle frame images - accept both asset IDs and URL strings
					if (updates.startFrame !== undefined) {
						mutationUpdates.startFrame = updates.startFrame;
					}
					if (updates.endFrame !== undefined) {
						mutationUpdates.endFrame = updates.endFrame;
					}
					// Handle frame image URLs (these are prioritized by UI)
					if (
						(updates as { startFrameImageUrl?: string | null })
							.startFrameImageUrl !== undefined
					) {
						mutationUpdates.startFrameImageUrl = (
							updates as { startFrameImageUrl?: string | null }
						).startFrameImageUrl;
					}
					if (
						(updates as { endFrameImageUrl?: string | null })
							.endFrameImageUrl !== undefined
					) {
						mutationUpdates.endFrameImageUrl = (
							updates as { endFrameImageUrl?: string | null }
						).endFrameImageUrl;
					}

					await updateMutation(mutationUpdates);
					setLastSaved(new Date());
				} catch (error) {
					console.error("Failed to update scene:", error);
					// Revert optimistic update on error - use callback to get latest value
					setLocalScenes((prev) => prev);
				} finally {
					setIsSaving(false);
				}
			}, 500); // 500ms debounce
		},
		[localScenes, updateMutation],
	);

	/**
	 * Save immediately (no debounce)
	 */
	const saveNow = useCallback(
		async (
			sceneId: Id<"scenes">,
			updates: Partial<
				Omit<
					SceneData,
					"_id" | "projectId" | "userId" | "createdAt" | "updatedAt"
				>
			>,
		) => {
			// Cancel pending debounced save
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}

			setIsSaving(true);
			try {
				// Prepare updates with proper types for mutation
				const mutationUpdates: {
					sceneId: Id<"scenes">;
					title?: string;
					description?: string;
					duration?: number;
					sceneNumber?: number;
					startFrame?: Id<"assets"> | string | null;
					endFrame?: Id<"assets"> | string | null;
					startFrameImageUrl?: string | null;
					endFrameImageUrl?: string | null;
					cinematicStyles?: {
						ambiance?: string;
						cameraMovement?: string;
						colorTone?: string;
						visualStyle?: string;
					};
					videoUrl?: string;
					status?: "draft" | "generating" | "completed";
					validated?: boolean;
				} = { sceneId };

				// Only include fields that are in updates and properly typed
				if (updates.title !== undefined) mutationUpdates.title = updates.title;
				if (updates.description !== undefined)
					mutationUpdates.description = updates.description;
				if (updates.duration !== undefined)
					mutationUpdates.duration = updates.duration;
				if (updates.sceneNumber !== undefined)
					mutationUpdates.sceneNumber = updates.sceneNumber;
				if (updates.cinematicStyles !== undefined)
					mutationUpdates.cinematicStyles = updates.cinematicStyles;
				if (updates.videoUrl !== undefined)
					mutationUpdates.videoUrl = updates.videoUrl;
				if (updates.status !== undefined)
					mutationUpdates.status = updates.status;
				if (updates.validated !== undefined)
					mutationUpdates.validated = updates.validated;

				// Handle frame images - accept both asset IDs and URL strings
				if (updates.startFrame !== undefined) {
					mutationUpdates.startFrame = updates.startFrame;
				}
				if (updates.endFrame !== undefined) {
					mutationUpdates.endFrame = updates.endFrame;
				}
				// Handle frame image URLs (these are prioritized by UI)
				if (
					(updates as { startFrameImageUrl?: string | null })
						.startFrameImageUrl !== undefined
				) {
					mutationUpdates.startFrameImageUrl = (
						updates as { startFrameImageUrl?: string | null }
					).startFrameImageUrl;
				}
				if (
					(updates as { endFrameImageUrl?: string | null }).endFrameImageUrl !==
					undefined
				) {
					mutationUpdates.endFrameImageUrl = (
						updates as { endFrameImageUrl?: string | null }
					).endFrameImageUrl;
				}

				await updateMutation(mutationUpdates);
				setLastSaved(new Date());
			} catch (error) {
				console.error("Failed to save scene:", error);
				throw error;
			} finally {
				setIsSaving(false);
			}
		},
		[updateMutation],
	);

	/**
	 * Delete a scene
	 */
	const remove = useCallback(
		async (sceneId: Id<"scenes">) => {
			setIsSaving(true);
			try {
				await removeMutation({ sceneId });
				setLastSaved(new Date());
			} catch (error) {
				console.error("Failed to delete scene:", error);
				throw error;
			} finally {
				setIsSaving(false);
			}
		},
		[removeMutation],
	);

	/**
	 * Reorder scenes
	 */
	const reorder = useCallback(
		async (sceneIds: Id<"scenes">[]) => {
			if (!projectId) {
				throw new Error("Project ID is required");
			}

			// Optimistic update
			if (localScenes) {
				const reorderedScenes = sceneIds
					.map((id) => localScenes.find((scene) => scene._id === id))
					.filter((scene): scene is SceneData => scene !== undefined)
					.map((scene, index) => ({
						...scene,
						sceneNumber: index + 1,
					}));
				setLocalScenes(reorderedScenes);
			}

			setIsSaving(true);
			try {
				await reorderMutation({
					projectId,
					sceneIds,
				});
				setLastSaved(new Date());
			} catch (error) {
				console.error("Failed to reorder scenes:", error);
				// Revert optimistic update on error - use callback to get latest value
				setLocalScenes((prev) => prev);
				throw error;
			} finally {
				setIsSaving(false);
			}
		},
		[projectId, localScenes, reorderMutation],
	);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
		};
	}, []);

	return {
		scenes: localScenes || scenes || [],
		isLoading: scenes === undefined,
		isSaving,
		lastSaved,
		create,
		update,
		saveNow,
		remove,
		reorder,
	};
}
