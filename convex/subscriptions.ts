/**
 * Subscription Management Functions
 *
 * Handles subscription queries and mutations for Polar integration
 * Pattern from: /home/laurentperello/polar/example/
 */

import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { polar } from "./polar";

/**
 * Get subscription by Clerk user ID
 * Used by UI to display current subscription
 *
 * REQUIRES: Compound index "by_organization_and_status" ["organizationId", "status"]
 *
 * SECURITY: self-only — same idiom as credits.deductCreditsPublic/
 * refundCreditsPublic (identity.subject must equal args.clerkUserId).
 * Returns `polarCustomerId` (billing PII) so this must never leak cross-tenant.
 */
export const getByClerkUserId = query({
	args: {
		clerkUserId: v.string(),
	},
	handler: async (ctx, args) => {
		const { clerkUserId } = args;

		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Authentication required");
		}
		if (identity.subject !== clerkUserId) {
			throw new Error("Unauthorized: cannot read another user's subscription");
		}

		// Find user first to get organizationId
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", clerkUserId))
			.first();

		if (!user || !user.organizationId) {
			return null;
		}

		// Type guard ensures organizationId is string
		const organizationId: string = user.organizationId;

		// Get active subscription for user's organization
		const subscription = await ctx.db
			.query("subscriptions")
			.withIndex("by_organization_and_status", (q) =>
				q.eq("organizationId", organizationId).eq("status", "active"),
			)
			.first();

		return subscription;
	},
});

/**
 * Get formatted subscription for UI display.
 *
 * Uses polar.listAllUserSubscriptions() — does NOT throw when the Polar
 * component's internal products table is empty (unlike getCurrentSubscription
 * which throws "Product not found" if product webhooks were never received).
 *
 * Tier data is resolved dynamically from subscriptionTiers by polarProductId.
 * Adding a new product only requires a new row in subscriptionTiers — no code change.
 *
 * SECURITY: self-only — same idiom as credits.deductCreditsPublic/
 * refundCreditsPublic. Returns `polarCustomerId` (billing PII) so this must
 * never leak cross-tenant.
 */
export const getFormattedSubscription = query({
	args: {
		clerkUserId: v.string(),
	},
	handler: async (ctx, args) => {
		const { clerkUserId } = args;

		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Authentication required");
		}
		if (identity.subject !== clerkUserId) {
			throw new Error("Unauthorized: cannot read another user's subscription");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", clerkUserId))
			.first();

		if (!user) {
			return null;
		}

		// listAllUserSubscriptions does not throw when the component's products
		// table is empty — safe even if product.created webhooks were never received.
		const allSubs = await polar.listAllUserSubscriptions(ctx, {
			userId: user._id,
		});

		// Find the first active or trialing subscription that hasn't ended
		const now = new Date().toISOString();
		const activeSub = allSubs.find(
			(s) =>
				["active", "trialing"].includes(s.status) &&
				(!s.endedAt || s.endedAt > now),
		);

		if (!activeSub) {
			return null;
		}

		// Resolve tier dynamically from subscriptionTiers by polarProductId.
		// No hardcoded product IDs — adding a new product only needs a new DB row.
		const tier = activeSub.productId
			? await ctx.db
					.query("subscriptionTiers")
					.withIndex("by_polar_product_id", (q) =>
						q.eq("polarProductId", activeSub.productId),
					)
					.first()
			: null;

		const tierMapping: Record<
			string,
			"free" | "starter" | "pro" | "enterprise"
		> = {
			tier_1: "starter",
			tier_2: "pro",
			tier_3: "enterprise",
		};

		return {
			polarSubscriptionId: activeSub.id,
			polarCustomerId: activeSub.customerId,
			polarProductId: activeSub.productId,
			tierKey: tier?.tierKey ?? "tier_1",
			status: activeSub.status,
			currentPeriodStart: activeSub.currentPeriodStart
				? new Date(activeSub.currentPeriodStart).getTime()
				: null,
			currentPeriodEnd: activeSub.currentPeriodEnd
				? new Date(activeSub.currentPeriodEnd).getTime()
				: null,
			cancelAtPeriodEnd: activeSub.cancelAtPeriodEnd ?? false,
			plan: {
				name: tier?.displayName ?? "Starter Plan",
				tier: tierMapping[tier?.tierKey ?? "tier_1"] ?? "starter",
				monthlyCredits: tier?.monthlyCredits ?? 200,
				features: [],
			},
		};
	},
});

/**
 * Create subscription record.
 *
 * SECURITY: internal-only. Zero client callers (verified — grep across
 * app/components/hooks/lib/convex returns none); the Polar webhook path uses
 * internal.subscriptions.updateTierByWebhook instead (see convex/http.ts).
 * A public version of this mutation would let anyone attach an arbitrary
 * Polar subscription/customer ID to any Clerk user by ID.
 */
export const create = internalMutation({
	args: {
		clerkUserId: v.string(),
		polarSubscriptionId: v.string(),
		polarCustomerId: v.string(),
		polarProductId: v.string(),
		tierKey: v.string(),
		status: v.string(),
		currentPeriodStart: v.number(),
		currentPeriodEnd: v.number(),
	},
	handler: async (ctx, args) => {
		// Find user's organization
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", args.clerkUserId),
			)
			.first();

		if (!user?.organizationId) {
			throw new Error("User organization not found");
		}

		// Get tier info for plan object
		const tier = await ctx.db
			.query("subscriptionTiers")
			.withIndex("by_tier_key", (q) => q.eq("tierKey", args.tierKey))
			.first();

		if (!tier) {
			throw new Error(`Tier not found: ${args.tierKey}`);
		}

		// Map tierKey → plan.tier union (schema requires one of these literals)
		const TIER_KEY_TO_PLAN: Record<
			string,
			"free" | "starter" | "pro" | "enterprise"
		> = {
			tier_1: "starter",
			tier_2: "pro",
			tier_3: "enterprise",
		};
		const planTier: "free" | "starter" | "pro" | "enterprise" =
			TIER_KEY_TO_PLAN[args.tierKey] ?? "starter";

		// Insert subscription record
		await ctx.db.insert("subscriptions", {
			clerkUserId: args.clerkUserId,
			organizationId: user.organizationId,
			tierKey: args.tierKey,
			polarSubscriptionId: args.polarSubscriptionId,
			polarCustomerId: args.polarCustomerId,
			polarProductId: args.polarProductId,
			status: args.status as "active" | "canceled" | "past_due" | "trialing",
			currentPeriodStart: args.currentPeriodStart,
			currentPeriodEnd: args.currentPeriodEnd,
			cancelAtPeriodEnd: false,
			plan: {
				name: tier.displayName,
				tier: planTier,
				monthlyCredits: tier.monthlyCredits || 0,
				features: [],
			},
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		return { success: true };
	},
});

/**
 * Update subscription tier (on upgrade/downgrade)
 */
export const updateTier = internalMutation({
	args: {
		polarSubscriptionId: v.string(),
		tierKey: v.string(),
	},
	handler: async (ctx, args) => {
		const sub = await ctx.db
			.query("subscriptions")
			.withIndex("by_polar_subscription_id", (q) =>
				q.eq("polarSubscriptionId", args.polarSubscriptionId),
			)
			.first();

		if (!sub) return;

		await ctx.db.patch(sub._id, {
			tierKey: args.tierKey,
			updatedAt: Date.now(),
		});

		// Keep userCredits.subscriptionTier in sync so UI and credit queries
		// always reflect the current plan tier without needing a secondary lookup.
		const credits = await ctx.db
			.query("userCredits")
			.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", sub.clerkUserId))
			.first();
		if (credits) {
			await ctx.db.patch(credits._id, {
				subscriptionTier: args.tierKey,
				updatedAt: Date.now(),
			});
		}
	},
});

/**
 * Update subscription tier from webhook
 * Bypasses the custom subscriptions table (never populated) — updates userCredits directly
 */
export const updateTierByWebhook = internalMutation({
	args: {
		clerkUserId: v.string(),
		tierKey: v.string(),
		polarSubscriptionId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { clerkUserId, tierKey, polarSubscriptionId } = args;
		const now = Date.now();

		const userCredits = await ctx.db
			.query("userCredits")
			.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", clerkUserId))
			.first();

		if (!userCredits) {
			console.warn(
				`updateTierByWebhook: No userCredits found for ${clerkUserId}, creating one`,
			);

			const tier = await ctx.db
				.query("subscriptionTiers")
				.withIndex("by_tier_key", (q) => q.eq("tierKey", tierKey))
				.first();

			const initialCredits = tier?.initialCredits ?? 200;

			await ctx.db.insert("userCredits", {
				clerkUserId,
				balance: initialCredits,
				totalPurchased: initialCredits,
				totalUsed: 0,
				totalBonusReceived: 0,
				subscriptionTier: tierKey,
				createdAt: now,
				updatedAt: now,
			});

			return { success: true, created: true, tierKey, initialCredits };
		}

		await ctx.db.patch(userCredits._id, {
			subscriptionTier: tierKey,
			updatedAt: now,
		});

		console.log(
			`Subscription tier updated for ${clerkUserId}: ${tierKey}` +
				(polarSubscriptionId ? ` (sub: ${polarSubscriptionId})` : ""),
		);

		return {
			success: true,
			updated: true,
			tierKey,
			previousTier: userCredits.subscriptionTier,
		};
	},
});

/**
 * Cancel subscription.
 *
 * SECURITY: internal-only — see create() above for rationale. A public
 * version would let anyone cancel any subscription by guessing/enumerating
 * a polarSubscriptionId, with no ownership check.
 */
export const cancel = internalMutation({
	args: {
		polarSubscriptionId: v.string(),
	},
	handler: async (ctx, args) => {
		const sub = await ctx.db
			.query("subscriptions")
			.withIndex("by_polar_subscription_id", (q) =>
				q.eq("polarSubscriptionId", args.polarSubscriptionId),
			)
			.first();

		if (sub) {
			await ctx.db.patch(sub._id, {
				status: "canceled",
				updatedAt: Date.now(),
				canceledAt: Date.now(),
			});
		}
	},
});
