/**
 * AI Agent Definitions — AI SDK v6 ToolLoopAgent
 *
 * Orchestrator + domain specialist subagents.
 * Subagents are ToolLoopAgent instances exposed as tools to the orchestrator.
 *
 * Pattern:
 *   createOrchestratorAgent().stream({ messages }) →
 *     internally delegates to dataAnalystAgent or contentWriterAgent as tools
 *
 * abortSignal is always propagated for clean cancellation.
 */

import { ToolLoopAgent, stepCountIs, tool } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { z } from "zod";

// ============================================================================
// MODELS
// ============================================================================

/** Fast model for subagents — they run inside the orchestrator's token budget */
const subagentModel = gateway("anthropic/claude-haiku-4-5");

/** Full model for the orchestrator */
const orchestratorModel = gateway("anthropic/claude-sonnet-4-5");

// ============================================================================
// SPECIALIST SUBAGENTS
// ============================================================================

/**
 * Data Analyst subagent.
 * Handles: data summarization, metrics interpretation, trend identification,
 * and structured insight generation.
 */
export const dataAnalystAgent = new ToolLoopAgent({
	model: subagentModel,
	instructions: `You are a specialist data analyst.
Analyze data, identify patterns, summarize metrics, and produce clear structured insights.
Always structure output as:
1. Key findings (bullet list)
2. Trends identified
3. Recommended actions (if applicable)
Be concise. No filler.`,
	stopWhen: stepCountIs(5),
});

/**
 * Content Writer subagent.
 * Handles: drafting copy, rewriting content, creating outlines,
 * adapting tone, and generating structured text assets.
 */
export const contentWriterAgent = new ToolLoopAgent({
	model: subagentModel,
	instructions: `You are a specialist content writer.
Write, rewrite, and structure text assets as requested.
Adapt tone and format to the specific request.
Output only the requested content — no commentary, no preamble.`,
	stopWhen: stepCountIs(5),
});

// ============================================================================
// SUBAGENT TOOLS (expose subagents as tools for the orchestrator)
// ============================================================================

/**
 * Wrap dataAnalystAgent as a tool for the orchestrator.
 */
export const delegateToDataAnalyst = tool({
	description:
		"Delegate a data analysis task to the specialist data analyst agent. Use when the user needs metrics interpreted, data summarized, or insights extracted from structured data.",
	inputSchema: z.object({
		task: z
			.string()
			.describe(
				"Clear description of the data analysis task and any data to analyze",
			),
	}),
	execute: async (
		{ task }: { task: string },
		options: { abortSignal?: AbortSignal },
	) => {
		const result = await dataAnalystAgent.generate({
			prompt: task,
			abortSignal: options?.abortSignal,
		});
		return result.text;
	},
});

/**
 * Wrap contentWriterAgent as a tool for the orchestrator.
 */
export const delegateToContentWriter = tool({
	description:
		"Delegate a content writing task to the specialist content writer agent. Use when the user needs copy drafted, rewritten, outlined, or structured.",
	inputSchema: z.object({
		task: z
			.string()
			.describe(
				"Clear description of the writing task: format, tone, length, and topic",
			),
	}),
	execute: async (
		{ task }: { task: string },
		options: { abortSignal?: AbortSignal },
	) => {
		const result = await contentWriterAgent.generate({
			prompt: task,
			abortSignal: options?.abortSignal,
		});
		return result.text;
	},
});

// ============================================================================
// ORCHESTRATOR FACTORY
// ============================================================================

/**
 * Create an orchestrator agent with access to all specialist subagents.
 * Called once per HTTP request — not a module-level singleton (stateless).
 *
 * @param extraTools - Additional tools to inject (e.g. RAG search, memory)
 * @param instructions - Custom system instructions for this session
 */
export function createOrchestratorAgent(
	extraTools: Record<string, ReturnType<typeof tool>> = {},
	instructions?: string,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): ToolLoopAgent<any, any, any> {
	const baseInstructions = `You are a capable AI assistant with access to specialist subagents.

When a task clearly maps to a specialist:
- Data analysis, metrics, trends → delegate to dataAnalyst tool
- Content writing, drafting, rewriting → delegate to contentWriter tool
- Other tasks → handle directly

Always be direct and useful. Delegate when it adds value, not as a default.`;

	return new ToolLoopAgent({
		model: orchestratorModel,
		instructions: instructions
			? `${baseInstructions}\n\n${instructions}`
			: baseInstructions,
		stopWhen: stepCountIs(20),
		tools: {
			dataAnalyst: delegateToDataAnalyst,
			contentWriter: delegateToContentWriter,
			...extraTools,
		},
	});
}
