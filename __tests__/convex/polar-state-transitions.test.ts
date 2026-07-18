/// <reference types="vite/client" />
/**
 * Task 14c: State Transition Tests
 *
 * Verifies correct behaviour across subscription lifecycle changes:
 *
 * 1. Downgrade: user with 3,000 credits, updateTier tier_3 → tier_1
 *    → credit balance unchanged (credits are preserved, not wiped).
 * 2. Tier upgrade lifecycle: updateTier tier_1 → tier_2 → tier_3
 *    → each step correctly sets tierKey on the subscriptions record.
 * 3. Cancel: subscriptions.cancel marks status "canceled" but the
 *    userCredits row is NOT deleted (user keeps remaining credits).
 * 4. updateTier also patches userCredits.subscriptionTier in sync
 *    (verifies the Bug 2 fix from Task 13).
 */

import { describe, expect, it } from "vitest";
import { internal } from "../../convex/_generated/api";
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

// ── 1. Downgrade: credits preserved after tier change ─────────────────────────
describe("State transition: downgrade preserves credit balance", () => {
	it("updateTier tier_3 → tier_1 leaves the userCredits balance untouched", async () => {
		const t = makeT();
		await seedUser(t);
		await seedTier(t, {
			tierKey: "tier_3",
			initialCredits: 5000,
			monthlyCredits: 5000,
		});
		await seedTier(t, {
			tierKey: "tier_1",
			initialCredits: 200,
			monthlyCredits: 200,
		});
		await seedSubscription(t, { tierKey: "tier_3" });

		// Give the user 3,000 credits (simulates accumulated balance)
		await t.run(async (ctx) => {
			await ctx.db.insert("userCredits", {
				clerkUserId: TEST_USER_ID,
				organizationId: TEST_ORG_ID,
				balance: 3000,
				totalPurchased: 3000,
				totalUsed: 0,
				totalBonusReceived: 0,
				subscriptionTier: "tier_3",
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
		});

		// Downgrade subscription tier
		await t.mutation(internal.subscriptions.updateTier, {
			polarSubscriptionId: TEST_SUB_ID,
			tierKey: "tier_1",
		});

		// Balance must remain 3,000
		const credits = await t.run(async (ctx) =>
			ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.first(),
		);
		expect(credits?.balance).toBe(3000);
		// subscriptionTier updated to reflect the new tier
		expect(credits?.subscriptionTier).toBe("tier_1");
	});
});

// ── 2. Upgrade lifecycle: tierKey correctly updated at each step ───────────────
describe("State transition: tier upgrade lifecycle", () => {
	it("updateTier tier_1 → tier_2 → tier_3 sets correct tierKey each time", async () => {
		const t = makeT();
		await seedUser(t);
		await seedTier(t, { tierKey: "tier_1" });
		await seedTier(t, { tierKey: "tier_2" });
		await seedTier(t, { tierKey: "tier_3" });
		await seedSubscription(t, { tierKey: "tier_1" });

		// Seed userCredits for the user
		await t.run(async (ctx) => {
			await ctx.db.insert("userCredits", {
				clerkUserId: TEST_USER_ID,
				organizationId: TEST_ORG_ID,
				balance: 200,
				totalPurchased: 200,
				totalUsed: 0,
				totalBonusReceived: 0,
				subscriptionTier: "tier_1",
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
		});

		const getSub = async () =>
			t.run(async (ctx) =>
				ctx.db
					.query("subscriptions")
					.withIndex("by_polar_subscription_id", (q) =>
						q.eq("polarSubscriptionId", TEST_SUB_ID),
					)
					.first(),
			);

		// Step 1: tier_1 → tier_2
		await t.mutation(internal.subscriptions.updateTier, {
			polarSubscriptionId: TEST_SUB_ID,
			tierKey: "tier_2",
		});
		expect((await getSub())?.tierKey).toBe("tier_2");

		// Step 2: tier_2 → tier_3
		await t.mutation(internal.subscriptions.updateTier, {
			polarSubscriptionId: TEST_SUB_ID,
			tierKey: "tier_3",
		});
		expect((await getSub())?.tierKey).toBe("tier_3");

		// Step 3: tier_3 → tier_1 (downgrade back)
		await t.mutation(internal.subscriptions.updateTier, {
			polarSubscriptionId: TEST_SUB_ID,
			tierKey: "tier_1",
		});
		expect((await getSub())?.tierKey).toBe("tier_1");
	});
});

// ── 3. Cancel: status updated, userCredits row survives ───────────────────────
describe("State transition: cancel preserves userCredits", () => {
	it("subscriptions.cancel marks status canceled but does NOT delete userCredits", async () => {
		const t = makeT();
		await seedUser(t);
		await seedTier(t, { tierKey: TEST_TIER_KEY });
		await seedSubscription(t, { status: "active" });

		// Seed userCredits with a balance
		await t.run(async (ctx) => {
			await ctx.db.insert("userCredits", {
				clerkUserId: TEST_USER_ID,
				organizationId: TEST_ORG_ID,
				balance: 500,
				totalPurchased: 500,
				totalUsed: 0,
				totalBonusReceived: 0,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
		});

		// Cancel the subscription
		await t.mutation(internal.subscriptions.cancel, {
			polarSubscriptionId: TEST_SUB_ID,
		});

		// Subscription must be canceled
		const sub = await t.run(async (ctx) =>
			ctx.db
				.query("subscriptions")
				.withIndex("by_polar_subscription_id", (q) =>
					q.eq("polarSubscriptionId", TEST_SUB_ID),
				)
				.first(),
		);
		expect(sub?.status).toBe("canceled");

		// userCredits must still exist with full balance (500 credits not lost)
		const credits = await t.run(async (ctx) =>
			ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.first(),
		);
		expect(credits).not.toBeNull();
		expect(credits?.balance).toBe(500);
	});
});

// ── 4. updateTier patches userCredits.subscriptionTier in sync ────────────────
describe("State transition: updateTier syncs userCredits.subscriptionTier", () => {
	it("userCredits.subscriptionTier matches the new tierKey after updateTier", async () => {
		const t = makeT();
		await seedUser(t);
		await seedTier(t, { tierKey: "tier_1" });
		await seedTier(t, { tierKey: "tier_2" });
		await seedSubscription(t, { tierKey: "tier_1" });

		// Seed userCredits with tier_1
		await t.run(async (ctx) => {
			await ctx.db.insert("userCredits", {
				clerkUserId: TEST_USER_ID,
				organizationId: TEST_ORG_ID,
				balance: 200,
				totalPurchased: 200,
				totalUsed: 0,
				totalBonusReceived: 0,
				subscriptionTier: "tier_1",
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
		});

		// Upgrade tier
		await t.mutation(internal.subscriptions.updateTier, {
			polarSubscriptionId: TEST_SUB_ID,
			tierKey: "tier_2",
		});

		const credits = await t.run(async (ctx) =>
			ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.first(),
		);
		// subscriptionTier must now reflect the upgraded tier
		expect(credits?.subscriptionTier).toBe("tier_2");
		// Balance unchanged
		expect(credits?.balance).toBe(200);
	});
});
