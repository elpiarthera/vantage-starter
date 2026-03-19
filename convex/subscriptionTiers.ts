/**
 * Convex queries for subscriptionTiers table.
 *
 * Single source of truth for all Polar products:
 *   productType "subscription" → recurring plans (tier_1/2/3)
 *   productType "one_time"     → credit packages (credits_starter/popular/pro/enterprise)
 *
 * Used by:
 *   - convex/http.ts webhook handler (getByPolarProductId)
 *   - PurchaseCreditsModal.tsx (listCreditPackages)
 *   - SubscriptionTab / ManageSubscriptionModal (listSubscriptionPlans)
 */

import { v } from "convex/values";
import { internalQuery, query } from "./_generated/server";

/**
 * Internal query — used by webhook handler in http.ts.
 * Looks up a subscriptionTiers row by Polar product UUID.
 * Returns null if product ID is not in the table (unknown product).
 */
export const getByPolarProductId = internalQuery({
	args: { polarProductId: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("subscriptionTiers")
			.withIndex("by_polar_product_id", (q) =>
				q.eq("polarProductId", args.polarProductId),
			)
			.first();
	},
});

/**
 * Public query — used by PurchaseCreditsModal.tsx.
 * Returns all active one-time credit packages sorted by sortOrder.
 * Fields used by UI: tierKey, displayName, priceUsd, initialCredits, bonusCredits, polarProductId.
 */
export const listCreditPackages = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db
			.query("subscriptionTiers")
			.withIndex("by_sort_order")
			.filter((q) => q.eq(q.field("productType"), "one_time"))
			.filter((q) => q.eq(q.field("isActive"), true))
			.collect();
	},
});

/**
 * Public query — used by SubscriptionTab / ManageSubscriptionModal.
 * Returns all active subscription plans sorted by sortOrder.
 * Fields used by UI: tierKey, displayName, priceUsd, monthlyCredits, initialCredits, polarProductId.
 */
export const listSubscriptionPlans = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db
			.query("subscriptionTiers")
			.withIndex("by_sort_order")
			.filter((q) => q.eq(q.field("productType"), "subscription"))
			.filter((q) => q.eq(q.field("isActive"), true))
			.collect();
	},
});
