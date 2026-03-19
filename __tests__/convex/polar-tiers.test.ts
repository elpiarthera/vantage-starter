/// <reference types="vite/client" />
/**
 * Test 4: Subscription Tiers Tests
 *
 * Verifies the subscriptionTiers table contains the 3 correct tiers
 * matching the Polar sandbox products (polar-subscription-setup-guide.md):
 *   tier_1 → Starter Plan  $9.99/mo  200 credits
 *   tier_2 → Pro Plan      $29.99/mo 1000 credits
 *   tier_3 → Enterprise Plan $99.99/mo 5000 credits
 *
 * 1. All 3 tiers exist (tier_1, tier_2, tier_3)
 * 2. Correct monthlyCredits (200, 1000, 5000)
 * 3. Correct initialCredits (200, 1000, 5000)
 * 4. Get tier by tierKey works
 * 5. Tiers returned in sortOrder order
 */

import { describe, expect, it } from "vitest";
import { makeT, seedTier, UUID_REGEX } from "./polar-test-helpers";

/** Seed the 3 real tiers matching the Polar sandbox catalogue */
async function seedRealTiers(t: ReturnType<typeof makeT>) {
	await seedTier(t, {
		tierKey: "tier_1",
		displayName: "Starter Plan",
		initialCredits: 200,
		monthlyCredits: 200,
		sortOrder: 1,
	});
	await seedTier(t, {
		tierKey: "tier_2",
		displayName: "Pro Plan",
		initialCredits: 1000,
		monthlyCredits: 1000,
		sortOrder: 2,
	});
	await seedTier(t, {
		tierKey: "tier_3",
		displayName: "Enterprise Plan",
		initialCredits: 5000,
		monthlyCredits: 5000,
		sortOrder: 3,
	});
}

// ── 1. All 3 tiers exist ──────────────────────────────────────────────────────
describe("Subscription Tiers: all 3 tiers exist", () => {
	it("tier_1, tier_2 and tier_3 are all present", async () => {
		const t = makeT();
		await seedRealTiers(t);

		const tiers = await t.run(async (ctx) => {
			return ctx.db.query("subscriptionTiers").collect();
		});

		const tierKeys = tiers.map((tier) => tier.tierKey);
		expect(tierKeys).toContain("tier_1");
		expect(tierKeys).toContain("tier_2");
		expect(tierKeys).toContain("tier_3");
		expect(tiers).toHaveLength(3);
	});
});

// ── 2. Correct monthlyCredits ─────────────────────────────────────────────────
describe("Subscription Tiers: correct monthlyCredits", () => {
	it.each([
		["tier_1", 200],
		["tier_2", 1000],
		["tier_3", 5000],
	] as const)("%s has monthlyCredits=%i", async (tierKey, expected) => {
		const t = makeT();
		await seedRealTiers(t);

		const tier = await t.run(async (ctx) => {
			return ctx.db
				.query("subscriptionTiers")
				.withIndex("by_tier_key", (q) => q.eq("tierKey", tierKey))
				.first();
		});

		expect(tier?.monthlyCredits).toBe(expected);
	});
});

// ── 3. Correct initialCredits ─────────────────────────────────────────────────
describe("Subscription Tiers: correct initialCredits", () => {
	it.each([
		["tier_1", 200],
		["tier_2", 1000],
		["tier_3", 5000],
	] as const)("%s has initialCredits=%i", async (tierKey, expected) => {
		const t = makeT();
		await seedRealTiers(t);

		const tier = await t.run(async (ctx) => {
			return ctx.db
				.query("subscriptionTiers")
				.withIndex("by_tier_key", (q) => q.eq("tierKey", tierKey))
				.first();
		});

		expect(tier?.initialCredits).toBe(expected);
	});
});

// ── 4. Get tier by tierKey ────────────────────────────────────────────────────
describe("Subscription Tiers: get by tierKey", () => {
	it("by_tier_key index returns the correct tier", async () => {
		const t = makeT();
		await seedRealTiers(t);

		const tier = await t.run(async (ctx) => {
			return ctx.db
				.query("subscriptionTiers")
				.withIndex("by_tier_key", (q) => q.eq("tierKey", "tier_2"))
				.first();
		});

		expect(tier).not.toBeNull();
		expect(tier?.tierKey).toBe("tier_2");
		expect(tier?.displayName).toBe("Pro Plan");
		expect(tier?.monthlyCredits).toBe(1000);
	});
});

// ── 5. Tiers sorted by sortOrder ──────────────────────────────────────────────
describe("Subscription Tiers: sorted by sortOrder", () => {
	it("tiers are in ascending sortOrder (tier_1 < tier_2 < tier_3)", async () => {
		const t = makeT();
		await seedRealTiers(t);

		const tiers = await t.run(async (ctx) => {
			return ctx.db
				.query("subscriptionTiers")
				.withIndex("by_sort_order")
				.order("asc")
				.collect();
		});

		expect(tiers[0].tierKey).toBe("tier_1");
		expect(tiers[1].tierKey).toBe("tier_2");
		expect(tiers[2].tierKey).toBe("tier_3");
		expect(tiers[0].sortOrder).toBeLessThan(tiers[1].sortOrder);
		expect(tiers[1].sortOrder).toBeLessThan(tiers[2].sortOrder);
	});
});

// ── Credit package rows ────────────────────────────────────────────────────────

/** Seed the 4 real credit package rows matching the Polar sandbox catalogue */
async function seedRealCreditPackages(t: ReturnType<typeof makeT>) {
	await seedTier(t, {
		tierKey: "credits_starter",
		displayName: "25 Credits — Starter Pack",
		polarProductId: "d3b0791a-f692-4564-8690-6f85bc9d435b",
		productType: "one_time",
		priceUsd: 25.0,
		initialCredits: 25,
		bonusCredits: 0,
		sortOrder: 10,
	});
	await seedTier(t, {
		tierKey: "credits_popular",
		displayName: "55 Credits — Popular Pack",
		polarProductId: "86e14b99-a194-45fe-87e3-466fca2e9bb5",
		productType: "one_time",
		priceUsd: 50.0,
		initialCredits: 50,
		bonusCredits: 5,
		sortOrder: 11,
	});
	await seedTier(t, {
		tierKey: "credits_pro",
		displayName: "115 Credits — Pro Pack",
		polarProductId: "44da7533-0a4b-4a26-b641-9b45e81c2d07",
		productType: "one_time",
		priceUsd: 100.0,
		initialCredits: 100,
		bonusCredits: 15,
		sortOrder: 12,
	});
	await seedTier(t, {
		tierKey: "credits_enterprise",
		displayName: "300 Credits — Enterprise Pack",
		polarProductId: "19c982fd-3106-45f2-833d-07b573b45c2b",
		productType: "one_time",
		priceUsd: 250.0,
		initialCredits: 250,
		bonusCredits: 50,
		sortOrder: 13,
	});
}

// ── 6. All 4 credit package rows exist with productType "one_time" ────────────
describe("Credit Package Tiers: 4 rows exist", () => {
	it("exactly 4 one_time rows are present", async () => {
		const t = makeT();
		await seedRealCreditPackages(t);

		const packages = await t.run(async (ctx) => {
			return ctx.db
				.query("subscriptionTiers")
				.filter((q) => q.eq(q.field("productType"), "one_time"))
				.collect();
		});

		expect(packages).toHaveLength(4);
		const keys = packages.map((p) => p.tierKey);
		expect(keys).toContain("credits_starter");
		expect(keys).toContain("credits_popular");
		expect(keys).toContain("credits_pro");
		expect(keys).toContain("credits_enterprise");
	});
});

// ── 7. Each credit package has a valid UUID polarProductId ────────────────────
describe("Credit Package Tiers: polarProductId is a valid UUID", () => {
	it.each([
		["credits_starter", "d3b0791a-f692-4564-8690-6f85bc9d435b"],
		["credits_popular", "86e14b99-a194-45fe-87e3-466fca2e9bb5"],
		["credits_pro", "44da7533-0a4b-4a26-b641-9b45e81c2d07"],
		["credits_enterprise", "19c982fd-3106-45f2-833d-07b573b45c2b"],
	] as const)("%s has correct UUID polarProductId", async (tierKey, expectedId) => {
		const t = makeT();
		await seedRealCreditPackages(t);

		const pkg = await t.run(async (ctx) => {
			return ctx.db
				.query("subscriptionTiers")
				.withIndex("by_tier_key", (q) => q.eq("tierKey", tierKey))
				.first();
		});

		expect(pkg).not.toBeNull();
		expect(pkg?.polarProductId).toBe(expectedId);
		expect(pkg?.polarProductId).toMatch(UUID_REGEX);
	});
});

// ── 8. initialCredits + bonusCredits = expected total ─────────────────────────
describe("Credit Package Tiers: total credits (initialCredits + bonusCredits)", () => {
	it.each([
		["credits_starter", 25, 0, 25],
		["credits_popular", 50, 5, 55],
		["credits_pro", 100, 15, 115],
		["credits_enterprise", 250, 50, 300],
	] as const)("%s: %i base + %i bonus = %i total", async (tierKey, base, bonus, total) => {
		const t = makeT();
		await seedRealCreditPackages(t);

		const pkg = await t.run(async (ctx) => {
			return ctx.db
				.query("subscriptionTiers")
				.withIndex("by_tier_key", (q) => q.eq("tierKey", tierKey))
				.first();
		});

		expect(pkg?.initialCredits).toBe(base);
		expect(pkg?.bonusCredits ?? 0).toBe(bonus);
		expect((pkg?.initialCredits ?? 0) + (pkg?.bonusCredits ?? 0)).toBe(total);
	});
});

// ── 9. by_polar_product_id index returns correct tier ────────────────────────
describe("Credit Package Tiers: by_polar_product_id index", () => {
	it("lookup by polarProductId returns the correct row", async () => {
		const t = makeT();
		await seedRealCreditPackages(t);

		const pkg = await t.run(async (ctx) => {
			return ctx.db
				.query("subscriptionTiers")
				.withIndex("by_polar_product_id", (q) =>
					q.eq("polarProductId", "86e14b99-a194-45fe-87e3-466fca2e9bb5"),
				)
				.first();
		});

		expect(pkg).not.toBeNull();
		expect(pkg?.tierKey).toBe("credits_popular");
		expect(pkg?.initialCredits).toBe(50);
		expect(pkg?.bonusCredits).toBe(5);
	});
});
