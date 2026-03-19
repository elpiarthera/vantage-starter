import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalQuery, mutation, query } from "./_generated/server";

/**
 * Create a new project
 * Uses the complete schema from convex-database-schema.md
 */
export const create = mutation({
	args: {
		name: v.string(),
		occasion: v.string(),
		theme: v.string(),
		eventDetails: v.object({
			eventTitle: v.string(),
			description: v.optional(v.string()),
			date: v.optional(v.string()),
			location: v.optional(v.string()),
			rsvpLink: v.optional(v.string()),
			emotionalStory: v.string(),
		}),
		language: v.string(),
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

		const now = Date.now();

		// Create project with full schema
		const projectId = await ctx.db.insert("projects", {
			userId: user._id,
			name: args.name,
			occasion: args.occasion,
			theme: args.theme,
			eventDetails: args.eventDetails,
			language: args.language,
			status: "draft",
			duration: 0,
			transitionConfig: { mode: "hard_cut" },
			createdAt: now,
			updatedAt: now,
		});

		// Update user's total projects count
		await ctx.db.patch(user._id, {
			totalProjects: (user.totalProjects || 0) + 1,
		});

		return projectId;
	},
});

/**
 * Get a project for public viewing (no authentication required)
 * Used for the /watch/[projectId] public sharing page
 * Returns project with scenes for video playback
 */
export const getPublic = query({
	args: { projectId: v.id("projects") },
	handler: async (ctx, { projectId }) => {
		// No auth check - this is public!
		const project = await ctx.db.get(projectId);

		if (!project) {
			return null;
		}

		// Only return if video is ready (has a URL) and not a draft
		if (!project.finalVideoUrl || project.status === "draft") {
			return null;
		}

		// Get scenes for thumbnail (Scene 1 start frame)
		const scenes = await ctx.db
			.query("scenes")
			.withIndex("by_project", (q) => q.eq("projectId", projectId))
			.order("asc")
			.collect();

		// Return minimal data needed for public viewing
		return {
			_id: project._id,
			name: project.name,
			occasion: project.occasion,
			theme: project.theme,
			eventDetails: project.eventDetails,
			finalVideoUrl: project.finalVideoUrl,
			duration: project.duration,
			createdAt: project.createdAt,
			// Include first scene's start frame for thumbnail
			thumbnailUrl: scenes[0]?.startFrameImageUrl || null,
		};
	},
});

/**
 * Create a new project (draft) from a template: project + scenes prepopulated.
 * Used when user clicks "Use the template" and lands on step-1?templateId=...
 */
export const createFromTemplate = mutation({
	args: { templateId: v.id("templates") },
	handler: async (ctx, { templateId }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();
		if (!user) throw new Error("User not found - please sync user first");

		const template = await ctx.db.get(templateId);
		if (!template) throw new Error("Template not found");
		// Allow system templates or user's own templates
		if (!template.isSystem && template.userId !== identity.subject) {
			throw new Error("Unauthorized - you don't have access to this template");
		}

		const now = Date.now();
		const projectName = `Copy of ${template.name}`;
		const eventDetails = {
			eventTitle: template.name,
			description: template.description || "",
			emotionalStory:
				typeof template.config === "object" &&
				template.config !== null &&
				"emotionalStory" in template.config &&
				typeof (template.config as { emotionalStory?: string })
					.emotionalStory === "string"
					? (template.config as { emotionalStory: string }).emotionalStory
					: "",
		};

		const projectId = await ctx.db.insert("projects", {
			userId: user._id,
			name: projectName,
			occasion: template.category,
			theme: template.type,
			eventDetails,
			language: "English",
			status: "draft",
			duration: 0,
			transitionConfig: { mode: "hard_cut" },
			createdAt: now,
			updatedAt: now,
		});

		try {
			// Patch project with step4Data, approvedNarrationScript, visualStyle from template
			const config = template.config as {
				defaultSettings?: object;
				approvedNarrationScript?: string;
				suggestedStyles?: string[];
			};
			const patch: Record<string, unknown> = { updatedAt: now };
			if (
				config?.defaultSettings &&
				typeof config.defaultSettings === "object"
			) {
				patch.step4Data = config.defaultSettings;
			}
			if (typeof config?.approvedNarrationScript === "string") {
				patch.approvedNarrationScript = config.approvedNarrationScript;
			}
			if (
				Array.isArray(config?.suggestedStyles) &&
				config.suggestedStyles.length > 0
			) {
				patch.visualStyle = config.suggestedStyles[0];
			}
			if (Object.keys(patch).length > 1) {
				await ctx.db.patch(projectId, patch);
			}

			// Create scenes from config.defaultScenes
			const defaultScenes = Array.isArray(
				(template.config as { defaultScenes?: unknown[] })?.defaultScenes,
			)
				? (template.config as { defaultScenes: unknown[] }).defaultScenes
				: [];
			let totalDuration = 0;
			for (const scene of defaultScenes) {
				const s = scene as {
					sceneNumber?: number;
					title?: string;
					description?: string;
					duration?: number;
					cinematicStyles?: object;
					startFrameUrl?: string;
					endFrameUrl?: string;
				};
				const sceneNumber =
					typeof s.sceneNumber === "number" ? s.sceneNumber : 0;
				const title = typeof s.title === "string" ? s.title : "Scene";
				const description =
					typeof s.description === "string" ? s.description : "";
				const duration = typeof s.duration === "number" ? s.duration : 5;
				totalDuration += duration;
				await ctx.db.insert("scenes", {
					projectId,
					userId: user._id,
					sceneNumber,
					title,
					description,
					duration,
					cinematicStyles:
						s.cinematicStyles && typeof s.cinematicStyles === "object"
							? (s.cinematicStyles as object)
							: undefined,
					startFrameImageUrl:
						typeof s.startFrameUrl === "string" ? s.startFrameUrl : undefined,
					endFrameImageUrl:
						typeof s.endFrameUrl === "string" ? s.endFrameUrl : undefined,
					status: "draft",
					createdAt: now,
					updatedAt: now,
				});
			}

			if (totalDuration > 0) {
				await ctx.db.patch(projectId, {
					duration: totalDuration,
					updatedAt: now,
				});
			}

			await ctx.db.patch(user._id, {
				totalProjects: (user.totalProjects || 0) + 1,
			});

			return projectId as Id<"projects">;
		} catch (err) {
			// On failure after project insert, delete the project to avoid orphans (Convex has no multi-table transactions).
			try {
				await ctx.db.delete(projectId);
			} catch (deleteErr) {
				// Best-effort cleanup; log but don't mask original error
				console.error("[createFromTemplate] Cleanup delete failed:", deleteErr);
			}
			throw err;
		}
	},
});

/**
 * List all projects for current user
 */
export const list = query({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return [];
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();

		if (!user) {
			return [];
		}

		// Query user's projects, sorted by most recent first
		const projects = await ctx.db
			.query("projects")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.order("desc")
			.collect();

		// Enrich each project with thumbnail from first scene's startFrameImageUrl
		const projectsWithThumbnails = await Promise.all(
			projects.map(async (project) => {
				// Get scene 1 for this project
				const scene1 = await ctx.db
					.query("scenes")
					.withIndex("by_project_and_scene_number", (q) =>
						q.eq("projectId", project._id).eq("sceneNumber", 1),
					)
					.first();

				return {
					...project,
					thumbnailUrl: scene1?.startFrameImageUrl ?? null,
				};
			}),
		);

		return projectsWithThumbnails;
	},
});

/**
 * Get single project by ID
 */
export const get = query({
	args: { projectId: v.id("projects") },
	handler: async (ctx, { projectId }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return null;
		}

		const project = await ctx.db.get(projectId);

		if (!project) {
			return null;
		}

		// Verify ownership
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();

		if (!user || project.userId !== user._id) {
			throw new Error("Unauthorized - you don't own this project");
		}

		return project;
	},
});

/**
 * Update project
 * Supports all schema fields including Step 4 data
 */
export const update = mutation({
	args: {
		projectId: v.id("projects"),
		name: v.optional(v.string()),
		occasion: v.optional(v.string()),
		theme: v.optional(v.string()),
		visualStyle: v.optional(v.string()), // Step 2b: Visual style
		approvedMessageId: v.optional(v.string()), // Step 2: Approved message
		approvedNarrationScript: v.optional(v.string()), // Step 3b: Approved narration
		narrationAudioUrl: v.optional(v.string()), // Step 4: Generated TTS
		narrationAudioStorageId: v.optional(v.id("_storage")), // Step 4: Convex storage ID for narration
		narrationDurationMs: v.optional(v.number()), // Step 4: Duration of narration
		musicAudioUrl: v.optional(v.string()), // Step 4: Generated music
		musicAudioStorageId: v.optional(v.id("_storage")), // Step 4: Convex storage ID for music
		// Step 6: Final assembly outputs
		finalVideoUrl: v.optional(v.string()),
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
		eventDetails: v.optional(
			v.object({
				eventTitle: v.string(),
				description: v.optional(v.string()),
				date: v.optional(v.string()),
				location: v.optional(v.string()),
				rsvpLink: v.optional(v.string()),
				emotionalStory: v.string(),
			}),
		),
		language: v.optional(v.string()),
		status: v.optional(
			v.union(
				v.literal("draft"),
				v.literal("in_progress"),
				v.literal("completed"),
			),
		),
		duration: v.optional(v.number()),
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
							audioStorageId: v.optional(v.id("_storage")),
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
							audioStorageId: v.optional(v.id("_storage")),
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

				// Pending music generation state
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
		// Sprint 11: Transition configuration
		transitionConfig: v.optional(
			v.object({
				mode: v.union(v.literal("hard_cut"), v.literal("xfade")),
				xfadeType: v.optional(v.string()),
				transitionDuration: v.optional(v.number()),
			}),
		),
	},
	handler: async (ctx, { projectId, ...updates }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		// Get project and verify ownership
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

		// Auto-clear scene transitions when switching to hard_cut
		if (updates.transitionConfig?.mode === "hard_cut") {
			const scenes = await ctx.db
				.query("scenes")
				.withIndex("by_project", (q) => q.eq("projectId", projectId))
				.collect();

			const now = Date.now();
			for (const scene of scenes) {
				if (scene.outgoingTransition) {
					await ctx.db.patch(scene._id, {
						outgoingTransition: undefined,
						updatedAt: now,
					});
				}
			}
		}

		// Update project
		await ctx.db.patch(projectId, {
			...updates,
			updatedAt: Date.now(),
		});

		return { success: true };
	},
});

/**
 * Delete project
 * Note: In future, we might want to cascade delete scenes/assets
 */
export const remove = mutation({
	args: { projectId: v.id("projects") },
	handler: async (ctx, { projectId }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		// Get project and verify ownership
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

		// Delete project
		await ctx.db.delete(projectId);

		// Update user's total projects count
		await ctx.db.patch(user._id, {
			totalProjects: Math.max(0, (user.totalProjects || 0) - 1),
		});

		return { success: true };
	},
});

/**
 * Remove an audio take (narration or music) from project step4Data.
 * Used by dashboard Audio tab delete on a track card.
 */
export const removeAudioTake = mutation({
	args: {
		projectId: v.id("projects"),
		takeId: v.string(),
		type: v.union(v.literal("music"), v.literal("narration")),
	},
	handler: async (ctx, { projectId, takeId, type }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

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

		const step4 = project.step4Data ?? {};
		const now = Date.now();

		if (type === "narration") {
			const takes = step4.narrationTakes ?? [];
			const removed = takes.find((t) => t.id === takeId);
			const nextTakes = takes.filter((t) => t.id !== takeId);
			await ctx.db.patch(projectId, {
				updatedAt: now,
				step4Data: {
					...step4,
					narrationTakes: nextTakes,
					...(step4.selectedNarrationTake === takeId
						? { selectedNarrationTake: undefined }
						: {}),
				},
				...(removed?.audioUrl && removed.audioUrl === project.narrationAudioUrl
					? {
							narrationAudioUrl: undefined,
							narrationAudioStorageId: undefined,
						}
					: {}),
			});
		} else {
			const takes = step4.musicTakes ?? [];
			const removed = takes.find((t) => t.id === takeId);
			const nextTakes = takes.filter((t) => t.id !== takeId);
			await ctx.db.patch(projectId, {
				updatedAt: now,
				step4Data: {
					...step4,
					musicTakes: nextTakes,
					...(step4.selectedMusicTrack === takeId
						? { selectedMusicTrack: undefined }
						: {}),
				},
				...(removed?.audioUrl && removed.audioUrl === project.musicAudioUrl
					? {
							musicAudioUrl: undefined,
							musicAudioStorageId: undefined,
						}
					: {}),
			});
		}

		return { success: true };
	},
});

/**
 * Save generated story to project (called from API route)
 * This mutation accepts clerkUserId directly for server-side calls
 */
export const saveGeneratedStory = mutation({
	args: {
		projectId: v.id("projects"),
		clerkUserId: v.string(), // For server-side auth
		generatedStory: v.object({
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
		}),
	},
	handler: async (ctx, args) => {
		// Require authentication — callers must pass { token: convexToken } (Clerk JWT).
		// This is consistent with every other public mutation in the codebase.
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");
		if (identity.subject !== args.clerkUserId)
			throw new Error("Unauthorized: identity mismatch");

		// Get project
		const project = await ctx.db.get(args.projectId);
		if (!project) {
			throw new Error("Project not found");
		}

		// Verify ownership via clerkUserId (works for both auth paths)
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", args.clerkUserId),
			)
			.unique();

		if (!user || project.userId !== user._id) {
			throw new Error("Unauthorized - you don't own this project");
		}

		// Save generated story with timestamp
		await ctx.db.patch(args.projectId, {
			generatedStory: {
				...args.generatedStory,
				generatedAt: Date.now(),
			},
			updatedAt: Date.now(),
		});

		return { success: true };
	},
});

/**
 * Update assembly status (used for Step 6 progress UI)
 */
export const updateAssemblyStatus = mutation({
	args: {
		projectId: v.id("projects"),
		assemblyStatus: v.union(
			v.literal("preparing_assets"),
			v.literal("processing_media"),
			v.literal("finalizing_video"),
			v.literal("saving_video"),
			v.literal("completed"),
			v.literal("failed"),
		),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const project = await ctx.db.get(args.projectId);
		if (!project) throw new Error("Project not found");

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();

		if (!user || project.userId !== user._id) {
			throw new Error("Unauthorized - you don't own this project");
		}

		await ctx.db.patch(args.projectId, {
			assemblyStatus: args.assemblyStatus,
			updatedAt: Date.now(),
		});

		return { success: true };
	},
});

/**
 * Update final video storage reference
 */
export const updateStorageId = mutation({
	args: {
		projectId: v.id("projects"),
		finalVideoStorageId: v.id("_storage"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const project = await ctx.db.get(args.projectId);
		if (!project) throw new Error("Project not found");

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();

		if (!user || project.userId !== user._id) {
			throw new Error("Unauthorized - you don't own this project");
		}

		await ctx.db.patch(args.projectId, {
			finalVideoStorageId: args.finalVideoStorageId,
			updatedAt: Date.now(),
		});

		return { success: true };
	},
});

/**
 * Update final video metadata after assembly completes
 */
export const updateFinalVideo = mutation({
	args: {
		projectId: v.id("projects"),
		finalVideoUrl: v.string(),
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
		finalVideoDurationMs: v.optional(v.number()),
		finalVideoSize: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const project = await ctx.db.get(args.projectId);
		if (!project) throw new Error("Project not found");

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();

		if (!user || project.userId !== user._id) {
			throw new Error("Unauthorized - you don't own this project");
		}

		await ctx.db.patch(args.projectId, {
			finalVideoUrl: args.finalVideoUrl,
			finalVideoDurationMs: args.finalVideoDurationMs,
			finalVideoSize: args.finalVideoSize,
			assemblyStatus: args.assemblyStatus ?? "completed",
			// Promote status to "completed" so the public watch page can serve the video
			// immediately after assembly, without requiring the user to click "Save to Dashboard"
			status: "completed",
			finalAssemblyAt: Date.now(),
			updatedAt: Date.now(),
		});

		return { success: true };
	},
});

/**
 * Parse and update refined story from Step 2 approved message
 * When user approves a refined story in Step 2, this extracts scene descriptions
 * and updates the project's generatedStory so Step 3 uses the refined version
 */
export const parseAndUpdateRefinedStory = mutation({
	args: {
		projectId: v.id("projects"),
		refinedStoryContent: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

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

		// Extract scene descriptions from the refined content
		// The content contains markdown with scene descriptions
		const sceneRegex =
			/\*\*Scene (\d+):\*\*\s*([^*]+?)(?=\*\*Scene|\*\*Music|$)/g;
		const matches = [...args.refinedStoryContent.matchAll(sceneRegex)];

		if (matches.length === 0) {
			console.log(
				"[parseAndUpdateRefinedStory] No scenes found in refined story, keeping original",
			);
			return { success: true, updated: false };
		}

		// Build updated scenes array
		const updatedScenes = matches.map((match) => {
			const sceneNumber = Number.parseInt(match[1], 10);
			const fullText = match[2].trim();

			// Extract description and mood (in parentheses)
			const moodMatch = fullText.match(/\(([^)]+)\)\s*$/);
			const description = moodMatch
				? fullText.substring(0, fullText.lastIndexOf("(")).trim()
				: fullText;
			const mood = moodMatch ? moodMatch[1].trim() : "";

			return {
				number: sceneNumber,
				description,
				mood,
			};
		});

		// Keep other story data, only update scenes
		const currentStory = project.generatedStory || {
			title: "Your Video Story",
			narration: "",
			emotionalArc: "",
			scenes: [],
			musicSuggestion: "",
		};

		await ctx.db.patch(args.projectId, {
			generatedStory: {
				...currentStory,
				scenes: updatedScenes,
				generatedAt: Date.now(),
			},
			updatedAt: Date.now(),
		});

		console.log(
			`[parseAndUpdateRefinedStory] Updated ${updatedScenes.length} scenes for project ${args.projectId}`,
		);
		return { success: true, updated: true, sceneCount: updatedScenes.length };
	},
});

/**
 * Get project by ID (internal query for actions)
 */
export const getInternal = internalQuery({
	args: { id: v.id("projects") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});
