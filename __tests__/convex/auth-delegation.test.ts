/// <reference types="vite/client" />
/**
 * T4 — convex/lib/auth.ts consumes @vantageos/cloud-identity@0.3.0.
 *
 * `assertUserOwnsResource` is a simple ownership-by-subject check
 * (`userId === resourceClerkUserId`). Per the T4 brief, this is the one
 * primitive in auth.ts whose semantics genuinely match a package export:
 * `passesScopeFilter` returns true iff `row.createdBy` is a member of
 * `oauthCtx.fromAllowList` — feeding it `fromAllowList: [callerId]` and
 * `row: { createdBy: resourceClerkUserId }` reproduces the exact equality
 * check, so the adapter DELEGATES instead of reimplementing the comparison.
 *
 * This test proves the delegation happened (not just that the behaviour is
 * equivalent — a hand-rolled `===` would also pass a black-box behavioural
 * test). It mocks the package and asserts `passesScopeFilter` is actually
 * invoked with the expected `OAuthCtx` + row shape.
 */

import type { OAuthCtx, ScopeFilterable } from "@vantageos/cloud-identity";
import { beforeEach, describe, expect, it, vi } from "vitest";

const passesScopeFilterMock =
	vi.fn<(ctx: OAuthCtx, row: ScopeFilterable) => boolean>();

vi.mock("@vantageos/cloud-identity", () => ({
	passesScopeFilter: (ctx: OAuthCtx, row: ScopeFilterable) =>
		passesScopeFilterMock(ctx, row),
}));

const CALLER_CLERK_ID = "user_delegation_caller";
const RESOURCE_OWNER_CLERK_ID = "user_delegation_resource_owner";

function fakeActionCtx(subject: string) {
	return {
		auth: {
			getUserIdentity: async () => ({ subject }),
		},
	} as unknown as Parameters<
		typeof import("../../convex/lib/auth").assertUserOwnsResource
	>[0];
}

describe("convex/lib/auth.ts — assertUserOwnsResource delegates to @vantageos/cloud-identity", () => {
	let assertUserOwnsResource: typeof import("../../convex/lib/auth").assertUserOwnsResource;

	beforeEach(async () => {
		passesScopeFilterMock.mockReset();
		// Import AFTER the mock is registered so auth.ts picks up the mocked module.
		({ assertUserOwnsResource } = await import("../../convex/lib/auth"));
	});

	it("calls passesScopeFilter with fromAllowList=[callerId] and row.createdBy=resourceClerkUserId, and does not throw when it returns true", async () => {
		passesScopeFilterMock.mockReturnValue(true);

		await expect(
			assertUserOwnsResource(fakeActionCtx(CALLER_CLERK_ID), CALLER_CLERK_ID),
		).resolves.toBeUndefined();

		expect(passesScopeFilterMock).toHaveBeenCalledTimes(1);
		const [oauthCtx, row] = passesScopeFilterMock.mock.calls[0] as [
			OAuthCtx,
			ScopeFilterable,
		];
		expect(oauthCtx.fromAllowList).toEqual([CALLER_CLERK_ID]);
		expect(row.createdBy).toBe(CALLER_CLERK_ID);
	});

	it("throws Unauthorized when passesScopeFilter returns false, without reimplementing the comparison itself", async () => {
		passesScopeFilterMock.mockReturnValue(false);

		await expect(
			assertUserOwnsResource(
				fakeActionCtx(CALLER_CLERK_ID),
				RESOURCE_OWNER_CLERK_ID,
			),
		).rejects.toThrow("Unauthorized");

		expect(passesScopeFilterMock).toHaveBeenCalledTimes(1);
		const [oauthCtx, row] = passesScopeFilterMock.mock.calls[0] as [
			OAuthCtx,
			ScopeFilterable,
		];
		expect(oauthCtx.fromAllowList).toEqual([CALLER_CLERK_ID]);
		expect(row.createdBy).toBe(RESOURCE_OWNER_CLERK_ID);
	});
});
