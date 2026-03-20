/**
 * Agent Memory — Convex Backend
 *
 * Virtual file system for AI agent memory.
 * Implements the storage backend for Anthropic's memory_20250818 tool protocol.
 *
 * Virtual path layout:
 *   /memories/core.md           → type: 'core', injected every agent turn
 *   /memories/notes.md          → type: 'notes', archival
 *   /memories/preferences.md    → type: 'preference', persistent user state
 *
 * Memory is scoped per (userId, workspaceId).
 *
 * Usage pattern (in HTTP action):
 *   const coreMemory = await ctx.runQuery(internal.memory.getCoreMemory, { userId });
 *   // inject into agent instructions via prepareCall
 */

import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import {
	internalMutation,
	internalQuery,
	mutation,
	query,
} from "./_generated/server";

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get a memory file by path — implements the 'view' command of the memory tool.
 * Returns null if no file exists at that path.
 */
export const getFile = internalQuery({
	args: {
		userId: v.string(),
		workspaceId: v.optional(v.id("workspaces")),
		path: v.string(),
	},
	returns: v.union(
		v.object({
			_id: v.id("agentMemory"),
			userId: v.string(),
			workspaceId: v.optional(v.id("workspaces")),
			path: v.string(),
			content: v.string(),
			memoryType: v.union(
				v.literal("core"),
				v.literal("notes"),
				v.literal("preference"),
			),
			createdAt: v.number(),
			updatedAt: v.number(),
		}),
		v.null(),
	),
	handler: async (ctx, { userId, path }) => {
		return await ctx.db
			.query("agentMemory")
			.withIndex("by_user_and_path", (q) =>
				q.eq("userId", userId).eq("path", path),
			)
			.first();
	},
});

/**
 * Get the core memory content for a user — called in prepareCall before each agent turn.
 * Returns empty string if no core memory exists yet.
 */
export const getCoreMemory = internalQuery({
	args: {
		userId: v.string(),
		workspaceId: v.optional(v.id("workspaces")),
	},
	returns: v.string(),
	handler: async (ctx, { userId }) => {
		const record = await ctx.db
			.query("agentMemory")
			.withIndex("by_user_and_path", (q) =>
				q.eq("userId", userId).eq("path", "/memories/core.md"),
			)
			.first();
		return record?.content ?? "";
	},
});

/**
 * List all memory files for a user — useful for UI display.
 */
export const listMemories = query({
	args: {
		workspaceId: v.optional(v.id("workspaces")),
	},
	returns: v.array(
		v.object({
			_id: v.id("agentMemory"),
			userId: v.string(),
			workspaceId: v.optional(v.id("workspaces")),
			path: v.string(),
			content: v.string(),
			memoryType: v.union(
				v.literal("core"),
				v.literal("notes"),
				v.literal("preference"),
			),
			createdAt: v.number(),
			updatedAt: v.number(),
		}),
	),
	handler: async (ctx, { workspaceId: _workspaceId }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return [];
		return await ctx.db
			.query("agentMemory")
			.withIndex("by_user", (q) => q.eq("userId", identity.subject))
			.collect();
	},
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new memory file — implements the 'create' command.
 * Upserts: if a file already exists at that path, it is replaced.
 */
export const createMemory = internalMutation({
	args: {
		userId: v.string(),
		workspaceId: v.optional(v.id("workspaces")),
		path: v.string(),
		content: v.string(),
		memoryType: v.union(
			v.literal("core"),
			v.literal("notes"),
			v.literal("preference"),
		),
	},
	returns: v.id("agentMemory"),
	handler: async (ctx, { userId, workspaceId, path, content, memoryType }) => {
		const now = Date.now();
		const existing = await ctx.db
			.query("agentMemory")
			.withIndex("by_user_and_path", (q) =>
				q.eq("userId", userId).eq("path", path),
			)
			.first();

		if (existing) {
			await ctx.db.patch(existing._id, { content, memoryType, updatedAt: now });
			return existing._id;
		}

		return await ctx.db.insert("agentMemory", {
			userId,
			workspaceId,
			path,
			content,
			memoryType,
			createdAt: now,
			updatedAt: now,
		});
	},
});

/**
 * Read a memory file — public query for authenticated users.
 * Returns null if no file exists at path.
 */
export const readMemory = query({
	args: {
		path: v.string(),
		workspaceId: v.optional(v.id("workspaces")),
	},
	returns: v.union(v.string(), v.null()),
	handler: async (ctx, { path }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;
		const record = await ctx.db
			.query("agentMemory")
			.withIndex("by_user_and_path", (q) =>
				q.eq("userId", identity.subject).eq("path", path),
			)
			.first();
		return record?.content ?? null;
	},
});

/**
 * Replace a substring in a memory file — implements the 'str_replace' command.
 * Throws if file not found or oldStr not present.
 */
export const replaceInMemory = internalMutation({
	args: {
		userId: v.string(),
		path: v.string(),
		oldStr: v.string(),
		newStr: v.string(),
	},
	returns: v.null(),
	handler: async (ctx, { userId, path, oldStr, newStr }) => {
		const record = await ctx.db
			.query("agentMemory")
			.withIndex("by_user_and_path", (q) =>
				q.eq("userId", userId).eq("path", path),
			)
			.first();
		if (!record) throw new Error(`Memory file not found: ${path}`);
		if (!record.content.includes(oldStr)) {
			throw new Error(`String not found in ${path}: "${oldStr}"`);
		}
		await ctx.db.patch(record._id, {
			content: record.content.replace(oldStr, newStr),
			updatedAt: Date.now(),
		});
		return null;
	},
});

/**
 * Search memory files — full-text search over content.
 * Runs in-memory filter (no vector search — memories are small by design).
 */
export const searchMemory = internalQuery({
	args: {
		userId: v.string(),
		query: v.string(),
	},
	returns: v.array(
		v.object({
			path: v.string(),
			content: v.string(),
			memoryType: v.union(
				v.literal("core"),
				v.literal("notes"),
				v.literal("preference"),
			),
		}),
	),
	handler: async (ctx, { userId, query }) => {
		const memories = await ctx.db
			.query("agentMemory")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.collect();
		const lowerQuery = query.toLowerCase();
		return memories
			.filter((m) => m.content.toLowerCase().includes(lowerQuery))
			.map((m) => ({
				path: m.path,
				content: m.content,
				memoryType: m.memoryType,
			}));
	},
});

/**
 * Delete a memory file — implements the 'delete' command.
 */
export const deleteMemory = internalMutation({
	args: {
		userId: v.string(),
		path: v.string(),
	},
	returns: v.null(),
	handler: async (ctx, { userId, path }) => {
		const record = await ctx.db
			.query("agentMemory")
			.withIndex("by_user_and_path", (q) =>
				q.eq("userId", userId).eq("path", path),
			)
			.first();
		if (!record) throw new Error(`Memory file not found: ${path}`);
		await ctx.db.delete(record._id);
		return null;
	},
});

/**
 * Delete all memories for a user — admin/reset use case.
 */
export const deleteAllMemories = mutation({
	args: {},
	returns: v.null(),
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Unauthenticated");
		const memories = await ctx.db
			.query("agentMemory")
			.withIndex("by_user", (q) => q.eq("userId", identity.subject))
			.collect();
		await Promise.all(memories.map((m) => ctx.db.delete(m._id)));
		return null;
	},
});
