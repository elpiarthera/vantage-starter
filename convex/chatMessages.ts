import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Create a new chat message
 */
export const create = mutation({
	args: {
		projectId: v.string(), // Generic project/thread ID
		role: v.union(
			v.literal("user"),
			v.literal("assistant"),
			v.literal("system"),
		),
		content: v.string(),
		context: v.number(), // Generic context/thread identifier (renamed from `step`)
		metadata: v.optional(
			v.object({
				model: v.optional(v.string()),
				tokens: v.optional(v.number()),
				latency: v.optional(v.number()),
				context: v.optional(v.any()),
			}),
		),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();

		if (!user) {
			throw new Error("User not found");
		}

		const now = Date.now();

		const messageId = await ctx.db.insert("chatMessages", {
			organizationId: user.organizationId || "",
			projectId: args.projectId,
			userId: identity.subject,
			role: args.role,
			content: args.content,
			context: args.context,
			metadata: args.metadata || {
				model: undefined,
				tokens: undefined,
				latency: undefined,
				context: undefined,
			},
			createdAt: now,
			updatedAt: now,
		});

		return messageId;
	},
});

/**
 * List all chat messages for a project and optional context
 */
export const list = query({
	args: {
		projectId: v.string(),
		context: v.optional(v.number()),
	},
	handler: async (ctx, { projectId, context }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return [];
		}

		if (context !== undefined) {
			const messages = await ctx.db
				.query("chatMessages")
				.withIndex("by_project_and_context", (q) =>
					q.eq("projectId", projectId).eq("context", context),
				)
				.collect();

			return messages.sort((a, b) => a.createdAt - b.createdAt);
		}

		const messages = await ctx.db
			.query("chatMessages")
			.withIndex("by_project", (q) => q.eq("projectId", projectId))
			.collect();

		return messages.sort((a, b) => a.createdAt - b.createdAt);
	},
});

/**
 * Delete a chat message
 */
export const remove = mutation({
	args: { messageId: v.id("chatMessages") },
	handler: async (ctx, { messageId }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const message = await ctx.db.get(messageId);
		if (!message) {
			throw new Error("Message not found");
		}

		if (message.userId !== identity.subject) {
			throw new Error("Unauthorized - you don't own this message");
		}

		await ctx.db.delete(messageId);

		return { success: true };
	},
});

/**
 * Update message content
 */
export const updateContent = mutation({
	args: {
		messageId: v.id("chatMessages"),
		content: v.string(),
	},
	handler: async (ctx, { messageId, content }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const message = await ctx.db.get(messageId);
		if (!message) {
			throw new Error("Message not found");
		}

		if (message.userId !== identity.subject) {
			throw new Error("Unauthorized - you don't own this message");
		}

		await ctx.db.patch(messageId, {
			content,
			updatedAt: Date.now(),
		});

		return { success: true };
	},
});

/**
 * Clear all messages for a project and context
 */
export const clearByProjectAndContext = mutation({
	args: {
		projectId: v.string(),
		context: v.number(),
	},
	handler: async (ctx, { projectId, context }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const messages = await ctx.db
			.query("chatMessages")
			.withIndex("by_project_and_context", (q) =>
				q.eq("projectId", projectId).eq("context", context),
			)
			.collect();

		// Verify caller owns these messages
		for (const message of messages) {
			if (message.userId !== identity.subject) {
				throw new Error("Unauthorized - you don't own these messages");
			}
		}

		for (const message of messages) {
			await ctx.db.delete(message._id);
		}

		return { success: true, deletedCount: messages.length };
	},
});
