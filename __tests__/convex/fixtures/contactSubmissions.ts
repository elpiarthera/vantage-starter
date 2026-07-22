/**
 * Domain-valid args for `api.contactSubmissions.create`, extracted to its own
 * (non-test) module so `__tests__/convex/global-rate-limit-guard.test.ts` can
 * import it WITHOUT re-executing `contactSubmissions.test.ts`'s own
 * `describe`/`it` blocks (importing a `.test.ts` file directly would
 * double-register that suite).
 *
 * `contactSubmissions.test.ts` imports this SAME object rather than
 * hand-typing its own copy, so the two can never drift apart.
 *
 * Convention read by the guard: any public path declaring a `*Global` bucket
 * in `convex/ratelimit.ts` must have a sibling
 * `__tests__/convex/fixtures/<moduleRef>.ts` exporting `VALID_ARGS` — the
 * guard fails loudly, naming the exact missing file, if this convention is
 * not followed for a new path.
 */

export const VALID_ARGS = {
	firstName: "Ada",
	lastName: "Lovelace",
	email: "ada@example.com",
	phoneNumber: "5551234567",
	countryCode: "+1",
	message: "I would like to discuss a project.",
};
