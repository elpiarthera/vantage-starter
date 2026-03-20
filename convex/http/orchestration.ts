/**
 * Agent HTTP endpoints — execution engine (Phase 8).
 *
 * Agents authenticate via X-Agent-Id + X-Agent-Token headers.
 * All DB access goes through ctx.runQuery / ctx.runMutation — never ctx.db
 * (httpAction = ActionCtx, no direct DB access).
 *
 * CORS: restricted to NEXT_PUBLIC_APP_URL env var (not wildcard *).
 * Per ORCHESTRATION-PLAN.md security fix M1.
 *
 * Rate limiting: 60 req/min per agent via @convex-dev/ratelimiter.
 * TODO: wire via internal mutation if rate limit enforcement is needed
 * server-side (requires RateLimiter instance in a mutation, not action).
 * For now: rate limit is enforced at the Convex function level via
 * the existing ratelimiter component — see rateLimits.ts pattern.
 *
 * Endpoints:
 *   POST /agent/operations/claim     — claim + get composed system prompt
 *   POST /agent/operations/complete  — submit output + trigger orchestration
 *   POST /agent/operations/fail      — mark failed
 *   GET  /agent/operations/pending   — list pending ops for this agent
 *   GET  /agent/missions/context     — read mission brief + sibling statuses
 *
 * NOTE: Convex httpRouter does NOT support path parameters (:id style).
 * All resource IDs use query string params: ?operationId=<id>.
 */

import { internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import { httpAction } from "../_generated/server";
import { requireAgentAuth } from "../lib/agentAuth";

// ---------------------------------------------------------------------------
// CORS helper — restrict to app domain
// ---------------------------------------------------------------------------

function corsHeaders(): HeadersInit {
	const origin =
		process.env.NEXT_PUBLIC_APP_URL ?? "https://vantagestarter.com";
	return {
		"Access-Control-Allow-Origin": origin,
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, X-Agent-Id, X-Agent-Token",
		"Access-Control-Max-Age": "86400",
	};
}

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"Content-Type": "application/json",
			...corsHeaders(),
		},
	});
}

function errorResponse(message: string, status: number): Response {
	return jsonResponse({ error: message }, status);
}

// ---------------------------------------------------------------------------
// OPTIONS — preflight for all /agent/* routes
// ---------------------------------------------------------------------------

export const agentOptionsHandler = httpAction(async () => {
	return new Response(null, {
		status: 204,
		headers: corsHeaders(),
	});
});

// ---------------------------------------------------------------------------
// POST /agent/operations/claim
// ---------------------------------------------------------------------------
// Body: { operationId: string }
// 1. requireAgentAuth → get agent
// 2. Load operation → verify assignedAgentId === agent._id
// 3. Verify status is "pending" (not "blocked")
// 4. Verify all dependsOn are "completed" → 409 if not
// 5. Patch: status = "in_progress", claimedAt, startedAt
// 6. Compose agent system prompt via internalQuery
// 7. Return { operation, missionBrief, agentSystemPrompt, siblingStatuses }

export const claimOperation = httpAction(async (ctx, request) => {
	// Auth
	let agent: Doc<"agents">;
	try {
		agent = await requireAgentAuth(ctx, request);
	} catch {
		return errorResponse("Unauthorized", 401);
	}

	// Parse body
	let body: { operationId?: string };
	try {
		body = await request.json();
	} catch {
		return errorResponse("Invalid JSON body", 400);
	}

	if (!body.operationId) {
		return errorResponse("Missing operationId in request body", 400);
	}

	const operationId = body.operationId as Id<"operations">;

	// Load operation via internalQuery
	const operation = await ctx.runQuery(internal.operations.getById, {
		operationId,
	});

	if (!operation) {
		return errorResponse("Operation not found", 404);
	}

	// Scope check — agent can only claim ops assigned to it
	if (operation.assignedAgentId !== agent._id) {
		return errorResponse(
			"Forbidden — operation not assigned to this agent",
			403,
		);
	}

	// Status check — must be "pending"
	if (operation.status !== "pending") {
		return errorResponse(
			`Cannot claim operation with status "${operation.status}"`,
			409,
		);
	}

	// Dependency check — all dependsOn must be completed
	if (operation.dependsOn && operation.dependsOn.length > 0) {
		const depStatuses = await ctx.runQuery(internal.operations.getDepStatuses, {
			operationIds: operation.dependsOn,
		});
		const blockedBy = depStatuses
			.filter((d) => d.status !== "completed")
			.map((d) => d.operationId);

		if (blockedBy.length > 0) {
			return jsonResponse({ error: "Operation is blocked", blockedBy }, 409);
		}
	}

	const now = Date.now();

	// Patch to in_progress
	await ctx.runMutation(internal.operations.claimInternal, {
		operationId,
		claimedAt: now,
		startedAt: now,
	});

	// Load mission for context
	const mission = await ctx.runQuery(internal.missions.getById, {
		missionId: operation.missionId,
	});

	// Compose 4-Pillars system prompt
	const agentSystemPrompt = await ctx.runQuery(
		internal.lib.agentComposer.composeAgentSystemPrompt,
		{ agentId: agent._id },
	);

	// Sibling statuses (name + assignedAgentId + status, NO output)
	const siblingStatuses = await ctx.runQuery(
		internal.operations.getSiblingStatuses,
		{ missionId: operation.missionId, excludeOperationId: operationId },
	);

	return jsonResponse({
		operation: {
			...operation,
			status: "in_progress",
			claimedAt: now,
			startedAt: now,
		},
		missionBrief: mission?.brief ?? null,
		missionObjective: mission?.objective ?? null,
		missionSuccessCriteria: mission?.successCriteria ?? null,
		agentSystemPrompt,
		siblingStatuses,
	});
});

// ---------------------------------------------------------------------------
// POST /agent/operations/complete
// ---------------------------------------------------------------------------
// Body: { operationId: string, output: string, artifacts?: string[] }
// 1. Auth + scope
// 2. Verify status === "in_progress"
// 3. If requiresReview → status = "awaiting_review"
//    Else → status = "completed", completedAt, increment usageCount
// 4. await ctx.runMutation(internal.orchestration.onOperationCompleted, { operationId })
// 5. Return { status, nextPendingOperations }

export const completeOperation = httpAction(async (ctx, request) => {
	let agent: Doc<"agents">;
	try {
		agent = await requireAgentAuth(ctx, request);
	} catch {
		return errorResponse("Unauthorized", 401);
	}

	let body: { operationId?: string; output?: string; artifacts?: string[] };
	try {
		body = await request.json();
	} catch {
		return errorResponse("Invalid JSON body", 400);
	}

	if (!body.operationId || body.output === undefined) {
		return errorResponse("Missing operationId or output", 400);
	}

	const operationId = body.operationId as Id<"operations">;

	const operation = await ctx.runQuery(internal.operations.getById, {
		operationId,
	});

	if (!operation) {
		return errorResponse("Operation not found", 404);
	}

	if (operation.assignedAgentId !== agent._id) {
		return errorResponse(
			"Forbidden — operation not assigned to this agent",
			403,
		);
	}

	if (operation.status !== "in_progress") {
		return errorResponse(
			`Cannot complete operation with status "${operation.status}"`,
			409,
		);
	}

	const now = Date.now();

	// If requires review → awaiting_review (human reviews before orchestration)
	// Else → completed, trigger orchestration
	if (operation.requiresReview) {
		await ctx.runMutation(internal.operations.completeInternal, {
			operationId,
			output: body.output,
			artifacts: body.artifacts,
			status: "awaiting_review",
			completedAt: undefined,
		});
		// Increment agent usage count regardless
		await ctx.runMutation(internal.agents.incrementUsageInternal, {
			agentId: agent._id,
		});
		return jsonResponse({ status: "awaiting_review" });
	}

	// Complete + trigger dependency resolution
	await ctx.runMutation(internal.operations.completeInternal, {
		operationId,
		output: body.output,
		artifacts: body.artifacts,
		status: "completed",
		completedAt: now,
	});

	await ctx.runMutation(internal.agents.incrementUsageInternal, {
		agentId: agent._id,
	});

	// Pre-build blocker #6: MUST await — silent failure without it
	await ctx.runMutation(internal.orchestration.onOperationCompleted, {
		operationId,
	});

	// Return next pending ops for this agent (helpful for polling loops)
	const nextPending = await ctx.runQuery(
		internal.operations.getPendingForAgent,
		{
			agentId: agent._id,
		},
	);

	return jsonResponse({
		status: "completed",
		nextPendingOperations: nextPending,
	});
});

// ---------------------------------------------------------------------------
// POST /agent/operations/fail
// ---------------------------------------------------------------------------
// Body: { operationId: string, error: string }

export const failOperation = httpAction(async (ctx, request) => {
	let agent: Doc<"agents">;
	try {
		agent = await requireAgentAuth(ctx, request);
	} catch {
		return errorResponse("Unauthorized", 401);
	}

	let body: { operationId?: string; error?: string };
	try {
		body = await request.json();
	} catch {
		return errorResponse("Invalid JSON body", 400);
	}

	if (!body.operationId) {
		return errorResponse("Missing operationId", 400);
	}

	const operationId = body.operationId as Id<"operations">;

	const operation = await ctx.runQuery(internal.operations.getById, {
		operationId,
	});

	if (!operation) {
		return errorResponse("Operation not found", 404);
	}

	if (operation.assignedAgentId !== agent._id) {
		return errorResponse(
			"Forbidden — operation not assigned to this agent",
			403,
		);
	}

	await ctx.runMutation(internal.operations.failInternal, {
		operationId,
		error: body.error ?? "Agent reported failure",
	});

	return jsonResponse({ status: "failed" });
});

// ---------------------------------------------------------------------------
// GET /agent/operations/pending
// ---------------------------------------------------------------------------
// Returns all pending operations for this agent where all dependsOn are completed.
// Agents poll this endpoint.

export const getPendingOperations = httpAction(async (ctx, request) => {
	let agent: Doc<"agents">;
	try {
		agent = await requireAgentAuth(ctx, request);
	} catch {
		return errorResponse("Unauthorized", 401);
	}

	const pending = await ctx.runQuery(internal.operations.getPendingForAgent, {
		agentId: agent._id,
	});

	return jsonResponse({ operations: pending });
});

// ---------------------------------------------------------------------------
// GET /agent/missions/context?missionId=<id>
// ---------------------------------------------------------------------------
// Returns mission brief + objective + successCriteria + operations summary.
// Agent must have at least one operation in this mission (scope check).
// Output is capped at 500 chars per operation — no sibling full output access.

export const getMissionContext = httpAction(async (ctx, request) => {
	let agent: Doc<"agents">;
	try {
		agent = await requireAgentAuth(ctx, request);
	} catch {
		return errorResponse("Unauthorized", 401);
	}

	const url = new URL(request.url);
	const missionId = url.searchParams.get("missionId");

	if (!missionId) {
		return errorResponse("Missing missionId query parameter", 400);
	}

	// Verify agent has at least one operation in this mission
	const hasAccess = await ctx.runQuery(
		internal.operations.agentHasMissionAccess,
		{
			agentId: agent._id,
			missionId: missionId as Id<"missions">,
		},
	);

	if (!hasAccess) {
		return errorResponse(
			"Forbidden — agent has no operations in this mission",
			403,
		);
	}

	const mission = await ctx.runQuery(internal.missions.getById, {
		missionId: missionId as Id<"missions">,
	});

	if (!mission) {
		return errorResponse("Mission not found", 404);
	}

	const operations = await ctx.runQuery(
		internal.operations.getMissionContextOps,
		{ missionId: missionId as Id<"missions"> },
	);

	return jsonResponse({
		mission: {
			id: mission._id,
			name: mission.name,
			brief: mission.brief ?? null,
			objective: mission.objective ?? null,
			successCriteria: mission.successCriteria ?? null,
			status: mission.status,
			progress: mission.progress ?? 0,
		},
		operations,
	});
});
