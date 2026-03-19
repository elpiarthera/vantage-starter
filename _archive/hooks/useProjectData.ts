"use client";

import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

// Project data type from Convex schema
interface ProjectData {
	_id: Id<"projects">;
	userId: Id<"users"> | string; // Can be either ID type or string from Convex
	name: string;
	occasion: string;
	theme: string;
	visualStyle?: string; // Step 2b: Visual style selection
	approvedMessageId?: string; // Step 2: Approved story concept message ID
	approvedNarrationScript?: string; // Step 3b: Approved narration
	narrationAudioUrl?: string; // Step 4: Generated TTS
	narrationAudioStorageId?: Id<"_storage">; // Step 4: Convex storage ID for narration
	narrationDurationMs?: number; // Step 4: Duration of narration in ms
	musicAudioUrl?: string; // Step 4: Generated music
	musicAudioStorageId?: Id<"_storage">; // Step 4: Convex storage ID for music
	finalVideoUrl?: string; // Step 6: Final assembled video (Convex Storage URL)
	finalVideoStorageId?: Id<"_storage">;
	finalVideoDurationMs?: number;
	finalVideoSize?: number;
	finalAssemblyAt?: number;
	assemblyStatus?:
		| "preparing_assets"
		| "processing_media"
		| "finalizing_video"
		| "saving_video"
		| "completed"
		| "failed";
	eventDetails: {
		eventTitle: string;
		description?: string;
		date?: string;
		location?: string;
		rsvpLink?: string;
		emotionalStory: string;
	};
	language: string;
	duration: number;
	status: "draft" | "in_progress" | "completed";
	step4Data?: {
		// Voice settings
		selectedVoice?: string;
		pacing?: number[];
		pitch?: number[];
		energy?: number[];
		narrationTakes?: Array<{
			id: string;
			name: string;
			voice: string;
			settings: { pacing: number; pitch: number; energy: number };
			audioUrl?: string;
			audioStorageId?: Id<"_storage">;
			durationMs?: number;
		}>;
		selectedNarrationTake?: string;
		// Music settings
		musicPrompt?: string;
		musicTakes?: Array<{
			id: string;
			name: string;
			prompt: string;
			audioUrl?: string;
			audioStorageId?: Id<"_storage">;
		}>;
		selectedMusicTrack?: string;
		// Volume controls (stored as numbers in Convex)
		narrationVolume?: number;
		musicVolume?: number;
		// Validation flags
		narratorValidated?: boolean;
		musicValidated?: boolean;
	};
	createdAt: number;
	updatedAt: number;
}

/**
 * Custom hook for managing project data with Convex
 * Uses PURE Convex - no local state, real-time sync across devices
 */
export function useProjectData(projectId: Id<"projects"> | undefined) {
	// Convex mutations and queries
	const createProject = useMutation(api.projects.create);
	const updateProject = useMutation(api.projects.update);
	const getProject = useQuery(
		api.projects.get,
		projectId ? { projectId } : "skip",
	);

	// Saving state
	const [isSaving, setIsSaving] = useState(false);
	const [lastSaved, setLastSaved] = useState<Date | null>(null);

	// Debounce timer
	const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	/**
	 * Create a new project
	 */
	const create = useCallback(
		async (data: {
			name: string;
			occasion: string;
			theme: string;
			eventDetails: {
				eventTitle: string;
				description?: string;
				date?: string;
				location?: string;
				rsvpLink?: string;
				emotionalStory: string;
			};
			language: string;
		}) => {
			try {
				setIsSaving(true);
				const newProjectId = await createProject(data);
				setLastSaved(new Date());
				return newProjectId;
			} catch (error) {
				console.error("Failed to create project:", error);
				throw error;
			} finally {
				setIsSaving(false);
			}
		},
		[createProject],
	);

	/**
	 * Update project with minimal debounce (100ms)
	 * Convex is fast - we don't need much delay
	 */
	const update = useCallback(
		(updates: Partial<ProjectData>) => {
			if (!projectId) return;

			// Clear existing timeout
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}

			// Minimal debounce to batch rapid changes (100ms)
			saveTimeoutRef.current = setTimeout(async () => {
				try {
					setIsSaving(true);
					await updateProject({
						projectId,
						...updates,
					});
					setLastSaved(new Date());
				} catch (error) {
					console.error("Failed to update project:", error);
				} finally {
					setIsSaving(false);
				}
			}, 100); // Convex is fast!
		},
		[projectId, updateProject],
	);

	/**
	 * Force immediate save (for navigation, etc)
	 */
	const saveNow = useCallback(async () => {
		if (saveTimeoutRef.current) {
			clearTimeout(saveTimeoutRef.current);
		}

		if (!projectId || !getProject) return;

		try {
			setIsSaving(true);
			await updateProject({
				projectId,
				...getProject,
			});
			setLastSaved(new Date());
		} catch (error) {
			console.error("Failed to save project:", error);
			throw error;
		} finally {
			setIsSaving(false);
		}
	}, [projectId, getProject, updateProject]);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}
		};
	}, []);

	return {
		// Data - PURE CONVEX, no local state!
		project: getProject,
		isSaving,
		lastSaved,

		// Operations
		create,
		update,
		saveNow,

		// Loading states
		isLoading: getProject === undefined && projectId !== undefined,
	};
}
