/// <reference types="vite/client" />
/**
 * Task 16a: Transaction Error Path Tests
 *
 * Covers the failure modes and accounting invariants of credit mutations:
 *
 * 1. addMonthlyRenewalCredits: subscription found but tier record missing in DB
 *    → returns { success: false, reason: "tier_not_found" } (already guarded)
 * 2. addMonthlyRenewalCredits: tier exists but monthlyCredits is 0/undefined
 *    → returns { success: false, reason: "tier_has_no_monthly_credits" } (Task 15 fix)
 * 3. Accounting invariant: after a purchase + renewal + deduct sequence,
 *    balance === totalPurchased + totalBonusReceived - totalUsed
 */

import { describe, expect, it } from "vitest";
import { api, internal } from "../../convex/_generated/api";
import {
	makeT,
	seedSubscription,
	seedTier,
	seedUser,
	TEST_ORG_ID,
	TEST_SUB_ID,
	TEST_TIER_KEY,
	TEST_USER_ID,
} from "./polar-test-helpers";

// ── 1. addMonthlyRenewalCredits: tier record missing → tier_not_found ─────────
describe("Transactions: addMonthlyRenewalCredits tier not found", () => {
	it("returns { success: false, reason: 'tier_not_found' } when tier row missing", async () => {
		const t = makeT();
		await seedUser(t);

		// Seed a subscription pointing to a tierKey that has no matching tier row
		await t.run(async (ctx) => {
			await ctx.db.insert("subscriptions", {
				clerkUserId: TEST_USER_ID,
				organizationId: TEST_ORG_ID,
				tierKey: "tier_ghost",
				polarSubscriptionId: TEST_SUB_ID,
				polarCustomerId: "cus_test",
				polarProductId: "prod_test",
				status: "active",
				currentPeriodStart: Date.now(),
				currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
				cancelAtPeriodEnd: false,
				plan: {
					name: "Ghost Tier",
					tier: "starter",
					monthlyCredits: 200,
					features: [],
				},
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
		});

		const result = await t.mutation(internal.credits.addMonthlyRenewalCredits, {
			clerkUserId: TEST_USER_ID,
			polarSubscriptionId: TEST_SUB_ID,
			polarOrderId: "ord_tier_missing",
		});

		expect(result).toMatchObject({ success: false, reason: "tier_not_found" });

		// No credits must have been allocated
		const credits = await t.run(async (ctx) =>
			ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.first(),
		);
		expect(credits).toBeNull();
	});
});

// ── 2. addMonthlyRenewalCredits: tier has monthlyCredits: 0 → error ───────────
describe("Transactions: addMonthlyRenewalCredits with zero monthlyCredits", () => {
	it("returns { success: false, reason: 'tier_has_no_monthly_credits' } instead of silently granting 0", async () => {
		const t = makeT();
		await seedUser(t);

		// Seed a tier with monthlyCredits: 0 (e.g. a one-time credit package mis-mapped)
		await seedTier(t, {
			tierKey: TEST_TIER_KEY,
			initialCredits: 25,
			monthlyCredits: 0,
		});
		await seedSubscription(t, { tierKey: TEST_TIER_KEY });

		const result = await t.mutation(internal.credits.addMonthlyRenewalCredits, {
			clerkUserId: TEST_USER_ID,
			polarSubscriptionId: TEST_SUB_ID,
			polarOrderId: "ord_zero_monthly",
		});

		expect(result).toMatchObject({
			success: false,
			reason: "tier_has_no_monthly_credits",
		});

		// Verify no userCredits row was created (balance not silently set to 0)
		const credits = await t.run(async (ctx) =>
			ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.first(),
		);
		expect(credits).toBeNull();
	});
});

// ── 3. Accounting invariant: balance = totalPurchased + totalBonusReceived - totalUsed
describe("Transactions: accounting invariant after mixed operations", () => {
	it("balance equals totalPurchased + totalBonusReceived - totalUsed after purchase + renewal + deduct", async () => {
		const t = makeT();

		// Seed credit cost for the deduction step
		await t.run(async (ctx) => {
			await ctx.db.insert("creditCosts", {
				actionType: "test_action",
				displayName: "Test Action",
				credits: 50,
				description: "Test action cost",
				category: "chat",
				isActive: true,
				updatedAt: Date.now(),
			});
		});

		// Step 1: purchase — 200 credits (no bonus for subscription type)
		await t.mutation(internal.credits.addPurchaseCredits, {
			clerkUserId: TEST_USER_ID,
			polarOrderId: "ord_invariant_001",
			polarProductId: "prod_invariant",
			creditAmount: 200,
		});

		// Step 2: renewal — 200 more credits
		await seedTier(t, { tierKey: TEST_TIER_KEY, monthlyCredits: 200 });
		await seedSubscription(t);

		await t.mutation(internal.credits.addMonthlyRenewalCredits, {
			clerkUserId: TEST_USER_ID,
			polarSubscriptionId: TEST_SUB_ID,
			polarOrderId: "ord_invariant_002",
		});

		// Step 3: deduct — use 50 credits
		await t.mutation(internal.credits.deductCredits, {
			clerkUserId: TEST_USER_ID,
			actionType: "test_action",
		});

		// Verify accounting fields
		const credits = await t.run(async (ctx) =>
			ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.first(),
		);

		expect(credits).not.toBeNull();
		// balance = 200 (purchase) + 200 (renewal) - 50 (deduct) = 350
		expect(credits?.balance).toBe(350);
		// addPurchaseCredits increments totalPurchased
		expect(credits?.totalPurchased).toBe(200);
		// addMonthlyRenewalCredits increments totalBonusReceived (not totalPurchased)
		expect(credits?.totalBonusReceived).toBe(200);
		// deductCredits increments totalUsed
		expect(credits?.totalUsed).toBe(50);
		// Invariant: balance === totalPurchased + totalBonusReceived - totalUsed
		const invariant =
			(credits?.totalPurchased ?? 0) +
			(credits?.totalBonusReceived ?? 0) -
			(credits?.totalUsed ?? 0);
		expect(credits?.balance).toBe(invariant);
	});
});
