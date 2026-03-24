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

import { auth } from "@clerk/nextjs/server";
import { streamText } from "ai";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getModelFromGateway } from "@/lib/ai/providers";
import { getArchitectPrompt } from "@/lib/architect/prompts";

export const maxDuration = 60;

export async function POST(req: Request) {
	let transactionId: Id<"creditTransactions"> | undefined;
	let convexToken: string | undefined;
	let userId: string | undefined;

	try {
		// 1. Auth
		const authResult = await auth();
		userId = authResult.userId ?? undefined;
		if (!userId) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		// 2. Parse params
		const url = new URL(req.url);
		const sessionId = url.searchParams.get("sessionId");
		const workspaceId = url.searchParams.get("workspaceId");

		if (!sessionId || !workspaceId) {
			return new Response(
				JSON.stringify({ error: "Missing sessionId or workspaceId" }),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
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
			return new Response(JSON.stringify({ error: "Missing message" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		// 3. Convex token
		convexToken =
			(await authResult.getToken({ template: "convex" })) ?? undefined;
		if (!convexToken) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		// 4. Check and deduct credits (1 credit per architect message)
		const creditResult = await fetchMutation(
			api.credits.deductCreditsPublic,
			{
				clerkUserId: userId,
				actionType: "architect_message",
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

		// 5. Load session
		const session = await fetchQuery(
			api.architectSessions.get,
			{ sessionId: sessionId as Id<"architectSessions"> },
			{ token: convexToken },
		);
		if (!session) {
			return new Response(JSON.stringify({ error: "Session not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		// 6. Load conversation history
		const history = await fetchQuery(
			api.architectSessions.getMessages,
			{ sessionId: sessionId as Id<"architectSessions"> },
			{ token: convexToken },
		);

		// 7. Load workspace agents for context injection
		const agents = await fetchQuery(
			api.agents.list,
			{},
			{ token: convexToken },
		).catch(() => []);

		// 8. Load mission context if exists
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

		// 9. Build system prompt
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

		// 10. Append conversation history to system prompt
		let fullSystemPrompt = systemPrompt;
		if (history.length > 0) {
			fullSystemPrompt += "\n\nConversation history:\n";
			for (const msg of history) {
				fullSystemPrompt += `${msg.role}: ${msg.content}\n`;
			}
			fullSystemPrompt += "\n";
		}

		// 11. Save user message BEFORE streaming (always persisted, even on error)
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

		// 12. Resolve model via Vercel AI Gateway (Claude by default for architect tasks)
		const selectedModel = "claude-sonnet-4-5";
		let aiModel: { gatewayModel: string } | null = null;
		try {
			aiModel = await fetchQuery(
				api.aiModels.getByModelId,
				{ modelId: selectedModel },
				{ token: convexToken },
			);
		} catch (e) {
			console.warn("[Architect API] Model lookup failed, using fallback:", e);
		}
		const model = getModelFromGateway(selectedModel, aiModel?.gatewayModel);

		// 13. Stream response
		const result = streamText({
			model,
			system: fullSystemPrompt,
			prompt: message,
		});

		// Assistant message saved by CLIENT after stream completes (serverless timeout safety)
		return result.toTextStreamResponse();
	} catch (error) {
		console.error("[architect/chat] Error:", error);

		// Refund credits if transaction started and stream failed
		if (transactionId) {
			try {
				await fetchMutation(
					api.credits.refundCreditsPublic,
					{
						transactionId,
						reason: "Architect streaming failed",
					},
					{ token: convexToken },
				);
				console.log(
					`[architect/chat] Credits refunded for transaction: ${transactionId}`,
				);
			} catch (refundError) {
				console.error(
					"[architect/chat] Failed to refund credits:",
					refundError,
				);
			}
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
