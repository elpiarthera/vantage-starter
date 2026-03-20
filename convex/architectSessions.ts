/**
 * Architect Sessions — create, get, addMessage, listRecent, complete
 *
 * Ported from vantage-studio/convex/architectSessions.ts.
 * Auth adaptation (Phase 0.5):
 *   - clerkId → clerkUserId
 *   - projectId removed — projects table is post-MVP
 *   - validateWorkspaceAccess → requireAuthWithWorkspace
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth, requireAuthWithWorkspace } from "./lib/auth";

// ============================================================================
// MUTATIONS
// ============================================================================

export const create = mutation({
	args: {
		workspaceId: v.id("workspaces"),
		existingMissionId: v.optional(v.id("missions")),
		title: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		await requireAuthWithWorkspace(ctx, args.workspaceId);

		let missionContext:
			| { missionId: string; missionName: string; missionBrief?: string }
			| undefined;

		if (args.existingMissionId) {
			const mission = await ctx.db.get(args.existingMissionId);
			if (mission && mission.workspaceId === args.workspaceId) {
				missionContext = {
					missionId: args.existingMissionId,
					missionName: mission.name,
					missionBrief: mission.brief,
				};
			}
		}

		const sessionId = await ctx.db.insert("architectSessions", {
			workspaceId: args.workspaceId,
			createdBy: user.clerkUserId,
			status: "active",
			existingMissionId: args.existingMissionId,
			missionContext,
			title: args.title,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		return sessionId;
	},
});

export const addMessage = mutation({
	args: {
		sessionId: v.id("architectSessions"),
		role: v.union(v.literal("user"), v.literal("assistant")),
		content: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);

		const session = await ctx.db.get(args.sessionId);
		if (!session) throw new Error("Session not found");

		await requireAuthWithWorkspace(ctx, session.workspaceId);

		if (session.createdBy !== user.clerkUserId) {
			throw new Error("Not authorized to modify this session");
		}

		const messageId = await ctx.db.insert("architectMessages", {
			sessionId: args.sessionId,
			role: args.role,
			content: args.content,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		await ctx.db.patch(args.sessionId, { updatedAt: Date.now() });

		return messageId;
	},
});

export const complete = mutation({
	args: {
		sessionId: v.id("architectSessions"),
		missionId: v.optional(v.id("missions")),
	},
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const session = await ctx.db.get(args.sessionId);
		if (!session) throw new Error("Session not found");
		if (session.createdBy !== user.clerkUserId) throw new Error("Unauthorized");
		await requireAuthWithWorkspace(ctx, session.workspaceId);

		await ctx.db.patch(args.sessionId, {
			status: "completed",
			existingMissionId: args.missionId ?? session.existingMissionId,
			updatedAt: Date.now(),
		});
	},
});

export const updateTitle = mutation({
	args: {
		sessionId: v.id("architectSessions"),
		title: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const session = await ctx.db.get(args.sessionId);
		if (!session) throw new Error("Session not found");
		if (session.createdBy !== user.clerkUserId) throw new Error("Unauthorized");
		await requireAuthWithWorkspace(ctx, session.workspaceId);

		await ctx.db.patch(args.sessionId, {
			title: args.title,
			updatedAt: Date.now(),
		});
	},
});

export const remove = mutation({
	args: { sessionId: v.id("architectSessions") },
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const session = await ctx.db.get(args.sessionId);
		if (!session) throw new Error("Session not found");
		if (session.createdBy !== user.clerkUserId) throw new Error("Unauthorized");
		await requireAuthWithWorkspace(ctx, session.workspaceId);

		// Delete messages first
		const messages = await ctx.db
			.query("architectMessages")
			.withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
			.collect();
		await Promise.all(messages.map((m) => ctx.db.delete(m._id)));

		await ctx.db.delete(args.sessionId);
	},
});

// ============================================================================
// QUERIES
// ============================================================================

export const get = query({
	args: { sessionId: v.id("architectSessions") },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const session = await ctx.db.get(args.sessionId);
		if (!session) return null;

		// Verify ownership
		if (session.createdBy !== identity.subject) return null;

		return session;
	},
});

export const getMessages = query({
	args: { sessionId: v.id("architectSessions") },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return [];

		const session = await ctx.db.get(args.sessionId);
		if (!session || session.createdBy !== identity.subject) return [];

		const messages = await ctx.db
			.query("architectMessages")
			.withIndex("by_session_created", (q) => q.eq("sessionId", args.sessionId))
			.order("asc")
			.collect();

		return messages.map((m) => ({ role: m.role, content: m.content }));
	},
});

export const listRecent = query({
	args: {
		workspaceId: v.id("workspaces"),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return { sessions: [], hasMore: false };

		const limit = args.limit ?? 30;

		const sessions = await ctx.db
			.query("architectSessions")
			.withIndex("by_workspace_created", (q) =>
				q.eq("workspaceId", args.workspaceId),
			)
			.filter((q) => q.eq(q.field("createdBy"), identity.subject))
			.order("desc")
			.take(limit + 1);

		const hasMore = sessions.length > limit;
		return {
			sessions: hasMore ? sessions.slice(0, limit) : sessions,
			hasMore,
		};
	},
});
