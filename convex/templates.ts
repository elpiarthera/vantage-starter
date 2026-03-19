import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * List all system templates (public, available to all users)
 */
export const listSystem = query({
	handler: async (ctx) => {
		return await ctx.db
			.query("templates")
			.withIndex("by_is_system", (q) => q.eq("isSystem", true))
			.filter((q) => q.eq(q.field("isPublic"), true))
			.order("desc")
			.collect();
	},
});

/**
 * List user's custom templates
 */
export const listByUser = query({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return [];

		return await ctx.db
			.query("templates")
			.withIndex("by_user", (q) => q.eq("userId", identity.subject))
			.order("desc")
			.collect();
	},
});

/**
 * List all templates (system + user's custom)
 * Used by the templates page to show all available templates
 */
export const listAll = query({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();

		// Get all public system templates
		const systemTemplates = await ctx.db
			.query("templates")
			.withIndex("by_is_system", (q) => q.eq("isSystem", true))
			.filter((q) => q.eq(q.field("isPublic"), true))
			.collect();

		// Get user's custom templates
		let customTemplates: typeof systemTemplates = [];
		if (identity) {
			customTemplates = await ctx.db
				.query("templates")
				.withIndex("by_user", (q) => q.eq("userId", identity.subject))
				.collect();
		}

		// Sort by usage count (popular first) then by creation date
		const allTemplates = [...systemTemplates, ...customTemplates];
		allTemplates.sort((a, b) => {
			// System templates first
			if (a.isSystem !== b.isSystem) return a.isSystem ? -1 : 1;
			// Then by usage count
			if (b.usageCount !== a.usageCount) return b.usageCount - a.usageCount;
			// Then by creation date
			return b.createdAt - a.createdAt;
		});

		return allTemplates;
	},
});

/**
 * Get single template by ID
 */
export const get = query({
	args: { templateId: v.id("templates") },
	handler: async (ctx, args) => {
		const template = await ctx.db.get(args.templateId);
		if (!template) return null;

		// Check access: system templates are public, custom templates need ownership
		if (!template.isSystem && !template.isPublic) {
			const identity = await ctx.auth.getUserIdentity();
			if (!identity || template.userId !== identity.subject) {
				return null; // Unauthorized
			}
		}

		return template;
	},
});

/**
 * Create a custom template from a project
 */
export const create = mutation({
	args: {
		name: v.string(),
		description: v.string(),
		category: v.string(),
		type: v.union(
			v.literal("wedding"),
			v.literal("birthday"),
			v.literal("anniversary"),
			v.literal("business"),
			v.literal("custom"),
		),
		projectId: v.optional(v.id("projects")),
		config: v.object({
			defaultScenes: v.array(v.any()),
			defaultSettings: v.any(),
			suggestedMusic: v.array(v.string()),
			suggestedStyles: v.array(v.string()),
			emotionalStory: v.optional(v.string()),
			approvedNarrationScript: v.optional(v.string()),
			validatedStory: v.optional(v.string()),
		}),
		tags: v.optional(v.array(v.string())),
		thumbnail: v.optional(v.string()),
		isPublic: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");

		const templateId = await ctx.db.insert("templates", {
			userId: identity.subject,
			organizationId: undefined,
			name: args.name,
			description: args.description,
			category: args.category,
			type: args.type,
			thumbnail: args.thumbnail,
			config: args.config,
			isSystem: false,
			isPublic: args.isPublic ?? false,
			usageCount: 0,
			tags: args.tags || [],
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		return templateId;
	},
});

/**
 * Update a custom template
 */
export const update = mutation({
	args: {
		templateId: v.id("templates"),
		name: v.optional(v.string()),
		description: v.optional(v.string()),
		category: v.optional(v.string()),
		tags: v.optional(v.array(v.string())),
		thumbnail: v.optional(v.string()),
		isPublic: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");

		const template = await ctx.db.get(args.templateId);
		if (!template) throw new Error("Template not found");

		if (template.isSystem) {
			throw new Error("Cannot modify system templates");
		}

		if (template.userId !== identity.subject) {
			throw new Error("Unauthorized");
		}

		const { templateId, ...updates } = args;
		const cleanedUpdates = Object.fromEntries(
			Object.entries(updates).filter(([_, v]) => v !== undefined),
		);

		await ctx.db.patch(templateId, {
			...cleanedUpdates,
			updatedAt: Date.now(),
		});

		return { success: true };
	},
});

/**
 * Delete a custom template
 */
export const remove = mutation({
	args: { templateId: v.id("templates") },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");

		const template = await ctx.db.get(args.templateId);
		if (!template) throw new Error("Template not found");

		if (template.isSystem) {
			throw new Error("Cannot delete system templates");
		}

		if (template.userId !== identity.subject) {
			throw new Error("Unauthorized");
		}

		await ctx.db.delete(args.templateId);
		return { success: true };
	},
});

/**
 * Increment template usage count
 * Called when a user creates a project from a template
 */
export const incrementUsage = mutation({
	args: { templateId: v.id("templates") },
	handler: async (ctx, args) => {
		const template = await ctx.db.get(args.templateId);
		if (!template) throw new Error("Template not found");

		await ctx.db.patch(args.templateId, {
			usageCount: (template.usageCount || 0) + 1,
		});

		return { success: true };
	},
});

/**
 * List templates by category
 */
export const listByCategory = query({
	args: { category: v.string() },
	handler: async (ctx, args) => {
		const allTemplates = await ctx.db
			.query("templates")
			.withIndex("by_is_system", (q) => q.eq("isSystem", true))
			.filter((q) => q.eq(q.field("isPublic"), true))
			.filter((q) =>
				q.eq(
					q.field("category"),
					args.category.charAt(0).toUpperCase() + args.category.slice(1),
				),
			)
			.collect();

		return allTemplates;
	},
});

/**
 * List templates by type
 */
export const listByType = query({
	args: {
		type: v.union(
			v.literal("wedding"),
			v.literal("birthday"),
			v.literal("anniversary"),
			v.literal("business"),
			v.literal("custom"),
		),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("templates")
			.withIndex("by_type", (q) => q.eq("type", args.type))
			.filter((q) =>
				q.or(q.eq(q.field("isPublic"), true), q.eq(q.field("isSystem"), true)),
			)
			.collect();
	},
});
