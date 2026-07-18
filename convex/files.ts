import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Generate upload URL for client-side file upload
 * This is called first before the actual upload
 */
export const generateUploadUrl = mutation({
	args: {},
	handler: async (ctx) => {
		// Verify user is authenticated
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		// Generate a unique upload URL
		// This URL is valid for 1 hour
		return await ctx.storage.generateUploadUrl();
	},
});

/**
 * Save file metadata after successful upload
 * Called after file is uploaded to the URL from generateUploadUrl
 */
export const saveFileMetadata = mutation({
	args: {
		storageId: v.string(), // Returned from upload
		fileName: v.string(),
		fileType: v.string(), // MIME type
		fileSize: v.number(), // Bytes
		assetType: v.union(
			v.literal("image"),
			v.literal("video"),
			v.literal("audio"),
		),
		projectId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// Verify user is authenticated
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		// Get user from database
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();

		if (!user) {
			throw new Error("User not found");
		}

		// Get permanent URL for the file
		const url = await ctx.storage.getUrl(args.storageId);
		if (!url) {
			throw new Error("Failed to get file URL");
		}

		// Save asset metadata (using existing schema field names)
		const assetId = await ctx.db.insert("assets", {
			userId: identity.subject,
			projectId: args.projectId,
			type: args.assetType,
			url,
			filename: args.fileName,
			size: args.fileSize,
			uploadedAt: Date.now(),
		});

		return { assetId, url };
	},
});

/**
 * Get file URL by storage ID.
 *
 * SECURITY: requires the caller to own the `assets` row referencing this
 * storageId — a bare storageId is not a secret and must never be resolvable
 * to a URL by an unauthenticated or cross-tenant caller.
 */
export const getFileUrl = query({
	args: {
		storageId: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const url = await ctx.storage.getUrl(args.storageId);
		if (!url) {
			return null;
		}

		// Assets are indexed by userId; ownership is verified by re-deriving the
		// asset row that matches both this storageId's resolved URL AND this user.
		const owned = await ctx.db
			.query("assets")
			.withIndex("by_user", (q) => q.eq("userId", identity.subject))
			.filter((q) => q.eq(q.field("url"), url))
			.unique();
		if (!owned) {
			throw new Error(
				"Unauthorized — you don't own a file with this storage ID",
			);
		}

		return url;
	},
});

/**
 * Delete file from storage.
 *
 * SECURITY: requires the caller to own the `assets` row referencing this
 * storageId (verified via url match, since assets stores `url` not
 * `storageId` directly) before deleting from storage AND the metadata row.
 */
export const deleteFile = mutation({
	args: {
		storageId: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const url = await ctx.storage.getUrl(args.storageId);
		if (!url) {
			throw new Error("File not found");
		}

		const asset = await ctx.db
			.query("assets")
			.withIndex("by_user", (q) => q.eq("userId", identity.subject))
			.filter((q) => q.eq(q.field("url"), url))
			.unique();

		if (!asset) {
			throw new Error(
				"Unauthorized — you don't own a file with this storage ID",
			);
		}

		// Delete from storage
		await ctx.storage.delete(args.storageId);
		await ctx.db.delete(asset._id);

		return { success: true };
	},
});
