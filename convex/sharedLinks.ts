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

		// Generate unique token
		const token = `share_${Date.now()}_${Math.random().toString(36).substring(7)}`;

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
 * CAVEAT (not invented, flagging honestly): the token generated in `create`
 * above (`share_${Date.now()}_${Math.random()...}`) is NOT cryptographically
 * random — `Date.now()` is guessable/enumerable and `Math.random()` is not a
 * CSPRNG. This does not change the classification (the design intent — a
 * public, token-gated lookup — is correct), but it does mean the safety
 * assumption this comment relies on ("token is unguessable") is only
 * partially true today. Revisit — and this stops being safe — the moment
 * someone relies on this token as a strong secret without first switching
 * `create`'s token generation to a CSPRNG (e.g. crypto.randomUUID() or
 * equivalent).
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
