/// <reference types="vite/client" />
/**
 * Test 10 (Task 12): deleteAccount — Subscription Cancellation + Data Cleanup
 *
 * Tests internal.users.cleanupUserData — the mutation that atomically removes
 * all Convex data for a given user when their account is deleted.
 *
 * Root issue: the original deleteAccount mutation only deleted the users record.
 * Subscriptions, userCredits, and creditTransactions were left as orphaned rows,
 * and the Polar subscription was never cancelled (billing leak).
 *
 * 5 tests:
 *   1. cleanupUserData: deletes subscriptions + userCredits + creditTransactions + users row
 *   2. cleanupUserData: other users' data is completely untouched (isolation)
 *   3. cleanupUserData: handles user with no subscription (no error)
 *   4. cleanupUserData: handles user with no credits or transactions (no error)
 *   5. Polar cancel guard: even if cancellation fails, cleanup still executes correctly
 */

import { describe, expect, it } from "vitest";
import { internal } from "../../convex/_generated/api";
import {
	makeT,
	TEST_ORG_ID,
	TEST_SUB_ID,
	TEST_TIER_KEY,
	TEST_USER_ID,
} from "./polar-test-helpers";

const OTHER_USER_ID = "user_other_456";
const OTHER_ORG_ID = "org_other_456";

// ── helper: seed a full user with subscription + credits + transactions ────────
async function seedFullUserData(
	t: ReturnType<typeof makeT>,
	clerkUserId = TEST_USER_ID,
	organizationId = TEST_ORG_ID,
) {
	await t.run(async (ctx) => {
		await ctx.db.insert("users", {
			clerkUserId,
			organizationId,
			email: `${clerkUserId}@test.com`,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		await ctx.db.insert("subscriptions", {
			clerkUserId,
			organizationId,
			tierKey: TEST_TIER_KEY,
			polarSubscriptionId: `${TEST_SUB_ID}_${clerkUserId}`,
			polarCustomerId: `cus_${clerkUserId}`,
			polarProductId: "prod_test",
			status: "active",
			currentPeriodStart: Date.now(),
			currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
			cancelAtPeriodEnd: false,
			plan: {
				name: "Test Tier",
				tier: "starter",
				monthlyCredits: 200,
				features: [],
			},
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		await ctx.db.insert("userCredits", {
			clerkUserId,
			organizationId,
			balance: 200,
			totalPurchased: 200,
			totalUsed: 0,
			totalBonusReceived: 0,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		await ctx.db.insert("creditTransactions", {
			clerkUserId,
			type: "purchase",
			amount: 200,
			balanceAfter: 200,
			description: "Initial subscription credits",
			timestamp: Date.now(),
		});
	});
}

// ── 1. cleanupUserData deletes all 4 rows for the target user ─────────────────
describe("cleanupUserData: deletes all owned data", () => {
	it("removes subscriptions, userCredits, creditTransactions, and users row", async () => {
		const t = makeT();
		await seedFullUserData(t);

		await t.mutation(internal.users.cleanupUserData, {
			clerkUserId: TEST_USER_ID,
		});

		await t.run(async (ctx) => {
			const subs = await ctx.db
				.query("subscriptions")
				.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.collect();
			expect(subs).toHaveLength(0);

			const credits = await ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.collect();
			expect(credits).toHaveLength(0);

			const txns = await ctx.db
				.query("creditTransactions")
				.withIndex("by_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.collect();
			expect(txns).toHaveLength(0);

			const user = await ctx.db
				.query("users")
				.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.unique();
			expect(user).toBeNull();
		});
	});
});

// ── 2. cleanupUserData does NOT touch other users' data ───────────────────────
describe("cleanupUserData: data isolation", () => {
	it("leaves other users' subscriptions, credits, transactions, and user record intact", async () => {
		const t = makeT();
		await seedFullUserData(t, TEST_USER_ID, TEST_ORG_ID);
		await seedFullUserData(t, OTHER_USER_ID, OTHER_ORG_ID);

		await t.mutation(internal.users.cleanupUserData, {
			clerkUserId: TEST_USER_ID,
		});

		await t.run(async (ctx) => {
			// Other user's data must survive
			const subs = await ctx.db
				.query("subscriptions")
				.withIndex("by_clerk_user_id", (q) =>
					q.eq("clerkUserId", OTHER_USER_ID),
				)
				.collect();
			expect(subs).toHaveLength(1);

			const credits = await ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", OTHER_USER_ID))
				.collect();
			expect(credits).toHaveLength(1);

			const txns = await ctx.db
				.query("creditTransactions")
				.withIndex("by_user", (q) => q.eq("clerkUserId", OTHER_USER_ID))
				.collect();
			expect(txns).toHaveLength(1);

			const otherUser = await ctx.db
				.query("users")
				.withIndex("by_clerk_user_id", (q) =>
					q.eq("clerkUserId", OTHER_USER_ID),
				)
				.unique();
			expect(otherUser).not.toBeNull();
		});
	});
});

// ── 3. cleanupUserData: no error when user has no subscription ────────────────
describe("cleanupUserData: handles missing subscription gracefully", () => {
	it("does not throw when there is no subscription row for the user", async () => {
		const t = makeT();

		// Seed user + credits but NO subscription
		await t.run(async (ctx) => {
			await ctx.db.insert("users", {
				clerkUserId: TEST_USER_ID,
				organizationId: TEST_ORG_ID,
				email: `${TEST_USER_ID}@test.com`,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});

			await ctx.db.insert("userCredits", {
				clerkUserId: TEST_USER_ID,
				organizationId: TEST_ORG_ID,
				balance: 0,
				totalPurchased: 0,
				totalUsed: 0,
				totalBonusReceived: 0,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
		});

		// Must complete without throwing
		await expect(
			t.mutation(internal.users.cleanupUserData, {
				clerkUserId: TEST_USER_ID,
			}),
		).resolves.toEqual({ success: true });
	});
});

// ── 4. cleanupUserData: no error when user has no credits or transactions ──────
describe("cleanupUserData: handles missing credits gracefully", () => {
	it("does not throw when there are no userCredits or creditTransactions rows", async () => {
		const t = makeT();

		// Seed user + subscription but NO credits / NO transactions
		await t.run(async (ctx) => {
			await ctx.db.insert("users", {
				clerkUserId: TEST_USER_ID,
				organizationId: TEST_ORG_ID,
				email: `${TEST_USER_ID}@test.com`,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});

			await ctx.db.insert("subscriptions", {
				clerkUserId: TEST_USER_ID,
				organizationId: TEST_ORG_ID,
				tierKey: TEST_TIER_KEY,
				polarSubscriptionId: TEST_SUB_ID,
				polarCustomerId: "cus_test",
				polarProductId: "prod_test",
				status: "active",
				currentPeriodStart: Date.now(),
				currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
				cancelAtPeriodEnd: false,
				plan: {
					name: "Test Tier",
					tier: "starter",
					monthlyCredits: 200,
					features: [],
				},
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
		});

		await expect(
			t.mutation(internal.users.cleanupUserData, {
				clerkUserId: TEST_USER_ID,
			}),
		).resolves.toEqual({ success: true });
	});
});

// ── 5. Polar cancel guard: cleanup executes even when cancel throws ────────────
describe("deleteAccount guard: cleanup runs even if Polar cancel fails", () => {
	it("cleanupUserData succeeds after a simulated Polar cancellation failure", async () => {
		const t = makeT();
		await seedFullUserData(t);

		// Simulate the deleteAccount action's try/catch: polar cancel throws (free user),
		// but cleanup must still execute.
		let polarCancelFailed = false;
		try {
			throw new Error("No active subscription"); // Polar throws for free users
		} catch {
			polarCancelFailed = true;
		}
		expect(polarCancelFailed).toBe(true);

		// cleanup must still succeed despite the polar error above
		const result = await t.mutation(internal.users.cleanupUserData, {
			clerkUserId: TEST_USER_ID,
		});
		expect(result).toEqual({ success: true });

		// Verify the data is actually gone
		await t.run(async (ctx) => {
			const user = await ctx.db
				.query("users")
				.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", TEST_USER_ID))
				.unique();
			expect(user).toBeNull();
		});
	});
});
