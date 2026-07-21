import {
	type ExtractedProposal,
	extractProposalFromSpec,
	filterProposalOperations,
} from "@/lib/architect/proposal";

function buildSpec() {
	return {
		root: "root",
		elements: {
			root: {
				type: "MissionProposal",
				children: ["op1", "op2", "cp1"],
				props: {
					name: "Landing page",
					brief: "Build it",
					objective: "Ship a page",
					estimatedTimeline: "2 days",
					successCriteria: ["Looks good"],
				},
			},
			op1: {
				type: "OperationItem",
				props: { id: "op1", name: "Design", type: "ai" },
			},
			op2: {
				type: "OperationItem",
				props: {
					id: "op2",
					name: "Implement",
					type: "ai",
					dependsOn: ["op1"],
				},
			},
			cp1: {
				type: "Checkpoint",
				props: { afterOperationId: "op2", description: "Review before ship" },
			},
		},
		// biome-ignore lint/suspicious/noExplicitAny: minimal test double for Spec
	} as any;
}

describe("extractProposalFromSpec", () => {
	test("returns null when spec has no MissionProposal root (still streaming)", () => {
		expect(extractProposalFromSpec(null)).toBeNull();
		expect(extractProposalFromSpec(undefined)).toBeNull();
		const specWithoutRootElement = {
			root: "x",
			elements: {},
			// biome-ignore lint/suspicious/noExplicitAny: minimal test double for Spec
		} as any;
		expect(extractProposalFromSpec(specWithoutRootElement)).toBeNull();
	});

	test("extracts operations and checkpoints from a full spec", () => {
		const proposal = extractProposalFromSpec(buildSpec());
		expect(proposal).not.toBeNull();
		expect(proposal?.operations.map((op) => op.id)).toEqual(["op1", "op2"]);
		expect(proposal?.checkpoints).toEqual([
			{ afterOperationId: "op2", description: "Review before ship" },
		]);
	});
});

describe("filterProposalOperations", () => {
	const baseProposal: ExtractedProposal = {
		name: "Landing page",
		brief: "Build it",
		objective: "Ship a page",
		estimatedTimeline: "2 days",
		successCriteria: [],
		intent: "delivery",
		structure: "linear",
		operations: [
			{ id: "op1", name: "Design", type: "ai" },
			{ id: "op2", name: "Implement", type: "ai", dependsOn: ["op1"] },
		],
		checkpoints: [{ afterOperationId: "op2", description: "Review" }],
	};

	test("RED2 regression guard: no exclusions -> proposal unchanged (everything goes)", () => {
		const result = filterProposalOperations(baseProposal, new Set());
		expect(result.operations).toHaveLength(2);
		expect(result.checkpoints).toHaveLength(1);
	});

	test("RED1: an unchecked operation is absent from the filtered proposal", () => {
		const result = filterProposalOperations(baseProposal, new Set(["op2"]));
		expect(result.operations.map((op) => op.id)).toEqual(["op1"]);
	});

	test("a checkpoint anchored to a removed operation is dropped too", () => {
		const result = filterProposalOperations(baseProposal, new Set(["op2"]));
		expect(result.checkpoints).toHaveLength(0);
	});
});
