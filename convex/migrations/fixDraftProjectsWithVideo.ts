/**
 * Migration: Fix draft projects that have a finalVideoUrl set.
 *
 * Root cause (issue #175): updateFinalVideo mutation did not promote
 * project.status to "completed", leaving projects in "draft" state even
 * after successful video assembly. The getPublic query blocks draft projects,
 * causing the watch page to show "Video Not Found".
 *
 * This migration patches all affected projects in one shot.
 * Safe to re-run: only touches projects where status === "draft" AND
 * finalVideoUrl is set.
 */
import { internalMutation } from "../_generated/server";

export const fixDraftProjectsWithVideo = internalMutation({
	args: {},
	handler: async (ctx) => {
		const allProjects = await ctx.db.query("projects").collect();

		const affected = allProjects.filter(
			(p) => p.status === "draft" && !!p.finalVideoUrl,
		);

		for (const project of affected) {
			await ctx.db.patch(project._id, { status: "completed" });
		}

		return {
			fixed: affected.length,
			ids: affected.map((p) => p._id),
		};
	},
});
