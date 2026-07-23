/// <reference types="vite/client" />
/**
 * Shared test helpers for Polar integration tests.
 * Provides reusable seed functions and constants for convex-test.
 */

import { convexTest } from "convex-test";
import schema from "../../convex/schema";

export const modules = import.meta.glob([
	"../../convex/**/*.ts",
	"../../convex/**/*.js",
	"!../../convex/**/*.d.ts",
]);

export const TEST_USER_ID = "user_polar_test_123";
export const TEST_ORG_ID = "org_polar_test_123";
export const TEST_SUB_ID = "sub_polar_test_123";
export const TEST_TIER_KEY = "tier_1";

/**
 * Product ID → total credits reference (initialCredits + bonusCredits).
 * Authoritative data lives in the subscriptionTiers DB table (Task 11).
 * This constant is kept as a test reference for polar-credits and polar-product-mapping tests.
 */
export const CREDIT_PACKAGES: Record<string, number> = {
	"d3b0791a-f692-4564-8690-6f85bc9d435b": 25, // credits_starter: 25 + 0
	"86e14b99-a194-45fe-87e3-466fca2e9bb5": 55, // credits_popular: 50 + 5
	"44da7533-0a4b-4a26-b641-9b45e81c2d07": 115, // credits_pro: 100 + 15
	"19c982fd-3106-45f2-833d-07b573b45c2b": 300, // credits_enterprise: 250 + 50
};

/** UUID v4 regex */
export const UUID_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Create a fresh convex-test instance (in-memory DB, isolated per test) */
export function makeT() {
	return convexTest(schema, modules);
}

/** Seed one subscription tier into the in-memory DB */
export async function seedTier(
	t: ReturnType<typeof makeT>,
	opts: {
		tierKey?: string;
		displayName?: string;
		monthlyCredits?: number;
		initialCredits?: number;
		sortOrder?: number;
		// Task 11 — new optional fields matching schema
		polarProductId?: string;
		productType?: "subscription" | "one_time";
		priceUsd?: number;
		bonusCredits?: number;
		// Batch 4 purchases wiring — only meaningful when productType === "one_time"
		fulfillmentKind?: "digital" | "trackable";
	} = {},
) {
	const {
		tierKey = TEST_TIER_KEY,
		displayName = "Test Tier",
		monthlyCredits = 1000,
		initialCredits = 200,
		sortOrder = 1,
		polarProductId,
		productType,
		priceUsd,
		bonusCredits,
		fulfillmentKind,
	} = opts;
	await t.run(async (ctx) => {
		await ctx.db.insert("subscriptionTiers", {
			tierKey,
			displayName,
			initialCredits,
			monthlyCredits,
			sortOrder,
			isActive: true,
			description: "Test tier for automated tests",
			polarProductId,
			productType,
			priceUsd,
			bonusCredits,
			fulfillmentKind,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
	});
}

/** Seed one subscription record into the in-memory DB */
export async function seedSubscription(
	t: ReturnType<typeof makeT>,
	opts: {
		polarSubscriptionId?: string;
		tierKey?: string;
		status?: "active" | "canceled" | "past_due" | "trialing";
	} = {},
) {
	const {
		polarSubscriptionId = TEST_SUB_ID,
		tierKey = TEST_TIER_KEY,
		status = "active",
	} = opts;
	await t.run(async (ctx) => {
		await ctx.db.insert("subscriptions", {
			clerkUserId: TEST_USER_ID,
			organizationId: TEST_ORG_ID,
			tierKey,
			polarSubscriptionId,
			polarCustomerId: "cus_test_123",
			polarProductId: "prod_test_123",
			status,
			currentPeriodStart: Date.now(),
			currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
			cancelAtPeriodEnd: false,
			plan: {
				name: "Test Tier",
				tier: "starter",
				monthlyCredits: 1000,
				features: [],
			},
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
	});
}

/** Seed a user record (required by subscriptions.create and subscriptions.getByClerkUserId) */
export async function seedUser(
	t: ReturnType<typeof makeT>,
	opts: { clerkUserId?: string; organizationId?: string } = {},
) {
	const { clerkUserId = TEST_USER_ID, organizationId = TEST_ORG_ID } = opts;
	await t.run(async (ctx) => {
		await ctx.db.insert("users", {
			clerkUserId,
			organizationId,
			email: `${clerkUserId}@test.com`,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
	});
}

/**
 * Seed a user and return its Convex document ID (the string stored in
 * Polar customer metadata as `userId`).
 * Used to test internal.users.getByConvexId resolution.
 */
export async function seedUserAndGetConvexId(
	t: ReturnType<typeof makeT>,
	opts: { clerkUserId?: string; organizationId?: string } = {},
): Promise<string> {
	const { clerkUserId = TEST_USER_ID, organizationId = TEST_ORG_ID } = opts;
	return await t.run(async (ctx) => {
		const id = await ctx.db.insert("users", {
			clerkUserId,
			organizationId,
			email: `${clerkUserId}@test.com`,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
		return id as string;
	});
}

/** Seed both tier + subscription (needed for addMonthlyRenewalCredits) */
export async function seedSubscriptionWithTier(
	t: ReturnType<typeof makeT>,
	monthlyCredits = 1000,
) {
	await seedTier(t, { monthlyCredits });
	await seedSubscription(t);
}
