/**
 * `lib/issue-report/mapping.ts` — the declared urgency -> priority and
 * category -> assignee tables backing `convex/issueReports.ts` (mcpcn
 * `issue-report-form` block, docs/mcpcn-block-mapping.md §4).
 *
 * This suite reads the SAME exported table the runtime code reads
 * (`URGENCY_TO_PRIORITY`, `CATEGORY_TO_ASSIGNEE`) — it never hand-types a
 * parallel copy, so a change to the mapping can never silently diverge from
 * what this test asserts.
 */
import { describe, expect, it } from "vitest";
import {
	assigneeForCategory,
	CATEGORY_TO_ASSIGNEE,
	priorityForUrgency,
	URGENCY_TO_PRIORITY,
} from "../../lib/issue-report/mapping";

describe("priorityForUrgency", () => {
	it("RED: reads the declared priority for every declared urgency, from the table itself", () => {
		for (const [urgency, expectedPriority] of Object.entries(
			URGENCY_TO_PRIORITY,
		)) {
			expect(priorityForUrgency(urgency)).toBe(expectedPriority);
		}
	});

	it("the most urgent value maps to the highest declared priority", () => {
		expect(priorityForUrgency("immediate")).toBe("urgent");
	});

	it("throws, naming the unknown value, for an urgency outside the declared table", () => {
		expect(() => priorityForUrgency("whenever-i-feel-like-it")).toThrow(
			/whenever-i-feel-like-it/,
		);
	});
});

describe("assigneeForCategory", () => {
	it("RED: reads the declared assignee for every declared category, from the table itself", () => {
		for (const [category, expectedAssignee] of Object.entries(
			CATEGORY_TO_ASSIGNEE,
		)) {
			expect(assigneeForCategory(category)).toBe(expectedAssignee);
		}
	});

	it("throws, naming the unknown value, for a category outside the declared table", () => {
		expect(() => assigneeForCategory("Quantum Networking")).toThrow(
			/Quantum Networking/,
		);
	});
});
