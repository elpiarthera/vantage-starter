/**
 * `purchases` — one-time Polar purchase records for the shared confirmation
 * route `app/[locale]/dashboard/account/order-confirmed/page.tsx` (mcpcn
 * `order-confirm` / `payment-confirmed` blocks,
 * docs/mcpcn-block-mapping.md §4 line ~393, Batch 4).
 *
 * Write path: `recordPurchase` (internalMutation). Idempotency check is
 * INSIDE this mutation — same pattern as `credits.addPurchaseCredits`: the
 * webhook handler's RunMutationCtx (in `convex/http.ts`) has no `ctx.db`, so
 * the duplicate-order guard cannot live there and must live in the
 * internalMutation body.
 *
 * Read path: `getLatestForUser` (public query) — self-only, same idiom as
 * `credits.getUserCredits` (identity.subject must equal args.clerkUserId).
 * The confirmation route reads by user because that is the only identity it
 * has at render time (the Polar order id is never round-tripped through the
 * redirect URL in this delivery); `by_user` is the only index this read path
 * needs.
 *
 * Webhook wiring: `convex/http.ts`'s `order.paid` handler calls
 * `recordFromWebhookOrder` (not `recordPurchase` directly) once it has
 * resolved the tier via `internal.subscriptionTiers.getByPolarProductId`.
 * `recordFromWebhookOrder` is the one place that decides `kind` from
 * `subscriptionTiers.fulfillmentKind` — an operator-editable config field,
 * meaningful only for `productType: "one_time"` (see that field's comment in
 * `convex/schema.ts`). A `one_time` tier with no `fulfillmentKind` set is a
 * misconfiguration, not a default: `recordFromWebhookOrder` logs an error
 * naming the product and order, and records nothing.
 */

import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { internalMutation, query } from "./_generated/server";

/**
 * Shared insert-with-idempotency logic used by both `recordPurchase` (direct
 * callers that already know `kind`) and `recordFromWebhookOrder` (the
 * webhook path, which resolves `kind` from `subscriptionTiers.fulfillmentKind`
 * before calling this).
 */
async function insertPurchaseIfNew(
	ctx: MutationCtx,
	args: {
		userId: string;
		productKey: string;
		kind: "digital" | "trackable";
		trackingRef?: string;
		polarOrderId: string;
	},
): Promise<{
	success: true;
	alreadyProcessed: boolean;
	purchaseId: Id<"purchases">;
}> {
	const { userId, productKey, kind, trackingRef, polarOrderId } = args;

	// IDEMPOTENCY CHECK: prevent a duplicate row on webhook retry — same
	// mechanism as credits.addPurchaseCredits's polarOrderId guard.
	const existing = await ctx.db
		.query("purchases")
		.withIndex("by_polar_order_id", (q) => q.eq("polarOrderId", polarOrderId))
		.first();

	if (existing) {
		return {
			success: true as const,
			alreadyProcessed: true,
			purchaseId: existing._id,
		};
	}

	const purchaseId = await ctx.db.insert("purchases", {
		userId,
		productKey,
		kind,
		trackingRef,
		purchasedAt: Date.now(),
		polarOrderId,
	});

	return {
		success: true as const,
		alreadyProcessed: false,
		purchaseId,
	};
}

/**
 * Record one Polar one-time purchase. Called by whichever caller already
 * knows `kind`/`trackingRef` for the purchased product (e.g. a direct/manual
 * caller, or tests). The webhook path (`convex/http.ts`'s `order.paid`
 * handler) calls `recordFromWebhookOrder` below instead, which resolves
 * `kind` from `subscriptionTiers.fulfillmentKind` before delegating here.
 *
 * IDEMPOTENCY: keyed on `polarOrderId` — a webhook retry for the same order
 * must not write a second row.
 */
export const recordPurchase = internalMutation({
	args: {
		userId: v.string(),
		productKey: v.string(),
		kind: v.union(v.literal("digital"), v.literal("trackable")),
		trackingRef: v.optional(v.string()),
		polarOrderId: v.string(),
	},
	returns: v.object({
		success: v.literal(true),
		alreadyProcessed: v.boolean(),
		purchaseId: v.optional(v.id("purchases")),
	}),
	handler: async (ctx, args) => insertPurchaseIfNew(ctx, args),
});

/**
 * Called by `convex/http.ts`'s `order.paid` handler once it has resolved the
 * tier via `internal.subscriptionTiers.getByPolarProductId`. Resolves `kind`
 * from `tier.fulfillmentKind` (config on the `subscriptionTiers` row) rather
 * than deriving it from a hardcoded product-id list.
 *
 * - `productType !== "one_time"` (i.e. "subscription"): no-op, no row written.
 *   Subscriptions are tracked via `userCredits`/`subscriptions`, not `purchases`.
 * - `productType === "one_time"` with NO `fulfillmentKind` set on the tier:
 *   this is a misconfiguration, never a default — logs an error naming the
 *   product and order, and writes NOTHING. Silently defaulting to "digital"
 *   would misclassify a trackable/physical deliverable as a download.
 * - `productType === "one_time"` with `fulfillmentKind` set: delegates to
 *   `insertPurchaseIfNew` (same idempotency guarantee as `recordPurchase`).
 */
export const recordFromWebhookOrder = internalMutation({
	args: {
		userId: v.string(),
		productKey: v.string(),
		productType: v.union(v.literal("subscription"), v.literal("one_time")),
		fulfillmentKind: v.optional(
			v.union(v.literal("digital"), v.literal("trackable")),
		),
		trackingRef: v.optional(v.string()),
		polarOrderId: v.string(),
	},
	returns: v.object({
		success: v.literal(true),
		recorded: v.boolean(),
		alreadyProcessed: v.optional(v.boolean()),
		purchaseId: v.optional(v.id("purchases")),
	}),
	handler: async (ctx, args) => {
		if (args.productType !== "one_time") {
			return { success: true as const, recorded: false };
		}

		if (!args.fulfillmentKind) {
			console.error(
				"Missing fulfillmentKind on one_time subscriptionTiers row — refusing to record purchase (misconfiguration, not defaulted)",
				{ productKey: args.productKey, polarOrderId: args.polarOrderId },
			);
			return { success: true as const, recorded: false };
		}

		const result = await insertPurchaseIfNew(ctx, {
			userId: args.userId,
			productKey: args.productKey,
			kind: args.fulfillmentKind,
			trackingRef: args.trackingRef,
			polarOrderId: args.polarOrderId,
		});

		return {
			success: true as const,
			recorded: true,
			alreadyProcessed: result.alreadyProcessed,
			purchaseId: result.purchaseId,
		};
	},
});

/**
 * Read path for the confirmation route: the most recent purchase for the
 * signed-in user.
 *
 * SECURITY: self-only — same idiom as credits.getUserCredits
 * (identity.subject must equal args.userId).
 */
export const getLatestForUser = query({
	args: {
		userId: v.string(),
	},
	returns: v.union(
		v.object({
			_id: v.id("purchases"),
			_creationTime: v.number(),
			userId: v.string(),
			productKey: v.string(),
			kind: v.union(v.literal("digital"), v.literal("trackable")),
			trackingRef: v.optional(v.string()),
			purchasedAt: v.number(),
			polarOrderId: v.string(),
		}),
		v.null(),
	),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized: Authentication required");
		}
		if (identity.subject !== args.userId) {
			throw new Error("Unauthorized: cannot read another user's purchases");
		}

		return await ctx.db
			.query("purchases")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.order("desc")
			.first();
	},
});
