/**
 * Registry Seed — populate registryTeams, registryAgents, registrySkills
 *
 * Seeds 15 teams covering the full vantage-registry business function spectrum.
 * Each team ships with 2–4 agents and 3–6 skills.
 *
 * Idempotent: every insert is guarded by a teamId/agentId/skillId lookup.
 * Run via:
 *   npx convex run seed/seedRegistry:seedRegistry
 *
 * Design: IDs are stable slugs. The pain → team mapping in lib/registry/types.ts
 * references these slugs directly — keep them in sync if you rename.
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

// ============================================================================
// SEED DATA
// ============================================================================

type TeamSeed = {
	teamId: string;
	name: string;
	description: string;
	category:
		| "marketing"
		| "sales"
		| "engineering"
		| "operations"
		| "support"
		| "analytics";
	agents: AgentSeed[];
	skills: SkillSeed[];
};

type AgentSeed = {
	agentId: string;
	name: string;
	role: string;
	description: string;
	skills: string[]; // skill IDs within this team
	persona?: string;
};

type SkillSeed = {
	skillId: string;
	name: string;
	description: string;
	category: string;
};

const REGISTRY_SEED: TeamSeed[] = [
	// -------------------------------------------------------------------------
	// MARKETING
	// -------------------------------------------------------------------------
	{
		teamId: "content-marketing",
		name: "Content Marketing Team",
		description:
			"Agents that plan, write, and distribute content across all formats — blog, social, email, video scripts.",
		category: "marketing",
		agents: [
			{
				agentId: "content-strategist",
				name: "Content Strategist",
				role: "Strategy",
				description:
					"Builds editorial calendars, topic clusters, and content briefs aligned to SEO and business goals.",
				skills: ["editorial-calendar", "content-brief", "topic-research"],
				persona: "data-driven analyst",
			},
			{
				agentId: "blog-writer",
				name: "Blog Writer",
				role: "Writing",
				description:
					"Writes long-form SEO-optimised blog posts from briefs. Adapts tone to brand voice.",
				skills: ["blog-post-writing", "seo-copywriting"],
			},
			{
				agentId: "social-copywriter",
				name: "Social Copywriter",
				role: "Writing",
				description:
					"Writes platform-native social posts (LinkedIn, X, Instagram) from a content brief.",
				skills: ["social-post-writing", "hashtag-research"],
			},
		],
		skills: [
			{
				skillId: "editorial-calendar",
				name: "Editorial Calendar",
				description: "Plan monthly content themes and publish schedule.",
				category: "content",
			},
			{
				skillId: "content-brief",
				name: "Content Brief",
				description: "Write a structured brief for any content asset.",
				category: "content",
			},
			{
				skillId: "topic-research",
				name: "Topic Research",
				description: "Discover trending topics and content gaps in a niche.",
				category: "research",
			},
			{
				skillId: "blog-post-writing",
				name: "Blog Post Writing",
				description: "Write SEO-optimised long-form articles (800–3000 words).",
				category: "writing",
			},
			{
				skillId: "seo-copywriting",
				name: "SEO Copywriting",
				description: "Optimise copy for target keywords without keyword stuffing.",
				category: "writing",
			},
			{
				skillId: "social-post-writing",
				name: "Social Post Writing",
				description: "Write engaging platform-native social media posts.",
				category: "writing",
			},
		],
	},

	{
		teamId: "seo-optimization",
		name: "SEO Optimization Team",
		description:
			"Agents that audit sites, plan keyword strategy, build links, and monitor rankings.",
		category: "marketing",
		agents: [
			{
				agentId: "seo-auditor",
				name: "SEO Auditor",
				role: "Analysis",
				description:
					"Audits technical SEO health: crawlability, Core Web Vitals, structured data, cannibalization.",
				skills: ["technical-seo-audit", "keyword-gap-analysis"],
			},
			{
				agentId: "keyword-researcher",
				name: "Keyword Researcher",
				role: "Research",
				description:
					"Discovers high-intent keyword opportunities and maps them to content or landing pages.",
				skills: ["keyword-research", "serp-analysis"],
			},
			{
				agentId: "link-builder",
				name: "Link Builder",
				role: "Outreach",
				description:
					"Identifies link prospects, writes outreach emails, and tracks backlink acquisition.",
				skills: ["link-prospecting", "outreach-email"],
			},
		],
		skills: [
			{
				skillId: "technical-seo-audit",
				name: "Technical SEO Audit",
				description: "Audit crawlability, indexation, and Core Web Vitals.",
				category: "seo",
			},
			{
				skillId: "keyword-gap-analysis",
				name: "Keyword Gap Analysis",
				description: "Find keywords competitors rank for that you do not.",
				category: "seo",
			},
			{
				skillId: "keyword-research",
				name: "Keyword Research",
				description: "Discover and prioritise keyword opportunities by intent and volume.",
				category: "seo",
			},
			{
				skillId: "serp-analysis",
				name: "SERP Analysis",
				description: "Analyse top-ranking pages to understand what Google rewards.",
				category: "seo",
			},
			{
				skillId: "link-prospecting",
				name: "Link Prospecting",
				description: "Find authoritative sites likely to link back.",
				category: "seo",
			},
			{
				skillId: "outreach-email",
				name: "Outreach Email",
				description: "Write personalised outreach emails for link building or PR.",
				category: "communication",
			},
		],
	},

	{
		teamId: "email-marketing",
		name: "Email Marketing Team",
		description:
			"Agents that write campaigns, build sequences, optimise deliverability, and report on results.",
		category: "marketing",
		agents: [
			{
				agentId: "email-copywriter",
				name: "Email Copywriter",
				role: "Writing",
				description:
					"Writes persuasive email campaigns — welcome sequences, promos, nurture flows.",
				skills: ["email-copywriting", "subject-line-testing"],
			},
			{
				agentId: "email-strategist",
				name: "Email Strategist",
				role: "Strategy",
				description:
					"Plans segmentation, send cadence, and automation flows aligned to funnel stages.",
				skills: ["email-sequence-planning", "list-segmentation"],
			},
		],
		skills: [
			{
				skillId: "email-copywriting",
				name: "Email Copywriting",
				description: "Write compelling email body copy for any campaign type.",
				category: "writing",
			},
			{
				skillId: "subject-line-testing",
				name: "Subject Line Testing",
				description: "Generate and A/B test subject line variants.",
				category: "optimisation",
			},
			{
				skillId: "email-sequence-planning",
				name: "Email Sequence Planning",
				description: "Map out a multi-email nurture or onboarding sequence.",
				category: "strategy",
			},
			{
				skillId: "list-segmentation",
				name: "List Segmentation",
				description: "Define segmentation criteria for targeted campaigns.",
				category: "strategy",
			},
		],
	},

	{
		teamId: "social-media",
		name: "Social Media Team",
		description:
			"Agents that plan, schedule, and analyse social media presence across platforms.",
		category: "marketing",
		agents: [
			{
				agentId: "social-media-manager",
				name: "Social Media Manager",
				role: "Management",
				description:
					"Plans monthly social calendar, drafts captions, identifies trending hooks.",
				skills: ["social-calendar", "caption-writing", "trend-spotting"],
			},
			{
				agentId: "community-manager",
				name: "Community Manager",
				role: "Engagement",
				description:
					"Drafts replies, monitors mentions, and escalates feedback to the right teams.",
				skills: ["comment-responses", "community-reporting"],
			},
		],
		skills: [
			{
				skillId: "social-calendar",
				name: "Social Calendar",
				description: "Plan a monthly social media content calendar.",
				category: "content",
			},
			{
				skillId: "caption-writing",
				name: "Caption Writing",
				description: "Write engaging, on-brand captions for image and video posts.",
				category: "writing",
			},
			{
				skillId: "trend-spotting",
				name: "Trend Spotting",
				description: "Identify trending topics relevant to the brand's niche.",
				category: "research",
			},
			{
				skillId: "comment-responses",
				name: "Comment Responses",
				description: "Draft authentic, on-brand replies to comments and DMs.",
				category: "communication",
			},
			{
				skillId: "community-reporting",
				name: "Community Reporting",
				description: "Summarise engagement metrics and community sentiment.",
				category: "analytics",
			},
		],
	},

	// -------------------------------------------------------------------------
	// SALES
	// -------------------------------------------------------------------------
	{
		teamId: "sales-outreach",
		name: "Sales Outreach Team",
		description:
			"Agents that write cold outreach, follow-ups, and sales decks to fill the pipeline.",
		category: "sales",
		agents: [
			{
				agentId: "outreach-specialist",
				name: "Outreach Specialist",
				role: "Sales",
				description:
					"Writes personalised cold emails and LinkedIn messages tailored to ICP and pain points.",
				skills: ["cold-email-writing", "linkedin-message", "follow-up-sequence"],
			},
			{
				agentId: "sales-deck-writer",
				name: "Sales Deck Writer",
				role: "Sales",
				description:
					"Structures and writes sales presentation content: problem, solution, proof, CTA.",
				skills: ["sales-deck", "case-study-summary"],
			},
		],
		skills: [
			{
				skillId: "cold-email-writing",
				name: "Cold Email Writing",
				description: "Write personalised, high-converting cold outreach emails.",
				category: "writing",
			},
			{
				skillId: "linkedin-message",
				name: "LinkedIn Message",
				description: "Write natural, non-spammy LinkedIn connection and follow-up messages.",
				category: "writing",
			},
			{
				skillId: "follow-up-sequence",
				name: "Follow-Up Sequence",
				description: "Build a 3–5 step follow-up cadence for non-responders.",
				category: "strategy",
			},
			{
				skillId: "sales-deck",
				name: "Sales Deck",
				description: "Outline and write slides for a persuasive sales presentation.",
				category: "writing",
			},
			{
				skillId: "case-study-summary",
				name: "Case Study Summary",
				description: "Write a concise before/after case study from raw notes.",
				category: "writing",
			},
		],
	},

	{
		teamId: "lead-generation",
		name: "Lead Generation Team",
		description:
			"Agents that build prospect lists, enrich data, and qualify inbound leads.",
		category: "sales",
		agents: [
			{
				agentId: "lead-researcher",
				name: "Lead Researcher",
				role: "Research",
				description:
					"Finds and validates prospect companies and contacts matching the ICP.",
				skills: ["icp-definition", "prospect-list-building", "lead-enrichment"],
			},
			{
				agentId: "lead-qualifier",
				name: "Lead Qualifier",
				role: "Sales",
				description:
					"Scores inbound leads against BANT/MEDDIC criteria and routes them appropriately.",
				skills: ["lead-scoring", "qualification-call-script"],
			},
		],
		skills: [
			{
				skillId: "icp-definition",
				name: "ICP Definition",
				description: "Define the Ideal Customer Profile with firmographic and psychographic criteria.",
				category: "strategy",
			},
			{
				skillId: "prospect-list-building",
				name: "Prospect List Building",
				description: "Build a targeted list of companies and contacts matching the ICP.",
				category: "research",
			},
			{
				skillId: "lead-enrichment",
				name: "Lead Enrichment",
				description: "Enrich prospect records with firmographic and technographic data.",
				category: "research",
			},
			{
				skillId: "lead-scoring",
				name: "Lead Scoring",
				description: "Score leads on fit and intent to prioritise sales effort.",
				category: "analytics",
			},
			{
				skillId: "qualification-call-script",
				name: "Qualification Call Script",
				description: "Write a discovery call script that uncovers budget, authority, need, timeline.",
				category: "writing",
			},
		],
	},

	// -------------------------------------------------------------------------
	// SUPPORT
	// -------------------------------------------------------------------------
	{
		teamId: "customer-success",
		name: "Customer Success Team",
		description:
			"Agents that onboard clients, monitor health scores, and prevent churn.",
		category: "support",
		agents: [
			{
				agentId: "onboarding-specialist",
				name: "Onboarding Specialist",
				role: "Success",
				description:
					"Writes onboarding plans, welcome emails, and success milestones for new clients.",
				skills: ["onboarding-plan", "welcome-email", "milestone-tracking"],
			},
			{
				agentId: "churn-analyst",
				name: "Churn Analyst",
				role: "Analysis",
				description:
					"Identifies at-risk accounts from usage signals and drafts re-engagement plays.",
				skills: ["churn-risk-scoring", "reengagement-playbook"],
			},
		],
		skills: [
			{
				skillId: "onboarding-plan",
				name: "Onboarding Plan",
				description: "Design a structured 30/60/90 day onboarding journey for new clients.",
				category: "strategy",
			},
			{
				skillId: "welcome-email",
				name: "Welcome Email",
				description: "Write a warm, actionable welcome email for new customers.",
				category: "writing",
			},
			{
				skillId: "milestone-tracking",
				name: "Milestone Tracking",
				description: "Define and track client success milestones and health metrics.",
				category: "analytics",
			},
			{
				skillId: "churn-risk-scoring",
				name: "Churn Risk Scoring",
				description: "Score accounts by churn risk using engagement and usage signals.",
				category: "analytics",
			},
			{
				skillId: "reengagement-playbook",
				name: "Re-engagement Playbook",
				description: "Define the steps and messages to re-activate at-risk accounts.",
				category: "strategy",
			},
		],
	},

	// -------------------------------------------------------------------------
	// ANALYTICS
	// -------------------------------------------------------------------------
	{
		teamId: "analytics",
		name: "Analytics Team",
		description:
			"Agents that design dashboards, analyse data, and surface actionable insights.",
		category: "analytics",
		agents: [
			{
				agentId: "data-analyst",
				name: "Data Analyst",
				role: "Analysis",
				description:
					"Analyses business metrics, builds SQL queries, and explains trends in plain English.",
				skills: ["metric-analysis", "sql-query-writing", "insight-report"],
			},
			{
				agentId: "dashboard-designer",
				name: "Dashboard Designer",
				role: "Analytics",
				description:
					"Designs KPI dashboards that surface the right metrics for decision-making.",
				skills: ["kpi-definition", "dashboard-design"],
			},
		],
		skills: [
			{
				skillId: "metric-analysis",
				name: "Metric Analysis",
				description: "Analyse a metric trend and diagnose root causes.",
				category: "analytics",
			},
			{
				skillId: "sql-query-writing",
				name: "SQL Query Writing",
				description: "Write SQL queries to extract and transform business data.",
				category: "development",
			},
			{
				skillId: "insight-report",
				name: "Insight Report",
				description: "Synthesise data findings into an executive-readable insight report.",
				category: "writing",
			},
			{
				skillId: "kpi-definition",
				name: "KPI Definition",
				description: "Define the right KPIs for a business function with measurement plan.",
				category: "strategy",
			},
			{
				skillId: "dashboard-design",
				name: "Dashboard Design",
				description: "Design a data dashboard layout with the right charts and filters.",
				category: "analytics",
			},
		],
	},

	{
		teamId: "reporting",
		name: "Reporting Team",
		description:
			"Agents that produce weekly, monthly, and quarterly business performance reports.",
		category: "analytics",
		agents: [
			{
				agentId: "report-writer",
				name: "Report Writer",
				role: "Writing",
				description:
					"Produces structured performance reports from raw data and metrics.",
				skills: ["weekly-report", "monthly-report", "executive-summary"],
			},
		],
		skills: [
			{
				skillId: "weekly-report",
				name: "Weekly Report",
				description: "Write a concise weekly performance report with highlights and blockers.",
				category: "writing",
			},
			{
				skillId: "monthly-report",
				name: "Monthly Report",
				description: "Write a comprehensive monthly business performance report.",
				category: "writing",
			},
			{
				skillId: "executive-summary",
				name: "Executive Summary",
				description: "Distil complex data into a crisp executive summary (1 page max).",
				category: "writing",
			},
			{
				skillId: "competitive-benchmarking",
				name: "Competitive Benchmarking",
				description: "Compare performance metrics against competitors and industry benchmarks.",
				category: "analytics",
			},
		],
	},

	// -------------------------------------------------------------------------
	// OPERATIONS
	// -------------------------------------------------------------------------
	{
		teamId: "ops-automation",
		name: "Operations Automation Team",
		description:
			"Agents that map processes, identify automation opportunities, and build SOPs.",
		category: "operations",
		agents: [
			{
				agentId: "process-mapper",
				name: "Process Mapper",
				role: "Operations",
				description:
					"Documents as-is workflows, identifies bottlenecks, and proposes optimisations.",
				skills: ["process-mapping", "bottleneck-analysis", "sop-writing"],
			},
			{
				agentId: "automation-architect",
				name: "Automation Architect",
				role: "Engineering",
				description:
					"Designs automation workflows using no-code and low-code tools (Zapier, Make, n8n).",
				skills: ["automation-design", "tool-selection"],
			},
		],
		skills: [
			{
				skillId: "process-mapping",
				name: "Process Mapping",
				description: "Document a business process step by step with roles and handoffs.",
				category: "operations",
			},
			{
				skillId: "bottleneck-analysis",
				name: "Bottleneck Analysis",
				description: "Identify and quantify the biggest friction points in a workflow.",
				category: "analysis",
			},
			{
				skillId: "sop-writing",
				name: "SOP Writing",
				description: "Write a Standard Operating Procedure document for a recurring process.",
				category: "writing",
			},
			{
				skillId: "automation-design",
				name: "Automation Design",
				description: "Design an automation flow with triggers, actions, and error handling.",
				category: "operations",
			},
			{
				skillId: "tool-selection",
				name: "Tool Selection",
				description: "Evaluate and recommend the right tool for a given automation requirement.",
				category: "strategy",
			},
		],
	},

	{
		teamId: "project-management",
		name: "Project Management Team",
		description:
			"Agents that plan projects, track tasks, write briefs, and manage stakeholder communication.",
		category: "operations",
		agents: [
			{
				agentId: "project-planner",
				name: "Project Planner",
				role: "Management",
				description:
					"Breaks down goals into milestones, tasks, owners, and deadlines.",
				skills: ["project-plan", "milestone-definition", "status-update"],
			},
			{
				agentId: "brief-writer",
				name: "Brief Writer",
				role: "Communication",
				description:
					"Writes structured project briefs, creative briefs, and RFPs from stakeholder input.",
				skills: ["project-brief", "requirements-doc"],
			},
		],
		skills: [
			{
				skillId: "project-plan",
				name: "Project Plan",
				description: "Create a structured project plan with phases, tasks, and owners.",
				category: "operations",
			},
			{
				skillId: "milestone-definition",
				name: "Milestone Definition",
				description: "Define clear, measurable project milestones with acceptance criteria.",
				category: "strategy",
			},
			{
				skillId: "status-update",
				name: "Status Update",
				description: "Write a stakeholder status update that highlights progress and blockers.",
				category: "writing",
			},
			{
				skillId: "project-brief",
				name: "Project Brief",
				description: "Write a comprehensive project brief with goals, scope, and constraints.",
				category: "writing",
			},
			{
				skillId: "requirements-doc",
				name: "Requirements Document",
				description: "Write a functional requirements document from stakeholder interviews.",
				category: "writing",
			},
		],
	},

	// -------------------------------------------------------------------------
	// ENGINEERING
	// -------------------------------------------------------------------------
	{
		teamId: "dev-tooling",
		name: "Developer Tooling Team",
		description:
			"Agents that accelerate development workflows: code review, docs, CI/CD, DX.",
		category: "engineering",
		agents: [
			{
				agentId: "code-reviewer",
				name: "Code Reviewer",
				role: "Engineering",
				description:
					"Reviews code for bugs, security issues, and best practices. Writes review comments.",
				skills: ["code-review", "security-scan", "performance-review"],
			},
			{
				agentId: "docs-writer",
				name: "Docs Writer",
				role: "Writing",
				description:
					"Writes developer documentation: API references, guides, changelogs, READMEs.",
				skills: ["api-docs", "readme-writing", "changelog-writing"],
			},
		],
		skills: [
			{
				skillId: "code-review",
				name: "Code Review",
				description: "Review code for correctness, style, and maintainability.",
				category: "development",
			},
			{
				skillId: "security-scan",
				name: "Security Scan",
				description: "Identify security vulnerabilities and OWASP issues in code.",
				category: "development",
			},
			{
				skillId: "performance-review",
				name: "Performance Review",
				description: "Identify performance bottlenecks and suggest optimisations.",
				category: "development",
			},
			{
				skillId: "api-docs",
				name: "API Documentation",
				description: "Write clear, complete API reference documentation.",
				category: "writing",
			},
			{
				skillId: "readme-writing",
				name: "README Writing",
				description: "Write a concise, well-structured README for a repository.",
				category: "writing",
			},
			{
				skillId: "changelog-writing",
				name: "Changelog Writing",
				description: "Write a user-facing changelog entry from commit history.",
				category: "writing",
			},
		],
	},

	{
		teamId: "code-review",
		name: "Code Review Team",
		description:
			"Agents specialised in systematic code quality, security, and architecture review.",
		category: "engineering",
		agents: [
			{
				agentId: "senior-reviewer",
				name: "Senior Reviewer",
				role: "Engineering",
				description:
					"Provides senior-level code review with architecture feedback and risk assessment.",
				skills: ["architecture-review", "code-review", "tech-debt-assessment"],
			},
			{
				agentId: "security-auditor",
				name: "Security Auditor",
				role: "Security",
				description:
					"Audits code and infrastructure for security vulnerabilities and compliance gaps.",
				skills: ["security-scan", "dependency-audit", "owasp-checklist"],
			},
		],
		skills: [
			{
				skillId: "architecture-review",
				name: "Architecture Review",
				description: "Review system architecture for scalability, maintainability, and risk.",
				category: "development",
			},
			{
				skillId: "tech-debt-assessment",
				name: "Tech Debt Assessment",
				description: "Identify and quantify technical debt with a prioritised remediation plan.",
				category: "development",
			},
			{
				skillId: "dependency-audit",
				name: "Dependency Audit",
				description: "Audit project dependencies for outdated, vulnerable, or unused packages.",
				category: "development",
			},
			{
				skillId: "owasp-checklist",
				name: "OWASP Checklist",
				description: "Run through the OWASP Top 10 checklist against a codebase or endpoint.",
				category: "development",
			},
		],
	},

	// -------------------------------------------------------------------------
	// ANALYTICS (market research / competitor intelligence)
	// -------------------------------------------------------------------------
	{
		teamId: "market-research",
		name: "Market Research Team",
		description:
			"Agents that gather market intelligence, size markets, and track industry trends.",
		category: "analytics",
		agents: [
			{
				agentId: "market-analyst",
				name: "Market Analyst",
				role: "Research",
				description:
					"Analyses market size, segments, trends, and buyer personas from public sources.",
				skills: ["market-sizing", "trend-analysis", "buyer-persona"],
			},
		],
		skills: [
			{
				skillId: "market-sizing",
				name: "Market Sizing",
				description: "Estimate TAM/SAM/SOM using bottom-up or top-down approaches.",
				category: "research",
			},
			{
				skillId: "trend-analysis",
				name: "Trend Analysis",
				description: "Identify and explain macro and micro trends affecting a market.",
				category: "research",
			},
			{
				skillId: "buyer-persona",
				name: "Buyer Persona",
				description: "Create detailed buyer personas based on research and behavioural data.",
				category: "strategy",
			},
			{
				skillId: "market-report",
				name: "Market Report",
				description: "Write a structured market overview report for stakeholders.",
				category: "writing",
			},
		],
	},

	{
		teamId: "competitor-watch",
		name: "Competitor Watch Team",
		description:
			"Agents that monitor competitors, track pricing changes, and surface positioning gaps.",
		category: "analytics",
		agents: [
			{
				agentId: "competitive-intelligence",
				name: "Competitive Intelligence",
				role: "Research",
				description:
					"Tracks competitor product changes, pricing, content, and positioning over time.",
				skills: ["competitor-profiling", "pricing-analysis", "competitive-gap-analysis"],
			},
			{
				agentId: "positioning-strategist",
				name: "Positioning Strategist",
				role: "Strategy",
				description:
					"Synthesises competitive intel into positioning recommendations and differentiation playbooks.",
				skills: ["positioning-statement", "differentiation-playbook"],
			},
		],
		skills: [
			{
				skillId: "competitor-profiling",
				name: "Competitor Profiling",
				description: "Build a detailed profile of a competitor: offering, pricing, positioning, weaknesses.",
				category: "research",
			},
			{
				skillId: "pricing-analysis",
				name: "Pricing Analysis",
				description: "Analyse competitor pricing tiers and identify pricing opportunity gaps.",
				category: "research",
			},
			{
				skillId: "competitive-gap-analysis",
				name: "Competitive Gap Analysis",
				description: "Identify gaps in competitor offerings that your product can exploit.",
				category: "research",
			},
			{
				skillId: "positioning-statement",
				name: "Positioning Statement",
				description: "Write a clear positioning statement that differentiates from key competitors.",
				category: "strategy",
			},
			{
				skillId: "differentiation-playbook",
				name: "Differentiation Playbook",
				description: "Create a playbook of differentiation messages for each competitor.",
				category: "strategy",
			},
		],
	},
];

// ============================================================================
// SEED MUTATION
// ============================================================================

export const seedRegistry = internalMutation({
	args: {},
	returns: v.object({
		teamsCreated: v.number(),
		agentsCreated: v.number(),
		skillsCreated: v.number(),
		teamsSkipped: v.number(),
		agentsSkipped: v.number(),
		skillsSkipped: v.number(),
	}),
	handler: async (ctx) => {
		const now = Date.now();

		let teamsCreated = 0;
		let agentsCreated = 0;
		let skillsCreated = 0;
		let teamsSkipped = 0;
		let agentsSkipped = 0;
		let skillsSkipped = 0;

		for (const teamSeed of REGISTRY_SEED) {
			// ---- Team -------------------------------------------------------
			const existingTeam = await ctx.db
				.query("registryTeams")
				.withIndex("by_team_id", (q) => q.eq("teamId", teamSeed.teamId))
				.unique();

			if (!existingTeam) {
				await ctx.db.insert("registryTeams", {
					teamId: teamSeed.teamId,
					name: teamSeed.name,
					description: teamSeed.description,
					category: teamSeed.category,
					agentIds: teamSeed.agents.map((a) => a.agentId),
					skillIds: teamSeed.skills.map((s) => s.skillId),
					createdAt: now,
					updatedAt: now,
				});
				teamsCreated++;
			} else {
				teamsSkipped++;
			}

			// ---- Skills (insert before agents so agents can reference them) ----
			for (const skillSeed of teamSeed.skills) {
				const existingSkill = await ctx.db
					.query("registrySkills")
					.withIndex("by_skill_id", (q) => q.eq("skillId", skillSeed.skillId))
					.unique();

				if (!existingSkill) {
					await ctx.db.insert("registrySkills", {
						skillId: skillSeed.skillId,
						name: skillSeed.name,
						description: skillSeed.description,
						category: skillSeed.category,
						teamId: teamSeed.teamId,
						createdAt: now,
						updatedAt: now,
					});
					skillsCreated++;
				} else {
					skillsSkipped++;
				}
			}

			// ---- Agents ------------------------------------------------------
			for (const agentSeed of teamSeed.agents) {
				const existingAgent = await ctx.db
					.query("registryAgents")
					.withIndex("by_agent_id", (q) => q.eq("agentId", agentSeed.agentId))
					.unique();

				if (!existingAgent) {
					await ctx.db.insert("registryAgents", {
						agentId: agentSeed.agentId,
						name: agentSeed.name,
						role: agentSeed.role,
						description: agentSeed.description,
						skills: agentSeed.skills,
						teamId: teamSeed.teamId,
						persona: agentSeed.persona,
						createdAt: now,
						updatedAt: now,
					});
					agentsCreated++;
				} else {
					agentsSkipped++;
				}
			}
		}

		return {
			teamsCreated,
			agentsCreated,
			skillsCreated,
			teamsSkipped,
			agentsSkipped,
			skillsSkipped,
		};
	},
});
