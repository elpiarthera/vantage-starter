/**
 * POST /api/architect/chat
 *
 * Architect Agent streaming endpoint.
 * Ported from vantage-studio/app/api/architect/chat/route.ts.
 *
 * Auth: Clerk JWT → Convex identity
 * Output: text/event-stream (AI SDK streamText → toTextStreamResponse)
 * Side effects:
 *   - Saves user message to Convex BEFORE streaming (always persisted)
 *   - Client saves assistant message AFTER stream completes
 *
 * Workspace context injected manually (Phase 5 RAG deferred per ORCHESTRATION-PLAN.md).
 */

import { openai } from "@ai-sdk/openai";
import { auth } from "@clerk/nextjs/server";
import { streamText } from "ai";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getArchitectPrompt } from "@/lib/architect/prompts";

export const maxDuration = 60;

export async function POST(req: Request) {
	// 1. Auth
	const { userId, getToken } = await auth();
	if (!userId) {
		return new Response("Unauthorized", { status: 401 });
	}

	// 2. Parse params
	const url = new URL(req.url);
	const sessionId = url.searchParams.get("sessionId");
	const workspaceId = url.searchParams.get("workspaceId");

	if (!sessionId || !workspaceId) {
		return new Response("Missing sessionId or workspaceId", { status: 400 });
	}

	const body = await req.json().catch(() => ({}));
	// Support both useChatUI format ({ messages }) and legacy format ({ prompt })
	let message: string;
	if (Array.isArray(body.messages) && body.messages.length > 0) {
		const lastUserMsg = [...body.messages]
			.reverse()
			// biome-ignore lint/suspicious/noExplicitAny: message shape from AI SDK runtime varies
			.find((m: any) => m.role === "user");
		message = lastUserMsg?.content ?? "";
	} else {
		message = body.prompt ?? body.message ?? "";
	}

	if (!message.trim()) {
		return new Response("Missing message", { status: 400 });
	}

	// 3. Convex token
	const convexToken = await getToken({ template: "convex" });
	if (!convexToken) {
		return new Response("Unauthorized", { status: 401 });
	}

	// 4. Load session
	const session = await fetchQuery(
		api.architectSessions.get,
		{ sessionId: sessionId as Id<"architectSessions"> },
		{ token: convexToken },
	);
	if (!session) {
		return new Response("Session not found", { status: 404 });
	}

	// 5. Load conversation history
	const history = await fetchQuery(
		api.architectSessions.getMessages,
		{ sessionId: sessionId as Id<"architectSessions"> },
		{ token: convexToken },
	);

	// 6. Load workspace agents for context injection
	const agents = await fetchQuery(
		api.agents.list,
		{},
		{ token: convexToken },
	).catch(() => []);

	// 7. Load mission context if exists
	let missionContext:
		| {
				missionId: string;
				missionName: string;
				missionBrief: string;
				existingOperations: string[];
		  }
		| undefined;

	if (session.existingMissionId) {
		const mission = await fetchQuery(
			api.missions.get,
			{ id: session.existingMissionId },
			{ token: convexToken },
		).catch(() => null);

		if (mission) {
			missionContext = {
				missionId: mission._id,
				missionName: mission.name,
				missionBrief: mission.brief ?? "",
				existingOperations: [],
			};
		}
	}

	// 8. Build system prompt
	const systemPrompt = getArchitectPrompt(
		// biome-ignore lint/suspicious/noExplicitAny: Convex agent shape not fully typed here
		agents.map((a: any) => ({
			id: a._id,
			name: a.name,
			description: a.description ?? "",
			role: a.roleName,
			persona: a.personaName,
			skills: a.skillIds ?? [],
		})),
		missionContext,
	);

	// 9. Append conversation history to system prompt
	let fullSystemPrompt = systemPrompt;
	if (history.length > 0) {
		fullSystemPrompt += "\n\nConversation history:\n";
		for (const msg of history) {
			fullSystemPrompt += `${msg.role}: ${msg.content}\n`;
		}
		fullSystemPrompt += "\n";
	}

	// 10. Save user message BEFORE streaming (always persisted, even on error)
	await fetchMutation(
		api.architectSessions.addMessage,
		{
			sessionId: sessionId as Id<"architectSessions">,
			role: "user",
			content: message,
		},
		{ token: convexToken },
	).catch((err) => {
		console.error("[architect/chat] Failed to save user message:", err);
		throw new Error("Failed to save message");
	});

	// 11. Stream using OpenAI (same provider as /api/chat)
	const result = streamText({
		model: openai("gpt-4o"),
		system: fullSystemPrompt,
		prompt: message,
	});

	// Assistant message saved by CLIENT after stream completes (serverless timeout safety)
	return result.toTextStreamResponse();
}
