/**
 * Custom Personas management functions
 *
 * Ported from vantage-studio/convex/customPersonas.ts.
 * Auth adapter applied: by_clerk_id → by_clerk_user_id, clerkId → clerkUserId.
 * Workspace resolution: by_owner_and_default index (no user.activeWorkspaceId).
 *
 * Security guards applied:
 * - S1 — remove: system entities non-deletable; ownership check for user entities
 * - S3 — get: cross-workspace read blocked; system personas readable by all authenticated users
 * - H4 — update/remove: createdBy compared against user.clerkUserId (Clerk user ID strings)
 * - H5 — create: workspace ownership verified before insert
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./lib/auth";
import { rateLimiter } from "./ratelimit";

// D1: Typed document validator for the customPersonas table.
// Includes _id and _creationTime (system fields added by Convex to every document).
const customPersonaDoc = v.object({
	_id: v.id("customPersonas"),
	_creationTime: v.number(),
	name: v.string(),
	icon: v.string(),
	description: v.string(),
	traits: v.array(v.string()),
	communicationStyle: v.string(),
	decisionMaking: v.string(),
	systemPromptModifier: v.string(),
	isSystem: v.optional(v.boolean()),
	workspaceId: v.optional(v.id("workspaces")),
	createdBy: v.optional(v.string()),
	createdAt: v.number(),
	updatedAt: v.number(),
});

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List all custom personas for the current user's default workspace.
 * Returns workspace-specific personas + system personas (deduplicated).
 * Returns only system personas if unauthenticated.
 */
export const list = query({
	args: {},
	returns: v.array(customPersonaDoc),
	handler: async (ctx) => {
		// System personas are readable by all — return them even if unauthenticated
		const systemPersonas = await ctx.db
			.query("customPersonas")
			.withIndex("by_system", (q) => q.eq("isSystem", true))
			.collect();

		const user = await requireAuth(ctx).catch(() => null);
		if (!user) return systemPersonas;

		// 1. Try owned default workspace
		const ownedWorkspace = await ctx.db
			.query("workspaces")
			.withIndex("by_owner_and_default", (q) =>
				q.eq("ownerId", user.clerkUserId).eq("isDefault", true),
			)
			.unique();

		// 2. Fall back to org workspace
		let workspace = ownedWorkspace;
		if (!workspace && user.organizationId) {
			const orgId = user.organizationId;
			workspace = await ctx.db
				.query("workspaces")
				.withIndex("by_organization", (q) => q.eq("organizationId", orgId))
				.first();
		}

		if (!workspace) return systemPersonas;

		const workspacePersonas = await ctx.db
			.query("customPersonas")
			.withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
			.collect();

		// Combine and deduplicate (system personas may appear in both lists)
		const all = [...workspacePersonas, ...systemPersonas];
		return Array.from(new Map(all.map((p) => [p._id, p])).values());
	},
});

/**
 * Get a single custom persona by ID.
 * S3 FIX: cross-workspace read blocked — if not a system persona, workspace
 * ownership must match the requesting user.
 */
export const get = query({
	args: { id: v.id("customPersonas") },
	returns: v.union(customPersonaDoc, v.null()),
	handler: async (ctx, { id }) => {
		const user = await requireAuth(ctx).catch(() => null);
		if (!user) return null;

		const persona = await ctx.db.get(id);
		if (!persona) return null;

		// System personas are readable by all authenticated users
		if (persona.isSystem) return persona;

		// S3: workspace access check — owner or org member
		if (persona.workspaceId) {
			const ws = await ctx.db.get(persona.workspaceId);
			if (!ws) throw new Error("Forbidden");
			const isOwner = ws.ownerId === user.clerkUserId;
			const isOrgMember =
				ws.organizationId !== null &&
				ws.organizationId !== undefined &&
				ws.organizationId === user.organizationId;
			if (!isOwner && !isOrgMember) throw new Error("Forbidden");
		}

		return persona;
	},
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new custom persona in the user's default workspace.
 * H5 FIX: workspace resolved and owned before insert.
 * Rate limit: 10 per minute per user.
 */
export const create = mutation({
	args: {
		name: v.string(),
		icon: v.string(),
		description: v.string(),
		traits: v.array(v.string()),
		communicationStyle: v.string(),
		decisionMaking: v.string(),
		systemPromptModifier: v.string(),
	},
	returns: v.id("customPersonas"),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);

		// D5: server-side length validation
		if (args.name.length > 200)
			throw new Error("Name must be 200 characters or less");
		if (args.description.length > 5000)
			throw new Error("Description must be 5000 characters or less");

		// Rate limit: 10 persona creations per minute per user
		const { ok, retryAfter } = await rateLimiter.limit(
			ctx,
			"createCustomPersona",
			{ key: user.clerkUserId },
		);
		if (!ok) {
			throw new Error(
				`Rate limit exceeded. Try again in ${Math.ceil((retryAfter ?? 60_000) / 1000)} seconds.`,
			);
		}

		// H5: workspace resolution + ownership verification before insert
		const workspace = await ctx.db
			.query("workspaces")
			.withIndex("by_owner_and_default", (q) =>
				q.eq("ownerId", user.clerkUserId).eq("isDefault", true),
			)
			.unique();
		if (!workspace) throw new Error("Workspace not found");

		return await ctx.db.insert("customPersonas", {
			name: args.name,
			icon: args.icon,
			description: args.description,
			traits: args.traits,
			communicationStyle: args.communicationStyle,
			decisionMaking: args.decisionMaking,
			systemPromptModifier: args.systemPromptModifier,
			isSystem: false,
			workspaceId: workspace._id,
			// createdBy stores Clerk user ID string — NOT Convex document ID
			createdBy: user.clerkUserId,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
	},
});

/**
 * Update an existing custom persona.
 * H4 OWNERSHIP CHECK: createdBy is Clerk user ID, compared against user.clerkUserId.
 * System personas cannot be mutated by users.
 */
export const update = mutation({
	args: {
		id: v.id("customPersonas"),
		name: v.optional(v.string()),
		icon: v.optional(v.string()),
		description: v.optional(v.string()),
		traits: v.optional(v.array(v.string())),
		communicationStyle: v.optional(v.string()),
		decisionMaking: v.optional(v.string()),
		systemPromptModifier: v.optional(v.string()),
	},
	returns: v.null(),
	handler: async (ctx, { id, ...updates }) => {
		const user = await requireAuth(ctx);

		// D5: server-side length validation on fields being updated
		if (updates.name !== undefined && updates.name.length > 200)
			throw new Error("Name must be 200 characters or less");
		if (updates.description !== undefined && updates.description.length > 5000)
			throw new Error("Description must be 5000 characters or less");

		const persona = await ctx.db.get(id);
		if (!persona) throw new Error("Custom persona not found");

		// System personas cannot be modified by users
		if (persona.isSystem) throw new Error("Forbidden");

		// H4 OWNERSHIP CHECK: createdBy is Clerk user ID, compare against user.clerkUserId
		if (persona.createdBy !== user.clerkUserId) {
			throw new Error("Forbidden");
		}

		const patch: Record<string, unknown> = { updatedAt: Date.now() };
		if (updates.name !== undefined) patch.name = updates.name;
		if (updates.icon !== undefined) patch.icon = updates.icon;
		if (updates.description !== undefined)
			patch.description = updates.description;
		if (updates.traits !== undefined) patch.traits = updates.traits;
		if (updates.communicationStyle !== undefined)
			patch.communicationStyle = updates.communicationStyle;
		if (updates.decisionMaking !== undefined)
			patch.decisionMaking = updates.decisionMaking;
		if (updates.systemPromptModifier !== undefined)
			patch.systemPromptModifier = updates.systemPromptModifier;

		await ctx.db.patch(id, patch);
		return null;
	},
});

/**
 * Delete a custom persona.
 * S1 FIX: system entities non-deletable. Ownership check for user entities.
 * H4 OWNERSHIP CHECK: createdBy is Clerk user ID, compared against user.clerkUserId.
 */
export const remove = mutation({
	args: { id: v.id("customPersonas") },
	returns: v.null(),
	handler: async (ctx, { id }) => {
		const user = await requireAuth(ctx);

		const persona = await ctx.db.get(id);
		if (!persona) throw new Error("Custom persona not found");

		// S1: system entities cannot be deleted by users
		if (persona.isSystem) throw new Error("Forbidden");

		// H4 OWNERSHIP CHECK: createdBy is Clerk user ID, compare against user.clerkUserId
		if (persona.createdBy !== user.clerkUserId) {
			throw new Error("Forbidden");
		}

		await ctx.db.delete(id);
		return null;
	},
});
