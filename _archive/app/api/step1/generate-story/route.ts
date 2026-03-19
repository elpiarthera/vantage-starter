import { openai } from "@ai-sdk/openai";
import { auth } from "@clerk/nextjs/server";
import { generateText } from "ai";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { calculateAICost } from "@/lib/ai/costCalculation";
import { STORY_GENERATION_PROMPT } from "@/lib/ai/prompts";

/**
 * POST /api/step1/generate-story
 *
 * Generates the video story concept from Step 1 data.
 * Costs 5 credits (step1_story_generation) - ONLY if no story exists yet.
 *
 * If project already has a generatedStory, returns it without charging credits.
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
			occasion,
			theme,
			eventTitle,
			description,
			date,
			location,
			personalStory,
			language,
			projectId,
			projectName,
		} = body;

		if (!occasion || !theme || !eventTitle || !personalStory || !projectId) {
			return new Response(
				JSON.stringify({ error: "Missing required fields" }),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		// 3. Check if project already has a generated story
		const existingProject = await fetchQuery(
			api.projects.get,
			{ projectId: projectId as Id<"projects"> },
			{ token: convexToken },
		);

		if (existingProject?.generatedStory) {
			// Story already exists - return it without charging credits
			console.log(
				"[Generate Story] Returning existing story (no credits charged)",
			);
			return new Response(
				JSON.stringify({
					story: existingProject.generatedStory,
					fromCache: true,
					creditsUsed: 0,
				}),
				{ status: 200, headers: { "Content-Type": "application/json" } },
			);
		}

		// 4. No existing story - check and deduct credits
		const creditResult = await fetchMutation(
			api.credits.deductCreditsPublic,
			{
				clerkUserId: userId,
				actionType: "step1_story_generation",
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

		// 5. Verify API key
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

		// 6. Build prompt using modular prompt system
		const prompt = STORY_GENERATION_PROMPT.getPrompt({
			occasion,
			theme,
			eventTitle,
			description,
			date,
			location,
			personalStory,
			language: language || "English",
		});

		// Get model config from prompt metadata
		const modelName =
			(STORY_GENERATION_PROMPT.metadata.model as string) || "gpt-4o";
		const temperature = STORY_GENERATION_PROMPT.metadata.temperature ?? 0.8;
		const maxTokens = STORY_GENERATION_PROMPT.metadata.maxTokens ?? 1000;

		// 7. Generate story
		try {
			const result = await generateText({
				model: openai(modelName),
				prompt,
				temperature,
				maxOutputTokens: maxTokens,
			});

			const latency = Date.now() - startTime;

			// 8. Parse JSON response
			let storyData: {
				title: string;
				narration: string;
				emotionalArc: string;
				scenes: Array<{ number: number; description: string; mood: string }>;
				musicSuggestion: string;
			};
			try {
				// Clean the response - remove markdown code blocks if present
				let cleanedText = result.text.trim();
				if (cleanedText.startsWith("```json")) {
					cleanedText = cleanedText.slice(7);
				} else if (cleanedText.startsWith("```")) {
					cleanedText = cleanedText.slice(3);
				}
				if (cleanedText.endsWith("```")) {
					cleanedText = cleanedText.slice(0, -3);
				}
				storyData = JSON.parse(cleanedText.trim());
			} catch (parseError) {
				console.error("[Generate Story] JSON parse error:", parseError);
				// If JSON parsing fails, create a simple structure from the text
				storyData = {
					title: eventTitle,
					narration: result.text.trim(),
					emotionalArc: `A ${theme} story for ${occasion}`,
					scenes: [],
					musicSuggestion: "Emotional background music",
				};
			}

			// 9. Save story to project in Convex
			await fetchMutation(
				api.projects.saveGeneratedStory,
				{
					projectId: projectId as Id<"projects">,
					clerkUserId: userId,
					generatedStory: storyData,
				},
				{ token: convexToken },
			);

			// 10. Log usage
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
					eventType: "story_generation",
					service: "openai",
					model: modelName,
					creditsUsed: 5,
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

			// 11. Return generated story
			return new Response(
				JSON.stringify({
					story: storyData,
					fromCache: false,
					creditsUsed: 5,
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

			console.error("[Generate Story] AI error:", aiError);

			// Log failed attempt
			await fetchMutation(
				api.usageTracking.logAIUsage,
				{
					userId,
					projectId,
					resourceType: "chat",
					eventType: "story_generation",
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
					error: "Failed to generate story. Credits have been refunded.",
					refunded: true,
				}),
				{ status: 500, headers: { "Content-Type": "application/json" } },
			);
		}
	} catch (error) {
		console.error("[Generate Story] Error:", error);
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
