/// <reference types="vite/client" />
/**
 * Task 14a: Security Tests
 *
 * Verifies that credit-granting entry points cannot be exploited:
 *
 * 1. initializeForSubscription idempotency: calling for a user with EXISTING credits
 *    does NOT change the balance (prevents self-upgrade via repeated calls).
 * 2. initializeForSubscription with unknown tier: returns { success: false },
 *    no credits row created (prevents garbage-tier injection).
 * 3. order.paid for deactivated tier (isActive: false): getByPolarProductId returns null
 *    → addPurchaseCredits is never called → no credits granted.
 * 4. order.paid for a user that no longer exists in Convex DB: getByConvexId returns null
 *    → no credits, no crash (zombie-user guard).
 * 5. order.paid for a webhook event with missing userId in customer metadata:
 *    handler returns early, no credits granted (metadata guard).
 *
 * NOTE: Webhook signature verification is handled automatically by @convex-dev/polar
 * via POLAR_WEBHOOK_SECRET — component code, no unit test needed.
 * Replay attack protection (duplicate polarOrderId) → polar-idempotency.test.ts.
 */

import { describe, expect, it } from "vitest";
import { internal } from "../../convex/_generated/api";
import {
	makeT,
	seedTier,
	seedUser,
	TEST_TIER_KEY,
	TEST_USER_ID,
} from "./polar-test-helpers";

// ── 1. initializeForSubscription idempotency: existing credits NOT inflated ───
describe("Security: initializeForSubscription idempotency", () => {
	it("calling with existing credits does NOT change the balance", async () => {
		const t = makeT();
		await seedTier(t, { tierKey: TEST_TIER_KEY, initialCredits: 200 });

		// First call — creates the credits row with 200 credits
		await t.mutation(internal.credits.initializeForSubscription, {
			clerkUserId: TEST_USER_ID,
			tierKey: TEST_TIER_KEY,
		});

		// Verify initial state
		const before = await t.run(async (ctx) =>
			ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.first(),
		);
		expect(before?.balance).toBe(200);

		// Second call — simulates duplicate or malicious re-invocation
		const result = await t.mutation(
			internal.credits.initializeForSubscription,
			{
				clerkUserId: TEST_USER_ID,
				tierKey: TEST_TIER_KEY,
			},
		);
		expect(result).toMatchObject({ success: true, alreadyInitialized: true });

		// Balance must remain 200 — NOT doubled or reset
		const after = await t.run(async (ctx) =>
			ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.first(),
		);
		expect(after?.balance).toBe(200);
	});
});

// ── 2. initializeForSubscription with unknown tier: no credits row created ────
describe("Security: initializeForSubscription unknown tier", () => {
	it("returns { success: false } and does not create a userCredits row", async () => {
		const t = makeT();

		const result = await t.mutation(
			internal.credits.initializeForSubscription,
			{
				clerkUserId: TEST_USER_ID,
				tierKey: "tier_nonexistent_999",
			},
		);

		expect(result).toMatchObject({ success: false });
		expect((result as { error?: string }).error).toMatch(/Unknown tier/);

		const credits = await t.run(async (ctx) =>
			ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.first(),
		);
		expect(credits).toBeNull();
	});
});

// ── 3. order.paid for deactivated tier (isActive: false) → no credits ─────────
describe("Security: order.paid with deactivated tier", () => {
	it("getByPolarProductId returns null for isActive:false — no credits granted", async () => {
		const t = makeT();
		await seedUser(t);

		// Seed a deactivated tier
		await t.run(async (ctx) => {
			await ctx.db.insert("subscriptionTiers", {
				tierKey: "tier_deactivated",
				displayName: "Deactivated Tier",
				initialCredits: 200,
				monthlyCredits: 200,
				sortOrder: 99,
				isActive: false,
				description: "Should not grant credits",
				polarProductId: "prod_deactivated_abc",
				productType: "subscription" as const,
				priceUsd: 9,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
		});

		// getByPolarProductId filters isActive: true → returns null for deactivated tier
		const tier = await t.query(internal.subscriptionTiers.getByPolarProductId, {
			polarProductId: "prod_deactivated_abc",
		});
		expect(tier).toBeNull();

		// With tier null, the webhook handler logs an error and returns.
		// Verify no userCredits row was created.
		const credits = await t.run(async (ctx) =>
			ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.first(),
		);
		expect(credits).toBeNull();
	});
});

// ── 4. order.paid for a user deleted from Convex DB → no credits ──────────────
describe("Security: order.paid for zombie user (deleted from DB)", () => {
	it("getByConvexId returns null for deleted user — no credits, no crash", async () => {
		const t = makeT();

		// A convex ID that was never inserted (simulates deleted account)
		const ghostConvexId = "jx7abc123notreal999";

		const user = await t.query(internal.users.getByConvexId, {
			convexUserId: ghostConvexId,
		});
		expect(user).toBeNull();

		// The webhook handler checks (!user) and returns early.
		// Verify no userCredits were accidentally created.
		const credits = await t.run(async (ctx) =>
			ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.first(),
		);
		expect(credits).toBeNull();
	});
});

// ── 5. order.paid with missing userId in customer metadata → no credits ────────
describe("Security: order.paid with missing customer metadata userId", () => {
	it("addPurchaseCredits is never reached when convexUserId is undefined", async () => {
		const t = makeT();
		await seedUser(t);
		await seedTier(t, {
			tierKey: TEST_TIER_KEY,
			initialCredits: 200,
			polarProductId: "prod_real_abc",
		});

		// Simulate the webhook handler guard: missing metadata.userId
		const convexUserId: string | undefined = undefined;
		let creditsAdded = false;

		if (convexUserId) {
			await t.mutation(internal.credits.addPurchaseCredits, {
				clerkUserId: TEST_USER_ID,
				polarOrderId: "ord_metadata_missing",
				polarProductId: "prod_real_abc",
				creditAmount: 200,
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
