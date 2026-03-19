import { openai } from "@ai-sdk/openai";
import { auth } from "@clerk/nextjs/server";
import { type CoreMessage, streamText } from "ai";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { calculateAICost } from "@/lib/ai/costCalculation";
import { AI_DIRECTOR_PROMPT } from "@/lib/ai/prompts";

/**
 * POST /api/chat
 * Streaming chat endpoint for AI Director conversations
 *
 * Features:
 * - Streams responses in real-time using Vercel AI SDK
 * - Uses OpenAI GPT-5-mini (primary) with Together.ai fallback (TODO)
 * - Tracks token usage and costs to Convex usageTracking table
 * - Integrates with credit system (1 credit per message)
 * - Mobile-optimized with proper error handling
 */
export async function POST(req: Request) {
	const startTime = Date.now();
	let transactionId: Id<"creditTransactions"> | undefined;
	let convexToken: string | undefined;
	let userId: string | undefined;

	try {
		// 1. Authenticate user
		const authResult = await auth();
		userId = authResult.userId ?? undefined;
		if (!userId) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}
		// Obtain Clerk JWT so fetchMutation carries auth identity to Convex
		convexToken = (await authResult.getToken({ template: "convex" })) ?? undefined;

		// 2. Parse request body
		const body = await req.json();
		const { messages, projectId, projectName, sceneId, occasion } = body;

		if (!messages || !Array.isArray(messages)) {
			return new Response(
				JSON.stringify({ error: "Invalid request: messages required" }),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		// 3. Check and deduct credits (1 credit per chat message)
		const creditResult = await fetchMutation(
			api.credits.deductCreditsPublic,
			{
				clerkUserId: userId,
				actionType: "step2_chat_message",
				projectId,
				projectName,
			},
			{ token: convexToken },
		);

		if (!creditResult.success) {
			return new Response(
				JSON.stringify({
					error: creditResult.error,
					code: "INSUFFICIENT_CREDITS",
					required: creditResult.required,
					available: creditResult.available,
				}),
				{ status: 402, headers: { "Content-Type": "application/json" } },
			);
		}
		transactionId = creditResult.transactionId;

		// 4. Verify API key
		const openaiKey = process.env.OPENAI_API_KEY;
		if (!openaiKey) {
			// Refund credits since we can't proceed
			if (transactionId) {
				await fetchMutation(
					api.credits.refundCreditsPublic,
					{
						transactionId,
						reason: "API key not configured",
					},
					{ token: convexToken },
				);
			}
			return new Response(
				JSON.stringify({
					error:
						"AI service not configured. Please add OPENAI_API_KEY to environment variables.",
				}),
				{ status: 503, headers: { "Content-Type": "application/json" } },
			);
		}

		// 5. Build system prompt for AI Director using modular prompt
		const systemPrompt = AI_DIRECTOR_PROMPT.getPrompt(
			occasion ? { projectType: occasion } : undefined,
		);

		// 6. Convert messages to CoreMessage format (AI SDK v5)
		const coreMessages: CoreMessage[] = [
			{ role: "system", content: systemPrompt },
			...messages.map(
				(msg: { role: string; content: string }): CoreMessage => ({
					role: msg.role as "user" | "assistant",
					content: msg.content,
				}),
			),
		];

		// 7. Stream response from OpenAI
		const result = await streamText({
			model: openai("gpt-4o") as any, // TODO: upgrade to AI SDK v6 — v1/v2 type mismatch
			messages: coreMessages,
			temperature: 0.7,
			async onFinish({ usage, finishReason }) {
				const latency = Date.now() - startTime;

				// Extract token counts from usage object
				// biome-ignore lint/suspicious/noExplicitAny: AI SDK v5 usage type is inconsistent across versions
				const usageData = usage as any;
				const inputTokens =
					usageData.promptTokens || usageData.inputTokens || 0;
				const outputTokens =
					usageData.completionTokens || usageData.outputTokens || 0;

				console.log(
					`[Chat API] Finished - Reason: ${finishReason}, Tokens: ${inputTokens}/${outputTokens}, Latency: ${latency}ms`,
				);

				// Calculate cost
				const { cost } = calculateAICost("openai", "gpt-4o", {
					inputTokens,
					outputTokens,
				});

			// Log to Convex usageTracking (fire and forget)
			try {
				await fetchMutation(
					api.usageTracking.logAIUsage,
					{
						userId,
						projectId,
						resourceType: "chat",
						resourceId: sceneId,
						eventType: "step2_conversation",
						service: "openai",
						model: "gpt-4o",
						creditsUsed: 1,
						cost,
						metadata: {
							inputTokens,
							outputTokens,
							latency,
							success: true,
						},
					},
					{ token: convexToken },
				);
					console.log(`[Chat API] Cost tracked: $${cost.toFixed(4)}`);
				} catch (error) {
					console.error("[Chat API] Failed to log usage:", error);
					// Don't fail the response if tracking fails
				}
			},
		});

		// 7. Return streaming text response
		return result.toTextStreamResponse();
	} catch (error) {
		const latency = Date.now() - startTime;
		console.error("[Chat API] Error:", error);

		// Refund credits if transaction started and stream failed
		if (transactionId) {
			try {
				await fetchMutation(
					api.credits.refundCreditsPublic,
					{
						transactionId,
						reason: "AI streaming failed",
					},
					{ token: convexToken },
				);
				console.log(
					`[Chat API] Credits refunded for transaction: ${transactionId}`,
				);
			} catch (refundError) {
				console.error("[Chat API] Failed to refund credits:", refundError);
			}
		}

		// Log error to usage tracking
		try {
			await fetchMutation(
				api.usageTracking.logAIUsage,
				{
					userId: userId || undefined,
					resourceType: "chat",
					eventType: "step2_conversation",
					service: "openai",
					model: "gpt-4o",
					creditsUsed: 0,
					cost: 0,
					metadata: {
						success: false,
						error: error instanceof Error ? error.message : "Unknown error",
						latency,
						refunded: !!transactionId,
					},
				},
				{ token: convexToken },
			);
		} catch (trackingError) {
			console.error("[Chat API] Failed to log error:", trackingError);
		}

		return new Response(
			JSON.stringify({
				error:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
				refunded: !!transactionId,
			}),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}
}
