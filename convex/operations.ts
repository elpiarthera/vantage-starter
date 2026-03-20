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

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuthWithWorkspace, getWorkspaceContext } from "./lib/auth";

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
						q
							.eq("workspaceId", args.workspaceId)
							.eq("status", args.status!),
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
	},
	handler: async (ctx, args) => {
		const { operationId, ...updates } = args;

		const operation = await ctx.db.get(operationId);
		if (!operation) throw new Error("Operation not found");

		await requireAuthWithWorkspace(ctx, operation.workspaceId);

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
		if (
			updates.status === "completed" &&
			operation.status !== "completed"
		) {
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
