/// <reference types="vite/client" />
/**
 * requireAdmin org-dimension regression tests (docs/brief-backend.md,
 * tau/admin-org-dimension).
 *
 * `requireAdmin` (convex/lib/auth.ts) checked a GLOBAL `role` field only —
 * it never verified that an admin and the target of an admin action share
 * an organization. Every function gated solely by `requireAdmin` in
 * convex/adminHelpers.ts therefore let an admin/owner of ANY organization
 * promote/demote roles, enumerate admins, and read full profiles of users
 * in ANY OTHER organization.
 *
 * CLASS: any authorization check whose predicate ignores the organization
 * dimension of the row it gates.
 *
 * Every test below seeds an admin in "org A" and a victim user in "org B",
 * then calls the mutation/query as the org-A admin against the org-B row
 * and asserts the call is REJECTED. The legitimate pole (an org-A admin
 * acting on an org-A user) is asserted to keep succeeding, both to prove
 * the fix isn't over-blocking and as a regression guard.
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

const ADMIN_A = "user_admin_org_a";
const VICTIM_B = "user_member_org_b";
const VICTIM_B_EMAIL = "victim-b@test.com";

async function seedTwoOrgs(t: ReturnType<typeof makeT>) {
	const now = Date.now();
	return await t.run(async (ctx) => {
		const adminId = await ctx.db.insert("users", {
			clerkUserId: ADMIN_A,
			organizationId: "org_a",
			role: "admin",
			email: `${ADMIN_A}@test.com`,
			createdAt: now,
			updatedAt: now,
		});
		const victimId = await ctx.db.insert("users", {
			clerkUserId: VICTIM_B,
			organizationId: "org_b",
			role: "member",
			email: VICTIM_B_EMAIL,
			createdAt: now,
			updatedAt: now,
		});
		return { adminId, victimId };
	});
}

describe("requireAdmin org dimension: cross-organization admin action (MUST BLOCK)", () => {
	let t: ReturnType<typeof makeT>;

	beforeEach(async () => {
		t = makeT();
	});

	it("setAdminByEmail: org-A admin cannot promote/demote an org-B user", async () => {
		await seedTwoOrgs(t);
		const asAdminA = t.withIdentity({ subject: ADMIN_A });

		// RED (pre-fix): this call SUCCEEDED — an admin of org A could patch
		// the role of a user in org B. Post-fix it must throw Forbidden.
		await expect(
			asAdminA.mutation(api.adminHelpers.setAdminByEmail, {
				email: VICTIM_B_EMAIL,
				role: "admin",
			}),
		).rejects.toThrow(/Forbidden/);
	});

	it("setAdminByClerkId: org-A admin cannot promote/demote an org-B user", async () => {
		await seedTwoOrgs(t);
		const asAdminA = t.withIdentity({ subject: ADMIN_A });

		await expect(
			asAdminA.mutation(api.adminHelpers.setAdminByClerkId, {
				clerkUserId: VICTIM_B,
				role: "admin",
			}),
		).rejects.toThrow(/Forbidden/);
	});

	it("getUserByEmail: org-A admin cannot read an org-B user's full profile", async () => {
		await seedTwoOrgs(t);
		const asAdminA = t.withIdentity({ subject: ADMIN_A });

		await expect(
			asAdminA.query(api.adminHelpers.getUserByEmail, {
				email: VICTIM_B_EMAIL,
			}),
		).rejects.toThrow(/Forbidden/);
	});

	it("listAdmins: org-A admin never sees org-B's admin roster", async () => {
		const now = Date.now();
		await seedTwoOrgs(t);
		// Promote the org-B victim to admin so they WOULD show up in a
		// (buggy) global listing.
		await t.run(async (ctx) => {
			const victim = await ctx.db
				.query("users")
				.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", VICTIM_B))
				.unique();
			if (victim) {
				await ctx.db.patch(victim._id, { role: "admin", updatedAt: now });
			}
		});

		const asAdminA = t.withIdentity({ subject: ADMIN_A });
		const admins = await asAdminA.query(api.adminHelpers.listAdmins, {});

		expect(admins.some((a) => a.clerkUserId === VICTIM_B)).toBe(false);
	});

	it("setAdminByEmail: org-A admin cannot promote/demote an org-LESS user (schema.ts:54 `organizationId` is `v.optional(v.string())` with no default — org-less is a real bucket, e.g. personal/solo accounts, not a schema artifact)", async () => {
		const now = Date.now();
		const ORGLESS_VICTIM_EMAIL = "orgless-victim@test.com";
		await t.run(async (ctx) => {
			await ctx.db.insert("users", {
				clerkUserId: ADMIN_A,
				organizationId: "org_a",
				role: "admin",
				email: `${ADMIN_A}@test.com`,
				createdAt: now,
				updatedAt: now,
			});
			await ctx.db.insert("users", {
				clerkUserId: "user_orgless_victim",
				organizationId: undefined,
				role: "member",
				email: ORGLESS_VICTIM_EMAIL,
				createdAt: now,
				updatedAt: now,
			});
		});

		const asAdminA = t.withIdentity({ subject: ADMIN_A });

		// RED against the first-pass fix: `targetOrganizationId !== undefined
		// && ...` short-circuited the whole check whenever the TARGET had no
		// organization, so an org-A admin passed straight through onto an
		// org-less victim. This must throw Forbidden.
		await expect(
			asAdminA.mutation(api.adminHelpers.setAdminByEmail, {
				email: ORGLESS_VICTIM_EMAIL,
				role: "admin",
			}),
		).rejects.toThrow(/Forbidden/);
	});
});

describe("requireAdmin org dimension: same-organization admin action (MUST PASS)", () => {
	let t: ReturnType<typeof makeT>;

	beforeEach(async () => {
		t = makeT();
	});

	it("setAdminByEmail: org-A admin CAN act on a user within org A", async () => {
		const now = Date.now();
		await t.run(async (ctx) => {
			await ctx.db.insert("users", {
				clerkUserId: ADMIN_A,
				organizationId: "org_a",
				role: "admin",
				email: `${ADMIN_A}@test.com`,
				createdAt: now,
				updatedAt: now,
			});
			await ctx.db.insert("users", {
				clerkUserId: "user_member_org_a",
				organizationId: "org_a",
				role: "member",
				email: "member-a@test.com",
				createdAt: now,
				updatedAt: now,
			});
		});

		const asAdminA = t.withIdentity({ subject: ADMIN_A });
		const result = await asAdminA.mutation(api.adminHelpers.setAdminByEmail, {
			email: "member-a@test.com",
			role: "admin",
		});

		expect(result.success).toBe(true);
		expect(result.role).toBe("admin");
	});

	it("getUserByEmail: org-A admin CAN read a user within org A", async () => {
		const now = Date.now();
		await t.run(async (ctx) => {
			await ctx.db.insert("users", {
				clerkUserId: ADMIN_A,
				organizationId: "org_a",
				role: "admin",
				email: `${ADMIN_A}@test.com`,
				createdAt: now,
				updatedAt: now,
			});
			await ctx.db.insert("users", {
				clerkUserId: "user_member_org_a",
				organizationId: "org_a",
				role: "member",
				email: "member-a@test.com",
				createdAt: now,
				updatedAt: now,
			});
		});

		const asAdminA = t.withIdentity({ subject: ADMIN_A });
		const result = await asAdminA.query(api.adminHelpers.getUserByEmail, {
			email: "member-a@test.com",
		});

		expect(result.email).toBe("member-a@test.com");
	});

	it("setAdminByEmail: an org-LESS admin CAN act on an org-LESS user (personal/solo-account tenant bucket, both `organizationId: undefined`)", async () => {
		const now = Date.now();
		const ORGLESS_ADMIN = "user_orgless_admin";
		const ORGLESS_MEMBER_EMAIL = "orgless-member@test.com";
		await t.run(async (ctx) => {
			await ctx.db.insert("users", {
				clerkUserId: ORGLESS_ADMIN,
				organizationId: undefined,
				role: "admin",
				email: `${ORGLESS_ADMIN}@test.com`,
				createdAt: now,
				updatedAt: now,
			});
			await ctx.db.insert("users", {
				clerkUserId: "user_orgless_member",
				organizationId: undefined,
				role: "member",
				email: ORGLESS_MEMBER_EMAIL,
				createdAt: now,
				updatedAt: now,
			});
		});

		const asOrglessAdmin = t.withIdentity({ subject: ORGLESS_ADMIN });
		const result = await asOrglessAdmin.mutation(
			api.adminHelpers.setAdminByEmail,
			{ email: ORGLESS_MEMBER_EMAIL, role: "admin" },
		);

		expect(result.success).toBe(true);
		expect(result.role).toBe("admin");
	});

	it("listAdmins: org-A admin sees their own org's admin roster", async () => {
		const now = Date.now();
		await t.run(async (ctx) => {
			await ctx.db.insert("users", {
				clerkUserId: ADMIN_A,
				organizationId: "org_a",
				role: "admin",
				email: `${ADMIN_A}@test.com`,
				createdAt: now,
				updatedAt: now,
			});
		});

		const asAdminA = t.withIdentity({ subject: ADMIN_A });
		const admins = await asAdminA.query(api.adminHelpers.listAdmins, {});

		expect(admins.some((a) => a.clerkUserId === ADMIN_A)).toBe(true);
	});

	it("non-admin caller is still rejected regardless of organization (role check preserved)", async () => {
		const now = Date.now();
		await t.run(async (ctx) => {
			await ctx.db.insert("users", {
				clerkUserId: "user_plain_member_a",
				organizationId: "org_a",
				role: "member",
				email: "plain-member-a@test.com",
				createdAt: now,
				updatedAt: now,
			});
		});

		const asMember = t.withIdentity({ subject: "user_plain_member_a" });
		await expect(
			asMember.query(api.adminHelpers.listAdmins, {}),
		).rejects.toThrow(/Forbidden/);
	});
});
