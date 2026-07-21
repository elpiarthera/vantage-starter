/// <reference types="vite/client" />
/**
 * `contactSubmissions.create` — Batch 4 (mcpcn `contact-form` block),
 * docs/mcpcn-block-mapping.md §4 "contact-form" entry.
 *
 * TDD assertions required by the bullet, taken as written:
 * 1. A valid submission writes EXACTLY ONE row carrying the submitted values.
 * 2. An invalid email is refused BEFORE the mutation runs — the rejection
 *    happens ahead of the write, not cleaned up after it. This file proves
 *    the server-side half of that contract (defense in depth): the mutation
 *    itself refuses an invalid email and writes nothing. The client-side
 *    half (the UI never calling the mutation for an invalid email) is
 *    proven in __tests__/components/contact-form-page.test.tsx.
 */

import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
import schema from "../../convex/schema";
// No public subpath export for the ratelimiter component's internal schema —
// this is test-only wiring against the component's compiled output, same
// pattern as __tests__/convex/session-auto-title.test.ts.
import ratelimiterSchema from "../../node_modules/@convex-dev/ratelimiter/dist/esm/component/schema.js";

const modules = import.meta.glob([
	"../../convex/**/*.ts",
	"../../convex/**/*.js",
	"!../../convex/**/*.d.ts",
]);

const ratelimiterModules = import.meta.glob(
	"../../node_modules/@convex-dev/ratelimiter/dist/esm/component/**/*.js",
);

function makeT() {
	const t = convexTest(schema, modules);
	t.registerComponent("ratelimiter", ratelimiterSchema, ratelimiterModules);
	return t;
}

const VALID_ARGS = {
	firstName: "Ada",
	lastName: "Lovelace",
	email: "ada@example.com",
	phoneNumber: "5551234567",
	countryCode: "+1",
	message: "I would like to discuss a project.",
};

describe("contactSubmissions.create", () => {
	let t: ReturnType<typeof makeT>;

	beforeEach(() => {
		t = makeT();
	});

	it("RED 1: a valid submission writes EXACTLY ONE row carrying the submitted values", async () => {
		const result = await t.mutation(api.contactSubmissions.create, VALID_ARGS);

		expect(result.success).toBe(true);

		const rows = await t.run(async (ctx) =>
			ctx.db.query("contactSubmissions").collect(),
		);
		expect(rows).toHaveLength(1);
		expect(rows[0]?.firstName).toBe(VALID_ARGS.firstName);
		expect(rows[0]?.lastName).toBe(VALID_ARGS.lastName);
		expect(rows[0]?.email).toBe(VALID_ARGS.email);
		expect(rows[0]?.phoneNumber).toBe(VALID_ARGS.phoneNumber);
		expect(rows[0]?.countryCode).toBe(VALID_ARGS.countryCode);
		expect(rows[0]?.message).toBe(VALID_ARGS.message);
	});

	it("RED 2: an invalid email is refused before the mutation writes anything", async () => {
		await expect(
			t.mutation(api.contactSubmissions.create, {
				...VALID_ARGS,
				email: "not-an-email",
			}),
		).rejects.toThrow(/email/i);

		const rows = await t.run(async (ctx) =>
			ctx.db.query("contactSubmissions").collect(),
		);
		expect(rows).toHaveLength(0);
	});

	it("rejects an empty first name and writes nothing", async () => {
		await expect(
			t.mutation(api.contactSubmissions.create, {
				...VALID_ARGS,
				firstName: "  ",
			}),
		).rejects.toThrow();

		const rows = await t.run(async (ctx) =>
			ctx.db.query("contactSubmissions").collect(),
		);
		expect(rows).toHaveLength(0);
	});

	it("rejects an empty message and writes nothing", async () => {
		await expect(
			t.mutation(api.contactSubmissions.create, {
				...VALID_ARGS,
				message: "   ",
			}),
		).rejects.toThrow();

		const rows = await t.run(async (ctx) =>
			ctx.db.query("contactSubmissions").collect(),
		);
		expect(rows).toHaveLength(0);
	});

	it("stores the attachment file name when one is provided", async () => {
		const result = await t.mutation(api.contactSubmissions.create, {
			...VALID_ARGS,
			attachmentName: "brief.pdf",
		});
		expect(result.success).toBe(true);

		const rows = await t.run(async (ctx) =>
			ctx.db.query("contactSubmissions").collect(),
		);
		expect(rows[0]?.attachmentName).toBe("brief.pdf");
	});

	it("does not require authentication (public-by-design)", async () => {
		// No t.withIdentity(...) — the call above already runs unauthenticated,
		// asserted explicitly here so a future change requiring auth reddens it.
		const result = await t.mutation(api.contactSubmissions.create, VALID_ARGS);
		expect(result.success).toBe(true);
	});

	it("rate-limits repeated submissions from the same email and writes nothing past the limit", async () => {
		for (let i = 0; i < 3; i++) {
			await t.mutation(api.contactSubmissions.create, VALID_ARGS);
		}

		await expect(
			t.mutation(api.contactSubmissions.create, VALID_ARGS),
		).rejects.toThrow(/rate limit/i);

		const rows = await t.run(async (ctx) =>
			ctx.db.query("contactSubmissions").collect(),
		);
		expect(rows).toHaveLength(3);
	});
});
