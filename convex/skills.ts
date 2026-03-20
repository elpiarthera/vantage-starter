/**
 * Skills — CRUD + importFromUrl action
 *
 * Ported from vantage-studio/convex/skills.ts.
 * Auth adaptation (Phase 0.5):
 *   - clerkId → clerkUserId
 *   - by_clerk_id → by_clerk_user_id
 *   - activeWorkspaceId removed — resolved via workspace query by ownerId
 *   - importFromUrl: ctx.runMutation used (not ctx.db — actions cannot do ctx.db)
 *   - importFromUrl: workspace resolved by querying workspaces by ownerId (no activeWorkspaceId)
 *   - importFromUrl: workspaceId passed explicitly as arg (simplest approach for action boundary)
 */

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { requireAuthWithWorkspace, requireUser } from "./lib/auth";

// ============================================================================
// HELPER: Resolve user + workspace for query/mutation context
// Returns null if not authenticated or no workspace found.
// vantage-starter has no activeWorkspaceId — caller must pass workspaceId explicitly
// OR the helper resolves from the first owned workspace.
// ============================================================================

async function getUserWorkspace(
	ctx: Parameters<typeof requireAuthWithWorkspace>[0],
	workspaceId?: import("./_generated/dataModel").Id<"workspaces">,
) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) return null;

	const user = await ctx.db
		.query("users")
		.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
		.unique();

	if (!user) return null;

	// If workspaceId provided, verify access
	if (workspaceId) {
		const workspace = await ctx.db.get(workspaceId);
		if (!workspace) return null;
		const isOwner = workspace.ownerId === user.clerkUserId;
		const isOrgMember =
			workspace.organizationId != null &&
			workspace.organizationId === user.organizationId;
		if (!isOwner && !isOrgMember) return null;
		return { user, workspace, workspaceId, userId: identity.subject };
	}

	// Fallback: first workspace owned by this user
	const workspace = await ctx.db
		.query("workspaces")
		.withIndex("by_owner", (q) => q.eq("ownerId", user.clerkUserId))
		.first();

	if (!workspace) return null;

	return {
		user,
		workspace,
		workspaceId: workspace._id,
		userId: identity.subject,
	};
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List all skills available to the current workspace.
 * Includes workspace-specific skills + global system skills.
 */
export const list = query({
	args: { workspaceId: v.optional(v.id("workspaces")) },
	handler: async (ctx, args) => {
		const result = await getUserWorkspace(ctx, args.workspaceId);
		if (!result) return [];

		const workspaceSkills = await ctx.db
			.query("skills")
			.withIndex("by_workspace", (q) => q.eq("workspaceId", result.workspaceId))
			.collect();

		const systemSkills = await ctx.db
			.query("skills")
			.withIndex("by_system", (q) => q.eq("isSystem", true))
			.collect();

		return [...systemSkills, ...workspaceSkills];
	},
});

export const get = query({
	args: { skillId: v.id("skills") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.skillId);
	},
});

export const listSystem = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db
			.query("skills")
			.withIndex("by_system", (q) => q.eq("isSystem", true))
			.collect();
	},
});

export const listByCategory = query({
	args: {
		category: v.union(
			v.literal("document"),
			v.literal("analysis"),
			v.literal("research"),
			v.literal("communication"),
			v.literal("development"),
			v.literal("creative"),
		),
		workspaceId: v.optional(v.id("workspaces")),
	},
	handler: async (ctx, args) => {
		const result = await getUserWorkspace(ctx, args.workspaceId);
		if (!result) return [];

		const skills = await ctx.db
			.query("skills")
			.withIndex("by_category", (q) => q.eq("category", args.category))
			.filter((q) =>
				q.or(
					q.eq(q.field("workspaceId"), result.workspaceId),
					q.eq(q.field("isSystem"), true),
				),
			)
			.collect();

		return skills;
	},
});

// ============================================================================
// MUTATIONS
// ============================================================================

export const create = mutation({
	args: {
		workspaceId: v.id("workspaces"),
		name: v.string(),
		slug: v.string(),
		description: v.string(),
		instructions: v.string(),
		category: v.union(
			v.literal("document"),
			v.literal("analysis"),
			v.literal("research"),
			v.literal("communication"),
			v.literal("development"),
			v.literal("creative"),
		),
		visibility: v.union(v.literal("workspace"), v.literal("private")),
		sourceUrl: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { user } = await requireAuthWithWorkspace(ctx, args.workspaceId);

		const now = Date.now();

		const skillId = await ctx.db.insert("skills", {
			name: args.name,
			slug: args.slug,
			description: args.description,
			instructions: args.instructions,
			category: args.category,
			isSystem: false,
			createdBy: user.clerkUserId,
			workspaceId: args.workspaceId,
			visibility: args.visibility,
			sourceUrl: args.sourceUrl,
			usageCount: 0,
			createdAt: now,
			updatedAt: now,
		});

		return skillId;
	},
});

export const update = mutation({
	args: {
		skillId: v.id("skills"),
		name: v.optional(v.string()),
		description: v.optional(v.string()),
		instructions: v.optional(v.string()),
		category: v.optional(
			v.union(
				v.literal("document"),
				v.literal("analysis"),
				v.literal("research"),
				v.literal("communication"),
				v.literal("development"),
				v.literal("creative"),
			),
		),
		visibility: v.optional(
			v.union(v.literal("workspace"), v.literal("private")),
		),
	},
	handler: async (ctx, args) => {
		const { skillId, ...updates } = args;

		const skill = await ctx.db.get(skillId);
		if (!skill) throw new Error("Skill not found");

		if (skill.isSystem) {
			throw new Error("Cannot modify system skills");
		}

		const cleanUpdates = Object.fromEntries(
			Object.entries(updates).filter(([, v]) => v !== undefined),
		);

		await ctx.db.patch(skillId, {
			...cleanUpdates,
			updatedAt: Date.now(),
		});

		return skillId;
	},
});

export const remove = mutation({
	args: { skillId: v.id("skills") },
	handler: async (ctx, args) => {
		const skill = await ctx.db.get(args.skillId);
		if (!skill) throw new Error("Skill not found");

		if (skill.isSystem) {
			throw new Error("Cannot delete system skills");
		}

		await ctx.db.delete(args.skillId);
	},
});

export const incrementUsage = mutation({
	args: { skillId: v.id("skills") },
	handler: async (ctx, args) => {
		const skill = await ctx.db.get(args.skillId);
		if (!skill) return;

		await ctx.db.patch(args.skillId, {
			usageCount: skill.usageCount + 1,
			updatedAt: Date.now(),
		});
	},
});

// ============================================================================
// INTERNAL MUTATION — called by importFromUrl action (actions cannot use ctx.db)
// ============================================================================

export const createFromImport = internalMutation({
	args: {
		workspaceId: v.id("workspaces"),
		userId: v.string(), // Clerk user ID
		name: v.string(),
		slug: v.string(),
		description: v.string(),
		instructions: v.string(),
		category: v.union(
			v.literal("document"),
			v.literal("analysis"),
			v.literal("research"),
			v.literal("communication"),
			v.literal("development"),
			v.literal("creative"),
		),
		visibility: v.union(v.literal("workspace"), v.literal("private")),
		sourceUrl: v.string(),
	},
	handler: async (ctx, args) => {
		const now = Date.now();

		const skillId = await ctx.db.insert("skills", {
			name: args.name,
			slug: args.slug,
			description: args.description,
			instructions: args.instructions,
			category: args.category,
			isSystem: false,
			createdBy: args.userId,
			workspaceId: args.workspaceId,
			visibility: args.visibility,
			sourceUrl: args.sourceUrl,
			usageCount: 0,
			createdAt: now,
			updatedAt: now,
		});

		return skillId;
	},
});

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Import a skill from a URL (GitHub raw, Gist, etc.)
 * Parses SKILL.md format and creates a new skill.
 *
 * KEY: This is an action — cannot use ctx.db directly.
 * Workspace resolution: caller must pass workspaceId explicitly.
 * Skill insertion: via ctx.runMutation (not ctx.db).
 */
export const importFromUrl = action({
	args: {
		workspaceId: v.id("workspaces"),
		url: v.string(),
		category: v.union(
			v.literal("document"),
			v.literal("analysis"),
			v.literal("research"),
			v.literal("communication"),
			v.literal("development"),
			v.literal("creative"),
		),
		visibility: v.union(v.literal("workspace"), v.literal("private")),
	},
	handler: async (
		ctx,
		args,
	): Promise<{ skillId: string; name: string; description: string }> => {
		// Auth — actions use requireUser (returns identity, not DB user)
		const identity = await requireUser(ctx);
		const userId = identity.subject;

		// Convert GitHub blob URLs to raw URLs
		let fetchUrl = args.url;
		if (fetchUrl.includes("github.com") && fetchUrl.includes("/blob/")) {
			fetchUrl = fetchUrl
				.replace("github.com", "raw.githubusercontent.com")
				.replace("/blob/", "/");
		}

		// Fetch the content
		const response = await fetch(fetchUrl);
		if (!response.ok) {
			throw new Error(`Failed to fetch skill: ${response.statusText}`);
		}

		const content = await response.text();

		// Parse SKILL.md format:
		// # Skill Name
		// Description line
		// ---
		// Instructions content...
		const lines = content.split("\n");
		let name = "";
		let description = "";
		let foundSeparator = false;
		const instructionLines: string[] = [];

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];

			if (line.startsWith("# ") && !name) {
				name = line.replace("# ", "").trim();
				continue;
			}

			if (!foundSeparator && line.trim() === "---") {
				foundSeparator = true;
				continue;
			}

			if (!foundSeparator && name && !description && line.trim()) {
				description = line.trim();
				continue;
			}

			if (foundSeparator) {
				instructionLines.push(line);
			}
		}

		let instructions = instructionLines.join("\n").trim();

		if (!name) {
			throw new Error("Could not parse skill name from SKILL.md");
		}

		if (!instructions) {
			const startIndex = description ? 3 : 2;
			instructions = lines.slice(startIndex).join("\n").trim();
		}

		if (!description) {
			description = `Imported skill: ${name}`;
		}

		const slug = name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "");

		// Create the skill via mutation (actions cannot use ctx.db)
		const skillId = await ctx.runMutation(internal.skills.createFromImport, {
			workspaceId: args.workspaceId,
			userId,
			name,
			slug,
			description,
			instructions,
			category: args.category,
			visibility: args.visibility,
			sourceUrl: args.url,
		});

		return {
			skillId: skillId as string,
			name,
			description,
		};
	},
});
