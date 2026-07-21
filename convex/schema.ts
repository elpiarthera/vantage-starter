import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * VantageStarter — Convex Database Schema
 *
 * Generic SaaS infrastructure tables only. Add your product's own tables here.
 *
 * Tables:
 * 1. organizations - Multi-tenancy root
 * 2. users - User profiles (Clerk sync)
 * 3. assets - File uploads (images, videos, audio)
 * 4. chatMessages - AI chat history
 * 5. subscriptions - Polar billing integration
 * 6. usageTracking - AI cost metering
 * 7. activities - User activity log
 * 8. sharedLinks - Public sharing pattern
 * 9. userCredits - Per-user credit balance
 * 10. creditTransactions - Audit log
 * 11. creditCosts - Configurable costs per AI action
 * 12. subscriptionTiers - Dynamic tier definitions
 * 13. systemConfig - Global system configuration
 */

export default defineSchema({
	/**
	 * 1. Organizations Table
	 * Multi-tenancy root - all data scoped by organization
	 */
	organizations: defineTable({
		clerkOrganizationId: v.string(),
		name: v.string(),
		slug: v.optional(v.string()),
		type: v.union(
			v.literal("individual"),
			v.literal("agency"),
			v.literal("team"),
		),
		totalCreditsUsed: v.number(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_clerk_org_id", ["clerkOrganizationId"])
		.index("by_type", ["type"]),

	/**
	 * 2. Users Table
	 * Minimal user data - Clerk handles auth
	 */
	users: defineTable({
		clerkUserId: v.string(),
		organizationId: v.optional(v.string()), // Links to organizations.clerkOrganizationId
		role: v.optional(
			v.union(
				v.literal("owner"),
				v.literal("admin"),
				v.literal("member"),
				v.literal("client"),
			),
		),
		preferences: v.optional(
			v.object({
				theme: v.union(
					v.literal("light"),
					v.literal("dark"),
					v.literal("system"),
				),
				language: v.string(),
				notifications: v.boolean(),
				// Configurator selection (design/configurator persistence — Day defect #2).
				// SCOPE DECISION: per-user, not per-workspace (see convex/users.ts
				// updatePreferences for the full reasoning). Every field optional so a
				// user who never opened the configurator gets DEFAULT_CONFIG
				// (lib/design-system/config.ts) client-side instead of a broken/blank
				// screen — see DesignSystemProvider's fallback.
				designSystem: v.optional(
					v.object({
						style: v.optional(v.string()),
						baseColor: v.optional(v.string()),
						chartColor: v.optional(v.string()),
						fontHeading: v.optional(v.string()),
						font: v.optional(v.string()),
						iconLibrary: v.optional(v.string()),
						radius: v.optional(v.string()),
						menuColor: v.optional(v.string()),
						menuAccent: v.optional(v.string()),
					}),
				),
			}),
		),
		lastActiveAt: v.optional(v.number()),

		// Synced from Clerk
		email: v.string(),
		firstName: v.optional(v.string()),
		lastName: v.optional(v.string()),
		username: v.optional(v.string()),
		imageUrl: v.optional(v.string()),

		// Timestamps
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_clerk_user_id", ["clerkUserId"])
		.index("by_organization", ["organizationId"])
		.index("by_organization_and_role", ["organizationId", "role"])
		.index("by_last_active", ["lastActiveAt"])
		.index("by_email", ["email"]),

	/**
	 * 3. Assets Table
	 * Uploaded files (images, videos, audio)
	 */
	assets: defineTable({
		userId: v.string(), // Clerk user ID
		projectId: v.optional(v.string()),
		type: v.union(v.literal("image"), v.literal("video"), v.literal("audio")),
		url: v.string(),
		filename: v.string(),
		size: v.number(),
		uploadedAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_project", ["projectId"])
		.index("by_type", ["type"]),

	/**
	 * 4. Chat Messages Table
	 * AI chat history — generic, context-scoped
	 */
	chatMessages: defineTable({
		organizationId: v.string(),
		projectId: v.string(),
		userId: v.string(), // Clerk user ID
		role: v.union(
			v.literal("user"),
			v.literal("assistant"),
			v.literal("system"),
		),
		content: v.string(),
		context: v.number(), // Renamed from `step` — generic context/thread identifier
		metadata: v.object({
			model: v.optional(v.string()),
			tokens: v.optional(v.number()),
			latency: v.optional(v.number()),
			context: v.optional(v.any()),
		}),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_organization", ["organizationId"])
		.index("by_project", ["projectId"])
		.index("by_user", ["userId"])
		.index("by_organization_and_project", ["organizationId", "projectId"])
		.index("by_project_and_context", ["projectId", "context"])
		.index("by_created_at", ["createdAt"]),

	/**
	 * 5. Subscriptions Table
	 * Polar billing integration
	 */
	subscriptions: defineTable({
		clerkUserId: v.string(),
		organizationId: v.string(),
		tierKey: v.string(), // "tier_1", "tier_2", "tier_3" — links to subscriptionTiers.tierKey
		polarSubscriptionId: v.string(),
		polarCustomerId: v.string(),
		polarProductId: v.string(),
		status: v.union(
			v.literal("active"),
			v.literal("canceled"),
			v.literal("past_due"),
			v.literal("trialing"),
		),
		currentPeriodStart: v.number(),
		currentPeriodEnd: v.number(),
		cancelAtPeriodEnd: v.boolean(),
		plan: v.object({
			name: v.string(),
			tier: v.union(
				v.literal("free"),
				v.literal("starter"),
				v.literal("pro"),
				v.literal("enterprise"),
			),
			monthlyCredits: v.number(),
			features: v.array(v.string()),
		}),
		createdAt: v.number(),
		updatedAt: v.number(),
		canceledAt: v.optional(v.number()),
	})
		.index("by_clerk_user_id", ["clerkUserId"])
		.index("by_organization", ["organizationId"])
		.index("by_organization_and_status", ["organizationId", "status"])
		.index("by_polar_subscription_id", ["polarSubscriptionId"])
		.index("by_polar_customer_id", ["polarCustomerId"])
		.index("by_polar_product_id", ["polarProductId"])
		.index("by_status", ["status"]),

	/**
	 * 6. Usage Tracking Table
	 * AI service usage and cost tracking
	 */
	usageTracking: defineTable({
		userId: v.string(), // Clerk user ID
		service: v.string(), // 'openai', 'together', 'fal'
		model: v.string(),
		projectId: v.optional(v.string()),
		resourceType: v.string(), // 'chat', 'prompt', 'image', 'video', 'audio'
		resourceId: v.optional(v.string()),
		eventType: v.string(), // 'generation', 'enhancement', 'conversation'
		creditsUsed: v.number(),
		cost: v.number(), // Actual USD cost
		metadata: v.optional(v.any()),
		timestamp: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_project", ["projectId"])
		.index("by_timestamp", ["timestamp"]),

	/**
	 * 7. Activities Table
	 * User activity log for dashboard feed
	 */
	activities: defineTable({
		organizationId: v.string(),
		userId: v.string(), // Clerk user ID
		projectId: v.optional(v.string()),
		type: v.string(), // Generic event type — app defines its own values
		title: v.string(),
		description: v.string(),
		metadata: v.optional(v.any()),
		createdAt: v.number(),
	})
		.index("by_organization", ["organizationId"])
		.index("by_user", ["userId"])
		.index("by_project", ["projectId"])
		.index("by_organization_and_created_at", ["organizationId", "createdAt"])
		.index("by_type", ["type"]),

	/**
	 * 8. Shared Links Table
	 * Token-gated public URL sharing pattern
	 */
	sharedLinks: defineTable({
		organizationId: v.string(),
		resourceId: v.string(), // Generic — any resource type
		userId: v.string(), // Clerk user ID
		token: v.string(),
		expiresAt: v.optional(v.number()),
		allowDownload: v.boolean(),
		viewCount: v.number(),
		lastViewedAt: v.optional(v.number()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_organization", ["organizationId"])
		.index("by_resource", ["resourceId"])
		.index("by_user", ["userId"])
		.index("by_token", ["token"]),

	// ============================================================
	// CREDIT SYSTEM TABLES
	// ============================================================

	/**
	 * 9. User Credits Table
	 * Per-user credit balance
	 */
	userCredits: defineTable({
		clerkUserId: v.string(),
		organizationId: v.optional(v.string()),
		balance: v.number(),
		totalPurchased: v.number(),
		totalUsed: v.number(),
		totalBonusReceived: v.number(),
		subscriptionTier: v.optional(v.string()), // e.g., "tier_1" | "tier_2" | "tier_3"
		createdAt: v.number(),
		updatedAt: v.number(),
		lastResetAt: v.optional(v.number()),
	})
		.index("by_clerk_user", ["clerkUserId"])
		.index("by_organization", ["organizationId"]),

	/**
	 * 10. Credit Transactions Table
	 * Audit log of all credit operations
	 */
	creditTransactions: defineTable({
		clerkUserId: v.string(),
		organizationId: v.optional(v.string()),
		type: v.union(
			v.literal("initial"),
			v.literal("purchase"),
			v.literal("subscription_reset"),
			v.literal("usage"),
			v.literal("refund"),
			v.literal("bonus"),
			// A manual, self-service credit grant recorded by
			// credits.recordManualTopUp — no payment occurred, so it must never
			// be written as "purchase". Gated by systemConfig key
			// "manual_topup_enabled" (off by default, see convex/seedCredits.ts).
			v.literal("manual_grant"),
		),
		amount: v.number(), // Positive = add, Negative = deduct
		balanceAfter: v.number(),
		projectId: v.optional(v.string()),
		projectName: v.optional(v.string()),
		actionType: v.optional(v.string()),
		resourceId: v.optional(v.string()),
		description: v.string(),
		originalTransactionId: v.optional(v.id("creditTransactions")),
		polarOrderId: v.optional(v.string()), // Idempotency for Polar webhook orders
		metadata: v.optional(v.any()),
		timestamp: v.number(),
	})
		.index("by_user", ["clerkUserId"])
		.index("by_user_and_timestamp", ["clerkUserId", "timestamp"])
		.index("by_project", ["projectId"])
		.index("by_type", ["type"])
		.index("by_polar_order_id", ["polarOrderId"]),

	/**
	 * 11. Credit Costs Table
	 * Configurable costs per AI action — change costs without code deploy
	 */
	creditCosts: defineTable({
		actionType: v.string(),
		displayName: v.string(),
		credits: v.number(),
		description: v.string(),
		category: v.string(), // "chat", "image", "video", "audio"
		isActive: v.boolean(),
		updatedAt: v.number(),
	})
		.index("by_action_type", ["actionType"])
		.index("by_category", ["category"]),

	/**
	 * 12. Subscription Tiers Table
	 * Single source of truth for Polar products (subscriptions + one-time packages)
	 */
	subscriptionTiers: defineTable({
		tierKey: v.string(),
		displayName: v.string(),
		initialCredits: v.number(),
		monthlyCredits: v.optional(v.number()),
		bonusCredits: v.optional(v.number()),
		sortOrder: v.number(),
		isActive: v.boolean(),
		description: v.optional(v.string()),
		polarProductId: v.optional(v.string()),
		productType: v.optional(
			v.union(v.literal("subscription"), v.literal("one_time")),
		),
		priceUsd: v.optional(v.number()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_tier_key", ["tierKey"])
		.index("by_sort_order", ["sortOrder"])
		.index("by_polar_product_id", ["polarProductId"]),

	/**
	 * 13. Workspaces Table
	 * Scoped containers within an organization (personal or shared).
	 * Each user gets a default personal workspace on first login.
	 */
	workspaces: defineTable({
		organizationId: v.string(), // Clerk org ID (or "personal" for solo users)
		ownerId: v.string(), // Clerk user ID
		name: v.string(),
		slug: v.optional(v.string()),
		description: v.optional(v.string()),
		icon: v.optional(v.string()),
		color: v.optional(v.string()),
		isDefault: v.optional(v.boolean()),
		settings: v.optional(
			v.object({
				defaultModel: v.optional(v.string()),
				theme: v.optional(v.string()),
			}),
		),
		lastAccessedAt: v.optional(v.number()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_owner", ["ownerId"])
		.index("by_organization", ["organizationId"])
		.index("by_owner_and_default", ["ownerId", "isDefault"]),

	/**
	 * 14. Agent Memory Table
	 * Convex-backed memory for AI agents — virtual file system per user/workspace.
	 * Paths map to a virtual /memories/ directory:
	 *   /memories/core.md        → type: 'core', injected every turn via prepareCall
	 *   /memories/notes.md       → type: 'notes', on-demand archival
	 *   /memories/prefs.md       → type: 'preference', user-specific persistent state
	 */
	agentMemory: defineTable({
		userId: v.string(), // Clerk user ID
		workspaceId: v.optional(v.id("workspaces")),
		path: v.string(), // e.g. '/memories/core.md'
		content: v.string(),
		memoryType: v.union(
			v.literal("core"), // Injected every turn
			v.literal("notes"), // On-demand archival
			v.literal("preference"), // User-specific persistent state
		),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_user_and_path", ["userId", "path"])
		.index("by_workspace", ["workspaceId"]),

	/**
	 * 15. System Config Table
	 * Runtime-tunable global settings
	 */
	systemConfig: defineTable({
		key: v.string(),
		value: v.any(),
		description: v.string(),
		updatedAt: v.number(),
		updatedBy: v.optional(v.string()),
	}).index("by_key", ["key"]),

	// ============================================================================
	// ORCHESTRATION TABLES (Phase 1 — ported from vantage-studio)
	// ============================================================================

	/**
	 * 16. Skills Table
	 * Reusable agent capabilities — the SKILL.md body stored in DB.
	 */
	skills: defineTable({
		name: v.string(),
		slug: v.string(),
		description: v.string(),
		instructions: v.string(), // Markdown — the SKILL.md body
		category: v.union(
			v.literal("document"),
			v.literal("analysis"),
			v.literal("research"),
			v.literal("communication"),
			v.literal("development"),
			v.literal("creative"),
		),
		isSystem: v.boolean(),
		createdBy: v.optional(v.string()), // Clerk user ID
		workspaceId: v.optional(v.id("workspaces")),
		visibility: v.union(
			v.literal("system"),
			v.literal("workspace"),
			v.literal("private"),
		),
		sourceUrl: v.optional(v.string()),
		usageCount: v.number(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_workspace", ["workspaceId"])
		.index("by_category", ["category"])
		.index("by_system", ["isSystem"])
		.index("by_slug", ["slug"]),

	/**
	 * 17. Custom Roles Table
	 * User-created professional roles for the 4-Pillars agent composition model.
	 */
	customRoles: defineTable({
		name: v.string(),
		icon: v.string(),
		description: v.string(),
		category: v.string(),
		expertise: v.array(v.string()),
		systemPrompt: v.string(),
		isSystem: v.optional(v.boolean()),
		workspaceId: v.optional(v.id("workspaces")),
		createdBy: v.optional(v.string()), // Clerk user ID
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_workspace", ["workspaceId"])
		.index("by_creator", ["createdBy"])
		.index("by_category", ["category"])
		.index("by_system", ["isSystem"]),

	/**
	 * 18. Custom Personas Table
	 * User-created communication styles for the 4-Pillars agent composition model.
	 */
	customPersonas: defineTable({
		name: v.string(),
		icon: v.string(),
		description: v.string(),
		traits: v.array(v.string()),
		communicationStyle: v.string(),
		decisionMaking: v.string(),
		systemPromptModifier: v.string(),
		isSystem: v.optional(v.boolean()),
		workspaceId: v.optional(v.id("workspaces")),
		createdBy: v.optional(v.string()), // Clerk user ID
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_workspace", ["workspaceId"])
		.index("by_creator", ["createdBy"])
		.index("by_system", ["isSystem"]),

	/**
	 * 19. Custom Frameworks Table
	 * User-created thinking methodologies for the 4-Pillars agent composition model.
	 */
	customFrameworks: defineTable({
		name: v.string(),
		icon: v.string(),
		description: v.string(),
		methodology: v.string(),
		bestFor: v.array(v.string()),
		steps: v.array(v.string()),
		systemPromptModifier: v.string(),
		isSystem: v.optional(v.boolean()),
		workspaceId: v.optional(v.id("workspaces")),
		createdBy: v.optional(v.string()), // Clerk user ID
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_workspace", ["workspaceId"])
		.index("by_creator", ["createdBy"])
		.index("by_system", ["isSystem"]),

	/**
	 * 20. Agents Table
	 * Configured AI workers composed via the 4-Pillars model (Role + Persona + Framework + Skills).
	 * Pre-build blocker #4: roleId/personaId/frameworkId use typed v.id() — not v.string().
	 * Added: token field for per-agent HTTP auth (not in vantage-studio).
	 */
	agents: defineTable({
		workspaceId: v.optional(v.id("workspaces")), // undefined = system agent (global)
		createdBy: v.string(), // Clerk user ID or "system"

		// Identity
		name: v.string(),
		description: v.optional(v.string()),
		avatar: v.optional(v.string()), // Emoji or URL

		// 4-Pillars composition — typed foreign keys (pre-build blocker #4)
		roleId: v.id("customRoles"),
		roleName: v.string(), // Denormalized for display
		roleSystemPrompt: v.string(),
		personaId: v.id("customPersonas"),
		personaName: v.string(),
		personaModifier: v.string(),
		frameworkId: v.optional(v.id("customFrameworks")),
		frameworkName: v.optional(v.string()),
		frameworkModifier: v.optional(v.string()),
		skillIds: v.array(v.id("skills")),

		// Model selection
		model: v.string(), // e.g., "claude-sonnet-4-5"
		provider: v.string(), // e.g., "anthropic"
		customInstructions: v.optional(v.string()),
		temperature: v.optional(v.number()),
		maxTokens: v.optional(v.number()),

		// Per-agent auth token (NOT in vantage-studio — added for HTTP endpoint auth)
		// 32-byte hex, generated at creation. Stored plain (Convex DB is at-rest encrypted).
		token: v.optional(v.string()),
		tokenCreatedAt: v.optional(v.number()),

		// Status
		isSystem: v.boolean(),
		isActive: v.boolean(),
		usageCount: v.number(),
		visibility: v.union(v.literal("private"), v.literal("workspace")),

		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_workspace", ["workspaceId"])
		.index("by_creator", ["createdBy"])
		.index("by_workspace_active", ["workspaceId", "isActive"])
		.index("by_system", ["isSystem"]),

	/**
	 * 21. Missions Table
	 * High-level work containers. Scoped to workspace.
	 * Pre-build blocker #2: projectId removed — projects table does not exist in vantage-starter.
	 * Status enum uses the execution-oriented values (not vantage-studio's brainstorm/plan/execute).
	 */
	missions: defineTable({
		name: v.string(),
		description: v.optional(v.string()),
		brief: v.optional(v.string()),
		objective: v.optional(v.string()),
		status: v.union(
			v.literal("pending"),
			v.literal("executing"),
			v.literal("awaiting_checkpoint"),
			v.literal("completed"),
			v.literal("failed"),
		),
		intent: v.optional(
			v.union(
				v.literal("delivery"),
				v.literal("experiment"),
				v.literal("internal"),
			),
		),
		structure: v.optional(
			v.union(
				v.literal("linear"),
				v.literal("milestones"),
				v.literal("multi-stream"),
			),
		),
		priority: v.optional(
			v.union(
				v.literal("urgent"),
				v.literal("high"),
				v.literal("medium"),
				v.literal("low"),
			),
		),
		successCriteria: v.optional(v.array(v.string())),
		progress: v.optional(v.number()),
		startDate: v.optional(v.number()),
		targetDate: v.optional(v.number()),
		workspaceId: v.id("workspaces"),
		// projectId intentionally omitted — projects table is post-MVP
		createdBy: v.string(), // Clerk user ID
		ownerId: v.optional(v.string()),
		isArchived: v.optional(v.boolean()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_workspace", ["workspaceId"])
		.index("by_workspace_status", ["workspaceId", "status"])
		.index("by_workspace_priority", ["workspaceId", "priority"])
		.index("by_workspace_archived", ["workspaceId", "isArchived"])
		.index("by_created_by", ["createdBy"]),

	/**
	 * 22. Operations Table
	 * Tasks within a mission — flat with dependency graph.
	 * Pre-build blocker #3: dependsOn resolved via two-pass insert in commitPlan.
	 */
	operations: defineTable({
		missionId: v.id("missions"),
		workspaceId: v.id("workspaces"),
		name: v.string(),
		description: v.optional(v.string()),
		type: v.union(v.literal("ai"), v.literal("human")),
		status: v.union(
			v.literal("pending"),
			v.literal("blocked"), // Waiting on dependencies
			v.literal("in_progress"),
			v.literal("awaiting_review"),
			v.literal("completed"),
			v.literal("failed"),
		),
		assignedAgentId: v.optional(v.id("agents")),
		assignedTo: v.optional(v.string()), // Clerk user ID for human ops
		dependsOn: v.optional(v.array(v.id("operations"))),
		requiresReview: v.optional(v.boolean()),
		requiredTools: v.optional(v.array(v.string())),
		prompt: v.optional(v.string()),
		output: v.optional(v.string()),
		error: v.optional(v.string()),
		artifacts: v.optional(v.array(v.string())),
		priority: v.optional(
			v.union(
				v.literal("urgent"),
				v.literal("high"),
				v.literal("medium"),
				v.literal("low"),
			),
		),
		estimatedMinutes: v.optional(v.number()),
		actualMinutes: v.optional(v.number()),
		claimedAt: v.optional(v.number()),
		startedAt: v.optional(v.number()),
		completedAt: v.optional(v.number()),
		orderPosition: v.optional(v.number()),
		createdBy: v.string(), // Clerk user ID
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_mission", ["missionId"])
		.index("by_workspace", ["workspaceId"])
		.index("by_workspace_status", ["workspaceId", "status"])
		.index("by_mission_status", ["missionId", "status"])
		.index("by_assigned_agent", ["assignedAgentId"])
		.index("by_assigned_to", ["assignedTo"])
		.index("by_created_by", ["createdBy"]),

	/**
	 * 23. Checkpoints Table
	 * Human approval gates — blocks downstream operations until approved.
	 * Rejection is a hard kill: mission.status = "failed" with no recovery (MVP).
	 */
	checkpoints: defineTable({
		missionId: v.id("missions"),
		afterOperationId: v.id("operations"),
		description: v.string(),
		status: v.union(
			v.literal("pending"),
			v.literal("approved"),
			v.literal("rejected"),
		),
		approvedBy: v.optional(v.string()), // Clerk user ID
		approvedAt: v.optional(v.number()),
		rejectionReason: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_mission", ["missionId"])
		.index("by_operation", ["afterOperationId"])
		.index("by_mission_status", ["missionId", "status"]),

	/**
	 * 24. Architect Sessions Table
	 * Conversation history for AI-driven mission planning.
	 * Pre-build blocker #2: projectId removed — projects table is post-MVP.
	 */
	architectSessions: defineTable({
		workspaceId: v.id("workspaces"),
		status: v.union(
			v.literal("active"),
			v.literal("completed"),
			v.literal("abandoned"),
		),
		existingMissionId: v.optional(v.id("missions")),
		missionContext: v.optional(
			v.object({
				missionId: v.string(),
				missionName: v.string(),
				missionBrief: v.optional(v.string()),
			}),
		),
		createdBy: v.string(), // Clerk user ID
		title: v.optional(v.string()),
		// isTitleCustom: true once the user has explicitly renamed the session —
		// the automatic first-exchange title mechanism never overwrites it again.
		isTitleCustom: v.optional(v.boolean()),
		// projectId intentionally omitted — projects table is post-MVP
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_workspace", ["workspaceId"])
		.index("by_workspace_created", ["workspaceId", "createdAt"])
		.index("by_user", ["createdBy"])
		.index("by_status", ["status"])
		.index("by_existing_mission", ["existingMissionId"]),

	/**
	 * 26. Consultant Projects Table
	 * Onboarding flow: client scrape → competitor intel → discovery chat → config generation.
	 */
	consultantProjects: defineTable({
		workspaceId: v.id("workspaces"),
		name: v.string(),
		clientName: v.string(),
		clientWebsiteUrl: v.string(),
		sector: v.string(),
		brandKit: v.optional(v.any()), // Scraped brand data: name, tagline, colors, products, tech stack
		competitors: v.optional(
			v.array(
				v.object({
					name: v.string(),
					url: v.string(),
					positioning: v.optional(v.string()),
					pricing: v.optional(v.string()),
					offers: v.optional(v.string()),
					differentiators: v.optional(v.string()),
					scrapedAt: v.optional(v.number()),
					error: v.optional(v.string()),
					// True only when FIRECRAWL_API_KEY was absent at scrape time.
					configMissing: v.optional(v.boolean()),
				}),
			),
		),
		knowledgeBase: v.optional(v.any()), // Extracted content from client site
		sessionId: v.optional(v.id("architectSessions")),
		config: v.optional(v.any()), // Generated OnboardingConfig JSON
		status: v.union(
			v.literal("created"),
			v.literal("scraping"),
			v.literal("competitors"),
			v.literal("discovery"),
			v.literal("review"),
			v.literal("deployed"),
		),
		selectedTeams: v.optional(v.array(v.string())),
		selectedAgents: v.optional(v.array(v.string())),
		selectedSkills: v.optional(v.array(v.string())),
		createdBy: v.string(), // Clerk user ID
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_workspace", ["workspaceId"])
		.index("by_creator", ["createdBy"])
		.index("by_status", ["status"]),

	/**
	 * 25. Architect Messages Table
	 * Individual messages within an Architect session.
	 */
	architectMessages: defineTable({
		sessionId: v.id("architectSessions"),
		role: v.union(v.literal("user"), v.literal("assistant")),
		content: v.string(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_session", ["sessionId"])
		.index("by_session_created", ["sessionId", "createdAt"]),

	// ============================================================================
	// REGISTRY TABLES (Phase 1 — consultant onboarding)
	// Stores vantage-registry component catalogue locally for fast query + fallback.
	// ============================================================================

	/**
	 * 27. Registry Teams Table
	 * A team is a named bundle of agents + skills organized around a business function.
	 * category: the business domain (marketing, sales, engineering, operations, support, analytics).
	 */
	registryTeams: defineTable({
		teamId: v.string(), // Stable slug, e.g. "content-marketing"
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
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_team_id", ["teamId"])
		.index("by_category", ["category"]),

	/**
	 * 28. Registry Agents Table
	 * An agent is a specialist AI worker belonging to one team.
	 */
	registryAgents: defineTable({
		agentId: v.string(), // Stable slug, e.g. "content-strategist"
		name: v.string(),
		role: v.string(),
		description: v.string(),
		skills: v.array(v.string()), // skill IDs
		teamId: v.string(),
		persona: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_agent_id", ["agentId"])
		.index("by_team", ["teamId"]),

	/**
	 * 29. Registry Skills Table
	 * A skill is a reusable capability that agents can execute.
	 */
	registrySkills: defineTable({
		skillId: v.string(), // Stable slug, e.g. "blog-post-writing"
		name: v.string(),
		description: v.string(),
		category: v.string(),
		agentId: v.optional(v.string()),
		teamId: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_skill_id", ["skillId"])
		.index("by_team", ["teamId"])
		.index("by_category", ["category"]),

	// ============================================================================
	// CHAT SYSTEM TABLES (Phase 1 — ported from vantage-studio)
	// ============================================================================

	/**
	 * 26. Chats Table
	 * Workspace-scoped conversation containers.
	 * Distinct from chatMessages (table 4) — parent-scoped by workspaces._id.
	 */
	chats: defineTable({
		title: v.string(),
		workspaceId: v.id("workspaces"),
		projectId: v.optional(v.id("projects")),
		createdBy: v.string(), // Clerk user ID
		visibility: v.optional(
			v.union(v.literal("private"), v.literal("workspace")),
		),
		isPinned: v.optional(v.boolean()),
		// isTitleCustom: true once the user has explicitly renamed the chat —
		// the automatic first-exchange title mechanism never overwrites it again.
		isTitleCustom: v.optional(v.boolean()),
		enabledToolkits: v.optional(
			v.array(
				v.object({
					slug: v.string(),
					isConnected: v.boolean(),
				}),
			),
		),
		selectedModel: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_workspace", ["workspaceId"])
		.index("by_workspace_created", ["workspaceId", "createdAt"])
		.index("by_project", ["projectId"])
		.index("by_creator", ["createdBy"]),

	/**
	 * 27. Projects Table
	 * Organizes chats within a workspace.
	 */
	projects: defineTable({
		name: v.string(),
		description: v.optional(v.string()),
		icon: v.optional(v.string()),
		color: v.optional(v.string()),
		workspaceId: v.id("workspaces"),
		createdBy: v.string(), // Clerk user ID
		settings: v.optional(
			v.object({
				defaultView: v.optional(
					v.union(v.literal("board"), v.literal("list"), v.literal("timeline")),
				),
				color: v.optional(v.string()),
				icon: v.optional(v.string()),
			}),
		),
		orderPosition: v.optional(v.number()),
		isArchived: v.optional(v.boolean()),
		taskCount: v.optional(v.number()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_workspace", ["workspaceId"])
		.index("by_creator", ["createdBy"])
		// D3: compound index for archived filter — avoids in-memory JS filtering in list query
		.index("by_workspace_archived", ["workspaceId", "isArchived"]),

	/**
	 * 28. Messages Table
	 * Individual messages within a chat.
	 * Distinct from chatMessages (table 4) — parent-scoped by chats._id.
	 */
	messages: defineTable({
		chatId: v.id("chats"),
		role: v.union(v.literal("user"), v.literal("assistant")),
		content: v.string(),
		// v.any() justified: AI SDK v6 `parts` shape is provider-controlled (text/tool-call/tool-result
		// union). Typed validators planned for Phase 5 once the shape is stable across providers.
		// TODO Phase 5: replace with v.union(v.object({type: v.literal("text"), ...}), ...)
		parts: v.optional(v.any()),
		// v.any() justified: attachment metadata (file URLs, mime types) comes from Convex file storage
		// response whose shape may vary. Typed validators planned for Phase 5.
		// TODO Phase 5: type as v.object({ url: v.string(), name: v.string(), mimeType: v.string() })
		attachments: v.optional(v.any()),
		toolCalls: v.optional(
			v.array(
				v.object({
					id: v.string(),
					toolName: v.string(),
					// v.any() justified: tool args are user-defined JSON schemas — shape is controlled by the
					// tool definition, not by Convex. Cannot type-check without generating validators per tool.
					// TODO Phase 5: generate per-tool validators from the tool registry.
					args: v.any(),
					// v.any() justified: tool results are user-defined — same reasoning as args above.
					// TODO Phase 5: generate per-tool result validators from the tool registry.
					result: v.optional(v.any()),
					status: v.union(
						v.literal("pending"),
						v.literal("success"),
						v.literal("error"),
					),
				}),
			),
		),
		createdAt: v.number(),
	})
		// D2: by_chat removed — by_chat_created (["chatId", "createdAt"]) is a superset.
		// All queries that need chatId-only filtering can use by_chat_created with eq(chatId).
		.index("by_chat_created", ["chatId", "createdAt"]),

	// ============================================================================
	// AI MODEL CATALOG (ported from vantage-studio)
	// ============================================================================

	/**
	 * 29. AI Models Table
	 * Global catalog of available AI models — admins manage, all users read.
	 * No workspace scoping — these are platform-level settings.
	 *
	 * Data source: Vercel AI Gateway (https://vercel.com/ai-gateway/models)
	 * Last updated: January 17, 2026
	 */
	aiModels: defineTable({
		// === IDENTIFIERS ===
		// Internal ID used in code and stored in chats.selectedModel
		modelId: v.string(), // e.g., "gpt-4o", "claude-sonnet-4"

		// Vercel AI Gateway model path (provider/model-name format)
		gatewayModel: v.string(), // e.g., "openai/gpt-4o", "anthropic/claude-sonnet-4-20250514"

		// === DISPLAY INFO ===
		displayName: v.string(), // e.g., "GPT-4o", "Claude Sonnet 4"
		description: v.string(), // e.g., "Best for tasks & tools"
		logoUrl: v.optional(v.string()), // e.g., "https://vercel.com/.../anthropic.png"

		// === PROVIDER INFO ===
		provider: v.union(
			v.literal("anthropic"),
			v.literal("openai"),
			v.literal("google"),
			v.literal("xai"),
			v.literal("deepseek"),
			v.literal("meta"),
			v.literal("mistral"),
		),

		// === CAPABILITIES ===
		contextWindow: v.number(), // e.g., 128000, 200000, 1000000
		maxOutput: v.number(), // e.g., 4096, 8192, 16384
		bestAt: v.string(), // e.g., "Tool calling & tasks"

		// === PRICING (per million tokens) ===
		inputCostPerMillion: v.optional(v.number()), // e.g., 3.00 for $3.00/M
		outputCostPerMillion: v.optional(v.number()), // e.g., 15.00 for $15.00/M

		// === CACHING ===
		supportsCache: v.optional(v.boolean()),
		cacheReadCostPerMillion: v.optional(v.number()),
		cacheWriteCostPerMillion: v.optional(v.number()),

		// === WEB SEARCH ===
		supportsWebSearch: v.optional(v.boolean()),
		webSearchCostPer1K: v.optional(v.number()),

		// === CATEGORIZATION ===
		category: v.union(
			v.literal("flagship"),
			v.literal("balanced"),
			v.literal("fast"),
			v.literal("reasoning"),
			v.literal("coding"),
			v.literal("vision"),
		),

		// === FEATURES ===
		supportsVision: v.optional(v.boolean()),
		supportsTools: v.optional(v.boolean()),
		supportsStreaming: v.optional(v.boolean()),
		supportsReasoning: v.optional(v.boolean()),

		// === AVAILABILITY ===
		isEnabled: v.boolean(),
		isDefault: v.optional(v.boolean()),
		orderPosition: v.optional(v.number()),

		// === TIMESTAMPS ===
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_model_id", ["modelId"])
		.index("by_provider", ["provider"])
		.index("by_category", ["category"])
		.index("by_enabled", ["isEnabled"]),
});
