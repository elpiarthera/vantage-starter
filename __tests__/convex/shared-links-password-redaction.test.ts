/// <reference types="vite/client" />
/**
 * sharedLinks.getByToken / sharedLinks.list must never return the plaintext
 * `password` field.
 *
 * CLASS (re-derived from `convex/schema.ts`, not from one file): any public
 * function returning a row from a table carrying a secret-shaped field.
 * `agents.token` was the first instance closed (this PR's sibling fix,
 * `stripAgentToken`). `sharedLinks.token` / `sharedLinks.password` are the
 * second table on this list. `getByToken` is PUBLIC-BY-DESIGN (possession of
 * `token` IS the authorization) — that classification is about AUTH, not
 * about which FIELDS the row exposes once returned. Returning the plaintext
 * `password` to an unauthenticated caller who already holds the token is a
 * distinct, narrower defect: this file's own header comment (PR #33) already
 * names "the plaintext password field" as the thing that must stop leaking,
 * and only closed it for scoping, not for this field.
 *
 * `list` returns the same row shape from the same table to an authenticated,
 * within-tenant caller — same mechanism, same fields, so it is covered here
 * too rather than treated as a second, unrelated bug.
 *
 * These tests assert the ABSENCE of `password` (and `token` on `list`) on
 * every returned object, never merely that the function returns something.
 */

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
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

const OWNER_CLERK_ID = "user_shared_links_password_owner";

async function seedUserAndLink(t: ReturnType<typeof makeT>) {
	const now = Date.now();
	await t.run(async (ctx) => {
		await ctx.db.insert("users", {
			clerkUserId: OWNER_CLERK_ID,
			organizationId: undefined,
			email: `${OWNER_CLERK_ID}@test.com`,
			createdAt: now,
			updatedAt: now,
		});
	});

	const asOwner = t.withIdentity({ subject: OWNER_CLERK_ID });
	const { token } = await asOwner.mutation(api.sharedLinks.create, {
		resourceId: "resource-password-test",
		password: "super-secret-plaintext-password",
		allowDownload: true,
	});

	return { asOwner, token };
}

describe("sharedLinks.getByToken never returns the plaintext password", () => {
	it("strips `password` even though this query requires no auth at all (public-by-design)", async () => {
		const t = makeT();
		const { token } = await seedUserAndLink(t);

		// No withIdentity() — this call is unauthenticated on purpose.
		const link = await t.query(api.sharedLinks.getByToken, { token });

		expect(link).not.toBeNull();
		expect(link).not.toHaveProperty("password");
	});
});

describe("sharedLinks.list never returns `password` or `token`", () => {
	it("strips `password` and `token` from every row returned to the owning caller", async () => {
		const t = makeT();
		const { asOwner } = await seedUserAndLink(t);

		const links = await asOwner.query(api.sharedLinks.list, {
			resourceId: "resource-password-test",
		});

		expect(links.length).toBeGreaterThan(0);
		for (const link of links) {
			expect(link).not.toHaveProperty("password");
			expect(link).not.toHaveProperty("token");
		}
	});
});
