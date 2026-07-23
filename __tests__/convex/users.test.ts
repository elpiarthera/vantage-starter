/// <reference types="vite/client" />
/**
 * Convex User Functions Tests
 *
 * Ported from a live-backend `ConvexHttpClient` suite to in-process
 * `convexTest`, following the pattern established in
 * `__tests__/convex/contactSubmissions.test.ts`. Runs every time, on every
 * machine and in CI — no `NEXT_PUBLIC_CONVEX_URL` dependency, no
 * `describe.skipIf`.
 *
 * SECURITY CONTRACT (commit fdc2714, 2026-07-18, "close the twelve mutations
 * reachable without authentication"): `syncUser` and `getUserByClerkId` both
 * reject an unauthenticated caller, and reject a caller whose JWT identity
 * does not match the `clerkUserId` argument. The previous version of this
 * file called `syncUser` through an unauthenticated client and asserted
 * SUCCESS — i.e. it asserted precisely the behaviour fdc2714 closed. That was
 * wrong; this file asserts the opposite, and adds coverage for the
 * cross-account guard that had no test at all.
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

describe("Convex User Functions", () => {
	let t: ReturnType<typeof makeT>;

	beforeEach(() => {
		t = makeT();
	});

	describe("syncUser", () => {
		it("rejects an unauthenticated caller and writes nothing", async () => {
			await expect(
				t.mutation(api.users.syncUser, {
					clerkUserId: "user_unauth_1",
					email: "test@example.com",
				}),
			).rejects.toThrow(/Unauthorized: Authentication required/);

			const rows = await t.run(async (ctx) => ctx.db.query("users").collect());
			expect(rows).toHaveLength(0);
		});

		it("rejects a caller syncing a different clerkUserId and writes nothing", async () => {
			const asSelf = t.withIdentity({ subject: "user_self_1" });

			await expect(
				asSelf.mutation(api.users.syncUser, {
					clerkUserId: "user_other_1",
					email: "victim@example.com",
				}),
			).rejects.toThrow(/Unauthorized: cannot sync a different user's account/);

			const rows = await t.run(async (ctx) => ctx.db.query("users").collect());
			expect(rows).toHaveLength(0);
		});

		it("creates a new user when the authenticated caller syncs themselves", async () => {
			const asSelf = t.withIdentity({ subject: "user_test_1" });

			const userId = await asSelf.mutation(api.users.syncUser, {
				clerkUserId: "user_test_1",
				email: "test@example.com",
				firstName: "Test",
				lastName: "User",
				username: "testuser",
				imageUrl: "https://example.com/avatar.jpg",
			});

			expect(userId).toBeDefined();
		});

		it("updates an existing user when the authenticated caller syncs themselves again", async () => {
			const testClerkId = "user_update_1";
			const asSelf = t.withIdentity({ subject: testClerkId });

			const userId = await asSelf.mutation(api.users.syncUser, {
				clerkUserId: testClerkId,
				email: "old@example.com",
				firstName: "Old",
				lastName: "Name",
			});

			expect(userId).toBeDefined();

			const updatedUserId = await asSelf.mutation(api.users.syncUser, {
				clerkUserId: testClerkId,
				email: "new@example.com",
				firstName: "New",
				lastName: "Name",
				username: "newusername",
			});

			expect(updatedUserId).toBe(userId);

			const user = await asSelf.query(api.users.getUserByClerkId, {
				clerkUserId: testClerkId,
			});

			expect(user?.email).toBe("new@example.com");
			expect(user?.firstName).toBe("New");
			expect(user?.username).toBe("newusername");
		});

		it("handles optional fields being absent", async () => {
			const testClerkId = "user_optional_1";
			const asSelf = t.withIdentity({ subject: testClerkId });

			const userId = await asSelf.mutation(api.users.syncUser, {
				clerkUserId: testClerkId,
				email: "minimal@example.com",
			});

			expect(userId).toBeDefined();

			const user = await asSelf.query(api.users.getUserByClerkId, {
				clerkUserId: testClerkId,
			});

			expect(user?.email).toBe("minimal@example.com");
			expect(user?.firstName).toBeUndefined();
			expect(user?.lastName).toBeUndefined();
			expect(user?.username).toBeUndefined();
			expect(user?.imageUrl).toBeUndefined();
		});
	});

	describe("getUserByClerkId", () => {
		it("rejects an unauthenticated caller", async () => {
			await expect(
				t.query(api.users.getUserByClerkId, {
					clerkUserId: "user_lookup_1",
				}),
			).rejects.toThrow(/Unauthorized: Authentication required/);
		});

		it("rejects a caller reading a different clerkUserId", async () => {
			const asSelf = t.withIdentity({ subject: "user_self_2" });

			await expect(
				asSelf.query(api.users.getUserByClerkId, {
					clerkUserId: "user_other_2",
				}),
			).rejects.toThrow(/Unauthorized: cannot read another user's account/);
		});

		it("returns the caller's own user when it exists", async () => {
			const testClerkId = "user_lookup_2";
			const asSelf = t.withIdentity({ subject: testClerkId });

			await asSelf.mutation(api.users.syncUser, {
				clerkUserId: testClerkId,
				email: "lookup@example.com",
				firstName: "Lookup",
			});

			const user = await asSelf.query(api.users.getUserByClerkId, {
				clerkUserId: testClerkId,
			});

			expect(user).toBeDefined();
			expect(user?.clerkUserId).toBe(testClerkId);
			expect(user?.email).toBe("lookup@example.com");
		});

		it("returns null when the caller's own user does not yet exist", async () => {
			const testClerkId = "user_nonexistent_1";
			const asSelf = t.withIdentity({ subject: testClerkId });

			const user = await asSelf.query(api.users.getUserByClerkId, {
				clerkUserId: testClerkId,
			});

			expect(user).toBeNull();
		});
	});

	describe("getCurrentUser", () => {
		it("returns null when not authenticated", async () => {
			const user = await t.query(api.users.getCurrentUser, {});
			expect(user).toBeNull();
		});

		it("returns null when authenticated but no matching user row exists yet", async () => {
			const asSelf = t.withIdentity({ subject: "user_no_row" });
			const user = await asSelf.query(api.users.getCurrentUser, {});
			expect(user).toBeNull();
		});

		it("returns the caller's own user once synced", async () => {
			const testClerkId = "user_current_1";
			const asSelf = t.withIdentity({ subject: testClerkId });

			await asSelf.mutation(api.users.syncUser, {
				clerkUserId: testClerkId,
				email: "current@example.com",
			});

			const user = await asSelf.query(api.users.getCurrentUser, {});
			expect(user?.clerkUserId).toBe(testClerkId);
			expect(user?.email).toBe("current@example.com");
		});
	});

	it("handles multiple distinct authenticated users correctly, each syncing only themselves", async () => {
		const testClerkId1 = "user_multi1";
		const testClerkId2 = "user_multi2";
		const testClerkId3 = "user_multi3";

		await t.withIdentity({ subject: testClerkId1 }).mutation(api.users.syncUser, {
			clerkUserId: testClerkId1,
			email: "multi1@example.com",
		});
		await t.withIdentity({ subject: testClerkId2 }).mutation(api.users.syncUser, {
			clerkUserId: testClerkId2,
			email: "multi2@example.com",
		});
		await t.withIdentity({ subject: testClerkId3 }).mutation(api.users.syncUser, {
			clerkUserId: testClerkId3,
			email: "multi3@example.com",
		});

		const user1 = await t
			.withIdentity({ subject: testClerkId1 })
			.query(api.users.getUserByClerkId, { clerkUserId: testClerkId1 });
		const user2 = await t
			.withIdentity({ subject: testClerkId2 })
			.query(api.users.getUserByClerkId, { clerkUserId: testClerkId2 });
		const user3 = await t
			.withIdentity({ subject: testClerkId3 })
			.query(api.users.getUserByClerkId, { clerkUserId: testClerkId3 });

		expect(user1?.email).toBe("multi1@example.com");
		expect(user2?.email).toBe("multi2@example.com");
		expect(user3?.email).toBe("multi3@example.com");
	});

	// CANNOT MEASURE IN-PROCESS: syncUser's auto-creation of a "Personal"
	// workspace (convex/users.ts:88-104, 122-130) and the live Clerk JWT
	// shape/claims themselves are both exercised implicitly above via
	// convex-test's identity stub, but this suite does not assert against a
	// real Clerk-issued JWT or a real deployment's auth config — that would
	// require a live Convex deployment with CLERK_JWT_ISSUER_DOMAIN
	// configured, which is exactly the environment-dependent flakiness this
	// rewrite removes. Flagging this rather than silently omitting it: it is
	// a gap, not a pass.
});
