/// <reference types="vite/client" />
/**
 * Test 2: Credit Allocation Tests
 *
 * Verifies that credit amounts are correct for:
 * 1. One-time purchases (all 4 product IDs → 25, 55, 115, 300 credits)
 * 2. Monthly renewals (3 tiers → 200, 1000, 5000 credits)
 * 3. Initial subscription (3 tiers → correct initialCredits from tier)
 * 4. Cumulative balance calculation (sequential purchases sum correctly)
 * 5. Transaction logging (type, amount, balanceAfter, metadata recorded)
 */

import { describe, expect, it } from "vitest";
import { internal } from "../../convex/_generated/api";
import {
	CREDIT_PACKAGES,
	makeT,
	seedSubscription,
	seedTier,
	TEST_SUB_ID,
	TEST_USER_ID,
} from "./polar-test-helpers";

// ── 1. One-time purchase: all 4 products ─────────────────────────────────────
describe("Credit Allocation: addPurchaseCredits – 4 product IDs", () => {
	it.each(
		Object.entries(CREDIT_PACKAGES),
	)("productId %s → %i credits added", async (productId, expectedCredits) => {
		const t = makeT();
		const result = await t.mutation(internal.credits.addPurchaseCredits, {
			clerkUserId: TEST_USER_ID,
			polarOrderId: `ord_${productId.slice(0, 8)}`,
			polarProductId: productId,
			creditAmount: expectedCredits,
		});
		expect(result.success).toBe(true);
		expect(result.creditsAdded).toBe(expectedCredits);
		expect(result.newBalance).toBe(expectedCredits);
	});
});

// ── 2. Monthly renewal: 3 tiers ───────────────────────────────────────────────
describe("Credit Allocation: addMonthlyRenewalCredits – 3 tiers", () => {
	it.each([
		["tier_1", 200],
		["tier_2", 1000],
		["tier_3", 5000],
	] as const)("%s → %i monthly credits", async (tierKey, monthlyCredits) => {
		const t = makeT();
		await seedTier(t, { tierKey, monthlyCredits });
		await seedSubscription(t, { tierKey });
		const result = await t.mutation(internal.credits.addMonthlyRenewalCredits, {
			clerkUserId: TEST_USER_ID,
			polarSubscriptionId: TEST_SUB_ID,
			polarOrderId: `ord_renewal_${tierKey}`,
		});
		expect(result.success).toBe(true);
		expect(result.creditsAdded).toBe(monthlyCredits);
		expect(result.newBalance).toBe(monthlyCredits);
	});
});

// ── 3. Initial subscription: 3 tiers ─────────────────────────────────────────
describe("Credit Allocation: initializeForSubscription – 3 tiers", () => {
	it.each([
		["tier_1", 200],
		["tier_2", 1000],
		["tier_3", 5000],
	] as const)("%s → %i initial credits", async (tierKey, initialCredits) => {
		const t = makeT();
		await seedTier(t, {
			tierKey,
			initialCredits,
			monthlyCredits: initialCredits,
		});
		const result = await t.mutation(
			internal.credits.initializeForSubscription,
			{
				clerkUserId: TEST_USER_ID,
				tierKey,
			},
		);
		expect(result.success).toBe(true);
		expect(result.creditsGranted).toBe(initialCredits);
	});
});

// ── 4. Cumulative balance calculation ─────────────────────────────────────────
describe("Credit Allocation: cumulative balance", () => {
	it("two sequential purchases sum correctly", async () => {
		const t = makeT();

		// First purchase: 25 credits
		await t.mutation(internal.credits.addPurchaseCredits, {
			clerkUserId: TEST_USER_ID,
			polarOrderId: "ord_balance_001",
			polarProductId: "d3b0791a-f692-4564-8690-6f85bc9d435b",
			creditAmount: 25,
		});

		// Second purchase: 55 credits — balance must be 80
		const result = await t.mutation(internal.credits.addPurchaseCredits, {
			clerkUserId: TEST_USER_ID,
			polarOrderId: "ord_balance_002",
			polarProductId: "86e14b99-a194-45fe-87e3-466fca2e9bb5",
			creditAmount: 55,
		});

		expect(result.success).toBe(true);
		expect(result.newBalance).toBe(80);
	});
});

// ── 5. Transaction logging ─────────────────────────────────────────────────────
describe("Credit Allocation: transaction logging", () => {
	it("purchase transaction recorded with correct type, amount, balanceAfter and metadata", async () => {
		const t = makeT();
		const PRODUCT_ID = "44da7533-0a4b-4a26-b641-9b45e81c2d07";
		const ORDER_ID = "ord_txlog_001";

		await t.mutation(internal.credits.addPurchaseCredits, {
			clerkUserId: TEST_USER_ID,
			polarOrderId: ORDER_ID,
			polarProductId: PRODUCT_ID,
			creditAmount: 115,
		});

		const tx = await t.run(async (ctx) => {
			return ctx.db
				.query("creditTransactions")
				.withIndex("by_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.first();
		});

		expect(tx).not.toBeNull();
		expect(tx?.type).toBe("purchase");
		expect(tx?.amount).toBe(115);
		expect(tx?.balanceAfter).toBe(115);
		expect(tx?.metadata?.polarOrderId).toBe(ORDER_ID);
		expect(tx?.metadata?.polarProductId).toBe(PRODUCT_ID);
	});
});
