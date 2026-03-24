/**
 * Chat management functions
 *
 * Ported from vantage-studio/convex/chats.ts.
 * Auth adapter applied: by_clerk_id → by_clerk_user_id, clerkId → clerkUserId.
 * createdBy stores Clerk user ID string (identity.subject), NOT Convex document ID.
 * Workspace resolution: by_owner_and_default index (no user.activeWorkspaceId).
 *
 * Security fixes applied (per MIGRATION-PLAN.md):
 * - B2: getById — workspace ownership check added
 * - H4: ownership checks compare createdBy vs identity.subject (Clerk user ID strings)
 * - H5: create — workspace ownership verification before insert
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./lib/auth";
import { rateLimiter } from "./ratelimit";

// D1: Typed document validator for the chats table.
// Includes _id and _creationTime (system fields added by Convex to every document).
const chatDoc = v.object({
	_id: v.id("chats"),
	_creationTime: v.number(),
	title: v.string(),
	workspaceId: v.id("workspaces"),
	projectId: v.optional(v.id("projects")),
	createdBy: v.string(),
	visibility: v.optional(v.union(v.literal("private"), v.literal("workspace"))),
	isPinned: v.optional(v.boolean()),
	enabledToolkits: v.optional(
		v.array(
			v.object({
				slug: v.string(),
				isConnected: v.boolean(),
			}),
		),
	),
	selectedModel: v.optional(v.string()),
	createdAt: v.number(),
	updatedAt: v.number(),
});

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List chats for the current user's default workspace.
 * Used by SidebarHistory — real-time subscription.
 * Supports both personal workspace owners and org members.
 *
 * @returns Paginated chat list with hasMore indicator
 */
export const list = query({
	args: {
		limit: v.optional(v.number()),
	},
	returns: v.object({
		chats: v.array(chatDoc),
		hasMore: v.boolean(),
	}),
	handler: async (ctx, { limit = 50 }) => {
		const user = await requireAuth(ctx).catch(() => null);
		if (!user) return { chats: [], hasMore: false };

		// 1. Try owned default workspace
		const ownedWorkspace = await ctx.db
			.query("workspaces")
			.withIndex("by_owner_and_default", (q) =>
				q.eq("ownerId", user.clerkUserId).eq("isDefault", true),
			)
			.unique();

		// 2. Fall back to org workspace if user has no owned default
		let workspace = ownedWorkspace;
		if (!workspace && user.organizationId) {
			const orgId = user.organizationId;
			workspace = await ctx.db
				.query("workspaces")
				.withIndex("by_organization", (q) => q.eq("organizationId", orgId))
				.first();
		}

		if (!workspace) return { chats: [], hasMore: false };

		const chats = await ctx.db
			.query("chats")
			.withIndex("by_workspace_created", (q) =>
				q.eq("workspaceId", workspace._id),
			)
			.order("desc")
			.take(limit + 1);

		const hasMore = chats.length > limit;
		const results = hasMore ? chats.slice(0, limit) : chats;

		return { chats: results, hasMore };
	},
});

/**
 * Get chats for the current user's default workspace.
 * @deprecated Use list() for paginated results.
 */
export const getForCurrentWorkspace = query({
	args: {},
	returns: v.array(chatDoc),
	handler: async (ctx) => {
		const user = await requireAuth(ctx).catch(() => null);
		if (!user) return [];

		// 1. Try owned default workspace
		const ownedWorkspace = await ctx.db
			.query("workspaces")
			.withIndex("by_owner_and_default", (q) =>
				q.eq("ownerId", user.clerkUserId).eq("isDefault", true),
			)
			.unique();

		// 2. Fall back to org workspace if user has no owned default
		let workspace = ownedWorkspace;
		if (!workspace && user.organizationId) {
			const orgId = user.organizationId;
			workspace = await ctx.db
				.query("workspaces")
				.withIndex("by_organization", (q) => q.eq("organizationId", orgId))
				.first();
		}

		if (!workspace) return [];

		return await ctx.db
			.query("chats")
			.withIndex("by_workspace_created", (q) =>
				q.eq("workspaceId", workspace._id),
			)
			.order("desc")
			.collect();
	},
});

/**
 * Get chats for a specific workspace.
 * Validates workspace ownership or org membership before returning data.
 */
export const getByWorkspace = query({
	args: { workspaceId: v.id("workspaces") },
	returns: v.array(chatDoc),
	handler: async (ctx, { workspaceId }) => {
		const user = await requireAuth(ctx).catch(() => null);
		if (!user) return [];

		const workspace = await ctx.db.get(workspaceId);
		if (!workspace) return [];

		// Access check: owner OR org member
		const isOwner = workspace.ownerId === user.clerkUserId;
		const isOrgMember =
			workspace.organizationId !== null &&
			workspace.organizationId !== undefined &&
			workspace.organizationId === user.organizationId;
		if (!isOwner && !isOrgMember) return [];

		return await ctx.db
			.query("chats")
			.withIndex("by_workspace_created", (q) =>
				q.eq("workspaceId", workspaceId),
			)
			.order("desc")
			.collect();
	},
});

/**
 * Get a single chat by ID.
 * B2 FIX: workspace ownership check added — without this, any authenticated
 * user can read any chat by ID.
 */
export const getById = query({
	args: { id: v.id("chats") },
	returns: v.union(chatDoc, v.null()),
	handler: async (ctx, { id }) => {
		const user = await requireAuth(ctx).catch(() => null);
		if (!user) return null;

		const chat = await ctx.db.get(id);
		if (!chat) return null;

		// B2: workspace access check — owner or org member
		const ws = await ctx.db.get(chat.workspaceId);
		if (!ws) throw new Error("Forbidden");
		const isOwner = ws.ownerId === user.clerkUserId;
		const isOrgMember =
			ws.organizationId !== null &&
			ws.organizationId !== undefined &&
			ws.organizationId === user.organizationId;
		if (!isOwner && !isOrgMember) throw new Error("Forbidden");

		return chat;
	},
});

/**
 * List recent chats for the current workspace (for command palette search).
 */
export const listRecent = query({
	args: {
		workspaceId: v.optional(v.id("workspaces")),
		limit: v.optional(v.number()),
	},
	returns: v.array(chatDoc),
	handler: async (ctx, { workspaceId, limit = 20 }) => {
		const user = await requireAuth(ctx).catch(() => null);
		if (!user) return [];

		// Use provided workspaceId or resolve default
		let wsId = workspaceId;
		if (wsId) {
			const ws = await ctx.db.get(wsId);
			if (!ws) return [];
			const isOwner = ws.ownerId === user.clerkUserId;
			const isOrgMember =
				ws.organizationId !== null &&
				ws.organizationId !== undefined &&
				ws.organizationId === user.organizationId;
			if (!isOwner && !isOrgMember) return [];
		}
		if (!wsId) {
			const ownedWs = await ctx.db
				.query("workspaces")
				.withIndex("by_owner_and_default", (q) =>
					q.eq("ownerId", user.clerkUserId).eq("isDefault", true),
				)
				.unique();
			wsId = ownedWs?._id;
			if (!wsId && user.organizationId) {
				const orgId = user.organizationId;
				const orgWs = await ctx.db
					.query("workspaces")
					.withIndex("by_organization", (q) => q.eq("organizationId", orgId))
					.first();
				wsId = orgWs?._id;
			}
		}

		if (!wsId) return [];

		const resolvedWsId = wsId;

		return await ctx.db
			.query("chats")
			.withIndex("by_workspace_created", (q) =>
				q.eq("workspaceId", resolvedWsId),
			)
			.order("desc")
			.take(limit);
	},
});

/**
 * List chats belonging to a specific project.
 */
export const listByProject = query({
	args: {
		projectId: v.id("projects"),
		limit: v.optional(v.number()),
	},
	returns: v.object({
		chats: v.array(chatDoc),
		hasMore: v.boolean(),
	}),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx).catch(() => null);
		if (!user) return { chats: [], hasMore: false };

		const project = await ctx.db.get(args.projectId);
		if (!project) return { chats: [], hasMore: false };

		// Validate workspace access before returning project chats
		const ws = await ctx.db.get(project.workspaceId);
		if (!ws) return { chats: [], hasMore: false };
		const isOwner = ws.ownerId === user.clerkUserId;
		const isOrgMember =
			ws.organizationId !== null &&
			ws.organizationId !== undefined &&
			ws.organizationId === user.organizationId;
		if (!isOwner && !isOrgMember) return { chats: [], hasMore: false };

		const limit = args.limit ?? 20;
		const results = await ctx.db
			.query("chats")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
			.order("desc")
			.take(limit + 1);

		const hasMore = results.length > limit;
		return { chats: hasMore ? results.slice(0, limit) : results, hasMore };
	},
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new chat.
 * H5 FIX: workspace ownership verified before insert — prevents creating chats
 * in another user's workspace.
 * Rate limit: 10 per minute per user.
 */
export const create = mutation({
	args: {
		workspaceId: v.id("workspaces"),
		title: v.string(),
		visibility: v.optional(
			v.union(v.literal("private"), v.literal("workspace")),
		),
		projectId: v.optional(v.id("projects")),
	},
	returns: v.id("chats"),
	handler: async (
		ctx,
		{ workspaceId, title, visibility = "private", projectId },
	) => {
		const user = await requireAuth(ctx);

		// D5: server-side length validation (v.string() has no maxLength)
		if (title.length > 200)
			throw new Error("Title must be 200 characters or less");

		// Rate limit: 10 chats per minute per user
		const { ok, retryAfter } = await rateLimiter.limit(ctx, "createChat", {
			key: user.clerkUserId,
		});
		if (!ok) {
			throw new Error(
				`Rate limit exceeded. Try again in ${Math.ceil((retryAfter ?? 60_000) / 1000)} seconds.`,
			);
		}

		// H5: workspace ownership verification — prevents cross-user workspace writes
		const ws = await ctx.db.get(workspaceId);
		if (!ws || ws.ownerId !== user.clerkUserId) {
			throw new Error("Forbidden");
		}

		return await ctx.db.insert("chats", {
			workspaceId,
			title,
			// createdBy stores Clerk user ID string — NOT Convex document ID
			createdBy: user.clerkUserId,
			visibility,
			projectId,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
	},
});

/**
 * Update a chat (title, visibility, isPinned).
 * H4 OWNERSHIP CHECK: createdBy is Clerk user ID, compare against identity.subject
 */
export const update = mutation({
	args: {
		id: v.id("chats"),
		title: v.optional(v.string()),
		visibility: v.optional(
			v.union(v.literal("private"), v.literal("workspace")),
		),
		isPinned: v.optional(v.boolean()),
	},
	returns: v.null(),
	handler: async (ctx, { id, ...updates }) => {
		const user = await requireAuth(ctx);

		const chat = await ctx.db.get(id);
		if (!chat) throw new Error("Chat not found");

		// H4 OWNERSHIP CHECK: createdBy is Clerk user ID, compare against user.clerkUserId
		if (chat.createdBy !== user.clerkUserId) {
			throw new Error("Forbidden");
		}

		await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
		return null;
	},
});

/**
 * Update selected AI model for a chat.
 * H4 OWNERSHIP CHECK: createdBy is Clerk user ID, compare against identity.subject
 */
export const updateSelectedModel = mutation({
	args: {
		id: v.id("chats"),
		selectedModel: v.string(),
	},
	returns: v.null(),
	handler: async (ctx, { id, selectedModel }) => {
		const user = await requireAuth(ctx);

		// D5: server-side length validation
		if (selectedModel.length > 100)
			throw new Error("Model name must be 100 characters or less");

		const chat = await ctx.db.get(id);
		if (!chat) throw new Error("Chat not found");

		// H4 OWNERSHIP CHECK: createdBy is Clerk user ID, compare against user.clerkUserId
		if (chat.createdBy !== user.clerkUserId) {
			throw new Error("Forbidden");
		}

		await ctx.db.patch(id, { selectedModel, updatedAt: Date.now() });
		return null;
	},
});

/**
 * Update enabled toolkits for a chat.
 * H4 OWNERSHIP CHECK: createdBy is Clerk user ID, compare against identity.subject
 */
export const updateEnabledToolkits = mutation({
	args: {
		id: v.id("chats"),
		enabledToolkits: v.array(
			v.object({
				slug: v.string(),
				isConnected: v.boolean(),
			}),
		),
	},
	returns: v.null(),
	handler: async (ctx, { id, enabledToolkits }) => {
		const user = await requireAuth(ctx);

		const chat = await ctx.db.get(id);
		if (!chat) throw new Error("Chat not found");

		// H4 OWNERSHIP CHECK: createdBy is Clerk user ID, compare against user.clerkUserId
		if (chat.createdBy !== user.clerkUserId) {
			throw new Error("Forbidden");
		}

		await ctx.db.patch(id, { enabledToolkits, updatedAt: Date.now() });
		return null;
	},
});

/**
 * Delete a chat and all its messages.
 * H4 OWNERSHIP CHECK: createdBy is Clerk user ID, compare against identity.subject
 * Audit log inserted BEFORE destructive operation (S5).
 */
export const remove = mutation({
	args: { id: v.id("chats") },
	returns: v.object({ success: v.boolean() }),
	handler: async (ctx, { id }) => {
		const user = await requireAuth(ctx);

		const chat = await ctx.db.get(id);
		if (!chat) throw new Error("Chat not found");

		// H4 OWNERSHIP CHECK: createdBy is Clerk user ID, compare against user.clerkUserId
		if (chat.createdBy !== user.clerkUserId) {
			throw new Error("Forbidden");
		}

		// Fetch workspace for audit log (organizationId required by activities table)
		const workspace = await ctx.db.get(chat.workspaceId);
		if (!workspace) throw new Error("Workspace not found");

		// Collect messages before delete (needed for audit log count)
		// D2: by_chat removed from schema — use by_chat_created (superset index)
		const messages = await ctx.db
			.query("messages")
			.withIndex("by_chat_created", (q) => q.eq("chatId", id))
			.collect();

		const messageCount = messages.length;

		// S5: Audit log — insert BEFORE destructive operation (transactional rollback on failure)
		await ctx.db.insert("activities", {
			organizationId: workspace.organizationId,
			userId: user.clerkUserId,
			type: "chat_deleted",
			title: chat.title,
			description: `Chat deleted (${messageCount} messages)`,
			metadata: { chatId: id, messageCount },
			createdAt: Date.now(),
		});

		// Cascade delete: for chats with <500 messages this is safe within Convex's
		// mutation time limit. For larger chats, migrate to a scheduled batch delete
		// via ctx.scheduler.runAfter(0, internal.messages.batchDelete, { chatId }).
		for (const message of messages) {
			await ctx.db.delete(message._id);
		}

		await ctx.db.delete(id);

		return { success: true };
	},
});
