import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * VantageStarter — Convex Database Schema
 *
 * Generic SaaS infrastructure tables only.
 * VantageStarter-specific tables archived to _archive/convex/.
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
		password: v.optional(v.string()),
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
});
