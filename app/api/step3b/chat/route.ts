import { openai } from "@ai-sdk/openai";
import { auth } from "@clerk/nextjs/server";
import { type CoreMessage, streamText } from "ai";
import { NARRATION_SCRIPT_PROMPT } from "@/lib/ai/prompts";

export async function POST(req: Request) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		const body = await req.json();
		const { messages, projectContext, sceneContext } = body;

		if (!messages || !Array.isArray(messages)) {
			return new Response(
				JSON.stringify({ error: "Invalid request: messages required" }),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		// Build the system prompt with FULL project context
		const systemPrompt = NARRATION_SCRIPT_PROMPT.buildPrompt({
			// Event basics
			occasion: projectContext?.occasion || "",
			theme: projectContext?.theme || "",
			language: projectContext?.language || "English",
			languageCode: projectContext?.languageCode,

			// Event details (from Step 1 - matches schema)
			eventTitle: projectContext?.eventTitle,
			eventDate: projectContext?.eventDate,
			eventLocation: projectContext?.eventLocation,
			emotionalStory: projectContext?.emotionalStory,

			// Story context (from Step 2)
			storyNarration: projectContext?.storyNarration,
			emotionalArc: projectContext?.emotionalArc,

			// Scenes (from Step 3)
			scenes: sceneContext || [],
			totalDuration:
				sceneContext?.reduce(
					(sum: number, scene: { duration?: number }) =>
						sum + (scene.duration || 0),
					0,
				) || 30,

			// Chat context
			userMessage: messages[messages.length - 1]?.content,
			conversationHistory: messages,
		});

		const coreMessages: CoreMessage[] = [
			{ role: "system", content: systemPrompt },
			...messages.map(
				(msg: { role: string; content: string }): CoreMessage => ({
					role: msg.role as "user" | "assistant",
					content: msg.content,
				}),
			),
		];

		const result = await streamText({
			model: openai("gpt-4o"),
			messages: coreMessages,
			temperature: 0.7,
		});

		return result.toTextStreamResponse();
	} catch (error) {
		console.error("[Step3b Chat] Error:", error);
		return new Response(
			JSON.stringify({
				error:
					error instanceof Error
						? error.message
						: "Unexpected error during narration chat",
			}),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}
}
