/**
 * Registry — vantage-registry proxy queries
 *
 * Queries the registryTeams, registryAgents, and registrySkills tables that are
 * populated by seedRegistry (convex/seed/seedRegistry.ts).
 *
 * All queries require authentication. The registry is read-only from the client.
 *
 * Pain → team recommendation is done server-side using PAIN_MAPPINGS so the
 * client never needs to ship the full mapping table.
 */

import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireAuth } from "./lib/auth";
import { PAIN_MAPPINGS } from "../lib/registry/types";

// ============================================================================
// RETURN TYPE VALIDATORS
// ============================================================================

const teamValidator = v.object({
	_id: v.id("registryTeams"),
	teamId: v.string(),
	name: v.string(),
	description: v.string(),
	category: v.union(
		v.literal("marketing"),
		v.literal("sales"),
		v.literal("engineering"),
		v.literal("operations"),
		v.literal("support"),
		v.literal("analytics"),
	),
	agentIds: v.array(v.string()),
	skillIds: v.array(v.string()),
});

const agentValidator = v.object({
	_id: v.id("registryAgents"),
	agentId: v.string(),
	name: v.string(),
	role: v.string(),
	description: v.string(),
	skills: v.array(v.string()),
	teamId: v.string(),
	persona: v.optional(v.string()),
});

const skillValidator = v.object({
	_id: v.id("registrySkills"),
	skillId: v.string(),
	name: v.string(),
	description: v.string(),
	category: v.string(),
	agentId: v.optional(v.string()),
	teamId: v.optional(v.string()),
});

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List all registry teams.
 * Optionally filter by category.
 */
export const listTeams = query({
	args: {
		category: v.optional(
			v.union(
				v.literal("marketing"),
				v.literal("sales"),
				v.literal("engineering"),
				v.literal("operations"),
				v.literal("support"),
				v.literal("analytics"),
			),
		),
	},
	returns: v.array(teamValidator),
	handler: async (ctx, args) => {
		await requireAuth(ctx);

		if (args.category !== undefined) {
			return await ctx.db
				.query("registryTeams")
				.withIndex("by_category", (q) => q.eq("category", args.category!))
				.collect();
		}

		return await ctx.db.query("registryTeams").collect();
	},
});

/**
 * Get a single team by its stable slug ID.
 */
export const getTeam = query({
	args: { teamId: v.string() },
	returns: v.union(teamValidator, v.null()),
	handler: async (ctx, args) => {
		await requireAuth(ctx);

		return await ctx.db
			.query("registryTeams")
			.withIndex("by_team_id", (q) => q.eq("teamId", args.teamId))
			.unique();
	},
});

/**
 * List all agents belonging to a team.
 */
export const listAgentsByTeam = query({
	args: { teamId: v.string() },
	returns: v.array(agentValidator),
	handler: async (ctx, args) => {
		await requireAuth(ctx);

		return await ctx.db
			.query("registryAgents")
			.withIndex("by_team", (q) => q.eq("teamId", args.teamId))
			.collect();
	},
});

/**
 * List all skills belonging to a team.
 */
export const listSkillsByTeam = query({
	args: { teamId: v.string() },
	returns: v.array(skillValidator),
	handler: async (ctx, args) => {
		await requireAuth(ctx);

		return await ctx.db
			.query("registrySkills")
			.withIndex("by_team", (q) => q.eq("teamId", args.teamId))
			.collect();
	},
});

/**
 * Get recommendations for a set of pain IDs.
 *
 * Maps each pain through PAIN_MAPPINGS → deduplicated team IDs →
 * loads teams + agents + skills from DB.
 *
 * Returns teams sorted by priority (high first), with their agents and skills
 * pre-loaded. The consultant onboarding UI renders this directly.
 */
export const getRecommendationsForPains = query({
	args: {
		painIds: v.array(v.string()),
	},
	returns: v.array(
		v.object({
			team: teamValidator,
			agents: v.array(agentValidator),
			skills: v.array(skillValidator),
			matchedPains: v.array(v.string()),
			priority: v.union(
				v.literal("high"),
				v.literal("medium"),
				v.literal("low"),
			),
		}),
	),
	handler: async (ctx, args) => {
		await requireAuth(ctx);

		if (args.painIds.length === 0) {
			return [];
		}
		if (args.painIds.length > 20) {
			throw new Error("Too many painIds (max 20)");
		}

		// Build a map: teamId → { matchedPains, highestPriority }
		const teamScores = new Map<
			string,
			{ matchedPains: string[]; priority: "high" | "medium" | "low" }
		>();

		const priorityRank = { high: 2, medium: 1, low: 0 } as const;

		for (const painId of args.painIds) {
			const mapping = PAIN_MAPPINGS.find((m) => m.pain === painId);
			if (!mapping) continue;

			for (const teamId of mapping.recommendedTeams) {
				const existing = teamScores.get(teamId);
				if (!existing) {
					teamScores.set(teamId, {
						matchedPains: [painId],
						priority: mapping.priority,
					});
				} else {
					existing.matchedPains.push(painId);
					// Upgrade priority if this mapping has a higher one
					if (priorityRank[mapping.priority] > priorityRank[existing.priority]) {
						existing.priority = mapping.priority;
					}
				}
			}
		}

		if (teamScores.size === 0) {
			return [];
		}

		// Load teams from DB in parallel
		const teamEntries = Array.from(teamScores.entries());
		const teamDocs = await Promise.all(
			teamEntries.map(([teamId]) =>
				ctx.db
					.query("registryTeams")
					.withIndex("by_team_id", (q) => q.eq("teamId", teamId))
					.unique(),
			),
		);

		// For each found team, load its agents and skills
		const results = await Promise.all(
			teamDocs
				.filter((team): team is NonNullable<typeof team> => team !== null)
				.map(async (team) => {
					const score = teamScores.get(team.teamId)!;

					const [agents, skills] = await Promise.all([
						ctx.db
							.query("registryAgents")
							.withIndex("by_team", (q) => q.eq("teamId", team.teamId))
							.collect(),
						ctx.db
							.query("registrySkills")
							.withIndex("by_team", (q) => q.eq("teamId", team.teamId))
							.collect(),
					]);

					return {
						team,
						agents,
						skills,
						matchedPains: score.matchedPains,
						priority: score.priority,
					};
				}),
		);

		// Sort: high priority first, then by number of matched pains (desc)
		return results.sort((a, b) => {
			const pd = priorityRank[b.priority] - priorityRank[a.priority];
			if (pd !== 0) return pd;
			return b.matchedPains.length - a.matchedPains.length;
		});
	},
});

/**
 * List all skills, optionally filtered by category.
 */
export const listSkills = query({
	args: {
		category: v.optional(v.string()),
	},
	returns: v.array(skillValidator),
	handler: async (ctx, args) => {
		await requireAuth(ctx);

		if (args.category !== undefined) {
			return await ctx.db
				.query("registrySkills")
				.withIndex("by_category", (q) => q.eq("category", args.category!))
				.collect();
		}

		return await ctx.db.query("registrySkills").collect();
	},
});
