/**
 * Credit Costs Seed — populate creditCosts table with default action type costs
 *
 * Seeds all known AI action types with their credit costs.
 * Idempotent: every insert is guarded by an actionType lookup.
 * Run via:
 *   npx convex run seed/seedCreditCosts:seedCreditCosts
 *
 * Design: actionType slugs are stable — the AI routes reference them directly.
 * Do not rename slugs without updating callers in convex/http/ai.ts.
 */

import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

// ============================================================================
// SEED DATA
// ============================================================================

type CreditCostSeed = {
	actionType: string;
	displayName: string;
	credits: number;
	description: string;
	category: "chat" | "image" | "video" | "audio" | "analysis" | "onboarding";
};

const CREDIT_COST_SEED: CreditCostSeed[] = [
	// -------------------------------------------------------------------------
	// CHAT — conversational AI
	// -------------------------------------------------------------------------
	{
		actionType: "chat_message",
		displayName: "Chat Message",
		credits: 1,
		description: "One AI chat turn (user message + assistant response).",
		category: "chat",
	},
	{
		actionType: "architect_chat",
		displayName: "Architect Chat Message",
		credits: 2,
		description:
			"One message in an Architect session (mission planning, structured output).",
		category: "chat",
	},

	// -------------------------------------------------------------------------
	// ANALYSIS — structured outputs and reports
	// -------------------------------------------------------------------------
	{
		actionType: "mission_create",
		displayName: "Mission Creation",
		credits: 3,
		description:
			"Generate a full mission plan with operations, checkpoints, and success criteria.",
		category: "analysis",
	},
	{
		actionType: "competitor_analysis",
		displayName: "Competitor Analysis",
		credits: 3,
		description:
			"Analyse a competitor website and extract positioning, pricing, and offers.",
		category: "analysis",
	},
	{
		actionType: "brand_kit_extraction",
		displayName: "Brand Kit Extraction",
		credits: 2,
		description:
			"Extract brand name, tagline, colors, products, and tech stack from a website.",
		category: "analysis",
	},

	// -------------------------------------------------------------------------
	// ONBOARDING — consultant onboarding flow
	// -------------------------------------------------------------------------
	{
		actionType: "consultant_onboard",
		displayName: "Consultant Onboarding",
		credits: 5,
		description:
			"Full consultant onboarding: pain discovery, registry mapping, and .claude/ config generation.",
		category: "onboarding",
	},
];

// ============================================================================
// SEED MUTATION
// ============================================================================

export const seedCreditCosts = internalMutation({
	args: {},
	returns: v.object({
		created: v.number(),
		skipped: v.number(),
	}),
	handler: async (ctx) => {
		const now = Date.now();
		let created = 0;
		let skipped = 0;

		for (const seed of CREDIT_COST_SEED) {
			const existing = await ctx.db
				.query("creditCosts")
				.withIndex("by_action_type", (q) => q.eq("actionType", seed.actionType))
				.unique();

			if (!existing) {
				await ctx.db.insert("creditCosts", {
					actionType: seed.actionType,
					displayName: seed.displayName,
					credits: seed.credits,
					description: seed.description,
					category: seed.category,
					isActive: true,
					updatedAt: now,
				});
				created++;
			} else {
				skipped++;
			}
		}

		return { created, skipped };
	},
});
