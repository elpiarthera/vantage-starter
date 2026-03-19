import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const metadataValidator = v.object({
	size: v.number(),
	duration: v.number(),
	resolution: v.string(),
	fps: v.number(),
	format: v.string(),
	processingTime: v.number(),
	sceneCount: v.number(),
});

const renderConfigValidator = v.object({
	sceneIds: v.array(v.string()),
	audioTrackIds: v.array(v.string()),
	transitions: v.array(v.any()),
	effects: v.array(v.any()),
});

/**
 * Insert a videos row when assembly completes successfully (Sprint 27).
 * Called from videoAssembly.buildFinalVideoHandler after updateFinalVideo.
 */
export const insertFromAssembly = mutation({
	args: {
		projectId: v.id("projects"),
		fileStorageId: v.optional(v.string()),
		url: v.string(),
		metadata: metadataValidator,
		renderConfig: renderConfigValidator,
		creditsUsed: v.number(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");

		const project = await ctx.db.get(args.projectId);
		if (!project) throw new Error("Project not found");

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();
		if (!user || project.userId !== user._id) {
			throw new Error("Unauthorized - you don't own this project");
		}

		const now = Date.now();
		await ctx.db.insert("videos", {
			organizationId: project.organizationId ?? "",
			projectId: args.projectId as string,
			userId: identity.subject,
			title: project.name,
			status: "completed",
			version: 1,
			fileStorageId: args.fileStorageId,
			url: args.url,
			metadata: args.metadata,
			renderConfig: args.renderConfig,
			creditsUsed: args.creditsUsed,
			isPublic: false,
			viewCount: 0,
			downloadCount: 0,
			createdAt: now,
			updatedAt: now,
		});

		return { success: true };
	},
});

/**
 * Get the projectId for a video by its ID (public access, for shared link resolution)
 */
export const getProjectIdByVideoId = query({
	args: { videoId: v.string() },
	handler: async (ctx, args) => {
		const video = await ctx.db
			.query("videos")
			.filter((q) => q.eq(q.field("_id"), args.videoId))
			.first();

		if (!video) {
			return null;
		}

		return { projectId: video.projectId };
	},
});
