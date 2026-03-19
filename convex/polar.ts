/**
 * Polar.sh Integration for VantageStarter
 *
 * Based on official example: /home/laurentperello/polar/example/convex/example.ts
 *
 * @see https://github.com/get-convex/polar
 * @see https://www.convex.dev/components/polar
 */

import { Polar } from "@convex-dev/polar";
import { api, components } from "./_generated/api";
import type { DataModel, Id } from "./_generated/dataModel";
import { query } from "./_generated/server";

/**
 * User query for Polar component getUserInfo
 * Retrieves the current authenticated user from Clerk
 *
 * Pattern from: /home/laurentperello/polar/example/convex/example.ts (lines 8-19)
 */
export const getUserInfo = query({
	args: {},
	handler: async (ctx) => {
		// Get authenticated user from Clerk
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		// Find user in database by Clerk ID
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.first();

		if (!user) {
			throw new Error("User not found");
		}

		return {
			_id: user._id,
			email: identity.email || user.email,
		};
	},
});

/**
 * Polar component instance with product mapping
 *
 * Pattern from: /home/laurentperello/polar/example/convex/example.ts (lines 21-43)
 */
export const polar = new Polar<DataModel>(components.polar, {
	products: {
		tier_1: process.env.POLAR_PRODUCT_TIER_1 || "",
		tier_2: process.env.POLAR_PRODUCT_TIER_2 || "",
		tier_3: process.env.POLAR_PRODUCT_TIER_3 || "",
	},
	getUserInfo: async (ctx) => {
		const user: { _id: Id<"users">; email: string } = await ctx.runQuery(
			api.polar.getUserInfo,
		);
		return {
			userId: user._id,
			email: user.email,
		};
	},

	// Environment variables (set via: npx convex env set POLAR_ORGANIZATION_TOKEN xxx)
	// organizationToken: uses POLAR_ORGANIZATION_TOKEN env var
	// webhookSecret: uses POLAR_WEBHOOK_SECRET env var
	// server: uses POLAR_SERVER env var (sandbox or production)
});

/**
 * Get current subscription from Polar component's internal tables
 * Replaces querying the custom subscriptions table (which is never populated)
 */
export const getCurrentSubscription = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return null;
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.first();

		if (!user) {
			return null;
		}

		return await polar.getCurrentSubscription(ctx, { userId: user._id });
	},
});

/**
 * Export Polar API functions
 * Pattern from: /home/laurentperello/polar/example/convex/example.ts (lines 48-67)
 */
export const {
	// If you configure your products by key in the Polar constructor,
	// this query provides a keyed object of the products.
	getConfiguredProducts,

	// Lists all non-archived products, useful if you don't configure products by key.
	listAllProducts,

	// Generates a checkout link for the given product IDs.
	generateCheckoutLink,

	// Generates a customer portal URL for the current user.
	generateCustomerPortalUrl,

	// Changes the current subscription to the given product ID.
	changeCurrentSubscription,

	// Cancels the current subscription.
	cancelCurrentSubscription,
} = polar.api();
