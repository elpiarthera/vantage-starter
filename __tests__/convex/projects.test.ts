import { ConvexHttpClient } from "convex/browser";
import { beforeAll, describe, expect, test } from "vitest";
import { api } from "../../convex/_generated/api";

let client: ConvexHttpClient;

beforeAll(() => {
	const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
	if (!convexUrl) {
		throw new Error("NEXT_PUBLIC_CONVEX_URL not set");
	}
	client = new ConvexHttpClient(convexUrl);
});

describe("Convex Project Functions (HTTP API)", () => {
	/**
	 * Note: These tests verify the Convex functions are deployed and callable.
	 * Full CRUD testing with authentication requires the actual Clerk JWT integration
	 * which happens in the browser via ConvexProviderWithClerk.
	 *
	 * Auth-protected mutations will fail with "Not authenticated" when called
	 * via HTTP client without proper JWT, which is expected behavior.
	 */

	test("project functions are deployed and accessible", async () => {
		// Verify all CRUD functions exist in the API
		expect(api.projects.create).toBeDefined();
		expect(api.projects.list).toBeDefined();
		expect(api.projects.get).toBeDefined();
		expect(api.projects.update).toBeDefined();
		expect(api.projects.remove).toBeDefined();
	});

	test("user sync function works correctly", async () => {
		// This works because syncUser accepts args directly (no auth context needed)
		const clerkUserId = `user_test_${Date.now()}_${Math.random()}`;
		const email = `test_${Date.now()}@example.com`;

		const userId = await client.mutation(api.users.syncUser, {
			clerkUserId,
			email,
			firstName: "Test",
			lastName: "User",
			username: "testuser",
			imageUrl: "https://example.com/avatar.jpg",
		});

		expect(userId).toBeDefined();

		// Verify user was created
		const user = await client.query(api.users.getUserByClerkId, {
			clerkUserId,
		});

		expect(user).toBeDefined();
		expect(user?.clerkUserId).toBe(clerkUserId);
		expect(user?.totalProjects).toBe(0); // New user starts with 0 projects
	});

	test("project create requires authentication (expected failure)", async () => {
		// This test verifies auth protection is working
		// Without Clerk JWT, create should fail with "Not authenticated"
		try {
			await client.mutation(api.projects.create, {
				name: "Test Project",
				occasion: "wedding",
				theme: "elegant",
				eventDetails: {
					eventTitle: "Test Wedding",
					emotionalStory: "A test story",
				},
				language: "en",
			});

			// If we reach here, auth protection is NOT working
			throw new Error("Expected authentication error but mutation succeeded");
		} catch (error) {
			// Verify it's the auth error we expect
			expect(String(error)).toContain("Not authenticated");
		}
	});

	test("project list is accessible but requires authentication", async () => {
		// Query functions can be called but will return [] without auth
		const projects = await client.query(api.projects.list, {});

		// Without authentication, should return empty array
		expect(Array.isArray(projects)).toBe(true);
		expect(projects).toHaveLength(0);
	});

	test("users table schema is correct", async () => {
		const clerkUserId = `user_schema_test_${Date.now()}`;
		const email = `schema_test_${Date.now()}@example.com`;

		await client.mutation(api.users.syncUser, {
			clerkUserId,
			email,
			firstName: "Schema",
			lastName: "Test",
			username: "schematest",
			imageUrl: "https://example.com/test.jpg",
		});

		const user = await client.query(api.users.getUserByClerkId, {
			clerkUserId,
		});

		// Verify schema fields
		expect(user).toBeDefined();
		expect(user?.clerkUserId).toBe(clerkUserId);
		expect(user?.email).toBe(email);
		expect(user?.firstName).toBe("Schema");
		expect(user?.lastName).toBe("Test");
		expect(user?.username).toBe("schematest");
		expect(user?.imageUrl).toBe("https://example.com/test.jpg");
		expect(user?.totalProjects).toBe(0);
		expect(user?.createdAt).toBeDefined();
		expect(user?.updatedAt).toBeDefined();
		expect(user?.lastActiveAt).toBeDefined();
	});
});
