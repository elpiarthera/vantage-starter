/**
 * Domain-valid args for `internal.purchases.recordPurchase`, extracted to its
 * own (non-test) module so a future test file can import the same object
 * without re-executing `purchases.test.ts`'s `describe`/`it` blocks — same
 * convention as `__tests__/convex/fixtures/contactSubmissions.ts`.
 */

export const DIGITAL_PURCHASE_ARGS = {
	userId: "user_clerk_ada",
	productKey: "credits_pro",
	kind: "digital" as const,
	polarOrderId: "order_digital_001",
};

export const TRACKABLE_PURCHASE_ARGS = {
	userId: "user_clerk_grace",
	productKey: "physical_addon",
	kind: "trackable" as const,
	trackingRef: "TRACK-1234567890",
	polarOrderId: "order_trackable_001",
};
