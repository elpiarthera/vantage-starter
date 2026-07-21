/**
 * Message management functions
 *
 * Ported from vantage-studio/convex/messages.ts.
 * Auth adapter applied: by_clerk_id → by_clerk_user_id, clerkId → clerkUserId.
 * Votes cascade stripped from deleteAfterTimestamp (no votes table in starter).
 * Workspace access is granted via `requireAuthWithWorkspace` (owner OR org
 * member — see convex/lib/auth.ts), the same helper used by agents.ts,
 * architectSessions.ts, checkpoints.ts, consultantProjects.ts, missions.ts,
 * operations.ts, projects.ts, and skills.ts. No separate workspaceMembers
 * table exists or is needed — membership is `workspace.organizationId ===
 * user.organizationId`.
 *
 * Security fixes applied (per MIGRATION-PLAN.md):
 * - B3: getById — ownership chain check added
 * - H6: update — chat ownership check added
 *
 * Internal mutations are exempt from rate limiting — called by trusted
 * server-side actions only (not by clients).
 */

import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireAuth, requireAuthWithWorkspace } from "./lib/auth";
import { deriveTitleFromContent } from "./lib/titles";
import { rateLimiter } from "./ratelimit";

/**
 * `list` is a query that must degrade to `[]` on any refusal (unauthenticated,
 * missing row, no workspace access) rather than throw — same non-throwing
 * contract as agents.ts's `getUserWorkspace` helper. `requireAuthWithWorkspace`
 * throws by design (mutations/getById want a hard failure), so this wraps it
 * and swallows exactly the "no access" case into `null`, preserving `list`'s
 * existing return-shape contract with its callers.
 */
async function hasWorkspaceAccess(
	ctx: QueryCtx,
	workspaceId: Id<"workspaces">,
): Promise<boolean> {
	try {
		await requireAuthWithWorkspace(ctx, workspaceId);
		return true;
	} catch {
		return false;
	}
}

// Tool call schema for reuse.
//
// AI SDK v6 shape emitted by streamText (for reference):
//   { toolCallId: string, toolName: string, args: unknown }  ← tool-call step
//   { toolCallId: string, toolName: string, result: unknown } ← tool-result step
//
// Mapping to our schema:
//   id        = toolCallId  (renamed for brevity; callers must map toolCallId → id)
//   toolName  = toolName    ✓ exact match
//   args      = args        ✓ exact match
//   result    = result      ✓ exact match (optional — absent until result arrives)
//   status    — NOT emitted by AI SDK v6; must be set client-side:
//               "pending"  when saving the tool-call step
//               "success"  when saving the tool-result step (no error thrown)
//               "error"    when saving the tool-result step with an error result
const toolCallSchema = v.object({
	id: v.string(),
	toolName: v.string(),
	// v.any() justified — tool args are user-defined JSON schemas, cannot type-check
	// TODO Phase 5: generate per-tool validators from the tool registry
	args: v.any(),
	// v.any() justified — tool results are user-defined, same reasoning as args
	// TODO Phase 5: generate per-tool result validators from the tool registry
	result: v.optional(v.any()),
	// status is NOT emitted by AI SDK v6 — callers must derive it client-side
	// (see comment block above for the mapping)
	status: v.union(
		v.literal("pending"),
		v.literal("success"),
		v.literal("error"),
	),
});

// D1: Typed document validator for the messages table.
// Includes _id and _creationTime (system fields added by Convex to every document).
// parts, attachments, toolCalls.args, toolCalls.result remain v.any() — justified
// in schema.ts comments (AI SDK v6 shapes, provider-controlled, Phase 5 TODO).
const messageDoc = v.object({
	_id: v.id("messages"),
	_creationTime: v.number(),
	chatId: v.id("chats"),
	role: v.union(v.literal("user"), v.literal("assistant")),
	content: v.string(),
	parts: v.optional(v.any()),
	attachments: v.optional(v.any()),
	toolCalls: v.optional(v.array(toolCallSchema)),
	createdAt: v.number(),
});

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get all messages for a chat, ordered by creation time (ascending).
 * Validates workspace access (owner OR org member) before returning data.
 */
export const list = query({
	args: { chatId: v.id("chats") },
	returns: v.array(messageDoc),
	handler: async (ctx, { chatId }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return [];

		const chat = await ctx.db.get(chatId);
		if (!chat) return [];

		// Workspace access check (owner or org member) — see hasWorkspaceAccess.
		if (!(await hasWorkspaceAccess(ctx, chat.workspaceId))) return [];

		return await ctx.db
			.query("messages")
			.withIndex("by_chat_created", (q) => q.eq("chatId", chatId))
			.order("asc")
			.collect();
	},
});

/**
 * Get a single message by ID.
 * B3 FIX: ownership chain added — without this, any authenticated user can
 * fetch any message by ID.
 */
export const getById = query({
	args: { id: v.id("messages") },
	returns: v.union(messageDoc, v.null()),
	handler: async (ctx, { id }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const message = await ctx.db.get(id);
		if (!message) return null;

		// B3: resolve ownership chain — message → chat → workspace
		const chat = await ctx.db.get(message.chatId);
		if (!chat) throw new Error("Forbidden");

		// Workspace access check (owner or org member) — requireAuthWithWorkspace
		// throws, which matches this query's existing throw-on-refusal contract.
		await requireAuthWithWorkspace(ctx, chat.workspaceId);

		return message;
	},
});

// ============================================================================
// MUTATIONS (Authenticated)
// ============================================================================

/**
 * Save a message (user or assistant).
 * Validates workspace access (owner OR org member) before writing.
 * Rate limit: 30 per minute per user.
 */
export const save = mutation({
	args: {
		chatId: v.id("chats"),
		role: v.union(v.literal("user"), v.literal("assistant")),
		content: v.string(),
		parts: v.optional(v.any()),
		attachments: v.optional(v.any()),
		toolCalls: v.optional(v.array(toolCallSchema)),
	},
	returns: v.id("messages"),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);

		// D5: server-side length validation (v.string() has no maxLength)
		if (args.content.length > 100_000)
			throw new Error("Message content must be 100,000 characters or less");

		// Rate limit: 30 messages per minute per user
		const { ok, retryAfter } = await rateLimiter.limit(ctx, "saveMessage", {
			key: user.clerkUserId,
		});
		if (!ok) {
			throw new Error(
				`Rate limit exceeded. Try again in ${Math.ceil((retryAfter ?? 60_000) / 1000)} seconds.`,
			);
		}

		const chat = await ctx.db.get(args.chatId);
		if (!chat) throw new Error("Chat not found");

		// Workspace access check (owner or org member) — see requireAuthWithWorkspace.
		await requireAuthWithWorkspace(ctx, chat.workspaceId);

		// Auto-title: derive the chat's display name from its own first user
		// message, unless the user has already renamed it (isTitleCustom).
		//
		// Gate is `!chat.title` (does this chat have a name yet?), NOT "is this
		// the first message?" — same class as architectSessions.addMessage:
		// the earlier gate (`priorMessages.length === 0`) only fired at the
		// literal first message, so a chat that already had a message when
		// this mechanism shipped could never be named. Catch-up fires on the
		// chat's NEXT write (see architectSessions.ts for the full trade-off
		// note against a migration or an on-open patch).
		let titlePatch: { title: string } | undefined;
		if (!chat.title && !chat.isTitleCustom) {
			const priorMessages = await ctx.db
				.query("messages")
				.withIndex("by_chat_created", (q) => q.eq("chatId", args.chatId))
				.order("asc")
				.take(1);
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

		const messageId = await ctx.db.insert("messages", {
			chatId: args.chatId,
			role: args.role,
			content: args.content,
			parts: args.parts,
			attachments: args.attachments,
			toolCalls: args.toolCalls,
			createdAt: Date.now(),
		});

		// Update chat's updatedAt (and auto-title, if derived above)
		await ctx.db.patch(args.chatId, {
			updatedAt: Date.now(),
			...titlePatch,
		});

		return messageId;
	},
});

/**
 * Update a message (for streaming updates).
 * H6 FIX: chat ownership check added — source omits it.
 * Rate limit: 60 per minute per user.
 */
export const update = mutation({
	args: {
		id: v.id("messages"),
		content: v.optional(v.string()),
		parts: v.optional(v.any()),
		toolCalls: v.optional(v.array(toolCallSchema)),
	},
	returns: v.id("messages"),
	handler: async (ctx, { id, ...updates }) => {
		const user = await requireAuth(ctx);

		// D5: server-side length validation (v.string() has no maxLength)
		if (updates.content && updates.content.length > 100_000)
			throw new Error("Message content must be 100,000 characters or less");

		// Rate limit: 60 message updates per minute per user
		const { ok, retryAfter } = await rateLimiter.limit(ctx, "updateMessage", {
			key: user.clerkUserId,
		});
		if (!ok) {
			throw new Error(
				`Rate limit exceeded. Try again in ${Math.ceil((retryAfter ?? 60_000) / 1000)} seconds.`,
			);
		}

		const message = await ctx.db.get(id);
		if (!message) throw new Error("Message not found");

		// H6: chat ownership check — prevents editing messages in other users' chats
		const chat = await ctx.db.get(message.chatId);
		if (!chat) throw new Error("Chat not found");

		if (chat.createdBy !== user.clerkUserId) {
			throw new Error("Forbidden");
		}

		await ctx.db.patch(id, updates);
		return id;
	},
});

/**
 * Delete messages after a timestamp (for regeneration).
 * Votes cascade stripped — no votes table in vantage-starter.
 * Validates workspace access (owner OR org member) before deleting.
 */
export const deleteAfterTimestamp = mutation({
	args: {
		chatId: v.id("chats"),
		timestamp: v.number(),
	},
	returns: v.object({ deleted: v.number() }),
	handler: async (ctx, { chatId, timestamp }) => {
		const chat = await ctx.db.get(chatId);
		if (!chat) throw new Error("Chat not found");

		// Workspace access check (owner or org member) — see requireAuthWithWorkspace.
		// requireAuthWithWorkspace covers requireAuth internally (throws if
		// unauthenticated), so no separate requireAuth call is needed here.
		await requireAuthWithWorkspace(ctx, chat.workspaceId);

		const messages = await ctx.db
			.query("messages")
			.withIndex("by_chat_created", (q) => q.eq("chatId", chatId))
			.filter((q) => q.gte(q.field("createdAt"), timestamp))
			.collect();

		// Votes cascade stripped — no votes table in vantage-starter
		for (const message of messages) {
			await ctx.db.delete(message._id);
		}

		return { deleted: messages.length };
	},
});

// ============================================================================
// INTERNAL MUTATIONS (For API Route — bypasses auth, rate limit exempt)
// ============================================================================

/**
 * Internal mutation for API route to save messages.
 * Bypasses auth check — API route verified user identity before calling.
 * Rate limit exempt — trusted server-side caller only.
 */
export const saveSystem = internalMutation({
	args: {
		chatId: v.id("chats"),
		role: v.union(v.literal("user"), v.literal("assistant")),
		content: v.string(),
		parts: v.optional(v.any()),
		attachments: v.optional(v.any()),
		toolCalls: v.optional(v.array(toolCallSchema)),
	},
	returns: v.id("messages"),
	handler: async (ctx, args) => {
		// Direct DB insert — API route verified identity before calling this
		const messageId = await ctx.db.insert("messages", {
			chatId: args.chatId,
			role: args.role,
			content: args.content,
			parts: args.parts,
			attachments: args.attachments,
			toolCalls: args.toolCalls,
			createdAt: Date.now(),
		});

		// Update chat's updatedAt
		await ctx.db.patch(args.chatId, { updatedAt: Date.now() });

		return messageId;
	},
});

/**
 * Internal mutation to create a chat from API route.
 * createdBy accepts Clerk user ID string for vantage-starter compatibility.
 * Rate limit exempt — trusted server-side caller only.
 */
export const createChatSystem = internalMutation({
	args: {
		title: v.string(),
		workspaceId: v.id("workspaces"),
		createdBy: v.string(), // Clerk user ID string in vantage-starter
		visibility: v.union(v.literal("private"), v.literal("workspace")),
	},
	returns: v.id("chats"),
	handler: async (ctx, args) => {
		return await ctx.db.insert("chats", {
			title: args.title,
			workspaceId: args.workspaceId,
			// createdBy stores Clerk user ID string — NOT Convex document ID
			createdBy: args.createdBy,
			visibility: args.visibility,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
	},
});

/**
 * Internal mutation to get or create a chat for streaming.
 * Rate limit exempt — trusted server-side caller only.
 */
export const getOrCreateChatSystem = internalMutation({
	args: {
		chatId: v.optional(v.id("chats")),
		title: v.string(),
		workspaceId: v.id("workspaces"),
		createdBy: v.string(), // Clerk user ID string in vantage-starter
		visibility: v.union(v.literal("private"), v.literal("workspace")),
	},
	returns: v.id("chats"),
	handler: async (ctx, args) => {
		if (args.chatId) {
			const existing = await ctx.db.get(args.chatId);
			if (existing) return args.chatId;
		}

		return await ctx.db.insert("chats", {
			title: args.title,
			workspaceId: args.workspaceId,
			// createdBy stores Clerk user ID string — NOT Convex document ID
			createdBy: args.createdBy,
			visibility: args.visibility,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
	},
});
