import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * List all shared links for a video
 */
export const list = query({
	args: {
		videoId: v.id("videos"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const links = await ctx.db
			.query("sharedLinks")
			.withIndex("by_video", (q) => q.eq("videoId", args.videoId))
			.collect();

		return links;
	},
});

/**
 * Create a new shared link
 */
export const create = mutation({
	args: {
		videoId: v.id("videos"),
		organizationId: v.string(),
		expiresAt: v.optional(v.number()),
		password: v.optional(v.string()),
		allowDownload: v.boolean(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const userId = identity.subject;

		// Generate unique token
		const token = `share_${Date.now()}_${Math.random().toString(36).substring(7)}`;

		const linkId = await ctx.db.insert("sharedLinks", {
			organizationId: args.organizationId,
			videoId: args.videoId,
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

		// Verify ownership
		if (link.userId !== identity.subject) {
			throw new Error("Unauthorized");
		}

		await ctx.db.delete(args.linkId);

		return { success: true };
	},
});

/**
 * Get a shared link by token (public access)
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
