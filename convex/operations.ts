/**
 * Operations — CRUD + status transitions + stats
 *
 * Ported from vantage-studio/convex/operations.ts.
 * Auth adaptation (Phase 0.5):
 *   - clerkId → clerkUserId
 *   - by_clerk_id → by_clerk_user_id
 *   - activeWorkspaceId removed — resolved via requireAuthWithWorkspace()
 *   - linkedChatId removed — chats table does not exist in vantage-starter
 *   - validateWorkspaceAccess → requireAuthWithWorkspace() (vantage-starter pattern)
 */

import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import {
	internalMutation,
	internalQuery,
	mutation,
	query,
} from "./_generated/server";
import { getWorkspaceContext, requireAuthWithWorkspace } from "./lib/auth";

/**
 * Detect whether granting `operationId` the dependency set `newDeps` would
 * create a cycle — i.e. whether `operationId` is reachable by walking
 * `dependsOn` forward from any node in `newDeps`. BFS over the mission's
 * operation graph (bounded by mission size, never unbounded).
 */
async function wouldCreateCycle(
	ctx: MutationCtx,
	operationId: Id<"operations">,
	newDeps: Id<"operations">[],
): Promise<boolean> {
	const visited = new Set<string>();
	const queue: Id<"operations">[] = [...newDeps];

	while (queue.length > 0) {
		// biome-ignore lint/style/noNonNullAssertion: queue.length > 0 guards this
		const current = queue.shift()!;
		if (current === operationId) return true;
		if (visited.has(current)) continue;
		visited.add(current);

		const node = await ctx.db.get(current);
		if (node && "dependsOn" in node && node.dependsOn) {
			queue.push(...node.dependsOn);
		}
	}

	return false;
}

// =============================================================================
// QUERIES
// =============================================================================

export const listByMission = query({
	args: { missionId: v.id("missions") },
	handler: async (ctx, args) => {
		// Verify auth via workspace (load mission first to get workspaceId)
		const mission = await ctx.db.get(args.missionId);
		if (!mission) return [];

		await requireAuthWithWorkspace(ctx, mission.workspaceId);

		const operations = await ctx.db
			.query("operations")
			.withIndex("by_mission", (q) => q.eq("missionId", args.missionId))
			.collect();

		return operations.sort(
			(a, b) => (a.orderPosition ?? 0) - (b.orderPosition ?? 0),
		);
	},
});

/**
 * Group operations by status category for mission board display.
 */
export const listByMissionGrouped = query({
	args: { missionId: v.id("missions") },
	handler: async (ctx, args) => {
		const mission = await ctx.db.get(args.missionId);
		if (!mission) {
			return { pending: [], active: [], review: [], done: [] };
		}

		await requireAuthWithWorkspace(ctx, mission.workspaceId);

		const operations = await ctx.db
			.query("operations")
			.withIndex("by_mission", (q) => q.eq("missionId", args.missionId))
			.collect();

		return {
			pending: operations.filter(
				(o) => o.status === "pending" || o.status === "blocked",
			),
			active: operations.filter((o) => o.status === "in_progress"),
			review: operations.filter((o) => o.status === "awaiting_review"),
			done: operations.filter(
				(o) => o.status === "completed" || o.status === "failed",
			),
		};
	},
});

export const getStatsByMission = query({
	args: { missionId: v.id("missions") },
	handler: async (ctx, args) => {
		const mission = await ctx.db.get(args.missionId);
		if (!mission) {
			return {
				total: 0,
				completed: 0,
				inProgress: 0,
				failed: 0,
				blocked: 0,
				awaitingReview: 0,
				pending: 0,
				progress: 0,
				byStatus: {
					pending: 0,
					blocked: 0,
					in_progress: 0,
					awaiting_review: 0,
					completed: 0,
					failed: 0,
				},
				byType: { ai: 0, human: 0 },
			};
		}

		await requireAuthWithWorkspace(ctx, mission.workspaceId);

		const operations = await ctx.db
			.query("operations")
			.withIndex("by_mission", (q) => q.eq("missionId", args.missionId))
			.collect();

		const total = operations.length;
		const completed = operations.filter((o) => o.status === "completed").length;
		const inProgress = operations.filter(
			(o) => o.status === "in_progress",
		).length;
		const failed = operations.filter((o) => o.status === "failed").length;
		const blocked = operations.filter((o) => o.status === "blocked").length;
		const awaitingReview = operations.filter(
			(o) => o.status === "awaiting_review",
		).length;
		const pending = operations.filter((o) => o.status === "pending").length;

		return {
			total,
			completed,
			inProgress,
			failed,
			blocked,
			awaitingReview,
			pending,
			progress: total > 0 ? Math.round((completed / total) * 100) : 0,
			byStatus: {
				pending,
				blocked,
				in_progress: inProgress,
				awaiting_review: awaitingReview,
				completed,
				failed,
			},
			byType: {
				ai: operations.filter((o) => o.type === "ai").length,
				human: operations.filter((o) => o.type === "human").length,
			},
		};
	},
});

export const get = query({
	args: { id: v.id("operations") },
	handler: async (ctx, args) => {
		const operation = await ctx.db.get(args.id);
		if (!operation) return null;

		await requireAuthWithWorkspace(ctx, operation.workspaceId);

		return operation;
	},
});

/**
 * List all operations across all missions in a workspace.
 * Filters by status and/or type if provided.
 */
export const listAll = query({
	args: {
		workspaceId: v.id("workspaces"),
		status: v.optional(
			v.union(
				v.literal("pending"),
				v.literal("blocked"),
				v.literal("in_progress"),
				v.literal("awaiting_review"),
				v.literal("completed"),
				v.literal("failed"),
			),
		),
		type: v.optional(v.union(v.literal("ai"), v.literal("human"))),
		missionId: v.optional(v.id("missions")),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const { user } = await requireAuthWithWorkspace(ctx, args.workspaceId);
		void user;

		const limit = args.limit ?? 200;

		let operations = args.status
			? await ctx.db
					.query("operations")
					.withIndex("by_workspace_status", (q) =>
						q.eq("workspaceId", args.workspaceId).eq("status", args.status!),
					)
					.collect()
			: await ctx.db
					.query("operations")
					.withIndex("by_workspace", (q) =>
						q.eq("workspaceId", args.workspaceId),
					)
					.collect();

		if (args.type) {
			operations = operations.filter((o) => o.type === args.type);
		}
		if (args.missionId) {
			operations = operations.filter((o) => o.missionId === args.missionId);
		}

		operations.sort((a, b) => b.updatedAt - a.updatedAt);
		operations = operations.slice(0, limit);

		// Enrich with mission names
		const missionIds = [...new Set(operations.map((o) => o.missionId))];
		const missions = await Promise.all(missionIds.map((id) => ctx.db.get(id)));
		const missionMap = new Map<string, string>();
		for (const m of missions) {
			if (m) missionMap.set(m._id, m.name);
		}

		return operations.map((op) => ({
			...op,
			missionName: missionMap.get(op.missionId) ?? "Unknown",
		}));
	},
});

// =============================================================================
// MUTATIONS
// =============================================================================

export const create = mutation({
	args: {
		missionId: v.id("missions"),
		workspaceId: v.id("workspaces"),
		name: v.string(),
		description: v.optional(v.string()),
		type: v.union(v.literal("ai"), v.literal("human")),
		status: v.optional(
			v.union(
				v.literal("pending"),
				v.literal("blocked"),
				v.literal("in_progress"),
				v.literal("awaiting_review"),
				v.literal("completed"),
				v.literal("failed"),
			),
		),
		priority: v.optional(
			v.union(
				v.literal("urgent"),
				v.literal("high"),
				v.literal("medium"),
				v.literal("low"),
			),
		),
		requiredTools: v.optional(v.array(v.string())),
		requiresReview: v.optional(v.boolean()),
		dependsOn: v.optional(v.array(v.id("operations"))),
		assignedTo: v.optional(v.string()),
		assignedAgentId: v.optional(v.id("agents")),
		estimatedMinutes: v.optional(v.number()),
		orderPosition: v.optional(v.number()),
		prompt: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { user } = await requireAuthWithWorkspace(ctx, args.workspaceId);

		const now = Date.now();

		const operationId = await ctx.db.insert("operations", {
			missionId: args.missionId,
			workspaceId: args.workspaceId,
			name: args.name,
			description: args.description,
			type: args.type,
			status: args.status ?? "pending",
			priority: args.priority ?? "medium",
			requiredTools: args.requiredTools,
			requiresReview: args.requiresReview,
			dependsOn: args.dependsOn,
			assignedTo: args.assignedTo,
			assignedAgentId: args.assignedAgentId,
			estimatedMinutes: args.estimatedMinutes,
			orderPosition: args.orderPosition ?? 0,
			prompt: args.prompt,
			createdBy: user.clerkUserId,
			createdAt: now,
			updatedAt: now,
		});

		return operationId;
	},
});

export const updateStatus = mutation({
	args: {
		id: v.id("operations"),
		status: v.union(
			v.literal("pending"),
			v.literal("blocked"),
			v.literal("in_progress"),
			v.literal("awaiting_review"),
			v.literal("completed"),
			v.literal("failed"),
		),
	},
	handler: async (ctx, args) => {
		const operation = await ctx.db.get(args.id);
		if (!operation) throw new Error("Not found: Operation does not exist");

		await requireAuthWithWorkspace(ctx, operation.workspaceId);

		const updates: Record<string, unknown> = {
			status: args.status,
			updatedAt: Date.now(),
		};

		if (args.status === "in_progress") {
			updates.startedAt = Date.now();
		}
		if (args.status === "completed") {
			updates.completedAt = Date.now();
		}

		await ctx.db.patch(args.id, updates);

		return args.id;
	},
});

export const remove = mutation({
	args: { id: v.id("operations") },
	handler: async (ctx, args) => {
		const operation = await ctx.db.get(args.id);
		if (!operation) throw new Error("Not found: Operation does not exist");

		await requireAuthWithWorkspace(ctx, operation.workspaceId);

		// Cascade-delete checkpoints gated on this operation
		const checkpoints = await ctx.db
			.query("checkpoints")
			.withIndex("by_operation", (q) => q.eq("afterOperationId", args.id))
			.collect();

		for (const checkpoint of checkpoints) {
			await ctx.db.delete(checkpoint._id);
		}

		await ctx.db.delete(args.id);

		return args.id;
	},
});

export const update = mutation({
	args: {
		operationId: v.id("operations"),
		name: v.optional(v.string()),
		description: v.optional(v.string()),
		type: v.optional(v.union(v.literal("ai"), v.literal("human"))),
		status: v.optional(
			v.union(
				v.literal("pending"),
				v.literal("blocked"),
				v.literal("in_progress"),
				v.literal("awaiting_review"),
				v.literal("completed"),
				v.literal("failed"),
			),
		),
		priority: v.optional(
			v.union(
				v.literal("urgent"),
				v.literal("high"),
				v.literal("medium"),
				v.literal("low"),
			),
		),
		requiredTools: v.optional(v.array(v.string())),
		requiresReview: v.optional(v.boolean()),
		assignedAgentId: v.optional(v.id("agents")),
		estimatedMinutes: v.optional(v.number()),
		prompt: v.optional(v.string()),
		output: v.optional(v.string()),
		error: v.optional(v.string()),
		artifacts: v.optional(v.array(v.string())),
		dependsOn: v.optional(v.array(v.id("operations"))),
	},
	handler: async (ctx, args) => {
		const { operationId, ...updates } = args;

		const operation = await ctx.db.get(operationId);
		if (!operation) throw new Error("Operation not found");

		await requireAuthWithWorkspace(ctx, operation.workspaceId);

		if (updates.dependsOn !== undefined) {
			// Reject self-dependency
			if (updates.dependsOn.includes(operationId)) {
				throw new Error("An operation cannot depend on itself");
			}

			// Reject dependencies from another mission
			for (const depId of updates.dependsOn) {
				const dep = await ctx.db.get(depId);
				if (!dep || dep.missionId !== operation.missionId) {
					throw new Error(
						"Dependencies must be operations within the same mission",
					);
				}
			}

			// Reject a dependency graph that would create a cycle
			if (await wouldCreateCycle(ctx, operationId, updates.dependsOn)) {
				throw new Error(
					"This dependency would create a circular chain between operations",
				);
			}
		}

		const cleanUpdates = Object.fromEntries(
			Object.entries(updates).filter(([, v]) => v !== undefined),
		);

		// Status-related timestamps
		if (
			updates.status === "in_progress" &&
			operation.status !== "in_progress"
		) {
			(cleanUpdates as Record<string, unknown>).startedAt = Date.now();
		}
		if (updates.status === "completed" && operation.status !== "completed") {
			(cleanUpdates as Record<string, unknown>).completedAt = Date.now();
		}

		await ctx.db.patch(operationId, {
			...cleanUpdates,
			updatedAt: Date.now(),
		});

		return operationId;
	},
});

export const clearAgentAssignment = mutation({
	args: { operationId: v.id("operations") },
	handler: async (ctx, args) => {
		const operation = await ctx.db.get(args.operationId);
		if (!operation) throw new Error("Operation not found");

		await requireAuthWithWorkspace(ctx, operation.workspaceId);

		await ctx.db.patch(args.operationId, {
			assignedAgentId: undefined,
			updatedAt: Date.now(),
		});

		return args.operationId;
	},
});

// =============================================================================
// INTERNAL QUERIES — called from httpAction (ActionCtx) via ctx.runQuery
// No auth checks — callers (agentAuth) enforce identity before calling these.
// =============================================================================

/**
 * Get a single operation by ID — no auth.
 */
export const getById = internalQuery({
	args: { operationId: v.id("operations") },
	handler: async (ctx, { operationId }) => {
		return await ctx.db.get(operationId);
	},
});

/**
 * Get status of multiple operations by ID.
 * Used by claim endpoint to verify all deps are completed before claiming.
 */
export const getDepStatuses = internalQuery({
	args: { operationIds: v.array(v.id("operations")) },
	handler: async (ctx, { operationIds }) => {
		const results = await Promise.all(
			operationIds.map(async (id) => {
				const op = await ctx.db.get(id);
				return { operationId: id, status: op?.status ?? "missing" };
			}),
		);
		return results;
	},
});

/**
 * Get all pending operations assigned to a specific agent
 * where all dependsOn operations are completed.
 * Used by GET /agent/operations/pending polling endpoint.
 */
export const getPendingForAgent = internalQuery({
	args: { agentId: v.id("agents") },
	handler: async (ctx, { agentId }) => {
		const pending = await ctx.db
			.query("operations")
			.withIndex("by_assigned_agent", (q) => q.eq("assignedAgentId", agentId))
			.filter((q) => q.eq(q.field("status"), "pending"))
			.collect();

		// Filter: only return ops whose deps are all completed
		const ready = await Promise.all(
			pending.map(async (op) => {
				if (!op.dependsOn || op.dependsOn.length === 0) return op;
				const depDocs = await Promise.all(
					op.dependsOn.map((depId) => ctx.db.get(depId)),
				);
				const allCompleted = depDocs.every(
					(dep) => dep !== null && dep.status === "completed",
				);
				return allCompleted ? op : null;
			}),
		);

		return ready.filter((op): op is NonNullable<typeof op> => op !== null);
	},
});

/**
 * Get sibling operation statuses for claim response context.
 * Returns id, name, assignedAgentId, status — NO output (RBAC: agents cannot read sibling output).
 */
export const getSiblingStatuses = internalQuery({
	args: {
		missionId: v.id("missions"),
		excludeOperationId: v.id("operations"),
	},
	handler: async (ctx, { missionId, excludeOperationId }) => {
		const ops = await ctx.db
			.query("operations")
			.withIndex("by_mission", (q) => q.eq("missionId", missionId))
			.collect();

		return ops
			.filter((op) => op._id !== excludeOperationId)
			.map((op) => ({
				id: op._id,
				name: op.name,
				assignedAgentId: op.assignedAgentId ?? null,
				status: op.status,
			}));
	},
});

/**
 * Verify an agent has at least one operation in a mission.
 * Enforces RBAC: agents cannot read missions they have no stake in.
 */
export const agentHasMissionAccess = internalQuery({
	args: {
		agentId: v.id("agents"),
		missionId: v.id("missions"),
	},
	handler: async (ctx, { agentId, missionId }) => {
		const op = await ctx.db
			.query("operations")
			.withIndex("by_assigned_agent", (q) => q.eq("assignedAgentId", agentId))
			.filter((q) => q.eq(q.field("missionId"), missionId))
			.first();
		return op !== null;
	},
});

/**
 * Get operation summaries for GET /agent/missions/context.
 * Output capped at 500 chars — agents cannot read full sibling output.
 */
export const getMissionContextOps = internalQuery({
	args: { missionId: v.id("missions") },
	handler: async (ctx, { missionId }) => {
		const ops = await ctx.db
			.query("operations")
			.withIndex("by_mission", (q) => q.eq("missionId", missionId))
			.collect();

		return ops.map((op) => ({
			id: op._id,
			name: op.name,
			assignedAgentId: op.assignedAgentId ?? null,
			status: op.status,
			// Output capped at 500 chars per RBAC rules in ORCHESTRATION-PLAN.md
			output: op.output ? op.output.slice(0, 500) : null,
		}));
	},
});

// =============================================================================
// INTERNAL MUTATIONS — called from httpAction (ActionCtx) via ctx.runMutation
// =============================================================================

/**
 * Transition operation to in_progress when an agent claims it.
 */
export const claimInternal = internalMutation({
	args: {
		operationId: v.id("operations"),
		claimedAt: v.number(),
		startedAt: v.number(),
	},
	handler: async (ctx, { operationId, claimedAt, startedAt }) => {
		await ctx.db.patch(operationId, {
			status: "in_progress",
			claimedAt,
			startedAt,
			updatedAt: Date.now(),
		});
	},
});

/**
 * Write operation output and set final status.
 * Status is either "completed" or "awaiting_review" (when requiresReview = true).
 */
export const completeInternal = internalMutation({
	args: {
		operationId: v.id("operations"),
		output: v.string(),
		artifacts: v.optional(v.array(v.string())),
		status: v.union(v.literal("completed"), v.literal("awaiting_review")),
		completedAt: v.optional(v.number()),
	},
	handler: async (
		ctx,
		{ operationId, output, artifacts, status, completedAt },
	) => {
		await ctx.db.patch(operationId, {
			status,
			output,
			artifacts,
			completedAt,
			updatedAt: Date.now(),
		});
	},
});

/**
 * Mark operation failed and set mission to failed.
 * Called from POST /agent/operations/fail.
 */
export const failInternal = internalMutation({
	args: {
		operationId: v.id("operations"),
		error: v.string(),
	},
	handler: async (ctx, { operationId, error }) => {
		const operation = await ctx.db.get(operationId);
		if (!operation) return;

		await ctx.db.patch(operationId, {
			status: "failed",
			error,
			updatedAt: Date.now(),
		});

		// Fail the mission — a failed operation is terminal
		await ctx.db.patch(operation.missionId, {
			status: "failed",
			updatedAt: Date.now(),
		});
	},
});
