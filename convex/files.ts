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
		projectId: v.optional(v.id("projects")),
		sceneId: v.optional(v.id("scenes")),
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
			userId: identity.subject, // Clerk user ID (string)
			projectId: args.projectId as string | undefined, // Convert to string
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
 * Get file URL by storage ID
 */
export const getFileUrl = query({
	args: {
		storageId: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.storage.getUrl(args.storageId);
	},
});

/**
 * Delete file from storage
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

		// Delete from storage
		await ctx.storage.delete(args.storageId);

		return { success: true };
	},
});
