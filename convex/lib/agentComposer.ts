/**
 * 4-Pillars agent system prompt composer.
 *
 * MUST be an internalQuery — not a plain async function.
 *
 * Reason: this is called from httpAction handlers (ActionCtx).
 * Plain functions are not callable across the action/query boundary.
 * Expose as internalQuery, call via:
 *
 *   const systemPrompt = await ctx.runQuery(
 *     internal.lib.agentComposer.composeAgentSystemPrompt,
 *     { agentId: agent._id }
 *   );
 *
 * Composition order (4-Pillars):
 *   1. Role system prompt   — professional identity and domain expertise
 *   2. Persona modifier     — communication style and decision-making patterns
 *   3. Framework modifier   — thinking methodology (optional)
 *   4. Skills content       — reusable capability instructions
 *   5. Custom instructions  — agent-specific overrides (optional)
 */

import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

export const composeAgentSystemPrompt = internalQuery({
	args: { agentId: v.id("agents") },
	returns: v.string(),
	handler: async (ctx, { agentId }): Promise<string> => {
		const agent = await ctx.db.get(agentId);
		if (!agent) {
			throw new Error(`Agent not found: ${agentId}`);
		}

		// Pillar 1 — Role: professional identity and domain expertise
		let prompt = agent.roleSystemPrompt;

		// Pillar 2 — Persona: communication style and decision-making patterns
		prompt += `\n\n## Communication Style\n${agent.personaModifier}`;

		// Pillar 3 — Framework: thinking methodology (optional)
		if (agent.frameworkModifier) {
			prompt += `\n\n## Thinking Methodology\n${agent.frameworkModifier}`;
		}

		// Pillar 4 — Skills: reusable capability instructions
		if (agent.skillIds.length > 0) {
			const skillDocs = await Promise.all(
				agent.skillIds.map((id) => ctx.db.get(id)),
			);
			// Filter out any null results (deleted skills)
			const activeSkills = skillDocs.filter(
				(s): s is NonNullable<typeof s> => s !== null,
			);

			if (activeSkills.length > 0) {
				prompt += `\n\n## Capabilities\n`;
				prompt += activeSkills
					.map((s) => s.instructions)
					.join("\n\n---\n\n");
			}
		}

		// Agent-specific overrides (last — highest precedence)
		if (agent.customInstructions) {
			prompt += `\n\n## Custom Instructions\n${agent.customInstructions}`;
		}

		return prompt;
	},
});
