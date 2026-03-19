import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Get video generation status for a scene
 *
 * This query is designed to be used with Convex's real-time subscriptions
 * so the frontend can display live progress updates without polling.
 *
 * Returns the videoGeneration object with:
 * - status: pending | in_progress | completed | failed
 * - progress: 0-100
 * - error: if failed
 * - cost: if completed
 * - videoUrl: from scene if completed
 *
 * Usage in frontend:
 * ```ts
 * const status = useQuery(api.videoStatus.getVideoGenerationStatus, { sceneId });
 * ```
 */
export const getVideoGenerationStatus = query({
	args: {
		sceneId: v.id("scenes"),
	},
	handler: async (ctx, { sceneId }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return null;
		}

		// Get scene
		const scene = await ctx.db.get(sceneId);
		if (!scene) {
			return null;
		}

		// Verify ownership
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();

		if (!user || scene.userId !== user._id) {
			return null;
		}

		// Return status information
		return {
			sceneId: scene._id,
			status: scene.status,
			videoUrl: scene.videoUrl,
			videoGeneration: scene.videoGeneration
				? {
						status: scene.videoGeneration.status,
						progress: scene.videoGeneration.progress,
						error: scene.videoGeneration.error,
						cost: scene.videoGeneration.cost,
						creditsUsed: scene.videoGeneration.creditsUsed,
						requestId: scene.videoGeneration.requestId,
						provider: scene.videoGeneration.provider,
						model: scene.videoGeneration.model,
						startedAt: scene.videoGeneration.startedAt,
						completedAt: scene.videoGeneration.completedAt,
						retryCount: scene.videoGeneration.retryCount,
					}
				: null,
		};
	},
});

/**
 * List all scenes with their video generation status for a project
 *
 * Useful for dashboard views showing multiple scenes at once.
 *
 * Returns array of scenes with their generation status, sorted by sceneNumber.
 */
export const listScenesWithVideoStatus = query({
	args: {
		projectId: v.id("projects"),
	},
	handler: async (ctx, { projectId }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return [];
		}

		// Verify project ownership
		const project = await ctx.db.get(projectId);
		if (!project) {
			return [];
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();

		if (!user || project.userId !== user._id) {
			return [];
		}

		// Get all scenes for project
		const scenes = await ctx.db
			.query("scenes")
			.withIndex("by_project", (q) => q.eq("projectId", projectId))
			.collect();

		// Sort by sceneNumber and return with status
		return scenes
			.sort((a, b) => a.sceneNumber - b.sceneNumber)
			.map((scene) => ({
				sceneId: scene._id,
				sceneNumber: scene.sceneNumber,
				title: scene.title,
				status: scene.status,
				videoUrl: scene.videoUrl,
				videoGeneration: scene.videoGeneration
					? {
							status: scene.videoGeneration.status,
							progress: scene.videoGeneration.progress,
							error: scene.videoGeneration.error,
							cost: scene.videoGeneration.cost,
							creditsUsed: scene.videoGeneration.creditsUsed,
							retryCount: scene.videoGeneration.retryCount,
						}
					: null,
			}));
	},
});

/**
 * Get scenes by generation status
 *
 * Useful for monitoring and debugging:
 * - Find all scenes currently generating
 * - Find all failed scenes
 * - Find all completed scenes
 */
export const getScenesByGenerationStatus = query({
	args: {
		projectId: v.id("projects"),
		status: v.union(
			v.literal("draft"),
			v.literal("generating"),
			v.literal("completed"),
			v.literal("failed"),
		),
	},
	handler: async (ctx, { projectId, status }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return [];
		}

		// Verify project ownership
		const project = await ctx.db.get(projectId);
		if (!project) {
			return [];
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();

		if (!user || project.userId !== user._id) {
			return [];
		}

		// Query scenes by status using index
		const scenes = await ctx.db
			.query("scenes")
			.withIndex("by_status", (q) => q.eq("status", status))
			.filter((q) => q.eq(q.field("projectId"), projectId))
			.collect();

		return scenes.map((scene) => ({
			sceneId: scene._id,
			sceneNumber: scene.sceneNumber,
			title: scene.title,
			status: scene.status,
			videoGeneration: scene.videoGeneration
				? {
						status: scene.videoGeneration.status,
						progress: scene.videoGeneration.progress,
						error: scene.videoGeneration.error,
						requestId: scene.videoGeneration.requestId,
						startedAt: scene.videoGeneration.startedAt,
						completedAt: scene.videoGeneration.completedAt,
						retryCount: scene.videoGeneration.retryCount,
					}
				: null,
		}));
	},
});
