/**
 * Cascade resolution for per-operation plan approval (Architect "confirm
 * plan" screen — see chat-interface.tsx).
 *
 * DEPENDENCY-EDGE DECISION: unchecking an operation CASCADES to every
 * operation that (transitively) depends on it. A mission cannot run
 * operation B if operation A, which B `dependsOn`, was never created —
 * silently keeping B selected would create a mission with a dangling
 * dependency reference. The alternative of *preventing* the uncheck of a
 * relied-upon operation was rejected: it would force the user to hunt down
 * every dependent before being able to remove the one operation they
 * actually want out. Cascading is the reversible, discoverable choice: the
 * user immediately sees which operations were auto-excluded (`blockedIds`)
 * and cannot manually re-include them until they first re-include the
 * upstream dependency — so the graph can never end up inconsistent.
 */

export interface SelectableOperation {
	id: string;
	dependsOn?: string[];
}

export interface OperationSelectionResult {
	/** All operations excluded from the final proposal (manual + cascaded). */
	excludedIds: Set<string>;
	/**
	 * Operations excluded ONLY as a cascade consequence — the user did not
	 * uncheck these directly and cannot re-check them until the dependency
	 * they cascaded from is re-checked first.
	 */
	blockedIds: Set<string>;
}

/**
 * Resolves the effective excluded-operation set given the user's manual
 * unchecks, expanding it to a fixed point over the dependency graph: any
 * operation whose `dependsOn` includes an excluded operation is excluded
 * too, transitively.
 */
export function resolveOperationSelection(
	operations: readonly SelectableOperation[],
	manuallyExcludedIds: ReadonlySet<string>,
): OperationSelectionResult {
	const excludedIds = new Set(manuallyExcludedIds);

	let changed = true;
	while (changed) {
		changed = false;
		for (const op of operations) {
			if (excludedIds.has(op.id)) continue;
			const deps = op.dependsOn ?? [];
			if (deps.some((depId) => excludedIds.has(depId))) {
				excludedIds.add(op.id);
				changed = true;
			}
		}
	}

	const blockedIds = new Set<string>();
	for (const id of excludedIds) {
		if (!manuallyExcludedIds.has(id)) {
			blockedIds.add(id);
		}
	}

	return { excludedIds, blockedIds };
}
