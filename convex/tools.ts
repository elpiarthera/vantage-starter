/**
 * Tool Selection Wall - Convex Queries & Mutations
 * Sprint 24: Tool Selection Wall Feature
 *
 * 4-level hierarchy: Tools → Categories → SubCategories → Themes
 * See: docs/Implementation/ToDo/TOOL-SELECTION-WALL-FEATURE.md
 */

import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

/**
 * Helper: Check if user is admin
 */
async function requireAdmin(ctx: QueryCtx | MutationCtx) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new Error("Not authenticated");
	}

	const user = await ctx.db
		.query("users")
		.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
		.unique();

	if (!user) {
		throw new Error("User not found");
	}

	if (user.role !== "admin" && user.role !== "owner") {
		throw new Error("Unauthorized - admin access required");
	}

	return user;
}

// ============================================================
// QUERIES (PUBLIC - No auth required for display)
// ============================================================

/**
 * Get all active tools for the main wall, sorted by sortOrder
 * PUBLIC - No auth required
 */
export const listActiveTools = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db
			.query("tools")
			.withIndex("by_active_and_sort", (q) => q.eq("isActive", true))
			.order("asc") // Use index order
			.collect();
	},
});

/**
 * Get a single tool by key
 * PUBLIC - No auth required
 */
export const getByKey = query({
	args: { key: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("tools")
			.withIndex("by_key", (q) => q.eq("key", args.key))
			.first();
	},
});

/**
 * Get a tool by ID
 * PUBLIC - No auth required
 */
export const getById = query({
	args: { toolId: v.id("tools") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.toolId);
	},
});

/**
 * Get all active categories for a tool
 * PUBLIC - No auth required
 */
export const listCategories = query({
	args: { toolId: v.id("tools") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("toolCategories")
			.withIndex("by_tool_and_active", (q) =>
				q.eq("toolId", args.toolId).eq("isActive", true),
			)
			.collect();
	},
});

/**
 * Get all active subcategories for a category
 * PUBLIC - No auth required
 */
export const listSubCategories = query({
	args: { categoryId: v.id("toolCategories") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("toolSubCategories")
			.withIndex("by_category_and_active", (q) =>
				q.eq("categoryId", args.categoryId).eq("isActive", true),
			)
			.collect();
	},
});

/**
 * Get themes for a subcategory via junction table
 * PUBLIC - No auth required
 */
export const listThemes = query({
	args: { subcategoryId: v.id("toolSubCategories") },
	handler: async (ctx, args) => {
		// Get active junction records
		const junctions = await ctx.db
			.query("toolSubCategoryThemes")
			.withIndex("by_subcategory_and_active", (q) =>
				q.eq("toolSubCategoryId", args.subcategoryId).eq("isActive", true),
			)
			.collect();

		// Extract theme IDs
		const themeIds = junctions.map((j) => j.toolThemeId);

		// Batch fetch themes (Convex optimizes this)
		const themes = await Promise.all(themeIds.map((id) => ctx.db.get(id)));

		// Combine with junction data and filter active themes
		return junctions
			.map((j, i) => {
				const theme = themes[i];
				// Both junction AND theme must be active
				return theme?.isActive ? { ...theme, order: j.order } : null;
			})
			.filter(Boolean)
			.sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0));
	},
});

/**
 * Get all categories (for admin selectors)
 * ADMIN ONLY
 */
export const listAllCategories = query({
	handler: async (ctx) => {
		await requireAdmin(ctx);
		const categories = await ctx.db.query("toolCategories").collect();
		return categories.sort((a, b) => a.sortOrder - b.sortOrder);
	},
});

/**
 * Get all subcategories (for admin selectors)
 * ADMIN ONLY
 */
export const listAllSubCategories = query({
	handler: async (ctx) => {
		await requireAdmin(ctx);
		const subcategories = await ctx.db.query("toolSubCategories").collect();
		return subcategories.sort((a, b) => a.sortOrder - b.sortOrder);
	},
});

/**
 * Get all tools (admin)
 * ADMIN ONLY
 */
export const getAllTools = query({
	handler: async (ctx) => {
		await requireAdmin(ctx);

		const tools = await ctx.db.query("tools").collect();
		return tools.sort((a, b) => a.sortOrder - b.sortOrder);
	},
});

/**
 * Get all categories, optionally filtered by tool (admin)
 * ADMIN ONLY
 */
export const getAllCategories = query({
	args: { toolId: v.optional(v.id("tools")) },
	handler: async (ctx, args) => {
		await requireAdmin(ctx);

		let categories = [];
		if (args.toolId) {
			const toolId = args.toolId;
			categories = await ctx.db
				.query("toolCategories")
				.withIndex("by_tool", (q) => q.eq("toolId", toolId))
				.collect();
		} else {
			categories = await ctx.db.query("toolCategories").collect();
		}

		return categories.sort((a, b) => a.sortOrder - b.sortOrder);
	},
});

/**
 * Get all subcategories, optionally filtered by tool or category (admin)
 * ADMIN ONLY
 */
export const getAllSubCategories = query({
	args: {
		toolId: v.optional(v.id("tools")),
		categoryId: v.optional(v.id("toolCategories")),
	},
	handler: async (ctx, args) => {
		await requireAdmin(ctx);

		let subcategories = [];
		if (args.categoryId) {
			const categoryId = args.categoryId;
			subcategories = await ctx.db
				.query("toolSubCategories")
				.withIndex("by_category", (q) => q.eq("categoryId", categoryId))
				.collect();
		} else if (args.toolId) {
			const toolId = args.toolId;
			subcategories = await ctx.db
				.query("toolSubCategories")
				.withIndex("by_tool", (q) => q.eq("toolId", toolId))
				.collect();
		} else {
			subcategories = await ctx.db.query("toolSubCategories").collect();
		}

		return subcategories.sort((a, b) => a.sortOrder - b.sortOrder);
	},
});

/**
 * Get all themes (for admin - to assign to subcategories)
 * ADMIN ONLY
 */
export const getAllThemes = query({
	handler: async (ctx) => {
		// Auth check for admin queries
		await requireAdmin(ctx);

		const themes = await ctx.db.query("toolThemes").collect();
		return themes.sort((a, b) => a.sortOrder - b.sortOrder);
	},
});

/**
 * Get themes assigned to a subcategory (admin)
 * ADMIN ONLY
 */
export const listThemesForSubCategory = query({
	args: {
		subcategoryId: v.id("toolSubCategories"),
		includeInactive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		await requireAdmin(ctx);

		const junctions = await ctx.db
			.query("toolSubCategoryThemes")
			.withIndex("by_subcategory", (q) =>
				q.eq("toolSubCategoryId", args.subcategoryId),
			)
			.collect();

		const filtered = args.includeInactive
			? junctions
			: junctions.filter((junction) => junction.isActive);

		const themes = await Promise.all(
			filtered.map((junction) => ctx.db.get(junction.toolThemeId)),
		);

		return filtered
			.map((junction, index) => {
				const theme = themes[index];
				return theme
					? {
							...theme,
							order: junction.order,
							junctionIsActive: junction.isActive,
						}
					: null;
			})
			.filter(Boolean);
	},
});

/**
 * Get subcategories that reference a theme (admin)
 * ADMIN ONLY
 */
export const listSubCategoriesForTheme = query({
	args: {
		themeId: v.id("toolThemes"),
		includeInactive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		await requireAdmin(ctx);

		const junctions = await ctx.db
			.query("toolSubCategoryThemes")
			.withIndex("by_theme", (q) => q.eq("toolThemeId", args.themeId))
			.collect();

		const filtered = args.includeInactive
			? junctions
			: junctions.filter((junction) => junction.isActive);

		const subcategories = await Promise.all(
			filtered.map((junction) => ctx.db.get(junction.toolSubCategoryId)),
		);

		return filtered
			.map((junction, index) => {
				const subcategory = subcategories[index];
				return subcategory
					? {
							...subcategory,
							order: junction.order,
							junctionIsActive: junction.isActive,
						}
					: null;
			})
			.filter(Boolean);
	},
});

/**
 * Get a single category by ID with tool info
 * PUBLIC - No auth required
 */
export const getCategoryById = query({
	args: { categoryId: v.id("toolCategories") },
	handler: async (ctx, args) => {
		const category = await ctx.db.get(args.categoryId);
		if (!category) return null;

		const tool = await ctx.db.get(category.toolId);
		return { ...category, tool };
	},
});

/**
 * Get a single subcategory by ID with category and tool info
 * PUBLIC - No auth required
 */
export const getSubCategoryById = query({
	args: { subcategoryId: v.id("toolSubCategories") },
	handler: async (ctx, args) => {
		const subcategory = await ctx.db.get(args.subcategoryId);
		if (!subcategory) return null;

		const category = await ctx.db.get(subcategory.categoryId);
		const tool = category ? await ctx.db.get(category.toolId) : null;

		return { ...subcategory, category, tool };
	},
});

/**
 * Get a single theme by ID
 * PUBLIC - No auth required
 */
export const getThemeById = query({
	args: { themeId: v.id("toolThemes") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.themeId);
	},
});
// ============================================================
// MUTATIONS (ADMIN ONLY - All require authentication)
// ============================================================

/**
 * Create a new tool
 * ADMIN ONLY
 */
export const createTool = mutation({
	args: {
		key: v.string(),
		name: v.string(),
		nameTranslationKey: v.string(),
		description: v.string(),
		descriptionTranslationKey: v.string(),
		targetUrl: v.string(),
		hasCategories: v.boolean(),
		hasSubCategories: v.boolean(),
		hasThemes: v.boolean(),
		categoryParamName: v.optional(v.string()),
		subCategoryParamName: v.optional(v.string()),
		themeParamName: v.optional(v.string()),
		sortOrder: v.number(),
		imageUrl: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// Auth check
		await requireAdmin(ctx);

		// Validate unique key
		const existing = await ctx.db
			.query("tools")
			.withIndex("by_key", (q) => q.eq("key", args.key))
			.first();

		if (existing) {
			throw new Error(`Tool with key "${args.key}" already exists`);
		}

		return await ctx.db.insert("tools", {
			...args,
			isActive: true,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
	},
});

/**
 * Update a tool
 * ADMIN ONLY
 */
export const updateTool = mutation({
	args: {
		toolId: v.id("tools"),
		updates: v.object({
			name: v.optional(v.string()),
			description: v.optional(v.string()),
			sortOrder: v.optional(v.number()),
			isActive: v.optional(v.boolean()),
			imageUrl: v.optional(v.string()),
			categoryParamName: v.optional(v.string()),
			subCategoryParamName: v.optional(v.string()),
			themeParamName: v.optional(v.string()),
		}),
	},
	handler: async (ctx, args) => {
		// Auth check
		await requireAdmin(ctx);

		// Validate tool exists
		const tool = await ctx.db.get(args.toolId);
		if (!tool) {
			throw new Error("Tool not found");
		}

		await ctx.db.patch(args.toolId, {
			...args.updates,
			updatedAt: Date.now(),
		});

		return await ctx.db.get(args.toolId);
	},
});

/**
 * Update a category
 * ADMIN ONLY
 */
export const updateCategory = mutation({
	args: {
		categoryId: v.id("toolCategories"),
		updates: v.object({
			key: v.optional(v.string()),
			name: v.optional(v.string()),
			nameTranslationKey: v.optional(v.string()),
			description: v.optional(v.string()),
			descriptionTranslationKey: v.optional(v.string()),
			sortOrder: v.optional(v.number()),
			isActive: v.optional(v.boolean()),
			imageUrl: v.optional(v.string()),
		}),
	},
	handler: async (ctx, args) => {
		await requireAdmin(ctx);

		const category = await ctx.db.get(args.categoryId);
		if (!category) {
			throw new Error("Category not found");
		}

		if (args.updates.key && args.updates.key !== category.key) {
			const key = args.updates.key;
			const existing = await ctx.db
				.query("toolCategories")
				.withIndex("by_key", (q) => q.eq("key", key))
				.first();
			if (existing) {
				throw new Error(`Category with key "${key}" already exists`);
			}
		}

		await ctx.db.patch(args.categoryId, {
			...args.updates,
			updatedAt: Date.now(),
		});

		return await ctx.db.get(args.categoryId);
	},
});

/**
 * Update a subcategory
 * ADMIN ONLY
 */
export const updateSubCategory = mutation({
	args: {
		subCategoryId: v.id("toolSubCategories"),
		updates: v.object({
			key: v.optional(v.string()),
			name: v.optional(v.string()),
			nameTranslationKey: v.optional(v.string()),
			description: v.optional(v.string()),
			descriptionTranslationKey: v.optional(v.string()),
			sortOrder: v.optional(v.number()),
			isActive: v.optional(v.boolean()),
			imageUrl: v.optional(v.string()),
		}),
	},
	handler: async (ctx, args) => {
		await requireAdmin(ctx);

		const subCategory = await ctx.db.get(args.subCategoryId);
		if (!subCategory) {
			throw new Error("SubCategory not found");
		}

		if (args.updates.key && args.updates.key !== subCategory.key) {
			const key = args.updates.key;
			const existing = await ctx.db
				.query("toolSubCategories")
				.withIndex("by_key", (q) => q.eq("key", key))
				.first();
			if (existing) {
				throw new Error(`SubCategory with key "${key}" already exists`);
			}
		}

		await ctx.db.patch(args.subCategoryId, {
			...args.updates,
			updatedAt: Date.now(),
		});

		return await ctx.db.get(args.subCategoryId);
	},
});

/**
 * Update a theme
 * ADMIN ONLY
 */
export const updateTheme = mutation({
	args: {
		themeId: v.id("toolThemes"),
		updates: v.object({
			key: v.optional(v.string()),
			name: v.optional(v.string()),
			nameTranslationKey: v.optional(v.string()),
			description: v.optional(v.string()),
			descriptionTranslationKey: v.optional(v.string()),
			color: v.optional(v.string()),
			sortOrder: v.optional(v.number()),
			isActive: v.optional(v.boolean()),
			imageUrl: v.optional(v.string()),
		}),
	},
	handler: async (ctx, args) => {
		await requireAdmin(ctx);

		const theme = await ctx.db.get(args.themeId);
		if (!theme) {
			throw new Error("Theme not found");
		}

		if (args.updates.key && args.updates.key !== theme.key) {
			const key = args.updates.key;
			const existing = await ctx.db
				.query("toolThemes")
				.withIndex("by_key", (q) => q.eq("key", key))
				.first();
			if (existing) {
				throw new Error(`Theme with key "${key}" already exists`);
			}
		}

		await ctx.db.patch(args.themeId, {
			...args.updates,
			updatedAt: Date.now(),
		});

		return await ctx.db.get(args.themeId);
	},
});

/**
 * Create a category
 * ADMIN ONLY
 */
export const createCategory = mutation({
	args: {
		toolId: v.id("tools"),
		key: v.string(),
		name: v.string(),
		nameTranslationKey: v.string(),
		description: v.optional(v.string()),
		descriptionTranslationKey: v.optional(v.string()),
		sortOrder: v.number(),
		imageUrl: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// Auth check
		await requireAdmin(ctx);

		// Validate parent tool exists
		const tool = await ctx.db.get(args.toolId);
		if (!tool) {
			throw new Error("Parent tool not found");
		}

		// Validate tool has categories enabled
		if (!tool.hasCategories) {
			throw new Error("Tool does not support categories");
		}

		// Validate unique key
		const existing = await ctx.db
			.query("toolCategories")
			.withIndex("by_key", (q) => q.eq("key", args.key))
			.first();
		if (existing) {
			throw new Error(`Category with key "${args.key}" already exists`);
		}

		return await ctx.db.insert("toolCategories", {
			...args,
			isActive: true,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
	},
});

/**
 * Create a subcategory
 * ADMIN ONLY
 */
export const createSubCategory = mutation({
	args: {
		toolId: v.id("tools"),
		categoryId: v.id("toolCategories"),
		key: v.string(),
		name: v.string(),
		nameTranslationKey: v.string(),
		description: v.optional(v.string()),
		descriptionTranslationKey: v.optional(v.string()),
		sortOrder: v.number(),
		imageUrl: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// Auth check
		await requireAdmin(ctx);

		// Validate parent category exists
		const category = await ctx.db.get(args.categoryId);
		if (!category) {
			throw new Error("Parent category not found");
		}

		// Validate parent tool exists and has subcategories enabled
		const tool = await ctx.db.get(category.toolId);
		if (!tool) {
			throw new Error("Parent tool not found");
		}
		if (!tool.hasSubCategories) {
			throw new Error("Tool does not support subcategories");
		}

		// Validate unique key
		const existing = await ctx.db
			.query("toolSubCategories")
			.withIndex("by_key", (q) => q.eq("key", args.key))
			.first();
		if (existing) {
			throw new Error(`SubCategory with key "${args.key}" already exists`);
		}

		return await ctx.db.insert("toolSubCategories", {
			...args,
			isActive: true,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
	},
});

/**
 * Create a theme (standalone, reusable)
 * ADMIN ONLY
 */
export const createTheme = mutation({
	args: {
		key: v.string(),
		name: v.string(),
		nameTranslationKey: v.string(),
		description: v.optional(v.string()),
		descriptionTranslationKey: v.optional(v.string()),
		color: v.optional(v.string()),
		sortOrder: v.number(),
		imageUrl: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// Auth check
		await requireAdmin(ctx);

		// Validate unique key
		const existing = await ctx.db
			.query("toolThemes")
			.withIndex("by_key", (q) => q.eq("key", args.key))
			.first();

		if (existing) {
			throw new Error(`Theme with key "${args.key}" already exists`);
		}

		return await ctx.db.insert("toolThemes", {
			...args,
			isActive: true,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
	},
});

/**
 * Assign theme to subcategory (junction table)
 * ADMIN ONLY
 */
export const assignThemeToSubCategory = mutation({
	args: {
		toolSubCategoryId: v.id("toolSubCategories"),
		toolThemeId: v.id("toolThemes"),
		order: v.number(),
	},
	handler: async (ctx, args) => {
		// Auth check
		await requireAdmin(ctx);

		// Validate subcategory exists
		const subcategory = await ctx.db.get(args.toolSubCategoryId);
		if (!subcategory) {
			throw new Error("SubCategory not found");
		}

		// Validate theme exists
		const theme = await ctx.db.get(args.toolThemeId);
		if (!theme) {
			throw new Error("Theme not found");
		}

		// Check if already assigned
		const existing = await ctx.db
			.query("toolSubCategoryThemes")
			.withIndex("by_subcategory_and_theme", (q) =>
				q
					.eq("toolSubCategoryId", args.toolSubCategoryId)
					.eq("toolThemeId", args.toolThemeId),
			)
			.first();

		if (existing) {
			if (existing.isActive) {
				throw new Error("Theme already assigned to this subcategory");
			}

			await ctx.db.patch(existing._id, {
				isActive: true,
				order: args.order,
			});

			return existing._id;
		}

		return await ctx.db.insert("toolSubCategoryThemes", {
			...args,
			isActive: true,
		});
	},
});

/**
 * Remove theme from subcategory
 * ADMIN ONLY
 */
export const removeThemeFromSubCategory = mutation({
	args: {
		toolSubCategoryId: v.id("toolSubCategories"),
		toolThemeId: v.id("toolThemes"),
	},
	handler: async (ctx, args) => {
		// Auth check
		await requireAdmin(ctx);

		const junction = await ctx.db
			.query("toolSubCategoryThemes")
			.withIndex("by_subcategory_and_theme", (q) =>
				q
					.eq("toolSubCategoryId", args.toolSubCategoryId)
					.eq("toolThemeId", args.toolThemeId),
			)
			.first();

		if (junction) {
			await ctx.db.patch(junction._id, {
				isActive: false,
			});
		}
	},
});

/**
 * Batch update order for tools on main wall
 * ADMIN ONLY
 */
export const reorderTools = mutation({
	args: {
		tools: v.array(
			v.object({
				id: v.id("tools"),
				sortOrder: v.number(),
			}),
		),
	},
	handler: async (ctx, args) => {
		// Auth check
		await requireAdmin(ctx);

		for (const tool of args.tools) {
			await ctx.db.patch(tool.id, {
				sortOrder: tool.sortOrder,
				updatedAt: Date.now(),
			});
		}
	},
});

/**
 * Update wall configuration
 * ADMIN ONLY
 */
/**
 * Delete subcategory with cascade
 * ADMIN ONLY
 */
export const deleteSubCategory = mutation({
	args: { subcategoryId: v.id("toolSubCategories") },
	handler: async (ctx, args) => {
		// Auth check
		await requireAdmin(ctx);

		// Cascade delete: Remove all junction records first
		const junctions = await ctx.db
			.query("toolSubCategoryThemes")
			.withIndex("by_subcategory", (q) =>
				q.eq("toolSubCategoryId", args.subcategoryId),
			)
			.collect();

		for (const junction of junctions) {
			await ctx.db.delete(junction._id);
		}

		// Now delete subcategory
		await ctx.db.delete(args.subcategoryId);
	},
});

/**
 * Get wall configuration for admin (includes inactive items)
 * ADMIN ONLY
 */
export const getWallConfigForAdmin = query({
	args: {
		level: v.union(
			v.literal("tool"),
			v.literal("category"),
			v.literal("subcategory"),
			v.literal("theme"),
		),
		toolId: v.optional(v.id("tools")),
		categoryId: v.optional(v.id("toolCategories")),
		subcategoryId: v.optional(v.id("toolSubCategories")),
	},
	handler: async (ctx, args) => {
		// Auth check
		await requireAdmin(ctx);

		const { level, toolId, categoryId, subcategoryId } = args;

		if (level === "tool") {
			const configs = await ctx.db
				.query("toolWallConfigs")
				.withIndex("by_level_order", (q) => q.eq("level", level))
				.order("asc")
				.collect();
			return configs;
		}

		if (level === "category" && !toolId) {
			return [];
		}
		if (level === "subcategory" && !categoryId) {
			return [];
		}
		if (level === "theme" && !subcategoryId) {
			return [];
		}

		// Build context string for lookup
		let contextId: string | undefined;
		if (level === "category" && toolId) {
			contextId = toolId;
		} else if (level === "subcategory" && categoryId) {
			contextId = categoryId;
		} else if (level === "theme" && subcategoryId) {
			contextId = subcategoryId;
		}

		// Query wall config (all items including inactive)
		const configs = await ctx.db
			.query("toolWallConfigs")
			.withIndex("by_level_context_and_order", (q) =>
				q.eq("level", level).eq("contextId", contextId),
			)
			.order("asc")
			.collect();

		return configs;
	},
});

/**
 * Get wall configuration for a specific level and context
 * PUBLIC (only returns active items)
 */
export const getWallConfig = query({
	args: {
		level: v.union(
			v.literal("tool"),
			v.literal("category"),
			v.literal("subcategory"),
			v.literal("theme"),
		),
		toolId: v.optional(v.id("tools")),
		categoryId: v.optional(v.id("toolCategories")),
		subcategoryId: v.optional(v.id("toolSubCategories")),
	},
	handler: async (ctx, args) => {
		const { level, toolId, categoryId, subcategoryId } = args;

		if (level === "tool") {
			const configs = await ctx.db
				.query("toolWallConfigs")
				.withIndex("by_level_active_order", (q) =>
					q.eq("level", level).eq("isActive", true),
				)
				.order("asc")
				.collect();
			return configs;
		}

		if (level === "category" && !toolId) {
			return [];
		}
		if (level === "subcategory" && !categoryId) {
			return [];
		}
		if (level === "theme" && !subcategoryId) {
			return [];
		}

		// Build context string for lookup
		let contextId: string | undefined;
		if (level === "category" && toolId) {
			contextId = toolId;
		} else if (level === "subcategory" && categoryId) {
			contextId = categoryId;
		} else if (level === "theme" && subcategoryId) {
			contextId = subcategoryId;
		}

		// Query wall config (only active items for public display)
		// Uses compound index for ordered public queries (no .filter() needed)
		const configs = await ctx.db
			.query("toolWallConfigs")
			.withIndex("by_level_context_active_order", (q) =>
				q.eq("level", level).eq("contextId", contextId).eq("isActive", true),
			)
			.order("asc")
			.collect();

		return configs;
	},
});

/**
 * Add item to wall configuration
 * ADMIN ONLY
 */
export const addItemToWall = mutation({
	args: {
		level: v.union(
			v.literal("tool"),
			v.literal("category"),
			v.literal("subcategory"),
			v.literal("theme"),
		),
		referenceId: v.union(
			v.id("tools"),
			v.id("toolCategories"),
			v.id("toolSubCategories"),
			v.id("toolThemes"),
		),
		toolId: v.optional(v.id("tools")),
		categoryId: v.optional(v.id("toolCategories")),
		subcategoryId: v.optional(v.id("toolSubCategories")),
	},
	handler: async (ctx, args) => {
		// Auth check
		await requireAdmin(ctx);

		const { level, referenceId, toolId, categoryId, subcategoryId } = args;

		// Validate required context
		if (level === "category" && !toolId) {
			throw new Error("toolId required for category level");
		}
		if (level === "subcategory" && !categoryId) {
			throw new Error("categoryId required for subcategory level");
		}
		if (level === "theme" && !subcategoryId) {
			throw new Error("subcategoryId required for theme level");
		}

		// Build context string
		let contextId: string | undefined;
		if (level === "category" && toolId) {
			contextId = toolId;
		} else if (level === "subcategory" && categoryId) {
			contextId = categoryId;
		} else if (level === "theme" && subcategoryId) {
			contextId = subcategoryId;
		}

		// Get existing items
		const existing = await ctx.db
			.query("toolWallConfigs")
			.withIndex("by_level_and_context", (q) =>
				q.eq("level", level).eq("contextId", contextId),
			)
			.collect();

		// Check for duplicates
		const duplicate = existing.find((item) => item.referenceId === referenceId);
		if (duplicate) {
			throw new Error(`Item already exists on ${level} wall`);
		}

		const maxOrder =
			existing.length > 0 ? Math.max(...existing.map((item) => item.order)) : 0;

		// Insert new item
		return await ctx.db.insert("toolWallConfigs", {
			level,
			contextId,
			referenceId,
			order: maxOrder + 1,
			isActive: true,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
	},
});

/**
 * Remove item from wall configuration
 * ADMIN ONLY
 */
export const removeItemFromWall = mutation({
	args: {
		configId: v.id("toolWallConfigs"),
	},
	handler: async (ctx, args) => {
		// Auth check
		await requireAdmin(ctx);

		await ctx.db.delete(args.configId);
	},
});

/**
 * Toggle item active/inactive status
 * ADMIN ONLY
 */
export const toggleWallItemActive = mutation({
	args: {
		configId: v.id("toolWallConfigs"),
	},
	handler: async (ctx, args) => {
		// Auth check
		await requireAdmin(ctx);

		const item = await ctx.db.get(args.configId);
		if (!item) {
			throw new Error("Wall item not found");
		}

		await ctx.db.patch(args.configId, {
			isActive: !item.isActive,
			updatedAt: Date.now(),
		});
	},
});

/**
 * Reorder items in wall configuration
 * ADMIN ONLY
 */
export const reorderWallItems = mutation({
	args: {
		items: v.array(
			v.object({
				id: v.id("toolWallConfigs"),
				order: v.number(),
			}),
		),
	},
	handler: async (ctx, args) => {
		// Auth check
		await requireAdmin(ctx);

		// Update all items in parallel for better performance
		await Promise.all(
			args.items.map((item) =>
				ctx.db.patch(item.id, {
					order: item.order,
					updatedAt: Date.now(),
				}),
			),
		);
	},
});

// ============================================================
// ADS MANAGEMENT
// ============================================================

/**
 * Get all ads (admin)
 * ADMIN ONLY
 */
export const getAllAds = query({
	handler: async (ctx) => {
		await requireAdmin(ctx);
		const ads = await ctx.db.query("ads").collect();
		return ads.sort((a, b) => a.sortOrder - b.sortOrder);
	},
});

/**
 * Get active ads
 * PUBLIC - No auth required
 */
export const getActiveAds = query({
	handler: async (ctx) => {
		return await ctx.db
			.query("ads")
			.withIndex("by_active_and_sort", (q) => q.eq("isActive", true))
			.collect();
	},
});

/**
 * Get ads for a specific wall
 * PUBLIC - No auth required
 */
export const getAdsForWall = query({
	args: {
		level: v.union(
			v.literal("tool"),
			v.literal("category"),
			v.literal("subcategory"),
		),
		contextId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const allAds = await ctx.db
			.query("ads")
			.withIndex("by_active", (q) => q.eq("isActive", true))
			.collect();

		return allAds.filter((ad) =>
			ad.targets.some(
				(target) =>
					target.level === args.level &&
					(args.level === "tool" || target.contextId === args.contextId),
			),
		);
	},
});

/**
 * Create a new ad
 * ADMIN ONLY
 */
export const createAd = mutation({
	args: {
		title: v.string(),
		baseline: v.string(),
		imageUrl: v.optional(v.string()),
		linkUrl: v.optional(v.string()),
		targets: v.array(
			v.object({
				level: v.union(
					v.literal("tool"),
					v.literal("category"),
					v.literal("subcategory"),
				),
				contextId: v.optional(v.string()),
			}),
		),
		sortOrder: v.number(),
		isActive: v.boolean(),
	},
	handler: async (ctx, args) => {
		await requireAdmin(ctx);

		return await ctx.db.insert("ads", {
			...args,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
	},
});

/**
 * Update an ad
 * ADMIN ONLY
 */
export const updateAd = mutation({
	args: {
		adId: v.id("ads"),
		updates: v.object({
			title: v.optional(v.string()),
			baseline: v.optional(v.string()),
			imageUrl: v.optional(v.string()),
			linkUrl: v.optional(v.string()),
			targets: v.optional(
				v.array(
					v.object({
						level: v.union(
							v.literal("tool"),
							v.literal("category"),
							v.literal("subcategory"),
						),
						contextId: v.optional(v.string()),
					}),
				),
			),
			sortOrder: v.optional(v.number()),
			isActive: v.optional(v.boolean()),
		}),
	},
	handler: async (ctx, args) => {
		await requireAdmin(ctx);

		const ad = await ctx.db.get(args.adId);
		if (!ad) {
			throw new Error("Ad not found");
		}

		await ctx.db.patch(args.adId, {
			...args.updates,
			updatedAt: Date.now(),
		});
	},
});

/**
 * Delete an ad
 * ADMIN ONLY
 */
export const deleteAd = mutation({
	args: { adId: v.id("ads") },
	handler: async (ctx, args) => {
		await requireAdmin(ctx);
		await ctx.db.delete(args.adId);
	},
});
