/**
 * Image Tool History (Sprint 29)
 * Unified history for Generate + Edit modes (Kling Image T2I/I2I).
 * - insertImageToolEntry: internal mutation (called from T2I/I2I actions only).
 * - listByUser: public query; uses ctx.auth, no userId from client.
 * - saveToProject: link entry to project or library (mirror voice Phase 7).
 * - getProjectImages: list images saved to a project (Project Details → Images tab).
 */
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

/**
 * Internal mutation: insert one history entry. Called from imageToolKlingT2I and imageToolKlingI2I actions.
 */
export const insertImageToolEntry = internalMutation({
	args: {
		userId: v.string(),
		mode: v.union(v.literal("generate"), v.literal("edit")),
		prompt: v.string(),
		imageUrl: v.optional(v.string()),
		imageUrls: v.optional(v.array(v.string())),
		sourceImageUrl: v.optional(v.string()),
		sourceImageUrls: v.optional(v.array(v.string())),
		model: v.string(),
		resolution: v.optional(v.string()),
		aspectRatio: v.optional(v.string()),
		resultType: v.optional(v.string()),
		metadata: v.optional(v.any()),
		createdAt: v.number(),
	},
	handler: async (ctx, args) => {
		await ctx.db.insert("imageToolHistory", {
			userId: args.userId,
			mode: args.mode,
			prompt: args.prompt,
			imageUrl: args.imageUrl,
			imageUrls: args.imageUrls,
			sourceImageUrl: args.sourceImageUrl,
			sourceImageUrls: args.sourceImageUrls,
			model: args.model,
			resolution: args.resolution,
			aspectRatio: args.aspectRatio,
			resultType: args.resultType,
			metadata: args.metadata,
			createdAt: args.createdAt,
		});
	},
});

/**
 * List history entries for the authenticated user. Uses ctx.auth; do not pass userId from client.
 */
export const listByUser = query({
	args: {
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return [];

		const limit = args.limit ?? 50;
		const entries = await ctx.db
			.query("imageToolHistory")
			.withIndex("by_user_created", (q) => q.eq("userId", identity.subject))
			.order("desc")
			.take(limit);

		return entries;
	},
});

/**
 * Paginated history entries for the authenticated user (cursor-based).
 * Use with usePaginatedQuery on the client for infinite scroll.
 */
export const listByUserPaginated = query({
	args: { paginationOpts: paginationOptsValidator },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return { page: [], isDone: true, continueCursor: "" };
		}
		return ctx.db
			.query("imageToolHistory")
			.withIndex("by_user_created", (q) => q.eq("userId", identity.subject))
			.order("desc")
			.paginate(args.paginationOpts);
	},
});

/**
 * Save an image history entry to a project or library (mirror voice Phase 7).
 * Caller must own the entry and, if projectId set, the project.
 */
export const saveToProject = mutation({
	args: {
		entryId: v.id("imageToolHistory"),
		title: v.string(),
		projectId: v.optional(v.id("projects")), // omit for "Save to Library"
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");

		const entry = await ctx.db.get(args.entryId);
		if (!entry) throw new Error("Entry not found");
		if (entry.userId !== identity.subject) {
			throw new Error("Unauthorized - you don't own this entry");
		}

		let organizationId: string | undefined;
		const projectIdValue = args.projectId;

		if (projectIdValue) {
			const project = await ctx.db.get(projectIdValue);
			if (!project) throw new Error("Project not found");
			const user = await ctx.db
				.query("users")
				.withIndex("by_clerk_user_id", (q) =>
					q.eq("clerkUserId", identity.subject),
				)
				.unique();
			if (!user || project.userId !== user._id) {
				throw new Error("Unauthorized - you don't own this project");
			}
			organizationId = project.organizationId ?? undefined;
		} else {
			organizationId = undefined;
		}

		await ctx.db.patch("imageToolHistory", args.entryId, {
			title: args.title,
			projectId: projectIdValue,
			organizationId,
		});
	},
});

/**
 * List image history entries saved to a project (Project Details → Images tab).
 * Same auth pattern as getProjectNarrations.
 */
export const getProjectImages = query({
	args: { projectId: v.id("projects") },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return [];

		const project = await ctx.db.get(args.projectId);
		if (!project) throw new Error("Project not found");

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();

		if (!user || project.userId !== user._id) {
			throw new Error("Unauthorized - you don't own this project");
		}

		return await ctx.db
			.query("imageToolHistory")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
			.order("desc")
			.collect();
	},
});
