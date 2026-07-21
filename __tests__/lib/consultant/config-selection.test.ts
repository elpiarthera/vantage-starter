import {
	filterConsultantSelection,
	resolveConsultantSelection,
	toggleAgentExclusion,
	toggleSkillExclusion,
	toggleTeamExclusion,
} from "@/lib/consultant/config-selection";

const teams = [
	{
		teamId: "team1",
		agents: [
			{ agentId: "agent1", skillIds: ["skillA", "skillShared"] },
			{ agentId: "agent2", skillIds: ["skillB"] },
		],
	},
	{
		teamId: "team2",
		agents: [{ agentId: "agent3", skillIds: ["skillShared", "skillC"] }],
	},
];

describe("resolveConsultantSelection", () => {
	test("RED2 regression guard: no manual exclusion -> nothing excluded", () => {
		const result = resolveConsultantSelection(
			teams,
			new Set(),
			new Set(),
			new Set(),
		);

		expect(result.excludedTeamIds.size).toBe(0);
		expect(result.excludedAgentIds.size).toBe(0);
		expect(result.excludedSkillIds.size).toBe(0);
		expect(result.blockedAgentIds.size).toBe(0);
		expect(result.blockedSkillIds.size).toBe(0);
	});

	test("RED1: manually excluding a team cascades to its agents and its non-shared skill, as BLOCKED", () => {
		const result = resolveConsultantSelection(
			teams,
			new Set(["team1"]),
			new Set(),
			new Set(),
		);

		expect(result.excludedTeamIds).toEqual(new Set(["team1"]));
		expect(result.excludedAgentIds).toEqual(new Set(["agent1", "agent2"]));
		expect(result.blockedAgentIds).toEqual(new Set(["agent1", "agent2"]));
		// skillB is owned only by agent2 (excluded) -> cascade-excluded.
		expect(result.excludedSkillIds.has("skillB")).toBe(true);
		expect(result.blockedSkillIds.has("skillB")).toBe(true);
		// skillA is owned only by agent1 (excluded) -> cascade-excluded.
		expect(result.excludedSkillIds.has("skillA")).toBe(true);
	});

	test("shared-skill decision: excluding team1 does NOT exclude skillShared, still owned by agent3 on team2", () => {
		const result = resolveConsultantSelection(
			teams,
			new Set(["team1"]),
			new Set(),
			new Set(),
		);

		expect(result.excludedSkillIds.has("skillShared")).toBe(false);
		expect(result.blockedSkillIds.has("skillShared")).toBe(false);
	});

	test("shared-skill decision: excluding BOTH agents that own skillShared cascade-excludes it", () => {
		const result = resolveConsultantSelection(
			teams,
			new Set(["team1", "team2"]),
			new Set(),
			new Set(),
		);

		expect(result.excludedSkillIds.has("skillShared")).toBe(true);
		expect(result.blockedSkillIds.has("skillShared")).toBe(true);
	});

	test("manually excluding a standalone agent excludes only itself and its non-shared skills, not its team", () => {
		const result = resolveConsultantSelection(
			teams,
			new Set(),
			new Set(["agent2"]),
			new Set(),
		);

		expect(result.excludedTeamIds.size).toBe(0);
		expect(result.excludedAgentIds).toEqual(new Set(["agent2"]));
		expect(result.blockedAgentIds.size).toBe(0);
		expect(result.excludedSkillIds).toEqual(new Set(["skillB"]));
	});

	test("re-checking the team lifts the cascade for its agents and skills", () => {
		const result = resolveConsultantSelection(
			teams,
			new Set(),
			new Set(),
			new Set(),
		);

		expect(result.excludedAgentIds.size).toBe(0);
		expect(result.excludedSkillIds.size).toBe(0);
	});
});

describe("toggleTeamExclusion", () => {
	test("toggles a team on", () => {
		expect(toggleTeamExclusion(new Set(), "team1")).toEqual(new Set(["team1"]));
	});

	test("toggles a team off", () => {
		expect(toggleTeamExclusion(new Set(["team1"]), "team1")).toEqual(new Set());
	});
});

describe("toggleAgentExclusion", () => {
	// The disabled Checkbox UI swallows the click before onCheckedChange
	// fires for a cascade-blocked agent (same shape as
	// lib/architect/operation-selection.ts) — this guard is reachable ONLY
	// via this direct call, never via a simulated click.
	test("is a no-op when the agent is cascade-blocked by its excluded team", () => {
		const manuallyExcludedAgentIds = new Set<string>();
		const result = toggleAgentExclusion(
			teams,
			new Set(["team1"]),
			manuallyExcludedAgentIds,
			"agent1",
		);

		expect(result).toEqual(new Set());
	});

	test("toggles a non-blocked agent on", () => {
		const result = toggleAgentExclusion(teams, new Set(), new Set(), "agent1");
		expect(result).toEqual(new Set(["agent1"]));
	});

	test("toggles a non-blocked, already-excluded agent off", () => {
		const result = toggleAgentExclusion(
			teams,
			new Set(),
			new Set(["agent1"]),
			"agent1",
		);
		expect(result).toEqual(new Set());
	});
});

describe("toggleSkillExclusion", () => {
	test("is a no-op when the skill is cascade-blocked by its only excluded owner", () => {
		const result = toggleSkillExclusion(
			teams,
			new Set(),
			new Set(["agent2"]),
			new Set(),
			"skillB",
		);

		expect(result).toEqual(new Set());
	});

	test("toggles a non-blocked skill on", () => {
		const result = toggleSkillExclusion(
			teams,
			new Set(),
			new Set(),
			new Set(),
			"skillA",
		);
		expect(result).toEqual(new Set(["skillA"]));
	});

	test("toggles a non-blocked, already-excluded skill off", () => {
		const result = toggleSkillExclusion(
			teams,
			new Set(),
			new Set(),
			new Set(["skillA"]),
			"skillA",
		);
		expect(result).toEqual(new Set());
	});
});

describe("filterConsultantSelection", () => {
	test("RED2 regression guard: nothing excluded -> everything committed as before", () => {
		const extracted = {
			selectedTeamIds: ["team1", "team2"],
			selectedAgentIds: ["agent1", "agent2", "agent3"],
			selectedSkillIds: ["skillA", "skillB", "skillShared", "skillC"],
		};

		const result = filterConsultantSelection(
			extracted,
			new Set(),
			new Set(),
			new Set(),
		);

		expect(result).toEqual(extracted);
	});

	test("RED1: deselecting one team removes only its retained ids from the committed selection", () => {
		const extracted = {
			selectedTeamIds: ["team1", "team2"],
			selectedAgentIds: ["agent1", "agent2", "agent3"],
			selectedSkillIds: ["skillA", "skillB", "skillShared", "skillC"],
		};

		const { excludedTeamIds, excludedAgentIds, excludedSkillIds } =
			resolveConsultantSelection(
				teams,
				new Set(["team1"]),
				new Set(),
				new Set(),
			);

		const result = filterConsultantSelection(
			extracted,
			excludedTeamIds,
			excludedAgentIds,
			excludedSkillIds,
		);

		expect(result).toEqual({
			selectedTeamIds: ["team2"],
			selectedAgentIds: ["agent3"],
			// skillShared survives — still owned by agent3 on team2.
			selectedSkillIds: ["skillShared", "skillC"],
		});
	});
});
