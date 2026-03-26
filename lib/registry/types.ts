/**
 * Registry Types — vantage-registry component catalogue
 *
 * These types mirror the registryTeams, registryAgents, and registrySkills
 * Convex tables. Used by the consultant onboarding flow to discover and
 * recommend components based on client pain points.
 */

// ============================================================================
// CORE REGISTRY TYPES
// ============================================================================

export interface RegistryTeam {
	id: string;
	name: string;
	description: string;
	category:
		| "marketing"
		| "sales"
		| "engineering"
		| "operations"
		| "support"
		| "analytics";
	agentIds: string[];
	skillIds: string[];
}

export interface RegistryAgent {
	id: string;
	name: string;
	role: string;
	description: string;
	skills: string[];
	teamId: string;
	persona?: string;
}

export interface RegistrySkill {
	id: string;
	name: string;
	description: string;
	category: string;
	agentId?: string;
	teamId?: string;
}

export interface RegistryHook {
	id: string;
	name: string;
	event: "SessionStart" | "PreToolUse" | "PostToolUse" | "UserPromptSubmit" | "SubagentStart";
	description: string;
}

// ============================================================================
// PAIN → TEAM MAPPING (discovery agent uses this to map business problems)
// ============================================================================

/**
 * A pain mapping connects a business pain (e.g. "prospecting") to the teams
 * best suited to address it. The discovery agent collects pain signals from
 * the consultant and uses these mappings to recommend a registry configuration.
 *
 * Design rule (from Laurent): pains are business problems, NOT feature names.
 * The consultant says "we struggle with finding new clients" — the agent maps
 * that to "prospecting" → ["sales-outreach", "lead-generation"].
 */
export interface PainMapping {
	pain: string;
	description: string;
	recommendedTeams: string[]; // team IDs
	priority: "high" | "medium" | "low";
}

export const PAIN_MAPPINGS: PainMapping[] = [
	{
		pain: "prospecting",
		description: "Finding and qualifying new leads",
		recommendedTeams: ["sales-outreach", "lead-generation"],
		priority: "high",
	},
	{
		pain: "content_marketing",
		description: "Creating and distributing content",
		recommendedTeams: ["content-marketing", "seo-optimization"],
		priority: "high",
	},
	{
		pain: "client_retention",
		description: "Keeping existing clients engaged",
		recommendedTeams: ["customer-success", "email-marketing"],
		priority: "high",
	},
	{
		pain: "internal_operations",
		description: "Streamlining internal processes",
		recommendedTeams: ["ops-automation", "project-management"],
		priority: "medium",
	},
	{
		pain: "competitive_intelligence",
		description: "Monitoring competitors and market",
		recommendedTeams: ["market-research", "competitor-watch"],
		priority: "medium",
	},
	{
		pain: "seo_visibility",
		description: "Improving search engine presence",
		recommendedTeams: ["seo-optimization", "content-marketing"],
		priority: "high",
	},
	{
		pain: "social_media",
		description: "Managing social media presence",
		recommendedTeams: ["social-media", "content-marketing"],
		priority: "medium",
	},
	{
		pain: "email_campaigns",
		description: "Email marketing and automation",
		recommendedTeams: ["email-marketing"],
		priority: "medium",
	},
	{
		pain: "data_analytics",
		description: "Understanding business metrics",
		recommendedTeams: ["analytics", "reporting"],
		priority: "medium",
	},
	{
		pain: "developer_productivity",
		description: "Accelerating development workflows",
		recommendedTeams: ["dev-tooling", "code-review"],
		priority: "high",
	},
];

// ============================================================================
// RECOMMENDATION RESULT TYPES
// ============================================================================

/**
 * Result shape returned by getRecommendationsForPains.
 * The discovery agent surfaces this to the consultant for review.
 */
export interface RegistryRecommendation {
	team: RegistryTeam;
	agents: RegistryAgent[];
	skills: RegistrySkill[];
	matchedPains: string[]; // which pain IDs drove this recommendation
	priority: "high" | "medium" | "low";
}
