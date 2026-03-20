/**
 * VantageStarter json-render Catalog (v0.14.1 compatible)
 *
 * The `defineCatalog` type signature in v0.14.1 uses an internal `SchemaType<"zod">`
 * marker that conflicts with Zod v4's `ZodObject` type signature.
 * Cast via `as any` to work around this type mismatch — runtime behavior is correct.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react";
import { z } from "zod";

// Zod v4 schemas for catalog component props
const missionProposalProps = z.object({
	name: z.string(),
	brief: z.string(),
	objective: z.string(),
	estimatedTimeline: z.string(),
	successCriteria: z.array(z.string()).optional(),
});

const operationItemProps = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string(),
	type: z.string(),
	assignedAgent: z.string(),
	estimatedMinutes: z.number(),
	phase: z.string().optional(),
	dependsOn: z.array(z.string()).optional(),
	requiredTools: z.array(z.string()).optional(),
	requiresReview: z.boolean().optional(),
});

const checkpointProps = z.object({
	description: z.string(),
	afterOperationId: z.string(),
});

const successCriteriaProps = z.object({
	description: z.string(),
});

const actionButtonProps = z.object({
	label: z.string(),
	action: z.string(),
	variant: z.string().optional(),
});

// Cast to any to work around Zod v4 <-> @json-render/core v0.14.1 type mismatch
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const vantageOSCatalog = defineCatalog(schema, {
	components: {
		MissionProposal: {
			description:
				"Root component for a complete mission plan with operations and checkpoints",
			props: missionProposalProps as any,
		},
		OperationItem: {
			description:
				"A single operation/task within a mission (AI or human-executed)",
			props: operationItemProps as any,
		},
		Checkpoint: {
			description: "Human approval gate between operations",
			props: checkpointProps as any,
		},
		SuccessCriteria: {
			description: "A measurable success criterion for the mission",
			props: successCriteriaProps as any,
		},
		ActionButton: {
			description: "Clickable button for user actions",
			props: actionButtonProps as any,
		},
	},
} as any);
