/// <reference types="vite/client" />
/**
 * sharedLinks.create token-strength regression test.
 *
 * `sharedLinks.getByToken` is deliberately public and unauthenticated — the
 * ONLY authorization it performs is possession of the `token` value itself.
 * The pre-fix generator (`share_${Date.now()}_${Math.random()...}`) made the
 * token partly derivable from wall-clock time and backed by a non-CSPRNG,
 * which means the "credential" could in principle be searched/narrowed
 * rather than merely possessed.
 *
 * WHAT THIS TEST ESTABLISHES: the current token does not embed a parseable
 * `Date.now()` timestamp and two tokens minted in the same millisecond share
 * no clock-derived prefix. This is a property test on the token's SHAPE, not
 * a statistical proof of CSPRNG quality — `crypto.getRandomValues` being a
 * CSPRNG is a platform guarantee, not something this suite re-derives.
 *
 * HONEST RED ACCOUNT: a meaningful RED against the pre-fix generator is
 * constructible for the "no embedded timestamp" property (the old token
 * literally contained `Date.now()` as a decimal substring, which this test's
 * regex would have caught) — that RED was reproduced by hand against the old
 * format string before this file existed, confirming the property is real
 * and not vacuous. Reproduce it yourself: swap the "current" assertions
 * below onto the string `share_${Date.now()}_${Math.random().toString(36).substring(7)}`
 * and the "no embedded timestamp" test fails immediately. A RED for "is not
 * derived from Math.random()" specifically is NOT meaningfully constructible
 * here: both old and new tokens are opaque strings once generated, and no
 * black-box test on the output string alone can distinguish a non-CSPRNG PRNG
 * from a CSPRNG — that distinction lives in the generator's implementation
 * (`crypto.getRandomValues` vs `Math.random`), which the source-reading
 * assertion below checks directly instead.
 */

import { readFileSync } from "node:fs";
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

const OWNER_CLERK_ID = "user_shared_links_owner";

async function seedUser(t: ReturnType<typeof makeT>) {
	return await t.run(async (ctx) => {
		const now = Date.now();
		await ctx.db.insert("users", {
			clerkUserId: OWNER_CLERK_ID,
			organizationId: undefined,
			email: `${OWNER_CLERK_ID}@test.com`,
			createdAt: now,
			updatedAt: now,
		});
	});
}

describe("sharedLinks.create token strength", () => {
	it("generates a token via crypto.getRandomValues, not Math.random/Date.now (source check)", () => {
		// Source-level assertion: the only claim a black-box output test cannot
		// make is "which RNG produced this string". This reads the generator
		// itself, matching the CLASS sweep requirement (fix-the-class.md) —
		// the source is the artifact that proves the mechanism, not the token.
		const source = readFileSync(
			new URL("../../convex/sharedLinks.ts", import.meta.url),
			"utf-8",
		);
		const createFnSource = source.slice(
			source.indexOf("export const create"),
			source.indexOf("export const remove"),
		);
		expect(createFnSource).toMatch(/crypto\.getRandomValues/);
		expect(createFnSource).not.toMatch(/Math\.random/);
		expect(createFnSource).not.toMatch(
			/Date\.now\(\)\.toString|`\$\{Date\.now\(\)\}/,
		);
	});

	it("mints tokens with no parseable embedded Date.now() timestamp, and no shared clock-derived prefix across two links created back-to-back", async () => {
		const t = makeT();
		await seedUser(t);
		const asOwner = t.withIdentity({ subject: OWNER_CLERK_ID });

		const { token: tokenA } = await asOwner.mutation(api.sharedLinks.create, {
			resourceId: "resource-1",
			allowDownload: true,
		});
		const { token: tokenB } = await asOwner.mutation(api.sharedLinks.create, {
			resourceId: "resource-1",
			allowDownload: true,
		});

		expect(tokenA).not.toEqual(tokenB);
		expect(tokenA.startsWith("share_")).toBe(true);
		expect(tokenB.startsWith("share_")).toBe(true);

		// The old format embedded Date.now() as a decimal run of >= 12 digits
		// right after the "share_" prefix (millisecond epoch, e.g.
		// "share_1737000000000_..."). Assert that shape is absent.
		const embeddedTimestampPattern = /^share_\d{12,}/;
		expect(tokenA).not.toMatch(embeddedTimestampPattern);
		expect(tokenB).not.toMatch(embeddedTimestampPattern);

		// Tokens minted in the same test (same millisecond, in practice) must
		// not share a long common prefix beyond the literal "share_" marker —
		// a clock-derived token would produce an identical or near-identical
		// prefix for links created within the same millisecond.
		const bodyA = tokenA.slice("share_".length);
		const bodyB = tokenB.slice("share_".length);
		let commonPrefixLen = 0;
		while (
			commonPrefixLen < bodyA.length &&
			bodyA[commonPrefixLen] === bodyB[commonPrefixLen]
		) {
			commonPrefixLen++;
		}
		expect(commonPrefixLen).toBeLessThan(4);

		// The body is the hex encoding of 32 random bytes -> 64 hex chars.
		expect(bodyA).toMatch(/^[0-9a-f]{64}$/);
		expect(bodyB).toMatch(/^[0-9a-f]{64}$/);
	});
});
