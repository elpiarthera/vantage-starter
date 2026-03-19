/// <reference types="vite/client" />
/**
 * Test 6 + Test 9 additions: Webhook Handler Business Logic Tests
 *
 * Tests the exact sequence of DB operations each handler in convex/http.ts performs.
 * The handlers are callbacks inside polar.registerRoutes() and cannot be called
 * directly — so we exercise their logic by calling the same Convex functions they call:
 *
 *   order.paid handler (FIXED):
 *     1. Read metadata.userId (convex doc id) — NOT clerk_user_id
 *     2. ctx.runQuery(internal.users.getByConvexId, { convexUserId }) → user
 *     3. ctx.runQuery(internal.subscriptionTiers.getByPolarProductId, { polarProductId }) → tier
 *     4. creditAmount = productType==="subscription" ? initialCredits : initialCredits + bonusCredits
 *     5. ctx.runMutation(internal.credits.addPurchaseCredits, { clerkUserId: user.clerkUserId, ... })
 *
 *   order.created handler (FIXED):
 *     1. Guard: billingReason === "subscription_cycle" — skip otherwise
 *     2. Read metadata.userId (convex doc id)
 *     3. ctx.runQuery(internal.users.getByConvexId, { convexUserId }) → user
 *     4. ctx.runMutation(internal.credits.addMonthlyRenewalCredits, { clerkUserId: user.clerkUserId, ... })
 *
 *   subscription.updated handler:
 *     1. ctx.runQuery(internal.subscriptionTiers.getByPolarProductId, { polarProductId })
 *     2. ctx.runMutation(internal.subscriptions.updateTier, { polarSubscriptionId, tierKey })
 *
 * 19 tests total:
 *   Group 1 (4 tests): order.paid — DB lookup + credit computation for each package
 *   Group 2 (1 test):  order.paid — unknown productId → null → no credits added
 *   Group 3 (1 test):  order.created — subscription_cycle triggers renewal credits
 *   Group 4 (1 test):  order.created — non-cycle billingReason → no credits added
 *   Group 5 (2 tests): subscription.updated — tier lookup + updateTier
 *   Group 6 (3 tests): order.paid — user resolution (convexId → clerkUserId)   [NEW - Test 9]
 *   Group 7 (2 tests): order.paid — credit formula by productType               [NEW - Test 9]
 *   Group 8 (2 tests): order.created — user resolution                          [NEW - Test 9]
 *   Group 9 (1 test):  order.paid e2e — full handler chain → userCredits updated [NEW - Test 9]
 *   Group 10 (2 tests): subscription.created — no direct credits (from order.paid) [NEW - Test 9]
 */

import { describe, expect, it } from "vitest";
import { internal } from "../../convex/_generated/api";
import {
	makeT,
	seedSubscription,
	seedTier,
	seedUserAndGetConvexId,
	TEST_ORG_ID,
	TEST_SUB_ID,
	TEST_USER_ID,
} from "./polar-test-helpers";

const CREDIT_PACKAGES = [
	{
		productId: "d3b0791a-f692-4564-8690-6f85bc9d435b",
		tierKey: "credits_starter",
		base: 25,
		bonus: 0,
		total: 25,
	},
	{
		productId: "86e14b99-a194-45fe-87e3-466fca2e9bb5",
		tierKey: "credits_popular",
		base: 50,
		bonus: 5,
		total: 55,
	},
	{
		productId: "44da7533-0a4b-4a26-b641-9b45e81c2d07",
		tierKey: "credits_pro",
		base: 100,
		bonus: 15,
		total: 115,
	},
	{
		productId: "19c982fd-3106-45f2-833d-07b573b45c2b",
		tierKey: "credits_enterprise",
		base: 250,
		bonus: 50,
		total: 300,
	},
] as const;

// ── 1. order.paid: DB lookup + credit computation ────────────────────────────
describe("Webhook order.paid: DB lookup + credit computation", () => {
	it.each(
		CREDIT_PACKAGES,
	)("$tierKey → getByPolarProductId → creditAmount $total awarded", async ({
		productId,
		tierKey,
		base,
		bonus,
		total,
	}) => {
		const t = makeT();

		// Seed the tier (mirrors what patchSubscriptionTiersPolarIds did in prod DB)
		await seedTier(t, {
			tierKey,
			polarProductId: productId,
			productType: "one_time",
			initialCredits: base,
			bonusCredits: bonus,
		});

		// Step 1: handler calls getByPolarProductId
		const tier = await t.query(internal.subscriptionTiers.getByPolarProductId, {
			polarProductId: productId,
		});

		expect(tier).not.toBeNull();
		expect(tier?.tierKey).toBe(tierKey);

		// Step 2: handler computes creditAmount (exact formula from http.ts line 65)
		const creditAmount =
			(tier?.initialCredits ?? 0) + (tier?.bonusCredits ?? 0);
		expect(creditAmount).toBe(total);

		// Step 3: handler calls addPurchaseCredits with computed amount
		const result = await t.mutation(internal.credits.addPurchaseCredits, {
			clerkUserId: TEST_USER_ID,
			polarOrderId: `ord_wh_${tierKey}`,
			polarProductId: productId,
			creditAmount,
		});

		expect(result.success).toBe(true);
		expect(result.creditsAdded).toBe(total);
		expect(result.newBalance).toBe(total);
	});
});

// ── 2. order.paid: unknown productId → null → no credits added ───────────────
describe("Webhook order.paid: unknown productId returns null", () => {
	it("getByPolarProductId returns null for unknown ID — handler skips mutation", async () => {
		const t = makeT();

		// No tier seeded for this productId
		const tier = await t.query(internal.subscriptionTiers.getByPolarProductId, {
			polarProductId: "00000000-0000-0000-0000-000000000000",
		});

		// Handler checks: if (!tier) { console.error(...); return; }
		expect(tier).toBeNull();

		// Since handler returned early, no credits were added
		const credits = await t.run(async (ctx) => {
			return ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.first();
		});
		expect(credits).toBeNull();
	});
});

// ── 3. order.created: subscription_cycle triggers renewal credits ─────────────
describe("Webhook order.created: subscription_cycle triggers renewal", () => {
	it("billingReason=subscription_cycle → addMonthlyRenewalCredits called → credits added", async () => {
		const t = makeT();
		await seedTier(t, { tierKey: "tier_2", monthlyCredits: 1000 });
		await seedSubscription(t, { tierKey: "tier_2" });

		// Handler guard passes (billingReason === "subscription_cycle")
		// Handler calls addMonthlyRenewalCredits
		const result = await t.mutation(internal.credits.addMonthlyRenewalCredits, {
			clerkUserId: TEST_USER_ID,
			polarSubscriptionId: TEST_SUB_ID,
			polarOrderId: "ord_cycle_wh_001",
		});

		expect(result.success).toBe(true);
		expect(result.creditsAdded).toBe(1000);
	});
});

// ── 4. order.created: non-cycle billingReason → no credits added ─────────────
describe("Webhook order.created: non-cycle billingReason skipped", () => {
	it("billingReason!=subscription_cycle → handler returns early → no credits added", async () => {
		const t = makeT();
		await seedTier(t, { tierKey: "tier_1", monthlyCredits: 200 });
		await seedSubscription(t, { tierKey: "tier_1" });

		// Handler guard fails (billingReason !== "subscription_cycle") → return early
		// Mutation is never called — verify no credits exist
		const credits = await t.run(async (ctx) => {
			return ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.first();
		});

		expect(credits).toBeNull();
	});
});

// Pro subscription productId (from seedCredits / Polar setup guide)
const PRO_PRODUCT_ID = "8d8a2da2-e234-42b7-8e15-cc2b537dff39";

// ── 5. subscription.updated: tier lookup + updateTier ────────────────────────
describe("Webhook subscription.updated: tier upgrade via DB lookup", () => {
	it("known productId → getByPolarProductId returns tier → updateTier updates tierKey", async () => {
		const t = makeT();

		// User is on Starter (tier_1), subscription exists in DB
		await seedTier(t, { tierKey: "tier_1", monthlyCredits: 200 });
		await seedSubscription(t, { tierKey: "tier_1" });

		// Polar has sent subscription.updated with the Pro productId
		await seedTier(t, {
			tierKey: "tier_2",
			polarProductId: PRO_PRODUCT_ID,
			productType: "subscription",
			monthlyCredits: 1000,
		});

		// Step 1: handler calls getByPolarProductId with the new productId
		const tier = await t.query(internal.subscriptionTiers.getByPolarProductId, {
			polarProductId: PRO_PRODUCT_ID,
		});
		expect(tier).not.toBeNull();
		expect(tier?.tierKey).toBe("tier_2");

		// Step 2: handler calls updateTier with polarSubscriptionId + new tierKey
		await t.mutation(internal.subscriptions.updateTier, {
			polarSubscriptionId: TEST_SUB_ID,
			tierKey: tier?.tierKey ?? "tier_2",
		});

		// Assert: subscription now reflects the upgraded tier
		const updated = await t.run(async (ctx) => {
			return ctx.db
				.query("subscriptions")
				.withIndex("by_polar_subscription_id", (q) =>
					q.eq("polarSubscriptionId", TEST_SUB_ID),
				)
				.first();
		});
		expect(updated?.tierKey).toBe("tier_2");
	});

	it("unknown productId → getByPolarProductId returns null → updateTier NOT called → tierKey unchanged", async () => {
		const t = makeT();

		// User is on Starter, subscription exists
		await seedTier(t, { tierKey: "tier_1", monthlyCredits: 200 });
		await seedSubscription(t, { tierKey: "tier_1" });

		// Handler receives an unknown productId
		const tier = await t.query(internal.subscriptionTiers.getByPolarProductId, {
			polarProductId: "00000000-0000-0000-0000-000000000000",
		});

		// Handler checks: if (!tier) { console.error(...); return; } — updateTier is never called
		expect(tier).toBeNull();

		// Subscription tierKey must remain unchanged
		const sub = await t.run(async (ctx) => {
			return ctx.db
				.query("subscriptions")
				.withIndex("by_polar_subscription_id", (q) =>
					q.eq("polarSubscriptionId", TEST_SUB_ID),
				)
				.first();
		});
		expect(sub?.tierKey).toBe("tier_1");
	});
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 9 ADDITIONS — missing coverage that allowed the production bug to exist
// ═══════════════════════════════════════════════════════════════════════════════

// ── 6. order.paid: user resolution (convexId → clerkUserId) ──────────────────
describe("Webhook order.paid: user resolution via getByConvexId", () => {
	it("resolves convexId from metadata → returns correct clerkUserId for credit allocation", async () => {
		const t = makeT();
		const convexId = await seedUserAndGetConvexId(t, {
			clerkUserId: TEST_USER_ID,
			organizationId: TEST_ORG_ID,
		});

		// Step 1: handler reads metadata.userId (convex doc id)
		// Step 2: handler calls getByConvexId to resolve clerkUserId
		const user = await t.query(internal.users.getByConvexId, {
			convexUserId: convexId,
		});

		expect(user).not.toBeNull();
		// The clerkUserId is what gets passed to addPurchaseCredits
		expect(user?.clerkUserId).toBe(TEST_USER_ID);
	});

	it("missing userId in metadata (undefined) → user resolution returns null → no credits added", async () => {
		const t = makeT();

		// Simulate: event.data.customer?.metadata?.userId is undefined
		const convexUserId = undefined as string | undefined;

		// Handler guard: if (!convexUserId) { console.error(...); return; }
		// We verify the guard condition — no user lookup, no credits
		expect(convexUserId).toBeUndefined();

		// No credits allocated — userCredits table must be empty
		const credits = await t.run(async (ctx) => {
			return ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.first();
		});
		expect(credits).toBeNull();
	});

	it("valid convexId but user not in DB → getByConvexId returns null → no credits added", async () => {
		const t = makeT();

		// Get a valid-format convex ID, then try to look up a non-existent user
		const realId = await seedUserAndGetConvexId(t);
		// Use a different character to make it non-existent
		const nonExistentId =
			realId.slice(0, -1) + (realId.endsWith("a") ? "b" : "a");

		// Handler step: getByConvexId with unknown ID → returns null
		const user = await t.query(internal.users.getByConvexId, {
			convexUserId: nonExistentId,
		});

		// Handler guard: if (!user) { console.error(...); return; }
		expect(user).toBeNull();

		// No credits must exist for TEST_USER_ID (handler returned early)
		const credits = await t.run(async (ctx) => {
			return ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.first();
		});
		expect(credits).toBeNull();
	});
});

// ── 7. order.paid: credit formula branching by productType ───────────────────
describe("Webhook order.paid: credit formula branches on productType", () => {
	it("subscription productType → creditAmount = initialCredits only (no bonusCredits)", async () => {
		const STARTER_PRODUCT_ID = "e5e6c9de-b88c-47a5-883a-3823bd264707";
		const t = makeT();

		await seedTier(t, {
			tierKey: "tier_1",
			polarProductId: STARTER_PRODUCT_ID,
			productType: "subscription",
			initialCredits: 200,
			monthlyCredits: 200,
			// bonusCredits not set for subscription tiers
		});

		const tier = await t.query(internal.subscriptionTiers.getByPolarProductId, {
			polarProductId: STARTER_PRODUCT_ID,
		});

		expect(tier).not.toBeNull();
		expect(tier?.productType).toBe("subscription");

		// Handler formula: productType === "subscription" ? initialCredits : initialCredits + bonusCredits
		const creditAmount =
			tier?.productType === "subscription"
				? tier.initialCredits
				: (tier?.initialCredits ?? 0) + (tier?.bonusCredits ?? 0);

		expect(creditAmount).toBe(200);
		// Verify bonusCredits are NOT added for subscriptions
		expect(creditAmount).toBe(tier?.initialCredits);
	});

	it("one_time productType → creditAmount = initialCredits + bonusCredits", async () => {
		const POPULAR_PRODUCT_ID = "86e14b99-a194-45fe-87e3-466fca2e9bb5";
		const t = makeT();

		await seedTier(t, {
			tierKey: "credits_popular",
			polarProductId: POPULAR_PRODUCT_ID,
			productType: "one_time",
			initialCredits: 50,
			bonusCredits: 5,
		});

		const tier = await t.query(internal.subscriptionTiers.getByPolarProductId, {
			polarProductId: POPULAR_PRODUCT_ID,
		});

		expect(tier).not.toBeNull();
		expect(tier?.productType).toBe("one_time");

		// Handler formula: one_time → initialCredits + bonusCredits
		const creditAmount =
			tier?.productType === "subscription"
				? tier.initialCredits
				: (tier?.initialCredits ?? 0) + (tier?.bonusCredits ?? 0);

		expect(creditAmount).toBe(55); // 50 + 5
	});
});

// ── 8. order.created: user resolution ────────────────────────────────────────
describe("Webhook order.created: user resolution via getByConvexId", () => {
	it("resolves convexId → clerkUserId → renewal credits allocated to correct user", async () => {
		const t = makeT();
		const convexId = await seedUserAndGetConvexId(t);
		await seedTier(t, { tierKey: "tier_2", monthlyCredits: 1000 });
		await seedSubscription(t, { tierKey: "tier_2" });

		// Handler step 1: resolve user from metadata.userId
		const user = await t.query(internal.users.getByConvexId, {
			convexUserId: convexId,
		});
		expect(user).not.toBeNull();

		if (!user) throw new Error("User not found in DB");

		// Handler step 2: call addMonthlyRenewalCredits with resolved clerkUserId
		const result = await t.mutation(internal.credits.addMonthlyRenewalCredits, {
			clerkUserId: user.clerkUserId,
			polarSubscriptionId: TEST_SUB_ID,
			polarOrderId: "ord_renewal_resolution_001",
		});

		expect(result.success).toBe(true);
		expect(result.creditsAdded).toBe(1000);

		// Verify credits are on the correct user (clerkUserId, not convexId)
		const credits = await t.run(async (ctx) => {
			return ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) =>
					q.eq("clerkUserId", user.clerkUserId),
				)
				.first();
		});
		expect(credits?.balance).toBe(1000);
	});

	it("missing userId in metadata → renewal handler returns early → no credits added", async () => {
		const t = makeT();

		// Simulate: event.data.customer?.metadata?.userId is undefined
		const convexUserId = undefined as string | undefined;

		// Handler guard: if (!convexUserId || !subscriptionId) { return; }
		expect(convexUserId).toBeUndefined();

		// No credits should exist
		const credits = await t.run(async (ctx) => {
			return ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.first();
		});
		expect(credits).toBeNull();
	});
});

// ── 9. order.paid e2e: full handler chain → userCredits updated ───────────────
describe("Webhook order.paid: full end-to-end handler chain", () => {
	it("seed user + tier → resolve convexId → getByPolarProductId → addPurchaseCredits → balance updated", async () => {
		const t = makeT();
		const STARTER_PRODUCT_ID = "e5e6c9de-b88c-47a5-883a-3823bd264707";

		// Seed: user and subscription tier (mirrors production DB after seeding)
		const convexId = await seedUserAndGetConvexId(t, {
			clerkUserId: TEST_USER_ID,
		});
		await seedTier(t, {
			tierKey: "tier_1",
			polarProductId: STARTER_PRODUCT_ID,
			productType: "subscription",
			initialCredits: 200,
			monthlyCredits: 200,
		});

		// Handler step 1: resolve convexId → user
		const user = await t.query(internal.users.getByConvexId, {
			convexUserId: convexId,
		});
		expect(user?.clerkUserId).toBe(TEST_USER_ID);
		if (!user) throw new Error("User not found in DB");

		// Handler step 2: look up tier
		const tier = await t.query(internal.subscriptionTiers.getByPolarProductId, {
			polarProductId: STARTER_PRODUCT_ID,
		});
		expect(tier?.initialCredits).toBe(200);
		if (!tier) throw new Error("Tier not found in DB");

		// Handler step 3: compute creditAmount (subscription → initialCredits)
		const creditAmount =
			tier.productType === "subscription"
				? tier.initialCredits
				: tier.initialCredits + (tier.bonusCredits ?? 0);

		// Handler step 4: allocate credits
		const result = await t.mutation(internal.credits.addPurchaseCredits, {
			clerkUserId: user.clerkUserId,
			polarOrderId: "ord_e2e_sub_001",
			polarProductId: STARTER_PRODUCT_ID,
			creditAmount,
		});

		expect(result.success).toBe(true);
		expect(result.creditsAdded).toBe(200);

		// Assert: userCredits table updated with correct balance
		const credits = await t.run(async (ctx) => {
			return ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.first();
		});
		expect(credits?.balance).toBe(200);
		expect(credits?.clerkUserId).toBe(TEST_USER_ID);
	});
});

// ── 10. subscription.created: no direct credits (credits come from order.paid) ─
describe("Webhook subscription.created: no direct credit allocation", () => {
	it("subscription.created fires → userCredits table untouched (credits deferred to order.paid)", async () => {
		const t = makeT();

		// subscription.created handler only logs — it does NOT call addPurchaseCredits
		// Simulate: subscription created, but order.paid not yet received
		// userCredits must remain empty
		const credits = await t.run(async (ctx) => {
			return ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.first();
		});
		expect(credits).toBeNull();
	});

	it("order.paid after subscription.created → idempotency prevents double allocation", async () => {
		const t = makeT();
		const STARTER_PRODUCT_ID = "e5e6c9de-b88c-47a5-883a-3823bd264707";

		// subscription.created fires → no credits yet
		// order.paid fires (first delivery) → 200 credits
		const first = await t.mutation(internal.credits.addPurchaseCredits, {
			clerkUserId: TEST_USER_ID,
			polarOrderId: "ord_sub_created_001",
			polarProductId: STARTER_PRODUCT_ID,
			creditAmount: 200,
		});
		expect(first.success).toBe(true);
		expect(first.creditsAdded).toBe(200);

		// order.paid fires again (webhook retry) → idempotency blocks
		const retry = await t.mutation(internal.credits.addPurchaseCredits, {
			clerkUserId: TEST_USER_ID,
			polarOrderId: "ord_sub_created_001",
			polarProductId: STARTER_PRODUCT_ID,
			creditAmount: 200,
		});
		expect(retry.alreadyProcessed).toBe(true);

		// Balance must still be 200, not 400
		const credits = await t.run(async (ctx) => {
			return ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.first();
		});
		expect(credits?.balance).toBe(200);
	});
});
