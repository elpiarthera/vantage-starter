"use client";

import type React from "react";

import { useState } from "react";
import type { Generation } from "../types";

export interface StartT2IOptions {
	prompt: string;
	aspectRatio: string;
}

interface UseImageGenerationProps {
	prompt: string;
	aspectRatio: string;
	image1: File | null;
	image2: File | null;
	image1Url: string;
	image2Url: string;
	useUrls: boolean;
	generations: Generation[];
	setGenerations: React.Dispatch<React.SetStateAction<Generation[]>>;
	addGeneration: (generation: Generation) => Promise<void>;
	onToast: (message: string, type?: "success" | "error") => void;
	onImageUpload: (file: File, imageNumber: 1 | 2) => Promise<void>;
	/** When in T2I mode, call this instead of local stub (Sprint 29 Convex mutation). */
	onStartT2I?: (opts: StartT2IOptions) => Promise<void>;
}

interface GenerateImageOptions {
	prompt?: string;
	aspectRatio?: string;
	image1?: File | null;
	image2?: File | null;
	image1Url?: string;
	image2Url?: string;
	useUrls?: boolean;
}

interface WindowWithWebAudio extends Window {
	webkitAudioContext?: typeof AudioContext;
}
const _playSuccessSound = () => {
	try {
		const Ctx =
			window.AudioContext ?? (window as WindowWithWebAudio).webkitAudioContext;
		if (!Ctx) return;
		const audioContext = new Ctx();

		const oscillator = audioContext.createOscillator();
		const gainNode = audioContext.createGain();

		oscillator.connect(gainNode);
		gainNode.connect(audioContext.destination);

		oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime);

		gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
		gainNode.gain.exponentialRampToValueAtTime(
			0.01,
			audioContext.currentTime + 0.15,
		);

		oscillator.start(audioContext.currentTime);
		oscillator.stop(audioContext.currentTime + 0.15);
	} catch (error) {
		console.log("Could not play sound:", error);
	}
};

export function useImageGeneration({
	prompt,
	aspectRatio,
	image1,
	image2,
	image1Url,
	image2Url,
	useUrls,
	generations,
	setGenerations,
	addGeneration: _addGeneration,
	onToast,
	onImageUpload,
	onStartT2I,
}: UseImageGenerationProps) {
	const [selectedGenerationId, setSelectedGenerationId] = useState<
		string | null
	>(null);
	const [imageLoaded, setImageLoaded] = useState(false);

	const cancelGeneration = (generationId: string) => {
		const generation = generations.find((g) => g.id === generationId);
		if (generation?.abortController) {
			generation.abortController.abort();
		}

		setGenerations((prev) =>
			prev.map((gen) =>
				gen.id === generationId && gen.status === "loading"
					? {
							...gen,
							status: "error" as const,
							error: "Cancelled by user",
							progress: 0,
							abortController: undefined,
						}
					: gen,
			),
		);
		onToast("Generation cancelled", "error");
	};

	const generateImage = async (options?: GenerateImageOptions) => {
		const effectivePrompt = options?.prompt ?? prompt;
		const _effectiveAspectRatio = options?.aspectRatio ?? aspectRatio;
		const effectiveImage1 =
			options?.image1 !== undefined ? options.image1 : image1;
		const effectiveImage2 =
			options?.image2 !== undefined ? options.image2 : image2;
		const effectiveImage1Url =
			options?.image1Url !== undefined ? options.image1Url : image1Url;
		const effectiveImage2Url =
			options?.image2Url !== undefined ? options.image2Url : image2Url;
		const effectiveUseUrls =
			options?.useUrls !== undefined ? options.useUrls : useUrls;

		const hasImages = effectiveUseUrls
			? effectiveImage1Url || effectiveImage2Url
			: effectiveImage1 || effectiveImage2;
		const currentMode = hasImages ? "image-editing" : "text-to-image";

		if (
			currentMode === "image-editing" &&
			!effectiveUseUrls &&
			!effectiveImage1
		) {
			onToast("Please upload at least one image for editing mode", "error");
			return;
		}
		if (
			currentMode === "image-editing" &&
			effectiveUseUrls &&
			!effectiveImage1Url
		) {
			onToast(
				"Please provide at least one image URL for editing mode",
				"error",
			);
			return;
		}
		if (!effectivePrompt.trim()) {
			onToast("Please enter a prompt", "error");
			return;
		}

		// T2I: production path via Convex → fal.ai/Kling (FAL_KEY server-side)
		if (currentMode === "text-to-image" && onStartT2I) {
			await onStartT2I({
				prompt: effectivePrompt.trim(),
				aspectRatio: options?.aspectRatio ?? aspectRatio,
			});
			return;
		}

		if (currentMode === "text-to-image") {
			onToast("Sign in to generate images", "error");
			return;
		}

		// Edit mode: use the Edit tab / ImageEditPanel (Convex I2I action)
		onToast("Use the Edit tab to edit images", "error");
	};

	const loadGeneratedAsInput = async () => {
		const selectedGeneration = generations.find(
			(g) => g.id === selectedGenerationId,
		);
		if (!selectedGeneration?.imageUrl) return;

		try {
			const response = await fetch(selectedGeneration.imageUrl);
			const blob = await response.blob();
			const file = new File([blob], "generated-image.png", {
				type: "image/png",
			});

			await onImageUpload(file, 1);
			onToast("Image loaded into Input 1", "success");
		} catch (error) {
			console.error("Error loading image as input:", error);
			onToast("Error loading image", "error");
		}
	};

	return {
		selectedGenerationId,
		setSelectedGenerationId,
		imageLoaded,
		setImageLoaded,
		generateImage,
		cancelGeneration,
		loadGeneratedAsInput,
	};
}
