"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useDevice } from "@/contexts/DeviceContext";
import { cn } from "@/lib/utils";
import { ActionBar } from "./ActionBar";
import { ProgressBar } from "./progress-bar";
import type { Generation } from "./types";

interface OutputSectionProps {
	selectedGeneration: Generation | undefined;
	generations: Generation[];
	selectedGenerationId: string | null;
	setSelectedGenerationId: (id: string) => void;
	isConvertingHeic: boolean;
	heicProgress: number;
	imageLoaded: boolean;
	setImageLoaded: (loaded: boolean) => void;
	onCancelGeneration: (id: string) => void;
	onDeleteGeneration: (id: string) => void;
	onOpenFullscreen: () => void;
	onLoadAsInput: () => void;
	onCopy: () => void;
	onDownload: () => void;
	onOpenInNewTab: () => void;
	/** "Use in Video" button: parent provides handler (callback or copy+toast). */
	onUseInVideo: (url: string) => void;
	useInVideoLabel?: string;
	/** Sprint 30d.5: Whether I2I models are available (controls "Use as Input" visibility). */
	hasI2IModels?: boolean;
	/** When provided, show "Save to project" button (image generator save-to-project flow). */
	onSaveToProject?: () => void;
	saveToProjectLabel?: string;
}

export function OutputSection({
	selectedGeneration,
	generations,
	selectedGenerationId,
	setSelectedGenerationId,
	isConvertingHeic,
	heicProgress,
	imageLoaded,
	setImageLoaded,
	onCancelGeneration,
	onDeleteGeneration: _onDeleteGeneration,
	onOpenFullscreen,
	onLoadAsInput,
	onCopy,
	onDownload,
	onOpenInNewTab: _onOpenInNewTab,
	onUseInVideo,
	useInVideoLabel,
	hasI2IModels = true, // Default true for backwards compatibility
	onSaveToProject,
	saveToProjectLabel,
}: OutputSectionProps) {
	const t = useTranslations("image_generator");
	const _resolvedSaveToProjectLabel =
		saveToProjectLabel ?? t("save_to_project");
	const { isMobile, isTablet } = useDevice();
	const isTouchDevice = isMobile || isTablet;
	const _resolvedUseInVideoLabel = useInVideoLabel ?? t("use_in_video");

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const activeElement = document.activeElement;
			const isTyping =
				activeElement?.tagName === "TEXTAREA" ||
				activeElement?.tagName === "INPUT";

			if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && !isTyping) {
				if (generations.length <= 1) return;

				e.preventDefault();
				const currentIndex = generations.findIndex(
					(g) => g.id === selectedGenerationId,
				);
				if (currentIndex === -1 && generations.length > 0) {
					setSelectedGenerationId(generations[0].id);
					return;
				}

				let newIndex: number;
				if (e.key === "ArrowLeft") {
					newIndex = currentIndex - 1;
				} else {
					newIndex = currentIndex + 1;
				}

				if (newIndex >= 0 && newIndex < generations.length) {
					setSelectedGenerationId(generations[newIndex].id);
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [generations, selectedGenerationId, setSelectedGenerationId]);

	const generatedImage =
		selectedGeneration?.status === "complete" && selectedGeneration.imageUrl
			? { url: selectedGeneration.imageUrl, prompt: selectedGeneration.prompt }
			: null;

	return (
		<div className="flex flex-col h-full min-h-0 select-none relative group/output">
			<div className="relative flex-1 min-h-0 flex flex-col">
				{selectedGeneration?.status === "loading" ? (
					<div className="absolute inset-0 flex items-center justify-center bg-background/20">
						<ProgressBar
							progress={selectedGeneration.progress}
							onCancel={() => onCancelGeneration(selectedGeneration.id)}
							runningLabel={t("progress_running")}
							cancelLabel={t("progress_cancel")}
						/>
					</div>
				) : isConvertingHeic ? (
					<div className="absolute inset-0 flex items-center justify-center bg-background/20">
						<ProgressBar
							progress={heicProgress}
							onCancel={() => {}}
							isConverting
							convertingLabel={t("progress_converting")}
							runningLabel={t("progress_running")}
						/>
					</div>
				) : generatedImage ? (
					<>
						{/* Image container - absolute inset-0 only contains the image */}
						<div className="absolute inset-0 flex flex-col select-none">
							<div className="flex-1 flex items-center justify-center relative max-w-full max-h-full overflow-hidden">
								<button
									type="button"
									className="absolute inset-0 w-full h-full flex items-center justify-center cursor-pointer border-0 bg-transparent p-0"
									onClick={onOpenFullscreen}
									aria-label={t("view_fullscreen")}
								>
									<Image
										src={generatedImage.url || "/placeholder.svg"}
										alt={t("generated_alt")}
										width={800}
										height={600}
										className={cn(
											"max-w-full max-h-full transition-all duration-500 ease-out object-contain",
											imageLoaded
												? "opacity-100 scale-100"
												: "opacity-0 scale-95",
										)}
										onLoad={() => setImageLoaded(true)}
										unoptimized
									/>
								</button>
							</div>

							{/* Desktop: Hover overlay - stays inside absolute container */}
							{!isTouchDevice && (
								<div className="flex absolute inset-x-0 bottom-4 justify-center opacity-0 group-hover/output:opacity-100 transition-smooth z-50 pointer-events-none group-hover/output:pointer-events-auto">
									<div className="bg-background/70 backdrop-blur-md rounded-xl p-2 border border-border/30 shadow-lg">
										<ActionBar
											generatedImage={generatedImage}
											hasI2IModels={hasI2IModels}
											onLoadAsInput={onLoadAsInput}
											onCopy={onCopy}
											onDownload={onDownload}
											onUseInVideo={() => onUseInVideo(generatedImage.url)}
											useInVideoLabel={useInVideoLabel}
											onSaveToProject={onSaveToProject}
											saveToProjectLabel={saveToProjectLabel}
										/>
									</div>
								</div>
							)}
						</div>

						{/* Touch: Permanent ActionBar - OUTSIDE absolute container, in normal flow */}
						{isTouchDevice && (
							<div className="mt-auto flex justify-center pt-4 pb-2">
								<div className="bg-background/70 backdrop-blur-md rounded-xl p-2 border border-border/30 shadow-lg">
									<ActionBar
										generatedImage={generatedImage}
										hasI2IModels={hasI2IModels}
										onLoadAsInput={onLoadAsInput}
										onCopy={onCopy}
										onDownload={onDownload}
										onUseInVideo={() => onUseInVideo(generatedImage.url)}
										useInVideoLabel={useInVideoLabel}
										onSaveToProject={onSaveToProject}
										saveToProjectLabel={saveToProjectLabel}
									/>
								</div>
							</div>
						)}
					</>
				) : (
					<div className="absolute inset-0 flex items-center justify-center text-center py-6 select-none bg-background/20">
						<div>
							<div className="w-8 h-8 md:w-16 md:h-16 mx-auto mb-3 border border-border flex items-center justify-center bg-background/50 rounded-lg">
								<svg
									className="w-4 h-4 md:w-8 md:h-8 text-muted-foreground"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-hidden
									role="img"
								>
									<title>{t("image_icon")}</title>
									<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
									<circle cx="8.5" cy="8.5" r="1.5" />
									<polyline points="21,15 16,10 5,21" />
								</svg>
							</div>
							<p className="text-xs text-muted-foreground font-medium leading-relaxed py-1 md:py-2">
								{t("ready_to_generate")}
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
