"use client";

import { useUser } from "@clerk/nextjs";
import { useAction, useMutation } from "convex/react";
import { Loader2, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { InsufficientCreditsModal } from "@/components/credits/InsufficientCreditsModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useCredits } from "@/hooks/business-logic/useCredits";

interface FrameGeneratorProps {
	sceneId: Id<"scenes">;
	projectId: Id<"projects">;
	frameType: "start" | "end";
	onGenerated?: (imageUrl: string) => void;
}

/**
 * FrameGenerator Component
 *
 * Generates AI-powered frame images for scenes using:
 * 1. AI prompt enhancement (OpenAI/Together.ai)
 * 2. Image generation (fal.ai Flux Schnell / Stable Diffusion v3.5)
 *
 * Mobile-first, WCAG 2.1 AA compliant
 *
 * @note Requires `pnpm convex deploy` to register imageGeneration action
 */
export function FrameGenerator({
	sceneId,
	projectId,
	frameType,
	onGenerated,
}: FrameGeneratorProps) {
	const { user } = useUser();
	const t = useTranslations("frame_generator");
	const [prompt, setPrompt] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [enhancedPrompt, setEnhancedPrompt] = useState("");
	const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] =
		useState(false);
	const [requiredCredits, setRequiredCredits] = useState(0);

	// Credit system
	const { balance: currentCredits } = useCredits(user?.id || "");
	const deductCredits = useMutation(api.credits.deductCreditsPublic);
	const refundCredits = useMutation(api.credits.refundCreditsPublic);

	// Total credits needed: 1 for prompt enhancement + 5 for image generation = 6
	const PROMPT_ENHANCEMENT_CREDITS = 1;
	const IMAGE_GENERATION_CREDITS = 5;
	const TOTAL_CREDITS_NEEDED =
		PROMPT_ENHANCEMENT_CREDITS + IMAGE_GENERATION_CREDITS;

	const enhancePrompt = useAction(api.actions.aiChat.enhanceImagePrompt);
	// Type assertion needed until convex deploy updates API types
	const generateImage = useAction(
		// biome-ignore lint/suspicious/noExplicitAny: Convex API types not yet generated for imageGeneration
		(api.actions as any).imageGeneration?.generateFrameImage,
	);

	const handleGenerate = async () => {
		if (!prompt.trim() || !user?.id) return;

		// Check if user has enough credits for both operations
		if (currentCredits < TOTAL_CREDITS_NEEDED) {
			setRequiredCredits(TOTAL_CREDITS_NEEDED);
			setShowInsufficientCreditsModal(true);
			return;
		}

		setIsGenerating(true);
		let promptTransactionId: Id<"creditTransactions"> | undefined;
		let imageTransactionId: Id<"creditTransactions"> | undefined;

		try {
			// Step 1: Deduct credits for prompt enhancement
			const promptDeductResult = await deductCredits({
				clerkUserId: user.id,
				actionType: "image_prompt_enhancement",
				projectId: projectId as string,
			});

			if (!promptDeductResult.success) {
				if (promptDeductResult.error === "Insufficient credits") {
					setRequiredCredits(PROMPT_ENHANCEMENT_CREDITS);
					setShowInsufficientCreditsModal(true);
				} else {
					console.error(
						"[FrameGenerator] Prompt credit deduction failed:",
						promptDeductResult.error,
					);
				}
				setIsGenerating(false);
				return;
			}
			promptTransactionId = promptDeductResult.transactionId;

			// Step 2: Enhance prompt with AI
			const { enhanced } = await enhancePrompt({
				description: prompt,
				frameType,
				projectId,
				sceneId,
			});
			setEnhancedPrompt(enhanced);

			// Step 3: Deduct credits for image generation
			const imageDeductResult = await deductCredits({
				clerkUserId: user.id,
				actionType: "image_generation",
				projectId: projectId as string,
			});

			if (!imageDeductResult.success) {
				// Refund prompt enhancement credits
				if (promptTransactionId) {
					await refundCredits({
						transactionId: promptTransactionId,
						reason: "Insufficient credits for image generation",
					});
				}
				if (imageDeductResult.error === "Insufficient credits") {
					setRequiredCredits(IMAGE_GENERATION_CREDITS);
					setShowInsufficientCreditsModal(true);
				} else {
					console.error(
						"[FrameGenerator] Image credit deduction failed:",
						imageDeductResult.error,
					);
				}
				setIsGenerating(false);
				return;
			}
			imageTransactionId = imageDeductResult.transactionId;

			// Step 4: Generate image with fal.ai
			const result = await generateImage({
				sceneId,
				frameType,
				prompt: enhanced,
				projectId,
			});

			if (result.imageUrl) {
				onGenerated?.(result.imageUrl);
			}
		} catch (error) {
			console.error("Image generation failed:", error);

			// Refund credits on failure
			if (promptTransactionId) {
				try {
					await refundCredits({
						transactionId: promptTransactionId,
						reason: "Image generation failed",
					});
				} catch (refundError) {
					console.error("Failed to refund prompt credits:", refundError);
				}
			}
			if (imageTransactionId) {
				try {
					await refundCredits({
						transactionId: imageTransactionId,
						reason: "Image generation failed",
					});
				} catch (refundError) {
					console.error("Failed to refund image credits:", refundError);
				}
			}

			alert(t("generation_failed_alert"));
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		// biome-ignore lint/a11y/useSemanticElements: div needed for styling flexibility
		<div
			className="space-y-4 p-4 bg-white rounded-lg border border-gray-200"
			role="region"
			aria-label={t("region_aria_label", { frameType })}
		>
			<div>
				<label
					htmlFor={`prompt-${frameType}`}
					className="text-sm font-medium block mb-2"
				>
					{t("describe_frame_label", { frameType })}
				</label>
				<Textarea
					id={`prompt-${frameType}`}
					value={prompt}
					onChange={(e) => setPrompt(e.target.value)}
					placeholder={t("prompt_placeholder")}
					rows={3}
					disabled={isGenerating}
					className="w-full"
					aria-describedby={
						enhancedPrompt ? `enhanced-${frameType}` : undefined
					}
				/>
			</div>

			{enhancedPrompt && (
				// biome-ignore lint/a11y/useSemanticElements: div needed for styling flexibility
				<div
					id={`enhanced-${frameType}`}
					className="p-3 bg-blue-50 rounded-lg"
					role="status"
				>
					<p className="text-xs font-medium text-blue-900 mb-1">
						{t("ai_enhanced_prompt")}
					</p>
					<p className="text-xs text-blue-700">{enhancedPrompt}</p>
				</div>
			)}

			<Button
				onClick={handleGenerate}
				disabled={!prompt.trim() || isGenerating}
				className="w-full min-h-[44px]"
				aria-label={t("button_aria_label", { frameType })}
			>
				{isGenerating ? (
					<>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						{t("generating")}
					</>
				) : (
					<>
						<Sparkles className="mr-2 h-4 w-4" />
						{t("generate_frame_button", { frameType })}
						<Badge variant="secondary" className="ml-2">
							{t("credits_badge", { credits: TOTAL_CREDITS_NEEDED })}
						</Badge>
					</>
				)}
			</Button>

			<p className="text-xs text-muted-foreground text-center">
				{t("powered_by")}
			</p>

			<InsufficientCreditsModal
				isOpen={showInsufficientCreditsModal}
				onClose={() => setShowInsufficientCreditsModal(false)}
				required={requiredCredits}
				available={currentCredits}
				actionName={t("generate_image_action", { frameType })}
				returnUrl={
					typeof window !== "undefined" ? window.location.href : undefined
				}
			/>
		</div>
	);
}
