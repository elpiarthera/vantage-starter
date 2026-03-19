"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import {
	AlertTriangle,
	Minus,
	Plus,
	Sparkles,
	Wand2,
	X,
	ZoomIn,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { InsufficientCreditsModal } from "@/components/credits/InsufficientCreditsModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useCredits } from "@/hooks/business-logic/useCredits";

interface AITransformModalProps {
	isOpen: boolean;
	onClose: () => void;
	selectedImage: string | null;
	frameType: "start" | "end";
	visualStyle?: string;
	projectId?: Id<"projects">;
	sceneId?: Id<"scenes">;
	onTransformComplete: (imageUrl: string) => void;
	generateAIImage: (prompt: string, referenceImage?: string) => Promise<string>;
}

export function AITransformModal({
	isOpen,
	onClose,
	selectedImage,
	frameType,
	visualStyle,
	projectId,
	sceneId,
	onTransformComplete,
	generateAIImage,
}: AITransformModalProps) {
	const t = useTranslations("asset_selector");
	const { user } = useUser();
	const {
		balance: currentCredits,
		deductCredits,
		refundCredits,
		isProcessing: creditsProcessing,
		isLoading: creditsLoading,
	} = useCredits(user?.id || "");

	const imageGenerationCostData = useQuery(api.credits.getCreditCost, {
		actionType: "image_generation",
	});
	const CREDITS_PER_IMAGE = imageGenerationCostData?.credits ?? 5;

	// Transform state
	const [aiPrompt, setAiPrompt] = useState("");
	const [transformImageCount, setTransformImageCount] = useState(4);
	const [isGenerating, setIsGenerating] = useState(false);
	const [generationProgress, setGenerationProgress] = useState(0);
	const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

	// Insufficient credits modal
	const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] =
		useState(false);
	const [requiredCredits, setRequiredCredits] = useState(0);

	// Generated images state
	const [generatedImages, setGeneratedImages] = useState<string[]>([]);
	const [imageLoadingStates, setImageLoadingStates] = useState<boolean[]>([]);
	const [lightboxImage, setLightboxImage] = useState<string | null>(null);

	// Calculate credits needed
	const transformCreditsNeeded = transformImageCount * CREDITS_PER_IMAGE;

	// Progress simulation
	const startProgressSimulation = useCallback(() => {
		setGenerationProgress(10);
		progressIntervalRef.current = setInterval(() => {
			setGenerationProgress((prev) => {
				if (prev >= 90) return 90;
				return prev + 5;
			});
		}, 10000);
	}, []);

	const stopProgressSimulation = useCallback(() => {
		if (progressIntervalRef.current) {
			clearInterval(progressIntervalRef.current);
			progressIntervalRef.current = null;
		}
		setGenerationProgress(100);
		setTimeout(() => setGenerationProgress(0), 500);
	}, []);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (progressIntervalRef.current) {
				clearInterval(progressIntervalRef.current);
			}
		};
	}, []);

	// Close lightbox on ESC key
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && lightboxImage) {
				setLightboxImage(null);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [lightboxImage]);

	// Reset state when modal opens fresh (not on close, to preserve generated results)
	const prevIsOpenRef = useRef(false);
	useEffect(() => {
		const wasOpen = prevIsOpenRef.current;
		prevIsOpenRef.current = isOpen;
		// Only reset the prompt when opening fresh (no generated images yet)
		if (isOpen && !wasOpen && generatedImages.length === 0) {
			setAiPrompt("");
		}
		// Stop progress simulation if modal is closed while generating
		if (!isOpen && isGenerating) {
			setIsGenerating(false);
			stopProgressSimulation();
		}
	}, [isOpen, isGenerating, generatedImages.length, stopProgressSimulation]);

	const handleTransformImage = async () => {
		if (!aiPrompt.trim() || !selectedImage) {
			toast.error(t("transform.error_no_prompt"));
			return;
		}

		const creditsNeeded = transformImageCount * CREDITS_PER_IMAGE;

		// Check credits (skip if still loading to avoid false negative on mount)
		if (!creditsLoading && currentCredits < creditsNeeded) {
			setRequiredCredits(creditsNeeded);
			setShowInsufficientCreditsModal(true);
			return;
		}

		// Clear previous results when starting a new generation
		setGeneratedImages([]);
		setImageLoadingStates([]);
		setIsGenerating(true);
		startProgressSimulation();

		// Deduct credits
		const deductResult = await deductCredits({
			actionType: "image_generation",
			projectId: projectId as string,
			resourceId: sceneId as string,
		});

		if (!deductResult.success) {
			toast.error(deductResult.error || "Failed to deduct credits");
			setIsGenerating(false);
			stopProgressSimulation();
			return;
		}

		const transactionId = deductResult.transactionId;
		const additionalDeductions: Array<{
			transactionId?: Id<"creditTransactions">;
		}> = [{ transactionId }];

		// Deduct for remaining images
		for (let i = 1; i < transformImageCount; i++) {
			const additionalResult = await deductCredits({
				actionType: "image_generation",
				projectId: projectId as string,
				resourceId: sceneId as string,
			});

			if (!additionalResult.success) {
				// Refund all deductions charged so far before aborting
				for (const deduction of additionalDeductions) {
					if (deduction.transactionId) {
						await refundCredits(
							deduction.transactionId,
							"Multi-image deduction aborted",
						);
					}
				}
				toast.error(additionalResult.error || t("transform.error_failed"));
				setIsGenerating(false);
				stopProgressSimulation();
				return;
			}

			additionalDeductions.push({
				transactionId: additionalResult.transactionId,
			});
		}

		try {
			// Build prompt with visual style
			const enhancedPrompt = visualStyle
				? `${aiPrompt}, ${visualStyle} visual style`
				: aiPrompt;

			// Use allSettled to collect partial successes — transient 504/422 retries may
			// cause some promises to reject while others succeed; we surface whatever landed.
			const results = await Promise.allSettled(
				Array(transformImageCount)
					.fill(null)
					.map(() => generateAIImage(enhancedPrompt, selectedImage)),
			);

			const successfulUrls = results
				.filter(
					(r): r is PromiseFulfilledResult<string> => r.status === "fulfilled",
				)
				.map((r) => r.value);

			const failedCount = results.filter((r) => r.status === "rejected").length;

			if (successfulUrls.length === 0) {
				// All failed — refund everything
				for (const deduction of additionalDeductions) {
					if (deduction.transactionId) {
						await refundCredits(
							deduction.transactionId,
							"Image transformation failed",
						);
					}
				}
				toast.error(t("transform.error_failed"));
				return;
			}

			// Partial success: refund credits for images that failed
			if (failedCount > 0) {
				for (let i = 0; i < failedCount; i++) {
					const deduction =
						additionalDeductions[additionalDeductions.length - 1 - i];
					if (deduction?.transactionId) {
						await refundCredits(
							deduction.transactionId,
							"Partial image transformation failure",
						);
					}
				}
				toast.warning(
					t("transform.partial_success", {
						count: successfulUrls.length,
						total: transformImageCount,
					}),
				);
			} else {
				toast.success(
					t("transform.success", {
						count: successfulUrls.length,
					}),
				);
			}

			setGeneratedImages(successfulUrls);
			setImageLoadingStates(new Array(successfulUrls.length).fill(true));
		} catch (error) {
			console.error("[AITransformModal] Generation failed:", error);
			toast.error(t("transform.error_failed"));

			// Refund credits on unexpected failure
			for (const deduction of additionalDeductions) {
				if (deduction.transactionId) {
					await refundCredits(
						deduction.transactionId,
						"Image transformation failed",
					);
				}
			}
		} finally {
			setIsGenerating(false);
			stopProgressSimulation();
		}
	};

	const handleSelectTransformedImage = (imageUrl: string) => {
		onTransformComplete(imageUrl);
		onClose();
	};

	const handleRemoveGeneratedImage = (indexToRemove: number) => {
		setGeneratedImages((prev) => prev.filter((_, i) => i !== indexToRemove));
		setImageLoadingStates((prev) => prev.filter((_, i) => i !== indexToRemove));
	};

	if (!isOpen) return null;

	return (
		<>
			{/* Modal Overlay */}
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: Modal overlay click to close */}
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="ai-transform-modal-title"
				className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
				onClick={onClose}
			>
				{/* Modal Content */}
				{/* biome-ignore lint/a11y/useKeyWithClickEvents: Stop propagation on modal click */}
				<div
					role="document"
					className="bg-card border border-border rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto"
					onClick={(e) => e.stopPropagation()}
				>
					{/* Header */}
					<div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
						<div className="flex items-center gap-2 min-w-0">
							<Wand2 className="h-5 w-5 text-primary flex-shrink-0" />
							<h2
								id="ai-transform-modal-title"
								className="text-lg font-semibold text-foreground truncate min-w-0"
							>
								{t("transform.modal_title", {
									frameType: t(`frame_type_${frameType}`),
								})}
							</h2>
						</div>
						<div className="flex items-center gap-2">
							{generatedImages.length > 0 && (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => {
										setGeneratedImages([]);
										setImageLoadingStates([]);
										setAiPrompt("");
									}}
									className="text-muted-foreground hover:text-foreground text-xs min-h-[44px]"
								>
									{t("transform.generate_new")}
								</Button>
							)}
							<Button
								variant="ghost"
								size="icon"
								onClick={onClose}
								className="min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground"
							>
								<X className="h-5 w-5" />
							</Button>
						</div>
					</div>

					{/* Body - Two Column Layout on Desktop */}
					<div className="p-4 md:p-6">
						<div className="flex flex-col lg:flex-row gap-6">
							{/* Left Column: Image Preview (Desktop: 35%, Mobile: Full) */}
							<div className="lg:w-[35%] flex-shrink-0">
								{selectedImage && (
									<div className="space-y-2">
										<div className="text-sm font-medium text-foreground">
											{t("transform.selected_image")}
										</div>
										{/* biome-ignore lint/performance/noImgElement: Dynamic selected image URL requires <img> */}
										<img
											src={selectedImage}
											alt={t("transform.selected_image_alt")}
											className="w-full aspect-video object-contain bg-secondary/40 rounded border border-border hover:border-primary transition-colors"
										/>
									</div>
								)}
							</div>

							{/* Right Column: Form (Desktop: 65%, Mobile: Full) */}
							<div className="lg:w-[65%] space-y-5">
								{/* Transform Prompt */}
								<div className="space-y-2">
									<label
										htmlFor="transform-prompt"
										className="text-sm font-medium text-foreground"
									>
										{t("transform.describe_transformation")}
									</label>
									<Textarea
										id="transform-prompt"
										placeholder={t("transform.placeholder")}
										value={aiPrompt}
										onChange={(e) => setAiPrompt(e.target.value)}
										className="bg-background border-border text-foreground placeholder:text-muted-foreground text-base"
										rows={3}
										disabled={isGenerating}
									/>
								</div>

								{/* Image Count Selector - Lighter Weight */}
								<div className="flex items-center justify-between border border-border rounded-lg p-3">
									<span className="text-sm text-muted-foreground">
										{t("transform.images_to_generate")}
									</span>
									<div className="flex items-center gap-3">
										<Button
											type="button"
											variant="ghost"
											size="icon"
											className="h-10 w-10 min-h-[44px] min-w-[44px] text-foreground hover:bg-muted"
											onClick={() =>
												setTransformImageCount(
													Math.max(1, transformImageCount - 1),
												)
											}
											disabled={transformImageCount <= 1 || isGenerating}
										>
											<Minus className="h-4 w-4" />
										</Button>
										<span className="w-8 text-center text-foreground font-medium">
											{transformImageCount}
										</span>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											className="h-10 w-10 min-h-[44px] min-w-[44px] text-foreground hover:bg-muted"
											onClick={() =>
												setTransformImageCount(
													Math.min(4, transformImageCount + 1),
												)
											}
											disabled={transformImageCount >= 4 || isGenerating}
										>
											<Plus className="h-4 w-4" />
										</Button>
									</div>
								</div>

								{/* Progress Indicator */}
								{isGenerating && generationProgress > 0 && (
									<div className="space-y-2">
										<Progress
											value={generationProgress}
											className="h-2 bg-secondary"
										/>
										<p className="text-xs text-muted-foreground text-center">
											{t("transform.progress")}
										</p>
									</div>
								)}

								{/* Insufficient credits inline warning */}
								{!isGenerating &&
									!creditsLoading &&
									currentCredits < transformCreditsNeeded && (
										<div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm">
											<AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
											<div className="flex-1 min-w-0">
												<p className="text-amber-300">
													{t("common.insufficient_credits", {
														required: transformCreditsNeeded,
														available: currentCredits ?? 0,
													})}
												</p>
											</div>
											<Button
												type="button"
												size="sm"
												variant="outline"
												className="flex-shrink-0 min-h-[44px] border-amber-500/40 text-amber-300 hover:bg-amber-500/20 hover:text-amber-200"
												onClick={() => {
													setRequiredCredits(transformCreditsNeeded);
													setShowInsufficientCreditsModal(true);
												}}
											>
												{t("common.buy_credits")}
											</Button>
										</div>
									)}

								{/* Transform Button */}
								<div className="pt-2">
									<Button
										onClick={handleTransformImage}
										disabled={
											!aiPrompt.trim() ||
											!selectedImage ||
											isGenerating ||
											creditsProcessing
										}
										className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 min-h-[44px]"
									>
										<Sparkles className="h-4 w-4 mr-2" />
										{isGenerating
											? t("transform.transforming", {
													count: transformImageCount,
												})
											: t("transform.transform_button", {
													count: transformImageCount,
												})}
										<Badge
											variant="secondary"
											className="ml-2 bg-foreground/20 text-foreground"
										>
											{t("common.credits_badge", {
												credits: transformCreditsNeeded,
											})}
										</Badge>
									</Button>
								</div>
							</div>
						</div>

						{/* Generated Images Grid - Full Width Below */}
						{generatedImages.length > 0 && (
							<div className="mt-8 space-y-3">
								<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
									<h3 className="text-sm font-medium text-foreground">
										{t("transform.generated_options")}
									</h3>
									<p className="text-xs text-muted-foreground">
										{t("transform.select_instruction")}
									</p>
								</div>
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
									{generatedImages.map((imageUrl, index) => (
										<div
											key={`generated-${
												// biome-ignore lint/suspicious/noArrayIndexKey: Generated images have no stable ID
												index
											}`}
											className="relative group"
										>
											{/* Red X Delete Button */}
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													handleRemoveGeneratedImage(index);
												}}
												className="absolute top-1 right-1 min-h-[44px] min-w-[44px] bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full flex items-center justify-center transition-smooth z-20 opacity-100 md:opacity-0 md:group-hover:opacity-100"
												title={t("common.delete_image")}
												aria-label={t("common.delete_image")}
											>
												<X className="h-4 w-4" />
											</button>

											{/* Clickable Image (lightbox) */}
											{/* biome-ignore lint/a11y/useKeyWithClickEvents: Image click for lightbox */}
											{/* biome-ignore lint/performance/noImgElement: Dynamic generated image URL requires <img> */}
											<img
												src={imageUrl}
												alt={t("transform.transformed_image_alt", {
													number: index + 1,
												})}
												className="w-full aspect-video object-contain bg-secondary/40 rounded-t border border-b-0 border-border group-hover:border-primary transition-colors cursor-zoom-in active:opacity-80"
												onClick={() => setLightboxImage(imageUrl)}
												onLoad={() => {
													setImageLoadingStates((prev) => {
														const newStates = [...prev];
														newStates[index] = false;
														return newStates;
													});
												}}
											/>

											{/* Loading Spinner */}
											{imageLoadingStates[index] && (
												<div className="absolute inset-0 flex items-center justify-center bg-secondary rounded-t">
													<div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
												</div>
											)}

											{/* Always-visible "Use this image" CTA */}
											<Button
												onClick={() => handleSelectTransformedImage(imageUrl)}
												className="w-full rounded-t-none rounded-b border border-t-0 border-border group-hover:border-primary bg-primary hover:bg-primary/90 text-primary-foreground min-h-[44px] transition-colors"
											>
												{t("common.select_this_image")}
											</Button>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Full-Size Image Lightbox */}
			{lightboxImage && (
				// biome-ignore lint/a11y/useKeyWithClickEvents: Lightbox click to close
				// biome-ignore lint/a11y/noStaticElementInteractions: Lightbox overlay requires click handler
				<div
					className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
					onClick={() => setLightboxImage(null)}
				>
					<button
						type="button"
						className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 p-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition-colors"
						onClick={() => setLightboxImage(null)}
						aria-label={t("lightbox.close")}
					>
						<X className="h-6 w-6 md:h-8 md:w-8" />
					</button>
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: Stop propagation on image click */}
					{/* biome-ignore lint/performance/noImgElement: Dynamic lightbox image URL requires <img> */}
					<img
						src={lightboxImage}
						alt={t("lightbox.alt")}
						className="max-w-full max-h-full object-contain rounded-lg"
						onClick={(e) => e.stopPropagation()}
					/>
					<div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm flex items-center gap-2">
						<ZoomIn className="h-4 w-4" />
						<span>{t("lightbox.hint")}</span>
					</div>
				</div>
			)}

			{/* Insufficient Credits Modal */}
			<InsufficientCreditsModal
				isOpen={showInsufficientCreditsModal}
				onClose={() => setShowInsufficientCreditsModal(false)}
				required={requiredCredits}
				available={currentCredits}
				actionName={t("action_names.ai_transform")}
				returnUrl={
					typeof window !== "undefined" ? window.location.href : undefined
				}
			/>
		</>
	);
}
