/// <reference types="vite/client" />
/**
 * `events.register` — Batch 4 fourth bullet (mcpcn `event-card` /
 * `event-list` / `event-detail` / `event-confirmation` blocks),
 * docs/mcpcn-block-mapping.md §4 "Events".
 *
 * THE BULLET'S ASSERTION, taken as written, not reformulated: "registering
 * for an event from `event-detail` inserts exactly one `eventRegistrations`
 * row, and `event-confirmation` renders only when that insert has
 * succeeded." The Convex-side half of that assertion is
 * `exactly_one_row_inserted_on_success` below; the render-only-on-success
 * half is enforced client-side because `register` throws (never returns a
 * falsy success) on every rejection path, and
 * `components/events/EventDetailSection.tsx` renders `EventConfirmation`
 * only inside the `try` block's success branch, never in `catch` — see
 * that file.
 *
 * MUTATION PROOF for the capacity guarantee lives in this same file
 * (`capacity_is_enforced...` describes the RED/GREEN pair; the actual
 * neutralize-grep-confirm-restore sequence is run from the shell and
 * pasted in the PR body, not re-implemented here as a second test file).
 */

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
import schema from "../../convex/schema";

const modules = import.meta.glob([
	"../../convex/**/*.ts",
	"../../convex/**/*.js",
	"!../../convex/**/*.d.ts",
]);

function makeT() {
	return convexTest(schema, modules);
}

async function seedEvent(
	t: ReturnType<typeof makeT>,
	overrides: Partial<{ capacity: number; registeredCount: number }> = {},
) {
	return await t.run(async (ctx) => {
		return await ctx.db.insert("events", {
			slug: "underground-techno-night",
			title: "Underground Techno Night",
			description: "Raw, unfiltered techno in a warehouse setting.",
			agenda: ["Doors 7pm", "Opening set 8pm", "Headliner 10pm"],
			startDateTime: "2026-08-01T22:00:00-04:00",
			timezone: "America/New_York",
			capacity: overrides.capacity ?? 2,
			registeredCount: overrides.registeredCount ?? 0,
			createdAt: Date.now(),
		});
	});
}

describe("events.register", () => {
	it("rejects an unauthenticated caller before any write", async () => {
		const t = makeT();
		const eventId = await seedEvent(t);

		await expect(t.mutation(api.events.register, { eventId })).rejects.toThrow(
			/sign in/i,
		);

		const registrations = await t.run(
			async (ctx) => await ctx.db.query("eventRegistrations").collect(),
		);
		expect(registrations).toHaveLength(0);
	});

	it("exactly_one_row_inserted_on_success — the bullet's assertion", async () => {
		const t = makeT();
		const eventId = await seedEvent(t, { capacity: 5 });
		const asAlice = t.withIdentity({ subject: "user_alice" });

		const result = await asAlice.mutation(api.events.register, { eventId });
		expect(result.success).toBe(true);

		const registrations = await t.run(
			async (ctx) => await ctx.db.query("eventRegistrations").collect(),
		);
		expect(registrations).toHaveLength(1);
		expect(registrations[0]?.clerkUserId).toBe("user_alice");
		expect(registrations[0]?.eventId).toBe(eventId);
	});

	it("refuses a second registration from the same identity — decided: refused, not idempotent", async () => {
		const t = makeT();
		const eventId = await seedEvent(t, { capacity: 5 });
		const asAlice = t.withIdentity({ subject: "user_alice" });

		await asAlice.mutation(api.events.register, { eventId });

		await expect(
			asAlice.mutation(api.events.register, { eventId }),
		).rejects.toThrow(/already registered/i);

		const registrations = await t.run(
			async (ctx) =>
				await ctx.db
					.query("eventRegistrations")
					.withIndex("by_event", (q) => q.eq("eventId", eventId))
					.collect(),
		);
		expect(registrations).toHaveLength(1);
	});

	it("capacity_is_enforced — registers up to capacity, refuses the next with nothing written", async () => {
		const t = makeT();
		const eventId = await seedEvent(t, { capacity: 2 });

		await t
			.withIdentity({ subject: "user_a" })
			.mutation(api.events.register, { eventId });
		await t
			.withIdentity({ subject: "user_b" })
			.mutation(api.events.register, { eventId });

		await expect(
			t
				.withIdentity({ subject: "user_c" })
				.mutation(api.events.register, { eventId }),
		).rejects.toThrow(/full/i);

		const registrations = await t.run(
			async (ctx) =>
				await ctx.db
					.query("eventRegistrations")
					.withIndex("by_event", (q) => q.eq("eventId", eventId))
					.collect(),
		);
		// Exactly capacity's worth of rows — the refused third registration
		// wrote nothing at all, not a row later cleaned up.
		expect(registrations).toHaveLength(2);
		expect(registrations.map((r) => r.clerkUserId).sort()).toEqual([
			"user_a",
			"user_b",
		]);

		const event = await t.run(async (ctx) => await ctx.db.get(eventId));
		expect(event?.registeredCount).toBe(2);
	});

	it("rejects an eventId that does not exist, before any capacity/duplicate logic runs", async () => {
		const t = makeT();
		const eventId = await seedEvent(t);
		await t.run(async (ctx) => await ctx.db.delete(eventId));

		await expect(
			t
				.withIdentity({ subject: "user_alice" })
				.mutation(api.events.register, { eventId }),
		).rejects.toThrow(/not found/i);
	});
});

describe("events.list / events.getBySlug", () => {
	it("list returns seeded events without requiring auth", async () => {
		const t = makeT();
		await seedEvent(t);

		const events = await t.query(api.events.list, {});
		expect(events).toHaveLength(1);
		expect(events[0]?.slug).toBe("underground-techno-night");
	});

	it("getBySlug returns null for an unknown slug rather than throwing", async () => {
		const t = makeT();
		const result = await t.query(api.events.getBySlug, {
			slug: "does-not-exist",
		});
		expect(result).toBeNull();
	});
});
