/// <reference types="vite/client" />
/**
 * `purchases.recordPurchase` / `purchases.getLatestForUser` — Batch 4
 * (mcpcn `order-confirm` / `payment-confirmed` blocks),
 * docs/mcpcn-block-mapping.md §4 line ~393 entry.
 *
 * TDD assertions required by the bullet, taken as written:
 * 1. A digital-purchase fixture writes exactly ONE row with kind: "digital".
 * 2. A trackable fixture writes exactly ONE row with kind: "trackable"
 *    carrying its trackingRef.
 * 3. A duplicate delivery of the same order writes NOTHING more — row count
 *    unchanged.
 *
 * `convex/http.ts`'s `order.paid` handler wires this up via
 * `recordFromWebhookOrder` (below), which resolves `kind` from
 * `subscriptionTiers.fulfillmentKind` — an operator-editable config field,
 * not a hardcoded product-id list. These tests exercise `recordPurchase` /
 * `recordFromWebhookOrder` directly, the same way
 * `polar-webhook-handlers.test.ts` exercises `credits.addPurchaseCredits`
 * directly rather than the httpAction wrapper.
 */

import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "../../convex/_generated/api";
import schema from "../../convex/schema";
import {
	DIGITAL_PURCHASE_ARGS,
	TRACKABLE_PURCHASE_ARGS,
} from "./fixtures/purchases";
import { seedTier } from "./polar-test-helpers";

const modules = import.meta.glob([
	"../../convex/**/*.ts",
	"../../convex/**/*.js",
	"!../../convex/**/*.d.ts",
]);

function makeT() {
	return convexTest(schema, modules);
}

describe("purchases.recordPurchase", () => {
	let t: ReturnType<typeof makeT>;

	beforeEach(() => {
		t = makeT();
	});

	it("RED 1: a digital-purchase fixture writes exactly ONE row with kind: digital", async () => {
		const result = await t.mutation(
			internal.purchases.recordPurchase,
			DIGITAL_PURCHASE_ARGS,
		);

		expect(result.success).toBe(true);
		expect(result.alreadyProcessed).toBe(false);

		const rows = await t.run(async (ctx) =>
			ctx.db.query("purchases").collect(),
		);
		expect(rows).toHaveLength(1);
		expect(rows[0]?.kind).toBe("digital");
		expect(rows[0]?.userId).toBe(DIGITAL_PURCHASE_ARGS.userId);
		expect(rows[0]?.productKey).toBe(DIGITAL_PURCHASE_ARGS.productKey);
		expect(rows[0]?.polarOrderId).toBe(DIGITAL_PURCHASE_ARGS.polarOrderId);
	});

	it("RED 2: a trackable fixture writes exactly ONE row with kind: trackable carrying its trackingRef", async () => {
		const result = await t.mutation(
			internal.purchases.recordPurchase,
			TRACKABLE_PURCHASE_ARGS,
		);

		expect(result.success).toBe(true);
		expect(result.alreadyProcessed).toBe(false);

		const rows = await t.run(async (ctx) =>
			ctx.db.query("purchases").collect(),
		);
		expect(rows).toHaveLength(1);
		expect(rows[0]?.kind).toBe("trackable");
		expect(rows[0]?.trackingRef).toBe(TRACKABLE_PURCHASE_ARGS.trackingRef);
	});

	it("RED 3: a duplicate delivery of the same order writes NOTHING more", async () => {
		await t.mutation(internal.purchases.recordPurchase, DIGITAL_PURCHASE_ARGS);
		const second = await t.mutation(
			internal.purchases.recordPurchase,
			DIGITAL_PURCHASE_ARGS,
		);

		expect(second.alreadyProcessed).toBe(true);

		const rows = await t.run(async (ctx) =>
			ctx.db.query("purchases").collect(),
		);
		expect(rows).toHaveLength(1);
	});

	it("a duplicate order for a trackable purchase also writes nothing more", async () => {
		await t.mutation(
			internal.purchases.recordPurchase,
			TRACKABLE_PURCHASE_ARGS,
		);
		await t.mutation(
			internal.purchases.recordPurchase,
			TRACKABLE_PURCHASE_ARGS,
		);

		const rows = await t.run(async (ctx) =>
			ctx.db.query("purchases").collect(),
		);
		expect(rows).toHaveLength(1);
	});

	it("two distinct orders for the same user write two separate rows", async () => {
		await t.mutation(internal.purchases.recordPurchase, DIGITAL_PURCHASE_ARGS);
		await t.mutation(internal.purchases.recordPurchase, {
			...DIGITAL_PURCHASE_ARGS,
			polarOrderId: "order_digital_002",
		});

		const rows = await t.run(async (ctx) =>
			ctx.db
				.query("purchases")
				.withIndex("by_user", (q) =>
					q.eq("userId", DIGITAL_PURCHASE_ARGS.userId),
				)
				.collect(),
		);
		expect(rows).toHaveLength(2);
	});
});

describe("purchases.recordFromWebhookOrder", () => {
	let t: ReturnType<typeof makeT>;

	beforeEach(() => {
		t = makeT();
	});

	it("RED: a one_time tier with NO fulfillmentKind writes ZERO rows and logs an error (misconfiguration, never defaulted)", async () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		await seedTier(t, {
			tierKey: "credits_unconfigured",
			productType: "one_time",
			// fulfillmentKind intentionally omitted
		});

		const result = await t.mutation(internal.purchases.recordFromWebhookOrder, {
			userId: DIGITAL_PURCHASE_ARGS.userId,
			productKey: "credits_unconfigured",
			productType: "one_time",
			fulfillmentKind: undefined,
			polarOrderId: "order_unconfigured_001",
		});

		expect(result.recorded).toBe(false);

		const rows = await t.run(async (ctx) =>
			ctx.db.query("purchases").collect(),
		);
		expect(rows).toHaveLength(0);
		expect(errorSpy).toHaveBeenCalled();

		errorSpy.mockRestore();
	});

	it("a one_time tier with fulfillmentKind: digital writes exactly ONE row with kind: digital", async () => {
		await seedTier(t, {
			tierKey: "credits_pro",
			productType: "one_time",
			fulfillmentKind: "digital",
		});

		const result = await t.mutation(internal.purchases.recordFromWebhookOrder, {
			userId: DIGITAL_PURCHASE_ARGS.userId,
			productKey: "credits_pro",
			productType: "one_time",
			fulfillmentKind: "digital",
			polarOrderId: "order_digital_wh_001",
		});

		expect(result.recorded).toBe(true);
		expect(result.alreadyProcessed).toBe(false);

		const rows = await t.run(async (ctx) =>
			ctx.db.query("purchases").collect(),
		);
		expect(rows).toHaveLength(1);
		expect(rows[0]?.kind).toBe("digital");
	});

	it("a one_time tier with fulfillmentKind: trackable writes exactly ONE row with kind: trackable", async () => {
		await seedTier(t, {
			tierKey: "physical_addon",
			productType: "one_time",
			fulfillmentKind: "trackable",
		});

		const result = await t.mutation(internal.purchases.recordFromWebhookOrder, {
			userId: TRACKABLE_PURCHASE_ARGS.userId,
			productKey: "physical_addon",
			productType: "one_time",
			fulfillmentKind: "trackable",
			trackingRef: TRACKABLE_PURCHASE_ARGS.trackingRef,
			polarOrderId: "order_trackable_wh_001",
		});

		expect(result.recorded).toBe(true);

		const rows = await t.run(async (ctx) =>
			ctx.db.query("purchases").collect(),
		);
		expect(rows).toHaveLength(1);
		expect(rows[0]?.kind).toBe("trackable");
		expect(rows[0]?.trackingRef).toBe(TRACKABLE_PURCHASE_ARGS.trackingRef);
	});

	it("a subscription order writes NO purchases row at all", async () => {
		await seedTier(t, {
			tierKey: "tier_1",
			productType: "subscription",
		});

		const result = await t.mutation(internal.purchases.recordFromWebhookOrder, {
			userId: DIGITAL_PURCHASE_ARGS.userId,
			productKey: "tier_1",
			productType: "subscription",
			polarOrderId: "order_subscription_001",
		});

		expect(result.recorded).toBe(false);

		const rows = await t.run(async (ctx) =>
			ctx.db.query("purchases").collect(),
		);
		expect(rows).toHaveLength(0);
	});

	it("a duplicate webhook delivery for the same order writes nothing more", async () => {
		await seedTier(t, {
			tierKey: "credits_pro",
			productType: "one_time",
			fulfillmentKind: "digital",
		});

		const args = {
			userId: DIGITAL_PURCHASE_ARGS.userId,
			productKey: "credits_pro",
			productType: "one_time" as const,
			fulfillmentKind: "digital" as const,
			polarOrderId: "order_digital_wh_dup_001",
		};

		await t.mutation(internal.purchases.recordFromWebhookOrder, args);
		const second = await t.mutation(
			internal.purchases.recordFromWebhookOrder,
			args,
		);

		expect(second.alreadyProcessed).toBe(true);

		const rows = await t.run(async (ctx) =>
			ctx.db.query("purchases").collect(),
		);
		expect(rows).toHaveLength(1);
	});
});

describe("purchases.getLatestForUser", () => {
	let t: ReturnType<typeof makeT>;

	beforeEach(() => {
		t = makeT();
	});

	it("requires authentication", async () => {
		await expect(
			t.query(api.purchases.getLatestForUser, {
				userId: DIGITAL_PURCHASE_ARGS.userId,
			}),
		).rejects.toThrow(/Authentication required/i);
	});

	it("refuses to read another user's purchase", async () => {
		await t.mutation(internal.purchases.recordPurchase, DIGITAL_PURCHASE_ARGS);

		const asOther = t.withIdentity({ subject: "someone-else" });
		await expect(
			asOther.query(api.purchases.getLatestForUser, {
				userId: DIGITAL_PURCHASE_ARGS.userId,
			}),
		).rejects.toThrow(/Unauthorized/i);
	});

	it("returns the caller's most recent purchase", async () => {
		await t.mutation(internal.purchases.recordPurchase, DIGITAL_PURCHASE_ARGS);

		const asOwner = t.withIdentity({ subject: DIGITAL_PURCHASE_ARGS.userId });
		const latest = await asOwner.query(api.purchases.getLatestForUser, {
			userId: DIGITAL_PURCHASE_ARGS.userId,
		});

		expect(latest?.kind).toBe("digital");
		expect(latest?.polarOrderId).toBe(DIGITAL_PURCHASE_ARGS.polarOrderId);
	});

	it("returns null when the caller has no purchase yet", async () => {
		const asOwner = t.withIdentity({ subject: "user_with_no_purchases" });
		const latest = await asOwner.query(api.purchases.getLatestForUser, {
			userId: "user_with_no_purchases",
		});

		expect(latest).toBeNull();
	});
});
