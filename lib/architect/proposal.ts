/**
 * Pure extraction/filtering helpers for an Architect-generated mission
 * proposal (`MissionProposal` json-render spec). Split out of
 * `chat-interface.tsx` so the extraction and per-operation filtering logic
 * can be unit-tested without mounting the chat UI or the json-render
 * `Renderer`.
 */

import type { Spec } from "@json-render/core";

export interface ProposalOperation {
	id: string;
	name: string;
	description?: string;
	type: "ai" | "human";
	assignedAgentId?: string;
	estimatedMinutes?: number;
	dependsOn?: string[];
	requiresReview?: boolean;
	requiredTools?: string[];
}

export interface ProposalCheckpoint {
	afterOperationId: string;
	description: string;
}

export interface ExtractedProposal {
	name: string;
	brief: string;
	objective: string;
	estimatedTimeline: string;
	successCriteria: string[];
	intent: "delivery";
	structure: "linear";
	operations: ProposalOperation[];
	checkpoints: ProposalCheckpoint[];
}

/**
 * Extracts a typed proposal (name/brief/operations/checkpoints) from the
 * raw json-render `Spec` streamed by the Architect agent. Returns `null`
 * when the spec does not carry a `MissionProposal` root (e.g. still
 * streaming, or a non-plan assistant reply).
 */
export function extractProposalFromSpec(
	spec: Spec | null | undefined,
): ExtractedProposal | null {
	if (!spec?.elements) return null;

	const rootId = spec.root;
	if (!rootId) return null;

	const root = spec.elements[rootId as string];
	if (!root || root.type !== "MissionProposal") return null;

	const ops: ProposalOperation[] = [];
	const checkpoints: ProposalCheckpoint[] = [];

	for (const childId of root.children ?? []) {
		const child = spec.elements[childId as string];
		if (!child) continue;

		const cp = child.props as Record<string, unknown>;

		if (child.type === "OperationItem") {
			const rawType = String(cp.type ?? "ai");
			ops.push({
				id: String(cp.id ?? childId),
				name: String(cp.name ?? ""),
				description:
					cp.description !== undefined ? String(cp.description) : undefined,
				type: rawType === "human" ? "human" : "ai",
				assignedAgentId:
					cp.assignedAgentId !== undefined
						? String(cp.assignedAgentId)
						: undefined,
				estimatedMinutes:
					typeof cp.estimatedMinutes === "number"
						? cp.estimatedMinutes
						: undefined,
				dependsOn: Array.isArray(cp.dependsOn)
					? (cp.dependsOn as unknown[]).map(String)
					: undefined,
				requiresReview:
					typeof cp.requiresReview === "boolean"
						? cp.requiresReview
						: undefined,
				requiredTools: Array.isArray(cp.requiredTools)
					? (cp.requiredTools as unknown[]).map(String)
					: undefined,
			});
		} else if (child.type === "Checkpoint") {
			checkpoints.push({
				afterOperationId: String(cp.afterOperationId ?? ""),
				description: String(cp.description ?? ""),
			});
		}
	}

	const p = root.props as Record<string, unknown>;
	return {
		name: String(p.name ?? ""),
		brief: String(p.brief ?? ""),
		objective: String(p.objective ?? ""),
		estimatedTimeline: String(p.estimatedTimeline ?? ""),
		successCriteria: Array.isArray(p.successCriteria)
			? (p.successCriteria as string[])
			: [],
		intent: "delivery",
		structure: "linear",
		operations: ops,
		checkpoints,
	};
}

/**
 * Returns a new proposal containing only the operations NOT present in
 * `excludedOperationIds`. Checkpoints anchored to a removed operation
 * (`afterOperationId`) are dropped as well — a human checkpoint gate for an
 * operation that will never run cannot be kept.
 */
export function filterProposalOperations(
	proposal: ExtractedProposal,
	excludedOperationIds: ReadonlySet<string>,
): ExtractedProposal {
	if (excludedOperationIds.size === 0) return proposal;

	const keptOperations = proposal.operations.filter(
		(op) => !excludedOperationIds.has(op.id),
	);
	const keptIds = new Set(keptOperations.map((op) => op.id));

	return {
		...proposal,
		operations: keptOperations,
		checkpoints: proposal.checkpoints.filter((cp) =>
			keptIds.has(cp.afterOperationId),
		),
	};
}
