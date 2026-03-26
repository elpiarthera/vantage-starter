/**
 * Project management functions
 *
 * Ported from vantage-studio/convex/projects.ts.
 * Auth adapter applied: by_clerk_id → by_clerk_user_id, clerkId → clerkUserId.
 * createdBy stores Clerk user ID string (identity.subject), NOT Convex document ID.
 * Workspace resolution: by_owner_and_default index (no user.activeWorkspaceId).
 *
 * Security fixes applied (per MIGRATION-PLAN.md):
 * - S2:  get — workspace ownership check added
 * - H7:  update, archive — ownership check added
 * - H9:  assignTask — uses requireAuthWithWorkspace for authorization
 * - S5:  archive — audit log inserted before destructive operation
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth, requireAuthWithWorkspace } from "./lib/auth";
import { rateLimiter } from "./ratelimit";

// D1: Typed document validator for the projects table.
// Includes _id and _creationTime (system fields added by Convex to every document).
const projectDoc = v.object({
	_id: v.id("projects"),
	_creationTime: v.number(),
	name: v.string(),
	description: v.optional(v.string()),
	icon: v.optional(v.string()),
	color: v.optional(v.string()),
	workspaceId: v.id("workspaces"),
	createdBy: v.string(),
	settings: v.optional(
		v.object({
			defaultView: v.optional(
				v.union(v.literal("board"), v.literal("list"), v.literal("timeline")),
			),
			color: v.optional(v.string()),
			icon: v.optional(v.string()),
		}),
	),
	orderPosition: v.optional(v.number()),
	isArchived: v.optional(v.boolean()),
	taskCount: v.optional(v.number()),
	createdAt: v.number(),
	updatedAt: v.number(),
});

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List all projects in a workspace.
 * Uses provided workspaceId or resolves default workspace via by_owner_and_default.
 */
export const list = query({
	args: {
		workspaceId: v.optional(v.id("workspaces")),
		includeArchived: v.optional(v.boolean()),
	},
	returns: v.array(projectDoc),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx).catch(() => null);
		if (!user) return [];

		// Workspace resolution — supports owner and org member
		let workspaceId = args.workspaceId;
		if (workspaceId) {
			const ws = await ctx.db.get(workspaceId);
			if (!ws) return [];
			const isOwner = ws.ownerId === user.clerkUserId;
			const isOrgMember =
				ws.organizationId !== null &&
				ws.organizationId !== undefined &&
				ws.organizationId === user.organizationId;
			if (!isOwner && !isOrgMember) return [];
		}
		if (!workspaceId) {
			const ownedWs = await ctx.db
				.query("workspaces")
				.withIndex("by_owner_and_default", (q) =>
					q.eq("ownerId", user.clerkUserId).eq("isDefault", true),
				)
				.unique();
			workspaceId = ownedWs?._id;
			if (!workspaceId && user.organizationId) {
				const orgId = user.organizationId;
				const orgWs = await ctx.db
					.query("workspaces")
					.withIndex("by_organization", (q) => q.eq("organizationId", orgId))
					.first();
				workspaceId = orgWs?._id;
			}
		}

		if (!workspaceId) return [];

		const resolvedWsId = workspaceId;

		// D3: use compound index to filter archived in DB — no in-memory JS filter
		if (!args.includeArchived) {
			return await ctx.db
				.query("projects")
				.withIndex("by_workspace_archived", (q) =>
					q.eq("workspaceId", resolvedWsId).eq("isArchived", false),
				)
				.collect();
		}

		return await ctx.db
			.query("projects")
			.withIndex("by_workspace", (q) => q.eq("workspaceId", resolvedWsId))
			.collect();
	},
});

/**
 * Get a single project by ID.
 * S2 FIX: workspace ownership check added — prevents cross-user project reads.
 */
export const get = query({
	args: { id: v.id("projects") },
	returns: v.union(projectDoc, v.null()),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx).catch(() => null);
		if (!user) return null;

		const project = await ctx.db.get(args.id);
		if (!project) return null;

		// S2: workspace access check — owner or org member
		const ws = await ctx.db.get(project.workspaceId);
		if (!ws) throw new Error("Forbidden");
		const isOwner = ws.ownerId === user.clerkUserId;
		const isOrgMember =
			ws.organizationId !== null &&
			ws.organizationId !== undefined &&
			ws.organizationId === user.organizationId;
		if (!isOwner && !isOrgMember) throw new Error("Forbidden");

		return project;
	},
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new project.
 * createdBy stores Clerk user ID string.
 * Rate limit: 5 per minute per user.
 */
export const create = mutation({
	args: {
		workspaceId: v.optional(v.id("workspaces")),
		name: v.string(),
		description: v.optional(v.string()),
		icon: v.optional(v.string()),
		color: v.optional(v.string()),
	},
	returns: v.id("projects"),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);

		// D5: server-side length validation (v.string() has no maxLength)
		if (args.name.length > 200)
			throw new Error("Name must be 200 characters or less");
		if (args.description && args.description.length > 5000)
			throw new Error("Description must be 5000 characters or less");

		// Rate limit: 5 projects per minute per user
		const { ok, retryAfter } = await rateLimiter.limit(ctx, "createProject", {
			key: user.clerkUserId,
		});
		if (!ok) {
			throw new Error(
				`Rate limit exceeded. Try again in ${Math.ceil((retryAfter ?? 60_000) / 1000)} seconds.`,
			);
		}

		// Workspace resolution — no user.activeWorkspaceId
		let workspaceId = args.workspaceId;
		if (!workspaceId) {
			const defaultWs = await ctx.db
				.query("workspaces")
				.withIndex("by_owner_and_default", (q) =>
					q.eq("ownerId", user.clerkUserId).eq("isDefault", true),
				)
				.unique();
			workspaceId = defaultWs?._id;
		}

		if (!workspaceId) throw new Error("No workspace selected");

		const resolvedWsId = workspaceId;

		// F3: workspace ownership check — prevents writing to another user's workspace
		const workspace = await ctx.db.get(resolvedWsId);
		if (!workspace || workspace.ownerId !== user.clerkUserId) {
			throw new Error("Forbidden: no access to this workspace");
		}

		// Count existing projects for ordering
		const existingProjects = await ctx.db
			.query("projects")
			.withIndex("by_workspace", (q) => q.eq("workspaceId", resolvedWsId))
			.collect();

		const now = Date.now();

		return await ctx.db.insert("projects", {
			name: args.name,
			description: args.description,
			icon: args.icon ?? "📁",
			color: args.color,
			workspaceId,
			// createdBy stores Clerk user ID string — NOT Convex document ID
			createdBy: user.clerkUserId,
			orderPosition: existingProjects.length,
			isArchived: false,
			taskCount: 0,
			createdAt: now,
			updatedAt: now,
		});
	},
});

/**
 * Update a project.
 * H7 FIX: ownership check added — source omits it.
 */
export const update = mutation({
	args: {
		id: v.id("projects"),
		name: v.optional(v.string()),
		description: v.optional(v.string()),
		icon: v.optional(v.string()),
		color: v.optional(v.string()),
		isArchived: v.optional(v.boolean()),
	},
	// D1: mutations return null — callers refetch via query for updated data
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);

		const project = await ctx.db.get(args.id);
		if (!project) throw new Error("Project not found");

		// H7: ownership check — createdBy is Clerk user ID, compare against user.clerkUserId
		if (project.createdBy !== user.clerkUserId) {
			throw new Error("Forbidden");
		}

		const { id, ...updates } = args;

		// Filter out undefined values
		const filteredUpdates: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(updates)) {
			if (value !== undefined) {
				filteredUpdates[key] = value;
			}
		}

		await ctx.db.patch(id, { ...filteredUpdates, updatedAt: Date.now() });
		return null;
	},
});

/**
 * Archive a project (soft delete).
 * H7 FIX: ownership check added.
 * S5: Audit log inserted BEFORE destructive operation.
 */
export const archive = mutation({
	args: { id: v.id("projects") },
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);

		const project = await ctx.db.get(args.id);
		if (!project) throw new Error("Project not found");

		// H7: ownership check — createdBy is Clerk user ID, compare against user.clerkUserId
		if (project.createdBy !== user.clerkUserId) {
			throw new Error("Forbidden");
		}

		// Fetch workspace for audit log (organizationId required by activities table)
		const workspace = await ctx.db.get(project.workspaceId);
		if (!workspace) throw new Error("Workspace not found");

		// S5: Audit log — insert BEFORE destructive operation (transactional rollback on failure)
		await ctx.db.insert("activities", {
			organizationId: workspace.organizationId,
			userId: user.clerkUserId,
			type: "project_archived",
			title: project.name,
			description: "Project archived",
			metadata: { projectId: args.id },
			createdAt: Date.now(),
		});

		await ctx.db.patch(args.id, {
			isArchived: true,
			updatedAt: Date.now(),
		});

		return null;
	},
});

/**
 * Assign a chat to a project.
 * H9 FIX: uses requireAuthWithWorkspace for consistent workspace authorization.
 */
export const assignTask = mutation({
	args: {
		chatId: v.id("chats"),
		projectId: v.union(v.id("projects"), v.null()),
	},
	returns: v.object({ success: v.boolean() }),
	handler: async (ctx, args) => {
		const chat = await ctx.db.get(args.chatId);
		if (!chat) throw new Error("Chat not found");

		// H9: use requireAuthWithWorkspace for consistent workspace authorization
		await requireAuthWithWorkspace(ctx, chat.workspaceId);

		// F6: verify new project belongs to the same workspace — prevents cross-workspace assignment
		if (args.projectId) {
			const newProject = await ctx.db.get(args.projectId);
			if (newProject && newProject.workspaceId !== chat.workspaceId) {
				throw new Error("Forbidden: project belongs to a different workspace");
			}
		}

		const oldProjectId = chat.projectId;

		// Update the chat's projectId
		await ctx.db.patch(args.chatId, {
			projectId: args.projectId ?? undefined,
			updatedAt: Date.now(),
		});

		// Update task counts on old and new projects
		if (oldProjectId && oldProjectId !== args.projectId) {
			const oldProject = await ctx.db.get(oldProjectId);
			if (oldProject) {
				await ctx.db.patch(oldProjectId, {
					taskCount: Math.max(0, (oldProject.taskCount ?? 0) - 1),
					updatedAt: Date.now(),
				});
			}
		}

		if (args.projectId && args.projectId !== oldProjectId) {
			const newProject = await ctx.db.get(args.projectId);
			if (newProject) {
				await ctx.db.patch(args.projectId, {
					taskCount: (newProject.taskCount ?? 0) + 1,
					updatedAt: Date.now(),
				});
			}
		}

		return { success: true };
	},
});
