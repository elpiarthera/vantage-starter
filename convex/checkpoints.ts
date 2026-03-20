/**
 * Checkpoints — approve, reject, listByMission
 *
 * Built from scratch for vantage-starter (Phase 2).
 * In vantage-studio, checkpoint logic was embedded in missions.ts.
 * Here it's a standalone file per ORCHESTRATION-PLAN.md Phase 9.
 *
 * Key behaviors (per ORCHESTRATION-PLAN.md):
 *   - approve: Clerk auth + workspace membership check + calls onCheckpointApproved (Phase 8)
 *   - reject: HARD KILL — sets mission.status = "failed", no recovery path (MVP simplification)
 *   - listByMission: query scoped to workspace member
 *
 * NOTE: approve/reject call internal.orchestration.onCheckpointApproved/onOperationCompleted.
 * Those are Phase 8 (execution engine). Until Phase 8 is built, these mutations write
 * the checkpoint state but do NOT trigger downstream unblocking.
 * The TODO comments below mark where the Phase 8 calls go.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthWithWorkspace } from "./lib/auth";

// =============================================================================
// QUERIES
// =============================================================================

export const listByMission = query({
	args: {
		missionId: v.id("missions"),
		status: v.optional(
			v.union(
				v.literal("pending"),
				v.literal("approved"),
				v.literal("rejected"),
			),
		),
	},
	handler: async (ctx, args) => {
		const mission = await ctx.db.get(args.missionId);
		if (!mission) return [];

		await requireAuthWithWorkspace(ctx, mission.workspaceId);

		const checkpoints = await ctx.db
			.query("checkpoints")
			.withIndex("by_mission", (q) => q.eq("missionId", args.missionId))
			.collect();

		if (args.status) {
			return checkpoints.filter((cp) => cp.status === args.status);
		}

		return checkpoints;
	},
});

export const get = query({
	args: { checkpointId: v.id("checkpoints") },
	handler: async (ctx, args) => {
		const checkpoint = await ctx.db.get(args.checkpointId);
		if (!checkpoint) return null;

		const mission = await ctx.db.get(checkpoint.missionId);
		if (!mission) return null;

		await requireAuthWithWorkspace(ctx, mission.workspaceId);

		return checkpoint;
	},
});

export const listPendingByMission = query({
	args: { missionId: v.id("missions") },
	handler: async (ctx, args) => {
		const mission = await ctx.db.get(args.missionId);
		if (!mission) return [];

		await requireAuthWithWorkspace(ctx, mission.workspaceId);

		return await ctx.db
			.query("checkpoints")
			.withIndex("by_mission_status", (q) =>
				q.eq("missionId", args.missionId).eq("status", "pending"),
			)
			.collect();
	},
});

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Approve a checkpoint.
 * Requires Clerk auth + workspace membership.
 * Records approvedBy (Clerk user ID) + approvedAt timestamp.
 *
 * Phase 8 hook: After patching, should call:
 *   await ctx.scheduler.runAfter(0, internal.orchestration.onCheckpointApproved, { checkpointId })
 * That call will unblock downstream operations. Not wired until Phase 8.
 */
export const approve = mutation({
	args: { checkpointId: v.id("checkpoints") },
	handler: async (ctx, args) => {
		const checkpoint = await ctx.db.get(args.checkpointId);
		if (!checkpoint) throw new Error("Checkpoint not found");

		if (checkpoint.status !== "pending") {
			throw new Error(
				`Checkpoint is already ${checkpoint.status} — cannot approve`,
			);
		}

		// Workspace membership check
		const mission = await ctx.db.get(checkpoint.missionId);
		if (!mission) throw new Error("Mission not found");

		const { user } = await requireAuthWithWorkspace(ctx, mission.workspaceId);

		const now = Date.now();

		await ctx.db.patch(args.checkpointId, {
			status: "approved",
			approvedBy: user.clerkUserId,
			approvedAt: now,
			updatedAt: now,
		});

		// TODO Phase 8: uncomment when orchestration.ts is built
		// await ctx.scheduler.runAfter(0, internal.orchestration.onCheckpointApproved, {
		//   checkpointId: args.checkpointId,
		// });

		return args.checkpointId;
	},
});

/**
 * Reject a checkpoint — HARD KILL.
 * Sets mission.status = "failed" with no recovery path (MVP).
 * Downstream operations are NOT unblocked.
 *
 * Post-MVP: add a revision flow that resets affected operations to "pending"
 * and allows re-execution. This is intentionally NOT built here.
 *
 * Requires Clerk auth + workspace membership.
 */
export const reject = mutation({
	args: {
		checkpointId: v.id("checkpoints"),
		rejectionReason: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const checkpoint = await ctx.db.get(args.checkpointId);
		if (!checkpoint) throw new Error("Checkpoint not found");

		if (checkpoint.status !== "pending") {
			throw new Error(
				`Checkpoint is already ${checkpoint.status} — cannot reject`,
			);
		}

		// Workspace membership check
		const mission = await ctx.db.get(checkpoint.missionId);
		if (!mission) throw new Error("Mission not found");

		await requireAuthWithWorkspace(ctx, mission.workspaceId);

		const now = Date.now();

		// Reject the checkpoint
		await ctx.db.patch(args.checkpointId, {
			status: "rejected",
			rejectionReason: args.rejectionReason,
			updatedAt: now,
		});

		// HARD KILL: fail the mission — no recovery path (MVP).
		// Post-MVP: add revision flow here.
		await ctx.db.patch(checkpoint.missionId, {
			status: "failed",
			updatedAt: now,
		});

		return args.checkpointId;
	},
});

/**
 * Create a checkpoint (for manual mission editing, not commitPlan).
 * commitPlan creates checkpoints atomically — this is for post-commit additions.
 */
export const create = mutation({
	args: {
		missionId: v.id("missions"),
		afterOperationId: v.id("operations"),
		description: v.string(),
	},
	handler: async (ctx, args) => {
		const mission = await ctx.db.get(args.missionId);
		if (!mission) throw new Error("Mission not found");

		await requireAuthWithWorkspace(ctx, mission.workspaceId);

		// Verify the operation belongs to this mission
		const operation = await ctx.db.get(args.afterOperationId);
		if (!operation || operation.missionId !== args.missionId) {
			throw new Error("Operation not found in this mission");
		}

		const now = Date.now();

		const checkpointId = await ctx.db.insert("checkpoints", {
			missionId: args.missionId,
			afterOperationId: args.afterOperationId,
			description: args.description,
			status: "pending",
			createdAt: now,
			updatedAt: now,
		});

		return checkpointId;
	},
});
