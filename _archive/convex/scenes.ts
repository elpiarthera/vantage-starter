import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { internalMutation, mutation, query } from "./_generated/server";

/**
 * Create a new scene in a project
 * Uses the complete schema from convex-database-schema.md
 */
export const create = mutation({
	args: {
		projectId: v.id("projects"),
		sceneNumber: v.number(),
		title: v.string(),
		description: v.string(), // Required: scene prompt from Step 2
		duration: v.number(),
		cinematicStyles: v.optional(
			v.object({
				ambiance: v.optional(v.string()),
				cameraMovement: v.optional(v.string()),
				colorTone: v.optional(v.string()),
				visualStyle: v.optional(v.string()),
			}),
		),
		startFrameImageUrl: v.optional(v.string()),
		endFrameImageUrl: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// Verify user is authenticated
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		// Get user from database
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();

		if (!user) {
			throw new Error("User not found - please sync user first");
		}

		// Verify project ownership
		const project = await ctx.db.get(args.projectId);
		if (!project) {
			throw new Error("Project not found");
		}

		if (project.userId !== user._id) {
			throw new Error("Unauthorized - you don't own this project");
		}

		const now = Date.now();

		// Create scene with full schema
		const sceneId = await ctx.db.insert("scenes", {
			projectId: args.projectId,
			userId: user._id,
			sceneNumber: args.sceneNumber,
			title: args.title,
			description: args.description,
			duration: args.duration,
			cinematicStyles: args.cinematicStyles,
			startFrameImageUrl: args.startFrameImageUrl,
			endFrameImageUrl: args.endFrameImageUrl,
			status: "draft",
			createdAt: now,
			updatedAt: now,
		});

		// Update project's total duration
		await updateProjectDuration(ctx, args.projectId);

		return sceneId;
	},
});

/**
 * List all scenes for a project (ordered by sceneNumber)
 */
export const list = query({
	args: { projectId: v.id("projects") },
	handler: async (ctx, { projectId }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return [];
		}

		// Verify project ownership
		const project = await ctx.db.get(projectId);
		if (!project) {
			return [];
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();

		if (!user || project.userId !== user._id) {
			return [];
		}

		// Query scenes ordered by sceneNumber
		const scenes = await ctx.db
			.query("scenes")
			.withIndex("by_project", (q) => q.eq("projectId", projectId))
			.collect();

		// Sort by sceneNumber
		return scenes.sort((a, b) => a.sceneNumber - b.sceneNumber);
	},
});

/**
 * Get single scene by ID
 */
export const get = query({
	args: { sceneId: v.id("scenes") },
	handler: async (ctx, { sceneId }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return null;
		}

		const scene = await ctx.db.get(sceneId);
		if (!scene) {
			return null;
		}

		// Verify ownership
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();

		if (!user || scene.userId !== user._id) {
			throw new Error("Unauthorized - you don't own this scene");
		}

		return scene;
	},
});

/**
 * Update scene
 * Supports full schema with cinematicStyles
 */
export const update = mutation({
	args: {
		sceneId: v.id("scenes"),
		title: v.optional(v.string()),
		description: v.optional(v.string()),
		duration: v.optional(v.number()),
		sceneNumber: v.optional(v.number()),
		// Accept either asset ID or URL string for frame images
		startFrame: v.optional(v.union(v.id("assets"), v.string(), v.null())),
		endFrame: v.optional(v.union(v.id("assets"), v.string(), v.null())),
		// URL fields that UI prioritizes for frame images
		startFrameImageUrl: v.optional(v.union(v.string(), v.null())),
		endFrameImageUrl: v.optional(v.union(v.string(), v.null())),
		cinematicStyles: v.optional(
			v.object({
				ambiance: v.optional(v.string()),
				cameraMovement: v.optional(v.string()),
				colorTone: v.optional(v.string()),
				visualStyle: v.optional(v.string()),
			}),
		),
		videoUrl: v.optional(v.string()),
		status: v.optional(
			v.union(
				v.literal("draft"),
				v.literal("generating"),
				v.literal("completed"),
				v.literal("failed"),
			),
		),
		// Video validation state
		validated: v.optional(v.boolean()),
	},
	handler: async (ctx, { sceneId, ...updates }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		// Get scene and verify ownership
		const scene = await ctx.db.get(sceneId);
		if (!scene) {
			throw new Error("Scene not found");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();

		if (!user || scene.userId !== user._id) {
			throw new Error("Unauthorized - you don't own this scene");
		}

		// Prepare patch data, converting null to undefined for optional fields
		const patchData: Record<string, unknown> = {
			updatedAt: Date.now(),
		};

		// Copy updates, converting null to undefined
		for (const [key, value] of Object.entries(updates)) {
			if (value !== undefined) {
				patchData[key] = value === null ? undefined : value;
			}
		}

		// Update scene
		await ctx.db.patch(sceneId, patchData);

		// If duration changed, update project total
		if (updates.duration !== undefined) {
			await updateProjectDuration(ctx, scene.projectId);
		}

		return { success: true };
	},
});

/**
 * Delete scene
 */
export const remove = mutation({
	args: { sceneId: v.id("scenes") },
	handler: async (ctx, { sceneId }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		// Get scene and verify ownership
		const scene = await ctx.db.get(sceneId);
		if (!scene) {
			throw new Error("Scene not found");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();

		if (!user || scene.userId !== user._id) {
			throw new Error("Unauthorized - you don't own this scene");
		}

		const projectId = scene.projectId;

		// Delete scene
		await ctx.db.delete(sceneId);

		// Update project's total duration
		await updateProjectDuration(ctx, projectId);

		return { success: true };
	},
});

/**
 * Update video generation tracking for a scene
 * Used by videoGeneration action to track async video generation status
 */
export const updateVideoGeneration = mutation({
	args: {
		sceneId: v.id("scenes"),
		videoGeneration: v.object({
			requestId: v.optional(v.string()),
			provider: v.string(),
			model: v.string(),
			prompt: v.string(),
			startFrameUrl: v.string(),
			endFrameUrl: v.optional(v.string()),
			status: v.union(
				v.literal("pending"),
				v.literal("in_progress"),
				v.literal("completed"),
				v.literal("failed"),
			),
			progress: v.number(),
			falVideoUrl: v.optional(v.string()),
			creditTransactionId: v.optional(v.id("creditTransactions")),
			error: v.optional(
				v.object({
					message: v.string(),
					code: v.string(),
					retryable: v.boolean(),
				}),
			),
			retryCount: v.number(),
			cost: v.optional(v.number()),
			creditsUsed: v.optional(v.number()),
			startedAt: v.number(),
			completedAt: v.optional(v.number()),
		}),
		status: v.optional(
			v.union(
				v.literal("draft"),
				v.literal("generating"),
				v.literal("completed"),
				v.literal("failed"),
			),
		),
	},
	handler: async (ctx, { sceneId, videoGeneration, status }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		// Get scene and verify ownership
		const scene = await ctx.db.get(sceneId);
		if (!scene) {
			throw new Error("Scene not found");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();

		if (!user || scene.userId !== user._id) {
			throw new Error("Unauthorized - you don't own this scene");
		}

		// Update scene with video generation data
		const updates: Record<string, unknown> = {
			videoGeneration,
			updatedAt: Date.now(),
		};

		if (status) {
			updates.status = status;
		}

		await ctx.db.patch(sceneId, updates);

		return { success: true };
	},
});

/**
 * Reset video generation state for a scene
 * Allows user to retry generation after a stuck/failed state
 */
export const resetVideoGeneration = mutation({
	args: {
		sceneId: v.id("scenes"),
	},
	handler: async (ctx, { sceneId }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		// Get scene and verify ownership
		const scene = await ctx.db.get(sceneId);
		if (!scene) {
			throw new Error("Scene not found");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();

		if (!user || scene.userId !== user._id) {
			throw new Error("Unauthorized");
		}

		// Reset video generation state
		await ctx.db.patch(sceneId, {
			status: "draft",
			videoGeneration: undefined,
			videoUrl: undefined,
			updatedAt: Date.now(),
		});

		return { success: true };
	},
});

/**
 * Update regeneration history for a scene
 * Used by videoRegeneration action to track regeneration history
 */
export const updateRegenerationHistory = mutation({
	args: {
		sceneId: v.id("scenes"),
		regenerationHistory: v.array(
			v.object({
				version: v.number(),
				feedback: v.string(),
				previousVideoUrl: v.string(),
				regeneratedAt: v.number(),
			}),
		),
		videoVersion: v.number(),
	},
	handler: async (ctx, { sceneId, regenerationHistory, videoVersion }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		// Get scene and verify ownership
		const scene = await ctx.db.get(sceneId);
		if (!scene) {
			throw new Error("Scene not found");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();

		if (!user || scene.userId !== user._id) {
			throw new Error("Unauthorized - you don't own this scene");
		}

		// Update scene with regeneration history
		await ctx.db.patch(sceneId, {
			regenerationHistory,
			videoVersion,
			updatedAt: Date.now(),
		});

		return { success: true };
	},
});

/**
 * Reorder scenes in a project
 * Takes array of sceneIds in new order, updates sceneNumber for each
 */
export const reorder = mutation({
	args: {
		projectId: v.id("projects"),
		sceneIds: v.array(v.id("scenes")),
	},
	handler: async (ctx, { projectId, sceneIds }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		// Verify project ownership
		const project = await ctx.db.get(projectId);
		if (!project) {
			throw new Error("Project not found");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();

		if (!user || project.userId !== user._id) {
			throw new Error("Unauthorized - you don't own this project");
		}

		// Update sceneNumber for each scene
		for (let i = 0; i < sceneIds.length; i++) {
			const scene = await ctx.db.get(sceneIds[i]);

			if (!scene || scene.projectId !== projectId) {
				throw new Error(`Invalid scene: ${sceneIds[i]}`);
			}

			await ctx.db.patch(sceneIds[i], {
				sceneNumber: i + 1, // 1-indexed
				updatedAt: Date.now(),
			});
		}

		return { success: true };
	},
});

/**
 * Initialize scenes from project's generatedStory
 * SERVER-SIDE ATOMIC: Prevents duplicate scenes by checking existence first
 * This is the ONLY way scenes should be created from generatedStory
 */
export const initializeFromStory = mutation({
	args: {
		projectId: v.id("projects"),
	},
	handler: async (ctx, { projectId }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		// 1. SERVER-SIDE CHECK: Which scene numbers already exist?
		// This check is ATOMIC within the Convex transaction - no race conditions
		const existingScenes = await ctx.db
			.query("scenes")
			.withIndex("by_project", (q) => q.eq("projectId", projectId))
			.collect();

		// Get existing scene numbers to avoid duplicates
		const existingSceneNumbers = new Set(
			existingScenes.map((s) => s.sceneNumber),
		);

		// 2. Get project with generatedStory
		const project = await ctx.db.get(projectId);
		if (!project) {
			throw new Error("Project not found");
		}

		if (
			!project.generatedStory?.scenes ||
			project.generatedStory.scenes.length === 0
		) {
			console.log(
				`[initializeFromStory] No generatedStory.scenes for project ${projectId}`,
			);
			return { created: false, count: 0, sceneIds: [] };
		}

		// 3. Get user from Clerk ID
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();

		if (!user) {
			throw new Error("User not found - please sync user first");
		}

		// Verify ownership
		if (project.userId !== user._id) {
			throw new Error("Unauthorized - you don't own this project");
		}

		// 4. Create ONLY MISSING scenes (check by sceneNumber)
		const now = Date.now();
		const createdIds: Id<"scenes">[] = [];

		for (const storyScene of project.generatedStory.scenes) {
			// Skip if this scene number already exists
			if (existingSceneNumbers.has(storyScene.number)) {
				console.log(
					`[initializeFromStory] Scene ${storyScene.number} already exists, skipping`,
				);
				continue;
			}

			const sceneId = await ctx.db.insert("scenes", {
				projectId,
				userId: user._id,
				sceneNumber: storyScene.number,
				title: `Scene ${storyScene.number}`,
				description: storyScene.description,
				duration: 10, // Default duration
				status: "draft",
				cinematicStyles: {
					visualStyle: project.visualStyle || "",
					ambiance: storyScene.mood || "", // Use mood field from generatedStory
					cameraMovement: "",
					colorTone: "",
				},
				createdAt: now,
				updatedAt: now,
			});
			createdIds.push(sceneId);
			console.log(`[initializeFromStory] Created scene ${storyScene.number}`);
		}

		// Update project duration if any scenes were created
		if (createdIds.length > 0) {
			await updateProjectDuration(ctx, projectId);
		}

		const totalScenes = existingScenes.length + createdIds.length;
		console.log(
			`[initializeFromStory] Project ${projectId}: ${existingScenes.length} existing, ${createdIds.length} created, ${totalScenes} total`,
		);
		return {
			created: createdIds.length > 0,
			existingCount: existingScenes.length,
			createdCount: createdIds.length,
			totalCount: totalScenes,
			sceneIds: createdIds,
		};
	},
});

// ============================================================
// SPRINT 37: VIDEO GENERATION STATUS (Internal Mutation)
// Used by videoToolGeneric.ts actions — NOT the public update mutation
// Name: updateVideoGenerationStatus (NOT updateVideoGeneration — that already exists)
// ============================================================

/**
 * Update video generation status on a scene.
 * Called by generateGenericVideo and pollVideoGeneration internal actions.
 * Handles both initialization (when videoGeneration doesn't exist yet) and updates.
 */
export const updateVideoGenerationStatus = internalMutation({
	args: {
		sceneId: v.id("scenes"),
		status: v.union(
			v.literal("pending"),
			v.literal("generating"),
			v.literal("completed"),
			v.literal("failed"),
		),
		requestId: v.optional(v.string()),
		videoUrl: v.optional(v.string()),
		error: v.optional(v.string()),
		modelId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const scene = await ctx.db.get(args.sceneId);
		if (!scene) throw new Error("Scene not found");

		const topLevelStatus =
			args.status === "completed"
				? ("completed" as const)
				: args.status === "failed"
					? ("failed" as const)
					: ("generating" as const);

		if (!scene.videoGeneration) {
			// Initialize videoGeneration object with all required fields on first call
			await ctx.db.patch(args.sceneId, {
				videoGeneration: {
					provider: "fal-ai",
					model: args.modelId ?? "pending",
					status: args.status,
					requestId: args.requestId,
					retryCount: 0,
					startedAt: Date.now(),
				},
				status: topLevelStatus,
				updatedAt: Date.now(),
			});
		} else {
			// Merge update into existing videoGeneration object
			const existing = scene.videoGeneration;
			await ctx.db.patch(args.sceneId, {
				videoGeneration: {
					...existing,
					status: args.status,
					...(args.requestId !== undefined && { requestId: args.requestId }),
					...(args.videoUrl !== undefined && { videoUrl: args.videoUrl }),
					...(args.error !== undefined && {
						error: { message: args.error, retryable: false },
					}),
					...(args.modelId !== undefined && { model: args.modelId }),
				},
				status: topLevelStatus,
				updatedAt: Date.now(),
			});
		}
	},
});

export const markNeedsRegeneration = mutation({
	args: { sceneId: v.id("scenes"), value: v.boolean() },
	handler: async (ctx, { sceneId, value }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();
		if (!user) {
			throw new Error("User not found - please sync user first");
		}

		const scene = await ctx.db.get(sceneId);
		if (!scene) {
			throw new Error("Scene not found");
		}
		if (scene.userId !== user._id) {
			throw new Error("Unauthorized - you don't own this scene");
		}

		await ctx.db.patch(sceneId, {
			needsRegeneration: value,
			updatedAt: Date.now(),
		});
	},
});

/**
 * Helper: Update project's total duration based on all scenes
 */
async function updateProjectDuration(
	ctx: MutationCtx,
	projectId: Id<"projects"> | string,
) {
	const scenes = await ctx.db
		.query("scenes")
		.withIndex("by_project", (q) => q.eq("projectId", projectId as string))
		.collect();

	const totalDuration = scenes.reduce(
		(sum: number, scene: { duration?: number }) => sum + (scene.duration || 0),
		0,
	);

	await ctx.db.patch(projectId as Id<"projects">, {
		duration: totalDuration,
		updatedAt: Date.now(),
	});
}

// ============================================================
// SPRINT 11 PHASE 2: SCENE TRANSITION MUTATIONS
// Per-scene transition configuration
// ============================================================

/**
 * Update the outgoing transition for a single scene
 * Each scene can have a different transition effect to the next scene
 */
export const updateTransition = mutation({
	args: {
		sceneId: v.id("scenes"),
		outgoingTransition: v.optional(
			v.object({
				effectKey: v.string(), // e.g., "circleopen", "fade", "dissolve"
				duration: v.number(), // Transition duration in seconds
			}),
		),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		// Get scene and verify ownership
		const scene = await ctx.db.get(args.sceneId);
		if (!scene) {
			throw new Error("Scene not found");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();

		if (!user || scene.userId !== user._id) {
			throw new Error("Unauthorized - you don't own this scene");
		}

		// Update scene transition
		await ctx.db.patch(args.sceneId, {
			outgoingTransition: args.outgoingTransition,
			updatedAt: Date.now(),
		});

		return { success: true };
	},
});

/**
 * Apply the same transition to all scenes in a project (except the last one)
 * "Apply to All" bulk operation
 */
export const applyTransitionToAll = mutation({
	args: {
		projectId: v.id("projects"),
		effectKey: v.string(),
		duration: v.number(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		// Verify project ownership
		const project = await ctx.db.get(args.projectId);
		if (!project) {
			throw new Error("Project not found");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();

		if (!user || project.userId !== user._id) {
			throw new Error("Unauthorized - you don't own this project");
		}

		// Get all scenes for this project
		const scenes = await ctx.db
			.query("scenes")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
			.collect();

		// Sort by scene number
		const sortedScenes = scenes.sort((a, b) => a.sceneNumber - b.sceneNumber);

		// Apply transition to all scenes EXCEPT the last one
		// (the last scene has no outgoing transition)
		const now = Date.now();
		let updatedCount = 0;

		for (let i = 0; i < sortedScenes.length - 1; i++) {
			await ctx.db.patch(sortedScenes[i]._id, {
				outgoingTransition: {
					effectKey: args.effectKey,
					duration: args.duration,
				},
				updatedAt: now,
			});
			updatedCount++;
		}

		// Clear the last scene's outgoing transition (if any)
		if (sortedScenes.length > 0) {
			const lastScene = sortedScenes[sortedScenes.length - 1];
			await ctx.db.patch(lastScene._id, {
				outgoingTransition: undefined,
				updatedAt: now,
			});
		}

		return { success: true, updatedCount };
	},
});

/**
 * List scenes for a project with transition data (for video assembly)
 * Returns scenes ordered by sceneNumber with their outgoingTransition
 */
export const listWithTransitions = query({
	args: { projectId: v.id("projects") },
	handler: async (ctx, { projectId }) => {
		const scenes = await ctx.db
			.query("scenes")
			.withIndex("by_project", (q) => q.eq("projectId", projectId))
			.collect();

		// Sort by sceneNumber and return with transition data
		return scenes
			.sort((a, b) => a.sceneNumber - b.sceneNumber)
			.map((scene) => ({
				_id: scene._id,
				sceneNumber: scene.sceneNumber,
				title: scene.title,
				videoUrl: scene.videoUrl,
				outgoingTransition: scene.outgoingTransition,
			}));
	},
});

/**
 * Sprint 27: Clear all scene-level transitions for a project
 * Called when switching to hard_cut mode or on project creation
 */
export const clearProjectTransitions = mutation({
	args: { projectId: v.id("projects") },
	handler: async (ctx, { projectId }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		// Verify project ownership
		const project = await ctx.db.get(projectId);
		if (!project) {
			throw new Error("Project not found");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();

		if (!user || project.userId !== user._id) {
			throw new Error("Unauthorized - you don't own this project");
		}

		// Get all scenes for project
		const scenes = await ctx.db
			.query("scenes")
			.withIndex("by_project", (q) => q.eq("projectId", projectId))
			.collect();

		// Clear outgoingTransition from each scene
		const now = Date.now();
		let clearedCount = 0;
		for (const scene of scenes) {
			if (scene.outgoingTransition) {
				await ctx.db.patch(scene._id, {
					outgoingTransition: undefined,
					updatedAt: now,
				});
				clearedCount++;
			}
		}

		return { success: true, clearedCount };
	},
});
