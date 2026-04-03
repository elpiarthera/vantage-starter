/**
 * Config Generator — turns an OnboardingConfig spec into deployable .claude/ files
 *
 * Takes the parsed OnboardingConfig spec from json-render and emits file contents
 * as strings. Does NOT write to disk — the UI layer handles ZIP download or preview.
 *
 * Usage:
 *   const config = generateConfig(spec);
 *   // config.files is Array<{ path: string; content: string }>
 *   // Pass to JSZip or display in preview panel
 */

import type {
	RegistryAgent,
	RegistrySkill,
	RegistryTeam,
} from "@/lib/registry/types";
import {
	agentTemplate,
	claudeMdTemplate,
	sessionStartTemplate,
	skillsManifestTemplate,
} from "./config-templates";

// ============================================================================
// INPUT SPEC — extracted from json-render OnboardingConfig components
// ============================================================================

/**
 * A selected agent within the spec. Mirrors AgentSelection component props
 * but includes the full RegistryAgent data resolved from the registry.
 */
export interface SelectedAgent {
	agentId: string;
	name: string;
	role: string;
	description: string;
	skills: string[]; // skill IDs
	teamId: string;
	selected: boolean;
}

/**
 * A selected skill within the spec. Mirrors SkillSelection component props
 * but includes full RegistrySkill data.
 */
export interface SelectedSkill {
	skillId: string;
	name: string;
	description: string;
	category: string;
	selected: boolean;
}

/**
 * A selected team within the spec. Mirrors TeamSelection component props.
 */
export interface SelectedTeam {
	teamId: string;
	name: string;
	description: string;
	category: string;
	agentCount: number;
	selected: boolean;
	matchedPains?: string[];
	agents: SelectedAgent[];
	skills: SelectedSkill[];
}

/**
 * The full OnboardingConfig spec extracted from json-render output.
 * This is the input to generateConfig().
 */
export interface OnboardingConfigSpec {
	projectName: string;
	clientName: string;
	sector: string;
	summary: string;
	painPoints?: string[];
	teams: SelectedTeam[];
}

// ============================================================================
// OUTPUT — generated files ready for ZIP or preview
// ============================================================================

export interface GeneratedFile {
	/** Relative path, e.g. ".claude/agents/blog-writer.md" */
	path: string;
	/** Full file content as a string */
	content: string;
}

export interface GeneratedConfig {
	files: GeneratedFile[];
	/** Human-readable summary of what was generated */
	summary: string;
	teamCount: number;
	agentCount: number;
	skillCount: number;
}

// ============================================================================
// ADAPTER — SelectedTeam/Agent/Skill → Registry types
// ============================================================================

/**
 * Converts SelectedTeam to RegistryTeam shape expected by templates.
 */
function toRegistryTeam(team: SelectedTeam): RegistryTeam {
	return {
		id: team.teamId,
		name: team.name,
		description: team.description,
		category: team.category as RegistryTeam["category"],
		agentIds: team.agents.filter((a) => a.selected).map((a) => a.agentId),
		skillIds: team.skills.filter((s) => s.selected).map((s) => s.skillId),
	};
}

/**
 * Converts SelectedAgent to RegistryAgent shape expected by templates.
 */
function toRegistryAgent(agent: SelectedAgent): RegistryAgent {
	return {
		id: agent.agentId,
		name: agent.name,
		role: agent.role,
		description: agent.description,
		skills: agent.skills,
		teamId: agent.teamId,
	};
}

/**
 * Converts SelectedSkill to RegistrySkill shape expected by templates.
 */
function toRegistrySkill(skill: SelectedSkill): RegistrySkill {
	return {
		id: skill.skillId,
		name: skill.name,
		description: skill.description,
		category: skill.category,
	};
}

// ============================================================================
// MAIN — generateConfig
// ============================================================================

/**
 * Generates all .claude/ file contents from an OnboardingConfig spec.
 *
 * Files generated:
 *   - CLAUDE.md                           — project bible with routing table
 *   - .claude/agents/<agentId>.md         — one per selected agent
 *   - .claude/skills/SKILLS.md            — skills manifest
 *   - hooks/session-start.py              — customised session start hook
 *
 * Returns a GeneratedConfig with all file contents as strings.
 * Does NOT write to disk.
 */
export function generateConfig(spec: OnboardingConfigSpec): GeneratedConfig {
	const files: GeneratedFile[] = [];

	// Only include teams/agents/skills where selected === true
	const selectedTeams = spec.teams.filter((t) => t.selected);
	const selectedAgents = selectedTeams.flatMap((t) =>
		t.agents.filter((a) => a.selected),
	);
	const selectedSkills = selectedTeams.flatMap((t) =>
		t.skills.filter((s) => s.selected),
	);

	// Deduplicate skills by skillId (multiple teams may reference the same skill)
	const skillMap = new Map<string, SelectedSkill>();
	for (const skill of selectedSkills) {
		if (!skillMap.has(skill.skillId)) {
			skillMap.set(skill.skillId, skill);
		}
	}
	const deduplicatedSkills = Array.from(skillMap.values());

	const generatedAt = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

	// ------------------------------------------------------------------
	// 1. CLAUDE.md
	// ------------------------------------------------------------------
	const claudeMdContent = claudeMdTemplate({
		projectName: spec.projectName,
		clientName: spec.clientName,
		sector: spec.sector,
		summary: spec.summary,
		painPoints: spec.painPoints ?? [],
		teams: selectedTeams.map((t) => ({
			team: toRegistryTeam(t),
			agents: t.agents.filter((a) => a.selected).map(toRegistryAgent),
			skills: t.skills.filter((s) => s.selected).map(toRegistrySkill),
		})),
		generatedAt,
	});

	files.push({ path: "CLAUDE.md", content: claudeMdContent });

	// ------------------------------------------------------------------
	// 2. Agent files — .claude/agents/<agentId>.md
	// ------------------------------------------------------------------
	for (const agent of selectedAgents) {
		const team = selectedTeams.find((t) => t.teamId === agent.teamId);
		const agentSkills = agent.skills
			.map((skillId) => skillMap.get(skillId))
			.filter((s): s is SelectedSkill => s !== undefined)
			.map(toRegistrySkill);

		const content = agentTemplate({
			agentId: agent.agentId,
			name: agent.name,
			role: agent.role,
			description: agent.description,
			teamName: team?.name ?? agent.teamId,
			teamId: agent.teamId,
			skills: agentSkills,
		});

		files.push({
			path: `.claude/agents/${agent.agentId}.md`,
			content,
		});
	}

	// ------------------------------------------------------------------
	// 3. Skills manifest — .claude/skills/SKILLS.md
	// ------------------------------------------------------------------
	if (deduplicatedSkills.length > 0) {
		const skillsContent = skillsManifestTemplate({
			skills: deduplicatedSkills.map(toRegistrySkill),
			projectName: spec.projectName,
		});
		files.push({ path: ".claude/skills/SKILLS.md", content: skillsContent });
	}

	// ------------------------------------------------------------------
	// 4. Session start hook — hooks/session-start.py
	// ------------------------------------------------------------------
	const sessionStartContent = sessionStartTemplate({
		projectName: spec.projectName,
		clientName: spec.clientName,
		sector: spec.sector,
		agentIds: selectedAgents.map((a) => a.agentId),
	});
	files.push({ path: "hooks/session-start.py", content: sessionStartContent });

	// ------------------------------------------------------------------
	// Summary
	// ------------------------------------------------------------------
	const summary = buildSummary(
		spec,
		selectedTeams,
		selectedAgents,
		deduplicatedSkills,
	);

	return {
		files,
		summary,
		teamCount: selectedTeams.length,
		agentCount: selectedAgents.length,
		skillCount: deduplicatedSkills.length,
	};
}

// ============================================================================
// HELPERS
// ============================================================================

function buildSummary(
	spec: OnboardingConfigSpec,
	teams: SelectedTeam[],
	agents: SelectedAgent[],
	skills: SelectedSkill[],
): string {
	const teamNames = teams.map((t) => t.name).join(", ");
	const categories = [...new Set(teams.map((t) => t.category))].join(", ");

	return [
		`Generated .claude/ config for "${spec.projectName}" (${spec.clientName}, ${spec.sector}).`,
		``,
		`Selected: ${teams.length} team${teams.length !== 1 ? "s" : ""} (${teamNames}), ` +
			`${agents.length} agent${agents.length !== 1 ? "s" : ""}, ` +
			`${skills.length} skill${skills.length !== 1 ? "s" : ""}.`,
		`Categories covered: ${categories}.`,
		``,
		`Files generated:`,
		`  - CLAUDE.md (project bible + routing table)`,
		`  - .claude/agents/*.md (${agents.length} agent files)`,
		skills.length > 0 ? `  - .claude/skills/SKILLS.md (skills manifest)` : null,
		`  - hooks/session-start.py (session context hook)`,
	]
		.filter((line): line is string => line !== null)
		.join("\n");
}
