/**
 * Consultant Projects — CRUD for the Consultant Onboarding App.
 *
 * Tables: consultantProjects
 * Auth: requireAuth / requireAuthWithWorkspace from ./lib/auth
 *
 * Public functions (client-facing):
 *   create, get, list, update, updateStatus, addCompetitor
 *
 * Internal functions (called by scrape actions):
 *   updateBrandKit, updateCompetitorProfile
 */

import { v } from "convex/values";
import { normalizeUrl } from "../lib/validation/url";
import {
	internalMutation,
	internalQuery,
	mutation,
	query,
} from "./_generated/server";
import { requireAuth, requireAuthWithWorkspace } from "./lib/auth";

// ============================================================================
// VALIDATORS
// ============================================================================

const competitorValidator = v.object({
	name: v.string(),
	url: v.string(),
	positioning: v.optional(v.string()),
	pricing: v.optional(v.string()),
	offers: v.optional(v.string()),
	differentiators: v.optional(v.string()),
	scrapedAt: v.optional(v.number()),
	error: v.optional(v.string()),
});

const projectStatusValidator = v.union(
	v.literal("created"),
	v.literal("scraping"),
	v.literal("competitors"),
	v.literal("discovery"),
	v.literal("review"),
	v.literal("deployed"),
);

const projectOutputValidator = v.object({
	_id: v.id("consultantProjects"),
	_creationTime: v.number(),
	workspaceId: v.id("workspaces"),
	name: v.string(),
	clientName: v.string(),
	clientWebsiteUrl: v.string(),
	sector: v.string(),
	brandKit: v.optional(v.any()),
	competitors: v.optional(v.array(competitorValidator)),
	knowledgeBase: v.optional(v.any()),
	sessionId: v.optional(v.id("architectSessions")),
	config: v.optional(v.any()),
	status: projectStatusValidator,
	selectedTeams: v.optional(v.array(v.string())),
	selectedAgents: v.optional(v.array(v.string())),
	selectedSkills: v.optional(v.array(v.string())),
	createdBy: v.string(),
	createdAt: v.number(),
	updatedAt: v.number(),
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new consultant project.
 * Auth: workspace member or owner.
 */
export const create = mutation({
	args: {
		workspaceId: v.id("workspaces"),
		name: v.string(),
		clientName: v.string(),
		clientWebsiteUrl: v.string(),
		sector: v.string(),
	},
	returns: v.id("consultantProjects"),
	handler: async (ctx, args) => {
		const { user } = await requireAuthWithWorkspace(ctx, args.workspaceId);

		// Validate string lengths
		if (args.name.length > 200) throw new Error("Name too long (max 200)");
		if (args.clientName.length > 200)
			throw new Error("Client name too long (max 200)");
		if (args.sector.length > 100) throw new Error("Sector too long (max 100)");

		// Normalize (add scheme if missing) then validate URL format
		let clientWebsiteUrl: string;
		try {
			clientWebsiteUrl = normalizeUrl(args.clientWebsiteUrl);
		} catch {
			throw new Error("Invalid clientWebsiteUrl: must be a valid URL");
		}

		const now = Date.now();
		return await ctx.db.insert("consultantProjects", {
			workspaceId: args.workspaceId,
			name: args.name.trim(),
			clientName: args.clientName.trim(),
			clientWebsiteUrl,
			sector: args.sector.trim(),
			status: "created",
			createdBy: user.clerkUserId,
			createdAt: now,
			updatedAt: now,
		});
	},
});

/**
 * Update mutable fields on a project.
 * Auth: project creator only.
 */
export const update = mutation({
	args: {
		projectId: v.id("consultantProjects"),
		name: v.optional(v.string()),
		clientName: v.optional(v.string()),
		clientWebsiteUrl: v.optional(v.string()),
		sector: v.optional(v.string()),
		sessionId: v.optional(v.id("architectSessions")),
		config: v.optional(v.any()),
		selectedTeams: v.optional(v.array(v.string())),
		selectedAgents: v.optional(v.array(v.string())),
		selectedSkills: v.optional(v.array(v.string())),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);

		const project = await ctx.db.get(args.projectId);
		if (!project) {
			throw new Error("Project not found");
		}
		if (project.createdBy !== user.clerkUserId) {
			throw new Error("Forbidden: only the project creator can update it");
		}

		// Normalize (add scheme if missing) then validate URL if provided
		let normalizedWebsiteUrl: string | undefined;
		if (args.clientWebsiteUrl !== undefined) {
			try {
				normalizedWebsiteUrl = normalizeUrl(args.clientWebsiteUrl);
			} catch {
				throw new Error("Invalid clientWebsiteUrl: must be a valid URL");
			}
		}

		const patch: Record<string, unknown> = { updatedAt: Date.now() };
		if (args.name !== undefined) patch.name = args.name.trim();
		if (args.clientName !== undefined)
			patch.clientName = args.clientName.trim();
		if (normalizedWebsiteUrl !== undefined)
			patch.clientWebsiteUrl = normalizedWebsiteUrl;
		if (args.sector !== undefined) patch.sector = args.sector.trim();
		if (args.sessionId !== undefined) patch.sessionId = args.sessionId;
		if (args.config !== undefined) patch.config = args.config;
		if (args.selectedTeams !== undefined)
			patch.selectedTeams = args.selectedTeams;
		if (args.selectedAgents !== undefined)
			patch.selectedAgents = args.selectedAgents;
		if (args.selectedSkills !== undefined)
			patch.selectedSkills = args.selectedSkills;

		await ctx.db.patch(args.projectId, patch);
		return null;
	},
});

/**
 * Transition a project's status.
 * Auth: project creator only.
 */
export const updateStatus = mutation({
	args: {
		projectId: v.id("consultantProjects"),
		status: projectStatusValidator,
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);

		const project = await ctx.db.get(args.projectId);
		if (!project) {
			throw new Error("Project not found");
		}
		if (project.createdBy !== user.clerkUserId) {
			throw new Error("Forbidden: only the project creator can update status");
		}

		const VALID_TRANSITIONS: Record<string, string[]> = {
			created: ["scraping"],
			scraping: ["competitors", "discovery"],
			competitors: ["discovery"],
			discovery: ["review"],
			review: ["deployed"],
		};
		const allowed = VALID_TRANSITIONS[project.status];
		if (!allowed?.includes(args.status)) {
			throw new Error(
				`Invalid status transition: ${project.status} → ${args.status}`,
			);
		}

		await ctx.db.patch(args.projectId, {
			status: args.status,
			updatedAt: Date.now(),
		});
		return null;
	},
});

/**
 * Add a competitor entry to the project's competitors array.
 * Auth: project creator only.
 */
export const addCompetitor = mutation({
	args: {
		projectId: v.id("consultantProjects"),
		name: v.string(),
		url: v.string(),
	},
	returns: v.number(), // returns the index of the new competitor
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);

		const project = await ctx.db.get(args.projectId);
		if (!project) {
			throw new Error("Project not found");
		}
		if (project.createdBy !== user.clerkUserId) {
			throw new Error(
				"Forbidden: only the project creator can add competitors",
			);
		}

		// Normalize (add scheme if missing) then validate URL
		let competitorUrl: string;
		try {
			competitorUrl = normalizeUrl(args.url);
		} catch {
			throw new Error("Invalid competitor URL: must be a valid URL");
		}

		const existing = project.competitors ?? [];

		// Cap at 5 competitors
		if (existing.length >= 5) {
			throw new Error("Maximum 5 competitors allowed per project");
		}

		const updated = [
			...existing,
			{
				name: args.name.trim(),
				url: competitorUrl,
			},
		];

		await ctx.db.patch(args.projectId, {
			competitors: updated,
			updatedAt: Date.now(),
		});

		return updated.length - 1;
	},
});

// ============================================================================
// INTERNAL MUTATIONS (called by scrape actions)
// ============================================================================

/**
 * Store brand kit scraped from the client website.
 * Called by: convex/actions/scrapeClient.ts
 */
export const updateBrandKit = internalMutation({
	args: {
		projectId: v.id("consultantProjects"),
		brandKit: v.any(),
		knowledgeBase: v.optional(v.any()),
		status: projectStatusValidator,
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const project = await ctx.db.get(args.projectId);
		if (!project) {
			throw new Error("Project not found");
		}

		await ctx.db.patch(args.projectId, {
			brandKit: args.brandKit,
			knowledgeBase: args.knowledgeBase,
			status: args.status,
			updatedAt: Date.now(),
		});
		return null;
	},
});

/**
 * Update a competitor's scraped profile in the competitors array.
 * Called by: convex/actions/scrapeCompetitor.ts
 */
export const updateCompetitorProfile = internalMutation({
	args: {
		projectId: v.id("consultantProjects"),
		competitorIndex: v.number(),
		profile: v.object({
			positioning: v.optional(v.string()),
			pricing: v.optional(v.string()),
			offers: v.optional(v.string()),
			differentiators: v.optional(v.string()),
			scrapedAt: v.number(),
			error: v.optional(v.string()),
		}),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const project = await ctx.db.get(args.projectId);
		if (!project) {
			throw new Error("Project not found");
		}

		const competitors = project.competitors ?? [];
		if (
			args.competitorIndex < 0 ||
			args.competitorIndex >= competitors.length
		) {
			throw new Error(
				`Competitor index ${args.competitorIndex} out of bounds (${competitors.length} competitors)`,
			);
		}

		const updated = competitors.map((c, i) => {
			if (i !== args.competitorIndex) return c;
			return {
				...c,
				positioning: args.profile.positioning,
				pricing: args.profile.pricing,
				offers: args.profile.offers,
				differentiators: args.profile.differentiators,
				scrapedAt: args.profile.scrapedAt,
				error: args.profile.error,
			};
		});

		await ctx.db.patch(args.projectId, {
			competitors: updated,
			updatedAt: Date.now(),
		});
		return null;
	},
});

/**
 * Internal-only: return just createdBy + workspaceId for ownership checks.
 * Used by scrape actions to verify the caller owns the project before proceeding.
 * No auth check — callers are internal actions that already validated the user.
 */
export const getForOwnerCheck = internalQuery({
	args: { projectId: v.id("consultantProjects") },
	returns: v.union(
		v.object({
			createdBy: v.string(),
			workspaceId: v.id("workspaces"),
		}),
		v.null(),
	),
	handler: async (ctx, args) => {
		const project = await ctx.db.get(args.projectId);
		if (!project) return null;
		return { createdBy: project.createdBy, workspaceId: project.workspaceId };
	},
});

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get a single project by ID.
 * Auth: project creator or workspace member.
 */
export const get = query({
	args: { projectId: v.id("consultantProjects") },
	returns: v.union(projectOutputValidator, v.null()),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const project = await ctx.db.get(args.projectId);
		if (!project) return null;

		// Access check: must be the creator or a workspace member
		const workspace = await ctx.db.get(project.workspaceId);
		if (!workspace) return null;

		const isCreator = project.createdBy === identity.subject;
		const isOwner = workspace.ownerId === identity.subject;

		// Check org membership — mirrors the access logic in `list`
		let isOrgMember = false;
		if (!isCreator && !isOwner) {
			const user = await ctx.db
				.query("users")
				.withIndex("by_clerk_user_id", (q) =>
					q.eq("clerkUserId", identity.subject),
				)
				.unique();
			isOrgMember =
				!!workspace.organizationId &&
				!!user?.organizationId &&
				workspace.organizationId === user.organizationId;
		}

		if (!isCreator && !isOwner && !isOrgMember) return null;

		return project;
	},
});

/**
 * List all projects in a workspace, sorted by createdAt desc.
 * Auth: workspace member or owner.
 */
export const list = query({
	args: { workspaceId: v.id("workspaces") },
	returns: v.array(projectOutputValidator),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return [];

		const workspace = await ctx.db.get(args.workspaceId);
		if (!workspace) return [];

		// Access check: must be owner or org member
		const isOwner = workspace.ownerId === identity.subject;
		if (!isOwner) {
			// Check org membership via users table
			const user = await ctx.db
				.query("users")
				.withIndex("by_clerk_user_id", (q) =>
					q.eq("clerkUserId", identity.subject),
				)
				.unique();
			if (
				!user?.organizationId ||
				user.organizationId !== workspace.organizationId
			) {
				return [];
			}
		}

		return await ctx.db
			.query("consultantProjects")
			.withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
			.order("desc")
			.collect();
	},
});
