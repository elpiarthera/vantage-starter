import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * List all shared links for a resource.
 *
 * SECURITY: `resourceId` is a free-form client-chosen string, not a secret —
 * filtering by it alone let any authenticated caller from any organization
 * read another organization's shared-link rows, including the plaintext
 * `password` field. Rows are additionally filtered to the caller's own
 * `organizationId` (set server-side at `create`-time).
 */
export const list = query({
	args: {
		resourceId: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();
		if (!user) {
			throw new Error("User not found");
		}
		const callerOrganizationId = user.organizationId || "";

		const links = await ctx.db
			.query("sharedLinks")
			.withIndex("by_resource", (q) => q.eq("resourceId", args.resourceId))
			.filter((q) => q.eq(q.field("organizationId"), callerOrganizationId))
			.collect();

		return links;
	},
});

/**
 * Create a new shared link.
 *
 * SECURITY: `organizationId` is derived from the caller's own resolved user
 * row, never trusted verbatim from client args — otherwise any caller could
 * attribute a shared link to an arbitrary organization.
 */
export const create = mutation({
	args: {
		resourceId: v.string(),
		expiresAt: v.optional(v.number()),
		password: v.optional(v.string()),
		allowDownload: v.boolean(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();
		if (!user) {
			throw new Error("User not found");
		}

		const userId = identity.subject;

		// Generate unique token — CSPRNG, same idiom as convex/agents.ts token
		// generation. This token is the ONLY authorization check performed by
		// `getByToken` below, so it must be unguessable, not merely unique.
		const tokenBytes = new Uint8Array(32);
		crypto.getRandomValues(tokenBytes);
		const token = `share_${Array.from(tokenBytes)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("")}`;

		const linkId = await ctx.db.insert("sharedLinks", {
			organizationId: user.organizationId || "",
			resourceId: args.resourceId,
			userId,
			token,
			expiresAt: args.expiresAt,
			password: args.password,
			allowDownload: args.allowDownload,
			viewCount: 0,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		return { linkId, token };
	},
});

/**
 * Delete a shared link
 */
export const remove = mutation({
	args: {
		linkId: v.id("sharedLinks"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const link = await ctx.db.get(args.linkId);
		if (!link) {
			throw new Error("Link not found");
		}

		if (link.userId !== identity.subject) {
			throw new Error("Unauthorized");
		}

		await ctx.db.delete(args.linkId);

		return { success: true };
	},
});

/**
 * Get a shared link by token (public access)
 *
 * PUBLIC-BY-DESIGN: intentionally callable without authentication. This is
 * the token-gated public sharing feature the `sharedLinks` table exists for
 * (schema comment: "Token-gated public URL sharing pattern") — possession of
 * the unguessable `token` value itself IS the intended access control, not
 * an oversight. Safety depends entirely on `token` being unguessable, which
 * this function cannot itself enforce.
 *
 * SAFETY BASIS: `create` above generates the token from `crypto.getRandomValues`
 * (32 bytes, hex-encoded — same idiom as `convex/agents.ts`'s agent tokens),
 * so the token is unguessable and non-enumerable today. This remains true
 * only for as long as (a) `create`'s token generation stays CSPRNG-based —
 * never derived from `Date.now()`, `Math.random()`, or any other
 * non-cryptographic source — and (b) link rows carry no secret beyond what
 * the token holder is entitled to see. If either condition changes, this
 * function's public-by-design classification must be re-audited before
 * shipping.
 */
export const getByToken = query({
	args: {
		token: v.string(),
	},
	handler: async (ctx, args) => {
		const link = await ctx.db
			.query("sharedLinks")
			.withIndex("by_token", (q) => q.eq("token", args.token))
			.unique();

		if (!link) {
			return null;
		}

		// Check if expired
		if (link.expiresAt && link.expiresAt < Date.now()) {
			return null;
		}

		return link;
	},
});
