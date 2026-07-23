/// <reference types="vite/client" />
/**
 * `credits.recordManualTopUp` — operator-role gate (debt-operator-role-manual-grant).
 *
 * The defect this suite closes: recordManualTopUp was gated ONLY by a global
 * `systemConfig` switch ("manual_topup_enabled") plus a self-only identity
 * check (`identity.subject !== clerkUserId`). Flipping that switch on reopened
 * the credit tap for EVERY authenticated user — any member/client could grant
 * themselves credits. A credit grant must be an OPERATOR action.
 *
 * The new contract: the caller must be an admin/owner (verified via
 * `requireAdmin`), and the granting operator's own identity is recorded on the
 * written `creditTransactions` row (`grantedByClerkUserId`) — never the
 * beneficiary's. The beneficiary (`args.clerkUserId`) may legitimately differ
 * from the caller: that is an operator granting credits to another user.
 *
 * Every assertion targets money movement, not "it did not throw": balance
 * unchanged + zero rows on refusal, exact granter id on success.
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

const OPERATOR = "user_operator_admin";
const MEMBER = "user_plain_member";
const BENEFICIARY = "user_beneficiary";

async function seedUser(
	t: ReturnType<typeof makeT>,
	clerkUserId: string,
	role: "owner" | "admin" | "member" | "client",
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

async function seedPresets(t: ReturnType<typeof makeT>, presets: number[]) {
	await t.run(async (ctx) => {
		await ctx.db.insert("systemConfig", {
			key: "manual_topup_presets",
			value: presets,
			description: "presets (test)",
			updatedAt: Date.now(),
		});
	});
}

async function seedEnabled(t: ReturnType<typeof makeT>, enabled: boolean) {
	await t.run(async (ctx) => {
		await ctx.db.insert("systemConfig", {
			key: "manual_topup_enabled",
			value: enabled,
			description: "switch (test)",
			updatedAt: Date.now(),
		});
	});
}

async function seedUserCredits(
	t: ReturnType<typeof makeT>,
	clerkUserId: string,
	balance: number,
) {
	await t.run(async (ctx) => {
		const now = Date.now();
		await ctx.db.insert("userCredits", {
			clerkUserId,
			balance,
			totalPurchased: 0,
			totalUsed: 0,
			totalBonusReceived: 0,
			createdAt: now,
			updatedAt: now,
		});
	});
}

async function balanceOf(t: ReturnType<typeof makeT>, clerkUserId: string) {
	return await t.run(async (ctx) =>
		ctx.db
			.query("userCredits")
			.withIndex("by_clerk_user", (q) => q.eq("clerkUserId", clerkUserId))
			.first(),
	);
}

async function txsOf(t: ReturnType<typeof makeT>, clerkUserId: string) {
	return await t.run(async (ctx) =>
		ctx.db
			.query("creditTransactions")
			.withIndex("by_user", (q) => q.eq("clerkUserId", clerkUserId))
			.collect(),
	);
}

describe("credits.recordManualTopUp — operator role gate", () => {
	let t: ReturnType<typeof makeT>;

	beforeEach(() => {
		t = makeT();
	});

	it("RED: refuses an authenticated NON-operator (member) even when the switch is enabled and they grant to themselves — balance unchanged, zero rows written", async () => {
		await seedPresets(t, [10, 25, 50]);
		await seedEnabled(t, true);
		await seedUser(t, MEMBER, "member");
		await seedUserCredits(t, MEMBER, 100);
		const asMember = t.withIdentity({ subject: MEMBER });

		await expect(
			asMember.mutation(api.credits.recordManualTopUp, {
				clerkUserId: MEMBER,
				amount: 25,
			}),
		).rejects.toThrow(/admin access required/i);

		const credits = await balanceOf(t, MEMBER);
		expect(credits?.balance).toBe(100);
		const txs = await txsOf(t, MEMBER);
		expect(txs).toHaveLength(0);
	});

	it("refuses an authenticated NON-operator (client) granting to another user — beneficiary balance unchanged, zero rows", async () => {
		await seedPresets(t, [10, 25, 50]);
		await seedEnabled(t, true);
		await seedUser(t, MEMBER, "client");
		await seedUserCredits(t, BENEFICIARY, 100);
		const asClient = t.withIdentity({ subject: MEMBER });

		await expect(
			asClient.mutation(api.credits.recordManualTopUp, {
				clerkUserId: BENEFICIARY,
				amount: 25,
			}),
		).rejects.toThrow(/admin access required/i);

		const credits = await balanceOf(t, BENEFICIARY);
		expect(credits?.balance).toBe(100);
		expect(await txsOf(t, BENEFICIARY)).toHaveLength(0);
	});

	it("allows an operator (admin) to grant credits to a DIFFERENT beneficiary, and records the OPERATOR's identity as the granter (not the beneficiary's)", async () => {
		await seedPresets(t, [10, 25, 50]);
		await seedEnabled(t, true);
		await seedUser(t, OPERATOR, "admin");
		await seedUserCredits(t, BENEFICIARY, 100);
		const asOperator = t.withIdentity({ subject: OPERATOR });

		const result = await asOperator.mutation(
			api.credits.recordManualTopUp,
			{ clerkUserId: BENEFICIARY, amount: 25 },
		);

		expect(result.success).toBe(true);
		expect(result.newBalance).toBe(125);

		const credits = await balanceOf(t, BENEFICIARY);
		expect(credits?.balance).toBe(125);

		const txs = await txsOf(t, BENEFICIARY);
		expect(txs).toHaveLength(1);
		expect(txs[0]?.type).toBe("manual_grant");
		// The recorded granter is the OPERATOR, never the beneficiary.
		expect(txs[0]?.grantedByClerkUserId).toBe(OPERATOR);
		expect(txs[0]?.clerkUserId).toBe(BENEFICIARY);
		expect(txs[0]?.grantedByClerkUserId).not.toBe(txs[0]?.clerkUserId);
	});

	it("allows an owner operator too, and still refuses loudly when the switch is off (validation preserved)", async () => {
		await seedPresets(t, [10, 25, 50]);
		await seedEnabled(t, false);
		await seedUser(t, OPERATOR, "owner");
		await seedUserCredits(t, BENEFICIARY, 100);
		const asOperator = t.withIdentity({ subject: OPERATOR });

		await expect(
			asOperator.mutation(api.credits.recordManualTopUp, {
				clerkUserId: BENEFICIARY,
				amount: 25,
			}),
		).rejects.toThrow(/disabled/i);
		expect((await balanceOf(t, BENEFICIARY))?.balance).toBe(100);
	});
});
