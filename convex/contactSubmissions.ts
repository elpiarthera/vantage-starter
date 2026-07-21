/**
 * `contactSubmissions.create` — public `/contact` page (mcpcn `contact-form`
 * block, docs/mcpcn-block-mapping.md §4 "contact-form", Batch 4).
 *
 * PUBLIC AND UNAUTHENTICATED BY DESIGN — this is the only write path a
 * visitor with no account can reach in this repo. What stops it being an
 * open write endpoint for anyone on the internet:
 *  1. Server-side validation on every field (never trusts the client gate
 *     alone) — empty name/message rejected, email format rejected via the
 *     SAME `isValidEmail` the client uses, so the two can never drift apart.
 *  2. Two rate limits from `convex/ratelimit.ts`: 3/min keyed on the
 *     submitted email (stops one identity from being used to spam), plus a
 *     30/min GLOBAL bucket shared across every caller regardless of the
 *     email they type (bounds worst-case volume even against an attacker
 *     who rotates the email on every request).
 *  3. No attachment BINARY is accepted here — only a file name string, so
 *     this mutation cannot become an unauthenticated blob-storage write
 *     endpoint. Wiring the real upload (`ctx.storage.generateUploadUrl`)
 *     for an anonymous caller is a materially different, higher-risk
 *     surface (today every `generateUploadUrl` caller in this repo is
 *     authenticated, see `convex/files.ts`) and is declared out of scope
 *     for this bullet rather than assumed solved.
 *
 * NOT covered by the above: this does not stop a distributed attacker who
 * uses a fresh email on each request and stays under the 30/min global
 * bucket. Closing that fully needs a CAPTCHA or similar challenge, which is
 * a product decision (which provider, added dependency) out of scope for
 * this delivery — named here rather than left to be rediscovered.
 */

import { ConvexError, v } from "convex/values";
import { isValidEmail } from "../lib/validation/email";
import { mutation } from "./_generated/server";
import { rateLimiter } from "./ratelimit";

export const create = mutation({
	args: {
		firstName: v.string(),
		lastName: v.string(),
		email: v.string(),
		phoneNumber: v.optional(v.string()),
		countryCode: v.optional(v.string()),
		message: v.string(),
		attachmentName: v.optional(v.string()),
	},
	returns: v.object({
		success: v.literal(true),
		submissionId: v.id("contactSubmissions"),
	}),
	handler: async (ctx, args) => {
		const firstName = args.firstName.trim();
		const lastName = args.lastName.trim();
		const email = args.email.trim();
		const message = args.message.trim();

		if (firstName.length === 0) {
			throw new ConvexError("First name is required");
		}
		if (lastName.length === 0) {
			throw new ConvexError("Last name is required");
		}
		if (!isValidEmail(email)) {
			throw new ConvexError("A valid email address is required");
		}
		if (message.length === 0) {
			throw new ConvexError("Message is required");
		}

		// Per-email limit first: a caller reusing the same email hits this
		// before ever touching the shared global bucket.
		const perEmail = await rateLimiter.limit(ctx, "createContactSubmission", {
			key: email,
		});
		if (!perEmail.ok) {
			throw new ConvexError(
				`Rate limit exceeded. Try again in ${Math.ceil((perEmail.retryAfter ?? 60_000) / 1000)} seconds.`,
			);
		}

		const global = await rateLimiter.limit(
			ctx,
			"createContactSubmissionGlobal",
			{ key: "global" },
		);
		if (!global.ok) {
			throw new ConvexError(
				`Rate limit exceeded. Try again in ${Math.ceil((global.retryAfter ?? 60_000) / 1000)} seconds.`,
			);
		}

		const submissionId = await ctx.db.insert("contactSubmissions", {
			firstName,
			lastName,
			email,
			phoneNumber: args.phoneNumber?.trim() || undefined,
			countryCode: args.countryCode?.trim() || undefined,
			message,
			attachmentName: args.attachmentName?.trim() || undefined,
			createdAt: Date.now(),
		});

		return { success: true as const, submissionId };
	},
});
