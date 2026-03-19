/**
 * Rate Limiting — @convex-dev/ratelimiter
 *
 * Limits:
 * - credit mutations (deductCredits / addCredits): 10 req/min per user
 * - AI streaming (chat endpoint): 20 req/min per user
 *
 * Usage:
 * - deductCreditsRateLimited: public mutation; replaces deductCreditsPublic for rate-limited callers
 * - addCreditsRateLimited: internal mutation; guards server-side credit grants
 * - checkAiStreamingRateLimit: call from /api/chat before streaming; returns { ok, retryAfter }
 */

import { RateLimiter } from "@convex-dev/ratelimiter";
import { ConvexError, v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";
import { components } from "./_generated/api";

// ============================================
// Rate limiter — named limits
// ============================================

const rateLimiter = new RateLimiter(components.ratelimiter, {
	// 10 credit mutations per minute per user
	creditMutations: {
		kind: "fixed window",
		rate: 10,
		period: 60_000,
	},
	// 20 AI streaming requests per minute per user
	aiStreaming: {
		kind: "fixed window",
		rate: 20,
		period: 60_000,
	},
});

// ============================================
// 1. deductCreditsRateLimited (public mutation)
// ============================================
/**
 * Rate-limited public wrapper around the credit deduction logic.
 * 10 req/min per authenticated user.
 * Throws ConvexError on rate limit breach or auth failure.
 *
 * Note: inlines the deduction rather than calling ctx.runMutation(internal.credits.*)
 * to avoid TypeScript circular reference errors at the module boundary.
 */
export const deductCreditsRateLimited = mutation({
	args: {
		clerkUserId: v.string(),
		organizationId: v.optional(v.string()),
		actionType: v.string(),
		projectId: v.optional(v.string()),
		projectName: v.optional(v.string()),
		resourceId: v.optional(v.string()),
	},
	returns: v.union(
		v.object({
			success: v.literal(true),
			transactionId: v.id("creditTransactions"),
			creditsDeducted: v.number(),
			newBalance: v.number(),
		}),
		v.object({
			success: v.literal(false),
			error: v.string(),
			required: v.optional(v.number()),
			available: v.optional(v.number()),
		}),
	),
	handler: async (ctx, args) => {
		// Auth check
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new ConvexError("Not authenticated");
		if (identity.subject !== args.clerkUserId)
			throw new ConvexError("Unauthorized");

		// Rate limit: 10 req/min per user
		const { ok, retryAfter } = await rateLimiter.limit(ctx, "creditMutations", {
			key: args.clerkUserId,
		});
		if (!ok) {
			throw new ConvexError(
				`Rate limit exceeded. Retry in ${Math.ceil((retryAfter ?? 60_000) / 1000)}s.`,
			);
		}

		const { clerkUserId, organizationId, actionType, projectId, projectName, resourceId } = args;
		const now = Date.now();

		// Get credit cost
		const creditCost = await ctx.db
			.query("creditCosts")
			.withIndex("by_action_type", (q) => q.eq("actionType", actionType))
			.first();
		if (!creditCost || !creditCost.isActive) {
			return { success: false as const, error: `Unknown or inactive action type: ${actionType}` };
		}
		const cost = creditCost.credits;

		// Get or initialize user credits
		let userCredits = await ctx.db
			.query("userCredits")
			.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", clerkUserId))
			.first();

		if (!userCredits) {
			const defaultConfig = await ctx.db
				.query("systemConfig")
				.withIndex("by_key", (q) => q.eq("key", "initial_credits_default"))
				.first();
			const initialCredits =
				typeof defaultConfig?.value === "number" ? defaultConfig.value : 200;
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

		if (!userCredits) {
			return { success: false as const, error: "Failed to get user credits" };
		}

		if (userCredits.balance < cost) {
			return {
				success: false as const,
				error: "Insufficient credits",
				required: cost,
				available: userCredits.balance,
			};
		}

		// Deduct
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

		return { success: true as const, transactionId, creditsDeducted: cost, newBalance };
	},
});

// ============================================
// 2. addCreditsRateLimited (internal mutation)
// ============================================
/**
 * Rate-limited internal wrapper around the credit add logic.
 * Guards against rapid server-side credit grant loops (e.g., webhook retries).
 * 10 req/min per user key. Throws ConvexError on breach.
 */
export const addCreditsRateLimited = internalMutation({
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
	returns: v.union(
		v.object({ success: v.literal(true), newBalance: v.number(), creditsAdded: v.number() }),
		v.object({ success: v.literal(false), error: v.string() }),
	),
	handler: async (ctx, args): Promise<
		| { success: true; newBalance: number; creditsAdded: number }
		| { success: false; error: string }
	> => {
		const { ok, retryAfter } = await rateLimiter.limit(ctx, "creditMutations", {
			key: args.clerkUserId,
		});
		if (!ok) {
			throw new ConvexError(
				`Rate limit exceeded for addCredits. Retry in ${Math.ceil((retryAfter ?? 60_000) / 1000)}s.`,
			);
		}

		const { clerkUserId, organizationId, amount, type, description, metadata } = args;
		const now = Date.now();

		let userCredits = await ctx.db
			.query("userCredits")
			.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", clerkUserId))
			.first();

		if (!userCredits) {
			const newId = await ctx.db.insert("userCredits", {
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
			userCredits = await ctx.db.get(newId);
		}

		if (!userCredits) {
			return { success: false, error: "Failed to get user credits" };
		}

		const newBalance = userCredits.balance + amount;

		const updates: {
			balance: number;
			updatedAt: number;
			totalPurchased?: number;
			totalBonusReceived?: number;
			lastResetAt?: number;
		} = { balance: newBalance, updatedAt: now };

		if (type === "purchase") {
			updates.totalPurchased = userCredits.totalPurchased + amount;
		} else if (type === "bonus" || type === "subscription_reset") {
			updates.totalBonusReceived = userCredits.totalBonusReceived + amount;
			if (type === "subscription_reset") updates.lastResetAt = now;
		}

		await ctx.db.patch(userCredits._id, updates);
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

		return { success: true, newBalance, creditsAdded: amount };
	},
});

// ============================================
// 3. checkAiStreamingRateLimit (internal mutation)
// ============================================
/**
 * Consume one AI streaming token for a user.
 * Call from /api/chat (Next.js route) via fetchMutation before starting the stream.
 * Returns { ok: false, retryAfter } when limit is exceeded — caller sends HTTP 429.
 *
 * Limit: 20 req/min per user.
 */
export const checkAiStreamingRateLimit = internalMutation({
	args: {
		clerkUserId: v.string(),
	},
	returns: v.object({
		ok: v.boolean(),
		retryAfter: v.optional(v.number()),
	}),
	handler: async (ctx, { clerkUserId }): Promise<{ ok: boolean; retryAfter?: number }> => {
		const { ok, retryAfter } = await rateLimiter.limit(ctx, "aiStreaming", {
			key: clerkUserId,
		});
		return { ok, retryAfter: retryAfter ?? undefined };
	},
});
