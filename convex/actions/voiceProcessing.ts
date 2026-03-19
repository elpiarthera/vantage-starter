"use node";

import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { internalAction } from "../_generated/server";

/**
 * processRecordedVoice - Action to store recorded audio and save to history
 *
 * Handles:
 * - Audio blob storage in Convex
 * - Metadata calculation (duration)
 * - Saving to voiceToolHistory with mode="record"
 * - Optional: Audio enhancement (future)
 * - Optional: Transcript generation (future)
 */
export const processRecordedVoice = internalAction({
	args: {
		clerkUserId: v.string(), // Passed from mutation; scheduled actions have no auth context
		storageId: v.id("_storage"), // Storage ID of uploaded audio
		duration: v.number(), // Duration in seconds
		title: v.string(),
		projectId: v.optional(v.id("projects")),
		enhance: v.optional(v.boolean()), // Future: audio enhancement
		generateTranscript: v.optional(v.boolean()), // Future: speech-to-text
		transactionId: v.id("creditTransactions"), // REQUIRED for refunds on failure
	},
	handler: async (ctx, args) => {
		const startTime = Date.now();
		const clerkUserId = args.clerkUserId;

		console.log("[processRecordedVoice] Starting:", {
			userId: clerkUserId,
			duration: args.duration,
			hasProjectId: !!args.projectId,
			enhance: args.enhance,
			generateTranscript: args.generateTranscript,
		});

		try {
			// 1. Retrieve audio from Convex storage
			let storageId: string;
			let audioUrl: string;

			try {
				const url = await ctx.storage.getUrl(args.storageId);
				if (!url) {
					throw new Error("Failed to get storage URL");
				}
				storageId = args.storageId;
				audioUrl = url;

				console.log("[processRecordedVoice] Audio retrieved:", { storageId });
			} catch (storageError) {
				console.error(
					"[processRecordedVoice] Storage retrieval failed:",
					storageError,
				);

				// Refund credits on storage retrieval failure
				await ctx.runMutation(internal.credits.refundCredits, {
					transactionId: args.transactionId,
					reason: `Audio storage retrieval failed: ${storageError instanceof Error ? storageError.message : String(storageError)}`,
				});

				throw new Error("Failed to store audio");
			}

			// 3. Optional: Enhance audio quality (future feature)
			if (args.enhance) {
				console.log(
					"[processRecordedVoice] Audio enhancement requested (not yet implemented)",
				);
				// TODO: Call fal.ai or similar for audio enhancement
			}

			// 4. Optional: Generate transcript (future feature)
			let transcript: string | undefined;
			if (args.generateTranscript) {
				console.log(
					"[processRecordedVoice] Transcript generation requested (not yet implemented)",
				);
				// TODO: Call fal.ai speech-to-text endpoint
			}

			// 5. Get user record and project details
			const user = await ctx.runQuery(internal.users.getByClerkId, {
				clerkUserId,
			});

			if (!user) {
				throw new Error("User not found");
			}

			let organizationId: string | null = null;
			if (args.projectId) {
				const project = await ctx.runQuery(internal.projects.getInternal, {
					id: args.projectId,
				});

				if (!project) {
					throw new Error("Project not found");
				}

				// project.userId is a Convex user _id; user record is already fetched above
				if (project.userId !== user._id) {
					throw new Error("Unauthorized - you don't own this project");
				}

				organizationId = project.organizationId ?? null;
			}

			// 6. Insert directly into audioTracks (not voiceToolHistory)
			const now = Date.now();
			try {
				// Read credits from transaction record (same pattern as voiceToolGeneric)
				const transaction = await ctx.runQuery(
					internal.credits.getTransaction,
					{
						transactionId: args.transactionId,
					},
				);
				const creditsUsed = transaction ? Math.abs(transaction.amount) : 1;

				await ctx.runMutation(internal.audioTracks.insert, {
					title: args.title,
					projectId: args.projectId ?? undefined,
					type: "narration",
					storageId: storageId as never,
					duration: args.duration,
					userId: args.clerkUserId,
					organizationId: organizationId ?? undefined,
					creditsUsed,
					volume: 1.0,
					order: 0,
					startTime: 0,
					fadeIn: undefined,
					fadeOut: undefined,
					assetId: undefined,
					generationConfig: undefined, // No generation config for recordings
					createdAt: now,
					updatedAt: now,
				});

				console.log("[processRecordedVoice] Success:", { audioUrl });

				// Log AI usage for billing/analytics
				try {
					await ctx.runMutation(api.usageTracking.logAIUsage, {
						userId: args.clerkUserId,
						projectId: args.projectId as string | undefined,
						resourceType: "audio",
						resourceId: args.projectId as string | undefined,
						eventType: "voice_recording",
						service: "recording",
						model: "recorded",
						creditsUsed,
						cost: 0,
						metadata: {
							success: true,
							duration: args.duration * 1000,
							latency: Date.now() - startTime,
						},
					});
				} catch (logError) {
					console.error(
						"[processRecordedVoice] Failed to log usage:",
						logError,
					);
				}

				return {
					success: true,
					audioUrl,
					storageId,
					transcript,
				};
			} catch (insertError) {
				console.error(
					"[processRecordedVoice] Database insert failed:",
					insertError,
				);

				// Refund credits on database failure
				await ctx.runMutation(internal.credits.refundCredits, {
					transactionId: args.transactionId,
					reason: `Database insert failed: ${insertError instanceof Error ? insertError.message : String(insertError)}`,
				});

				throw new Error("Failed to save audio record");
			}
		} catch (error) {
			console.error("[processRecordedVoice] Failed:", error);
			throw error;
		}
	},
});
