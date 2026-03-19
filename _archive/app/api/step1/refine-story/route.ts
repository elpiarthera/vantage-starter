import { openai } from "@ai-sdk/openai";
import { auth } from "@clerk/nextjs/server";
import { generateText } from "ai";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { calculateAICost } from "@/lib/ai/costCalculation";
import { STORY_REFINEMENT_PROMPT } from "@/lib/ai/prompts";

/**
 * POST /api/step1/refine-story
 *
 * Refines the user's personal story using AI.
 * Costs 1 credit (step1_story_refinement).
 */
export async function POST(req: Request) {
	const startTime = Date.now();
	let convexToken: string | undefined;

	try {
		// 1. Authenticate user
		const authResult = await auth();
		const { userId } = authResult;
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
		const {
			personalStory,
			occasion,
			theme,
			eventTitle,
			language,
			projectId,
			projectName,
		} = body;

		if (!personalStory || !occasion || !theme || !eventTitle) {
			return new Response(
				JSON.stringify({ error: "Missing required fields" }),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		// 3. Check and deduct credits
		const creditResult = await fetchMutation(
			api.credits.deductCreditsPublic,
			{
				clerkUserId: userId,
				actionType: "step1_story_refinement",
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

		// 4. Verify API key
		const openaiKey = process.env.OPENAI_API_KEY;
		if (!openaiKey) {
			// Refund credits since we can't proceed
			if (creditResult.transactionId) {
				await fetchMutation(
					api.credits.refundCreditsPublic,
					{
						transactionId: creditResult.transactionId,
						reason: "API key not configured",
					},
					{ token: convexToken },
				);
			}
			return new Response(
				JSON.stringify({ error: "AI service not configured" }),
				{ status: 503, headers: { "Content-Type": "application/json" } },
			);
		}

		// 5. Build prompt using modular prompt system
		const prompt = STORY_REFINEMENT_PROMPT.getPrompt({
			personalStory,
			occasion,
			theme,
			eventTitle,
			language: language || "English",
		});

		// Get model config from prompt metadata
		const modelName =
			(STORY_REFINEMENT_PROMPT.metadata.model as string) || "gpt-4o";
		const temperature = STORY_REFINEMENT_PROMPT.metadata.temperature ?? 0.7;
		const maxTokens = STORY_REFINEMENT_PROMPT.metadata.maxTokens ?? 500;

		// 6. Generate refined story
		try {
			const result = await generateText({
				model: openai(modelName),
				prompt,
				temperature,
				maxOutputTokens: maxTokens,
			});

			const latency = Date.now() - startTime;

			// 7. Log usage - use 'any' cast for AI SDK v5 usage type inconsistency
			// biome-ignore lint/suspicious/noExplicitAny: AI SDK v5 usage type varies
			const usageData = result.usage as any;
			const inputTokens =
				usageData?.promptTokens || usageData?.inputTokens || 0;
			const outputTokens =
				usageData?.completionTokens || usageData?.outputTokens || 0;
			const { cost } = calculateAICost("openai", modelName, {
				inputTokens,
				outputTokens,
			});

			await fetchMutation(
				api.usageTracking.logAIUsage,
				{
					userId,
					projectId,
					resourceType: "chat",
					eventType: "story_refinement",
					service: "openai",
					model: modelName,
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

			// 8. Return refined story
			return new Response(
				JSON.stringify({
					refinedStory: result.text.trim(),
					creditsUsed: 1,
					newBalance: creditResult.newBalance,
				}),
				{ status: 200, headers: { "Content-Type": "application/json" } },
			);
		} catch (aiError) {
			// AI call failed - refund credits
			if (creditResult.transactionId) {
				await fetchMutation(
					api.credits.refundCreditsPublic,
					{
						transactionId: creditResult.transactionId,
						reason: "AI generation failed",
					},
					{ token: convexToken },
				);
			}

			console.error("[Refine Story] AI error:", aiError);

			// Log failed attempt
			await fetchMutation(
				api.usageTracking.logAIUsage,
				{
					userId,
					projectId,
					resourceType: "chat",
					eventType: "story_refinement",
					service: "openai",
					model: modelName,
					creditsUsed: 0,
					cost: 0,
					metadata: {
						success: false,
						error: aiError instanceof Error ? aiError.message : "Unknown error",
						latency: Date.now() - startTime,
						refunded: true,
					},
				},
				{ token: convexToken },
			);

			return new Response(
				JSON.stringify({
					error: "Failed to refine story. Credits have been refunded.",
					refunded: true,
				}),
				{ status: 500, headers: { "Content-Type": "application/json" } },
			);
		}
	} catch (error) {
		console.error("[Refine Story] Error:", error);
		return new Response(
			JSON.stringify({
				error:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
			}),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}
}
