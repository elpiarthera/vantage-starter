/**
 * Missions — CRUD + createFromProposal + addOperationsFromProposal
 *
 * Ported from vantage-studio/convex/missions.ts.
 * Auth adaptation (Phase 0.5):
 *   - clerkId → clerkUserId
 *   - by_clerk_id → by_clerk_user_id
 *   - activeWorkspaceId removed — workspace resolved via requireAuthWithWorkspace()
 *   - projectId removed — projects table does not exist in vantage-starter (post-MVP)
 *   - status enum updated: vantage-starter uses pending/executing/awaiting_checkpoint/completed/failed
 *   - commitPlan two-pass insert: ops inserted with dependsOn=[], then patched (pre-build blocker #3)
 *   - Initial status: ops with deps → "blocked", ops without → "pending"
 */

import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalQuery, mutation, query } from "./_generated/server";
import { requireAuth, requireAuthWithWorkspace } from "./lib/auth";
import {
	missionProposalValidator,
	operationProposalValidator,
} from "./schemas/architect";

// =============================================================================
// QUERIES
// =============================================================================

export const list = query({
	args: {
		workspaceId: v.id("workspaces"),
		limit: v.optional(v.number()),
		includeArchived: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const { user, workspace } = await requireAuthWithWorkspace(
			ctx,
			args.workspaceId,
		);
		void user;
		void workspace;

		const allMissions = await ctx.db
			.query("missions")
			.withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
			.order("desc")
			.collect();

		const missions = args.includeArchived
			? allMissions
			: allMissions.filter((m) => !m.isArchived);

		if (args.limit) {
			return missions.slice(0, args.limit);
		}

		return missions;
	},
});

export const listByWorkspace = query({
	args: {
		workspaceId: v.id("workspaces"),
		includeArchived: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const { user } = await requireAuthWithWorkspace(ctx, args.workspaceId);
		void user;

		const allMissions = await ctx.db
			.query("missions")
			.withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
			.order("desc")
			.collect();

		return args.includeArchived
			? allMissions
			: allMissions.filter((m) => !m.isArchived);
	},
});

export const listByStatus = query({
	args: { workspaceId: v.id("workspaces") },
	handler: async (ctx, args) => {
		const empty = {
			pending: [] as typeof missions,
			executing: [] as typeof missions,
			awaiting_checkpoint: [] as typeof missions,
			completed: [] as typeof missions,
			failed: [] as typeof missions,
		};

		const { user } = await requireAuthWithWorkspace(ctx, args.workspaceId);
		void user;

		const missions = await ctx.db
			.query("missions")
			.withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
			.collect();

		const active = missions.filter((m) => !m.isArchived);

		return {
			pending: active.filter((m) => m.status === "pending"),
			executing: active.filter((m) => m.status === "executing"),
			awaiting_checkpoint: active.filter(
				(m) => m.status === "awaiting_checkpoint",
			),
			completed: active.filter((m) => m.status === "completed"),
			failed: active.filter((m) => m.status === "failed"),
		};

		return empty; // unreachable — satisfies TS narrowing
	},
});

export const get = query({
	args: { id: v.id("missions") },
	handler: async (ctx, args) => {
		const mission = await ctx.db.get(args.id);
		if (!mission) return null;

		// Workspace access check
		await requireAuthWithWorkspace(ctx, mission.workspaceId);

		return mission;
	},
});

export const getStats = query({
	args: { workspaceId: v.id("workspaces") },
	handler: async (ctx, args) => {
		const { user } = await requireAuthWithWorkspace(ctx, args.workspaceId);
		void user;

		const missions = await ctx.db
			.query("missions")
			.withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
			.collect();

		return {
			total: missions.length,
			byStatus: {
				pending: missions.filter((m) => m.status === "pending").length,
				executing: missions.filter((m) => m.status === "executing").length,
				awaiting_checkpoint: missions.filter(
					(m) => m.status === "awaiting_checkpoint",
				).length,
				completed: missions.filter((m) => m.status === "completed").length,
				failed: missions.filter((m) => m.status === "failed").length,
			},
			byPriority: {
				urgent: missions.filter((m) => m.priority === "urgent").length,
				high: missions.filter((m) => m.priority === "high").length,
				medium: missions.filter((m) => m.priority === "medium").length,
				low: missions.filter((m) => m.priority === "low").length,
			},
		};
	},
});

// =============================================================================
// MUTATIONS
// =============================================================================

export const create = mutation({
	args: {
		workspaceId: v.id("workspaces"),
		name: v.string(),
		description: v.optional(v.string()),
		status: v.optional(
			v.union(
				v.literal("pending"),
				v.literal("executing"),
				v.literal("awaiting_checkpoint"),
				v.literal("completed"),
				v.literal("failed"),
			),
		),
		brief: v.optional(v.string()),
		objective: v.optional(v.string()),
		intent: v.optional(
			v.union(
				v.literal("delivery"),
				v.literal("experiment"),
				v.literal("internal"),
			),
		),
		structure: v.optional(
			v.union(
				v.literal("linear"),
				v.literal("milestones"),
				v.literal("multi-stream"),
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
		startDate: v.optional(v.number()),
		targetDate: v.optional(v.number()),
		successCriteria: v.optional(v.array(v.string())),
		ownerId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { user } = await requireAuthWithWorkspace(ctx, args.workspaceId);

		const now = Date.now();

		const missionId = await ctx.db.insert("missions", {
			name: args.name,
			description: args.description,
			status: args.status ?? "pending",
			brief: args.brief,
			objective: args.objective,
			intent: args.intent,
			structure: args.structure,
			priority: args.priority ?? "medium",
			startDate: args.startDate,
			targetDate: args.targetDate,
			progress: 0,
			workspaceId: args.workspaceId,
			createdBy: user.clerkUserId,
			ownerId: args.ownerId ?? user.clerkUserId,
			successCriteria: args.successCriteria,
			createdAt: now,
			updatedAt: now,
		});

		return missionId;
	},
});

export const updateStatus = mutation({
	args: {
		id: v.id("missions"),
		status: v.union(
			v.literal("pending"),
			v.literal("executing"),
			v.literal("awaiting_checkpoint"),
			v.literal("completed"),
			v.literal("failed"),
		),
	},
	handler: async (ctx, args) => {
		const mission = await ctx.db.get(args.id);
		if (!mission) throw new Error("Mission not found");

		await requireAuthWithWorkspace(ctx, mission.workspaceId);

		await ctx.db.patch(args.id, {
			status: args.status,
			updatedAt: Date.now(),
		});

		return args.id;
	},
});

export const update = mutation({
	args: {
		id: v.id("missions"),
		name: v.optional(v.string()),
		description: v.optional(v.string()),
		brief: v.optional(v.string()),
		objective: v.optional(v.string()),
		status: v.optional(
			v.union(
				v.literal("pending"),
				v.literal("executing"),
				v.literal("awaiting_checkpoint"),
				v.literal("completed"),
				v.literal("failed"),
			),
		),
		intent: v.optional(
			v.union(
				v.literal("delivery"),
				v.literal("experiment"),
				v.literal("internal"),
			),
		),
		structure: v.optional(
			v.union(
				v.literal("linear"),
				v.literal("milestones"),
				v.literal("multi-stream"),
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
		startDate: v.optional(v.number()),
		targetDate: v.optional(v.number()),
		progress: v.optional(v.number()),
		successCriteria: v.optional(v.array(v.string())),
	},
	handler: async (ctx, args) => {
		const mission = await ctx.db.get(args.id);
		if (!mission) throw new Error("Mission not found");

		await requireAuthWithWorkspace(ctx, mission.workspaceId);

		const { id, ...updates } = args;

		const filteredUpdates = Object.fromEntries(
			Object.entries(updates).filter(([, value]) => value !== undefined),
		);

		await ctx.db.patch(id, {
			...filteredUpdates,
			updatedAt: Date.now(),
		});

		return id;
	},
});

export const remove = mutation({
	args: { id: v.id("missions") },
	handler: async (ctx, args) => {
		const mission = await ctx.db.get(args.id);
		if (!mission) throw new Error("Mission not found");

		await requireAuthWithWorkspace(ctx, mission.workspaceId);

		// Cascade-delete operations
		const operations = await ctx.db
			.query("operations")
			.withIndex("by_mission", (q) => q.eq("missionId", args.id))
			.collect();

		for (const op of operations) {
			await ctx.db.delete(op._id);
		}

		// Cascade-delete checkpoints
		const checkpoints = await ctx.db
			.query("checkpoints")
			.withIndex("by_mission", (q) => q.eq("missionId", args.id))
			.collect();

		for (const cp of checkpoints) {
			await ctx.db.delete(cp._id);
		}

		await ctx.db.delete(args.id);

		return args.id;
	},
});

export const archive = mutation({
	args: { id: v.id("missions") },
	handler: async (ctx, args) => {
		const mission = await ctx.db.get(args.id);
		if (!mission) throw new Error("Mission not found");

		await requireAuthWithWorkspace(ctx, mission.workspaceId);

		await ctx.db.patch(args.id, {
			isArchived: true,
			updatedAt: Date.now(),
		});

		return args.id;
	},
});

export const markComplete = mutation({
	args: { id: v.id("missions") },
	handler: async (ctx, args) => {
		const mission = await ctx.db.get(args.id);
		if (!mission) throw new Error("Mission not found");

		await requireAuthWithWorkspace(ctx, mission.workspaceId);

		await ctx.db.patch(args.id, {
			status: "completed",
			progress: 100,
			updatedAt: Date.now(),
		});

		return args.id;
	},
});

export const updateBrief = mutation({
	args: {
		missionId: v.id("missions"),
		appendContent: v.string(),
	},
	handler: async (ctx, args) => {
		const mission = await ctx.db.get(args.missionId);
		if (!mission) throw new Error("Mission not found");

		await requireAuthWithWorkspace(ctx, mission.workspaceId);

		const newBrief = (mission.brief || "") + args.appendContent;

		await ctx.db.patch(args.missionId, {
			brief: newBrief,
			updatedAt: Date.now(),
		});

		return args.missionId;
	},
});

// =============================================================================
// ARCHITECT AGENT: Create Mission from AI Proposal
// Two-pass insert for dependsOn resolution (pre-build blocker #3):
//   Pass 1: insert all ops with dependsOn=[], collect tempId→realId map
//   Pass 2: patch each op's dependsOn with real Convex IDs
// Initial status: ops with deps → "blocked", ops without → "pending"
// =============================================================================

export const createFromProposal = mutation({
	args: {
		workspaceId: v.id("workspaces"),
		proposal: missionProposalValidator,
	},
	handler: async (ctx, args) => {
		// 1. Authenticate + validate workspace access
		const { user } = await requireAuthWithWorkspace(ctx, args.workspaceId);

		const { proposal } = args;
		const now = Date.now();

		// 2. Create the mission
		const missionId = await ctx.db.insert("missions", {
			workspaceId: args.workspaceId,
			name: proposal.name,
			brief: proposal.brief,
			objective: proposal.objective,
			successCriteria: proposal.successCriteria,
			status: "pending",
			createdBy: user.clerkUserId,
			createdAt: now,
			updatedAt: now,
		});

		// 3. Pass 1 — insert all operations with dependsOn=[] (empty)
		//    Collect tempId → realId map
		const idMap = new Map<string, Id<"operations">>();

		for (const op of proposal.operations) {
			const assignedAgentId = op.assignedAgentId
				? (op.assignedAgentId as Id<"agents">)
				: undefined;

			const operationId = await ctx.db.insert("operations", {
				missionId,
				workspaceId: args.workspaceId,
				name: op.name,
				description: op.description,
				type: op.type,
				status: "pending", // Will be patched to "blocked" in Pass 2 if has deps
				assignedAgentId,
				estimatedMinutes: op.estimatedMinutes,
				prompt: op.prompt,
				requiredTools: op.requiredTools,
				requiresReview: op.requiresReview,
				dependsOn: [], // Empty — filled in Pass 2
				createdBy: user.clerkUserId,
				createdAt: now,
				updatedAt: now,
			});

			idMap.set(op.id, operationId);
		}

		// 4. Pass 2 — resolve tempId dependencies to real Convex IDs
		//    Ops with deps → status "blocked"; ops without → leave as "pending"
		for (const op of proposal.operations) {
			if (op.dependsOn && op.dependsOn.length > 0) {
				const realId = idMap.get(op.id);
				if (realId) {
					const resolvedDeps = op.dependsOn
						.map((tid) => {
							const id = idMap.get(tid);
							if (!id) throw new Error(`Unknown tempId: ${tid}`);
							return id;
						})
						.filter((id): id is Id<"operations"> => id !== undefined);

					await ctx.db.patch(realId, {
						dependsOn: resolvedDeps,
						status: "blocked", // Has real deps → starts blocked
						updatedAt: now,
					});
				}
			}
		}

		// 5. Create checkpoints — afterTempId resolved via idMap
		if (proposal.checkpoints) {
			for (const checkpoint of proposal.checkpoints) {
				const realOperationId = idMap.get(checkpoint.afterOperationId);
				if (realOperationId) {
					await ctx.db.insert("checkpoints", {
						missionId,
						afterOperationId: realOperationId,
						description: checkpoint.description,
						status: "pending",
						createdAt: now,
						updatedAt: now,
					});
				}
			}
		}

		// 6. Touch updatedAt
		await ctx.db.patch(missionId, { updatedAt: Date.now() });

		return missionId;
	},
});

// =============================================================================
// ARCHITECT AGENT: Add Operations to Existing Mission
// Same two-pass insert pattern as createFromProposal.
// =============================================================================

export const addOperationsFromProposal = mutation({
	args: {
		missionId: v.id("missions"),
		operations: v.array(operationProposalValidator),
		checkpoints: v.optional(
			v.array(
				v.object({
					afterOperationId: v.string(),
					description: v.string(),
				}),
			),
		),
	},
	handler: async (ctx, args) => {
		// 1. Authenticate
		const user = await requireAuth(ctx);

		// 2. Get mission and validate access
		const mission = await ctx.db.get(args.missionId);
		if (!mission) throw new Error("Mission not found");

		await requireAuthWithWorkspace(ctx, mission.workspaceId);

		const now = Date.now();

		// 3. Pass 1 — insert all operations with dependsOn=[]
		const idMap = new Map<string, Id<"operations">>();

		for (const op of args.operations) {
			const assignedAgentId = op.assignedAgentId
				? (op.assignedAgentId as Id<"agents">)
				: undefined;

			const operationId = await ctx.db.insert("operations", {
				missionId: args.missionId,
				workspaceId: mission.workspaceId,
				name: op.name,
				description: op.description,
				type: op.type,
				status: "pending",
				assignedAgentId,
				estimatedMinutes: op.estimatedMinutes,
				prompt: op.prompt,
				requiredTools: op.requiredTools,
				requiresReview: op.requiresReview,
				dependsOn: [],
				createdBy: user.clerkUserId,
				createdAt: now,
				updatedAt: now,
			});

			idMap.set(op.id, operationId);
		}

		// 4. Pass 2 — resolve dependencies
		for (const op of args.operations) {
			if (op.dependsOn && op.dependsOn.length > 0) {
				const realId = idMap.get(op.id);
				if (realId) {
					const resolvedDeps = op.dependsOn
						.map((tid) => {
							const id = idMap.get(tid);
							if (!id) throw new Error(`Unknown tempId: ${tid}`);
							return id;
						})
						.filter((id): id is Id<"operations"> => id !== undefined);

					await ctx.db.patch(realId, {
						dependsOn: resolvedDeps,
						status: "blocked",
						updatedAt: now,
					});
				}
			}
		}

		// 5. Create checkpoints
		if (args.checkpoints) {
			for (const checkpoint of args.checkpoints) {
				const realOperationId = idMap.get(checkpoint.afterOperationId);
				if (realOperationId) {
					await ctx.db.insert("checkpoints", {
						missionId: args.missionId,
						afterOperationId: realOperationId,
						description: checkpoint.description,
						status: "pending",
						createdAt: now,
						updatedAt: now,
					});
				}
			}
		}

		// 6. Touch mission updatedAt
		await ctx.db.patch(args.missionId, { updatedAt: Date.now() });

		return { operationsCreated: args.operations.length };
	},
});

// =============================================================================
// INTERNAL QUERIES (called from httpAction via ctx.runQuery)
// =============================================================================

/**
 * Get a mission by ID — no auth (internal use only).
 * Called from agent HTTP endpoints (ActionCtx — no ctx.db).
 */
export const getById = internalQuery({
	args: { missionId: v.id("missions") },
	handler: async (ctx, { missionId }) => {
		return await ctx.db.get(missionId);
	},
});
