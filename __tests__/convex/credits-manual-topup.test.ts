/// <reference types="vite/client" />
/**
 * `credits.recordManualTopUp` — Batch 2 (mcpcn `amount-input` block),
 * docs/mcpcn-block-mapping.md §4 "amount-input" entry.
 *
 * The Convex contract this batch adds: a first WRITE path onto the existing
 * `userCredits` / `creditTransactions` tables. Assertion required by the
 * plan: the balance increases by EXACTLY the requested amount and EXACTLY
 * ONE `creditTransactions` row is written — "it did not throw" proves
 * nothing about an operation that moves money.
 *
 * Preset amounts are never a literal in this file or in the mutation: they
 * are read from `systemConfig` key "manual_topup_presets", seeded by
 * `convex/seedCredits.ts` — the same pattern this schema already uses for
 * `initial_credits_default` and `subscriptionTiers`. See CLASS sweep in the
 * PR description.
 */

import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
import schema from "../../convex/schema";

const modules = import.meta.glob([
	"../../convex/**/*.ts",
	"../../convex/**/*.js",
	"!../../convex/**/*.d.ts",
]);

function makeT() {
	return convexTest(schema, modules);
}

const USER_A = "user_topup_a";
const ATTACKER_B = "user_topup_attacker";

async function seedPresets(t: ReturnType<typeof makeT>, presets: number[]) {
	await t.run(async (ctx) => {
		await ctx.db.insert("systemConfig", {
			key: "manual_topup_presets",
			value: presets,
			description:
				"Manual credit top-up preset amounts (customer-configurable)",
			updatedAt: Date.now(),
		});
	});
}

async function seedEnabled(t: ReturnType<typeof makeT>, enabled: boolean) {
	await t.run(async (ctx) => {
		await ctx.db.insert("systemConfig", {
			key: "manual_topup_enabled",
			value: enabled,
			description: "Manual top-up feature switch (test)",
			updatedAt: Date.now(),
		});
	});
}

async function seedUserCredits(t: ReturnType<typeof makeT>, balance: number) {
	await t.run(async (ctx) => {
		const now = Date.now();
		await ctx.db.insert("userCredits", {
			clerkUserId: USER_A,
			balance,
			totalPurchased: 0,
			totalUsed: 0,
			totalBonusReceived: 0,
			createdAt: now,
			updatedAt: now,
		});
	});
}

/**
 * recordManualTopUp is an OPERATOR action (requireAdmin) since
 * debt-operator-role-manual-grant: the caller must be an admin/owner user row,
 * not merely an authenticated identity. Seed the caller as an operator so the
 * mutation clears the role gate before its switch/preset validation. Cross-user
 * grants (operator != beneficiary) are covered in
 * credits-manual-topup-operator-gate.test.ts.
 */
async function seedOperator(
	t: ReturnType<typeof makeT>,
	clerkUserId: string,
	role: "owner" | "admin" = "admin",
) {
	await t.run(async (ctx) => {
		const now = Date.now();
		await ctx.db.insert("users", {
			clerkUserId,
			organizationId: undefined,
			role,
			email: `${clerkUserId}@test.com`,
			createdAt: now,
			updatedAt: now,
		});
	});
}

describe("credits.recordManualTopUp", () => {
	let t: ReturnType<typeof makeT>;

	beforeEach(() => {
		t = makeT();
	});

	it("RED 1: increments balance by EXACTLY the requested preset amount and writes EXACTLY ONE transaction row, typed as a grant not a purchase", async () => {
		await seedPresets(t, [10, 25, 50]);
		await seedEnabled(t, true);
		await seedOperator(t, USER_A);
		await seedUserCredits(t, 100);
		const asUser = t.withIdentity({ subject: USER_A });

		const result = await asUser.mutation(api.credits.recordManualTopUp, {
			clerkUserId: USER_A,
			amount: 25,
		});

		expect(result.success).toBe(true);
		expect(result.newBalance).toBe(125);

		const userCredits = await t.run(async (ctx) =>
			ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", USER_A))
				.first(),
		);
		expect(userCredits?.balance).toBe(125);
		// A grant is not a purchase: it must not inflate the purchase total.
		expect(userCredits?.totalPurchased).toBe(0);
		expect(userCredits?.totalBonusReceived).toBe(25);

		const transactions = await t.run(async (ctx) =>
			ctx.db
				.query("creditTransactions")
				.withIndex("by_user", (q) => q.eq("clerkUserId", USER_A))
				.collect(),
		);
		expect(transactions).toHaveLength(1);
		expect(transactions[0]?.amount).toBe(25);
		expect(transactions[0]?.balanceAfter).toBe(125);
		expect(transactions[0]?.type).toBe("manual_grant");
	});

	it("initializes a new user's row when none exists yet, balance becomes exactly the amount", async () => {
		await seedPresets(t, [10, 25, 50]);
		await seedEnabled(t, true);
		await seedOperator(t, USER_A);
		const asUser = t.withIdentity({ subject: USER_A });

		const result = await asUser.mutation(api.credits.recordManualTopUp, {
			clerkUserId: USER_A,
			amount: 10,
		});

		expect(result.newBalance).toBe(10);
		const transactions = await t.run(async (ctx) =>
			ctx.db
				.query("creditTransactions")
				.withIndex("by_user", (q) => q.eq("clerkUserId", USER_A))
				.collect(),
		);
		expect(transactions).toHaveLength(1);
	});

	it("rejects an amount that is not one of the configured presets, and writes nothing", async () => {
		await seedPresets(t, [10, 25, 50]);
		await seedEnabled(t, true);
		await seedOperator(t, USER_A);
		await seedUserCredits(t, 100);
		const asUser = t.withIdentity({ subject: USER_A });

		await expect(
			asUser.mutation(api.credits.recordManualTopUp, {
				clerkUserId: USER_A,
				amount: 999,
			}),
		).rejects.toThrow();

		const userCredits = await t.run(async (ctx) =>
			ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", USER_A))
				.first(),
		);
		expect(userCredits?.balance).toBe(100);

		const transactions = await t.run(async (ctx) =>
			ctx.db
				.query("creditTransactions")
				.withIndex("by_user", (q) => q.eq("clerkUserId", USER_A))
				.collect(),
		);
		expect(transactions).toHaveLength(0);
	});

	it("rejects when no manual_topup_presets systemConfig row exists (fail loud, no hardcoded fallback tiers)", async () => {
		await seedEnabled(t, true);
		await seedOperator(t, USER_A);
		await seedUserCredits(t, 100);
		const asUser = t.withIdentity({ subject: USER_A });

		await expect(
			asUser.mutation(api.credits.recordManualTopUp, {
				clerkUserId: USER_A,
				amount: 25,
			}),
		).rejects.toThrow();
	});

	it("refuses a top-up from a non-operator identity (no admin user row) and writes nothing", async () => {
		await seedPresets(t, [10, 25, 50]);
		await seedEnabled(t, true);
		await seedUserCredits(t, 100);
		const asAttacker = t.withIdentity({ subject: ATTACKER_B });

		await expect(
			asAttacker.mutation(api.credits.recordManualTopUp, {
				clerkUserId: USER_A,
				amount: 25,
			}),
		).rejects.toThrow();

		const userCredits = await t.run(async (ctx) =>
			ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", USER_A))
				.first(),
		);
		expect(userCredits?.balance).toBe(100);
	});

	it("rejects an unauthenticated call", async () => {
		await seedPresets(t, [10, 25, 50]);
		await seedEnabled(t, true);
		await seedUserCredits(t, 100);

		await expect(
			t.mutation(api.credits.recordManualTopUp, {
				clerkUserId: USER_A,
				amount: 25,
			}),
		).rejects.toThrow();
	});

	it("names the abuse — even an operator cannot grant credits when the switch is absent (out of the box, a fork's tap is closed)", async () => {
		await seedPresets(t, [10, 25, 50]);
		await seedOperator(t, USER_A);
		await seedUserCredits(t, 100);
		const asUser = t.withIdentity({ subject: USER_A });

		await expect(
			asUser.mutation(api.credits.recordManualTopUp, {
				clerkUserId: USER_A,
				amount: 25,
			}),
		).rejects.toThrow(/manual top-up is disabled/i);

		const userCredits = await t.run(async (ctx) =>
			ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", USER_A))
				.first(),
		);
		expect(userCredits?.balance).toBe(100);

		const transactions = await t.run(async (ctx) =>
			ctx.db
				.query("creditTransactions")
				.withIndex("by_user", (q) => q.eq("clerkUserId", USER_A))
				.collect(),
		);
		expect(transactions).toHaveLength(0);
	});

	it("names the abuse — even an operator cannot grant credits when the switch is explicitly false", async () => {
		await seedPresets(t, [10, 25, 50]);
		await seedEnabled(t, false);
		await seedOperator(t, USER_A);
		await seedUserCredits(t, 100);
		const asUser = t.withIdentity({ subject: USER_A });

		await expect(
			asUser.mutation(api.credits.recordManualTopUp, {
				clerkUserId: USER_A,
				amount: 25,
			}),
		).rejects.toThrow(/manual top-up is disabled/i);

		const userCredits = await t.run(async (ctx) =>
			ctx.db
				.query("userCredits")
				.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", USER_A))
				.first(),
		);
		expect(userCredits?.balance).toBe(100);

		const transactions = await t.run(async (ctx) =>
			ctx.db
				.query("creditTransactions")
				.withIndex("by_user", (q) => q.eq("clerkUserId", USER_A))
				.collect(),
		);
		expect(transactions).toHaveLength(0);
	});

	it("allows the top-up once the switch is explicitly true, and types the row as a grant", async () => {
		await seedPresets(t, [10, 25, 50]);
		await seedEnabled(t, true);
		await seedOperator(t, USER_A);
		await seedUserCredits(t, 100);
		const asUser = t.withIdentity({ subject: USER_A });

		const result = await asUser.mutation(api.credits.recordManualTopUp, {
			clerkUserId: USER_A,
			amount: 25,
		});

		expect(result.success).toBe(true);
		expect(result.newBalance).toBe(125);

		const transactions = await t.run(async (ctx) =>
			ctx.db
				.query("creditTransactions")
				.withIndex("by_user", (q) => q.eq("clerkUserId", USER_A))
				.collect(),
		);
		expect(transactions).toHaveLength(1);
		expect(transactions[0]?.type).toBe("manual_grant");
	});
});

describe("credits.getManualTopupPresets", () => {
	let t: ReturnType<typeof makeT>;

	beforeEach(() => {
		t = makeT();
	});

	it("returns exactly the seeded systemConfig presets, unauthenticated (public-by-design)", async () => {
		await seedPresets(t, [10, 25, 50]);

		const presets = await t.query(api.credits.getManualTopupPresets, {});

		expect(presets).toEqual([10, 25, 50]);
	});

	it("returns an empty array when no manual_topup_presets systemConfig row exists", async () => {
		const presets = await t.query(api.credits.getManualTopupPresets, {});

		expect(presets).toEqual([]);
	});

	it("returns an empty array (fails loud on the write side, not here) when the config row is malformed", async () => {
		await t.run(async (ctx) => {
			await ctx.db.insert("systemConfig", {
				key: "manual_topup_presets",
				value: "not-an-array",
				description: "malformed for test",
				updatedAt: Date.now(),
			});
		});

		const presets = await t.query(api.credits.getManualTopupPresets, {});

		expect(presets).toEqual([]);
	});
});

describe("credits.isManualTopupEnabled", () => {
	let t: ReturnType<typeof makeT>;

	beforeEach(() => {
		t = makeT();
	});

	it("returns false when no manual_topup_enabled systemConfig row exists (closed tap out of the box)", async () => {
		const enabled = await t.query(api.credits.isManualTopupEnabled, {});

		expect(enabled).toBe(false);
	});

	it("returns false when the row is explicitly false", async () => {
		await seedEnabled(t, false);

		const enabled = await t.query(api.credits.isManualTopupEnabled, {});

		expect(enabled).toBe(false);
	});

	it("returns true when the row is explicitly true", async () => {
		await seedEnabled(t, true);

		const enabled = await t.query(api.credits.isManualTopupEnabled, {});

		expect(enabled).toBe(true);
	});
});
