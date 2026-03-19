/**
 * Credit System Seed Data
 *
 * All functions are internalMutation — never callable by a browser client.
 * Run via Convex dashboard or: npx convex run seedCredits:seedAll
 *
 * Duplicate-safety: every insert is guarded by a per-key lookup so running
 * a seed function twice is always a no-op for rows that already exist.
 *
 * @see docs/Understanding/credit-system-specification.md
 */

import { internalMutation } from "./_generated/server";

/**
 * Seed all credit system tables with initial data.
 * Safe to re-run: each row is guarded by a per-key existence check.
 */
export const seedAll = internalMutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();

		// ========================================
		// 1. Seed systemConfig — one guard per key
		// ========================================
		const systemConfigs = [
			{
				key: "initial_credits_default",
				value: 200,
				description:
					"Credits granted to new users (MVP - before Polar integration)",
			},
			{
				key: "monthly_reset_enabled",
				value: false,
				description: "Enable monthly credit reset (MVP: disabled)",
			},
		];

		for (const config of systemConfigs) {
			const existing = await ctx.db
				.query("systemConfig")
				.withIndex("by_key", (q) => q.eq("key", config.key))
				.first();
			if (!existing) {
				await ctx.db.insert("systemConfig", { ...config, updatedAt: now });
				console.log(`✅ Inserted systemConfig: ${config.key}`);
			} else {
				console.log(`⏭️ systemConfig already exists: ${config.key}`);
			}
		}

		// ========================================
		// 2. Seed subscriptionTiers — one guard per tierKey
		// ========================================
		const subscriptionTiers = [
			{
				tierKey: "tier_1",
				displayName: "Starter Plan",
				initialCredits: 200,
				monthlyCredits: 200,
				sortOrder: 1,
				description: "For occasional video creators",
			},
			{
				tierKey: "tier_2",
				displayName: "Pro Plan",
				initialCredits: 1000,
				monthlyCredits: 1000,
				sortOrder: 2,
				description: "For regular video creators",
			},
			{
				tierKey: "tier_3",
				displayName: "Enterprise Plan",
				initialCredits: 5000,
				monthlyCredits: 5000,
				sortOrder: 3,
				description: "For frequent/professional use",
			},
		];

		let tiersInserted = 0;
		for (const tier of subscriptionTiers) {
			const existing = await ctx.db
				.query("subscriptionTiers")
				.withIndex("by_tier_key", (q) => q.eq("tierKey", tier.tierKey))
				.first();
			if (!existing) {
				await ctx.db.insert("subscriptionTiers", {
					...tier,
					isActive: true,
					createdAt: now,
					updatedAt: now,
				});
				console.log(`✅ Inserted tier: ${tier.tierKey}`);
				tiersInserted++;
			} else {
				console.log(`⏭️ Tier already exists: ${tier.tierKey}`);
			}
		}

		return {
			success: true,
			message: "Subscription tiers seeded",
			tiersInserted,
		};
	},
});

/**
 * One-shot migration: add polarProductId + productType to the 3 subscription rows
 * AND insert 4 one-time credit package rows.
 * Source of truth: docs/Guides/polar-subscription-setup-guide.md
 * Run: npx convex run seedCredits:patchSubscriptionTiersPolarIds
 */
export const patchSubscriptionTiersPolarIds = internalMutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();

		// ── 1. Patch 3 existing subscription rows ─────────────────────────────
		const subscriptionPatches: Record<
			string,
			{ polarProductId: string; priceUsd: number }
		> = {
			tier_1: {
				polarProductId: "e5e6c9de-b88c-47a5-883a-3823bd264707",
				priceUsd: 9.99,
			},
			tier_2: {
				polarProductId: "8d8a2da2-9304-4be0-9d5b-cf57caa34746",
				priceUsd: 29.99,
			},
			tier_3: {
				polarProductId: "c7a17f55-7b4b-4d5c-a7f1-b707656f6589",
				priceUsd: 99.99,
			},
		};

		let patched = 0;
		for (const [tierKey, data] of Object.entries(subscriptionPatches)) {
			const tier = await ctx.db
				.query("subscriptionTiers")
				.withIndex("by_tier_key", (q) => q.eq("tierKey", tierKey))
				.first();
			if (tier) {
				await ctx.db.patch(tier._id, {
					polarProductId: data.polarProductId,
					productType: "subscription",
					priceUsd: data.priceUsd,
					updatedAt: now,
				});
				console.log(
					`✅ Patched ${tierKey} with polarProductId=${data.polarProductId}`,
				);
				patched++;
			} else {
				console.warn(`⚠️ Tier not found: ${tierKey}`);
			}
		}

		// ── 2. Insert 4 credit package rows (skip if already exist) ──────────
		const creditPackages = [
			{
				tierKey: "credits_starter",
				displayName: "25 Credits — Starter Pack",
				polarProductId: "d3b0791a-f692-4564-8690-6f85bc9d435b",
				productType: "one_time" as const,
				priceUsd: 25.0,
				initialCredits: 25,
				bonusCredits: 0,
				sortOrder: 10,
				description: "25 credits, one-time purchase",
			},
			{
				tierKey: "credits_popular",
				displayName: "55 Credits — Popular Pack",
				polarProductId: "86e14b99-a194-45fe-87e3-466fca2e9bb5",
				productType: "one_time" as const,
				priceUsd: 50.0,
				initialCredits: 50,
				bonusCredits: 5,
				sortOrder: 11,
				description: "50 credits + 5 bonus = 55 total",
			},
			{
				tierKey: "credits_pro",
				displayName: "115 Credits — Pro Pack",
				polarProductId: "44da7533-0a4b-4a26-b641-9b45e81c2d07",
				productType: "one_time" as const,
				priceUsd: 100.0,
				initialCredits: 100,
				bonusCredits: 15,
				sortOrder: 12,
				description: "100 credits + 15 bonus = 115 total",
			},
			{
				tierKey: "credits_enterprise",
				displayName: "300 Credits — Enterprise Pack",
				polarProductId: "19c982fd-3106-45f2-833d-07b573b45c2b",
				productType: "one_time" as const,
				priceUsd: 250.0,
				initialCredits: 250,
				bonusCredits: 50,
				sortOrder: 13,
				description: "250 credits + 50 bonus = 300 total",
			},
		];

		let inserted = 0;
		for (const pkg of creditPackages) {
			// Guard on both tierKey AND polarProductId to prevent duplicates
			// from either path (direct insert or race between two callers).
			const existingByKey = await ctx.db
				.query("subscriptionTiers")
				.withIndex("by_tier_key", (q) => q.eq("tierKey", pkg.tierKey))
				.first();
			if (existingByKey) {
				console.log(`⏭️ ${pkg.tierKey} already exists (by tierKey)`);
				continue;
			}

			const existingByProduct = await ctx.db
				.query("subscriptionTiers")
				.withIndex("by_polar_product_id", (q) =>
					q.eq("polarProductId", pkg.polarProductId),
				)
				.first();
			if (existingByProduct) {
				console.log(
					`⏭️ ${pkg.tierKey} already exists (by polarProductId ${pkg.polarProductId})`,
				);
				continue;
			}

			await ctx.db.insert("subscriptionTiers", {
				...pkg,
				monthlyCredits: undefined,
				isActive: true,
				createdAt: now,
				updatedAt: now,
			});
			console.log(`✅ Inserted ${pkg.tierKey}: ${pkg.displayName}`);
			inserted++;
		}

		return { success: true, patched, inserted };
	},
});

/**
 * One-shot migration: fix existing subscriptionTiers records.
 * Adds monthlyCredits and corrects displayNames to match Polar sandbox products.
 * Source of truth: docs/Guides/polar-subscription-setup-guide.md
 * Run: npx convex run seedCredits:patchTierMonthlyCredits
 */
export const patchTierMonthlyCredits = internalMutation({
	args: {},
	handler: async (ctx) => {
		const patches: Record<
			string,
			{ displayName: string; monthlyCredits: number; description: string }
		> = {
			tier_1: {
				displayName: "Starter Plan",
				monthlyCredits: 200,
				description: "For occasional video creators",
			},
			tier_2: {
				displayName: "Pro Plan",
				monthlyCredits: 1000,
				description: "For regular video creators",
			},
			tier_3: {
				displayName: "Enterprise Plan",
				monthlyCredits: 5000,
				description: "For frequent/professional use",
			},
		};

		let patched = 0;
		for (const [tierKey, data] of Object.entries(patches)) {
			const tier = await ctx.db
				.query("subscriptionTiers")
				.withIndex("by_tier_key", (q) => q.eq("tierKey", tierKey))
				.first();

			if (tier) {
				await ctx.db.patch(tier._id, {
					displayName: data.displayName,
					monthlyCredits: data.monthlyCredits,
					description: data.description,
					updatedAt: Date.now(),
				});
				console.log(
					`✅ Patched ${tierKey}: "${data.displayName}", monthlyCredits=${data.monthlyCredits}`,
				);
				patched++;
			} else {
				console.warn(`⚠️ Tier not found: ${tierKey}`);
			}
		}

		return { success: true, patched };
	},
});
