"use client";

import { useUser } from "@clerk/nextjs";
import { useAction, useMutation, useQuery } from "convex/react";
import {
	CheckCircle,
	Clapperboard,
	Download,
	Play,
	RefreshCw,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { InsufficientCreditsModal } from "@/components/credits/InsufficientCreditsModal";
import type { Scene } from "@/components/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VideoRegenerationChat } from "@/components/video-generation/VideoRegenerationChat";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useCredits } from "@/hooks/business-logic/useCredits";
import { useVideoRegeneration } from "@/hooks/business-logic/useVideoRegeneration";
import { useVideoStatus } from "@/hooks/business-logic/useVideoStatus";

interface VideoGeneratorProps {
	sceneId: string;
	projectId: string;
	startFrameImage: string;
	endFrameImage: string;
	duration: 5 | 10;
	cinematicStyles: Scene["cinematicStyles"];
	/** Scene title for display and regeneration chat */
	sceneTitle: string;
	/** Scene description for video generation prompt */
	sceneDescription: string;
	// Project-level context from Step 1 & Step 2b
	/** Step 2b: Visual style (cinematic, vintage, storyboard, low key, etc.) */
	visualStyle?: string;
	/** Step 1: Occasion (wedding, birthday, corporate, etc.) */
	occasion?: string;
	/** Step 1: Theme (romantic, fun, professional, etc.) */
	theme?: string;
	/** Step 1: "Shape the Emotion" user input */
	emotionalStory?: string;
	/** Validation state from parent (derived from Convex) - if provided, overrides local state */
	isValidated?: boolean;
	// Callbacks
	onValidateVideo?: (sceneId: string) => void;
	onGenerateVideo?: (sceneId: string) => void;
	onRegenerateApproved?: (sceneId: string, feedback: string) => void;
}

export function VideoGenerator({
	sceneId,
	projectId,
	startFrameImage,
	endFrameImage,
	duration,
	cinematicStyles,
	sceneTitle,
	sceneDescription,
	visualStyle,
	occasion,
	theme,
	emotionalStory,
	isValidated: isValidatedProp,
	onValidateVideo,
	onGenerateVideo,
	onRegenerateApproved,
}: VideoGeneratorProps) {
	const { user } = useUser();
	const t = useTranslations("video_generator");
	const [isRegenerationChatOpen, setIsRegenerationChatOpen] = useState(false);
	const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] =
		useState(false);
	const [toastMessage, setToastMessage] = useState<string | null>(null);

	// Validation state comes directly from Convex via prop
	const isValidated = isValidatedProp ?? false;

	// Credit system
	const videoGenerationCostData = useQuery(api.credits.getCreditCost, {
		actionType: "video_generation",
	});
	const VIDEO_GENERATION_CREDITS = videoGenerationCostData?.credits ?? 20;
	const { balance: currentCredits } = useCredits(user?.id || "");
	const deductCredits = useMutation(api.credits.deductCreditsPublic);
	const refundCredits = useMutation(api.credits.refundCreditsPublic);

	// Real-time video status from Convex
	const {
		generationStatus,
		progress,
		videoUrl,
		isGenerating,
		isCompleted,
		isFailed,
		error: generationError,
		cost,
	} = useVideoStatus(sceneId as Id<"scenes">);

	const [stageIndex, setStageIndex] = useState(0);

	useEffect(() => {
		if (generationStatus !== "in_progress") {
			setStageIndex(0);
			return;
		}
		const interval = setInterval(() => {
			setStageIndex((i) => Math.min(i + 1, 3));
		}, 20000);
		return () => clearInterval(interval);
	}, [generationStatus]);

	// Video regeneration hook
	const { regenerate, regenerationCount, canRegenerate, maxRegenerations } =
		useVideoRegeneration(sceneId as Id<"scenes">);

	// Video generation action
	const generateVideoAction = useAction(
		api.actions.videoGeneration.generateVideo,
	);

	// Video polling action - polls fal.ai and updates Convex
	const pollVideoStatusAction = useAction(
		api.actions.videoPolling.pollVideoStatus,
	);

	// Polling interval ref
	const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

	// Poll for video status when generation is in progress
	useEffect(() => {
		// Start polling when generation is in progress
		if (isGenerating && sceneId) {
			console.log("[VideoGenerator] Starting video status polling...");

			// Poll immediately, then every 10 seconds
			const poll = async () => {
				try {
					console.log("[VideoGenerator] Polling fal.ai for status...");
					const result = await pollVideoStatusAction({
						sceneId: sceneId as Id<"scenes">,
					});
					console.log(
						"[VideoGenerator] Poll result:",
						result.status,
						result.message,
					);

					// Stop polling if completed or failed
					if (result.status === "completed" || result.status === "failed") {
						console.log(
							"[VideoGenerator] Generation finished, stopping polling",
						);
						if (pollingIntervalRef.current) {
							clearInterval(pollingIntervalRef.current);
							pollingIntervalRef.current = null;
						}
					}
				} catch (error) {
					console.error("[VideoGenerator] Polling error:", error);
				}
			};

			// Poll immediately
			poll();

			// Then poll every 10 seconds
			pollingIntervalRef.current = setInterval(poll, 10000);
		}

		// Cleanup on unmount or when generation stops
		return () => {
			if (pollingIntervalRef.current) {
				console.log("[VideoGenerator] Cleaning up polling interval");
				clearInterval(pollingIntervalRef.current);
				pollingIntervalRef.current = null;
			}
		};
	}, [isGenerating, sceneId, pollVideoStatusAction]);

	// Generate video handler
	const handleGenerateVideo = async () => {
		if (!user?.id) return;

		// Check credits first
		if (currentCredits < VIDEO_GENERATION_CREDITS) {
			setShowInsufficientCreditsModal(true);
			return;
		}

		let transactionId: Id<"creditTransactions"> | undefined;

		try {
			// Deduct credits before generation
			const deductResult = await deductCredits({
				clerkUserId: user.id,
				actionType: "video_generation",
				projectId,
			});

			if (!deductResult.success) {
				if (deductResult.error === "Insufficient credits") {
					setShowInsufficientCreditsModal(true);
				} else {
					console.error(
						"[VideoGenerator] Credit deduction failed:",
						deductResult.error,
					);
				}
				return;
			}
			transactionId = deductResult.transactionId;

			if (onGenerateVideo) {
				onGenerateVideo(sceneId);
			}

			console.log(
				"[VideoGenerator] Starting video generation for scene:",
				sceneId,
			);

			await generateVideoAction({
				sceneId: sceneId as Id<"scenes">,
				sceneDescription: sceneDescription,
				startFrameUrl: startFrameImage,
				endFrameUrl: endFrameImage,
				cinematicStyles: cinematicStyles
					? [
							cinematicStyles.ambiance,
							cinematicStyles.cameraMovement,
							cinematicStyles.colorTone,
							cinematicStyles.visualStyle,
						].filter(Boolean)
					: undefined,
				duration,
				// Project-level context from Step 1 & Step 2b
				visualStyle,
				occasion,
				theme,
				emotionalStory,
			});

			console.log("[VideoGenerator] Video generation started successfully");
		} catch (error) {
			console.error("[VideoGenerator] Video generation failed:", error);

			// Refund credits on failure
			if (transactionId) {
				try {
					await refundCredits({
						transactionId,
						reason: "Video generation failed",
					});
					console.log("[VideoGenerator] Credits refunded");
				} catch (refundError) {
					console.error(
						"[VideoGenerator] Failed to refund credits:",
						refundError,
					);
				}
			}
		}
	};

	// Regenerate video handler
	const handleRegenerateVideoClick = useCallback(() => {
		console.log("[VideoGenerator] Regenerate Video button clicked");
		console.log(
			"[VideoGenerator] Current regeneration count:",
			regenerationCount,
		);

		if (!canRegenerate) {
			console.log("[VideoGenerator] Maximum regeneration limit reached");
			setToastMessage(t("max_regenerations_alert", { max: maxRegenerations }));
			setTimeout(() => setToastMessage(null), 4000);
			return;
		}

		// Check credits before opening modal
		if (currentCredits < VIDEO_GENERATION_CREDITS) {
			setShowInsufficientCreditsModal(true);
			return;
		}

		console.log("[VideoGenerator] Opening regeneration chat modal");
		setIsRegenerationChatOpen(true);
	}, [
		regenerationCount,
		canRegenerate,
		maxRegenerations,
		currentCredits,
		VIDEO_GENERATION_CREDITS,
		t,
	]);

	// Handle regeneration approval
	const handleRegenerateApproved = useCallback(
		async (sceneId: string, feedback: string) => {
			if (!user?.id) return;

			console.log(
				"[VideoGenerator] Regenerating video with feedback:",
				feedback,
			);

			let transactionId: Id<"creditTransactions"> | undefined;

			try {
				// Deduct credits before regeneration
				const deductResult = await deductCredits({
					clerkUserId: user.id,
					actionType: "video_regeneration",
					projectId,
				});

				if (!deductResult.success) {
					if (deductResult.error === "Insufficient credits") {
						setShowInsufficientCreditsModal(true);
					} else {
						console.error(
							"[VideoGenerator] Credit deduction failed:",
							deductResult.error,
						);
					}
					return;
				}
				transactionId = deductResult.transactionId;

				setIsRegenerationChatOpen(false);

				if (onRegenerateApproved) {
					onRegenerateApproved(sceneId, feedback);
				}

				await regenerate({
					feedback,
					sceneDescription: sceneDescription,
					cinematicStyles: cinematicStyles
						? [
								cinematicStyles.ambiance,
								cinematicStyles.cameraMovement,
								cinematicStyles.colorTone,
								cinematicStyles.visualStyle,
							].filter(Boolean)
						: undefined,
				});

				console.log("[VideoGenerator] Video regeneration started successfully");
			} catch (error) {
				console.error("[VideoGenerator] Video regeneration failed:", error);

				// Refund credits on failure
				if (transactionId) {
					try {
						await refundCredits({
							transactionId,
							reason: "Video regeneration failed",
						});
						console.log("[VideoGenerator] Credits refunded");
					} catch (refundError) {
						console.error(
							"[VideoGenerator] Failed to refund credits:",
							refundError,
						);
					}
				}
			}
		},
		[
			sceneDescription,
			cinematicStyles,
			regenerate,
			onRegenerateApproved,
			user?.id,
			deductCredits,
			refundCredits,
			projectId,
		],
	);

	// Validate video handler - calls parent to save to Convex
	const handleValidateVideo = useCallback(() => {
		console.log("[VideoGenerator] Validating video for scene:", sceneId);
		if (onValidateVideo) {
			console.log("[VideoGenerator] Calling parent validateVideo function");
			onValidateVideo(sceneId);
		} else {
			console.warn(
				"[VideoGenerator] No onValidateVideo prop provided - validation will not persist",
			);
		}
	}, [sceneId, onValidateVideo]);

	// Download video handler - fetch blob to force download on cross-origin URLs
	const handleDownloadVideo = useCallback(async () => {
		if (videoUrl) {
			try {
				// Fetch the video as a blob to bypass cross-origin download restrictions
				const response = await fetch(videoUrl);
				const blob = await response.blob();
				const blobUrl = URL.createObjectURL(blob);

				const link = document.createElement("a");
				link.href = blobUrl;
				link.download = `scene-${sceneId}-video.mp4`;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);

				// Clean up blob URL
				URL.revokeObjectURL(blobUrl);
			} catch (error) {
				console.error("[VideoGenerator] Download failed:", error);
				// Fallback: open in new tab
				window.open(videoUrl, "_blank");
			}
		}
	}, [videoUrl, sceneId]);

	// Close modal handler
	const handleCloseModal = useCallback(() => {
		console.log("[VideoGenerator] Closing regeneration chat modal");
		setIsRegenerationChatOpen(false);
	}, []);

	return (
		<>
			<Card className="bg-[#182634] border-[#223649]">
				<CardHeader>
					<CardTitle className="text-white flex items-center gap-2">
						<Play className="h-5 w-5" />
						{t("title")}
						{cost && (
							<span className="text-sm text-gray-400 ml-auto">
								${cost.toFixed(2)}
							</span>
						)}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 min-h-[280px]">
					{/* Idle State - Ready to Generate */}
					{!isGenerating && !isCompleted && !isFailed && (
						<div className="text-center py-8">
							<div className="w-16 h-16 bg-[#1a3a52] rounded-full flex items-center justify-center mx-auto mb-4">
								<Clapperboard className="h-8 w-8 text-[#0d7ff2]" />
							</div>
							<p className="text-white font-medium mb-2">
								{t("ready_to_generate")}
							</p>
							<p className="text-sm text-gray-400 mb-4">
								{t("create_video_description", { duration })}
							</p>
							<Button
								onClick={handleGenerateVideo}
								className="bg-[#0d7ff2] hover:bg-blue-600 text-white px-6 py-2 min-h-[44px]"
								disabled={!startFrameImage || !endFrameImage}
								aria-label={t("generate_button_aria")}
							>
								{t("generate_scene_video")}
								<Badge variant="secondary" className="ml-2 bg-blue-700">
									{t("credits_badge", { credits: VIDEO_GENERATION_CREDITS })}
								</Badge>
							</Button>
						</div>
					)}

					{/* Generating State - In Progress */}
					{isGenerating && (
						<div className="text-center py-8">
							{/* Container with overflow-hidden to prevent animate-ping from causing scrollbar */}
							<div className="relative w-20 h-20 mx-auto mb-4 overflow-hidden">
								<div className="absolute inset-2 bg-[#0d7ff2] rounded-full flex items-center justify-center">
									<svg
										className="w-8 h-8 text-white animate-spin"
										fill="none"
										viewBox="0 0 24 24"
										role="img"
										aria-label="Loading spinner"
									>
										<title>Loading spinner</title>
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
										/>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 108-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										/>
									</svg>
								</div>
								{/* Pulse ring - contained within overflow-hidden parent */}
								<div className="absolute inset-0 border-2 border-[#0d7ff2] rounded-full animate-ping opacity-20" />
							</div>
							<p className="text-white font-medium mb-2">
								{t("generating_title")}
							</p>
							<p className="text-sm text-gray-400 mb-4">
								{generationStatus === "pending" && t("queued_status")}
								{generationStatus === "in_progress" &&
									t(`generation_stage_${stageIndex}`)}
							</p>
							{/* Always render progress bar to prevent layout shift */}
							<div
								className={`mt-4 w-48 bg-[#314d68] rounded-full h-2 mx-auto transition-opacity duration-300 ${
									progress > 0 ? "opacity-100" : "opacity-0"
								}`}
								role="progressbar"
								aria-valuenow={progress}
								aria-valuemin={0}
								aria-valuemax={100}
								aria-label={t("progress_aria_label", { progress })}
							>
								<div
									className="bg-[#0d7ff2] h-2 rounded-full transition-all duration-300"
									style={{ width: `${progress}%` }}
								/>
							</div>
							<p className="text-sm text-gray-500 mt-2">{progress}%</p>
						</div>
					)}

					{/* Completed State - Video Ready */}
					{isCompleted && videoUrl && (
						<div className="space-y-4">
							<div className="flex items-center space-x-2">
								<div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
									<CheckCircle className="w-4 h-4 text-white" />
								</div>
								<p className="text-green-400 font-medium">
									{t("success_title")}
								</p>
							</div>

							<div className="aspect-video bg-black rounded-lg overflow-hidden">
								{/* biome-ignore lint/a11y/useMediaCaption: AI-generated videos don't have captions yet */}
								<video
									className="w-full h-full object-cover"
									controls
									poster={startFrameImage}
									aria-label="Generated scene video"
								>
									<source src={videoUrl} type="video/mp4" />
									Your browser does not support the video tag.
								</video>
							</div>

							<div className="flex flex-col sm:flex-row gap-3">
								<Button
									onClick={handleRegenerateVideoClick}
									variant="outline"
									className="text-white border-[#314d68] hover:bg-[#223649] bg-transparent w-full sm:w-auto min-h-[44px]"
									disabled={!canRegenerate}
									aria-label={`Regenerate video (${regenerationCount}/${maxRegenerations} used)`}
								>
									<RefreshCw className="h-4 w-4 mr-2" />
									{t("refine_with_ai", {
										left: maxRegenerations - regenerationCount,
									})}
									<Badge variant="secondary" className="ml-2">
										{t("credits_badge", { credits: VIDEO_GENERATION_CREDITS })}
									</Badge>
								</Button>
								<Button
									onClick={handleDownloadVideo}
									variant="outline"
									className="text-white border-[#314d68] hover:bg-[#223649] bg-transparent w-full sm:w-auto min-h-[44px]"
									aria-label="Download generated video"
								>
									<Download className="h-4 w-4 mr-2" />
									{t("download_video")}
								</Button>
								<Button
									onClick={handleValidateVideo}
									className={`px-6 py-2 text-sm font-medium w-full sm:w-auto min-h-[44px] ${
										isValidated
											? "bg-green-600 hover:bg-green-700 text-white"
											: "bg-[#0d7ff2] hover:bg-blue-600 text-white"
									}`}
									disabled={isValidated}
									aria-label={
										isValidated
											? "Video validated"
											: "Approve and continue with this video"
									}
								>
									{isValidated ? t("video_validated") : t("approve_video")}
								</Button>
							</div>
						</div>
					)}

					{/* Failed State - Error */}
					{isFailed && generationError && (
						<div className="text-center py-8">
							<div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
								<RefreshCw className="h-8 w-8 text-white" />
							</div>
							<p className="text-red-400 font-medium mb-2">
								{generationError.code === "DOWNLOAD_FAILED"
									? t("download_failed_title")
									: t("failed_title")}
							</p>
							<p className="text-sm text-gray-400 mb-4">
								{generationError.code === "DOWNLOAD_FAILED"
									? t("download_failed_description")
									: generationError.message}
							</p>
							{generationError.retryable && (
								<Button
									onClick={handleGenerateVideo}
									className="bg-[#0d7ff2] hover:bg-blue-600 text-white px-6 py-2 min-h-[44px]"
									aria-label="Retry video generation"
								>
									{t("try_again")}
									<Badge variant="secondary" className="ml-2 bg-blue-700">
										{t("credits_badge", { credits: VIDEO_GENERATION_CREDITS })}
									</Badge>
								</Button>
							)}
						</div>
					)}
				</CardContent>
			</Card>

			<VideoRegenerationChat
				sceneId={sceneId}
				projectId={projectId}
				sceneTitle={sceneTitle}
				sceneDescription={sceneDescription}
				isOpen={isRegenerationChatOpen}
				onClose={handleCloseModal}
				onRegenerateApproved={handleRegenerateApproved}
				regenerationCount={regenerationCount}
				maxRegenerations={maxRegenerations}
			/>

			<InsufficientCreditsModal
				isOpen={showInsufficientCreditsModal}
				onClose={() => setShowInsufficientCreditsModal(false)}
				required={VIDEO_GENERATION_CREDITS}
				available={currentCredits}
				actionName={t("action_name")}
				returnUrl={
					typeof window !== "undefined" ? window.location.href : undefined
				}
			/>

			{toastMessage && (
				<div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 max-w-sm">
					{toastMessage}
				</div>
			)}
		</>
	);
}
