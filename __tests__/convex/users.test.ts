/**
 * Convex User Functions Tests
 * Tests user sync, queries, and JWT validation using Convex HTTP API
 */

import { ConvexHttpClient } from "convex/browser";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { api } from "../../convex/_generated/api";

// TRIPOLAR REFUSAL: "cannot measure" is NOT "red". When NEXT_PUBLIC_CONVEX_URL
// is absent (e.g. no local Convex dev server running against this box), the
// whole suite must REFUSE by name — loud, counted as skipped-with-reason,
// never silently skipped and never failed. When the var IS present, it
// measures for real and must pass.
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!CONVEX_URL) {
	console.warn(
		"cannot measure: NEXT_PUBLIC_CONVEX_URL not set in environment — skipping Convex User Functions suite",
	);
}

describe.skipIf(!CONVEX_URL)("Convex User Functions", () => {
	let client: ConvexHttpClient;

	beforeEach(() => {
		// Initialize Convex client pointing to local dev server
		const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
		if (!convexUrl) {
			throw new Error("NEXT_PUBLIC_CONVEX_URL not set");
		}
		client = new ConvexHttpClient(convexUrl);
	});

	afterEach(() => {
		// ConvexHttpClient doesn't need explicit cleanup
	});

	test("syncUser should create new user when user does not exist", async () => {
		const userId = await client.mutation(api.users.syncUser, {
			clerkUserId: `user_test_${Date.now()}`,
			email: "test@example.com",
			firstName: "Test",
			lastName: "User",
			username: "testuser",
			imageUrl: "https://example.com/avatar.jpg",
		});

		expect(userId).toBeDefined();
	});

	test("syncUser should update existing user when user already exists", async () => {
		const testClerkId = `user_update_${Date.now()}`;

		// Create initial user
		const userId = await client.mutation(api.users.syncUser, {
			clerkUserId: testClerkId,
			email: "old@example.com",
			firstName: "Old",
			lastName: "Name",
		});

		expect(userId).toBeDefined();

		// Update user
		const updatedUserId = await client.mutation(api.users.syncUser, {
			clerkUserId: testClerkId,
			email: "new@example.com",
			firstName: "New",
			lastName: "Name",
			username: "newusername",
		});

		expect(updatedUserId).toBe(userId);

		// Verify user was updated
		const user = await client.query(api.users.getUserByClerkId, {
			clerkUserId: testClerkId,
		});

		expect(user?.email).toBe("new@example.com");
		expect(user?.firstName).toBe("New");
		expect(user?.username).toBe("newusername");
	});

	test("syncUser should handle optional fields", async () => {
		const testClerkId = `user_optional_${Date.now()}`;

		const userId = await client.mutation(api.users.syncUser, {
			clerkUserId: testClerkId,
			email: "minimal@example.com",
		});

		expect(userId).toBeDefined();

		const user = await client.query(api.users.getUserByClerkId, {
			clerkUserId: testClerkId,
		});

		expect(user?.email).toBe("minimal@example.com");
		expect(user?.firstName).toBeUndefined();
		expect(user?.lastName).toBeUndefined();
		expect(user?.username).toBeUndefined();
		expect(user?.imageUrl).toBeUndefined();
	});

	test("getUserByClerkId should return user when user exists", async () => {
		const testClerkId = `user_lookup_${Date.now()}`;

		await client.mutation(api.users.syncUser, {
			clerkUserId: testClerkId,
			email: "lookup@example.com",
			firstName: "Lookup",
		});

		const user = await client.query(api.users.getUserByClerkId, {
			clerkUserId: testClerkId,
		});

		expect(user).toBeDefined();
		expect(user?.clerkUserId).toBe(testClerkId);
		expect(user?.email).toBe("lookup@example.com");
	});

	test("getUserByClerkId should return null when user does not exist", async () => {
		const user = await client.query(api.users.getUserByClerkId, {
			clerkUserId: "user_nonexistent_999999",
		});

		expect(user).toBeNull();
	});

	test("getCurrentUser should return null when not authenticated", async () => {
		// Without authentication, this should return null
		const user = await client.query(api.users.getCurrentUser, {});

		expect(user).toBeNull();
	});

	test("should handle multiple users correctly", async () => {
		const timestamp = Date.now();
		const testClerkId1 = `user_multi1_${timestamp}`;
		const testClerkId2 = `user_multi2_${timestamp}`;
		const testClerkId3 = `user_multi3_${timestamp}`;

		// Create multiple users
		await client.mutation(api.users.syncUser, {
			clerkUserId: testClerkId1,
			email: "multi1@example.com",
		});

		await client.mutation(api.users.syncUser, {
			clerkUserId: testClerkId2,
			email: "multi2@example.com",
		});

		await client.mutation(api.users.syncUser, {
			clerkUserId: testClerkId3,
			email: "multi3@example.com",
		});

		// Query each user
		const user1 = await client.query(api.users.getUserByClerkId, {
			clerkUserId: testClerkId1,
		});
		const user2 = await client.query(api.users.getUserByClerkId, {
			clerkUserId: testClerkId2,
		});
		const user3 = await client.query(api.users.getUserByClerkId, {
			clerkUserId: testClerkId3,
		});

		expect(user1?.email).toBe("multi1@example.com");
		expect(user2?.email).toBe("multi2@example.com");
		expect(user3?.email).toBe("multi3@example.com");
	});
});
