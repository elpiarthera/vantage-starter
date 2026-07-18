import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Strip the plaintext `password` field before returning a `sharedLinks` doc
 * to any client. Same idiom as `stripAgentToken` in `convex/agents.ts` —
 * destructure-and-drop, shared by every public reader of this table instead
 * of each reimplementing it (fix-the-class.md: the class is "any public
 * function returning a row from a table carrying a secret-shaped field",
 * derived from `convex/schema.ts`, not from one call site).
 *
 * `password` is stripped unconditionally by both callers of this helper: it
 * is write-only today (see `getByToken` below — no server-side comparison
 * exists anywhere in this codebase) and no reader, authenticated or not, is
 * entitled to read it back in plaintext.
 *
 * `token` is NOT stripped here — `getByToken`'s caller already possesses the
 * token (it is the function's own argument), so echoing it back leaks
 * nothing new. `list()` strips `token` too, but as an *additional*,
 * list-specific step documented at its own call site, since a management
 * view has a different reason to drop it than `getByToken` does.
 */
function stripSharedLinkPassword<T extends { password?: string }>(
	link: T,
): Omit<T, "password"> {
	const { password: _password, ...safeLink } = link;
	return safeLink;
}

/**
 * List all shared links for a resource.
 *
 * SECURITY: `resourceId` is a free-form client-chosen string, not a secret —
 * filtering by it alone let any authenticated caller from any organization
 * read another organization's shared-link rows, including the plaintext
 * `password` field. Rows are additionally filtered to the caller's own
 * `organizationId` (set server-side at `create`-time).
 *
 * FIELD REDACTION: rows are mapped through `stripSharedLinkPassword()` before
 * returning, then additionally stripped of `token`. `password` is dropped
 * because no reader of a link LIST is entitled to the plaintext password
 * (that field's only intended reader is whoever already holds the `token`,
 * via `getByToken`). `token` is dropped too, list-specifically: it is the
 * access credential for `getByToken`, and a management/list view has no
 * legitimate reason to re-expose it once minted — `create`'s return value is
 * the one-time place a caller learns the token.
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

		return links.map((link) => {
			const { token: _token, ...withoutToken } = stripSharedLinkPassword(link);
			return withoutToken;
		});
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
 *
 * FIELD REDACTION (distinct from the AUTH classification above): PUBLIC-BY-
 * DESIGN is a statement about who may call this function, not about which
 * fields of the row it is then allowed to return. The row previously
 * returned unredacted, including the plaintext `password`. There is no
 * server-side password comparison anywhere in this codebase
 * (`grep -rn 'password' convex/*.ts`, excluding schema, returns exactly 3
 * hits: this comment, `create`'s argument declaration, and the insert — no
 * `===`/`compare`/`bcrypt` call reads it back) — so `password` is, today,
 * WRITE-ONLY and UNVERIFIED. Nothing in this codebase checks a caller-
 * supplied password against it; possession of the `token` argument alone
 * grants access to everything `getByToken` returns. Returning `password` in
 * the response therefore handed the "secret meant to further restrict this
 * link" to the exact audience it was meant to be restricted from. For the
 * `password` field to mean anything, this function would need to (a) accept
 * a caller-supplied password argument, (b) compare it server-side (ideally
 * against a hash, not the current plaintext-at-rest value) before returning
 * anything beyond a "password required" signal, and (c) return `null`/an
 * error on mismatch instead of the row. None of that exists today, and
 * implementing it is a product/UX decision (it changes the public sharing
 * flow) out of scope for this fix — tracked as a follow-up. This function
 * strips `password` unconditionally via `stripSharedLinkPassword()` in the
 * meantime.
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

		return stripSharedLinkPassword(link);
	},
});
