/**
 * `issueReports.submit` — public `/report` page (mcpcn `issue-report-form`
 * block, docs/mcpcn-block-mapping.md §4 "issue-report-form", Batch 4).
 *
 * What this replaces: a PROCESS, not a file — today a client messages
 * Laurent, who manually creates a task. This action turns a public
 * submission directly into a VantagePeers task, with zero manual re-typing.
 *
 * No new Convex table: the task itself is stored by VantagePeers, not here
 * (docs/mcpcn-block-mapping.md §4 says so explicitly). This is an `action`,
 * not a `mutation`, because it performs an outbound network call
 * (`fetch`) — mutations cannot do that in Convex.
 *
 * THE OUTBOUND CALL, DECIDED AND WRITTEN DOWN: VantagePeers' `create_task`
 * lives behind an MCP server this repo has no route to at runtime — no env
 * var, no client, no credential exists anywhere in this codebase today
 * (verified: `grep -ril "vantage-peers\|VANTAGE_PEERS"` across the repo
 * returns nothing outside this file and its docs). A boilerplate every fork
 * inherits must not require credentials to a private coordination system
 * for its OWN page to work, so this call is OPTIONAL and CONFIGURABLE via
 * `VANTAGE_PEERS_TASK_URL` + `VANTAGE_PEERS_API_KEY` (see `convex.json`/
 * deployment env). When unset, the honest answer is stated as a CONDITION
 * in the returned value (`configured: false`, with a `reason` string) —
 * never a silent no-op that pretends the report was filed. The submitter
 * sees this reflected by `components/report/IssueReportFormSection.tsx`.
 *
 * PUBLIC AND UNAUTHENTICATED BY DESIGN, same defense-in-depth as
 * `convex/contactSubmissions.ts`:
 *  1. Server-side validation on every required field (name, email, issue
 *     title, description, category, urgency) — never trusts the client
 *     gate alone.
 *  2. Two rate limits from `convex/ratelimit.ts`: 3/min keyed on the
 *     submitted email, plus a 30/min GLOBAL bucket shared across every
 *     caller regardless of email, same pattern as `contactSubmissions`.
 *  3. No attachment BINARY is accepted here — this action's args carry no
 *     `File`/blob field at all, only string fields, so it cannot become an
 *     unauthenticated blob-storage write endpoint (same declared scope
 *     decision as `contactSubmissions.create`).
 *
 * NOT covered: a distributed attacker rotating the submitted email on every
 * request stays under the 30/min global bucket. Closing that fully needs a
 * CAPTCHA or similar challenge — a product decision out of scope for this
 * delivery, named here rather than left to be rediscovered.
 *
 * THE PRIORITY AND ASSIGNEE MAPPINGS ARE DECLARED DATA, never a chain of
 * conditionals discovered here — both are imported from
 * `lib/issue-report/mapping.ts`, the single declaration this action and its
 * test (`__tests__/convex/issueReports.test.ts`) both read.
 */

import { ConvexError, v } from "convex/values";
import {
	assigneeForCategory,
	priorityForUrgency,
} from "../lib/issue-report/mapping";
import { isValidEmail } from "../lib/validation/email";
import { action } from "./_generated/server";
import { rateLimiter } from "./ratelimit";

export const submit = action({
	args: {
		name: v.string(),
		email: v.string(),
		category: v.string(),
		subcategory: v.optional(v.string()),
		issueTitle: v.string(),
		description: v.string(),
		urgency: v.string(),
	},
	returns: v.union(
		v.object({
			configured: v.literal(true),
			delivered: v.literal(true),
			taskId: v.string(),
		}),
		v.object({
			configured: v.literal(false),
			delivered: v.literal(false),
			reason: v.string(),
		}),
	),
	handler: async (ctx, args) => {
		const name = args.name.trim();
		const email = args.email.trim();
		const issueTitle = args.issueTitle.trim();
		const description = args.description.trim();

		if (name.length === 0) {
			throw new ConvexError("Name is required");
		}
		if (!isValidEmail(email)) {
			throw new ConvexError("A valid email address is required");
		}
		if (issueTitle.length === 0) {
			throw new ConvexError("Issue title is required");
		}
		if (description.length === 0) {
			throw new ConvexError("Description is required");
		}

		// Derived from the declared table — throws a named error for any
		// urgency/category value this form did not itself offer.
		const priority = priorityForUrgency(args.urgency);
		const assignedTo = assigneeForCategory(args.category);

		// Per-email limit first: a caller reusing the same email hits this
		// before ever touching the shared global bucket.
		const perEmail = await rateLimiter.limit(ctx, "createIssueReport", {
			key: email,
		});
		if (!perEmail.ok) {
			throw new ConvexError(
				`Rate limit exceeded. Try again in ${Math.ceil((perEmail.retryAfter ?? 60_000) / 1000)} seconds.`,
			);
		}

		const global = await rateLimiter.limit(ctx, "createIssueReportGlobal", {
			key: "global",
		});
		if (!global.ok) {
			throw new ConvexError(
				`Rate limit exceeded. Try again in ${Math.ceil((global.retryAfter ?? 60_000) / 1000)} seconds.`,
			);
		}

		const url = process.env.VANTAGE_PEERS_TASK_URL;
		const apiKey = process.env.VANTAGE_PEERS_API_KEY;

		// STATED CONDITION, never a silent no-op: an unconfigured deployment
		// (every fresh fork of this boilerplate, out of the box) says so
		// explicitly in the returned value instead of pretending the report
		// reached anyone.
		if (!url || !apiKey) {
			return {
				configured: false as const,
				delivered: false as const,
				reason:
					"VANTAGE_PEERS_TASK_URL / VANTAGE_PEERS_API_KEY not configured on this deployment — the report was validated but no task was created.",
			};
		}

		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				title: issueTitle,
				description: `${description}\n\nReported by: ${name} <${email}>\nCategory: ${args.category}${args.subcategory ? ` / ${args.subcategory}` : ""}`,
				priority,
				assignedTo,
				createdBy: "issue-report-form",
			}),
		});

		if (!response.ok) {
			throw new ConvexError(
				`VantagePeers create_task failed: ${response.status} ${await response.text()}`,
			);
		}

		const body = (await response.json()) as { taskId: string };
		return {
			configured: true as const,
			delivered: true as const,
			taskId: body.taskId,
		};
	},
});
