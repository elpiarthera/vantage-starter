/**
 * Test 1: Idempotency Tests (CRITICAL)
 *
 * Verifies that duplicate webhooks cannot add credits twice.
 * Financial integrity — prevents free credits via webhook retries.
 */

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { internal } from "../../convex/_generated/api";
import schema from "../../convex/schema";
import {
	modules,
	seedSubscriptionWithTier,
	TEST_SUB_ID,
	TEST_USER_ID,
} from "./polar-test-helpers";

const ORDER_ID = "ord_idempotency_test_001";
const PRODUCT_ID = "d3b0791a-f692-4564-8690-6f85bc9d435b"; // 25 credits

describe("Idempotency: addPurchaseCredits", () => {
	it("first call succeeds and credits are added", async () => {
		const t = convexTest(schema, modules);

		const result = await t.mutation(internal.credits.addPurchaseCredits, {
			clerkUserId: TEST_USER_ID,
			polarOrderId: ORDER_ID,
			polarProductId: PRODUCT_ID,
			creditAmount: 25,
		});

		expect(result.success).toBe(true);
		expect(result.alreadyProcessed).toBe(false);
		expect(result.creditsAdded).toBe(25);
		expect(result.newBalance).toBe(25);
	});

	it("second call with same polarOrderId returns alreadyProcessed:true and does NOT add credits again", async () => {
		const t = convexTest(schema, modules);

		await t.mutation(internal.credits.addPurchaseCredits, {
			clerkUserId: TEST_USER_ID,
			polarOrderId: ORDER_ID,
			polarProductId: PRODUCT_ID,
			creditAmount: 25,
		});

		const result = await t.mutation(internal.credits.addPurchaseCredits, {
			clerkUserId: TEST_USER_ID,
			polarOrderId: ORDER_ID,
			polarProductId: PRODUCT_ID,
			creditAmount: 25,
		});

		expect(result.success).toBe(true);
		expect(result.alreadyProcessed).toBe(true);

		// Balance must still be 25, not 50
		const userCredits = await t.run(async (ctx) => {
			return ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.first();
		});
		expect(userCredits?.balance).toBe(25);
	});
});

describe("Idempotency: addMonthlyRenewalCredits", () => {
	it("first call adds monthly credits", async () => {
		const t = convexTest(schema, modules);
		await seedSubscriptionWithTier(t, 1000);

		const result = await t.mutation(internal.credits.addMonthlyRenewalCredits, {
			clerkUserId: TEST_USER_ID,
			polarSubscriptionId: TEST_SUB_ID,
			polarOrderId: ORDER_ID,
		});

		expect(result.success).toBe(true);
		expect(result.creditsAdded).toBe(1000);
	});

	it("second call with same polarOrderId returns reason:duplicate and does NOT add credits again", async () => {
		const t = convexTest(schema, modules);
		await seedSubscriptionWithTier(t, 1000);

		await t.mutation(internal.credits.addMonthlyRenewalCredits, {
			clerkUserId: TEST_USER_ID,
			polarSubscriptionId: TEST_SUB_ID,
			polarOrderId: ORDER_ID,
		});

		const result = await t.mutation(internal.credits.addMonthlyRenewalCredits, {
			clerkUserId: TEST_USER_ID,
			polarSubscriptionId: TEST_SUB_ID,
			polarOrderId: ORDER_ID,
		});

		expect(result.success).toBe(false);
		expect(result.reason).toBe("duplicate");

		// Balance must still be 1000, not 2000
		const userCredits = await t.run(async (ctx) => {
			return ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.first();
		});
		expect(userCredits?.balance).toBe(1000);
	});
});
