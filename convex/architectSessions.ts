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
import type { Doc } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { requireAuth, requireAuthWithWorkspace } from "./lib/auth";
import { deriveTitleFromContent } from "./lib/titles";

/**
 * Resolves the display title a READER should see for a session, without
 * writing anything back.
 *
 * Why read-time rather than another write-time catch-up: the name is
 * DERIVABLE from data already on hand — the linked mission's name, or the
 * session's own first message — so a stored copy was never the source of
 * truth to begin with. This also reaches the population a write-time catch-up
 * cannot: a session already `completed`, with `existingMissionId` set, that
 * will never receive another `addMessage` call. `title` on the row itself
 * stays absent (nobody named it, and we never patch from a query — Convex
 * queries are read-only) — this function's return value is what the UI
 * shows, and it is recomputed on every read rather than persisted.
 */
async function resolveDisplayTitle(
	ctx: QueryCtx,
	session: Doc<"architectSessions">,
): Promise<string | undefined> {
	if (session.title) return session.title;

	if (session.existingMissionId) {
		const mission = await ctx.db.get(session.existingMissionId);
		if (mission) return mission.name;
	}

	const firstMessage = await ctx.db
		.query("architectMessages")
		.withIndex("by_session_created", (q) => q.eq("sessionId", session._id))
		.order("asc")
		.take(1);
	if (firstMessage.length > 0 && firstMessage[0].role === "user") {
		const derived = deriveTitleFromContent(firstMessage[0].content);
		if (derived.length > 0) return derived;
	}

	return undefined;
}

// ============================================================================
// MUTATIONS
// ============================================================================

export const create = mutation({
	args: {
		workspaceId: v.id("workspaces"),
		existingMissionId: v.optional(v.id("missions")),
		title: v.optional(v.string()),
	},
	returns: v.id("architectSessions"),
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
	returns: v.id("architectMessages"),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);

		const session = await ctx.db.get(args.sessionId);
		if (!session) throw new Error("Session not found");

		await requireAuthWithWorkspace(ctx, session.workspaceId);

		if (session.createdBy !== user.clerkUserId) {
			throw new Error("Not authorized to modify this session");
		}

		// Auto-title: derive the session's display name from its own first user
		// message, unless the user has already renamed it (isTitleCustom).
		//
		// Gate is `!session.title` (does this session have a name yet?), NOT
		// "is this the first message?" — the earlier gate
		// (`priorMessages.length === 0`) only ever fired at the literal first
		// message, so any session that already had a message when this
		// mechanism shipped could never be named again: no title, no second
		// chance. Catch-up trade-off taken here: fire on the session's NEXT
		// write rather than (a) a migration, which would touch rows nobody
		// may ever open again, or (b) an on-open patch, which is impossible
		// from a query (Convex queries are read-only) and would need a
		// parallel mutation wired into every read path.
		let titlePatch: { title: string } | undefined;
		if (!session.title && !session.isTitleCustom) {
			const priorMessages = await ctx.db
				.query("architectMessages")
				.withIndex("by_session_created", (q) =>
					q.eq("sessionId", args.sessionId),
				)
				.order("asc")
				.take(1);
			// Prefer the session's own FIRST message as the naming source; fall
			// back to the message being saved now when there is no prior one
			// (the brand-new-session case).
			const sourceContent =
				priorMessages.length > 0
					? priorMessages[0].role === "user"
						? priorMessages[0].content
						: undefined
					: args.role === "user"
						? args.content
						: undefined;
			if (sourceContent) {
				const derived = deriveTitleFromContent(sourceContent);
				if (derived.length > 0) {
					titlePatch = { title: derived };
				}
			}
		}

		const messageId = await ctx.db.insert("architectMessages", {
			sessionId: args.sessionId,
			role: args.role,
			content: args.content,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		await ctx.db.patch(args.sessionId, {
			updatedAt: Date.now(),
			...titlePatch,
		});

		return messageId;
	},
});

export const complete = mutation({
	args: {
		sessionId: v.id("architectSessions"),
		missionId: v.optional(v.id("missions")),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const session = await ctx.db.get(args.sessionId);
		if (!session) throw new Error("Session not found");
		if (session.createdBy !== user.clerkUserId) throw new Error("Unauthorized");
		await requireAuthWithWorkspace(ctx, session.workspaceId);

		// A session that produces a mission takes the mission's name — unless
		// the user already renamed the session (isTitleCustom), which must
		// survive untouched, exactly like the first-exchange auto-title.
		let titlePatch: { title: string } | undefined;
		if (args.missionId && !session.isTitleCustom) {
			const mission = await ctx.db.get(args.missionId);
			if (mission) {
				titlePatch = { title: mission.name };
			}
		}

		await ctx.db.patch(args.sessionId, {
			status: "completed",
			existingMissionId: args.missionId ?? session.existingMissionId,
			updatedAt: Date.now(),
			...titlePatch,
		});
		return null;
	},
});

export const updateTitle = mutation({
	args: {
		sessionId: v.id("architectSessions"),
		title: v.string(),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const session = await ctx.db.get(args.sessionId);
		if (!session) throw new Error("Session not found");
		if (session.createdBy !== user.clerkUserId) throw new Error("Unauthorized");
		await requireAuthWithWorkspace(ctx, session.workspaceId);

		// An explicit rename is the user naming the session — recorded in the
		// data (isTitleCustom), never left implicit in call order, so the
		// auto-title mechanism never overwrites it again.
		await ctx.db.patch(args.sessionId, {
			title: args.title,
			isTitleCustom: true,
			updatedAt: Date.now(),
		});
		return null;
	},
});

export const remove = mutation({
	args: { sessionId: v.id("architectSessions") },
	returns: v.null(),
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
		return null;
	},
});

// ============================================================================
// QUERIES
// ============================================================================

const sessionDoc = v.object({
	_id: v.id("architectSessions"),
	_creationTime: v.number(),
	workspaceId: v.id("workspaces"),
	status: v.union(
		v.literal("active"),
		v.literal("completed"),
		v.literal("abandoned"),
	),
	existingMissionId: v.optional(v.id("missions")),
	missionContext: v.optional(
		v.object({
			missionId: v.string(),
			missionName: v.string(),
			missionBrief: v.optional(v.string()),
		}),
	),
	createdBy: v.string(),
	title: v.optional(v.string()),
	isTitleCustom: v.optional(v.boolean()),
	createdAt: v.number(),
	updatedAt: v.number(),
});

export const get = query({
	args: { sessionId: v.id("architectSessions") },
	returns: v.union(sessionDoc, v.null()),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const session = await ctx.db.get(args.sessionId);
		if (!session) return null;

		// Verify ownership
		if (session.createdBy !== identity.subject) return null;

		const title = await resolveDisplayTitle(ctx, session);
		return { ...session, title };
	},
});

export const getMessages = query({
	args: { sessionId: v.id("architectSessions") },
	returns: v.array(
		v.object({
			role: v.union(v.literal("user"), v.literal("assistant")),
			content: v.string(),
		}),
	),
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
	returns: v.object({
		sessions: v.array(sessionDoc),
		hasMore: v.boolean(),
	}),
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
		const page = hasMore ? sessions.slice(0, limit) : sessions;

		// Resolve a display title for every row, including dormant/completed
		// sessions the write-time catch-up in addMessage/complete can never
		// reach again — see resolveDisplayTitle for the derivation and why it
		// is not persisted.
		const sessionsWithTitle = await Promise.all(
			page.map(async (session) => ({
				...session,
				title: await resolveDisplayTitle(ctx, session),
			})),
		);

		return {
			sessions: sessionsWithTitle,
			hasMore,
		};
	},
});
