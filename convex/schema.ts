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
	 * 13. System Config Table
	 * Runtime-tunable global settings
	 */
	systemConfig: defineTable({
		key: v.string(),
		value: v.any(),
		description: v.string(),
		updatedAt: v.number(),
		updatedBy: v.optional(v.string()),
	}).index("by_key", ["key"]),
});
