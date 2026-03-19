import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Create a new chat message
 */
export const create = mutation({
	args: {
		projectId: v.id("projects"),
		role: v.union(
			v.literal("user"),
			v.literal("assistant"),
			v.literal("system"),
		),
		content: v.string(),
		step: v.number(),
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

		// Verify project ownership
		const project = await ctx.db.get(args.projectId);
		if (!project) {
			throw new Error("Project not found");
		}

		if (project.userId !== user._id) {
			throw new Error("Unauthorized - you don't own this project");
		}

		// Check for duplicate messages before creating
		// This prevents race conditions where the client-side check might miss existing messages
		const existingMessages = await ctx.db
			.query("chatMessages")
			.withIndex("by_project_and_step", (q) =>
				q.eq("projectId", args.projectId).eq("step", args.step),
			)
			.collect();

		// For initial story messages (assistant role on step 2), check for duplicates
		// by looking for the signature text that identifies auto-generated story messages
		if (args.role === "assistant" && args.step === 2) {
			const storySignature =
				"This story was generated based on your inputs in Step 1";

			// Check if a message with similar content already exists
			const duplicate = existingMessages.find(
				(msg) =>
					msg.role === "assistant" &&
					msg.content.includes(storySignature) &&
					// Also check if content length is similar (within 100 chars) to avoid false positives
					Math.abs(msg.content.length - args.content.length) < 100,
			);

			if (duplicate) {
				console.log(
					"[chatMessages.create] Duplicate story message detected, returning existing message ID:",
					duplicate._id,
				);
				return duplicate._id; // Return existing instead of creating new
			}
		}

		const now = Date.now();

		const messageId = await ctx.db.insert("chatMessages", {
			organizationId: user.organizationId || "",
			projectId: args.projectId,
			userId: identity.subject,
			role: args.role,
			content: args.content,
			step: args.step,
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
 * List all chat messages for a project and step
 */
export const list = query({
	args: {
		projectId: v.id("projects"),
		step: v.optional(v.number()),
	},
	handler: async (ctx, { projectId, step }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return [];
		}

		// Verify project ownership
		const project = await ctx.db.get(projectId);
		if (!project) {
			return [];
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();

		if (!user || project.userId !== user._id) {
			return [];
		}

		// Query messages
		if (step !== undefined) {
			// Query by project and step
			const messages = await ctx.db
				.query("chatMessages")
				.withIndex("by_project_and_step", (q) =>
					q.eq("projectId", projectId).eq("step", step),
				)
				.collect();

			return messages.sort((a, b) => a.createdAt - b.createdAt);
		}

		// Query all messages for project
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

		// Verify ownership
		if (message.userId !== identity.subject) {
			throw new Error("Unauthorized - you don't own this message");
		}

		await ctx.db.delete(messageId);

		return { success: true };
	},
});

/**
 * Update message content (for editing narration)
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

		// Verify ownership
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
 * Clear all messages for a project and step
 */
export const clearByProjectAndStep = mutation({
	args: {
		projectId: v.id("projects"),
		step: v.number(),
	},
	handler: async (ctx, { projectId, step }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		// Verify project ownership
		const project = await ctx.db.get(projectId);
		if (!project) {
			throw new Error("Project not found");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();

		if (!user || project.userId !== user._id) {
			throw new Error("Unauthorized - you don't own this project");
		}

		// Delete all messages for this project and step
		const messages = await ctx.db
			.query("chatMessages")
			.withIndex("by_project_and_step", (q) =>
				q.eq("projectId", projectId).eq("step", step),
			)
			.collect();

		for (const message of messages) {
			await ctx.db.delete(message._id);
		}

		return { success: true, deletedCount: messages.length };
	},
});

/**
 * Admin-only: Clear all messages for a project and step without authentication
 * TEMPORARY: For debugging duplicate messages
 * TODO: Remove this before production
 */
export const adminClearByProjectAndStep = mutation({
	args: {
		projectId: v.string(),
		step: v.number(),
	},
	handler: async (ctx, { projectId, step }) => {
		// Delete all messages for this project and step
		const messages = await ctx.db.query("chatMessages").collect();

		const toDelete = messages.filter(
			(m) => m.projectId === projectId && m.step === step,
		);

		for (const message of toDelete) {
			await ctx.db.delete(message._id);
		}

		return { success: true, deletedCount: toDelete.length };
	},
});
