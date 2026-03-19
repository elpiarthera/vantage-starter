import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * COMPLETE Convex Database Schema for MyShortReel
 * Based on: docs/Guides/convex-database-schema.md
 *
 * ALL 19 TABLES IMPLEMENTED
 * Multi-tenancy architecture INCLUDED
 *
 * Tables:
 * 1. organizations - Multi-tenancy root
 * 2. users - User profiles and preferences
 * 3. projects - Video invitation projects
 * 4. scenes - Individual video scenes
 * 5. assets - File uploads (images, videos, audio)
 * 6. audioTracks - Music, narration, sound effects
 * 7. videos - Final rendered videos
 * 8. chatMessages - AI chat history
 * 9. templates - Project templates
 * 10. subscriptions - Polar billing integration
 * 11. creditBalances - Credit tracking (organization-level, legacy)
 * 12. usageTracking - API usage metering
 * 13. activities - User activity log
 * 14. sharedLinks - Video sharing
 *
 * Credit System Tables (Sprint: Production Ready):
 * 15. userCredits - Per-user credit balance
 * 16. creditTransactions - Audit log of all credit operations
 * 17. creditCosts - Configurable costs per AI action
 * 18. subscriptionTiers - Dynamic subscription tier definitions
 * 19. systemConfig - Global system configuration
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
			v.literal("couple"),
			v.literal("agency"),
			v.literal("team"),
		),
		totalProjects: v.number(),
		totalVideos: v.number(),
		totalCreditsUsed: v.number(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_clerk_org_id", ["clerkOrganizationId"])
		.index("by_type", ["type"]),

	/**
	 * 2. Users Table
	 * Minimal user data - Clerk handles auth
	 * Extended with Sprint 1 fields for user sync
	 */
	users: defineTable({
		// Core fields from schema doc
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
				defaultStyle: v.optional(v.string()),
				language: v.string(),
				notifications: v.boolean(),
			}),
		),
		totalProjects: v.optional(v.number()), // Optional for backward compatibility
		lastActiveAt: v.optional(v.number()), // Optional for backward compatibility

		// Sprint 1 fields (synced from Clerk for convenience)
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
	 * 3. Projects Table
	 * Video invitation projects
	 */
	projects: defineTable({
		userId: v.string(), // Clerk user ID
		organizationId: v.optional(v.string()),
		name: v.string(),
		occasion: v.string(),
		theme: v.string(),
		visualStyle: v.optional(v.string()), // Step 2b: Visual style selection
		approvedMessageId: v.optional(v.string()), // Step 2: Approved story concept message ID

		// Step 1 → Step 2: AI-generated story (saved to avoid re-generation)
		generatedStory: v.optional(
			v.object({
				title: v.string(),
				narration: v.string(),
				emotionalArc: v.string(),
				scenes: v.array(
					v.object({
						number: v.number(),
						description: v.string(),
						mood: v.string(),
					}),
				),
				musicSuggestion: v.string(),
				generatedAt: v.number(), // Timestamp
			}),
		),

		eventDetails: v.object({
			eventTitle: v.string(),
			description: v.optional(v.string()),
			date: v.optional(v.string()),
			location: v.optional(v.string()),
			rsvpLink: v.optional(v.string()),
			emotionalStory: v.string(),
		}),
		language: v.string(),
		duration: v.number(),
		status: v.union(
			v.literal("draft"),
			v.literal("in_progress"),
			v.literal("completed"),
		),
		// Sprint 8: Final assembly outputs
		finalVideoUrl: v.optional(v.string()), // Convex Storage URL
		finalVideoStorageId: v.optional(v.id("_storage")),
		finalVideoDurationMs: v.optional(v.number()),
		finalVideoSize: v.optional(v.number()),
		finalAssemblyAt: v.optional(v.number()),
		assemblyStatus: v.optional(
			v.union(
				v.literal("preparing_assets"),
				v.literal("processing_media"),
				v.literal("finalizing_video"),
				v.literal("saving_video"),
				v.literal("completed"),
				v.literal("failed"),
			),
		),
		approvedNarrationScript: v.optional(v.string()), // Step 3b approved script
		narrationAudioUrl: v.optional(v.string()), // Generated TTS URL
		narrationAudioStorageId: v.optional(v.id("_storage")), // Convex storage ID for narration
		narrationDurationMs: v.optional(v.number()), // Duration of final narration in ms
		musicAudioUrl: v.optional(v.string()), // Generated music URL
		musicAudioStorageId: v.optional(v.id("_storage")), // Convex storage ID for music

		// Step 4: Voice & Music data
		step4Data: v.optional(
			v.object({
				// Voice settings
				selectedVoice: v.optional(v.string()),
				pacing: v.optional(v.array(v.number())),
				pitch: v.optional(v.array(v.number())),
				energy: v.optional(v.array(v.number())),

				// Narration takes
				narrationTakes: v.optional(
					v.array(
						v.object({
							id: v.string(),
							name: v.string(),
							voice: v.string(),
							settings: v.object({
								pacing: v.number(),
								pitch: v.number(),
								energy: v.number(),
							}),
							audioUrl: v.optional(v.string()),
							audioStorageId: v.optional(v.id("_storage")), // Convex storage ID when stored in Convex
							durationMs: v.optional(v.number()),
						}),
					),
				),
				selectedNarrationTake: v.optional(v.string()),

				// Music settings
				musicPrompt: v.optional(v.string()),
				musicTakes: v.optional(
					v.array(
						v.object({
							id: v.string(),
							name: v.string(),
							prompt: v.string(),
							audioUrl: v.optional(v.string()),
							audioStorageId: v.optional(v.id("_storage")), // Convex storage ID when stored in Convex
						}),
					),
				),
				selectedMusicTrack: v.optional(v.string()),

				// Volume controls
				narrationVolume: v.optional(v.number()),
				musicVolume: v.optional(v.number()),

				// Validation flags
				narratorValidated: v.optional(v.boolean()),
				musicValidated: v.optional(v.boolean()),

				// Pending music generation state — persisted before polling so job is recoverable
				pendingMusicGeneration: v.optional(
					v.object({
						falRequestId: v.string(),
						statusUrl: v.string(),
						responseUrl: v.string(),
						creditTransactionId: v.optional(v.id("creditTransactions")),
						startedAt: v.number(),
						status: v.union(
							v.literal("pending"),
							v.literal("completed"),
							v.literal("failed"),
						),
					}),
				),

				completedAt: v.optional(v.number()),
			}),
		),

		// Sprint 11: Transition configuration for video assembly
		transitionConfig: v.optional(
			v.object({
				mode: v.union(v.literal("hard_cut"), v.literal("xfade")),
				xfadeType: v.optional(v.string()), // "circleopen", "fade", "dissolve", etc.
				transitionDuration: v.optional(v.number()), // seconds (default: 1.0)
			}),
		),

		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_organization", ["organizationId"])
		.index("by_user_and_status", ["userId", "status"])
		.index("by_organization_and_status", ["organizationId", "status"]),

	/**
	 * 4. Scenes Table
	 * Individual video scenes within projects
	 * UPDATED Sprint 6: Added video generation tracking fields
	 * UPDATED Sprint 11 Phase 2: Added outgoingTransition for per-scene transitions
	 */
	scenes: defineTable({
		projectId: v.string(), // References projects._id
		userId: v.string(), // Clerk user ID
		sceneNumber: v.number(),
		title: v.string(),
		description: v.string(),
		duration: v.number(),
		startFrame: v.optional(v.string()), // References assets._id
		endFrame: v.optional(v.string()), // References assets._id
		// Template-sourced frame URLs (when scene created from template)
		startFrameImageUrl: v.optional(v.string()),
		endFrameImageUrl: v.optional(v.string()),
		cinematicStyles: v.optional(
			v.object({
				ambiance: v.optional(v.string()),
				cameraMovement: v.optional(v.string()),
				colorTone: v.optional(v.string()),
				visualStyle: v.optional(v.string()),
			}),
		),
		videoUrl: v.optional(v.string()),
		status: v.union(
			v.literal("draft"),
			v.literal("generating"),
			v.literal("completed"),
			v.literal("failed"), // Sprint 6: Error state
		),

		// Sprint 11 Phase 2: Per-scene transition (outgoing transition to next scene)
		outgoingTransition: v.optional(
			v.object({
				effectKey: v.string(), // References transitionEffects.key (e.g., "circleopen", "fade")
				duration: v.number(), // Transition duration in seconds (default: 1.0)
			}),
		),

		// Sprint 6: Video generation tracking
		// Sprint 37: patched — startFrameUrl/prompt optional, schemaId/creditTransactionId/videoInputUrl added
		videoGeneration: v.optional(
			v.object({
				// fal.ai request tracking
				requestId: v.optional(v.string()), // fal.ai job ID for status polling
				provider: v.string(), // "fal-ai"
				model: v.string(), // "kling-video/v2.5-turbo/pro/image-to-video"

				// Generation parameters (for regeneration)
				prompt: v.optional(v.string()), // V2V/R2V may not have required prompt
				startFrameUrl: v.optional(v.string()), // V2V has no start frame
				endFrameUrl: v.optional(v.string()), // End frame URL (if provided)

				// Sprint 37 additions
				schemaId: v.optional(v.string()), // traceability to videoModelSchemas
				creditTransactionId: v.optional(v.id("creditTransactions")), // for refund-on-failure
				videoInputUrl: v.optional(v.string()), // V2V source video URL
				falVideoUrl: v.optional(v.string()), // fal.ai CDN URL preserved for download recovery

				// Status tracking
				status: v.union(
					v.literal("pending"), // Job submitted, awaiting processing
					v.literal("in_progress"), // Video being generated (legacy)
					v.literal("generating"), // Video being generated (sprint 37)
					v.literal("completed"), // Generation successful
					v.literal("failed"), // Generation failed
				),
				progress: v.optional(v.number()), // 0-100 (if provider supports)

				// Results
				videoUrl: v.optional(v.string()), // Final video URL
				duration: v.optional(v.number()), // Actual video duration (seconds)

				// Error tracking
				error: v.optional(
					v.object({
						message: v.string(),
						code: v.optional(v.string()),
						retryable: v.boolean(),
					}),
				),
				retryCount: v.number(), // Number of retry attempts

				// Cost tracking
				creditsUsed: v.optional(v.number()),
				cost: v.optional(v.number()), // USD

				// Timestamps
				startedAt: v.number(),
				completedAt: v.optional(v.number()),
			}),
		),

		// Sprint 6: Regeneration support
		regenerationHistory: v.optional(
			v.array(
				v.object({
					version: v.number(), // 1, 2, 3...
					feedback: v.string(), // User's regeneration feedback
					previousVideoUrl: v.string(), // Previous version URL
					regeneratedAt: v.number(),
				}),
			),
		),

		// Sprint 6: Current version tracking
		videoVersion: v.optional(v.number()), // Tracks regeneration versions

		// Sprint 8: Video validation status (cross-device persistence)
		validated: v.optional(v.boolean()), // User has validated this scene's video

		needsRegeneration: v.optional(v.boolean()),

		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_project", ["projectId"])
		.index("by_user", ["userId"])
		.index("by_project_and_scene_number", ["projectId", "sceneNumber"])
		.index("by_status", ["status"]), // Sprint 6: Query by generation status

	/**
	 * 5. Assets Table
	 * Uploaded files (images, videos, audio)
	 */
	assets: defineTable({
		userId: v.string(), // Clerk user ID
		projectId: v.optional(v.string()),
		sceneId: v.optional(v.string()), // Optional: associate asset with specific scene
		type: v.union(v.literal("image"), v.literal("video"), v.literal("audio")),
		url: v.string(),
		filename: v.string(),
		size: v.number(),
		uploadedAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_project", ["projectId"])
		.index("by_scene", ["sceneId"])
		.index("by_type", ["type"]),

	/**
	 * 6. Audio Tracks Table
	 * Music, narration, sound effects
	 */
	audioTracks: defineTable({
		organizationId: v.optional(v.string()),
		projectId: v.optional(v.string()),
		userId: v.string(), // Clerk user ID
		type: v.union(
			v.literal("music"),
			v.literal("narration"),
			v.literal("sound_effect"),
		),
		title: v.string(),
		assetId: v.optional(v.string()), // References assets._id when from upload
		storageId: v.optional(v.id("_storage")), // Convex storage when from generation (narration/music)
		order: v.number(),
		startTime: v.number(),
		duration: v.number(),
		volume: v.number(),
		fadeIn: v.optional(v.number()),
		fadeOut: v.optional(v.number()),
		generationConfig: v.optional(
			v.object({
				model: v.string(),
				prompt: v.string(),
				voice: v.optional(v.string()),
				parameters: v.optional(v.any()),
			}),
		),
		creditsUsed: v.number(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_organization", ["organizationId"])
		.index("by_project", ["projectId"])
		.index("by_user", ["userId"])
		.index("by_organization_and_project", ["organizationId", "projectId"])
		.index("by_project_and_order", ["projectId", "order"])
		.index("by_type", ["type"])
		.index("by_project_and_type", ["projectId", "type"]),

	/**
	 * 7. Videos Table
	 * Final assembled videos
	 */
	videos: defineTable({
		organizationId: v.string(),
		projectId: v.string(),
		userId: v.string(), // Clerk user ID
		title: v.string(),
		description: v.optional(v.string()),
		status: v.union(
			v.literal("queued"),
			v.literal("processing"),
			v.literal("completed"),
			v.literal("failed"),
		),
		version: v.number(),
		fileStorageId: v.optional(v.string()),
		url: v.optional(v.string()),
		thumbnailStorageId: v.optional(v.string()),
		thumbnailUrl: v.optional(v.string()),
		metadata: v.object({
			size: v.number(),
			duration: v.number(),
			resolution: v.string(),
			fps: v.number(),
			format: v.string(),
			processingTime: v.number(),
			sceneCount: v.number(),
		}),
		renderConfig: v.object({
			sceneIds: v.array(v.string()),
			audioTrackIds: v.array(v.string()),
			transitions: v.array(v.any()),
			effects: v.array(v.any()),
			assemblyWorkflow: v.optional(
				v.object({
					step1MergedVideoId: v.optional(v.string()),
					step2VideoWithNarrationId: v.optional(v.string()),
					step3FinalVideoId: v.optional(v.string()),
					ffmpegJobIds: v.optional(v.array(v.string())),
				}),
			),
		}),
		creditsUsed: v.number(),
		isPublic: v.boolean(),
		shareToken: v.optional(v.string()),
		viewCount: v.number(),
		downloadCount: v.number(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_organization", ["organizationId"])
		.index("by_project", ["projectId"])
		.index("by_user", ["userId"])
		.index("by_organization_and_project", ["organizationId", "projectId"])
		.index("by_status", ["status"])
		.index("by_share_token", ["shareToken"]),

	/**
	 * 8. Chat Messages Table
	 * AI chat history for guided workflow
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
		step: v.number(),
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
		.index("by_project_and_step", ["projectId", "step"])
		.index("by_created_at", ["createdAt"]),

	/**
	 * 9. Templates Table
	 * Project templates (system and user-created)
	 */
	templates: defineTable({
		organizationId: v.optional(v.string()),
		userId: v.optional(v.string()), // Clerk user ID
		name: v.string(),
		description: v.string(),
		category: v.string(),
		type: v.union(
			v.literal("wedding"),
			v.literal("birthday"),
			v.literal("anniversary"),
			v.literal("business"),
			v.literal("custom"),
		),
		thumbnail: v.optional(v.string()),
		config: v.object({
			defaultScenes: v.array(v.any()),
			defaultSettings: v.any(),
			suggestedMusic: v.array(v.string()),
			suggestedStyles: v.array(v.string()),
			emotionalStory: v.optional(v.string()),
			approvedNarrationScript: v.optional(v.string()),
			validatedStory: v.optional(v.string()), // Full story validated in step 2 (title + narration + scenes)
		}),
		isSystem: v.boolean(),
		isPublic: v.boolean(),
		usageCount: v.number(),
		tags: v.array(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_organization", ["organizationId"])
		.index("by_user", ["userId"])
		.index("by_type", ["type"])
		.index("by_is_system", ["isSystem"])
		.index("by_is_public", ["isPublic"]),

	/**
	 * 10. Subscriptions Table
	 * Polar billing integration
	 */
	subscriptions: defineTable({
		clerkUserId: v.string(), // User who owns the subscription
		organizationId: v.string(),
		tierKey: v.string(), // "tier_1", "tier_2", "tier_3" - links to subscriptionTiers.tierKey
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
	 * 11. Credit Balances Table
	 * Credit tracking per organization
	 */
	creditBalances: defineTable({
		organizationId: v.string(),
		totalCredits: v.number(),
		usedCredits: v.number(),
		remainingCredits: v.number(),
		subscriptionCredits: v.number(),
		purchasedCredits: v.number(),
		lastResetAt: v.number(),
		nextResetAt: v.number(),
		metadata: v.object({
			resetFrequency: v.union(v.literal("monthly"), v.literal("never")),
		}),
		updatedAt: v.number(),
	}).index("by_organization", ["organizationId"]),

	/**
	 * 12. Usage Tracking Table
	 * AI service usage and cost tracking (Sprint 5)
	 * Tracks OpenAI, Together.ai, and fal.ai usage with exact cost calculation
	 */
	usageTracking: defineTable({
		userId: v.string(), // Clerk user ID
		service: v.string(), // 'openai', 'together', 'fal'
		model: v.string(), // Model identifier
		projectId: v.optional(v.string()),
		resourceType: v.string(), // 'chat', 'prompt', 'image', 'video', 'audio'
		resourceId: v.optional(v.string()),
		eventType: v.string(), // 'generation', 'enhancement', 'conversation'
		creditsUsed: v.number(),
		cost: v.number(), // Actual USD cost
		metadata: v.optional(v.any()), // Flexible metadata for tokens, latency, etc.
		timestamp: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_project", ["projectId"])
		.index("by_timestamp", ["timestamp"]),

	/**
	 * Image Tool History (Sprint 29)
	 * Unified history for Generate + Edit modes (Kling Image T2I/I2I)
	 */
	imageToolHistory: defineTable({
		userId: v.string(), // Clerk user ID
		mode: v.union(v.literal("generate"), v.literal("edit")),
		prompt: v.string(),
		imageUrl: v.optional(v.string()),
		imageUrls: v.optional(v.array(v.string())),
		sourceImageUrl: v.optional(v.string()),
		sourceImageUrls: v.optional(v.array(v.string())),
		model: v.string(),
		resolution: v.optional(v.string()),
		aspectRatio: v.optional(v.string()),
		resultType: v.optional(v.string()),
		metadata: v.optional(v.any()),
		createdAt: v.number(),
		// Save to project (mirror voice Phase 7)
		projectId: v.optional(v.id("projects")),
		organizationId: v.optional(v.string()),
		title: v.optional(v.string()),
	})
		.index("by_user", ["userId"])
		.index("by_user_created", ["userId", "createdAt"])
		.index("by_project", ["projectId"]),

	/**
	 * 13. Activities Table
	 * User activity log for dashboard feed
	 */
	activities: defineTable({
		organizationId: v.string(),
		userId: v.string(), // Clerk user ID
		projectId: v.optional(v.string()),
		type: v.union(
			v.literal("project_created"),
			v.literal("video_generated"),
			v.literal("scene_added"),
			v.literal("template_used"),
			v.literal("video_shared"),
		),
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
	 * 14. Shared Links Table
	 * Video sharing with optional password protection
	 */
	sharedLinks: defineTable({
		organizationId: v.string(),
		videoId: v.string(),
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
		.index("by_video", ["videoId"])
		.index("by_user", ["userId"])
		.index("by_token", ["token"]),

	// ============================================================
	// CREDIT SYSTEM TABLES (Sprint: Production Ready)
	// See: docs/Understanding/credit-system-specification.md
	// ============================================================

	/**
	 * 15. User Credits Table
	 * Per-user credit balance tracking (works alongside organization-level creditBalances)
	 */
	userCredits: defineTable({
		clerkUserId: v.string(), // Clerk user ID (primary identifier)
		organizationId: v.optional(v.string()), // Clerk org ID (for team sharing)

		// Balance
		balance: v.number(), // Current available credits

		// Tracking
		totalPurchased: v.number(), // Lifetime credits purchased
		totalUsed: v.number(), // Lifetime credits consumed
		totalBonusReceived: v.number(), // Lifetime bonus credits

		// Subscription context (references subscriptionTiers.tierKey)
		subscriptionTier: v.optional(v.string()), // e.g., "tier_1" | "tier_2" | "tier_3"

		// Timestamps
		createdAt: v.number(),
		updatedAt: v.number(),
		lastResetAt: v.optional(v.number()), // For subscription resets
	})
		.index("by_clerk_user", ["clerkUserId"])
		.index("by_organization", ["organizationId"]),

	/**
	 * 16. Credit Transactions Table (Audit Log)
	 * Complete history of all credit operations
	 */
	creditTransactions: defineTable({
		clerkUserId: v.string(), // User who consumed/received credits
		organizationId: v.optional(v.string()),

		// Transaction details
		type: v.union(
			v.literal("initial"), // New user bonus
			v.literal("purchase"), // Bought credits
			v.literal("subscription_reset"), // Monthly reset
			v.literal("usage"), // AI feature consumption
			v.literal("refund"), // Error/refund
			v.literal("bonus"), // Promotional bonus
		),

		amount: v.number(), // Positive = add, Negative = deduct
		balanceAfter: v.number(), // Balance after transaction

		// Context
		projectId: v.optional(v.string()), // Which project (if usage)
		projectName: v.optional(v.string()), // For display
		actionType: v.optional(v.string()), // "step1_story_generation", "image_generation", etc.
		resourceId: v.optional(v.string()), // Scene ID, message ID, etc.
		description: v.string(), // Human-readable description

		// Refund tracking
		originalTransactionId: v.optional(v.id("creditTransactions")), // For refunds: links to original

		// Idempotency key for Polar webhook orders (top-level for index access)
		polarOrderId: v.optional(v.string()),

		// Metadata
		metadata: v.optional(v.any()), // Additional data (model, tokens, etc.)

		timestamp: v.number(),
	})
		.index("by_user", ["clerkUserId"])
		.index("by_user_and_timestamp", ["clerkUserId", "timestamp"])
		.index("by_project", ["projectId"])
		.index("by_type", ["type"])
		.index("by_polar_order_id", ["polarOrderId"]),

	/**
	 * 17. Credit Costs Table (Configurable Costs)
	 * Dynamic pricing for AI actions - client can change without code deployment
	 */
	creditCosts: defineTable({
		actionType: v.string(), // Unique identifier (e.g., "step2_chat_message")
		displayName: v.string(), // Human-readable name
		credits: v.number(), // Cost in credits
		description: v.string(), // What this action does
		category: v.string(), // "chat", "image", "video", "audio", "assembly"
		step: v.optional(v.number()), // Which guided flow step (1-6)
		isActive: v.boolean(), // Can be disabled
		updatedAt: v.number(),
	})
		.index("by_action_type", ["actionType"])
		.index("by_category", ["category"])
		.index("by_step", ["step"]),

	/**
	 * 18. Subscription Tiers Table (Dynamic Tiers)
	 * Single source of truth for ALL Polar products — subscriptions AND one-time credit packages.
	 * Fully dynamic: add/remove/modify without code changes.
	 *
	 * productType:
	 *   "subscription" → recurring plan (tier_1/tier_2/tier_3)
	 *   "one_time"     → credit package (credits_starter/popular/pro/enterprise)
	 *
	 * Credit calculation for one_time rows:
	 *   totalCreditsAwarded = initialCredits + (bonusCredits ?? 0)
	 *   e.g. Popular Pack: 50 base + 5 bonus = 55 credits awarded
	 */
	subscriptionTiers: defineTable({
		tierKey: v.string(), // Unique key: "tier_1", "credits_starter", etc.
		displayName: v.string(), // Human-readable name: "Starter Plan", "55 Credits — Popular Pack"
		initialCredits: v.number(), // Subscription: initial grant. One-time: base credits.
		monthlyCredits: v.optional(v.number()), // Subscription only: credits added on monthly renewal
		bonusCredits: v.optional(v.number()), // One-time only: bonus credits on top of initialCredits
		sortOrder: v.number(), // Display order (1, 2, 3… subscriptions; 10+ credit packages)
		isActive: v.boolean(), // Can be disabled without deletion
		description: v.optional(v.string()),
		// Polar integration — links this row to the Polar product UUID
		polarProductId: v.optional(v.string()), // Polar product UUID (e.g. "e5e6c9de-...")
		productType: v.optional(
			v.union(v.literal("subscription"), v.literal("one_time")),
		),
		priceUsd: v.optional(v.number()), // Display price (e.g. 9.99, 25.00, 250.00)
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_tier_key", ["tierKey"])
		.index("by_sort_order", ["sortOrder"])
		.index("by_polar_product_id", ["polarProductId"]),

	/**
	 * 19. System Config Table (Global Configuration)
	 * System-wide settings - NO HARDCODING
	 */
	systemConfig: defineTable({
		key: v.string(), // Unique config key
		value: v.any(), // Config value (flexible)
		description: v.string(), // What this config does
		updatedAt: v.number(),
		updatedBy: v.optional(v.string()), // Who last updated
	}).index("by_key", ["key"]),

	// ============================================================
	// SPRINT 11 PHASE 2: TRANSITION EFFECTS TABLE
	// Stores all 46 xfade effects from FFmpeg with metadata
	// ============================================================

	/**
	 * 20. Transition Effects Table
	 * All 46 FFmpeg xfade transition effects with metadata and preview support
	 * See: lib/rendi-video-processing.ts for available transition types
	 */
	transitionEffects: defineTable({
		key: v.string(), // FFmpeg xfade transition name: "circleopen", "fade", "dissolve", etc.
		category: v.string(), // "fades", "wipes", "slides", "circles", "shapes", "diagonals", "slices", "effects", "zoom"

		// Preview media (post-MVP - fields ready now)
		previewGifUrl: v.optional(v.string()), // CDN URL for GIF preview
		previewVideoUrl: v.optional(v.string()), // CDN URL for MP4 preview
		previewStorageId: v.optional(v.id("_storage")), // Convex storage ID
		previewR2Key: v.optional(v.string()), // Cloudflare R2 storage key

		// Metadata
		defaultDuration: v.number(), // Default transition duration in seconds (usually 1.0)
		sortOrder: v.number(), // Display order within category
		isActive: v.boolean(), // Can be disabled without deletion

		// Timestamps
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_key", ["key"])
		.index("by_category", ["category"])
		.index("by_active", ["isActive"])
		.index("by_sort_order", ["sortOrder"]),

	// ============================================================
	// TOOL SELECTION WALL TABLES (Sprint 24)
	// 4-level hierarchy: Tools → Categories → SubCategories → Themes
	// See: docs/Implementation/ToDo/TOOL-SELECTION-WALL-FEATURE.md
	// ============================================================

	/**
	 * 21. Tools Table (Meta-Categories / Main Tools)
	 * Top-level tools displayed on /tools wall
	 */
	tools: defineTable({
		key: v.string(), // "guided_flow", "image_generator"
		name: v.string(), // Display name (English fallback)
		nameTranslationKey: v.string(), // "tools.guided_flow.name"
		description: v.string(), // Short description (English fallback)
		descriptionTranslationKey: v.string(), // "tools.guided_flow.description"

		// Image/visual
		image: v.optional(v.id("_storage")), // Tool icon/image
		imageUrl: v.optional(v.string()), // Direct URL fallback

		// Navigation & configuration
		targetUrl: v.string(), // "/guided/step-0", "/image-generator"
		hasCategories: v.boolean(), // Enable Level 2?
		hasSubCategories: v.boolean(), // Enable Level 3?
		hasThemes: v.boolean(), // Enable Level 4?

		// Configurable query param names (PRD Section 3.2)
		categoryParamName: v.optional(v.string()), // Default: "category", can be "occasion"
		subCategoryParamName: v.optional(v.string()), // Default: "subcategory", can be "style"
		themeParamName: v.optional(v.string()), // Default: "theme"

		// Display & control
		sortOrder: v.number(), // Position on wall
		isActive: v.boolean(), // Show on wall?

		// Metadata
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_key", ["key"])
		.index("by_active_and_sort", ["isActive", "sortOrder"]), // Compound index for common query

	/**
	 * 22. Tool Categories Table (Level 2: Occasions, Genres, etc.)
	 */
	toolCategories: defineTable({
		toolId: v.id("tools"), // Parent tool
		key: v.string(), // "birthday", "wedding"
		name: v.string(),
		nameTranslationKey: v.string(), // "occasions.birthday"
		description: v.optional(v.string()),
		descriptionTranslationKey: v.optional(v.string()),

		// Image/visual
		image: v.optional(v.id("_storage")),
		imageUrl: v.optional(v.string()),

		// Control
		sortOrder: v.number(),
		isActive: v.boolean(),

		// Metadata
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_tool", ["toolId"])
		.index("by_tool_and_active", ["toolId", "isActive"])
		.index("by_key", ["key"]),

	/**
	 * 23. Tool SubCategories Table (Level 3: Styles, Moods, etc.)
	 */
	toolSubCategories: defineTable({
		toolId: v.id("tools"),
		categoryId: v.id("toolCategories"),
		key: v.string(), // "vintage", "cinematic"
		name: v.string(),
		nameTranslationKey: v.string(), // "visual_styles.vintage"
		description: v.optional(v.string()),
		descriptionTranslationKey: v.optional(v.string()),

		// Image/visual
		image: v.optional(v.id("_storage")),
		imageUrl: v.optional(v.string()),

		// Control
		sortOrder: v.number(),
		isActive: v.boolean(),

		// Metadata
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_category", ["categoryId"])
		.index("by_tool", ["toolId"])
		.index("by_category_and_active", ["categoryId", "isActive"])
		.index("by_key", ["key"]),

	/**
	 * 24. Tool Themes Table (Level 4: Standalone, Reusable)
	 * Themes are reusable across subcategories via junction table
	 */
	toolThemes: defineTable({
		key: v.string(), // "joyful", "nostalgic"
		name: v.string(),
		nameTranslationKey: v.string(), // "emotional_themes.joyful"
		description: v.optional(v.string()),
		descriptionTranslationKey: v.optional(v.string()),

		// Image/visual
		image: v.optional(v.id("_storage")),
		imageUrl: v.optional(v.string()),
		color: v.optional(v.string()), // Hex color for theme

		// Control
		sortOrder: v.number(), // Global order for admin list
		isActive: v.boolean(),

		// Metadata
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_key", ["key"])
		.index("by_active_and_sort", ["isActive", "sortOrder"]),

	/**
	 * 25. Tool SubCategory Themes Junction Table
	 * Many-to-many relationship: SubCategories <-> Themes
	 * Enables theme reusability across multiple subcategories
	 */
	toolSubCategoryThemes: defineTable({
		toolSubCategoryId: v.id("toolSubCategories"),
		toolThemeId: v.id("toolThemes"),
		order: v.number(), // Order within this subcategory
		isActive: v.boolean(), // Show this theme for this subcategory?
	})
		.index("by_subcategory", ["toolSubCategoryId", "order"])
		.index("by_theme", ["toolThemeId"])
		.index("by_subcategory_and_active", ["toolSubCategoryId", "isActive"])
		.index("by_subcategory_and_theme", ["toolSubCategoryId", "toolThemeId"]), // For duplicate check

	/**
	 * 26. Tool Wall Configs Table
	 * Stores wall configuration (item ordering) for each level
	 */
	toolWallConfigs: defineTable({
		level: v.union(
			v.literal("tool"),
			v.literal("category"),
			v.literal("subcategory"),
			v.literal("theme"),
		),
		contextId: v.optional(v.string()), // Parent ID for hierarchical walls
		referenceId: v.string(), // ID of the item (tool, category, subcategory, or theme)
		order: v.number(), // Display order on the wall
		isActive: v.boolean(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_level", ["level"]) // For queries without contextId
		.index("by_level_order", ["level", "order"]) // For ordered tool-level queries
		.index("by_level_and_context", ["level", "contextId"]) // For queries with contextId (admin)
		.index("by_level_context_and_order", ["level", "contextId", "order"]) // For ordered queries
		.index("by_level_context_and_active", ["level", "contextId", "isActive"]) // For public queries (active items only)
		.index("by_level_context_active_order", [
			"level",
			"contextId",
			"isActive",
			"order",
		]) // For public ordered queries
		.index("by_level_active_order", ["level", "isActive", "order"]), // For ordered tool-level public queries

	// ============================================================
	// ADS MANAGEMENT (Sprint 25)
	// Promotional ads that can be placed on walls
	// ============================================================

	/**
	 * 27. Ads Table
	 * Promotional ads that can be placed on category walls
	 */
	ads: defineTable({
		title: v.string(),
		baseline: v.string(), // Short description
		imageUrl: v.optional(v.string()),
		image: v.optional(v.id("_storage")),
		linkUrl: v.optional(v.string()), // Click destination

		// Wall targeting (which walls to show this ad on)
		targets: v.array(
			v.object({
				level: v.union(
					v.literal("tool"),
					v.literal("category"),
					v.literal("subcategory"),
				),
				contextId: v.optional(v.string()), // Parent ID (null for tool level)
			}),
		),

		sortOrder: v.number(),
		isActive: v.boolean(),

		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_active", ["isActive"])
		.index("by_active_and_sort", ["isActive", "sortOrder"]),

	// ============================================================
	// REFINEMENT FLOWS (Sprint 25)
	// Guided question flows for user refinement
	// ============================================================

	// ============================================================
	// IMAGE MODEL SCHEMAS (Sprint 30d.5)
	// Dynamic model configuration for zero-code model onboarding
	// See: docs/Analysis/image-generator/IMAGE-MODELS-ANALYSIS.md
	// ============================================================

	/**
	 * 28. Image Model Schemas Table
	 * Stores all configuration for image models (UI params, backend config, credit mapping).
	 * Enables zero-code model onboarding: add a row here + creditCosts entry = new model works.
	 */
	imageModelSchemas: defineTable({
		// ─── Identifiers ───
		schemaId: v.string(), // App ID: "kling-v3-t2i"
		name: v.string(), // Display: "Kling v3 — Text-to-Image"
		nameTranslationKey: v.optional(v.string()), // i18n key for name

		// ─── FAL Config ───
		modelId: v.string(), // FAL endpoint: "fal-ai/kling-image/v3/text-to-image"
		type: v.union(v.literal("t2i"), v.literal("i2i")),

		// ─── Credit System ───
		creditActionType: v.string(), // Links to creditCosts table

		// ─── UI Capabilities (drives visibility) ───
		capabilities: v.object({
			negativePrompt: v.optional(v.boolean()),
			maxResolution: v.optional(v.string()), // "2K" or "4K"
			elements: v.optional(v.boolean()),
			multiImage: v.optional(v.boolean()),
			aspectAuto: v.optional(v.boolean()),
			resultTypeSeries: v.optional(v.boolean()),
		}),

		// ─── UI Badges ───
		badges: v.optional(v.array(v.string())), // ["PRO", "NEW", "FAST"]

		// ─── UI Parameters (dynamic form rendering) ───
		params: v.array(
			v.object({
				key: v.string(),
				control: v.string(), // "text", "segmented", "icon-select", "number", "select", "toggle"
				label: v.string(), // i18n key
				options: v.optional(
					v.array(
						v.object({
							value: v.string(),
							label: v.string(), // i18n key
						}),
					),
				),
				default: v.optional(v.any()),
				min: v.optional(v.number()),
				max: v.optional(v.number()),
				minLength: v.optional(v.number()),
				maxLength: v.optional(v.number()),
				advanced: v.optional(v.boolean()),
				refType: v.optional(v.string()), // "single", "multi", "elements"
				costHint: v.optional(v.string()), // e.g. "+$0.015" for enable_web_search
				showWhen: v.optional(
					v.object({
						param: v.string(),
						value: v.union(v.string(), v.boolean()),
					}),
				),
			}),
		),

		// ─── Backend Config (parameter filtering for FAL API) ───
		allowedParams: v.array(v.string()), // Params to send to FAL
		conditionalParams: v.optional(
			v.array(
				v.object({
					param: v.string(),
					showWhen: v.object({
						param: v.string(),
						value: v.union(v.string(), v.boolean()),
					}),
				}),
			),
		), // Params with dependencies
		maxPromptLength: v.number(), // Kling: 2500, Grok: 8000, Nano: 50000

		// ─── Metadata ───
		sortOrder: v.number(),
		isActive: v.boolean(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_schema_id", ["schemaId"])
		.index("by_model_id", ["modelId"])
		.index("by_type_active", ["type", "isActive", "sortOrder"]),

	/**
	 * 29. Refinement Flows Table
	 * Guided question flows for user refinement
	 */
	refinementFlows: defineTable({
		name: v.string(), // Admin-facing name
		description: v.string(),

		// Context - where this flow applies
		triggerLevel: v.union(
			v.literal("tool"),
			v.literal("category"),
			v.literal("subcategory"),
			v.literal("vague"), // For vague queries
		),
		targetId: v.string(), // ID of the tool/category/subcategory

		// Settings
		isActive: v.boolean(),
		showConsultantIntro: v.boolean(),
		consultantMessage: v.optional(v.string()),
		allowSkip: v.boolean(),

		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_active", ["isActive"])
		.index("by_trigger_level", ["triggerLevel"])
		.index("by_target", ["triggerLevel", "targetId"]),

	/**
	 * 29. Refinement Questions Table
	 * Questions within a refinement flow
	 */
	refinementQuestions: defineTable({
		flowId: v.id("refinementFlows"),

		type: v.union(
			v.literal("text-radio"),
			v.literal("text-checkbox"),
			v.literal("visual-categories"),
			v.literal("visual-subcategories"),
			v.literal("visual-ads"),
		),

		question: v.string(), // Display text
		description: v.optional(v.string()),
		isRequired: v.boolean(),
		allowOther: v.boolean(),
		allowMultiple: v.boolean(),

		// For text-based questions
		options: v.optional(
			v.array(
				v.object({
					id: v.string(),
					label: v.string(),
					value: v.string(),
				}),
			),
		),

		// For visual questions
		visualSource: v.optional(
			v.object({
				type: v.union(
					v.literal("categories"),
					v.literal("subcategories"),
					v.literal("ads"),
				),
				categoryIds: v.optional(v.array(v.string())),
				subcategoryIds: v.optional(v.array(v.string())),
				adTargets: v.optional(v.array(v.string())),
			}),
		),

		// Layout
		layout: v.optional(v.union(v.literal("grid"), v.literal("list"))),
		gridCols: v.optional(v.number()),

		// Conditional logic
		showIf: v.optional(
			v.object({
				questionId: v.string(),
				answerValue: v.union(v.string(), v.array(v.string())),
			}),
		),

		defaultValue: v.optional(v.union(v.string(), v.array(v.string()))),

		sortOrder: v.number(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_flow", ["flowId"])
		.index("by_flow_and_order", ["flowId", "sortOrder"]),

	/**
	 * 30. Refinement Sessions Table
	 * User sessions for refinement flows
	 */
	refinementSessions: defineTable({
		flowId: v.id("refinementFlows"),
		userId: v.optional(v.string()), // Clerk user ID (if logged in)
		sessionId: v.string(), // Browser session ID

		// User's answers
		answers: v.any(), // Record<questionId, answer>

		// Navigation state
		currentQuestionIndex: v.number(),
		isComplete: v.boolean(),
		wasAbandoned: v.boolean(),

		startedAt: v.number(),
		completedAt: v.optional(v.number()),
		lastUpdatedAt: v.number(),
	})
		.index("by_flow", ["flowId"])
		.index("by_user", ["userId"])
		.index("by_session", ["sessionId"]),

	// ============================================================
	// IMAGE PRESETS (Sprint 30e.6)
	// Quick presets for image generation (Fast, Quality, Cinematic, etc.)
	// ============================================================

	/**
	 * 31. Image Presets Table
	 * Quick presets that apply model + params in one click.
	 * Enables zero-code preset management via Convex dashboard.
	 */
	imagePresets: defineTable({
		// ─── Identifiers ───
		key: v.string(), // "fast", "quality", "cinematic"
		name: v.string(), // Display: "Fast"
		nameTranslationKey: v.string(), // i18n key: "presets.fast"

		// ─── Visual ───
		icon: v.optional(v.string()), // Emoji or icon name: "⚡", "✨", "🎬"
		description: v.optional(v.string()),
		descriptionTranslationKey: v.optional(v.string()),

		// ─── Preset Configuration ───
		schemaId: v.string(), // Target model schema: "kling-v3-t2i"
		params: v.any(), // Params to apply: { resolution: "1K", num_images: 1 }

		// ─── Metadata ───
		sortOrder: v.number(),
		isActive: v.boolean(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_key", ["key"])
		.index("by_active_and_sort", ["isActive", "sortOrder"]),

	// ============================================================
	// VOICE GENERATOR (Phase 1 - Modular TTS Architecture)
	// Dynamic voice model configuration + history (mirrors image generator)
	// ============================================================

	/**
	 * 32. Voice Model Schemas Table
	 * Stores UI configuration and backend settings for all TTS models.
	 * Mirrors imageModelSchemas pattern for zero-code model onboarding.
	 */
	voiceModelSchemas: defineTable({
		// ─── Identifiers ───
		schemaId: v.string(), // App ID: "minimax-speech-28-hd"
		name: v.string(), // Display: "MiniMax Speech 2.8 HD"
		nameTranslationKey: v.optional(v.string()), // i18n: "voice_models.minimax_28_hd"

		// ─── FAL Config ───
		modelId: v.string(), // FAL: "fal-ai/minimax/speech-2.8-hd"
		type: v.literal("tts"), // Voice models are all TTS

		// ─── Credit System ───
		creditActionType: v.string(), // "voice_generation_minimax_28_hd"

		// ─── UI Capabilities ───
		capabilities: v.object({
			voiceCloning: v.optional(v.boolean()),
			emotionControl: v.optional(v.boolean()),
			pitchControl: v.optional(v.boolean()),
			speedControl: v.optional(v.boolean()),
			multiLanguage: v.optional(v.boolean()),
			// MiniMax flags
			volumeControl: v.optional(v.boolean()),
			voiceModification: v.optional(v.boolean()),
			customPronunciation: v.optional(v.boolean()),
			interjections: v.optional(v.boolean()),
			pauseControl: v.optional(v.boolean()),
			loudnessNormalization: v.optional(v.boolean()),
			highQualityAudio: v.optional(v.boolean()),
			streaming: v.optional(v.boolean()),
			// Qwen-specific flags
			stylePrompts: v.optional(v.boolean()),
			advancedSampling: v.optional(v.boolean()),
			subTalkerControl: v.optional(v.boolean()),
		}),

		// ─── UI Badges ───
		badges: v.optional(v.array(v.string())), // ["HD", "FAST", "PRO"]

		// ─── UI Parameters (dynamic form) ───
		params: v.array(
			v.object({
				key: v.string(), // "prompt", "voice_id", "speed"
				control: v.string(), // "text", "select", "number", "toggle", "textarea"
				label: v.string(), // i18n key
				hint: v.optional(v.string()), // tooltip/description for the param
				placeholder: v.optional(v.string()), // input placeholder text
				required: v.optional(v.boolean()), // validation flag
				rows: v.optional(v.number()), // textarea row count
				unit: v.optional(v.string()), // display unit label e.g. "x", "semitones", "LUFS"
				options: v.optional(
					v.array(
						v.object({
							value: v.union(v.string(), v.number()), // string or numeric values
							label: v.string(), // i18n key
							previewUrl: v.optional(v.string()), // Voice preview audio
						}),
					),
				),
				// ✅ Type-safe default values (no v.any())
				default: v.optional(
					v.union(
						v.string(), // For text, select inputs
						v.number(), // For sliders, number inputs
						v.boolean(), // For toggles
						v.array(v.string()), // For multi-select (future)
					),
				),
				min: v.optional(v.number()),
				max: v.optional(v.number()),
				step: v.optional(v.number()),
				maxLength: v.optional(v.number()),
				advanced: v.optional(v.boolean()),
				showWhen: v.optional(
					v.object({
						param: v.string(),
						value: v.union(v.string(), v.boolean()),
					}),
				), // conditional display — show this param only when another param equals a value
			}),
		),

		// ─── Backend Config ───
		allowedParams: v.array(v.string()), // ["prompt", "voice_id", "speed", "pitch"]
		maxPromptLength: v.number(), // MiniMax: 10000, varies by model

		// ─── Conditional Params (UI dependency rules) ───
		conditionalParams: v.optional(
			v.array(
				v.object({
					param: v.string(),
					showWhen: v.object({
						param: v.string(),
						value: v.union(v.string(), v.boolean()),
					}),
				}),
			),
		),

		// ─── Metadata ───
		sortOrder: v.number(),
		isActive: v.boolean(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_schema_id", ["schemaId"])
		.index("by_model_id", ["modelId"])
		.index("by_type_active", ["type", "isActive", "sortOrder"]),

	// ============================================================
	// VIDEO GENERATOR (Sprint 37 — Modular Video Architecture)
	// Dynamic video model configuration (mirrors voiceModelSchemas)
	// See: docs/Analysis/video-generator/VIDEO-MODELS-ANALYSIS.md
	// ============================================================

	/**
	 * 33. Video Model Schemas Table
	 * Stores all configuration for video models (UI params, backend config, credit mapping).
	 * Enables zero-code model onboarding: add a row here + creditCosts entry = new model works.
	 */
	videoModelSchemas: defineTable({
		// ─── Identifiers ───
		schemaId: v.string(),
		name: v.string(),
		nameTranslationKey: v.optional(v.string()),

		// ─── FAL Config ───
		modelId: v.string(),
		// "type" is metadata only — used for VideoModelCard badge display
		// Never used for branching in SceneInputArea or backend action
		type: v.union(v.literal("i2v"), v.literal("r2v"), v.literal("v2v")),

		// ─── Start image / video param name mapping ───
		// v3 Pro I2V uses "start_image_url", O3 Pro I2V uses "image_url" — stored here, never hardcoded
		startImageParam: v.optional(v.string()), // undefined for V2V
		videoInputParam: v.optional(v.string()), // "video_url" for V2V, undefined for I2V/R2V

		// ─── Required Params (drives generate button + pre-flight validation) ───
		requiredParams: v.array(v.string()), // e.g. ["start_image_url"] | ["video_url","prompt"] | []

		// ─── Credit System ───
		creditBaseDuration: v.number(), // always 5 (5s baseline for all Kling)
		supportsDurationScaling: v.boolean(), // false for V2V Edit (fixed cost by input duration)
		creditTiers: v.array(
			v.object({
				tier: v.string(), // "no_audio" | "audio" | "voice" | "standard"
				actionType: v.string(),
				labelKey: v.string(), // i18n key for UI display (CreditTierSelector)
			}),
		),

		// ─── UI Capabilities — ALL flags SceneInputArea reads to decide what to render ───
		// RULE: No UI component may branch on `schema.type`. Use these flags only.
		capabilities: v.object({
			// Input requirements
			requiresStartImage: v.optional(v.boolean()), // show start frame upload (required)
			requiresVideoInput: v.optional(v.boolean()), // show video upload (required)
			requiresTextPrompt: v.optional(v.boolean()), // mark prompt field as required
			supportsEndImage: v.optional(v.boolean()), // show end frame upload (optional)
			supportsStyleImages: v.optional(v.boolean()), // show image_urls style ref strip
			supportsElements: v.optional(v.boolean()), // show elements panel
			// Settings
			supportsDuration: v.optional(v.boolean()), // show duration selector
			// Aspect ratios — options array drives the selector; empty/absent = hide control entirely
			// Include "auto" in array if model supports it (no separate flag needed)
			aspectRatios: v.optional(v.array(v.string())), // e.g. ["auto","16:9","9:16","1:1"]
			// Audio
			audioGeneration: v.optional(v.boolean()), // show generate_audio toggle
			keepAudio: v.optional(v.boolean()), // show keep_audio toggle (V2V)
			voiceIds: v.optional(v.boolean()), // show voice IDs panel
			// Advanced
			negativePrompt: v.optional(v.boolean()),
			cfgScale: v.optional(v.boolean()),
			multiShot: v.optional(v.boolean()),
		}),

		// ─── UI Badges (VideoModelCard display only) ───
		badges: v.optional(v.array(v.string())),

		// ─── UI Parameters (dynamic form — the single source of truth for all controls) ───
		// ALL visual controls come from this array, rendered via DynamicField or SceneInputArea.
		// RULE: If a param is absent from this array, its control does not render.
		params: v.array(
			v.object({
				key: v.string(),
				control: v.string(), // "textarea"|"select"|"slider"|"toggle"|"number"|"image"|"aspectratio"
				label: v.string(), // i18n key
				hint: v.optional(v.string()), // i18n key
				placeholder: v.optional(v.string()), // i18n key
				required: v.optional(v.boolean()),
				options: v.optional(
					v.array(
						v.object({
							value: v.union(v.string(), v.number(), v.boolean()),
							label: v.string(),
						}),
					),
				),
				default: v.optional(v.union(v.string(), v.number(), v.boolean())),
				min: v.optional(v.number()),
				max: v.optional(v.number()),
				step: v.optional(v.number()),
				maxLength: v.optional(v.number()),
				rows: v.optional(v.number()),
				unit: v.optional(v.string()),
				advanced: v.optional(v.boolean()),
				// "global" = FloatingVideoSettingsPanel, "scene" = SceneCard/SceneDetailModal
				scope: v.optional(v.union(v.literal("global"), v.literal("scene"))),
				showWhen: v.optional(
					v.object({
						param: v.string(),
						value: v.union(v.string(), v.boolean()),
					}),
				),
			}),
		),

		// ─── Backend Config ───
		allowedParams: v.array(v.string()), // whitelist for FAL API call — no extras sent
		maxPromptLength: v.number(),

		// ─── Metadata ───
		sortOrder: v.number(),
		isActive: v.boolean(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_schema_id", ["schemaId"])
		.index("by_model_id", ["modelId"])
		.index("by_type_active", ["type", "isActive", "sortOrder"])
		.index("by_active_sort", ["isActive", "sortOrder"]),

	/**
	 * 34. Voice Tool History Table
	 * Stores all voice generations and recordings for user library.
	 * Mirrors imageToolHistory pattern.
	 */
	voiceToolHistory: defineTable({
		// ─── User & Model ───
		userId: v.string(), // Clerk user ID
		modelId: v.string(), // FAL endpoint used
		schemaId: v.string(), // App ID (e.g., "minimax-speech-28-hd")

		// ─── Project Context (OPTIONAL) ───
		projectId: v.optional(v.id("projects")), // Link to project if used in video

		// ─── Generation Input ───
		prompt: v.string(), // Text to convert to speech
		voiceSettings: v.object({
			voiceId: v.string(), // Selected voice
			speed: v.optional(v.number()), // 0.5-2.0
			pitch: v.optional(v.number()), // -12 to 12
			emotion: v.optional(v.string()), // "neutral", "happy", "sad"
		}),

		// ─── Generation Output ───
		audioUrl: v.string(), // Public audio URL
		storageId: v.id("_storage"), // Convex storage reference
		duration: v.number(), // Audio duration in seconds

		// ─── Metadata ───
		mode: v.union(v.literal("generate"), v.literal("record")), // TTS or recorded
		cost: v.optional(v.number()), // Credits spent
		createdAt: v.number(),
	})
		.index("by_user", ["userId", "createdAt"])
		.index("by_user_schema", ["userId", "schemaId", "createdAt"])
		.index("by_user_project", ["userId", "projectId", "createdAt"]), // ✅ Project-specific queries
});
