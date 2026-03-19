/// <reference types="vite/client" />
/**
 * Webhook Handler Integration Tests
 *
 * Verifies the fixed webhook mutations introduced in sprint-10-fix-270226:
 *
 *   addPurchaseCredits (order.paid):
 *     1. Grants initial credits on first call
 *     2. Idempotency: second call with same polarOrderId is a no-op
 *
 *   addMonthlyRenewalCreditsFixed (order.created — subscription_cycle):
 *     1. Looks up tier by polarProductId (not via the empty subscriptions table)
 *     2. Grants monthlyCredits to userCredits
 *     3. Returns tier_has_no_monthly_credits for one_time product tiers
 *
 *   updateTierByWebhook (subscription.updated):
 *     1. Updates userCredits.subscriptionTier when tier changes
 *     2. Creates userCredits record when one doesn't exist yet
 *
 * Pattern: makeT() + t.mutation() + seedUser/seedTier(t, ...) outside t.run()
 */

import { describe, expect, it } from "vitest";
import { internal } from "../../convex/_generated/api";
import { makeT, seedTier, seedUser } from "./polar-test-helpers";

const TEST_USER_ID = "user_webhook_test_123";
const TEST_ORDER_ID = "order_webhook_123";
const TEST_PRODUCT_ID = "prod_webhook_123";

// ── order.paid: addPurchaseCredits ────────────────────────────────────────────

describe("order.paid — addPurchaseCredits", () => {
	it("grants initial credits on first call", async () => {
		const t = makeT();

		await seedTier(t, {
			tierKey: "tier_1",
			polarProductId: TEST_PRODUCT_ID,
			productType: "subscription",
			initialCredits: 200,
		});

		const result = await t.mutation(internal.credits.addPurchaseCredits, {
			clerkUserId: TEST_USER_ID,
			polarOrderId: TEST_ORDER_ID,
			polarProductId: TEST_PRODUCT_ID,
			creditAmount: 200,
		});

		expect(result.success).toBe(true);
		expect(result.creditsAdded).toBe(200);
		expect(result.newBalance).toBe(200);

		const userCredits = await t.run(async (ctx) => {
			return ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.first();
		});

		expect(userCredits?.balance).toBe(200);
		expect(userCredits?.totalPurchased).toBe(200);
	});

	it("does not double-grant credits for the same order (idempotency)", async () => {
		const t = makeT();

		await seedTier(t, {
			tierKey: "tier_1",
			polarProductId: TEST_PRODUCT_ID,
			productType: "subscription",
			initialCredits: 200,
		});

		await t.mutation(internal.credits.addPurchaseCredits, {
			clerkUserId: TEST_USER_ID,
			polarOrderId: TEST_ORDER_ID,
			polarProductId: TEST_PRODUCT_ID,
			creditAmount: 200,
		});

		const retry = await t.mutation(internal.credits.addPurchaseCredits, {
			clerkUserId: TEST_USER_ID,
			polarOrderId: TEST_ORDER_ID,
			polarProductId: TEST_PRODUCT_ID,
			creditAmount: 200,
		});

		expect(retry.success).toBe(true);
		expect(retry.alreadyProcessed).toBe(true);

		const userCredits = await t.run(async (ctx) => {
			return ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.first();
		});

		expect(userCredits?.balance).toBe(200);
	});
});

// ── order.created — addMonthlyRenewalCreditsFixed ─────────────────────────────

describe("order.created — addMonthlyRenewalCreditsFixed", () => {
	it("grants monthlyCredits using polarProductId (bypasses empty subscriptions table)", async () => {
		const t = makeT();

		await seedUser(t, { clerkUserId: TEST_USER_ID });
		await seedTier(t, {
			tierKey: "tier_1",
			polarProductId: TEST_PRODUCT_ID,
			productType: "subscription",
			initialCredits: 200,
			monthlyCredits: 200,
		});

		await t.run(async (ctx) => {
			await ctx.db.insert("userCredits", {
				clerkUserId: TEST_USER_ID,
				balance: 50,
				totalPurchased: 200,
				totalUsed: 150,
				totalBonusReceived: 0,
				subscriptionTier: "tier_1",
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
		});

		const result = await t.mutation(
			internal.credits.addMonthlyRenewalCreditsFixed,
			{
				clerkUserId: TEST_USER_ID,
				polarSubscriptionId: "sub_123",
				polarOrderId: "order_renewal_001",
				polarProductId: TEST_PRODUCT_ID,
			},
		);

		expect(result.success).toBe(true);
		expect(result.creditsAdded).toBe(200);

		const userCredits = await t.run(async (ctx) => {
			return ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.first();
		});

		expect(userCredits?.balance).toBe(250); // 50 + 200
	});

	it("does not double-grant for the same renewal order (idempotency)", async () => {
		const t = makeT();

		await seedUser(t, { clerkUserId: TEST_USER_ID });
		await seedTier(t, {
			tierKey: "tier_1",
			polarProductId: TEST_PRODUCT_ID,
			productType: "subscription",
			initialCredits: 200,
			monthlyCredits: 200,
		});

		await t.run(async (ctx) => {
			await ctx.db.insert("userCredits", {
				clerkUserId: TEST_USER_ID,
				balance: 50,
				totalPurchased: 200,
				totalUsed: 150,
				totalBonusReceived: 0,
				subscriptionTier: "tier_1",
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
		});

		const args = {
			clerkUserId: TEST_USER_ID,
			polarSubscriptionId: "sub_123",
			polarOrderId: "order_renewal_dup",
			polarProductId: TEST_PRODUCT_ID,
		};

		await t.mutation(internal.credits.addMonthlyRenewalCreditsFixed, args);
		const retry = await t.mutation(
			internal.credits.addMonthlyRenewalCreditsFixed,
			args,
		);

		expect(retry.success).toBe(false);
		expect(retry.reason).toBe("duplicate");

		const userCredits = await t.run(async (ctx) => {
			return ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.first();
		});

		expect(userCredits?.balance).toBe(250); // only one grant: 50 + 200
	});

	it("returns tier_has_no_monthly_credits for one_time product tiers", async () => {
		const t = makeT();

		await seedUser(t, { clerkUserId: TEST_USER_ID });
		await t.run(async (ctx) => {
			await ctx.db.insert("subscriptionTiers", {
				tierKey: "credits_pack",
				displayName: "Credit Pack",
				initialCredits: 50,
				sortOrder: 10,
				isActive: true,
				polarProductId: "prod_credits",
				productType: "one_time",
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
		});

		const result = await t.mutation(
			internal.credits.addMonthlyRenewalCreditsFixed,
			{
				clerkUserId: TEST_USER_ID,
				polarSubscriptionId: "sub_123",
				polarOrderId: "order_renewal_one_time",
				polarProductId: "prod_credits",
			},
		);

		expect(result.success).toBe(false);
		expect(result.reason).toBe("tier_has_no_monthly_credits");
	});
});

// ── subscription.updated — updateTierByWebhook ────────────────────────────────

describe("subscription.updated — updateTierByWebhook", () => {
	it("updates subscriptionTier in userCredits when tier changes", async () => {
		const t = makeT();

		await seedUser(t, { clerkUserId: TEST_USER_ID });
		await t.run(async (ctx) => {
			await ctx.db.insert("userCredits", {
				clerkUserId: TEST_USER_ID,
				balance: 200,
				totalPurchased: 200,
				totalUsed: 0,
				totalBonusReceived: 0,
				subscriptionTier: "tier_1",
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
		});

		const result = await t.mutation(
			internal.subscriptions.updateTierByWebhook,
			{
				clerkUserId: TEST_USER_ID,
				tierKey: "tier_2",
				polarSubscriptionId: "sub_123",
			},
		);

		expect(result.success).toBe(true);
		expect(result.updated).toBe(true);
		expect(result.previousTier).toBe("tier_1");

		const userCredits = await t.run(async (ctx) => {
			return ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.first();
		});

		expect(userCredits?.subscriptionTier).toBe("tier_2");
	});

	it("creates userCredits record when one does not exist yet", async () => {
		const t = makeT();

		await seedUser(t, { clerkUserId: TEST_USER_ID });
		await seedTier(t, { tierKey: "tier_1", initialCredits: 200 });

		const result = await t.mutation(
			internal.subscriptions.updateTierByWebhook,
			{
				clerkUserId: TEST_USER_ID,
				tierKey: "tier_1",
				polarSubscriptionId: "sub_123",
			},
		);

		expect(result.success).toBe(true);
		expect(result.created).toBe(true);

		const userCredits = await t.run(async (ctx) => {
			return ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.first();
		});

		expect(userCredits).toBeTruthy();
		expect(userCredits?.subscriptionTier).toBe("tier_1");
		expect(userCredits?.balance).toBe(200);
	});
});
