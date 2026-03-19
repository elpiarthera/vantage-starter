import { create } from "zustand";
import type { Scene } from "@/components/types";
import { DEFAULT_SCENES } from "@/config/constants";

interface SceneState {
	scenes: Scene[];
	activeSceneId: string;
	isHydrated: boolean; // Added hydration flag

	// Actions
	setScenes: (scenes: Scene[]) => void;
	setActiveSceneId: (id: string) => void;
	addScene: () => void;
	removeScene: (id: string) => void;
	updateScene: (id: string, updates: Partial<Scene>) => void;
	initializeScenes: () => void;
	hydrateFromStorage: () => void; // Added hydration method
}

const SCENE_STORAGE_KEY = "v0-scene-store-state";

// Safe storage access that works in v0 environment
const getStoredSceneState = (): Partial<SceneState> => {
	try {
		if (typeof window !== "undefined" && window.sessionStorage) {
			const stored = sessionStorage.getItem(SCENE_STORAGE_KEY);
			if (stored) {
				const parsed = JSON.parse(stored);
				console.log("[v0] Found scene store in sessionStorage:", parsed);
				return parsed;
			}
		}
	} catch (error) {
		console.log("[v0] Failed to restore scene store from storage:", error);
	}
	return {};
};

const saveSceneToStorage = (state: SceneState) => {
	try {
		if (typeof window !== "undefined" && window.sessionStorage) {
			sessionStorage.setItem(
				SCENE_STORAGE_KEY,
				JSON.stringify({
					scenes: state.scenes,
					activeSceneId: state.activeSceneId,
				}),
			);
		}
	} catch (error) {
		console.log("[v0] Failed to save scene store to storage:", error);
	}
};

export const useSceneStore = create<SceneState>((set, get) => ({
	scenes: [],
	activeSceneId: "",
	isHydrated: false,

	hydrateFromStorage: () => {
		console.log("[v0] Hydrating scene store from storage...");
		const stored = getStoredSceneState();
		if (stored.scenes && stored.scenes.length > 0) {
			console.log("[v0] Restoring scene store from sessionStorage:", stored);
			set({
				scenes: stored.scenes,
				activeSceneId: stored.activeSceneId || "",
				isHydrated: true,
			});
		} else {
			console.log("[v0] No stored scene data, initializing with defaults");
			set({
				scenes: [...DEFAULT_SCENES],
				activeSceneId: "scene-1",
				isHydrated: true,
			});
		}
	},

	setScenes: (scenes: Scene[]) => {
		set((prev) => {
			const newState = { ...prev, scenes };
			saveSceneToStorage(newState);
			return { scenes };
		});
	},

	setActiveSceneId: (id: string) => {
		set((prev) => {
			const newState = { ...prev, activeSceneId: id };
			saveSceneToStorage(newState);
			return { activeSceneId: id };
		});
	},

	addScene: () => {
		const { scenes } = get();
		const newId = `scene-${scenes.length + 1}`;
		const newScene: Scene = {
			id: newId,
			title: `Scene ${scenes.length + 1}`,
			description: "",
			duration: 10,
			cinematicStyles: {
				ambiance: "",
				cameraMovement: "",
				colorTone: "",
				visualStyle: "",
			},
		};

		set((state) => {
			const newState = {
				...state,
				scenes: [...state.scenes, newScene],
			};
			saveSceneToStorage(newState);
			return { scenes: newState.scenes };
		});
	},

	removeScene: (id: string) => {
		const { scenes, activeSceneId } = get();
		const newScenes = scenes.filter((scene) => scene.id !== id);
		let newActiveSceneId = activeSceneId;

		if (activeSceneId === id && newScenes.length > 0) {
			newActiveSceneId = newScenes[0].id;
		}

		const newState = {
			scenes: newScenes,
			activeSceneId: newActiveSceneId,
		};
		saveSceneToStorage({ ...get(), ...newState });
		set(newState);
	},

	updateScene: (id: string, updates: Partial<Scene>) => {
		set((state) => {
			const newState = {
				...state,
				scenes: state.scenes.map((scene) =>
					scene.id === id ? { ...scene, ...updates } : scene,
				),
			};
			saveSceneToStorage(newState);
			return { scenes: newState.scenes };
		});
	},

	initializeScenes: () => {
		const { scenes } = get();
		if (scenes.length === 0) {
			const newState = {
				scenes: [...DEFAULT_SCENES],
				activeSceneId: "scene-1",
			};
			saveSceneToStorage({ ...get(), ...newState });
			set(newState);
		}
	},
}));

console.log(
	"[v0] Scene store initialized with empty state for hydration compatibility",
);
