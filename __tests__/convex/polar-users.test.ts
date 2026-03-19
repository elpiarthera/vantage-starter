/// <reference types="vite/client" />
/**
 * Test 8: User Resolution Tests
 *
 * Tests internal.users.getByConvexId — the critical bridge between
 * Polar webhook event metadata and the Convex credit system.
 *
 * Root cause of the production bug: the @convex-dev/polar component stores
 * customers with metadata: { userId: <convex_doc_id> } — NOT clerk_user_id.
 * Webhook handlers must resolve convexId → clerkUserId before allocating credits.
 * None of the original tests covered this step; they all injected TEST_USER_ID directly.
 *
 * 3 tests:
 *   1. getByConvexId with a valid Convex doc ID → returns the user record
 *   2. getByConvexId returns the correct clerkUserId field
 *   3. getByConvexId with an unknown ID → returns null
 */

import { describe, expect, it } from "vitest";
import { internal } from "../../convex/_generated/api";
import {
	makeT,
	seedUserAndGetConvexId,
	TEST_ORG_ID,
	TEST_USER_ID,
} from "./polar-test-helpers";

// ── 1. getByConvexId with a valid Convex doc ID → returns the user ────────────
describe("User Resolution: getByConvexId — valid ID", () => {
	it("returns the user record when given a valid Convex document ID", async () => {
		const t = makeT();
		const convexId = await seedUserAndGetConvexId(t);

		const user = await t.query(internal.users.getByConvexId, {
			convexUserId: convexId,
		});

		expect(user).not.toBeNull();
		expect(user?._id).toBe(convexId);
	});
});

// ── 2. getByConvexId returns the correct clerkUserId ─────────────────────────
describe("User Resolution: getByConvexId — correct clerkUserId", () => {
	it("resolved user has the correct clerkUserId (not undefined, not convexId)", async () => {
		const t = makeT();
		const convexId = await seedUserAndGetConvexId(t, {
			clerkUserId: TEST_USER_ID,
			organizationId: TEST_ORG_ID,
		});

		const user = await t.query(internal.users.getByConvexId, {
			convexUserId: convexId,
		});

		// This is the exact value webhook handlers pass to addPurchaseCredits
		expect(user?.clerkUserId).toBe(TEST_USER_ID);
		// convexId and clerkUserId must be different strings
		expect(user?.clerkUserId).not.toBe(convexId);
	});
});

// ── 3. getByConvexId with an unknown ID → returns null ───────────────────────
describe("User Resolution: getByConvexId — unknown ID returns null", () => {
	it("returns null when no user exists for the given Convex ID", async () => {
		const t = makeT();

		// Seed a real user, capture its ID, then try a different (non-existent) ID.
		// We get a valid Convex ID format by seeding and then reading it,
		// but query with a string that never existed.
		const realId = await seedUserAndGetConvexId(t);

		// Modify one char so the ID is different (non-existent document)
		const fakeId = realId.slice(0, -1) + (realId.endsWith("a") ? "b" : "a");

		const user = await t.query(internal.users.getByConvexId, {
			convexUserId: fakeId,
		});

		// Handler checks: if (!user) { console.error(...); return; }
		// This is the guard that prevents credit allocation for unknown users
		expect(user).toBeNull();
	});
});
