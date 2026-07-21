/**
 * Cascade resolution for per-team/agent/skill onboarding config approval
 * (Consultant onboarding "confirm config" screen — see onboarding-chat.tsx).
 *
 * LAYERING DECISION: this is a NEW, consultant-scoped pure module rather
 * than a generalization of `lib/architect/operation-selection.ts`. The two
 * live in different shapes on purpose:
 *   - architect's cascade is a `dependsOn` GRAPH (excluding an operation
 *     cascades to whatever depends on it, which can point anywhere).
 *   - consultant's cascade is a fixed three-level TREE (team -> agent ->
 *     skill), and a skill can be shared by more than one agent, which the
 *     architect graph shape has no notion of at all.
 * Forcing both into one shared "selection" abstraction today (two call
 * sites, two incompatible cascade semantics) would either leak
 * architect-only concepts (dependsOn) into consultant code or leak
 * consultant-only concepts (tree levels, shared-skill ownership) into
 * architect code. A consultant-scoped module mirroring the architect one
 * (same shape: `resolve*`, `toggle*`, `filter*`) is the lighter correct
 * option — it keeps each domain's cascade rule legible on its own, and
 * still gives a future third caller an obvious two-example pattern to
 * generalize from if the need actually arises.
 *
 * DEPENDENCY-EDGE DECISION (tree, not graph): deselecting a team cascades
 * to every agent on that team; deselecting an agent cascades to every
 * skill used ONLY by that agent (a skill shared with another,
 * still-included agent is NOT force-excluded — it is still needed).
 * Cascaded exclusions are BLOCKED: the user cannot manually re-include an
 * agent/skill while its excluding parent is still excluded, mirroring the
 * architect rule and for the same reason — re-including a blocked leaf
 * without first re-including its parent would produce an inconsistent
 * selection (an agent selected on a deselected team, a skill selected on a
 * deselected agent).
 */

export interface SelectableAgentNode {
	agentId: string;
	/** Skill ids used by this agent. */
	skillIds: string[];
}

export interface SelectableTeamNode {
	teamId: string;
	agents: SelectableAgentNode[];
}

export interface ConsultantSelectionResult {
	/** All teams excluded (always == manuallyExcludedTeamIds; teams have no parent). */
	excludedTeamIds: Set<string>;
	/** All agents excluded, manual + cascaded from an excluded team. */
	excludedAgentIds: Set<string>;
	/** All skills excluded, manual + cascaded from an excluded agent. */
	excludedSkillIds: Set<string>;
	/** Agents excluded ONLY because their team was excluded — cannot be manually re-checked. */
	blockedAgentIds: Set<string>;
	/**
	 * Skills excluded ONLY because every agent using them was excluded
	 * (manually or via cascade) — cannot be manually re-checked.
	 */
	blockedSkillIds: Set<string>;
}

/**
 * Resolves the effective excluded team/agent/skill sets given the user's
 * manual unchecks, expanding cascades down the team -> agent -> skill tree.
 *
 * A skill is only cascade-excluded when NONE of the agents that use it
 * remain included — a skill shared across two agents on the same or
 * different teams stays available as long as at least one owning agent is
 * still selected.
 */
export function resolveConsultantSelection(
	teams: readonly SelectableTeamNode[],
	manuallyExcludedTeamIds: ReadonlySet<string>,
	manuallyExcludedAgentIds: ReadonlySet<string>,
	manuallyExcludedSkillIds: ReadonlySet<string>,
): ConsultantSelectionResult {
	const excludedTeamIds = new Set(manuallyExcludedTeamIds);

	const excludedAgentIds = new Set(manuallyExcludedAgentIds);
	const blockedAgentIds = new Set<string>();
	for (const team of teams) {
		if (!excludedTeamIds.has(team.teamId)) continue;
		for (const agent of team.agents) {
			if (!excludedAgentIds.has(agent.agentId)) {
				blockedAgentIds.add(agent.agentId);
			}
			excludedAgentIds.add(agent.agentId);
		}
	}

	// Map every skill id to the agents that use it, so a shared skill is
	// only cascade-excluded once ALL of its owning agents are excluded.
	const skillOwners = new Map<string, string[]>();
	for (const team of teams) {
		for (const agent of team.agents) {
			for (const skillId of agent.skillIds) {
				const owners = skillOwners.get(skillId) ?? [];
				owners.push(agent.agentId);
				skillOwners.set(skillId, owners);
			}
		}
	}

	const excludedSkillIds = new Set(manuallyExcludedSkillIds);
	const blockedSkillIds = new Set<string>();
	for (const [skillId, owners] of skillOwners) {
		const allOwnersExcluded = owners.every((agentId) =>
			excludedAgentIds.has(agentId),
		);
		if (!allOwnersExcluded) continue;
		if (!excludedSkillIds.has(skillId)) {
			blockedSkillIds.add(skillId);
		}
		excludedSkillIds.add(skillId);
	}

	return {
		excludedTeamIds,
		excludedAgentIds,
		excludedSkillIds,
		blockedAgentIds,
		blockedSkillIds,
	};
}

/** Toggles a team's manual exclusion. Teams have no parent — never blocked. */
export function toggleTeamExclusion(
	manuallyExcludedTeamIds: ReadonlySet<string>,
	teamId: string,
): Set<string> {
	const next = new Set(manuallyExcludedTeamIds);
	if (next.has(teamId)) {
		next.delete(teamId);
	} else {
		next.add(teamId);
	}
	return next;
}

/**
 * Toggles an agent's manual exclusion. Returns the SAME contents (a new
 * Set instance, unchanged) when the agent is currently cascade-blocked by
 * its team — mirrors `toggleOperationExclusion` in
 * lib/architect/operation-selection.ts: the UI's disabled checkbox already
 * prevents a user click from ever reaching this branch (Base UI's
 * `disabled` swallows the click before `onCheckedChange` fires), so this
 * guard is reachable ONLY via a direct unit test call, never via a
 * simulated click.
 */
export function toggleAgentExclusion(
	teams: readonly SelectableTeamNode[],
	manuallyExcludedTeamIds: ReadonlySet<string>,
	manuallyExcludedAgentIds: ReadonlySet<string>,
	agentId: string,
): Set<string> {
	const { blockedAgentIds } = resolveConsultantSelection(
		teams,
		manuallyExcludedTeamIds,
		manuallyExcludedAgentIds,
		new Set(),
	);
	if (blockedAgentIds.has(agentId)) return new Set(manuallyExcludedAgentIds);

	const next = new Set(manuallyExcludedAgentIds);
	if (next.has(agentId)) {
		next.delete(agentId);
	} else {
		next.add(agentId);
	}
	return next;
}

/**
 * Toggles a skill's manual exclusion. Same blocked-guard shape as
 * `toggleAgentExclusion` — reachable only via a direct unit test call when
 * the skill is cascade-excluded by every one of its owning agents.
 */
export function toggleSkillExclusion(
	teams: readonly SelectableTeamNode[],
	manuallyExcludedTeamIds: ReadonlySet<string>,
	manuallyExcludedAgentIds: ReadonlySet<string>,
	manuallyExcludedSkillIds: ReadonlySet<string>,
	skillId: string,
): Set<string> {
	const { blockedSkillIds } = resolveConsultantSelection(
		teams,
		manuallyExcludedTeamIds,
		manuallyExcludedAgentIds,
		manuallyExcludedSkillIds,
	);
	if (blockedSkillIds.has(skillId)) return new Set(manuallyExcludedSkillIds);

	const next = new Set(manuallyExcludedSkillIds);
	if (next.has(skillId)) {
		next.delete(skillId);
	} else {
		next.add(skillId);
	}
	return next;
}

/**
 * Filters the flat extracted id arrays (as produced by
 * `extractConfigSpec` in onboarding-chat.tsx) down to the ones NOT
 * excluded — this is what actually gets sent to `updateProject`, replacing
 * the previous verbatim-forward of the whole extraction.
 */
export function filterConsultantSelection(
	extracted: {
		selectedTeamIds: string[];
		selectedAgentIds: string[];
		selectedSkillIds: string[];
	},
	excludedTeamIds: ReadonlySet<string>,
	excludedAgentIds: ReadonlySet<string>,
	excludedSkillIds: ReadonlySet<string>,
): {
	selectedTeamIds: string[];
	selectedAgentIds: string[];
	selectedSkillIds: string[];
} {
	return {
		selectedTeamIds: extracted.selectedTeamIds.filter(
			(id) => !excludedTeamIds.has(id),
		),
		selectedAgentIds: extracted.selectedAgentIds.filter(
			(id) => !excludedAgentIds.has(id),
		),
		selectedSkillIds: extracted.selectedSkillIds.filter(
			(id) => !excludedSkillIds.has(id),
		),
	};
}
