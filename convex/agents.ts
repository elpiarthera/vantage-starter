/**
 * Agents — CRUD + listForAssignment + generateToken + rotateToken
 *
 * Ported from vantage-studio/convex/agents.ts.
 * Auth adaptation (Phase 0.5):
 *   - clerkId → clerkUserId
 *   - by_clerk_id → by_clerk_user_id
 *   - activeWorkspaceId removed — workspace passed explicitly or resolved from ownerId
 * Extended for Phase 2:
 *   - roleId/personaId/frameworkId: now typed v.id() — must match schema
 *   - generateToken: new mutation — generates 32-byte hex token, returns token plaintext once
 *   - rotateToken: new mutation — replaces existing token, returns new token plaintext once
 *   - getById: internal query — used by agentAuth.ts (Phase 4)
 * Token storage: plain text in DB (Convex at-rest encrypted; hashing post-MVP — see ORCHESTRATION-PLAN.md H1).
 */

import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import { requireAuthWithWorkspace } from "./lib/auth";

// ============================================================================
// HELPER: Resolve user + workspace (query/mutation ctx)
// Returns null if not authenticated.
// ============================================================================

async function getUserWorkspace(
	ctx: Parameters<typeof requireAuthWithWorkspace>[0],
	workspaceId?: import("./_generated/dataModel").Id<"workspaces">,
) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) return null;

	const user = await ctx.db
		.query("users")
		.withIndex("by_clerk_user_id", (q) =>
			q.eq("clerkUserId", identity.subject),
		)
		.unique();

	if (!user) return null;

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
 * List all agents available to the current workspace.
 * Returns workspace-specific agents + global system agents (both active only).
 */
export const list = query({
	args: { workspaceId: v.optional(v.id("workspaces")) },
	handler: async (ctx, args) => {
		const result = await getUserWorkspace(ctx, args.workspaceId);
		if (!result) return [];

		const workspaceAgents = await ctx.db
			.query("agents")
			.withIndex("by_workspace", (q) =>
				q.eq("workspaceId", result.workspaceId),
			)
			.filter((q) => q.eq(q.field("isActive"), true))
			.collect();

		const systemAgents = await ctx.db
			.query("agents")
			.withIndex("by_system", (q) => q.eq("isSystem", true))
			.filter((q) => q.eq(q.field("isActive"), true))
			.collect();

		return [...systemAgents, ...workspaceAgents];
	},
});

/**
 * Get a single agent by ID, with resolved skills.
 */
export const get = query({
	args: { agentId: v.id("agents") },
	handler: async (ctx, args) => {
		const agent = await ctx.db.get(args.agentId);
		if (!agent) return null;

		const skills = await Promise.all(
			agent.skillIds.map((skillId) => ctx.db.get(skillId)),
		);

		return {
			...agent,
			skills: skills.filter(Boolean),
		};
	},
});

export const listSystem = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db
			.query("agents")
			.withIndex("by_system", (q) => q.eq("isSystem", true))
			.filter((q) => q.eq(q.field("isActive"), true))
			.collect();
	},
});

/**
 * Get agents for assignment dropdown — minimal fields only.
 */
export const listForAssignment = query({
	args: { workspaceId: v.optional(v.id("workspaces")) },
	handler: async (ctx, args) => {
		const result = await getUserWorkspace(ctx, args.workspaceId);
		if (!result) return [];

		const workspaceAgents = await ctx.db
			.query("agents")
			.withIndex("by_workspace", (q) =>
				q.eq("workspaceId", result.workspaceId),
			)
			.filter((q) => q.eq(q.field("isActive"), true))
			.collect();

		const systemAgents = await ctx.db
			.query("agents")
			.withIndex("by_system", (q) => q.eq("isSystem", true))
			.filter((q) => q.eq(q.field("isActive"), true))
			.collect();

		return [...systemAgents, ...workspaceAgents].map((agent) => ({
			_id: agent._id,
			name: agent.name,
			roleName: agent.roleName,
			avatar: agent.avatar,
			isSystem: agent.isSystem,
		}));
	},
});

/**
 * Internal query — used by agentAuth.ts (Phase 4) to validate per-agent tokens.
 * Not exposed to clients.
 */
export const getById = internalQuery({
	args: { agentId: v.id("agents") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.agentId);
	},
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new agent.
 * roleId/personaId/frameworkId are now typed v.id() — enforces FK integrity.
 */
export const create = mutation({
	args: {
		workspaceId: v.id("workspaces"),
		name: v.string(),
		description: v.optional(v.string()),
		avatar: v.optional(v.string()),
		// 4-Pillars — typed IDs (pre-build blocker #4)
		roleId: v.id("customRoles"),
		roleName: v.string(),
		roleSystemPrompt: v.string(),
		personaId: v.id("customPersonas"),
		personaName: v.string(),
		personaModifier: v.string(),
		frameworkId: v.optional(v.id("customFrameworks")),
		frameworkName: v.optional(v.string()),
		frameworkModifier: v.optional(v.string()),
		skillIds: v.array(v.id("skills")),
		model: v.string(),
		provider: v.string(),
		customInstructions: v.optional(v.string()),
		temperature: v.optional(v.number()),
		maxTokens: v.optional(v.number()),
		visibility: v.union(v.literal("private"), v.literal("workspace")),
	},
	handler: async (ctx, args) => {
		const { user } = await requireAuthWithWorkspace(ctx, args.workspaceId);

		const now = Date.now();

		const agentId = await ctx.db.insert("agents", {
			workspaceId: args.workspaceId,
			createdBy: user.clerkUserId,
			name: args.name,
			description: args.description,
			avatar: args.avatar,
			roleId: args.roleId,
			roleName: args.roleName,
			roleSystemPrompt: args.roleSystemPrompt,
			personaId: args.personaId,
			personaName: args.personaName,
			personaModifier: args.personaModifier,
			frameworkId: args.frameworkId,
			frameworkName: args.frameworkName,
			frameworkModifier: args.frameworkModifier,
			skillIds: args.skillIds,
			model: args.model,
			provider: args.provider,
			customInstructions: args.customInstructions,
			temperature: args.temperature,
			maxTokens: args.maxTokens,
			isSystem: false,
			isActive: true,
			usageCount: 0,
			visibility: args.visibility,
			createdAt: now,
			updatedAt: now,
		});

		return agentId;
	},
});

export const update = mutation({
	args: {
		agentId: v.id("agents"),
		name: v.optional(v.string()),
		description: v.optional(v.string()),
		avatar: v.optional(v.string()),
		roleId: v.optional(v.id("customRoles")),
		roleName: v.optional(v.string()),
		roleSystemPrompt: v.optional(v.string()),
		personaId: v.optional(v.id("customPersonas")),
		personaName: v.optional(v.string()),
		personaModifier: v.optional(v.string()),
		frameworkId: v.optional(v.id("customFrameworks")),
		frameworkName: v.optional(v.string()),
		frameworkModifier: v.optional(v.string()),
		skillIds: v.optional(v.array(v.id("skills"))),
		model: v.optional(v.string()),
		provider: v.optional(v.string()),
		customInstructions: v.optional(v.string()),
		temperature: v.optional(v.number()),
		maxTokens: v.optional(v.number()),
		visibility: v.optional(
			v.union(v.literal("private"), v.literal("workspace")),
		),
		isActive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const { agentId, ...updates } = args;

		const agent = await ctx.db.get(agentId);
		if (!agent) throw new Error("Agent not found");

		if (agent.isSystem) {
			throw new Error("Cannot modify system agents");
		}

		const cleanUpdates = Object.fromEntries(
			Object.entries(updates).filter(([, v]) => v !== undefined),
		);

		await ctx.db.patch(agentId, {
			...cleanUpdates,
			updatedAt: Date.now(),
		});

		return agentId;
	},
});

/**
 * Soft delete — sets isActive = false.
 */
export const remove = mutation({
	args: { agentId: v.id("agents") },
	handler: async (ctx, args) => {
		const agent = await ctx.db.get(args.agentId);
		if (!agent) throw new Error("Agent not found");

		if (agent.isSystem) {
			throw new Error("Cannot delete system agents");
		}

		await ctx.db.patch(args.agentId, {
			isActive: false,
			updatedAt: Date.now(),
		});
	},
});

export const incrementUsage = mutation({
	args: { agentId: v.id("agents") },
	handler: async (ctx, args) => {
		const agent = await ctx.db.get(args.agentId);
		if (!agent) return;

		await ctx.db.patch(args.agentId, {
			usageCount: agent.usageCount + 1,
			updatedAt: Date.now(),
		});
	},
});

// ============================================================================
// TOKEN MUTATIONS (Phase 2 extension — not in vantage-studio)
// Token is returned plaintext ONCE. Not retrievable afterwards.
// Storage: plain text (Convex DB at-rest encrypted; hashing post-MVP — see H1 in ORCHESTRATION-PLAN.md).
// ============================================================================

/**
 * Generate a token for an existing agent that has none.
 * Returns the token plaintext — show once, not retrievable.
 */
export const generateToken = mutation({
	args: { agentId: v.id("agents") },
	handler: async (ctx, args) => {
		const agent = await ctx.db.get(args.agentId);
		if (!agent) throw new Error("Agent not found");

		if (agent.isSystem) {
			throw new Error("Cannot generate token for system agents");
		}

		// Generate 32-byte hex token (64 chars)
		const tokenBytes = new Uint8Array(32);
		crypto.getRandomValues(tokenBytes);
		const token = Array.from(tokenBytes)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");

		await ctx.db.patch(args.agentId, {
			token,
			tokenCreatedAt: Date.now(),
			updatedAt: Date.now(),
		});

		return { token }; // Printed once — not retrievable again
	},
});

/**
 * Rotate the token for an agent — invalidates the previous token immediately.
 * Returns the new token plaintext — show once, not retrievable.
 */
export const rotateToken = mutation({
	args: { agentId: v.id("agents") },
	handler: async (ctx, args) => {
		const agent = await ctx.db.get(args.agentId);
		if (!agent) throw new Error("Agent not found");

		if (agent.isSystem) {
			throw new Error("Cannot rotate token for system agents");
		}

		const tokenBytes = new Uint8Array(32);
		crypto.getRandomValues(tokenBytes);
		const token = Array.from(tokenBytes)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");

		await ctx.db.patch(args.agentId, {
			token,
			tokenCreatedAt: Date.now(),
			updatedAt: Date.now(),
		});

		return { token }; // Printed once — not retrievable again
	},
});
