/**
 * POST /api/consultant/onboard
 *
 * Consultant Onboarding streaming endpoint.
 * Adapted from /api/architect/chat/route.ts.
 *
 * Auth: Clerk JWT → Convex identity
 * Output: UI message stream (streamText → toUIMessageStreamResponse)
 * Side effects:
 *   - Deducts 1 credit (consultant_onboard) before streaming; refunds on error
 *   - Saves user message to architectSessions (if sessionId present) BEFORE streaming
 *   - Client saves assistant message AFTER stream completes
 *
 * System prompt: pain-oriented discovery via lib/consultant/prompts.ts
 * Context: project brandKit + competitors from Convex + registry teams
 */

import { openai } from "@ai-sdk/openai";
import { auth } from "@clerk/nextjs/server";
import { streamText } from "ai";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { onboardingPrompt } from "@/lib/consultant/prompts";
import type { OnboardingContext } from "@/lib/consultant/types";

export const maxDuration = 60;

export async function POST(req: Request) {
	let transactionId: Id<"creditTransactions"> | undefined;
	let convexToken: string | undefined;

	// 1. Auth
	const { userId, getToken } = await auth();
	if (!userId) {
		return new Response("Unauthorized", { status: 401 });
	}

	// 2. Parse params
	const url = new URL(req.url);
	const projectId = url.searchParams.get("projectId");

	if (!projectId) {
		return new Response("Missing projectId", { status: 400 });
	}

	// 3. Parse body
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

	// 4. Convex token
	convexToken = (await getToken({ template: "convex" })) ?? undefined;
	if (!convexToken) {
		return new Response("Unauthorized", { status: 401 });
	}

	// 5. Deduct credits before streaming
	const creditResult = await fetchMutation(
		api.credits.deductCreditsPublic,
		{
			clerkUserId: userId,
			actionType: "consultant_onboard",
		},
		{ token: convexToken },
	);

	if (!creditResult.success) {
		return new Response(
			JSON.stringify({
				error: creditResult.error,
				code: "INSUFFICIENT_CREDITS",
			}),
			{ status: 402, headers: { "Content-Type": "application/json" } },
		);
	}
	transactionId = creditResult.transactionId;

	try {
		// 6. Load project from Convex
		const project = await fetchQuery(
			api.consultantProjects.get,
			{ projectId: projectId as Id<"consultantProjects"> },
			{ token: convexToken },
		);

		if (!project) {
			// Refund credits — project lookup failed after deduction
			if (transactionId) {
				await fetchMutation(
					api.credits.refundCreditsPublic,
					{ transactionId, reason: "Project not found" },
					{ token: convexToken },
				).catch(() => {});
			}
			return new Response("Project not found", { status: 404 });
		}

		// 7. Load registry teams for context injection
		const registryTeams = await fetchQuery(
			api.registry.listTeams,
			{},
			{ token: convexToken },
		).catch(() => []);

		// 8. Load conversation history if session exists
		let historyText = "";
		if (project.sessionId) {
			const history = await fetchQuery(
				api.architectSessions.getMessages,
				{ sessionId: project.sessionId },
				{ token: convexToken },
			).catch(() => []);

			if (history.length > 0) {
				historyText = "\n\nConversation history:\n";
				for (const msg of history) {
					historyText += `${msg.role}: ${msg.content}\n`;
				}
				historyText += "\n";
			}
		}

		// 9. Build OnboardingContext
		const onboardingContext: OnboardingContext = {
			projectName: project.name,
			clientName: project.clientName,
			clientWebsiteUrl: project.clientWebsiteUrl,
			sector: project.sector,
			brandKit: project.brandKit as OnboardingContext["brandKit"] | undefined,
			competitors: project.competitors as OnboardingContext["competitors"],
			availableTeams: registryTeams.map((t) => ({
				teamId: t.teamId,
				name: t.name,
				description: t.description,
				category: t.category,
				agentCount: t.agentIds.length,
			})),
		};

		// 10. Build system prompt
		const systemPrompt = onboardingPrompt(onboardingContext) + historyText;

		// 11. Save user message BEFORE streaming (if session exists)
		if (project.sessionId) {
			await fetchMutation(
				api.architectSessions.addMessage,
				{
					sessionId: project.sessionId,
					role: "user",
					content: message,
				},
				{ token: convexToken },
			).catch((err) => {
				console.error("[consultant/onboard] Failed to save user message:", err);
			});
		}

		// 12. Stream
		const result = streamText({
			model: openai("gpt-4o"),
			system: systemPrompt,
			prompt: message,
		});

		// Assistant message saved by CLIENT after stream completes (serverless timeout safety)
		return result.toUIMessageStreamResponse();
	} catch (error) {
		console.error("[consultant/onboard] Stream error:", error);

		// Refund credits if stream failed after deduction
		if (transactionId && convexToken) {
			await fetchMutation(
				api.credits.refundCreditsPublic,
				{
					transactionId,
					reason: "Consultant onboarding stream failed",
				},
				{ token: convexToken },
			).catch((refundErr) => {
				console.error(
					"[consultant/onboard] Failed to refund credits:",
					refundErr,
				);
			});
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
