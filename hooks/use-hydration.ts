"use client";

import { useEffect } from "react";
import { useSceneStore } from "@/stores/scene-store";
import { useVideoStore } from "@/stores/video-store";

export function useHydration() {
	const sceneStore = useSceneStore();
	const videoStore = useVideoStore();

	useEffect(() => {
		console.log("[v0] Running post-hydration state restoration...");

		// Only hydrate once and only on client side
		if (typeof window !== "undefined" && !sceneStore.isHydrated) {
			sceneStore.hydrateFromStorage();
		}

		if (typeof window !== "undefined" && !videoStore.isHydrated) {
			videoStore.hydrateFromStorage();
		}
	}, [sceneStore, videoStore]);

	return {
		isHydrated: sceneStore.isHydrated && videoStore.isHydrated,
	};
}
