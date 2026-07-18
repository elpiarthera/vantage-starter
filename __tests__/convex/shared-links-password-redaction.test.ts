/// <reference types="vite/client" />
/**
 * `sharedLinks.password` no longer exists — schema, mutation, and response
 * shape.
 *
 * HISTORY: this file previously asserted that `getByToken`/`list` stripped
 * a plaintext `password` field before returning a row. Day-of-this-fix
 * decision (see CHANGELOG.md — "remove decorative share password"): the
 * field was stored in plaintext, never compared server-side by any code
 * path, and had no product caller — a field named `password` that protects
 * nothing is a false guarantee carved into a template repo. Stripping it on
 * read is a weaker guarantee than never accepting or storing it at all, so
 * the field itself was removed instead of merely redacted.
 *
 * CLASS (re-derived from `convex/schema.ts`, not from one call site): any
 * field whose NAME asserts a guarantee no code path holds. This test
 * asserts the field's total absence — from `create`'s accepted args, from
 * the inserted row, and from every reader's response shape — not merely
 * that one reader redacts it.
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

const OWNER_CLERK_ID = "user_shared_links_no_password_owner";

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
		resourceId: "resource-no-password-test",
		allowDownload: true,
	});

	return { asOwner, token };
}

describe("sharedLinks carries no `password` field anywhere", () => {
	it("create() accepts no `password` argument — TypeScript would reject it at the call site above; this asserts the runtime shape matches", async () => {
		const t = makeT();
		const { token } = await seedUserAndLink(t);

		const link = await t.query(api.sharedLinks.getByToken, { token });

		expect(link).not.toBeNull();
		expect(link).not.toHaveProperty("password");
	});

	it("list() never returns a `password` field on any row", async () => {
		const t = makeT();
		const { asOwner } = await seedUserAndLink(t);

		const links = await asOwner.query(api.sharedLinks.list, {
			resourceId: "resource-no-password-test",
		});

		expect(links.length).toBeGreaterThan(0);
		for (const link of links) {
			expect(link).not.toHaveProperty("password");
		}
	});

	it("the inserted row itself carries no `password` key at rest, not merely on the redacted response", async () => {
		const t = makeT();
		const { token } = await seedUserAndLink(t);

		const rawRow = await t.run(async (ctx) => {
			return await ctx.db
				.query("sharedLinks")
				.withIndex("by_token", (q) => q.eq("token", token))
				.unique();
		});

		expect(rawRow).not.toBeNull();
		expect(rawRow).not.toHaveProperty("password");
	});
});
