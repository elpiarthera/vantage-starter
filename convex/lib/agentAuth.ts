/**
 * Agent authentication for HTTP endpoints.
 *
 * Agents authenticate via two headers:
 *   X-Agent-Id    — the Convex document ID of the agent
 *   X-Agent-Token — the 64-char hex secret issued at agent creation
 *
 * This module is called from httpAction handlers (ActionCtx).
 * Actions cannot use ctx.db — all DB reads go through ctx.runQuery.
 *
 * Token comparison uses timingSafeEqualV8 (XOR over Uint8Array).
 * node:crypto.timingSafeEqual is NOT available in Convex V8 runtime.
 * === is NOT acceptable — it short-circuits and leaks timing info.
 */

import { ConvexError } from "convex/values";
import { internal } from "../_generated/api";
import type { Doc } from "../_generated/dataModel";
import type { ActionCtx } from "../_generated/server";
import { timingSafeEqualV8 } from "./agentTokens";

/**
 * Validate agent identity from request headers.
 *
 * @throws ConvexError("Unauthorized") for any auth failure — deliberate:
 *   we do not distinguish "agent not found" from "wrong token" to prevent
 *   enumeration attacks.
 */
export async function requireAgentAuth(
	ctx: ActionCtx,
	request: Request,
): Promise<Doc<"agents">> {
	const agentId = request.headers.get("X-Agent-Id");
	const token = request.headers.get("X-Agent-Token");

	// Reject immediately if either header is missing
	if (!agentId || !token) {
		throw new ConvexError("Unauthorized");
	}

	let agent: Doc<"agents"> | null;
	try {
		// Actions cannot use ctx.db — must go through internalQuery
		agent = await ctx.runQuery(internal.agents.getById, {
			agentId: agentId as Doc<"agents">["_id"],
		});
	} catch {
		// Invalid ID format or query failure — treat as unauthorized
		throw new ConvexError("Unauthorized");
	}

	if (!agent || !agent.isActive) {
		throw new ConvexError("Unauthorized");
	}

	// agent.token is optional in schema — an agent without a token cannot authenticate
	if (!agent.token) {
		throw new ConvexError("Unauthorized");
	}

	// Constant-time comparison — prevents timing oracle attacks
	if (!timingSafeEqualV8(agent.token, token)) {
		throw new ConvexError("Unauthorized");
	}

	return agent;
}
