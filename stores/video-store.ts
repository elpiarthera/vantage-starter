import { create } from "zustand";

interface VideoGenerationState {
	videoGenerationStates: {
		[sceneId: string]: "idle" | "generating" | "completed";
	};
	videoValidationStates: Record<string, boolean>;
	generatedVideos: { [sceneId: string]: string };
	regenerationModalStates: { [sceneId: string]: boolean };
	regenerationCounts: { [sceneId: string]: number };
	isHydrated: boolean; // Added hydration flag

	// Actions
	setVideoGenerationState: (
		sceneId: string,
		state: "idle" | "generating" | "completed",
	) => void;
	setVideoValidationState: (sceneId: string, isValid: boolean) => void;
	setGeneratedVideo: (sceneId: string, videoUrl: string) => void;
	setRegenerationModalOpen: (sceneId: string, isOpen: boolean) => void;
	incrementRegenerationCount: (sceneId: string) => void;
	resetVideoStates: () => void;
	hydrateFromStorage: () => void; // Added hydration method
}

const STORAGE_KEY = "v0-video-store-state";

// Safe storage access that works in v0 environment
const getStoredState = (): Partial<VideoGenerationState> => {
	try {
		if (typeof window !== "undefined" && window.sessionStorage) {
			const stored = sessionStorage.getItem(STORAGE_KEY);
			if (stored) {
				const parsed = JSON.parse(stored);
				console.log("[v0] Found video store in sessionStorage:", parsed);
				return parsed;
			}
		}
	} catch (error) {
		console.log("[v0] Failed to restore video store from storage:", error);
	}
	return {};
};

const saveToStorage = (state: VideoGenerationState) => {
	try {
		if (typeof window !== "undefined" && window.sessionStorage) {
			sessionStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({
					videoGenerationStates: state.videoGenerationStates,
					videoValidationStates: state.videoValidationStates,
					generatedVideos: state.generatedVideos,
					regenerationModalStates: state.regenerationModalStates,
					regenerationCounts: state.regenerationCounts,
				}),
			);
		}
	} catch (error) {
		console.log("[v0] Failed to save video store to storage:", error);
	}
};

export const useVideoStore = create<VideoGenerationState>((set, _get) => ({
	videoGenerationStates: {},
	videoValidationStates: {},
	generatedVideos: {},
	regenerationModalStates: {},
	regenerationCounts: {},
	isHydrated: false,

	hydrateFromStorage: () => {
		console.log("[v0] Hydrating video store from storage...");
		const stored = getStoredState();
		if (
			stored.videoGenerationStates ||
			stored.videoValidationStates ||
			stored.generatedVideos
		) {
			console.log("[v0] Restoring video store from sessionStorage:", stored);
			set({
				videoGenerationStates: stored.videoGenerationStates || {},
				videoValidationStates: stored.videoValidationStates || {},
				generatedVideos: stored.generatedVideos || {},
				regenerationModalStates: stored.regenerationModalStates || {},
				regenerationCounts: stored.regenerationCounts || {},
				isHydrated: true,
			});
		} else {
			console.log("[v0] No stored video data, starting fresh");
			set({ isHydrated: true });
		}
	},

	setVideoGenerationState: (
		sceneId: string,
		state: "idle" | "generating" | "completed",
	) => {
		set((prev) => {
			const newState = {
				...prev,
				videoGenerationStates: {
					...prev.videoGenerationStates,
					[sceneId]: state,
				},
			};
			saveToStorage(newState);
			return { videoGenerationStates: newState.videoGenerationStates };
		});
	},

	setVideoValidationState: (sceneId: string, isValid: boolean) => {
		set((prev) => {
			const newState = {
				...prev,
				videoValidationStates: {
					...prev.videoValidationStates,
					[sceneId]: isValid,
				},
			};
			saveToStorage(newState);
			return { videoValidationStates: newState.videoValidationStates };
		});
	},

	setGeneratedVideo: (sceneId: string, videoUrl: string) => {
		set((prev) => {
			const newState = {
				...prev,
				generatedVideos: {
					...prev.generatedVideos,
					[sceneId]: videoUrl,
				},
			};
			saveToStorage(newState);
			return { generatedVideos: newState.generatedVideos };
		});
	},

	setRegenerationModalOpen: (sceneId: string, isOpen: boolean) => {
		console.log(`[v0] Setting regeneration modal for ${sceneId}:`, isOpen);
		set((prev) => {
			const newState = {
				...prev,
				regenerationModalStates: {
					...prev.regenerationModalStates,
					[sceneId]: isOpen,
				},
			};
			saveToStorage(newState);
			return { regenerationModalStates: newState.regenerationModalStates };
		});
	},

	incrementRegenerationCount: (sceneId: string) => {
		set((prev) => {
			const newState = {
				...prev,
				regenerationCounts: {
					...prev.regenerationCounts,
					[sceneId]: (prev.regenerationCounts[sceneId] || 0) + 1,
				},
			};
			saveToStorage(newState);
			return { regenerationCounts: newState.regenerationCounts };
		});
	},

	resetVideoStates: () => {
		const resetState = {
			videoGenerationStates: {},
			videoValidationStates: {},
			generatedVideos: {},
			regenerationModalStates: {},
			regenerationCounts: {},
		};
		try {
			if (typeof window !== "undefined" && window.sessionStorage) {
				sessionStorage.removeItem(STORAGE_KEY);
			}
		} catch (error) {
			console.log("[v0] Failed to clear video store storage:", error);
		}
		set(resetState);
	},
}));

console.log(
	"[v0] Video store initialized with empty state for hydration compatibility",
);
