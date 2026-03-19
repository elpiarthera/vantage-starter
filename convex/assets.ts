import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * List all assets for a user
 * Supports filtering by project, scene, and asset type
 */
export const list = query({
	args: {
		projectId: v.optional(v.id("projects")),
		sceneId: v.optional(v.id("scenes")), // Optional scene filter (for future use)
		assetType: v.optional(
			v.union(v.literal("image"), v.literal("video"), v.literal("audio")),
		),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		// Start with user's assets
		const query = ctx.db
			.query("assets")
			.withIndex("by_user", (q) => q.eq("userId", identity.subject));

		// Collect all assets
		let assets = await query.collect();

		// Apply filters
		if (args.projectId) {
			const projectIdStr = args.projectId as string;
			assets = assets.filter((a) => a.projectId === projectIdStr);
		}

		if (args.sceneId) {
			const sceneIdStr = args.sceneId as string;
			assets = assets.filter((a) => a.sceneId === sceneIdStr);
		}

		if (args.assetType) {
			assets = assets.filter((a) => a.type === args.assetType);
		}

		// Sort by newest first
		return assets.sort((a, b) => b.uploadedAt - a.uploadedAt);
	},
});

/**
 * Get a single asset by ID
 */
export const get = query({
	args: {
		assetId: v.id("assets"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const asset = await ctx.db.get(args.assetId);
		if (!asset) {
			return null;
		}

		// Verify ownership
		if (asset.userId !== identity.subject) {
			throw new Error("Unauthorized");
		}

		return asset;
	},
});

/**
 * Delete an asset and its file from storage
 */
export const remove = mutation({
	args: {
		assetId: v.id("assets"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const asset = await ctx.db.get(args.assetId);
		if (!asset) {
			throw new Error("Asset not found");
		}

		// Verify ownership
		if (asset.userId !== identity.subject) {
			throw new Error("Unauthorized");
		}

		// Note: We don't have storageId in the current schema
		// So we can't delete from storage yet
		// This will be handled when we update the schema

		// Delete metadata from database
		await ctx.db.delete(args.assetId);

		return { success: true };
	},
});

/**
 * Get assets used as scene frames
 */
export const getSceneFrames = query({
	args: {
		sceneId: v.id("scenes"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		// Get scene to access startFrame and endFrame IDs
		const scene = await ctx.db.get(args.sceneId);
		if (!scene) {
			return { startFrame: null, endFrame: null };
		}

		// Verify ownership
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();

		if (!user || scene.userId !== identity.subject) {
			throw new Error("Unauthorized");
		}

		// Get frame assets - startFrame and endFrame are strings in schema
		const startFrame =
			scene.startFrame && scene.startFrame.length > 0
				? await ctx.db
						.query("assets")
						.filter((q) => q.eq(q.field("_id"), scene.startFrame))
						.first()
				: null;

		const endFrame =
			scene.endFrame && scene.endFrame.length > 0
				? await ctx.db
						.query("assets")
						.filter((q) => q.eq(q.field("_id"), scene.endFrame))
						.first()
				: null;

		return { startFrame, endFrame };
	},
});

/**
 * Get total storage used by user
 */
export const getUserStorageUsage = query({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return { totalBytes: 0, totalGB: 0, assetCount: 0 };
		}

		const assets = await ctx.db
			.query("assets")
			.withIndex("by_user", (q) => q.eq("userId", identity.subject))
			.collect();

		const totalBytes = assets.reduce((sum, asset) => sum + asset.size, 0);
		const totalGB = totalBytes / (1024 * 1024 * 1024);

		return {
			totalBytes,
			totalGB: Number(totalGB.toFixed(2)),
			assetCount: assets.length,
		};
	},
});
