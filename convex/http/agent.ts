/**
 * ToolLoopAgent HTTP Action — AI SDK v6
 *
 * Full-featured agent endpoint with:
 * - Auth (requireUser pattern)
 * - Rate limiting (20 req/min via aiStreaming limit)
 * - Credit deduction per agent turn
 * - RAG search tool (workspace-scoped, direct ragClient.search call)
 * - Memory tool (Anthropic memory_20250818 protocol pattern)
 * - Streaming via toUIMessageStreamResponse (v6)
 * - stopWhen: stepCountIs(20)
 *
 * Route: POST /ai/agent
 * Registered in convex/http.ts
 */

import { gateway } from "@ai-sdk/gateway";
import { RateLimiter } from "@convex-dev/ratelimiter";
import {
	type ModelMessage,
	stepCountIs,
	ToolLoopAgent,
	type ToolSet,
	tool,
} from "ai";
import { z } from "zod";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { api, components, internal as internalGen } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { httpAction } from "../_generated/server";
import { getWorkspaceNamespace, ragClient } from "../lib/rag";

// Type-widen internal to allow memory module (generated after Convex codegen runs)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const internal = internalGen as any;

const CREDIT_COST_ACTION_TYPE = "chat_message";

// Rate limiter instance — same 20 req/min aiStreaming limit as chat endpoint
const rateLimiter = new RateLimiter(components.ratelimiter, {
	aiStreaming: {
		kind: "fixed window",
		rate: 20,
		period: 60_000,
	},
});

/**
 * Resolve a model ID to a gateway LanguageModelV2.
 * Accepts "provider/model" or bare model ID (defaults to anthropic).
 */
function resolveModel(modelId: string) {
	return modelId.includes("/")
		? gateway(modelId)
		: gateway(`anthropic/${modelId}`);
}

export const agentChat = httpAction(async (ctx, request) => {
	// CORS preflight
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

	// 2. Rate limit — 20 req/min per user
	const { ok, retryAfter } = await rateLimiter.limit(ctx, "aiStreaming", {
		key: identity.subject,
	});
	if (!ok) {
		return new Response(
			JSON.stringify({
				error: "Rate limit exceeded",
				retryAfter: Math.ceil((retryAfter ?? 60_000) / 1000),
			}),
			{ status: 429, headers: { "Content-Type": "application/json" } },
		);
	}

	// 3. Parse body
	let body: {
		messages: ModelMessage[];
		model?: string;
		systemPrompt?: string;
		workspaceId?: string;
	};
	try {
		body = await request.json();
	} catch {
		return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const { messages, model: modelId, systemPrompt, workspaceId } = body;
	if (!messages || !Array.isArray(messages) || messages.length === 0) {
		return new Response(
			JSON.stringify({ error: "messages array is required" }),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}

	const resolvedModelId = modelId ?? "anthropic/claude-sonnet-4-5";
	const resolvedModel = resolveModel(resolvedModelId);
	const workspaceDocId = workspaceId
		? (workspaceId as Id<"workspaces">)
		: undefined;

	// 4. Deduct credits
	try {
		await ctx.runMutation(internalGen.credits.deductCredits, {
			clerkUserId: identity.subject,
			actionType: CREDIT_COST_ACTION_TYPE,
		});
	} catch (err) {
		return new Response(
			JSON.stringify({ error: "Insufficient credits", detail: String(err) }),
			{ status: 402, headers: { "Content-Type": "application/json" } },
		);
	}

	// 5. Build tools
	const agentTools: ToolSet = {};

	// RAG search — workspace-scoped knowledge base
	if (workspaceDocId) {
		agentTools.searchKnowledgeBase = tool({
			description:
				"Search the workspace knowledge base for relevant information. Use when the user asks about documents, files, or stored context.",
			inputSchema: z.object({
				query: z
					.string()
					.describe("Search query — be specific and descriptive"),
				limit: z
					.number()
					.optional()
					.default(5)
					.describe("Number of results to return (1-10)"),
			}),
			execute: async ({ query, limit }) => {
				const searchResult = await ragClient.search(ctx, {
					namespace: getWorkspaceNamespace(workspaceDocId),
					query,
				});
				const { entries } = searchResult;
				if (!entries || entries.length === 0) {
					return "No relevant documents found in the knowledge base.";
				}
				const topEntries = entries.slice(0, Math.min(limit ?? 5, 10));
				return topEntries
					.map(
						(e: { text: string }, i: number) => `[Result ${i + 1}]\n${e.text}`,
					)
					.join("\n\n");
			},
		});
	}

	// Memory tool — Anthropic memory_20250818 protocol (custom Convex backend)
	agentTools.memory = tool({
		description:
			"Read or write persistent memory. Use 'view' to read a file, 'create' to save content, 'search' to find relevant memories.",
		inputSchema: z.discriminatedUnion("action", [
			z.object({
				action: z.literal("view"),
				path: z.string().describe("Memory file path, e.g. /memories/core.md"),
			}),
			z.object({
				action: z.literal("create"),
				path: z.string(),
				content: z.string(),
				memoryType: z.enum(["core", "notes", "preference"]).default("notes"),
			}),
			z.object({
				action: z.literal("search"),
				query: z.string(),
			}),
		]),
		execute: async (input) => {
			if (input.action === "view") {
				const record = await ctx.runQuery(internal.memory.getFile, {
					userId: identity.subject,
					workspaceId: workspaceDocId,
					path: input.path,
				});
				return record?.content ?? `No memory file found at ${input.path}`;
			}
			if (input.action === "create") {
				await ctx.runMutation(internal.memory.createMemory, {
					userId: identity.subject,
					workspaceId: workspaceDocId,
					path: input.path,
					content: input.content,
					memoryType: input.memoryType,
				});
				return `Memory saved at ${input.path}`;
			}
			if (input.action === "search") {
				const results = (await ctx.runQuery(internal.memory.searchMemory, {
					userId: identity.subject,
					query: input.query,
				})) as Array<{ path: string; content: string; memoryType: string }>;
				if (results.length === 0) return "No memories found.";
				return results
					.map((r) => `[${r.path}]\n${r.content}`)
					.join("\n\n---\n\n");
			}
			return "Unknown memory action";
		},
	});

	// 6. Build ToolLoopAgent with prepareCall for core memory injection
	const agent = new ToolLoopAgent({
		model: resolvedModel,
		instructions: systemPrompt ?? "You are a helpful AI assistant.",
		stopWhen: stepCountIs(20),
		tools: agentTools,
		prepareCall: async () => {
			// Inject fresh core memory before each generate call
			const freshCore = (await ctx.runQuery(internal.memory.getCoreMemory, {
				userId: identity.subject,
				workspaceId: workspaceDocId,
			})) as string;
			const base = systemPrompt ?? "You are a helpful AI assistant.";
			const memBlock = freshCore ? `\n\n## Your memory\n${freshCore}` : "";
			// prepareCall must return model + optional overrides
			return {
				model: resolvedModel,
				instructions: `${base}${memBlock}`,
			};
		},
	});

	// 7. Await agent.stream() to get StreamTextResult, then return UI message stream
	try {
		const streamResult = await agent.stream({ messages });

		// Log usage after stream completes — fire-and-forget, non-fatal
		void (async () => {
			try {
				await ctx.runMutation(api.usageTracking.logAIUsage, {
					userId: identity.subject,
					service: resolvedModelId.includes("/")
						? resolvedModelId.split("/")[0]
						: "anthropic",
					model: resolvedModelId,
					resourceType: "agent",
					eventType: "generation",
					creditsUsed: 1,
					cost: 0,
				});
			} catch {
				// Non-fatal — usage logging must not break the streaming response
			}
		})();

		// v6: toUIMessageStreamResponse carries tool states, reasoning, custom data
		return streamResult.toUIMessageStreamResponse({
			headers: { "Access-Control-Allow-Origin": "*" },
		});
	} catch (err) {
		console.error("Agent streaming error:", err);
		return new Response(
			JSON.stringify({ error: "Agent generation failed", detail: String(err) }),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}
});
