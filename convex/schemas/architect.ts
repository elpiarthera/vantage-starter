// convex/schemas/architect.ts
// Ported from vantage-studio. No auth fields — pure validators.
import { v } from "convex/values";

// Operation Proposal Validator (matches lib/architect/schemas.ts OperationProposalSchema)
export const operationProposalValidator = v.object({
	id: v.string(), // Temp ID (e.g. "op-1") — resolved to real Id<"operations"> in commitPlan
	name: v.string(),
	description: v.optional(v.string()),
	type: v.union(v.literal("ai"), v.literal("human")),
	assignedAgentId: v.optional(v.string()), // String here, cast to Id<"agents"> in mutation
	dependsOn: v.optional(v.array(v.string())), // Temp IDs, resolved in two-pass insert
	estimatedMinutes: v.optional(v.number()),
	prompt: v.optional(v.string()),
	requiredTools: v.optional(v.array(v.string())),
	requiresReview: v.optional(v.boolean()),
});

// Checkpoint Proposal Validator
export const checkpointProposalValidator = v.object({
	afterOperationId: v.string(), // Temp operation ID — resolved via idMap in commitPlan
	description: v.string(),
});

// Mission Proposal Validator
export const missionProposalValidator = v.object({
	name: v.string(),
	brief: v.string(),
	objective: v.string(),
	intent: v.optional(v.string()),
	structure: v.optional(v.string()),
	operations: v.array(operationProposalValidator),
	checkpoints: v.optional(v.array(checkpointProposalValidator)),
	successCriteria: v.array(v.string()),
	estimatedTimeline: v.string(),
});
