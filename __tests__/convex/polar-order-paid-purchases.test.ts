/// <reference types="vite/client" />
/**
 * order.paid -> purchases: drives the REAL webhook route.
 *
 * Every other polar-*.test.ts reproduces the handler's call sequence by hand
 * (the handler is a callback inside `polar.registerRoutes()`), so deleting
 * `fulfillmentKind: tier.fulfillmentKind` from convex/http.ts left them all
 * green. This file POSTs a signed `order.paid` event to `/polar/events` through
 * `t.fetch`, so the handler in convex/http.ts is the code under test and the
 * assertion is on what lands in the `purchases` table.
 */

import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { internal } from "../../convex/_generated/api";
import {
	makeT,
	seedTier,
	seedUserAndGetConvexId,
	TEST_USER_ID,
} from "./polar-test-helpers";

// The Polar client reads the secret when convex/polar.ts is first imported
// (during the first t.fetch), so it must be set before any request is sent.
const WEBHOOK_SECRET = "test-webhook-secret-order-paid-purchases";
process.env.POLAR_WEBHOOK_SECRET = WEBHOOK_SECRET;

const PRODUCT_ID = "d3b0791a-f692-4564-8690-6f85bc9d435b";
const TIER_KEY = "credits_starter";

type OrderOverrides = { orderId: string; productId: string | null };

function orderPaidBody(convexUserId: string, o: OrderOverrides): string {
	const iso = "2026-01-01T00:00:00Z";
	return JSON.stringify({
		type: "order.paid",
		timestamp: iso,
		data: {
			id: o.orderId,
			created_at: iso,
			modified_at: null,
			status: "paid",
			paid: true,
			subtotal_amount: 2500,
			discount_amount: 0,
			net_amount: 2500,
			tax_amount: 0,
			total_amount: 2500,
			applied_balance_amount: 0,
			due_amount: 0,
			refunded_amount: 0,
			refunded_tax_amount: 0,
			currency: "usd",
			billing_reason: "purchase",
			billing_name: null,
			billing_address: null,
			invoice_number: null,
			is_invoice_generated: false,
			receipt_number: null,
			customer_id: "cus_test_123",
			product_id: o.productId,
			discount_id: null,
			subscription_id: null,
			checkout_id: null,
			metadata: {},
			platform_fee_amount: 0,
			platform_fee_currency: null,
			customer: {
				id: "cus_test_123",
				created_at: iso,
				modified_at: null,
				metadata: { userId: convexUserId },
				external_id: null,
				email: "buyer@example.com",
				email_verified: true,
				type: "individual",
				name: null,
				billing_name: null,
				billing_address: null,
				tax_id: null,
				organization_id: "org_polar_1",
				deleted_at: null,
				avatar_url: null,
			},
			product: null,
			discount: null,
			subscription: null,
			items: [],
			description: "Credit pack",
			refundable_amount: 2500,
			refundable_tax_amount: 0,
		},
	});
}

/** Standard Webhooks signing, as `validateEvent` in @polar-sh/sdk verifies it. */
function signedInit(body: string): RequestInit {
	const id = `msg_${Math.random().toString(36).slice(2)}`;
	const timestamp = String(Math.floor(Date.now() / 1000));
	const signature = createHmac("sha256", Buffer.from(WEBHOOK_SECRET, "utf-8"))
		.update(`${id}.${timestamp}.${body}`)
		.digest("base64");
	return {
		method: "POST",
		headers: {
			"content-type": "application/json",
			"webhook-id": id,
			"webhook-timestamp": timestamp,
			"webhook-signature": `v1,${signature}`,
		},
		body,
	};
}

async function purchaseRows(t: ReturnType<typeof makeT>) {
	return await t.run(async (ctx) => await ctx.db.query("purchases").collect());
}

async function setup(fulfillmentKind?: "digital" | "trackable") {
	const t = makeT();
	const convexUserId = await seedUserAndGetConvexId(t);
	await seedTier(t, {
		tierKey: TIER_KEY,
		polarProductId: PRODUCT_ID,
		productType: "one_time",
		initialCredits: 25,
		bonusCredits: 0,
		priceUsd: 25,
		fulfillmentKind,
	});
	return { t, convexUserId };
}

describe("order.paid webhook -> purchases (real route /polar/events)", () => {
	it("(a) one_time tier with fulfillmentKind writes exactly one purchases row of that kind", async () => {
		const { t, convexUserId } = await setup("digital");
		const body = orderPaidBody(convexUserId, {
			orderId: "ord_paid_a",
			productId: PRODUCT_ID,
		});

		const res = await t.fetch("/polar/events", signedInit(body));
		expect(res.status).toBe(202);

		const rows = await purchaseRows(t);
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({
			userId: TEST_USER_ID,
			productKey: TIER_KEY,
			kind: "digital",
			polarOrderId: "ord_paid_a",
		});
	});

	it("(b) the same event delivered twice still leaves one row", async () => {
		const { t, convexUserId } = await setup("digital");
		const body = orderPaidBody(convexUserId, {
			orderId: "ord_paid_b",
			productId: PRODUCT_ID,
		});

		expect((await t.fetch("/polar/events", signedInit(body))).status).toBe(202);
		expect((await t.fetch("/polar/events", signedInit(body))).status).toBe(202);

		expect(await purchaseRows(t)).toHaveLength(1);
	});

	it("(c) an order with a null productId writes no row", async () => {
		const { t, convexUserId } = await setup("digital");
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const body = orderPaidBody(convexUserId, {
			orderId: "ord_paid_c",
			productId: null,
		});

		const res = await t.fetch("/polar/events", signedInit(body));
		expect(res.status).toBe(202);

		expect(await purchaseRows(t)).toHaveLength(0);
		errorSpy.mockRestore();
	});

	it("(d) a one_time tier WITHOUT fulfillmentKind writes no row (misconfiguration is refused, not defaulted)", async () => {
		const { t, convexUserId } = await setup(undefined);
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const body = orderPaidBody(convexUserId, {
			orderId: "ord_paid_d",
			productId: PRODUCT_ID,
		});

		const res = await t.fetch("/polar/events", signedInit(body));
		expect(res.status).toBe(202);

		expect(await purchaseRows(t)).toHaveLength(0);
		expect(errorSpy).toHaveBeenCalledWith(
			expect.stringContaining("Missing fulfillmentKind"),
			expect.objectContaining({ polarOrderId: "ord_paid_d" }),
		);
		errorSpy.mockRestore();
	});
});

describe("seedCredits.patchSubscriptionTiersPolarIds -> fulfillmentKind", () => {
	const PACK_KEYS = [
		"credits_starter",
		"credits_popular",
		"credits_pro",
		"credits_enterprise",
	];

	async function packKinds(t: ReturnType<typeof makeT>) {
		return await t.run(async (ctx) => {
			const rows = await ctx.db.query("subscriptionTiers").collect();
			return rows
				.filter((r) => PACK_KEYS.includes(r.tierKey))
				.map((r) => ({ tierKey: r.tierKey, kind: r.fulfillmentKind }))
				.sort((a, b) => a.tierKey.localeCompare(b.tierKey));
		});
	}

	it("(e) a fresh seed inserts all four credit packs as digital", async () => {
		const t = makeT();
		await t.mutation(internal.seedCredits.patchSubscriptionTiersPolarIds, {});

		expect(await packKinds(t)).toEqual(
			PACK_KEYS.map((tierKey) => ({ tierKey, kind: "digital" })).sort((a, b) =>
				a.tierKey.localeCompare(b.tierKey),
			),
		);
	});

	it("(f) rows seeded before the field existed are patched; re-running changes nothing; an operator-set kind is kept", async () => {
		const t = makeT();
		await seedTier(t, {
			tierKey: "credits_starter",
			polarProductId: PRODUCT_ID,
			productType: "one_time",
		});
		await seedTier(t, {
			tierKey: "credits_pro",
			polarProductId: "44da7533-0a4b-4a26-b641-9b45e81c2d07",
			productType: "one_time",
			fulfillmentKind: "trackable",
		});

		await t.mutation(internal.seedCredits.patchSubscriptionTiersPolarIds, {});
		const first = await packKinds(t);
		await t.mutation(internal.seedCredits.patchSubscriptionTiersPolarIds, {});

		expect(first.find((r) => r.tierKey === "credits_starter")?.kind).toBe(
			"digital",
		);
		expect(first.find((r) => r.tierKey === "credits_pro")?.kind).toBe(
			"trackable",
		);
		expect(first).toHaveLength(4);
		expect(await packKinds(t)).toEqual(first);
	});
});
