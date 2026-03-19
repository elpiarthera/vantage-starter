/**
 * Sprint 27: One-time migration for transition config.
 * - Set transitionConfig: { mode: "hard_cut" } on all projects without it
 * - Clear outgoingTransition from all scenes (smooth transitions are frozen)
 *
 * Run via: npx convex run migrations:migrateTransitionConfig
 */
import { internalMutation } from "../_generated/server";

export const migrateTransitionConfig = internalMutation({
	args: {},
	handler: async (ctx) => {
		const projects = await ctx.db.query("projects").collect();

		let updatedProjects = 0;
		let clearedScenes = 0;

		for (const project of projects) {
			// Set default transitionConfig if missing
			if (!project.transitionConfig) {
				await ctx.db.patch(project._id, {
					transitionConfig: { mode: "hard_cut" },
					updatedAt: Date.now(),
				});
				updatedProjects++;
			}

			// Clear all scene transitions (since smooth transitions are frozen)
			const scenes = await ctx.db
				.query("scenes")
				.withIndex("by_project", (q) => q.eq("projectId", project._id))
				.collect();

			for (const scene of scenes) {
				if (scene.outgoingTransition) {
					await ctx.db.patch(scene._id, {
						outgoingTransition: undefined,
						updatedAt: Date.now(),
					});
					clearedScenes++;
				}
			}
		}

		return {
			success: true,
			updatedProjects,
			clearedScenes,
		};
	},
});
