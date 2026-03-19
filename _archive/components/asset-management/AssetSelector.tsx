"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import {
	Check,
	ImageIcon,
	Info,
	Minus,
	Plus,
	RotateCcw,
	Sparkles,
	Type,
	Upload,
	Wand2,
	X,
	ZoomIn,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AITransformModal } from "@/components/asset-management/AITransformModal";
import { InsufficientCreditsModal } from "@/components/credits/InsufficientCreditsModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAssetManagement } from "@/hooks/business-logic/useAssetManagement";
import { useCredits } from "@/hooks/business-logic/useCredits";
import { Link } from "@/i18n/routing";

interface AssetSelectorProps {
	onAssetSelect: (assetUrl: string) => void;
	projectId?: Id<"projects">;
	sceneId?: Id<"scenes">;
	assetType?: "image" | "video" | "audio";
	frameType?: "start" | "end";
	visualStyle?: string; // Visual style from Step 2b
}

export function AssetSelector({
	onAssetSelect,
	projectId,
	sceneId,
	assetType = "image",
	frameType = "start",
	visualStyle,
}: AssetSelectorProps) {
	const t = useTranslations("asset_selector");
	const tStyles = useTranslations("visual_styles");
	const _router = useRouter();
	const searchParams = useSearchParams();
	const { user } = useUser();
	const projectIdFromUrl = searchParams.get("projectId");
	const {
		balance: currentCredits,
		deductCredits,
		refundCredits,
		isProcessing: creditsProcessing,
	} = useCredits(user?.id || "");

	const imageGenerationCostData = useQuery(api.credits.getCreditCost, {
		actionType: "image_generation",
	});
	const CREDITS_PER_IMAGE = imageGenerationCostData?.credits ?? 5;

	const {
		assets: projectAssets,
		uploadedAssets,
		uploadAsset,
		generateAIImage,
		loading,
	} = useAssetManagement({
		projectId,
		sceneId,
		assetType,
		frameType,
	});

	const [aiPrompt, setAiPrompt] = useState("");
	const [selectedImageForAI, setSelectedImageForAI] = useState<string | null>(
		null,
	);
	const [isGenerating, setIsGenerating] = useState(false);

	// AI Transform Modal state
	const [isAITransformModalOpen, setIsAITransformModalOpen] = useState(false);
	const [dragActive, setDragActive] = useState(false);
	const [generatedImages, setGeneratedImages] = useState<string[]>([]);
	const [showGeneratedOptions, setShowGeneratedOptions] = useState(false);
	const [currentGenerationPrompt, setCurrentGenerationPrompt] = useState("");
	const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(
		null,
	);
	const [selectedForRegenerate, setSelectedForRegenerate] = useState<
		number | null
	>(null);
	const [imageLoadingStates, setImageLoadingStates] = useState<boolean[]>([]);

	// Image count selector (1-4) for AI Generator
	const [imageCount, setImageCount] = useState(4);

	// Insufficient credits modal
	const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] =
		useState(false);
	const [requiredCredits, setRequiredCredits] = useState(0);

	// Progress indicator for generation
	const [generationProgress, setGenerationProgress] = useState(0);
	const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

	// Lightbox state for full-size image preview
	const [lightboxImage, setLightboxImage] = useState<string | null>(null);

	// Calculate total credits needed for AI Generator
	const totalCreditsNeeded = imageCount * CREDITS_PER_IMAGE;

	// Progress simulation during generation
	const startProgressSimulation = useCallback(() => {
		setGenerationProgress(10);
		progressIntervalRef.current = setInterval(() => {
			setGenerationProgress((prev) => {
				// Cap at 90% until actual completion
				if (prev >= 90) return 90;
				return prev + 5;
			});
		}, 10000); // Increment every 10 seconds
	}, []);

	const stopProgressSimulation = useCallback(() => {
		if (progressIntervalRef.current) {
			clearInterval(progressIntervalRef.current);
			progressIntervalRef.current = null;
		}
		setGenerationProgress(100);
		// Reset after a brief moment
		setTimeout(() => setGenerationProgress(0), 500);
	}, []);

	// Cleanup progress interval on unmount
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

	const handleFileUpload = async (files: FileList | null) => {
		if (!files || files.length === 0) return;

		const file = files[0];
		if (!file.type.startsWith("image/")) return;

		try {
			await uploadAsset(file);
			// Let users choose their action from the grid
		} catch (error) {
			console.error("Upload failed:", error);
		}
	};

	const handleGenerateAI = async (
		referenceImage?: string,
		count: number = imageCount,
	) => {
		if (!aiPrompt.trim()) return;

		// Calculate credits needed
		const creditsNeeded = count * CREDITS_PER_IMAGE;

		// Check if user has enough credits
		if (currentCredits < creditsNeeded) {
			setRequiredCredits(creditsNeeded);
			setShowInsufficientCreditsModal(true);
			return;
		}

		setIsGenerating(true);
		setCurrentGenerationPrompt(aiPrompt);
		startProgressSimulation();

		// Deduct credits before generation
		const deductResult = await deductCredits({
			actionType: "image_generation",
			projectId: projectId as string,
			resourceId: sceneId as string,
		});

		if (!deductResult.success) {
			toast.error(deductResult.error || "Failed to deduct credits");
			setIsGenerating(false);
			return;
		}

		// Track the transaction ID for potential refund
		const transactionId = deductResult.transactionId;

		// We need to deduct for multiple images
		const additionalDeductions: Array<{
			transactionId?: Id<"creditTransactions">;
		}> = [{ transactionId }];

		// Deduct for remaining images (first one already deducted)
		for (let i = 1; i < count; i++) {
			const additionalResult = await deductCredits({
				actionType: "image_generation",
				projectId: projectId as string,
				resourceId: sceneId as string,
			});
			additionalDeductions.push({
				transactionId: additionalResult.transactionId,
			});
		}

		try {
			console.log("[AssetSelector] Starting AI image generation:", {
				count,
				prompt: aiPrompt,
				projectId,
				sceneId,
				visualStyle,
			});

			// Build prompt with visual style if available
			const enhancedPrompt = visualStyle
				? `${aiPrompt}, ${visualStyle} visual style`
				: aiPrompt;

			// Generate the requested number of images
			const generationPromises = Array(count)
				.fill(null)
				.map(() => generateAIImage(enhancedPrompt, referenceImage));

			const generatedUrls = await Promise.all(generationPromises);

			console.log("[AssetSelector] Generation complete, URLs:", generatedUrls);

			setGeneratedImages(generatedUrls);
			setShowGeneratedOptions(true);
			setImageLoadingStates(generatedUrls.map(() => false));

			console.log(
				"[AssetSelector] State updated - showGeneratedOptions:",
				true,
			);

			toast.success(
				t("toast.generated_success", { count, credits: creditsNeeded }),
			);
		} catch (error) {
			console.error("AI generation failed:", error);
			toast.error(t("toast.generation_failed"));

			// Refund all deducted credits on failure
			for (const deduction of additionalDeductions) {
				if (deduction.transactionId) {
					await refundCredits(
						deduction.transactionId,
						"Image generation failed",
					);
				}
			}
			toast.success(t("toast.credits_refunded"));
		} finally {
			stopProgressSimulation();
			setIsGenerating(false);
		}
	};

	const handleSelectGeneratedImage = (imageUrl: string) => {
		console.log("[AssetSelector] handleSelectGeneratedImage called:", {
			imageUrl,
			projectId,
			sceneId,
			frameType,
		});
		onAssetSelect(imageUrl);
		setShowGeneratedOptions(false);
		setGeneratedImages([]);
		setAiPrompt("");
		setSelectedImageForAI(null);
	};

	const handleRegenerate = () => {
		setShowGeneratedOptions(false);
		setGeneratedImages([]);
		setImageLoadingStates([]);
	};

	const handleSelectForRegenerate = (index: number) => {
		setSelectedForRegenerate(index);
		setAiPrompt(currentGenerationPrompt);
	};

	const handleRegenerateSelected = async () => {
		console.log("[AssetSelector] handleRegenerateSelected called", {
			selectedForRegenerate,
			aiPrompt: aiPrompt.trim(),
		});

		if (selectedForRegenerate === null || !aiPrompt.trim()) {
			console.log(
				"[AssetSelector] Early return - selectedForRegenerate:",
				selectedForRegenerate,
				"aiPrompt:",
				aiPrompt.trim(),
			);
			return;
		}

		// Calculate credits needed for regeneration (regenerate all images)
		const regenCount = generatedImages.length;
		const creditsNeeded = regenCount * CREDITS_PER_IMAGE;

		// Check if user has enough credits
		if (currentCredits < creditsNeeded) {
			setRequiredCredits(creditsNeeded);
			setShowInsufficientCreditsModal(true);
			return;
		}

		console.log(
			"[AssetSelector] Starting regeneration for",
			regenCount,
			"images based on selected image",
			selectedForRegenerate,
		);

		// Set loading state for all images
		setImageLoadingStates(Array(regenCount).fill(true));
		setRegeneratingIndex(selectedForRegenerate);

		// Deduct credits for all images
		const deductions: Array<{ transactionId?: Id<"creditTransactions"> }> = [];
		for (let i = 0; i < regenCount; i++) {
			const result = await deductCredits({
				actionType: "image_generation",
				projectId: projectId as string,
				resourceId: sceneId as string,
			});
			deductions.push({ transactionId: result.transactionId });
		}

		try {
			console.log(
				"[AssetSelector] Calling generateAIImage",
				regenCount,
				"times with prompt:",
				aiPrompt,
			);

			// Build prompt with visual style if available
			const enhancedPrompt = visualStyle
				? `${aiPrompt}, ${visualStyle} visual style`
				: aiPrompt;

			// Generate new images
			const generationPromises = Array(regenCount)
				.fill(null)
				.map(() =>
					generateAIImage(enhancedPrompt, selectedImageForAI || undefined),
				);

			const newGeneratedUrls = await Promise.all(generationPromises);

			console.log(
				"[AssetSelector] Generated",
				regenCount,
				"new image URLs:",
				newGeneratedUrls,
			);

			// Replace all images with new ones
			setGeneratedImages(newGeneratedUrls);
			setCurrentGenerationPrompt(aiPrompt);
			console.log("[AssetSelector] Updated all images in array");

			setSelectedForRegenerate(null);

			toast.success(
				t("toast.regenerated_success", {
					count: regenCount,
					credits: creditsNeeded,
				}),
			);
		} catch (error) {
			console.error("[AssetSelector] Regeneration failed:", error);
			toast.error(t("toast.regeneration_failed"));

			// Refund all deducted credits on failure
			for (const deduction of deductions) {
				if (deduction.transactionId) {
					await refundCredits(deduction.transactionId, "Regeneration failed");
				}
			}
			toast.success(t("toast.credits_refunded"));
		} finally {
			console.log("[AssetSelector] Cleaning up regeneration state");
			setRegeneratingIndex(null);
			// Clear loading states for all images
			setImageLoadingStates(Array(regenCount).fill(false));
		}
	};

	const handleDrag = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === "dragenter" || e.type === "dragover") {
			setDragActive(true);
		} else if (e.type === "dragleave") {
			setDragActive(false);
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);
		handleFileUpload(e.dataTransfer.files);
	};

	// Show generated images selection grid
	if (showGeneratedOptions) {
		return (
			<div className="w-full max-w-4xl mx-auto">
				<div className="bg-card border border-border rounded-lg p-4 md:p-6">
					{/* Action-required guidance banner */}
					<div className="flex items-start gap-3 bg-primary/10 border border-primary/30 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
						<Info
							className="h-5 w-5 text-primary flex-shrink-0 mt-0.5"
							aria-hidden="true"
						/>
						<div>
							<p className="text-sm font-semibold text-foreground">
								{t("generated.select_to_continue_title")}
							</p>
							<p className="text-xs text-muted-foreground mt-1">
								{t("generated.select_to_continue_hint")}
							</p>
						</div>
					</div>

					<div className="text-center mb-4 md:mb-6">
						<Sparkles className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-2 md:mb-3 text-primary" />
						<h2 className="text-lg md:text-xl font-semibold text-foreground mb-1 md:mb-2">
							{t("generated.title")}
						</h2>
						<p className="text-sm md:text-base text-muted-foreground leading-relaxed">
							{t("generated.subtitle")}
						</p>
					</div>

					<div className="mb-4 md:mb-6">
						<div className="text-xs md:text-sm text-muted-foreground mb-2">
							{t("generated.from_prompt")}
						</div>
						<div className="bg-secondary border border-border rounded p-2 md:p-3 text-foreground text-xs md:text-sm">
							"{currentGenerationPrompt}"
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
						{generatedImages.map((imageUrl, index) => (
							<Card
								key={`generated-${index}-${imageUrl.slice(-10)}`}
								className={`transition-all ${
									selectedForRegenerate === index
										? "bg-primary/20 border-primary ring-2 ring-primary"
										: "bg-secondary border-border hover:bg-muted"
								}`}
							>
								<CardContent className="p-3 md:p-4">
									{/* biome-ignore lint/a11y/useSemanticElements: Container div needed for image layout, not a simple button */}
									<div
										className="relative group cursor-pointer"
										onClick={(e) => {
											e.stopPropagation();
											if (!imageLoadingStates[index]) {
												setLightboxImage(imageUrl);
											}
										}}
										role="button"
										tabIndex={0}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ") {
												e.preventDefault();
												e.stopPropagation();
												if (!imageLoadingStates[index]) {
													setLightboxImage(imageUrl);
												}
											}
										}}
										title="Click to view full size"
									>
										{/* biome-ignore lint/performance/noImgElement: Dynamic AI-generated image URLs require <img> */}
										<img
											src={imageUrl || "/placeholder.svg"}
											alt={`Generated option ${index + 1}`}
											className={`w-full h-32 md:h-40 object-contain bg-secondary/40 rounded mb-3 transition-opacity hover:opacity-80 pointer-events-none ${
												imageLoadingStates[index] ? "opacity-50" : "opacity-100"
											}`}
											draggable={false}
										/>
										{imageLoadingStates[index] && (
											<div className="absolute inset-0 flex items-center justify-center bg-secondary rounded pointer-events-none">
												<div className="flex flex-col items-center gap-2">
													<div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
													<span className="text-xs text-foreground">
														{t("generated.regenerating")}
													</span>
												</div>
											</div>
										)}
										{/* Zoom indicator */}
										<div className="absolute top-2 right-2 bg-black/50 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
											<ZoomIn className="h-4 w-4 text-white" />
										</div>
									</div>
									<div className="space-y-2">
										<Button
											onClick={() => handleSelectGeneratedImage(imageUrl)}
											className="w-full bg-green-600 hover:bg-green-700 text-white text-sm md:text-base min-h-[44px]"
										>
											<Check className="h-4 w-4 mr-2" />
											{t("generated.select_this")}
										</Button>
										<Button
											onClick={() => handleSelectForRegenerate(index)}
											disabled={
												regeneratingIndex !== null || imageLoadingStates[index]
											}
											className={`w-full text-white text-sm md:text-base min-h-[44px] ${
												selectedForRegenerate === index
													? "bg-purple-700 hover:bg-purple-800"
													: "bg-purple-600 hover:bg-purple-700"
											}`}
										>
											<Sparkles className="h-4 w-4 mr-2" />
											{selectedForRegenerate === index
												? t("generated.selected_for_regen")
												: t("generated.regenerate_this")}
										</Button>
									</div>
								</CardContent>
							</Card>
						))}
					</div>

					<div className="space-y-4">
						{/* Credit info for regeneration */}
						<div className="flex items-center justify-between text-sm bg-secondary border border-border rounded-lg p-3">
							<span className="text-muted-foreground">
								{t("generated.regen_cost", { count: generatedImages.length })}
							</span>
							<Badge
								variant="secondary"
								className="bg-primary/20 text-primary border border-primary/30"
							>
								{t("common.credits_badge", {
									credits: generatedImages.length * CREDITS_PER_IMAGE,
								})}
							</Badge>
						</div>

						<div>
							<label
								htmlFor="regenerate-prompt"
								className="block text-sm font-medium text-foreground mb-2"
							>
								{selectedForRegenerate !== null
									? t("generated.modify_prompt_selected", {
											index: selectedForRegenerate + 1,
											count: generatedImages.length,
										})
									: t("generated.modify_prompt_all", {
											count: generatedImages.length,
										})}
							</label>
							<Textarea
								id="regenerate-prompt"
								placeholder={
									selectedForRegenerate !== null
										? t("generated.modify_prompt_placeholder_selected", {
												count: generatedImages.length,
											})
										: t("generated.modify_prompt_placeholder_all", {
												count: generatedImages.length,
											})
								}
								value={aiPrompt}
								onChange={(e) => setAiPrompt(e.target.value)}
								className="bg-secondary border-border text-foreground placeholder:text-muted-foreground text-sm md:text-base"
								rows={3}
							/>
						</div>

						{/* Credit balance warning */}
						{currentCredits < generatedImages.length * CREDITS_PER_IMAGE && (
							<div className="text-center text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg p-2">
								{t("generated.insufficient_credits_regen", {
									required: generatedImages.length * CREDITS_PER_IMAGE,
									available: currentCredits,
								})}
							</div>
						)}

						<div className="flex flex-col md:flex-row gap-3">
							<Button
								onClick={(e) => {
									e.stopPropagation();
									handleRegenerate();
								}}
								variant="secondary"
								className="flex-1 min-h-[44px]"
							>
								<RotateCcw className="h-4 w-4 mr-2" />
								{t("generated.back_to_edit")}
							</Button>

							{selectedForRegenerate !== null ? (
								<Button
									onClick={() => {
										console.log("[AssetSelector] Regenerate button clicked");
										handleRegenerateSelected();
									}}
									disabled={
										!aiPrompt.trim() ||
										regeneratingIndex !== null ||
										creditsProcessing ||
										currentCredits < generatedImages.length * CREDITS_PER_IMAGE
									}
									className="flex-1 bg-purple-600 hover:bg-purple-700 text-white min-h-[44px] disabled:opacity-50"
								>
									<Sparkles className="h-4 w-4 mr-2" />
									{regeneratingIndex !== null
										? t("generated.regenerating_all", {
												count: generatedImages.length,
											})
										: t("generated.regenerate_all", {
												count: generatedImages.length,
											})}
									<Badge
										variant="secondary"
										className="ml-2 bg-white/20 text-white text-xs"
									>
										{generatedImages.length * CREDITS_PER_IMAGE}
									</Badge>
								</Button>
							) : (
								<Button
									disabled={true}
									className="flex-1 min-h-[44px] bg-muted text-muted-foreground cursor-not-allowed"
								>
									<Sparkles className="h-4 w-4 mr-2" />
									{t("generated.select_to_regen")}
								</Button>
							)}
						</div>
					</div>
				</div>

				{/* Full-size Image Lightbox - must be inside showGeneratedOptions block */}
				{lightboxImage && (
					// biome-ignore lint/a11y/useKeyWithClickEvents: Lightbox click to close
					// biome-ignore lint/a11y/noStaticElementInteractions: Lightbox overlay requires click handler
					<div
						className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
						onClick={() => setLightboxImage(null)}
					>
						<button
							type="button"
							className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
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
			</div>
		);
	}

	// Main tabs view
	return (
		<div className="w-full max-w-6xl mx-auto space-y-4">
			{/* Visual Style Display Banner */}
			{visualStyle && (
				<div className="bg-[#1a2332] border border-[#314d68] rounded-lg p-3 md:p-4">
					<div className="flex items-center justify-between flex-wrap gap-2">
						<div className="flex items-center gap-2">
							<span className="text-sm text-gray-400">
								{t("visual_style_applied") || "Visual Style Applied:"}
							</span>
							<Badge
								variant="secondary"
								className="bg-purple-600/20 text-purple-300 border border-purple-500/30"
							>
								{tStyles(visualStyle) || visualStyle}
							</Badge>
						</div>
						{projectIdFromUrl && (
							<Link
								href={`/guided/step-2b?projectId=${projectIdFromUrl}`}
								className="text-xs md:text-sm text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
							>
								{t("change_visual_style") || "Change Style"}
								<RotateCcw className="h-3 w-3 md:h-4 md:w-4" />
							</Link>
						)}
					</div>
				</div>
			)}

			<Tabs defaultValue="project-assets" className="w-full">
				<TabsList className="grid w-full grid-cols-3 bg-[#223649] border-[#314d68] text-sm">
					<TabsTrigger
						value="project-assets"
						className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-[#314d68] text-xs md:text-sm"
					>
						{t("tabs.project_assets")}
					</TabsTrigger>
					<TabsTrigger
						value="upload-new"
						className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-[#314d68] text-xs md:text-sm"
					>
						{t("tabs.upload_new")}
					</TabsTrigger>
					<TabsTrigger
						value="generate-ai"
						className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-[#314d68] text-xs md:text-sm"
					>
						<Sparkles className="h-3 w-3 md:h-4 md:w-4 mr-1" />
						{t("tabs.ai_generator")}
					</TabsTrigger>
				</TabsList>

				{/* Project Assets Tab */}
				<TabsContent value="project-assets" className="mt-4">
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
						<div className="lg:col-span-2 space-y-4">
							<div className="bg-[#1a2332] border border-[#314d68] rounded-lg p-3 md:p-4">
								<h3 className="text-white font-medium mb-2 text-sm md:text-base">
									{t("project_assets.choose_how")}
								</h3>
								<div className="grid grid-cols-1 gap-3">
									<div className="flex items-center gap-3 p-3 bg-blue-600/10 border border-blue-600/30 rounded-lg">
										<ImageIcon className="h-4 w-4 md:h-5 md:w-5 text-blue-400 flex-shrink-0" />
										<div>
											<div className="text-xs md:text-sm font-medium text-white">
												{t("project_assets.use_as_is")}
											</div>
											<div className="text-xs text-gray-300">
												{t("project_assets.use_as_is_desc")}
											</div>
										</div>
									</div>
									<div className="flex items-center gap-3 p-3 bg-purple-600/10 border border-purple-600/30 rounded-lg">
										<Wand2 className="h-4 w-4 md:h-5 md:w-5 text-purple-400 flex-shrink-0" />
										<div>
											<div className="text-xs md:text-sm font-medium text-white">
												{t("project_assets.recreate_with_ai")}
											</div>
											<div className="text-xs text-gray-300">
												{t("project_assets.recreate_desc")}
											</div>
										</div>
									</div>
								</div>
							</div>

							{loading ? (
								<div className="flex items-center justify-center py-12">
									<div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-400 border-t-transparent" />
									<span className="ml-2 text-gray-400">
										{t("common.loading_assets")}
									</span>
								</div>
							) : projectAssets.length === 0 ? (
								<div className="text-center py-12 text-gray-400">
									<ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
									<p className="text-sm">{t("common.no_assets")}</p>
									<p className="text-xs mt-2 leading-relaxed">
										{t("common.no_assets_hint")}
									</p>
								</div>
							) : (
								<div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 max-h-96 overflow-y-auto">
									{projectAssets.map((asset) => (
										<Card
											key={asset._id}
											className="bg-[#223649] border-[#314d68] hover:bg-[#314d68] transition-all"
										>
											<CardContent className="p-2 md:p-3">
												{/* biome-ignore lint/a11y/useKeyWithClickEvents: Image click for preview */}
												{/* biome-ignore lint/performance/noImgElement: Dynamic Convex asset URLs require <img> */}
												<img
													src={asset.url || "/placeholder.svg"}
													alt={asset.filename}
													className="w-full h-20 md:h-24 object-contain bg-secondary/40 rounded mb-2 cursor-pointer hover:opacity-80 transition-opacity"
													onClick={() => setLightboxImage(asset.url)}
													title="Click to view full size"
												/>
												<p className="text-xs text-muted-foreground truncate mb-2 md:mb-3 leading-relaxed">
													{asset.filename}
												</p>

												<div className="space-y-1.5 md:space-y-2">
													<Button
														onClick={() => onAssetSelect(asset.url)}
														className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs min-h-[44px]"
													>
														<ImageIcon className="h-3 w-3 mr-1" />
														{t("common.use_image")}
													</Button>
													<Button
														onClick={() => {
															setSelectedImageForAI(asset.url);
															setIsAITransformModalOpen(true);
														}}
														className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs min-h-[44px]"
													>
														<Wand2 className="h-3 w-3 mr-1" />
														{t("common.ai_transform")}
													</Button>
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							)}
						</div>
					</div>
				</TabsContent>

				{/* Upload New Tab */}
				<TabsContent value="upload-new" className="mt-4">
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
						<div className="lg:col-span-2 space-y-4">
							<div className="bg-[#1a2332] border border-[#314d68] rounded-lg p-3 md:p-4">
								<h3 className="text-white font-medium mb-2 text-sm md:text-base">
									{t("upload.choose_how")}
								</h3>
								<div className="grid grid-cols-1 gap-3">
									<div className="flex items-center gap-3 p-3 bg-blue-600/10 border border-blue-600/30 rounded-lg">
										<Upload className="h-4 w-4 md:h-5 md:w-5 text-blue-400 flex-shrink-0" />
										<div>
											<div className="text-xs md:text-sm font-medium text-white">
												{t("upload.upload_use")}
											</div>
											<div className="text-xs text-gray-300">
												{t("upload.upload_use_desc")}
											</div>
										</div>
									</div>
									<div className="flex items-center gap-3 p-3 bg-purple-600/10 border border-purple-600/30 rounded-lg">
										<Wand2 className="h-4 w-4 md:h-5 md:w-5 text-purple-400 flex-shrink-0" />
										<div>
											<div className="text-xs md:text-sm font-medium text-white">
												{t("upload.upload_transform")}
											</div>
											<div className="text-xs text-gray-300">
												{t("upload.upload_transform_desc")}
											</div>
										</div>
									</div>
								</div>
							</div>

							{/* biome-ignore lint/a11y/noStaticElementInteractions: Dropzone requires div */}
							{/* biome-ignore lint/a11y/useKeyWithClickEvents: Dropzone keyboard handled by button inside */}
							<div
								className={`border-2 border-dashed rounded-lg p-4 md:p-8 text-center transition-colors cursor-pointer ${
									dragActive
										? "border-blue-500 bg-blue-500/10"
										: "border-[#314d68] hover:border-[#4a6b8a] hover:bg-[#1a2332]"
								}`}
								onDragEnter={handleDrag}
								onDragLeave={handleDrag}
								onDragOver={handleDrag}
								onDrop={handleDrop}
								onClick={() => document.getElementById("file-upload")?.click()}
							>
								<Upload className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-2 md:mb-4 text-gray-400 pointer-events-none" />
								<h3 className="text-base md:text-lg font-medium text-white mb-1 md:mb-2">
									{t("upload.title")}
								</h3>
								<p className="text-sm text-gray-400 mb-3 md:mb-4">
									{t("upload.dropzone_text")}
								</p>
								<Input
									type="file"
									accept="image/*"
									onChange={(e) => handleFileUpload(e.target.files)}
									className="hidden"
									id="file-upload"
								/>
								<Button
									onClick={(e) => e.stopPropagation()}
									className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 md:py-2 pointer-events-none"
									tabIndex={-1}
									aria-hidden="true"
								>
									{t("upload.choose_files")}
								</Button>
							</div>

							{uploadedAssets.length > 0 && (
								<div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 max-h-96 overflow-y-auto">
									{uploadedAssets.map((asset) => (
										<Card
											key={asset._id}
											className="bg-[#223649] border-[#314d68] hover:bg-[#314d68] transition-all"
										>
											<CardContent className="p-2 md:p-3">
												{/* biome-ignore lint/a11y/useKeyWithClickEvents: Image click for preview */}
												{/* biome-ignore lint/performance/noImgElement: Dynamic Convex asset URLs require <img> */}
												<img
													src={asset.url || "/placeholder.svg"}
													alt={asset.filename}
													className="w-full h-20 md:h-24 object-contain bg-secondary/40 rounded mb-2 cursor-pointer hover:opacity-80 transition-opacity"
													onClick={() => setLightboxImage(asset.url)}
													title="Click to view full size"
												/>
												<p className="text-xs text-muted-foreground truncate mb-2 md:mb-3 leading-relaxed">
													{asset.filename}
												</p>

												<div className="space-y-1.5 md:space-y-2">
													<Button
														onClick={() => onAssetSelect(asset.url)}
														className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs min-h-[44px]"
													>
														<ImageIcon className="h-3 w-3 mr-1" />
														{t("common.use_image")}
													</Button>
													<Button
														onClick={() => {
															setSelectedImageForAI(asset.url);
															setIsAITransformModalOpen(true);
														}}
														className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs min-h-[44px]"
													>
														<Wand2 className="h-3 w-3 mr-1" />
														{t("common.ai_transform")}
													</Button>
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							)}
						</div>
					</div>
				</TabsContent>

				{/* AI Generator Tab */}
				<TabsContent value="generate-ai" className="mt-4">
					<div className="max-w-2xl mx-auto space-y-4 md:space-y-6">
						<div className="bg-[#1a2332] border border-[#314d68] rounded-lg p-4 md:p-6">
							<div className="text-center mb-4 md:mb-6">
								<Sparkles className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-2 md:mb-3 text-purple-400" />
								<h2 className="text-lg md:text-xl font-semibold text-white mb-1 md:mb-2">
									{t("generator.title")}
								</h2>
								<p className="text-sm md:text-base text-gray-300">
									{t("generator.subtitle")}
								</p>
							</div>

							<div className="space-y-4">
								<div>
									<label
										htmlFor="ai-prompt"
										className="block text-sm font-medium text-white mb-2"
									>
										{t("generator.describe_label")}
									</label>
									<Textarea
										id="ai-prompt"
										placeholder={t("generator.placeholder")}
										value={aiPrompt}
										onChange={(e) => setAiPrompt(e.target.value)}
										className="bg-[#223649] border-[#314d68] text-white placeholder:text-gray-400 text-sm md:text-base"
										rows={4}
									/>
								</div>

								{/* Image Count Selector */}
								<div className="bg-[#223649] border border-[#314d68] rounded-lg p-3 md:p-4">
									<div className="flex items-center justify-between mb-3">
										<label
											htmlFor="image-count"
											className="text-sm font-medium text-white"
										>
											{t("generator.image_count_label")}
										</label>
										<Badge
											variant="secondary"
											className="bg-purple-600/20 text-purple-300 border border-purple-500/30"
										>
											{t("common.credits_badge", {
												credits: totalCreditsNeeded,
											})}
										</Badge>
									</div>
									<div className="flex items-center justify-center gap-4">
										<Button
											type="button"
											variant="outline"
											onClick={() =>
												setImageCount((prev) => Math.max(1, prev - 1))
											}
											disabled={imageCount <= 1 || isGenerating}
											className="h-11 w-11 p-0 bg-[#1a2332] border-[#314d68] text-white hover:bg-[#314d68]"
										>
											<Minus className="h-4 w-4" />
										</Button>
										<div className="flex items-center gap-2">
											<span className="text-2xl font-bold text-white w-8 text-center">
												{imageCount}
											</span>
											<span className="text-sm text-gray-400">
												{t("generator.images_unit", { count: imageCount })}
											</span>
										</div>
										<Button
											type="button"
											variant="outline"
											onClick={() =>
												setImageCount((prev) => Math.min(4, prev + 1))
											}
											disabled={imageCount >= 4 || isGenerating}
											className="h-11 w-11 p-0 bg-[#1a2332] border-[#314d68] text-white hover:bg-[#314d68]"
										>
											<Plus className="h-4 w-4" />
										</Button>
									</div>
									<div className="text-center mt-2 text-xs text-gray-400">
										{t("generator.credits_per_image", {
											credits: CREDITS_PER_IMAGE,
										})}
									</div>
								</div>

								{/* Credit Balance Display */}
								<div className="flex items-center justify-between text-sm">
									<span className="text-gray-400">
										{t("generator.your_balance")}
									</span>
									<span
										className={`font-medium ${currentCredits >= totalCreditsNeeded ? "text-green-400" : "text-red-400"}`}
									>
										{t("generator.credits_display", {
											credits: currentCredits,
										})}
									</span>
								</div>

								<div className="bg-[#223649] border border-[#314d68] rounded-lg p-3 md:p-4">
									<div className="flex items-center gap-2 mb-2">
										<Info className="h-4 w-4 text-blue-400" />
										<span className="text-xs md:text-sm font-medium text-white">
											{t("generator.tips_title")}
										</span>
									</div>
									<ul className="text-xs md:text-sm text-gray-300 space-y-1">
										<li>• {t("generator.tip_1")}</li>
										<li>• {t("generator.tip_2")}</li>
										<li>• {t("generator.tip_3")}</li>
										<li>• {t("generator.tip_4")}</li>
									</ul>
								</div>

								{/* Progress indicator */}
								{isGenerating && generationProgress > 0 && (
									<div className="space-y-2">
										<Progress
											value={generationProgress}
											className="h-2 bg-[#223649]"
										/>
										<p className="text-xs text-gray-400 text-center">
											{t("generator.progress")}
										</p>
									</div>
								)}

								<Button
									onClick={() => handleGenerateAI(undefined, imageCount)}
									disabled={
										!aiPrompt.trim() ||
										isGenerating ||
										creditsProcessing ||
										currentCredits < totalCreditsNeeded
									}
									className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 md:py-4 text-base md:text-lg disabled:opacity-50"
								>
									<Sparkles className="h-4 w-4 md:h-5 md:w-5 mr-2" />
									{isGenerating
										? t("generator.creating_options", { count: imageCount })
										: t("generator.generate_button", { count: imageCount })}
									<Badge
										variant="secondary"
										className="ml-2 bg-white/20 text-white"
									>
										{t("common.credits_badge", { credits: totalCreditsNeeded })}
									</Badge>
								</Button>

								{currentCredits < totalCreditsNeeded && (
									<div className="text-center text-sm text-red-400">
										{t("common.insufficient_credits", {
											required: totalCreditsNeeded,
											available: currentCredits,
										})}
									</div>
								)}

								<div className="text-center">
									<div className="flex items-center gap-2 justify-center text-xs md:text-sm text-gray-400">
										<Type className="h-3 w-3 md:h-4 md:w-4" />
										<span>
											{t("generator.creates_description", {
												count: imageCount,
											})}
										</span>
									</div>
									<div className="mt-2 text-xs text-gray-500">
										{t("generator.modify_hint")}
									</div>
								</div>
							</div>
						</div>
					</div>
				</TabsContent>
			</Tabs>

			{/* Insufficient Credits Modal */}
			<InsufficientCreditsModal
				isOpen={showInsufficientCreditsModal}
				onClose={() => setShowInsufficientCreditsModal(false)}
				required={requiredCredits}
				available={currentCredits}
				actionName={t("action_names.image_generation")}
				returnUrl={
					typeof window !== "undefined" ? window.location.href : undefined
				}
			/>

			{/* Full-size Image Lightbox */}
			{lightboxImage && (
				// biome-ignore lint/a11y/useKeyWithClickEvents: Lightbox click to close
				// biome-ignore lint/a11y/noStaticElementInteractions: Lightbox overlay requires click handler
				<div
					className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
					onClick={() => setLightboxImage(null)}
				>
					<button
						type="button"
						className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors min-h-[44px] min-w-[44px]"
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

			{/* AI Transform Modal */}
			<AITransformModal
				isOpen={isAITransformModalOpen}
				onClose={() => {
					setIsAITransformModalOpen(false);
					setSelectedImageForAI(null);
				}}
				selectedImage={selectedImageForAI}
				frameType={frameType}
				visualStyle={visualStyle}
				projectId={projectId}
				sceneId={sceneId}
				onTransformComplete={(imageUrl) => {
					onAssetSelect(imageUrl);
					setIsAITransformModalOpen(false);
					setSelectedImageForAI(null);
				}}
				generateAIImage={generateAIImage}
			/>
		</div>
	);
}
