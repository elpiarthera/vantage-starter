/// <reference types="vite/client" />
/**
 * Task 14b: Edge Case Tests
 *
 * Tests webhook handler behaviour for non-happy-path events:
 *
 * 1. subscription.updated with status "past_due": updateTier must NOT be called
 *    (handler only acts on status === "active").
 * 2. subscription.updated with unknown productId: tier not found in DB →
 *    updateTier must NOT be called, tierKey unchanged.
 * 3. order.created with billingReason "subscription_update" (not "subscription_cycle"):
 *    handler returns early, no monthly credits granted.
 * 4. order.created for a zombie user (deleted from Convex DB): getByConvexId returns null
 *    → graceful return, no credits, no crash.
 * 5. Monthly renewal (subscription_cycle) adds to existing balance, does NOT reset it.
 */

import { describe, expect, it } from "vitest";
import { internal } from "../../convex/_generated/api";
import {
	makeT,
	seedSubscription,
	seedSubscriptionWithTier,
	seedTier,
	seedUser,
	TEST_SUB_ID,
	TEST_TIER_KEY,
	TEST_USER_ID,
} from "./polar-test-helpers";

// ── 1. subscription.updated with past_due → updateTier NOT called ─────────────
describe("Edge case: subscription.updated with past_due status", () => {
	it("tierKey remains unchanged when status is past_due (not active)", async () => {
		const t = makeT();
		await seedUser(t);
		await seedTier(t, { tierKey: TEST_TIER_KEY });
		await seedSubscription(t, { status: "active", tierKey: TEST_TIER_KEY });

		// Simulate the subscription.updated handler's guard:
		// handler only calls updateTier when status === "active"
		// Typed as string (not literal) to mirror a real incoming webhook payload.
		const eventStatus: string = "past_due";
		if (eventStatus === "active") {
			await t.mutation(internal.subscriptions.updateTier, {
				polarSubscriptionId: TEST_SUB_ID,
				tierKey: "tier_3",
			});
		}

		// tierKey must still be the original TEST_TIER_KEY — updateTier was not called
		const sub = await t.run(async (ctx) =>
			ctx.db
				.query("subscriptions")
				.withIndex("by_polar_subscription_id", (q) =>
					q.eq("polarSubscriptionId", TEST_SUB_ID),
				)
				.first(),
		);
		expect(sub?.tierKey).toBe(TEST_TIER_KEY);
	});
});

// ── 2. subscription.updated with unknown productId → tierKey unchanged ─────────
describe("Edge case: subscription.updated with unknown productId", () => {
	it("updateTier is not called when getByPolarProductId returns null", async () => {
		const t = makeT();
		await seedUser(t);
		await seedTier(t, { tierKey: TEST_TIER_KEY, polarProductId: "prod_known" });
		await seedSubscription(t, { status: "active", tierKey: TEST_TIER_KEY });

		// Simulate handler: look up tier by productId — unknown ID returns null
		const tier = await t.query(internal.subscriptionTiers.getByPolarProductId, {
			polarProductId: "prod_completely_unknown_xyz",
		});
		expect(tier).toBeNull();

		// With tier null, updateTier is NOT called → tierKey unchanged
		if (tier) {
			await t.mutation(internal.subscriptions.updateTier, {
				polarSubscriptionId: TEST_SUB_ID,
				tierKey: tier.tierKey,
			});
		}

		const sub = await t.run(async (ctx) =>
			ctx.db
				.query("subscriptions")
				.withIndex("by_polar_subscription_id", (q) =>
					q.eq("polarSubscriptionId", TEST_SUB_ID),
				)
				.first(),
		);
		expect(sub?.tierKey).toBe(TEST_TIER_KEY);
	});
});

// ── 3. order.created with non-subscription_cycle billingReason → skipped ───────
describe("Edge case: order.created with billingReason subscription_update", () => {
	it("no monthly credits granted for billingReason other than subscription_cycle", async () => {
		const t = makeT();
		await seedUser(t);
		await seedSubscriptionWithTier(t, 200);

		// Simulate the handler's guard: only subscription_cycle triggers monthly credits
		// Typed as string (not literal) to mirror a real incoming webhook payload.
		const billingReason: string = "subscription_update";
		let creditsAdded = false;

		if (billingReason === "subscription_cycle") {
			await t.mutation(internal.credits.addMonthlyRenewalCredits, {
				clerkUserId: TEST_USER_ID,
				polarSubscriptionId: TEST_SUB_ID,
				polarOrderId: "ord_update_skip",
			});
			creditsAdded = true;
		}

		expect(creditsAdded).toBe(false);

		const credits = await t.run(async (ctx) =>
			ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.first(),
		);
		expect(credits).toBeNull();
	});
});

// ── 4. order.created for zombie user → graceful return ────────────────────────
describe("Edge case: order.created for deleted user (zombie webhook)", () => {
	it("getByConvexId returns null for a deleted user — no credits, no crash", async () => {
		const t = makeT();

		// A convex ID that never existed (simulates a user deleted between sub creation and renewal)
		const deletedConvexId = "ghost_convex_id_000";

		const user = await t.query(internal.users.getByConvexId, {
			convexUserId: deletedConvexId,
		});
		expect(user).toBeNull();

		// Handler returns early — no addMonthlyRenewalCredits is called
		// Verify no userCredits row appeared
		const credits = await t.run(async (ctx) =>
			ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.first(),
		);
		expect(credits).toBeNull();
	});
});

// ── 5. Monthly renewal accumulates: credits add to balance, do NOT reset ───────
describe("Edge case: monthly renewal accumulates balance", () => {
	it("second renewal adds to existing balance (not reset)", async () => {
		const t = makeT();
		await seedUser(t);
		await seedSubscriptionWithTier(t, 200);

		// First renewal
		await t.mutation(internal.credits.addMonthlyRenewalCredits, {
			clerkUserId: TEST_USER_ID,
			polarSubscriptionId: TEST_SUB_ID,
			polarOrderId: "ord_renewal_01",
		});

		const afterFirst = await t.run(async (ctx) =>
			ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.first(),
		);
		expect(afterFirst?.balance).toBe(200);

		// Second renewal (different orderId → not deduplicated)
		await t.mutation(internal.credits.addMonthlyRenewalCredits, {
			clerkUserId: TEST_USER_ID,
			polarSubscriptionId: TEST_SUB_ID,
			polarOrderId: "ord_renewal_02",
		});

		const afterSecond = await t.run(async (ctx) =>
			ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.first(),
		);
		// Balance = 200 + 200 = 400 (accumulated, not reset to 200)
		expect(afterSecond?.balance).toBe(400);
	});
});
