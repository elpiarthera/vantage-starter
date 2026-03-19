"use node";

/**
 * Generic FAL voice action (Voice Generator Phase 2.1).
 * Scheduled by voiceTool.startGenericVoiceGeneration only. Not exposed to client.
 *
 * All model config read from Convex `voiceModelSchemas` table:
 * - allowedParams: Filter out invalid params before sending to FAL
 * - maxPromptLength: Truncate prompt to model-specific max length
 *
 * This enables zero-code model onboarding — add a row to Convex, done.
 * Pattern mirrors: imageToolGeneric.ts
 */
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { internalAction } from "../_generated/server";

const FAL_KEY = process.env.FAL_KEY;
const BASE = "https://queue.fal.run";

type QueueStatus = "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED";
interface QueueStatusResponse {
	status: QueueStatus;
	request_id: string;
	status_url?: string;
	response_url?: string;
}
interface AudioFile {
	url: string;
	content_type?: string;
	file_name?: string;
	file_size?: number;
	duration?: number;
	sample_rate?: number;
	channels?: number;
}
interface FalVoiceResult {
	audio?: AudioFile;
	duration_ms?: number;
}

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 60;

export const generateGenericVoice = internalAction({
	args: {
		modelId: v.string(),
		params: v.any(),
		transactionId: v.id("creditTransactions"),
		clerkUserId: v.string(),
		title: v.string(),
		projectId: v.optional(v.id("projects")),
	},
	handler: async (ctx, args) => {
		const startTime = Date.now();

		if (!FAL_KEY) {
			await ctx.runMutation(internal.credits.refundCredits, {
				transactionId: args.transactionId,
				reason: "FAL API key not set in deployment (env FAL_KEY)",
			});
			throw new Error("FAL API key not set in deployment (env FAL_KEY)");
		}

		// 1. Get model schema from Convex (NOT hardcoded config)
		const schema = await ctx.runQuery(api.voiceModels.getByModelId, {
			modelId: args.modelId,
		});
		if (!schema) {
			await ctx.runMutation(internal.credits.refundCredits, {
				transactionId: args.transactionId,
				reason: `Unknown voice model: ${args.modelId}`,
			});
			throw new Error(`Unknown voice model: ${args.modelId}`);
		}

		const url = `${BASE}/${schema.modelId}`;
		const rawParams = args.params as Record<string, unknown>;

		// 2. Map flat params to FAL API structure
		// Frontend uses flat keys (voice_id, speed, pitch, emotion, language)
		// FAL API expects nested structure (voice_setting.voice_id, etc.)
		const falParams: Record<string, unknown> = {};

		// For MiniMax models: voice_setting object
		if (schema.modelId.includes("minimax")) {
			const voiceSetting: Record<string, unknown> = {};

			// BUG-02 fix: seedVoiceModels uses dotted keys ("voice_setting.voice_id")
			// which arrive in rawParams as flat string keys. Check both formats.
			const voiceId = rawParams["voice_setting.voice_id"] ?? rawParams.voice_id;
			const speed = rawParams["voice_setting.speed"] ?? rawParams.speed;
			const pitch = rawParams["voice_setting.pitch"] ?? rawParams.pitch;
			const emotion = rawParams["voice_setting.emotion"] ?? rawParams.emotion;

			if (voiceId) voiceSetting.voice_id = voiceId as string;
			if (speed !== undefined) voiceSetting.speed = speed as number;
			if (pitch !== undefined) voiceSetting.pitch = pitch as number;
			if (emotion) voiceSetting.emotion = emotion as string;

			if (Object.keys(voiceSetting).length > 0) {
				falParams.voice_setting = voiceSetting;
			}

			// Copy other allowed params
			if (rawParams.prompt) falParams.prompt = rawParams.prompt;
		}
		// For Qwen model: flat structure
		else if (schema.modelId.includes("qwen")) {
			if (rawParams.text) falParams.text = rawParams.text;
			if (rawParams.voice) falParams.voice = rawParams.voice;
			// BUG-19 fix: seed key renamed from "prompt" to "style_prompt";
			// fallback to rawParams.prompt for backward compatibility with old data
			const stylePrompt = rawParams.style_prompt ?? rawParams.prompt;
			if (stylePrompt) falParams.prompt = stylePrompt as string;
			if (rawParams.language) falParams.language = rawParams.language;
		}

		// 3. Sanitize prompt length from schema.maxPromptLength
		if (typeof falParams.prompt === "string") {
			falParams.prompt = falParams.prompt.slice(0, schema.maxPromptLength);
		}
		if (typeof falParams.text === "string") {
			falParams.text = (falParams.text as string).slice(
				0,
				schema.maxPromptLength,
			);
		}

		// 4. Call FAL API using schema.modelId
		let requestId: string;
		try {
			const response = await fetch(url, {
				method: "POST",
				headers: {
					Authorization: `Key ${FAL_KEY}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ input: falParams }),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(
					`FAL API request failed: ${response.status} ${errorText}`,
				);
			}

			const queueStatus = (await response.json()) as QueueStatusResponse;
			requestId = queueStatus.request_id;
		} catch (error) {
			await ctx.runMutation(internal.credits.refundCredits, {
				transactionId: args.transactionId,
				reason: `FAL API request failed: ${error instanceof Error ? error.message : String(error)}`,
			});
			throw new Error(
				`Failed to queue voice generation: ${error instanceof Error ? error.message : String(error)}`,
			);
		}

		// 5. Poll for completion
		let result: FalVoiceResult | null = null;
		for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
			await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

			const statusResponse = await fetch(
				`${url}/requests/${requestId}/status`,
				{
					headers: { Authorization: `Key ${FAL_KEY}` },
				},
			);

			if (!statusResponse.ok) {
				continue;
			}

			const status = (await statusResponse.json()) as QueueStatusResponse;

			if (status.status === "COMPLETED") {
				const resultResponse = await fetch(`${url}/requests/${requestId}`, {
					headers: { Authorization: `Key ${FAL_KEY}` },
				});

				if (resultResponse.ok) {
					result = (await resultResponse.json()) as FalVoiceResult;
					break;
				}
			}
		}

		if (!result?.audio?.url) {
			await ctx.runMutation(internal.credits.refundCredits, {
				transactionId: args.transactionId,
				reason: "Voice generation timed out or failed",
			});
			throw new Error("Voice generation timed out or failed");
		}

		// 6. Store audio in Convex (with error handling and refund)
		let storageId: string;
		let audioUrl: string | null;

		try {
			// Download audio from FAL
			const audioResponse = await fetch(result.audio.url);
			if (!audioResponse.ok) {
				throw new Error(`Failed to download audio: ${audioResponse.status}`);
			}

			const audioBlob = await audioResponse.blob();
			const audioBuffer = await audioBlob.arrayBuffer();

			// Store in Convex
			storageId = await ctx.storage.store(new Blob([audioBuffer]));
			audioUrl = await ctx.storage.getUrl(storageId);

			if (!audioUrl) {
				throw new Error("Failed to generate storage URL");
			}
		} catch (storageError) {
			// Refund credits if storage fails after successful FAL generation
			await ctx.runMutation(internal.credits.refundCredits, {
				transactionId: args.transactionId,
				reason: `Storage failure: ${storageError instanceof Error ? storageError.message : String(storageError)}`,
			});
			throw new Error(
				`Audio storage failed: ${storageError instanceof Error ? storageError.message : String(storageError)}`,
			);
		}

		// 7. Calculate duration in seconds
		const durationSeconds = result.duration_ms
			? result.duration_ms / 1000
			: result.audio.duration || 0;

		// 8. Extract voice settings from params (use raw flat params)
		const voiceSettings = {
			voiceId:
				(rawParams.voice_id as string) ||
				(rawParams.voice as string) ||
				"unknown",
			speed: rawParams.speed as number | undefined,
			pitch: rawParams.pitch as number | undefined,
			emotion: rawParams.emotion as string | undefined,
		};

		// 9. Get the text prompt (handle both parameter names)
		const promptText =
			(rawParams.prompt as string) || (rawParams.text as string) || "";

		// 10. Get user record and project details
		const user = await ctx.runQuery(internal.users.getByClerkId, {
			clerkUserId: args.clerkUserId,
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

			if (project.userId !== user._id) {
				throw new Error("Unauthorized - you don't own this project");
			}

			organizationId = project.organizationId ?? null;
		}

		// 11. Get transaction to retrieve credit cost
		const transaction = await ctx.runQuery(internal.credits.getTransaction, {
			transactionId: args.transactionId,
		});
		const creditsUsed = transaction ? Math.abs(transaction.amount) : 0;

		// 12. Save to audioTracks (not voiceToolHistory) with refund on failure
		const now = Date.now();
		try {
			await ctx.runMutation(internal.audioTracks.insert, {
				title: args.title,
				projectId: args.projectId ?? undefined,
				type: "narration",
				storageId: storageId as never,
				duration: durationSeconds,
				userId: args.clerkUserId,
				organizationId: organizationId ?? undefined,
				creditsUsed: creditsUsed,
				volume: 1.0,
				order: 0,
				startTime: 0,
				fadeIn: undefined,
				fadeOut: undefined,
				assetId: undefined,
				generationConfig: {
					model: args.modelId,
					prompt: promptText,
					voice: voiceSettings.voiceId,
					parameters: rawParams,
				},
				createdAt: now,
				updatedAt: now,
			});

			// Log AI usage for billing/analytics
			try {
				await ctx.runMutation(api.usageTracking.logAIUsage, {
					userId: args.clerkUserId,
					projectId: args.projectId as string | undefined,
					resourceType: "audio",
					resourceId: args.projectId as string | undefined,
					eventType: "voice_generation",
					service: "fal",
					model: args.modelId,
					creditsUsed,
					cost: 0,
					metadata: {
						success: true,
						duration: durationSeconds * 1000,
						latency: Date.now() - startTime,
					},
				});
			} catch (logError) {
				console.error("[generateGenericVoice] Failed to log usage:", logError);
			}

			return {
				success: true,
				audioUrl,
				storageId,
				duration: durationSeconds,
			};
		} catch (insertError) {
			console.error(
				"[generateVoiceGeneric] Database insert failed:",
				insertError,
			);

			// Clean up orphaned storage blob before refunding
			try {
				// biome-ignore lint/suspicious/noExplicitAny: storageId is Id<"_storage"> at runtime; `use node` context returns string from store()
				await ctx.storage.delete(storageId as any);
			} catch (_) {
				// best-effort: blob may already be gone
			}

			// Refund credits on database failure
			await ctx.runMutation(internal.credits.refundCredits, {
				transactionId: args.transactionId,
				reason: `Database insert failed: ${insertError instanceof Error ? insertError.message : String(insertError)}`,
			});

			throw new Error("Failed to save generated audio record");
		}
	},
});
