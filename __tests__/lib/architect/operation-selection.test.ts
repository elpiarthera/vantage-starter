import { resolveOperationSelection } from "@/lib/architect/operation-selection";

describe("resolveOperationSelection", () => {
	test("RED2 regression guard: no manual exclusion -> nothing excluded", () => {
		const operations = [
			{ id: "op1" },
			{ id: "op2", dependsOn: ["op1"] },
			{ id: "op3" },
		];

		const { excludedIds, blockedIds } = resolveOperationSelection(
			operations,
			new Set(),
		);

		expect(excludedIds.size).toBe(0);
		expect(blockedIds.size).toBe(0);
	});

	test("RED1: manually excluding a standalone operation excludes only itself", () => {
		const operations = [{ id: "op1" }, { id: "op2" }, { id: "op3" }];

		const { excludedIds, blockedIds } = resolveOperationSelection(
			operations,
			new Set(["op2"]),
		);

		expect(excludedIds).toEqual(new Set(["op2"]));
		expect(blockedIds.size).toBe(0);
	});

	test("RED3 dependency-edge decision: excluding op1 cascades to op2 (dependsOn op1) as BLOCKED, not just excluded", () => {
		const operations = [
			{ id: "op1" },
			{ id: "op2", dependsOn: ["op1"] },
			{ id: "op3" },
		];

		const { excludedIds, blockedIds } = resolveOperationSelection(
			operations,
			new Set(["op1"]),
		);

		expect(excludedIds).toEqual(new Set(["op1", "op2"]));
		// op2 was not manually unchecked by the user — it is cascade-blocked
		// and cannot be re-checked until op1 is re-checked first.
		expect(blockedIds).toEqual(new Set(["op2"]));
	});

	test("RED3b: cascade is transitive across multiple dependency hops", () => {
		const operations = [
			{ id: "op1" },
			{ id: "op2", dependsOn: ["op1"] },
			{ id: "op3", dependsOn: ["op2"] },
		];

		const { excludedIds, blockedIds } = resolveOperationSelection(
			operations,
			new Set(["op1"]),
		);

		expect(excludedIds).toEqual(new Set(["op1", "op2", "op3"]));
		expect(blockedIds).toEqual(new Set(["op2", "op3"]));
	});

	test("re-checking the upstream dependency lifts the cascade for downstream operations", () => {
		const operations = [{ id: "op1" }, { id: "op2", dependsOn: ["op1"] }];

		// op1 re-included (manuallyExcludedIds no longer contains it).
		const { excludedIds, blockedIds } = resolveOperationSelection(
			operations,
			new Set(),
		);

		expect(excludedIds.size).toBe(0);
		expect(blockedIds.size).toBe(0);
	});
});
