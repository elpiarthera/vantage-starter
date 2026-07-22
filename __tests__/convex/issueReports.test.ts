/// <reference types="vite/client" />
/**
 * `issueReports.submit` — Batch 4 (mcpcn `issue-report-form` block),
 * docs/mcpcn-block-mapping.md §4 "issue-report-form" entry.
 *
 * TDD assertion required by the bullet, taken as written: "submitting the
 * form calls `create_task` exactly once with a priority value that matches
 * the block's urgency field via the declared mapping (e.g. "critical" ->
 * "urgent"), and the resulting task's `assignedTo` matches the category
 * selected in the form."
 *
 * The declared mapping lives in `lib/issue-report/mapping.ts` — this file
 * imports it directly rather than hand-typing its own copy, so the
 * assertion can never drift from what `convex/issueReports.ts` actually
 * ships.
 */

import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../convex/_generated/api";
import schema from "../../convex/schema";
import {
	CATEGORY_TO_ASSIGNEE,
	URGENCY_TO_PRIORITY,
} from "../../lib/issue-report/mapping";
// No public subpath export for the ratelimiter component's internal schema —
// same pattern as __tests__/convex/contactSubmissions.test.ts.
import ratelimiterSchema from "../../node_modules/@convex-dev/ratelimiter/dist/esm/component/schema.js";

const modules = import.meta.glob([
	"../../convex/**/*.ts",
	"../../convex/**/*.js",
	"!../../convex/**/*.d.ts",
]);

const ratelimiterModules = import.meta.glob(
	"../../node_modules/@convex-dev/ratelimiter/dist/esm/component/**/*.js",
);

function makeT() {
	const t = convexTest(schema, modules);
	t.registerComponent("ratelimiter", ratelimiterSchema, ratelimiterModules);
	return t;
}

const VALID_ARGS = {
	name: "Ada Lovelace",
	email: "ada@example.com",
	category: "Software",
	subcategory: "Browser",
	issueTitle: "Login button does nothing",
	description: "Clicking Sign In produces no navigation and no error.",
	urgency: "immediate",
};

describe("issueReports.submit", () => {
	let t: ReturnType<typeof makeT>;
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		t = makeT();
		vi.stubEnv("VANTAGE_PEERS_TASK_URL", "https://peers.example/create_task");
		vi.stubEnv("VANTAGE_PEERS_API_KEY", "test-key");
		fetchMock = vi.fn(
			async () =>
				new Response(JSON.stringify({ taskId: "task_123" }), { status: 200 }),
		);
		vi.stubGlobal("fetch", fetchMock);
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		vi.unstubAllGlobals();
	});

	it("RED 1: calls create_task EXACTLY ONCE with the priority the declared mapping gives for the submitted urgency", async () => {
		const result = await t.action(api.issueReports.submit, VALID_ARGS);

		expect(result.delivered).toBe(true);
		expect(fetchMock).toHaveBeenCalledTimes(1);

		const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
		const body = JSON.parse(requestInit.body as string);
		expect(body.priority).toBe(
			URGENCY_TO_PRIORITY[
				VALID_ARGS.urgency as keyof typeof URGENCY_TO_PRIORITY
			],
		);
		expect(body.priority).toBe("urgent");
	});

	it("RED 2: the resulting task's assignedTo matches the category selected in the form, via the declared mapping", async () => {
		await t.action(api.issueReports.submit, VALID_ARGS);

		const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
		const body = JSON.parse(requestInit.body as string);
		expect(body.assignedTo).toBe(
			CATEGORY_TO_ASSIGNEE[
				VALID_ARGS.category as keyof typeof CATEGORY_TO_ASSIGNEE
			],
		);
		expect(body.assignedTo).toBe("dev-frontend");
	});

	it("every declared urgency maps to its own declared priority, read from the same table the action uses", async () => {
		let i = 0;
		for (const [urgency, expectedPriority] of Object.entries(
			URGENCY_TO_PRIORITY,
		)) {
			fetchMock.mockClear();
			// Distinct email per iteration: the per-email rate limit (3/min) is
			// keyed on the submitted email, and this loop otherwise reuses
			// VALID_ARGS.email across all 4 declared urgencies in one test.
			await t.action(api.issueReports.submit, {
				...VALID_ARGS,
				email: `urgency-${i}@example.com`,
				urgency,
			});
			i++;
			const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
			const body = JSON.parse(requestInit.body as string);
			expect(body.priority).toBe(expectedPriority);
		}
	});

	it("rejects an unknown urgency value before ever calling create_task", async () => {
		await expect(
			t.action(api.issueReports.submit, {
				...VALID_ARGS,
				urgency: "whenever-i-feel-like-it",
			}),
		).rejects.toThrow(/urgency/i);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("does not require authentication (public-by-design)", async () => {
		const result = await t.action(api.issueReports.submit, VALID_ARGS);
		expect(result.delivered).toBe(true);
	});

	it("rejects an invalid email and never calls create_task", async () => {
		await expect(
			t.action(api.issueReports.submit, {
				...VALID_ARGS,
				email: "not-an-email",
			}),
		).rejects.toThrow(/email/i);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("STATED CONDITION: when VantagePeers is not configured, returns delivered:false with a named reason instead of silently no-oping", async () => {
		vi.unstubAllEnvs();
		const result = await t.action(api.issueReports.submit, VALID_ARGS);
		expect(result.delivered).toBe(false);
		expect(result.configured).toBe(false);
		if (!result.configured) {
			expect(result.reason).toMatch(/not configured/i);
		}
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("rate-limits repeated submissions from the same email and stops calling create_task past the limit", async () => {
		for (let i = 0; i < 3; i++) {
			await t.action(api.issueReports.submit, VALID_ARGS);
		}
		await expect(t.action(api.issueReports.submit, VALID_ARGS)).rejects.toThrow(
			/rate limit/i,
		);
		expect(fetchMock).toHaveBeenCalledTimes(3);
	});
});
