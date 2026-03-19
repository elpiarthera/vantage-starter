"use client";

import { useMutation, useQuery } from "convex/react";
import { useCallback, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

/**
 * Result of a credit deduction
 */
interface DeductResult {
	success: boolean;
	transactionId?: Id<"creditTransactions">;
	creditsDeducted?: number;
	newBalance?: number;
	error?: string;
	required?: number;
	available?: number;
}

/**
 * Credit cost information for an action
 */
interface CreditCost {
	actionType: string;
	displayName: string;
	credits: number;
	description: string;
	category: string;
	step?: number;
	isActive: boolean;
}

/**
 * Hook for managing user credits in the application.
 *
 * @param clerkUserId - The Clerk user ID
 * @param organizationId - Optional organization ID
 *
 * @example
 * ```tsx
 * const { balance, deductCredits, hasEnoughCredits, isProcessing } = useCredits(clerkUserId);
 *
 * const handleGenerate = async () => {
 *   const canProceed = await hasEnoughCredits("image_generation");
 *   if (!canProceed.hasEnough) {
 *     openInsufficientCreditsModal();
 *     return;
 *   }
 *
 *   const result = await deductCredits({
 *     actionType: "image_generation",
 *     projectId: "proj_123",
 *     projectName: "My Project",
 *   });
 *
 *   if (!result.success) {
 *     toast.error(result.error);
 *     return;
 *   }
 *
 *   try {
 *     await generateImage(...);
 *   } catch (error) {
 *     await refundCredits(result.transactionId!, "Generation failed");
 *     toast.error("Generation failed. Credits refunded.");
 *   }
 * };
 * ```
 */
export function useCredits(clerkUserId: string, organizationId?: string) {
	const [isProcessing, setIsProcessing] = useState(false);

	// Queries
	const creditData = useQuery(
		api.credits.getUserCredits,
		clerkUserId ? { clerkUserId } : "skip",
	);

	// Mutations
	const deductCreditsMutation = useMutation(api.credits.deductCreditsPublic);
	const refundCreditsMutation = useMutation(api.credits.refundCreditsPublic);

	/**
	 * Deduct credits for an AI action
	 */
	const deductCredits = useCallback(
		async (params: {
			actionType: string;
			projectId?: string;
			projectName?: string;
			resourceId?: string;
		}): Promise<DeductResult> => {
			if (!clerkUserId) {
				return { success: false, error: "User not authenticated" };
			}

			setIsProcessing(true);
			try {
				const result = await deductCreditsMutation({
					clerkUserId,
					organizationId,
					...params,
				});
				return result;
			} catch (error) {
				console.error("[useCredits] Deduction failed:", error);
				return {
					success: false,
					error: error instanceof Error ? error.message : "Deduction failed",
				};
			} finally {
				setIsProcessing(false);
			}
		},
		[clerkUserId, organizationId, deductCreditsMutation],
	);

	/**
	 * Refund credits for a failed AI call
	 */
	const refundCredits = useCallback(
		async (
			transactionId: Id<"creditTransactions">,
			reason: string,
		): Promise<{
			success: boolean;
			refundedAmount?: number;
			newBalance?: number;
			error?: string;
		}> => {
			try {
				const result = await refundCreditsMutation({
					transactionId,
					reason,
				});
				return result;
			} catch (error) {
				console.error("[useCredits] Refund failed:", error);
				return {
					success: false,
					error: error instanceof Error ? error.message : "Refund failed",
				};
			}
		},
		[refundCreditsMutation],
	);

	return {
		// Balance info
		balance: creditData?.balance ?? 0,
		totalPurchased: creditData?.totalPurchased ?? 0,
		totalUsed: creditData?.totalUsed ?? 0,
		totalBonusReceived: creditData?.totalBonusReceived ?? 0,
		subscriptionTier: creditData?.subscriptionTier,
		isNewUser: creditData?.isNew ?? false,

		// Loading states
		isLoading: creditData === undefined,
		isProcessing,

		// Actions
		deductCredits,
		refundCredits,
	};
}

/**
 * Hook to check if user has enough credits for a specific action.
 * Use this for pre-flight checks before showing modals or starting processes.
 *
 * @param clerkUserId - The Clerk user ID
 * @param actionType - The action type to check
 */
export function useHasEnoughCredits(clerkUserId: string, actionType: string) {
	const result = useQuery(
		api.credits.hasEnoughCredits,
		clerkUserId && actionType ? { clerkUserId, actionType } : "skip",
	);

	return {
		hasEnough: result?.hasEnough ?? false,
		balance: result?.balance ?? 0,
		required: result?.required ?? 0,
		isLoading: result === undefined,
		error: result?.error,
	};
}

/**
 * Hook to get the credit cost for a specific action.
 * Use this to display costs in the UI.
 *
 * @param actionType - The action type to get cost for
 */
export function useCreditCost(actionType: string): {
	cost: CreditCost | null;
	isLoading: boolean;
} {
	const result = useQuery(
		api.credits.getCreditCost,
		actionType ? { actionType } : "skip",
	);

	return {
		cost: result ?? null,
		isLoading: result === undefined,
	};
}

/**
 * Hook to get user's transaction history.
 *
 * @param clerkUserId - The Clerk user ID
 * @param limit - Maximum number of transactions to fetch (default: 50)
 */
export function useTransactionHistory(clerkUserId: string, limit = 50) {
	const transactions = useQuery(
		api.credits.getTransactionHistory,
		clerkUserId ? { clerkUserId, limit } : "skip",
	);

	return {
		transactions: transactions ?? [],
		isLoading: transactions === undefined,
	};
}
