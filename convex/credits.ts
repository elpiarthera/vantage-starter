/**
 * Credit System - Core Functions
 *
 * This file contains all credit-related mutations and queries.
 * @see docs/Understanding/credit-system-specification.md
 *
 * Functions:
 * 1. getUserCredits (Query) - Get user's credit balance, auto-initialize if new
 * 2. deductCredits (Mutation) - Deduct credits for AI usage
 * 3. addCredits (Mutation) - Add credits (purchase, bonus, subscription)
 * 4. hasEnoughCredits (Query) - Quick balance check
 * 5. getCreditCost (Query) - Get cost for a specific action
 * 6. getTransactionHistory (Query) - Get user's transaction history
 * 7. refundCredits (Mutation) - Refund credits on AI failure
 */

import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import {
	internalMutation,
	internalQuery,
	mutation,
	query,
} from "./_generated/server";

// ============================================
// 1. getUserCredits (Query)
// ============================================
/**
 * Get user's credit balance. Auto-initializes if new user.
 */
export const getUserCredits = query({
	args: {
		clerkUserId: v.string(),
	},
	handler: async (ctx, args) => {
		const { clerkUserId } = args;

		// Check if user already has credits
		const existingCredits = await ctx.db
			.query("userCredits")
			.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", clerkUserId))
			.first();

		if (existingCredits) {
			return {
				balance: existingCredits.balance,
				totalPurchased: existingCredits.totalPurchased,
				totalUsed: existingCredits.totalUsed,
				totalBonusReceived: existingCredits.totalBonusReceived,
				subscriptionTier: existingCredits.subscriptionTier,
			};
		}

		// New user - return default (will be initialized on first deduction)
		const defaultCreditsConfig = await ctx.db
			.query("systemConfig")
			.withIndex("by_key", (q) => q.eq("key", "initial_credits_default"))
			.first();

		const defaultCredits =
			typeof defaultCreditsConfig?.value === "number"
				? defaultCreditsConfig.value
				: 200;

		return {
			balance: defaultCredits,
			totalPurchased: 0,
			totalUsed: 0,
			totalBonusReceived: defaultCredits,
			subscriptionTier: undefined,
			isNew: true,
		};
	},
});

// ============================================
// 2. deductCredits (Mutation)
// ============================================
/**
 * Deduct credits for AI feature usage.
 * Returns transactionId for potential refund.
 */
export const deductCredits = internalMutation({
	args: {
		clerkUserId: v.string(),
		organizationId: v.optional(v.string()),
		actionType: v.string(),
		projectId: v.optional(v.string()),
		projectName: v.optional(v.string()),
		resourceId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const {
			clerkUserId,
			organizationId,
			actionType,
			projectId,
			projectName,
			resourceId,
		} = args;
		const now = Date.now();

		// 1. Get credit cost for this action
		const creditCost = await ctx.db
			.query("creditCosts")
			.withIndex("by_action_type", (q) => q.eq("actionType", actionType))
			.first();

		if (!creditCost || !creditCost.isActive) {
			return {
				success: false,
				error: `Unknown or inactive action type: ${actionType}`,
			};
		}

		const cost = creditCost.credits;

		// 2. Get or initialize user credits
		let userCredits = await ctx.db
			.query("userCredits")
			.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", clerkUserId))
			.first();

		if (!userCredits) {
			// Initialize new user
			const defaultCreditsConfig = await ctx.db
				.query("systemConfig")
				.withIndex("by_key", (q) => q.eq("key", "initial_credits_default"))
				.first();

			const initialCredits =
				typeof defaultCreditsConfig?.value === "number"
					? defaultCreditsConfig.value
					: 200;

			const newUserCreditsId = await ctx.db.insert("userCredits", {
				clerkUserId,
				organizationId,
				balance: initialCredits,
				totalPurchased: 0,
				totalUsed: 0,
				totalBonusReceived: initialCredits,
				subscriptionTier: undefined,
				createdAt: now,
				updatedAt: now,
			});

			// Log initial credit grant
			await ctx.db.insert("creditTransactions", {
				clerkUserId,
				organizationId,
				type: "initial",
				amount: initialCredits,
				balanceAfter: initialCredits,
				description: "Initial credits for new user",
				timestamp: now,
			});

			userCredits = await ctx.db.get(newUserCreditsId);
		}

		if (!userCredits) {
			return { success: false, error: "Failed to get user credits" };
		}

		// 3. Check if user has enough credits
		if (userCredits.balance < cost) {
			return {
				success: false,
				error: "Insufficient credits",
				required: cost,
				available: userCredits.balance,
			};
		}

		// 4. Deduct credits
		const newBalance = userCredits.balance - cost;
		await ctx.db.patch(userCredits._id, {
			balance: newBalance,
			totalUsed: userCredits.totalUsed + cost,
			updatedAt: now,
		});

		// 5. Log transaction
		const transactionId = await ctx.db.insert("creditTransactions", {
			clerkUserId,
			organizationId,
			type: "usage",
			amount: -cost,
			balanceAfter: newBalance,
			projectId,
			projectName,
			actionType,
			resourceId,
			description: `${creditCost.displayName} (${cost} credits)`,
			timestamp: now,
		});

		return {
			success: true,
			transactionId,
			creditsDeducted: cost,
			newBalance,
		};
	},
});

// ============================================
// 3. addCredits (internalMutation — server-side only)
// ============================================
/**
 * Add credits (purchase, bonus, subscription renewal).
 * INTERNAL ONLY — must never be exposed as a public mutation.
 * All credit grants must go through server-side webhook handlers
 * (addPurchaseCredits, addMonthlyRenewalCreditsFixed) which are already
 * internalMutation. This is kept as a general-purpose internal helper.
 */
export const addCredits = internalMutation({
	args: {
		clerkUserId: v.string(),
		organizationId: v.optional(v.string()),
		amount: v.number(),
		type: v.union(
			v.literal("purchase"),
			v.literal("subscription_reset"),
			v.literal("bonus"),
		),
		description: v.string(),
		metadata: v.optional(v.any()),
	},
	handler: async (ctx, args) => {
		const { clerkUserId, organizationId, amount, type, description, metadata } =
			args;
		const now = Date.now();

		// Get or create user credits
		let userCredits = await ctx.db
			.query("userCredits")
			.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", clerkUserId))
			.first();

		if (!userCredits) {
			// Initialize new user with 0, then add the credits
			const newUserCreditsId = await ctx.db.insert("userCredits", {
				clerkUserId,
				organizationId,
				balance: 0,
				totalPurchased: 0,
				totalUsed: 0,
				totalBonusReceived: 0,
				subscriptionTier: undefined,
				createdAt: now,
				updatedAt: now,
			});
			userCredits = await ctx.db.get(newUserCreditsId);
		}

		if (!userCredits) {
			return { success: false, error: "Failed to get user credits" };
		}

		// Calculate new balance
		const newBalance = userCredits.balance + amount;

		// Update totals based on type
		const updates: {
			balance: number;
			updatedAt: number;
			totalPurchased?: number;
			totalBonusReceived?: number;
			lastResetAt?: number;
		} = {
			balance: newBalance,
			updatedAt: now,
		};

		if (type === "purchase") {
			updates.totalPurchased = userCredits.totalPurchased + amount;
		} else if (type === "bonus" || type === "subscription_reset") {
			updates.totalBonusReceived = userCredits.totalBonusReceived + amount;
			if (type === "subscription_reset") {
				updates.lastResetAt = now;
			}
		}

		await ctx.db.patch(userCredits._id, updates);

		// Log transaction
		await ctx.db.insert("creditTransactions", {
			clerkUserId,
			organizationId,
			type,
			amount,
			balanceAfter: newBalance,
			description,
			metadata,
			timestamp: now,
		});

		return {
			success: true,
			newBalance,
			creditsAdded: amount,
		};
	},
});

// ============================================
// 4. hasEnoughCredits (Query)
// ============================================
/**
 * Quick check if user has enough credits for an action.
 */
export const hasEnoughCredits = query({
	args: {
		clerkUserId: v.string(),
		actionType: v.string(),
	},
	handler: async (ctx, args) => {
		const { clerkUserId, actionType } = args;

		// Get credit cost
		const creditCost = await ctx.db
			.query("creditCosts")
			.withIndex("by_action_type", (q) => q.eq("actionType", actionType))
			.first();

		if (!creditCost || !creditCost.isActive) {
			return { hasEnough: false, error: `Unknown action: ${actionType}` };
		}

		const cost = creditCost.credits;

		// Get user credits
		const userCredits = await ctx.db
			.query("userCredits")
			.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", clerkUserId))
			.first();

		// If no record, check against default
		if (!userCredits) {
			const defaultCreditsConfig = await ctx.db
				.query("systemConfig")
				.withIndex("by_key", (q) => q.eq("key", "initial_credits_default"))
				.first();

			const defaultCredits =
				typeof defaultCreditsConfig?.value === "number"
					? defaultCreditsConfig.value
					: 200;

			return {
				hasEnough: defaultCredits >= cost,
				balance: defaultCredits,
				required: cost,
			};
		}

		return {
			hasEnough: userCredits.balance >= cost,
			balance: userCredits.balance,
			required: cost,
		};
	},
});

// ============================================
// 5. getCreditCost (Query)
// ============================================
/**
 * Get the credit cost for a specific action (for UI display).
 */
export const getCreditCost = query({
	args: {
		actionType: v.string(),
	},
	handler: async (ctx, args) => {
		const { actionType } = args;

		const creditCost = await ctx.db
			.query("creditCosts")
			.withIndex("by_action_type", (q) => q.eq("actionType", actionType))
			.first();

		if (!creditCost) {
			return null;
		}

		return {
			actionType: creditCost.actionType,
			displayName: creditCost.displayName,
			credits: creditCost.credits,
			description: creditCost.description,
			category: creditCost.category,
			step: creditCost.step,
			isActive: creditCost.isActive,
		};
	},
});

/**
 * Get credit costs for multiple action types in a single query.
 * Used to build creditCosts maps for model selector UIs.
 */
export const listCreditCostsByTypes = query({
	args: { actionTypes: v.array(v.string()) },
	handler: async (ctx, { actionTypes }) => {
		const allCosts = await ctx.db.query("creditCosts").collect();
		const typesSet = new Set(actionTypes);
		return allCosts
			.filter((c) => c.isActive && typesSet.has(c.actionType))
			.map((c) => ({ actionType: c.actionType, credits: c.credits }));
	},
});

// ============================================
// 6. getTransactionHistory (Query)
// ============================================
/**
 * Get user's credit transaction history.
 */
export const getTransactionHistory = query({
	args: {
		clerkUserId: v.string(),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const { clerkUserId, limit = 50 } = args;

		const transactions = await ctx.db
			.query("creditTransactions")
			.withIndex("by_user_and_timestamp", (q) =>
				q.eq("clerkUserId", clerkUserId),
			)
			.order("desc")
			.take(limit);

		return transactions;
	},
});

// ============================================
// 7. refundCredits (Mutation)
// ============================================
/**
 * Refund credits when an AI call fails.
 */
export const refundCredits = internalMutation({
	args: {
		transactionId: v.id("creditTransactions"),
		reason: v.string(),
	},
	handler: async (ctx, args) => {
		const { transactionId, reason } = args;
		const now = Date.now();

		// 1. Get the original transaction
		const originalTransaction = await ctx.db.get(transactionId);

		if (!originalTransaction) {
			return { success: false, error: "Transaction not found" };
		}

		// 2. Check if already refunded (idempotency check)
		const existingRefund = await ctx.db
			.query("creditTransactions")
			.withIndex("by_user_and_timestamp", (q) =>
				q.eq("clerkUserId", originalTransaction.clerkUserId),
			)
			.filter((q) => q.eq(q.field("originalTransactionId"), transactionId))
			.first();

		if (existingRefund) {
			return {
				success: true,
				refundedAmount: existingRefund.amount,
				newBalance: existingRefund.balanceAfter,
				alreadyRefunded: true,
			};
		}

		// 3. Verify it's a usage transaction (negative amount)
		if (
			originalTransaction.type !== "usage" ||
			originalTransaction.amount >= 0
		) {
			return { success: false, error: "Can only refund usage transactions" };
		}

		// 4. Calculate refund amount (make positive)
		const refundAmount = Math.abs(originalTransaction.amount);

		// 5. Get user credits
		const userCredits = await ctx.db
			.query("userCredits")
			.withIndex("by_clerk_user", (q) =>
				q.eq("clerkUserId", originalTransaction.clerkUserId),
			)
			.first();

		if (!userCredits) {
			return { success: false, error: "User credits not found" };
		}

		// 6. Add credits back
		const newBalance = userCredits.balance + refundAmount;
		await ctx.db.patch(userCredits._id, {
			balance: newBalance,
			totalUsed: userCredits.totalUsed - refundAmount,
			updatedAt: now,
		});

		// 7. Log refund transaction
		await ctx.db.insert("creditTransactions", {
			clerkUserId: originalTransaction.clerkUserId,
			organizationId: originalTransaction.organizationId,
			type: "refund",
			amount: refundAmount,
			balanceAfter: newBalance,
			projectId: originalTransaction.projectId,
			projectName: originalTransaction.projectName,
			actionType: originalTransaction.actionType,
			resourceId: originalTransaction.resourceId,
			description: `Refund: ${reason}`,
			originalTransactionId: transactionId,
			metadata: { originalTransactionId: transactionId },
			timestamp: now,
		});

		return {
			success: true,
			refundedAmount: refundAmount,
			newBalance,
		};
	},
});

/**
 * Get a transaction by ID (internal query for actions)
 */
export const getTransaction = internalQuery({
	args: { transactionId: v.id("creditTransactions") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.transactionId);
	},
});

// ============================================
// 9. addPurchaseCredits (Internal Mutation)
// ============================================
/**
 * Add credits from a one-time Polar purchase.
 * Called by order.paid webhook handler.
 *
 * Idempotency check is INSIDE this mutation (ctx.db is available here).
 * The webhook handler's RunMutationCtx does NOT have ctx.db, so checks
 * cannot be done there — they must live inside internalMutation bodies.
 */
export const addPurchaseCredits = internalMutation({
	args: {
		clerkUserId: v.string(),
		polarOrderId: v.string(),
		polarProductId: v.string(),
		creditAmount: v.number(),
	},
	handler: async (
		ctx,
		{ clerkUserId, polarOrderId, polarProductId, creditAmount },
	) => {
		const now = Date.now();

		// IDEMPOTENCY CHECK: prevent duplicate credits on webhook retry
		const existingTransaction = await ctx.db
			.query("creditTransactions")
			.withIndex("by_polar_order_id", (q) => q.eq("polarOrderId", polarOrderId))
			.first();

		if (existingTransaction) {
			console.log(
				`Order ${polarOrderId} already processed (idempotency), skipping`,
			);
			return { success: true, alreadyProcessed: true };
		}

		// Get or create user credits
		let userCredits = await ctx.db
			.query("userCredits")
			.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", clerkUserId))
			.first();

		if (!userCredits) {
			const newId = await ctx.db.insert("userCredits", {
				clerkUserId,
				balance: 0,
				totalPurchased: 0,
				totalUsed: 0,
				totalBonusReceived: 0,
				subscriptionTier: undefined,
				createdAt: now,
				updatedAt: now,
			});
			userCredits = await ctx.db.get(newId);
		}

		if (!userCredits) {
			return {
				success: false,
				alreadyProcessed: false,
				reason: "failed_to_get_user_credits",
			};
		}

		const newBalance = userCredits.balance + creditAmount;

		await ctx.db.patch(userCredits._id, {
			balance: newBalance,
			totalPurchased: userCredits.totalPurchased + creditAmount,
			updatedAt: now,
		});

		await ctx.db.insert("creditTransactions", {
			clerkUserId,
			type: "purchase",
			amount: creditAmount,
			balanceAfter: newBalance,
			description: `Credit purchase: ${creditAmount} credits`,
			polarOrderId,
			metadata: { polarOrderId, polarProductId },
			timestamp: now,
		});

		return {
			success: true,
			alreadyProcessed: false,
			creditsAdded: creditAmount,
			newBalance,
		};
	},
});

// ============================================
// 10. addMonthlyRenewalCredits (Internal Mutation)
// ============================================
/**
 * Add monthly credits when a subscription renews.
 * Called by order.created webhook when billingReason === "subscription_cycle".
 *
 * Idempotency check is INSIDE this mutation (same pattern as addPurchaseCredits).
 */
export const addMonthlyRenewalCredits = internalMutation({
	args: {
		clerkUserId: v.string(),
		polarSubscriptionId: v.string(),
		polarOrderId: v.string(),
	},
	handler: async (ctx, { clerkUserId, polarSubscriptionId, polarOrderId }) => {
		const now = Date.now();

		// IDEMPOTENCY CHECK: prevent duplicate credits on webhook retry
		const existingTransaction = await ctx.db
			.query("creditTransactions")
			.withIndex("by_polar_order_id", (q) => q.eq("polarOrderId", polarOrderId))
			.first();

		if (existingTransaction) {
			console.log(
				`Renewal order ${polarOrderId} already processed (idempotency), skipping`,
			);
			return { success: false, reason: "duplicate" as const };
		}

		// Look up subscription to get the tier key
		const subscription = await ctx.db
			.query("subscriptions")
			.withIndex("by_polar_subscription_id", (q) =>
				q.eq("polarSubscriptionId", polarSubscriptionId),
			)
			.first();

		if (!subscription) {
			console.error(
				`Subscription ${polarSubscriptionId} not found for renewal ${polarOrderId}`,
			);
			return { success: false, reason: "subscription_not_found" as const };
		}

		// Get tier's monthly credit amount
		const tier = await ctx.db
			.query("subscriptionTiers")
			.withIndex("by_tier_key", (q) => q.eq("tierKey", subscription.tierKey))
			.first();

		if (!tier) {
			console.error(
				`Tier ${subscription.tierKey} not found for renewal ${polarOrderId}`,
			);
			return { success: false, reason: "tier_not_found" as const };
		}

		// Guard: tier must have a positive monthlyCredits value.
		// A credit package tier (one_time) has no monthlyCredits — failing here
		// prevents silently granting 0 credits and avoids creating an empty userCredits row.
		if (!tier.monthlyCredits) {
			console.error(
				`Tier ${subscription.tierKey} has no monthlyCredits defined — skipping renewal ${polarOrderId}`,
			);
			return {
				success: false,
				reason: "tier_has_no_monthly_credits" as const,
			};
		}

		// Get or create user credits
		let userCredits = await ctx.db
			.query("userCredits")
			.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", clerkUserId))
			.first();

		if (!userCredits) {
			const newId = await ctx.db.insert("userCredits", {
				clerkUserId,
				organizationId: subscription.organizationId,
				balance: 0,
				totalPurchased: 0,
				totalUsed: 0,
				totalBonusReceived: 0,
				subscriptionTier: subscription.tierKey,
				createdAt: now,
				updatedAt: now,
			});
			userCredits = await ctx.db.get(newId);
		}

		if (!userCredits) {
			return { success: false, reason: "failed_to_get_user_credits" as const };
		}

		const monthlyCredits = tier.monthlyCredits;
		const newBalance = userCredits.balance + monthlyCredits;

		await ctx.db.patch(userCredits._id, {
			balance: newBalance,
			totalBonusReceived: userCredits.totalBonusReceived + monthlyCredits,
			lastResetAt: now,
			updatedAt: now,
		});

		await ctx.db.insert("creditTransactions", {
			clerkUserId,
			organizationId: subscription.organizationId,
			type: "subscription_reset",
			amount: monthlyCredits,
			balanceAfter: newBalance,
			description: `Monthly renewal: ${tier.displayName} (${monthlyCredits} credits)`,
			polarOrderId,
			metadata: {
				polarSubscriptionId,
				polarOrderId,
				tierKey: subscription.tierKey,
			},
			timestamp: now,
		});

		console.log(
			`Monthly renewal: ${monthlyCredits} credits added for ${clerkUserId}`,
		);
		return { success: true, creditsAdded: monthlyCredits, newBalance };
	},
});

// ============================================
// 10b. addMonthlyRenewalCreditsFixed (Internal Mutation)
// ============================================
/**
 * Add monthly credits when a subscription renews — FIXED VERSION
 * Uses polarProductId from the webhook instead of querying the empty custom subscriptions table.
 */
export const addMonthlyRenewalCreditsFixed = internalMutation({
	args: {
		clerkUserId: v.string(),
		polarSubscriptionId: v.string(),
		polarOrderId: v.string(),
		polarProductId: v.string(),
	},
	handler: async (
		ctx,
		{ clerkUserId, polarSubscriptionId, polarOrderId, polarProductId },
	) => {
		const now = Date.now();

		// Idempotency: don't grant twice for the same order
		const existingTransaction = await ctx.db
			.query("creditTransactions")
			.withIndex("by_polar_order_id", (q) => q.eq("polarOrderId", polarOrderId))
			.first();

		if (existingTransaction) {
			console.log(
				`Renewal order ${polarOrderId} already processed (idempotency), skipping`,
			);
			return { success: false, reason: "duplicate" as const };
		}

		// Look up tier directly by productId — bypasses the empty custom subscriptions table
		const tier = await ctx.db
			.query("subscriptionTiers")
			.withIndex("by_polar_product_id", (q) =>
				q.eq("polarProductId", polarProductId),
			)
			.first();

		if (!tier) {
			console.error(
				`Tier not found for productId ${polarProductId} in renewal ${polarOrderId}`,
			);
			return { success: false, reason: "tier_not_found" as const };
		}

		if (!tier.monthlyCredits) {
			console.error(
				`Tier ${tier.tierKey} has no monthlyCredits defined — skipping renewal ${polarOrderId}`,
			);
			return { success: false, reason: "tier_has_no_monthly_credits" as const };
		}

		let userCredits = await ctx.db
			.query("userCredits")
			.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", clerkUserId))
			.first();

		if (!userCredits) {
			const newId = await ctx.db.insert("userCredits", {
				clerkUserId,
				balance: 0,
				totalPurchased: 0,
				totalUsed: 0,
				totalBonusReceived: 0,
				subscriptionTier: tier.tierKey,
				createdAt: now,
				updatedAt: now,
			});
			userCredits = await ctx.db.get(newId);
		}

		if (!userCredits) {
			return { success: false, reason: "failed_to_get_user_credits" as const };
		}

		const monthlyCredits = tier.monthlyCredits;
		const newBalance = userCredits.balance + monthlyCredits;

		await ctx.db.patch(userCredits._id, {
			balance: newBalance,
			totalBonusReceived: userCredits.totalBonusReceived + monthlyCredits,
			lastResetAt: now,
			updatedAt: now,
		});

		await ctx.db.insert("creditTransactions", {
			clerkUserId,
			type: "subscription_reset",
			amount: monthlyCredits,
			balanceAfter: newBalance,
			description: `Monthly renewal: ${tier.displayName} (${monthlyCredits} credits)`,
			polarOrderId,
			metadata: {
				polarSubscriptionId,
				polarOrderId,
				tierKey: tier.tierKey,
			},
			timestamp: now,
		});

		console.log(
			`Monthly renewal: ${monthlyCredits} credits added for ${clerkUserId} (tier: ${tier.tierKey})`,
		);
		return { success: true, creditsAdded: monthlyCredits, newBalance };
	},
});

// ============================================
// 8. initializeForSubscription (Mutation)
// ============================================
/**
 * Initialize credits for new subscription
 * Called when user first subscribes to a tier
 *
 * IMPORTANT: Only grants INITIAL credits (tier-specific)
 * Monthly recurring credits added by order.created webhook (when billing_reason = "subscription_cycle")
 *
 * Pattern from: /home/laurentperello/polar/example/
 */
export const initializeForSubscription = internalMutation({
	args: {
		clerkUserId: v.string(),
		tierKey: v.string(),
	},
	handler: async (ctx, args) => {
		const { clerkUserId, tierKey } = args;
		const now = Date.now();

		// Check if user already has credits (idempotency)
		const existingCredits = await ctx.db
			.query("userCredits")
			.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", clerkUserId))
			.first();

		if (existingCredits) {
			// User already initialized - just update tier
			await ctx.db.patch(existingCredits._id, {
				subscriptionTier: tierKey,
				updatedAt: now,
			});
			return { success: true, alreadyInitialized: true };
		}

		// Look up tier credits from subscriptionTiers table
		const tier = await ctx.db
			.query("subscriptionTiers")
			.withIndex("by_tier_key", (q) => q.eq("tierKey", tierKey))
			.first();

		if (!tier) {
			return { success: false, error: `Unknown tier: ${tierKey}` };
		}

		// Create userCredits with tier's INITIAL credits
		await ctx.db.insert("userCredits", {
			clerkUserId,
			balance: tier.initialCredits,
			totalPurchased: tier.initialCredits,
			totalUsed: 0,
			totalBonusReceived: 0,
			subscriptionTier: tierKey,
			createdAt: now,
			updatedAt: now,
		});

		// Log transaction
		await ctx.db.insert("creditTransactions", {
			clerkUserId,
			type: "initial",
			amount: tier.initialCredits,
			balanceAfter: tier.initialCredits,
			description: `Subscription started: ${tier.displayName} (initial credits)`,
			timestamp: now,
		});

		return { success: true, creditsGranted: tier.initialCredits };
	},
});

// ============================================================
// SPRINT 37: VIDEO CREDIT HELPERS
// deductCreditsForVideo — exported helper (not a registered mutation)
// refundVideoCredits — internalMutation for polling failure refunds
// ============================================================

/**
 * Deduct credits for video generation with duration scaling.
 * Exported as a plain async function so startGenericVideoGeneration can call it
 * directly with ctx — a registered mutation cannot call another registered mutation.
 */
export async function deductCreditsForVideo(
	ctx: MutationCtx,
	args: {
		clerkUserId: string;
		actionType: string;
		durationSeconds: number;
		baseDurationSeconds: number; // always 5 (creditBaseDuration)
	},
): Promise<{ success: boolean; transactionId?: Id<"creditTransactions"> }> {
	// 1. Lookup base credit cost
	const costRow = await ctx.db
		.query("creditCosts")
		.withIndex("by_action_type", (q) => q.eq("actionType", args.actionType))
		.unique();
	if (!costRow) throw new Error(`Unknown actionType: ${args.actionType}`);

	// 2. Scale by duration ratio
	const scaledCost = Math.ceil(
		(costRow.credits * args.durationSeconds) / args.baseDurationSeconds,
	);

	// 3. Check + deduct balance (inline — mirrors the core logic from deductCredits handler)
	const userCredits = await ctx.db
		.query("userCredits")
		.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", args.clerkUserId))
		.unique();
	if (!userCredits || userCredits.balance < scaledCost) {
		return { success: false };
	}

	await ctx.db.patch(userCredits._id, {
		balance: userCredits.balance - scaledCost,
		totalUsed: (userCredits.totalUsed ?? 0) + scaledCost,
		updatedAt: Date.now(),
	});

	// 4. Record transaction for refund-on-failure traceability
	// Field names MUST match creditTransactions schema exactly:
	// type, amount, balanceAfter, description, timestamp are all required fields.
	const newBalance = userCredits.balance - scaledCost;
	const transactionId = await ctx.db.insert("creditTransactions", {
		clerkUserId: args.clerkUserId,
		type: "usage",
		amount: -scaledCost,
		balanceAfter: newBalance,
		actionType: args.actionType,
		description: `Video generation: ${args.actionType}`,
		timestamp: Date.now(),
	});

	return { success: true, transactionId };
}

/**
 * Refund credits on video generation failure.
 * Called by pollVideoGeneration via internal.credits.refundVideoCredits.
 */
export const refundVideoCredits = internalMutation({
	args: {
		creditTransactionId: v.id("creditTransactions"),
		clerkUserId: v.string(),
	},
	handler: async (ctx, { creditTransactionId, clerkUserId }) => {
		const original = await ctx.db.get(creditTransactionId);
		if (!original) return; // missing — safe no-op

		// Idempotency: don't refund the same transaction twice (guards against concurrent polls)
		const existingRefund = await ctx.db
			.query("creditTransactions")
			.withIndex("by_user_and_timestamp", (q) =>
				q.eq("clerkUserId", clerkUserId),
			)
			.filter((q) =>
				q.eq(q.field("originalTransactionId"), creditTransactionId),
			)
			.first();
		if (existingRefund) return; // already refunded — safe no-op

		const refundAmount = Math.abs(original.amount);
		const userCredits = await ctx.db
			.query("userCredits")
			.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", clerkUserId))
			.unique();
		if (!userCredits) return;

		await ctx.db.patch(userCredits._id, {
			balance: userCredits.balance + refundAmount,
		});
		await ctx.db.insert("creditTransactions", {
			clerkUserId,
			type: "refund",
			amount: refundAmount,
			balanceAfter: userCredits.balance + refundAmount,
			description: "Video generation failed — credits refunded",
			originalTransactionId: creditTransactionId,
			timestamp: Date.now(),
		});
	},
});

// ============================================
// PUBLIC WRAPPERS (for legacy callers)
// The core deductCredits / refundCredits logic lives in internalMutation above.
// These thin public mutations provide an auth gate and re-run the same logic.
// TODO: Migrate all callers to use server-side deduction (inside their own mutation)
//       and remove these wrappers once VideoGenerator, FrameGenerator, useCredits,
//       guided step pages, and API routes are refactored.
// ============================================

export const deductCreditsPublic = mutation({
	args: {
		clerkUserId: v.string(),
		organizationId: v.optional(v.string()),
		actionType: v.string(),
		projectId: v.optional(v.string()),
		projectName: v.optional(v.string()),
		resourceId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");
		if (identity.subject !== args.clerkUserId) throw new Error("Unauthorized");
		const {
			clerkUserId,
			organizationId,
			actionType,
			projectId,
			projectName,
			resourceId,
		} = args;
		const now = Date.now();
		const creditCost = await ctx.db
			.query("creditCosts")
			.withIndex("by_action_type", (q) => q.eq("actionType", actionType))
			.first();
		if (!creditCost || !creditCost.isActive) {
			return {
				success: false as const,
				error: `Unknown or inactive action type: ${actionType}`,
			};
		}
		const cost = creditCost.credits;
		let userCredits = await ctx.db
			.query("userCredits")
			.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", clerkUserId))
			.first();
		if (!userCredits) {
			const defaultCreditsConfig = await ctx.db
				.query("systemConfig")
				.withIndex("by_key", (q) => q.eq("key", "initial_credits_default"))
				.first();
			const initialCredits =
				typeof defaultCreditsConfig?.value === "number"
					? defaultCreditsConfig.value
					: 200;
			const newId = await ctx.db.insert("userCredits", {
				clerkUserId,
				organizationId,
				balance: initialCredits,
				totalPurchased: 0,
				totalUsed: 0,
				totalBonusReceived: initialCredits,
				subscriptionTier: undefined,
				createdAt: now,
				updatedAt: now,
			});
			await ctx.db.insert("creditTransactions", {
				clerkUserId,
				organizationId,
				type: "initial",
				amount: initialCredits,
				balanceAfter: initialCredits,
				description: "Initial credits for new user",
				timestamp: now,
			});
			userCredits = await ctx.db.get(newId);
		}
		if (!userCredits)
			return { success: false as const, error: "Failed to get user credits" };
		if (userCredits.balance < cost) {
			return {
				success: false as const,
				error: "Insufficient credits",
				required: cost,
				available: userCredits.balance,
			};
		}
		const newBalance = userCredits.balance - cost;
		await ctx.db.patch(userCredits._id, {
			balance: newBalance,
			totalUsed: userCredits.totalUsed + cost,
			updatedAt: now,
		});
		const transactionId = await ctx.db.insert("creditTransactions", {
			clerkUserId,
			organizationId,
			type: "usage",
			amount: -cost,
			balanceAfter: newBalance,
			projectId,
			projectName,
			actionType,
			resourceId,
			description: `${creditCost.displayName} (${cost} credits)`,
			timestamp: now,
		});
		return {
			success: true as const,
			transactionId,
			creditsDeducted: cost,
			newBalance,
		};
	},
});

export const refundCreditsPublic = mutation({
	args: {
		transactionId: v.id("creditTransactions"),
		reason: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");
		const { transactionId, reason } = args;
		const now = Date.now();
		const originalTransaction = await ctx.db.get(transactionId);
		if (!originalTransaction)
			return { success: false as const, error: "Transaction not found" };
		// Ownership check: only the user who owns the transaction can refund it
		if (originalTransaction.clerkUserId !== identity.subject)
			throw new Error("Unauthorized: transaction belongs to a different user");
		const existingRefund = await ctx.db
			.query("creditTransactions")
			.withIndex("by_user_and_timestamp", (q) =>
				q.eq("clerkUserId", originalTransaction.clerkUserId),
			)
			.filter((q) => q.eq(q.field("originalTransactionId"), transactionId))
			.first();
		if (existingRefund) {
			return {
				success: true as const,
				refundedAmount: existingRefund.amount,
				newBalance: existingRefund.balanceAfter,
				alreadyRefunded: true,
			};
		}
		if (
			originalTransaction.type !== "usage" ||
			originalTransaction.amount >= 0
		) {
			return {
				success: false as const,
				error: "Can only refund usage transactions",
			};
		}
		const refundAmount = Math.abs(originalTransaction.amount);
		const userCredits = await ctx.db
			.query("userCredits")
			.withIndex("by_clerk_user", (q) =>
				q.eq("clerkUserId", originalTransaction.clerkUserId),
			)
			.first();
		if (!userCredits)
			return { success: false as const, error: "User credits not found" };
		const newBalance = userCredits.balance + refundAmount;
		await ctx.db.patch(userCredits._id, {
			balance: newBalance,
			totalUsed: userCredits.totalUsed - refundAmount,
			updatedAt: now,
		});
		await ctx.db.insert("creditTransactions", {
			clerkUserId: originalTransaction.clerkUserId,
			organizationId: originalTransaction.organizationId,
			type: "refund",
			amount: refundAmount,
			balanceAfter: newBalance,
			projectId: originalTransaction.projectId,
			projectName: originalTransaction.projectName,
			actionType: originalTransaction.actionType,
			resourceId: originalTransaction.resourceId,
			description: `Refund: ${reason}`,
			originalTransactionId: transactionId,
			metadata: { originalTransactionId: transactionId },
			timestamp: now,
		});
		return { success: true as const, refundedAmount: refundAmount, newBalance };
	},
});
