import { auth } from "@clerk/nextjs/server";
import { streamText } from "ai";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { systemPrompt } from "@/lib/ai/prompts/chat";
import { getModelFromGateway } from "@/lib/ai/providers";

/**
 * POST /api/chat
 * Streaming chat endpoint for AI chat conversations.
 *
 * Features:
 * - Streams responses in real-time using Vercel AI SDK
 * - Dynamic model selection via Vercel AI Gateway (no provider lock-in)
 * - Tracks token usage and costs to Convex usageTracking table
 * - Integrates with credit system (1 credit per message)
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
		convexToken =
			(await authResult.getToken({ template: "convex" })) ?? undefined;

		// 2. Parse request body
		const body = await req.json();
		const { messages, projectId, projectName, sceneId } = body;

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
				actionType: "chat_message",
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

		// 4. Resolve model dynamically via Vercel AI Gateway
		// Gateway handles provider auth — no individual API keys required.
		const selectedModel: string = body.selectedModel ?? "claude-sonnet-4-5";
		let aiModel: {
			provider: string;
			gatewayModel: string;
			inputCostPerMillion?: number | null;
			outputCostPerMillion?: number | null;
		} | null = null;
		try {
			aiModel = await fetchQuery(
				api.aiModels.getByModelId,
				{ modelId: selectedModel },
				{ token: convexToken },
			);
		} catch (e) {
			console.warn("[Chat API] Model lookup failed, using fallback:", e);
		}
		const model = getModelFromGateway(selectedModel, aiModel?.gatewayModel);
		const resolvedProvider = aiModel?.provider ?? "anthropic";

		// 5. Build system prompt
		// Geolocation is extracted from Vercel edge headers when available.
		// @vercel/functions is optional — fall back to undefined values in local dev.
		const requestHints = {
			longitude: req.headers.get("x-vercel-ip-longitude") ?? undefined,
			latitude: req.headers.get("x-vercel-ip-latitude") ?? undefined,
			city: req.headers.get("x-vercel-ip-city") ?? undefined,
			country: req.headers.get("x-vercel-ip-country") ?? undefined,
		};
		const prompt = systemPrompt({
			selectedChatModel: selectedModel,
			requestHints,
		});

		// 6. Build messages array for AI SDK v6
		// AI SDK v6 sends messages with `parts` array instead of `content` string.
		// Extract text from parts if content is missing.
		const coreMessages: Array<
			| { role: "system"; content: string }
			| { role: "user"; content: string }
			| { role: "assistant"; content: string }
		> = [
			{ role: "system", content: prompt },
			...messages
				.filter(
					(msg: { role: string; content?: string; parts?: unknown[] }) =>
						msg.role === "user" || msg.role === "assistant",
				)
				.map(
					(msg: {
						role: string;
						content?: string;
						parts?: Array<{ type: string; text?: string }>;
					}) => {
						let text = msg.content || "";
						if (!text && msg.parts) {
							const textParts = msg.parts.filter(
								(p) => p.type === "text" && p.text,
							);
							text = textParts.map((p) => p.text).join("\n");
						}
						return {
							role: msg.role as "user" | "assistant",
							content: text,
						};
					},
				)
				.filter((msg) => msg.content),
		];

		// 7. Stream response via gateway
		const result = await streamText({
			model,
			messages: coreMessages,
			temperature: 0.7,
			async onFinish({ usage, finishReason }) {
				const latency = Date.now() - startTime;

				// AI SDK v6 usage shape: promptTokens / completionTokens
				// biome-ignore lint/suspicious/noExplicitAny: AI SDK usage type varies across provider adapters
				const usageData = usage as any;
				const inputTokens =
					usageData.promptTokens || usageData.inputTokens || 0;
				const outputTokens =
					usageData.completionTokens || usageData.outputTokens || 0;

				console.log(
					`[Chat API] Finished - Reason: ${finishReason}, Model: ${selectedModel}, Tokens: ${inputTokens}/${outputTokens}, Latency: ${latency}ms`,
				);

				// Cost calculation — per-million token rates from Convex or fallback
				const inputCostRate = (aiModel?.inputCostPerMillion ?? 3.0) / 1_000_000;
				const outputCostRate =
					(aiModel?.outputCostPerMillion ?? 15.0) / 1_000_000;
				const cost =
					inputTokens * inputCostRate + outputTokens * outputCostRate;

				// Log to Convex usageTracking (fire and forget)
				try {
					await fetchMutation(
						api.usageTracking.logAIUsage,
						{
							userId,
							projectId,
							resourceType: "chat",
							resourceId: sceneId,
							eventType: "chat_conversation",
							service: resolvedProvider,
							model: selectedModel,
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

		// 8. Return UI message stream (required for AI SDK v6 useChat/DefaultChatTransport)
		return result.toUIMessageStreamResponse();
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
					eventType: "chat_conversation",
					service: "anthropic",
					model: "claude-sonnet-4-5",
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
