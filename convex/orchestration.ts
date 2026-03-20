/**
 * Orchestration — dependency resolution engine.
 *
 * Two internal mutations called by the execution engine (http.ts):
 *
 *   onOperationCompleted — called after any operation transitions to "completed"
 *     1. Check for a pending checkpoint gating this operation FIRST.
 *        If found → set mission.status = "awaiting_checkpoint" and RETURN.
 *        Do NOT unblock downstream — checkpoint approval triggers that.
 *     2. Find all blocked operations whose dependsOn includes this operationId.
 *        For each: if ALL deps are "completed" → unblock (patch to "pending").
 *     3. Recalculate mission.progress = (completed / total) * 100.
 *     4. If all operations completed → set mission.status = "completed".
 *
 *   onCheckpointApproved — called after a checkpoint is approved
 *     Calls onOperationCompleted on the gated operation so the normal
 *     unblocking logic runs. Then restores mission.status = "executing".
 *
 * BRANCH ORDERING IS CRITICAL:
 *   Checkpoint check MUST run BEFORE downstream unblocking.
 *   Reversing this order would unblock operations before human approval.
 *
 * These are internalMutations — no client auth required.
 * Called via: await ctx.scheduler.runAfter(0, internal.orchestration.xxx, args)
 * or via: await ctx.runMutation(internal.orchestration.xxx, args)
 *
 * Pre-build blocker #6: all scheduler calls in http.ts MUST be awaited.
 */

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";

// =============================================================================
// onOperationCompleted
// =============================================================================

export const onOperationCompleted = internalMutation({
	args: { operationId: v.id("operations") },
	handler: async (ctx, { operationId }) => {
		// 1. Load the completed operation
		const operation = await ctx.db.get(operationId);
		if (!operation) {
			console.error(`onOperationCompleted: operation ${operationId} not found`);
			return;
		}

		const missionId = operation.missionId;

		// 2. FIRST: check if a pending checkpoint is gating this operation.
		//    If so → pause mission at checkpoint. Do NOT unblock downstream yet.
		//    Downstream unblocking will happen when onCheckpointApproved fires.
		const blockingCheckpoint = await ctx.db
			.query("checkpoints")
			.withIndex("by_operation", (q) => q.eq("afterOperationId", operationId))
			.filter((q) => q.eq(q.field("status"), "pending"))
			.first();

		if (blockingCheckpoint) {
			await ctx.db.patch(missionId, {
				status: "awaiting_checkpoint",
				updatedAt: Date.now(),
			});
			return; // Halt — do not unblock downstream
		}

		// 3. Find all blocked operations in this mission that depend on the
		//    now-completed operation.
		const blockedCandidates = await ctx.db
			.query("operations")
			.withIndex("by_mission_status", (q) =>
				q.eq("missionId", missionId).eq("status", "blocked"),
			)
			.collect();

		// For each candidate: load ALL its deps. If ALL are "completed" → unblock.
		for (const candidate of blockedCandidates) {
			if (!candidate.dependsOn || candidate.dependsOn.length === 0) {
				// No deps but "blocked" status — shouldn't happen, but unblock defensively
				await ctx.db.patch(candidate._id, {
					status: "pending",
					updatedAt: Date.now(),
				});
				continue;
			}

			// Check if this candidate depends on the just-completed operation
			if (!candidate.dependsOn.includes(operationId)) {
				continue; // Not downstream of this operation
			}

			// Load all deps for this candidate
			const depDocs = await Promise.all(
				candidate.dependsOn.map((depId) => ctx.db.get(depId)),
			);

			const allCompleted = depDocs.every(
				(dep) => dep !== null && dep.status === "completed",
			);

			if (allCompleted) {
				await ctx.db.patch(candidate._id, {
					status: "pending",
					updatedAt: Date.now(),
				});
			}
		}

		// 4. Recalculate mission progress
		const allOperations = await ctx.db
			.query("operations")
			.withIndex("by_mission", (q) => q.eq("missionId", missionId))
			.collect();

		const total = allOperations.length;
		const completed = allOperations.filter(
			(op) => op.status === "completed",
		).length;

		const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

		// 5. If all completed → mark mission completed. Otherwise update progress.
		if (total > 0 && completed === total) {
			await ctx.db.patch(missionId, {
				status: "completed",
				progress: 100,
				updatedAt: Date.now(),
			});
		} else {
			await ctx.db.patch(missionId, {
				progress,
				updatedAt: Date.now(),
			});
		}
	},
});

// =============================================================================
// onCheckpointApproved
// =============================================================================

export const onCheckpointApproved = internalMutation({
	args: { checkpointId: v.id("checkpoints") },
	handler: async (ctx, { checkpointId }) => {
		// Load the checkpoint to get afterOperationId
		const checkpoint = await ctx.db.get(checkpointId);
		if (!checkpoint) {
			console.error(
				`onCheckpointApproved: checkpoint ${checkpointId} not found`,
			);
			return;
		}

		// Restore mission status to "executing" before unblocking
		await ctx.db.patch(checkpoint.missionId, {
			status: "executing",
			updatedAt: Date.now(),
		});

		// Now run the standard completion logic for the gated operation.
		// This finds all blocked downstream ops and unblocks those whose deps are met.
		await ctx.runMutation(internal.orchestration.onOperationCompleted, {
			operationId: checkpoint.afterOperationId,
		});
	},
});
