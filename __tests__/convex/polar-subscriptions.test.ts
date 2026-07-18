/// <reference types="vite/client" />
/**
 * Test 3: Subscription Lifecycle Tests
 *
 * Verifies subscription CRUD operations:
 * 1. Create subscription → record stored with correct fields
 * 2. Get subscription by clerkUserId → returns active subscription
 * 3. Update subscription tier → tierKey changed
 * 4. Cancel subscription → status becomes "canceled"
 * 5. Cancel subscription → user credits NOT removed
 * 6. Multiple users → each user has their own isolated subscription
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
	TEST_USER_ID,
} from "./polar-test-helpers";

const BASE_ARGS = {
	clerkUserId: TEST_USER_ID,
	polarSubscriptionId: TEST_SUB_ID,
	polarCustomerId: "cus_test_123",
	polarProductId: "prod_test_123",
	tierKey: "tier_1",
	status: "active",
	currentPeriodStart: Date.now(),
	currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
};

// ── 1. Create subscription → correct fields stored ───────────────────────────
describe("Subscription Lifecycle: create", () => {
	it("stores subscription with correct fields", async () => {
		const t = makeT();
		await seedUser(t);
		await seedTier(t, { tierKey: "tier_1", monthlyCredits: 1000 });

		const result = await t.mutation(internal.subscriptions.create, BASE_ARGS);
		expect(result.success).toBe(true);

		const sub = await t.run(async (ctx) => {
			return ctx.db
				.query("subscriptions")
				.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.first();
		});

		expect(sub).not.toBeNull();
		expect(sub?.clerkUserId).toBe(TEST_USER_ID);
		expect(sub?.organizationId).toBe(TEST_ORG_ID);
		expect(sub?.tierKey).toBe("tier_1");
		expect(sub?.polarSubscriptionId).toBe(TEST_SUB_ID);
		expect(sub?.status).toBe("active");
		expect(sub?.plan.monthlyCredits).toBe(1000);
	});
});

// ── 2. Get subscription by clerkUserId ────────────────────────────────────────
describe("Subscription Lifecycle: getByClerkUserId", () => {
	it("returns active subscription for the correct user", async () => {
		const t = makeT();
		await seedUser(t);
		await seedTier(t, { tierKey: "tier_1", monthlyCredits: 1000 });
		await t.mutation(internal.subscriptions.create, BASE_ARGS);

		const sub = await t
			.withIdentity({ subject: TEST_USER_ID })
			.query(api.subscriptions.getByClerkUserId, {
				clerkUserId: TEST_USER_ID,
			});

		expect(sub).not.toBeNull();
		expect(sub?.polarSubscriptionId).toBe(TEST_SUB_ID);
		expect(sub?.status).toBe("active");
	});

	it("returns null when user has no subscription", async () => {
		const t = makeT();
		await seedUser(t);

		const sub = await t
			.withIdentity({ subject: TEST_USER_ID })
			.query(api.subscriptions.getByClerkUserId, {
				clerkUserId: TEST_USER_ID,
			});

		expect(sub).toBeNull();
	});
});

// ── 3. Update subscription tier ───────────────────────────────────────────────
describe("Subscription Lifecycle: updateTier", () => {
	it("changes tierKey on the subscription record", async () => {
		const t = makeT();
		await seedSubscription(t, { tierKey: "tier_1" });

		await t.mutation(internal.subscriptions.updateTier, {
			polarSubscriptionId: TEST_SUB_ID,
			tierKey: "tier_2",
		});

		const sub = await t.run(async (ctx) => {
			return ctx.db
				.query("subscriptions")
				.withIndex("by_polar_subscription_id", (q) =>
					q.eq("polarSubscriptionId", TEST_SUB_ID),
				)
				.first();
		});

		expect(sub?.tierKey).toBe("tier_2");
	});
});

// ── 4. Cancel subscription → status "canceled" ────────────────────────────────
describe("Subscription Lifecycle: cancel – status", () => {
	it("sets status to canceled", async () => {
		const t = makeT();
		await seedSubscription(t);

		await t.mutation(internal.subscriptions.cancel, {
			polarSubscriptionId: TEST_SUB_ID,
		});

		const sub = await t.run(async (ctx) => {
			return ctx.db
				.query("subscriptions")
				.withIndex("by_polar_subscription_id", (q) =>
					q.eq("polarSubscriptionId", TEST_SUB_ID),
				)
				.first();
		});

		expect(sub?.status).toBe("canceled");
		expect(sub?.canceledAt).toBeDefined();
	});
});

// ── 5. Cancel subscription → credits NOT removed ──────────────────────────────
describe("Subscription Lifecycle: cancel – credits retained", () => {
	it("does not touch userCredits balance on cancellation", async () => {
		const t = makeT();
		await seedSubscription(t);

		// Give user 500 credits first
		await t.run(async (ctx) => {
			await ctx.db.insert("userCredits", {
				clerkUserId: TEST_USER_ID,
				balance: 500,
				totalPurchased: 500,
				totalUsed: 0,
				totalBonusReceived: 0,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
		});

		await t.mutation(internal.subscriptions.cancel, {
			polarSubscriptionId: TEST_SUB_ID,
		});

		const credits = await t.run(async (ctx) => {
			return ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.first();
		});

		expect(credits?.balance).toBe(500);
	});
});

// ── 6. Multiple users → isolated subscriptions ────────────────────────────────
describe("Subscription Lifecycle: multi-user isolation", () => {
	it("each user has their own subscription record", async () => {
		const t = makeT();
		const USER_A = "user_a_test";
		const USER_B = "user_b_test";
		const ORG_A = "org_a_test";
		const ORG_B = "org_b_test";

		await seedUser(t, { clerkUserId: USER_A, organizationId: ORG_A });
		await seedUser(t, { clerkUserId: USER_B, organizationId: ORG_B });
		await seedTier(t, { tierKey: "tier_1", monthlyCredits: 1000 });

		await t.mutation(internal.subscriptions.create, {
			...BASE_ARGS,
			clerkUserId: USER_A,
			polarSubscriptionId: "sub_a",
		});
		await t.mutation(internal.subscriptions.create, {
			...BASE_ARGS,
			clerkUserId: USER_B,
			polarSubscriptionId: "sub_b",
		});

		const subA = await t
			.withIdentity({ subject: USER_A })
			.query(api.subscriptions.getByClerkUserId, {
				clerkUserId: USER_A,
			});
		const subB = await t
			.withIdentity({ subject: USER_B })
			.query(api.subscriptions.getByClerkUserId, {
				clerkUserId: USER_B,
			});

		expect(subA?.polarSubscriptionId).toBe("sub_a");
		expect(subB?.polarSubscriptionId).toBe("sub_b");
		expect(subA?.organizationId).toBe(ORG_A);
		expect(subB?.organizationId).toBe(ORG_B);
	});
});
