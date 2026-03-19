import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

/**
 * List audio tracks for a project
 * This combines data from the audioTracks table AND the project's step4Data
 */
export const listByProject = query({
	args: {
		projectId: v.id("projects"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return [];

		// Get the project to access step4Data audio info
		const project = await ctx.db.get(args.projectId);
		if (!project) return [];

		// Verify ownership — project.userId is a Convex user _id, not a Clerk id
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();
		if (!user || project.userId !== user._id) {
			return [];
		}

		// Build audio tracks from project data
		const tracks: Array<{
			_id: string;
			type: "music" | "narration";
			title: string;
			description: string;
			url: string | null;
			duration: number;
			status: "completed" | "generating" | "draft";
			model: string;
			createdAt: number;
		}> = [];

		// Add narration if exists
		if (project.narrationAudioUrl) {
			tracks.push({
				_id: `${args.projectId}_narration`,
				type: "narration",
				title: "Project Narration",
				description:
					project.approvedNarrationScript?.slice(0, 100) ||
					"AI-generated narration",
				url: project.narrationAudioUrl,
				duration: 60, // Estimate, could be stored in project
				status: "completed",
				model: project.step4Data?.selectedVoice || "MiniMax Speech 2.6",
				createdAt: project.step4Data?.narrationTakes?.[0]
					? Date.now()
					: project._creationTime,
			});
		}

		// Add music if exists
		if (project.musicAudioUrl) {
			tracks.push({
				_id: `${args.projectId}_music`,
				type: "music",
				title: "Background Music",
				description: "AI-generated background music",
				url: project.musicAudioUrl,
				duration: project.duration || 60, // Use project duration
				status: "completed",
				model: "Stable Audio 2.5",
				createdAt: project._creationTime,
			});
		}

		// Also check step4Data for additional narration takes
		const narrationTakes = project.step4Data?.narrationTakes || [];
		for (const take of narrationTakes) {
			if (take.audioUrl && take.audioUrl !== project.narrationAudioUrl) {
				tracks.push({
					_id: take.id,
					type: "narration",
					title: take.name,
					description: `Voice: ${take.voice}`,
					url: take.audioUrl,
					duration: take.durationMs ? take.durationMs / 1000 : 30,
					status: "completed",
					model: take.voice || "MiniMax Speech 2.6",
					createdAt: project._creationTime,
				});
			}
		}

		// Check for music takes
		const musicTakes = project.step4Data?.musicTakes || [];
		for (const music of musicTakes) {
			if (music.audioUrl && music.audioUrl !== project.musicAudioUrl) {
				tracks.push({
					_id: `music_${music.id}`,
					type: "music",
					title: music.name,
					description: music.prompt,
					url: music.audioUrl,
					duration: project.duration || 60,
					status: "completed",
					model: "Stable Audio 2.5",
					createdAt: project._creationTime,
				});
			}
		}

		// Sort by type (narration first) then by creation time
		tracks.sort((a, b) => {
			if (a.type !== b.type) return a.type === "narration" ? -1 : 1;
			return b.createdAt - a.createdAt;
		});

		return tracks;
	},
});

/**
 * Insert an audio track when narration or music is stored in Convex (Sprint 27).
 * Called from narrationGeneration and musicGeneration actions after storing audio.
 */
export const insertFromGeneration = mutation({
	args: {
		projectId: v.id("projects"),
		type: v.union(v.literal("narration"), v.literal("music")),
		storageId: v.id("_storage"),
		durationMs: v.number(),
		title: v.string(),
		creditsUsed: v.optional(v.number()),
		order: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");

		const project = await ctx.db.get(args.projectId);
		if (!project) throw new Error("Project not found");

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();
		// project.userId is a Convex user _id, not a Clerk id
		if (!user || project.userId !== user._id) {
			throw new Error("Unauthorized - you don't own this project");
		}

		const now = Date.now();
		await ctx.db.insert("audioTracks", {
			organizationId: project.organizationId ?? undefined,
			projectId: args.projectId as string,
			userId: identity.subject,
			type: args.type,
			title: args.title,
			storageId: args.storageId,
			order: args.order ?? 0,
			startTime: 0,
			duration: args.durationMs / 1000,
			volume: 1,
			creditsUsed: args.creditsUsed ?? 5,
			createdAt: now,
			updatedAt: now,
		});

		return { success: true };
	},
});

/**
 * Get count of audio tracks for a project
 * Used for dashboard stats
 */
export const getProjectAudioCount = query({
	args: {
		projectId: v.id("projects"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		// Verify project ownership before returning data
		const project = await ctx.db.get(args.projectId);
		if (!project) {
			throw new Error("Project not found");
		}

		// project.userId is a Convex user _id, not a Clerk id
		const userForCount = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();
		if (!userForCount || project.userId !== userForCount._id) {
			throw new Error("Unauthorized - you don't own this project");
		}

		const tracks = await ctx.db
			.query("audioTracks")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
			.collect();

		return {
			total: tracks.length,
			music: tracks.filter((t) => t.type === "music").length,
			narration: tracks.filter((t) => t.type === "narration").length,
			soundEffects: tracks.filter((t) => t.type === "sound_effect").length,
		};
	},
});

/**
 * Insert a new audio track
 * Internal mutation for use by actions
 */
export const insert = internalMutation({
	args: {
		title: v.string(),
		projectId: v.optional(v.string()),
		type: v.union(
			v.literal("music"),
			v.literal("narration"),
			v.literal("sound_effect"),
		),
		storageId: v.optional(v.id("_storage")),
		duration: v.number(),
		userId: v.string(),
		organizationId: v.optional(v.string()),
		creditsUsed: v.number(),
		volume: v.number(),
		order: v.number(),
		startTime: v.number(),
		fadeIn: v.optional(v.number()),
		fadeOut: v.optional(v.number()),
		assetId: v.optional(v.string()),
		generationConfig: v.optional(
			v.object({
				model: v.string(),
				prompt: v.string(),
				voice: v.optional(v.string()),
				parameters: v.optional(v.any()),
			}),
		),
		createdAt: v.number(),
		updatedAt: v.number(),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("audioTracks", {
			title: args.title,
			projectId: args.projectId ?? undefined,
			type: args.type,
			storageId: args.storageId,
			duration: args.duration,
			userId: args.userId,
			organizationId: args.organizationId ?? undefined,
			creditsUsed: args.creditsUsed,
			volume: args.volume,
			order: args.order,
			startTime: args.startTime,
			fadeIn: args.fadeIn ?? undefined,
			fadeOut: args.fadeOut ?? undefined,
			assetId: args.assetId ?? undefined,
			generationConfig: args.generationConfig ?? undefined,
			createdAt: args.createdAt,
			updatedAt: args.updatedAt,
		});
	},
});

/**
 * Get project narrations (both recorded and generated voices)
 * Query for displaying audio tracks in Project Details -> Audio tab
 */
export const getProjectNarrations = query({
	args: { projectId: v.id("projects") },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");

		// Verify project ownership
		const project = await ctx.db.get(args.projectId);
		if (!project) throw new Error("Project not found");

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique();

		// project.userId is a Convex user _id, not a Clerk id
		if (!user || project.userId !== user._id) {
			throw new Error("Unauthorized - you don't own this project");
		}

		// Query audioTracks with compound index
		const tracks = await ctx.db
			.query("audioTracks")
			.withIndex("by_project_and_type", (q) =>
				q.eq("projectId", args.projectId).eq("type", "narration"),
			)
			.order("desc")
			.collect();

		// Enrich with audio URLs from storage
		return await Promise.all(
			tracks.map(async (track) => ({
				...track,
				audioUrl: track.storageId
					? await ctx.storage.getUrl(track.storageId)
					: null,
				// Add source indicator based on generationConfig presence
				source: track.generationConfig
					? ("generated" as const)
					: ("recorded" as const),
			})),
		);
	},
});

/**
 * Delete an audio track. Only the owner (userId) can delete their own tracks.
 */
export const remove = mutation({
	args: { id: v.id("audioTracks") },
	handler: async (ctx, { id }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");
		const track = await ctx.db.get(id);
		if (!track) throw new Error("Audio track not found");
		if (track.userId !== identity.subject)
			throw new Error("Not authorized to delete this track");
		await ctx.db.delete(id);
		if (track.storageId) {
			try {
				await ctx.storage.delete(track.storageId);
			} catch (_) {
				// best-effort: blob may already be gone
			}
		}
	},
});
