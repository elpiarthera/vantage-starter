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

/**
 * Computes the next `manuallyExcludedIds` set for a single checkbox toggle.
 * Returns a set EQUAL to (but a new instance of) the input, unchanged, when
 * `id` is currently cascade-blocked — a blocked operation must not be added
 * to or removed from `manuallyExcludedIds` while the dependency it relies
 * on is still excluded, or a later re-check of that dependency could no
 * longer distinguish "was cascaded" from "was manually excluded" and would
 * fail to restore it.
 *
 * Extracted as its own pure function (rather than left inline in
 * `chat-interface.tsx`'s `toggleOperation`) so this guard can be unit
 * tested directly: the `<Checkbox disabled>` UI already prevents a user
 * from ever clicking a blocked row (Base UI's `disabled` primitive
 * swallows the click before `onCheckedChange` fires), which means no
 * click-driven component test can ever exercise this branch — only a
 * direct call to this function can.
 */
export function toggleOperationExclusion(
	operations: readonly SelectableOperation[],
	manuallyExcludedIds: ReadonlySet<string>,
	id: string,
): Set<string> {
	const { blockedIds } = resolveOperationSelection(
		operations,
		manuallyExcludedIds,
	);
	if (blockedIds.has(id)) return new Set(manuallyExcludedIds);

	const next = new Set(manuallyExcludedIds);
	if (next.has(id)) {
		next.delete(id);
	} else {
		next.add(id);
	}
	return next;
}
