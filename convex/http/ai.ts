/**
 * AI Streaming HTTP Action
 *
 * Edge runtime HTTP action (no "use node" directive).
 * HTTP actions run in Convex's edge runtime (V8), not Node.js.
 *
 * Uses @ai-sdk/gateway for multi-provider routing — returns LanguageModelV2
 * which is fully compatible with ai@5.x streamText.
 *
 * Routes registered in convex/http.ts:
 *   POST /ai/chat
 *   OPTIONS /ai/chat  (CORS preflight)
 *
 * Auth: Clerk via ctx.auth
 * Credits: deducted before generation via internal.credits.deductCredits
 * Usage: logged via api.usageTracking.logAIUsage after completion
 */

import { gateway } from "@ai-sdk/gateway";
import { type ModelMessage, streamText } from "ai";
import { DEFAULT_CHAT_MODEL } from "../../lib/ai/models";
import { api, internal } from "../_generated/api";
import { httpAction } from "../_generated/server";

const CREDIT_COST_ACTION_TYPE = "chat";

/**
 * Resolve a model ID to a LanguageModelV2 via the Vercel AI Gateway.
 * Gateway model IDs use "provider/model" format:
 *   "anthropic/claude-sonnet-4.5"
 *   "openai/gpt-4o"
 *   "google/gemini-2.5-flash"
 */
function resolveModel(modelId: string) {
	// If already in "provider/model" format, use directly
	if (modelId.includes("/")) {
		return gateway(modelId);
	}
	// Default to anthropic provider for bare model IDs
	return gateway(`anthropic/${modelId}`);
}

export const chat = httpAction(async (ctx, request) => {
	if (request.method === "OPTIONS") {
		return new Response(null, {
			status: 204,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "POST, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
			},
		});
	}

	// 1. Auth
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	// 2. Parse body
	let body: { messages: ModelMessage[]; model?: string; systemPrompt?: string };
	try {
		body = await request.json();
	} catch {
		return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const { messages, model: modelId, systemPrompt } = body;
	if (!messages || !Array.isArray(messages) || messages.length === 0) {
		return new Response(
			JSON.stringify({ error: "messages array is required" }),
			{
				status: 400,
				headers: { "Content-Type": "application/json" },
			},
		);
	}

	const resolvedModelId = modelId ?? DEFAULT_CHAT_MODEL;

	// 3. Deduct credits (looks up cost by actionType in creditCosts table)
	try {
		await ctx.runMutation(internal.credits.deductCredits, {
			clerkUserId: identity.subject,
			actionType: CREDIT_COST_ACTION_TYPE,
		});
	} catch (err) {
		return new Response(
			JSON.stringify({ error: "Insufficient credits", detail: String(err) }),
			{ status: 402, headers: { "Content-Type": "application/json" } },
		);
	}

	// 4. Stream
	try {
		const result = streamText({
			model: resolveModel(resolvedModelId),
			messages,
			...(systemPrompt ? { system: systemPrompt } : {}),
			onFinish: async ({ usage }) => {
				// ai@5: usage.inputTokens / usage.outputTokens
				await ctx.runMutation(api.usageTracking.logAIUsage, {
					userId: identity.subject,
					service: resolvedModelId.includes("/")
						? resolvedModelId.split("/")[0]
						: "anthropic",
					model: resolvedModelId,
					resourceType: "chat",
					eventType: "generation",
					creditsUsed: 1,
					cost: 0,
					metadata: {
						inputTokens: usage.inputTokens,
						outputTokens: usage.outputTokens,
					},
				});
			},
		});

		return result.toTextStreamResponse({
			headers: { "Access-Control-Allow-Origin": "*" },
		});
	} catch (err) {
		console.error("AI streaming error:", err);
		return new Response(
			JSON.stringify({ error: "AI generation failed", detail: String(err) }),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}
});
