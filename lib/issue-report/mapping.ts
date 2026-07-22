/**
 * Declared data for the public `/report` page (mcpcn `issue-report-form`
 * block, docs/mcpcn-block-mapping.md §4 "issue-report-form", Batch 4).
 *
 * `.claude/rules/derive-never-type.md`: the urgency -> priority and
 * category -> assignee mappings are DATA, written once, here — never a
 * chain of `if`/`switch` branches discovered at call time. Both
 * `convex/issueReports.ts` (the runtime path) and
 * `__tests__/convex/issueReports.test.ts` (the TDD assertion) import this
 * exact module, so the test can never drift from what the code actually
 * ships — a test that hand-typed its own copy of this table could pass
 * while the shipped mapping silently diverged from it.
 */

/**
 * Urgency values match `components/ui/issue-report-form.tsx`'s
 * `DEFAULT_ISSUE_FORM.urgencies` (`value` field) — "immediate" is the most
 * urgent, "no-rush" the least.
 */
export const URGENCY_TO_PRIORITY = {
	immediate: "urgent",
	today: "high",
	"this-week": "medium",
	"no-rush": "low",
} as const;

export type Urgency = keyof typeof URGENCY_TO_PRIORITY;
export type Priority = (typeof URGENCY_TO_PRIORITY)[Urgency];

/**
 * Category keys match `components/ui/issue-report-form.tsx`'s
 * `DEFAULT_ISSUE_FORM.categories` top-level keys. Assignee values are
 * orchestrator/specialist roles this repo already routes work to (see
 * `CLAUDE.md` "Agent Routing" table) — reused here rather than invented,
 * so a triaged report lands with an owner this repo already recognizes.
 */
export const CATEGORY_TO_ASSIGNEE = {
	Access: "dev-clerk-expert",
	Hardware: "dev-senior-dev",
	Network: "dev-senior-dev",
	Software: "dev-frontend",
} as const;

export type Category = keyof typeof CATEGORY_TO_ASSIGNEE;
export type Assignee = (typeof CATEGORY_TO_ASSIGNEE)[Category];

export function priorityForUrgency(urgency: string): Priority {
	const priority = (URGENCY_TO_PRIORITY as Record<string, Priority>)[urgency];
	if (!priority) {
		throw new Error(
			`Unknown urgency value: "${urgency}" — not present in URGENCY_TO_PRIORITY`,
		);
	}
	return priority;
}

export function assigneeForCategory(category: string): Assignee {
	const assignee = (CATEGORY_TO_ASSIGNEE as Record<string, Assignee>)[category];
	if (!assignee) {
		throw new Error(
			`Unknown category value: "${category}" — not present in CATEGORY_TO_ASSIGNEE`,
		);
	}
	return assignee;
}
