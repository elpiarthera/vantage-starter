/**
 * `events` — public `/events` browse page and `/events/[slug]` detail +
 * registration page (mcpcn `event-card` / `event-list` / `event-detail` /
 * `event-confirmation` blocks, docs/mcpcn-block-mapping.md §4 "Events",
 * Batch 4 fourth bullet).
 *
 * `list` and `getBySlug` are PUBLIC AND UNAUTHENTICATED — browsing events is
 * the whole point of a public listing page, same reasoning `middleware.ts`
 * already applies to `/contact`.
 *
 * `register` REQUIRES SIGN-IN. Unlike `contactSubmissions.create` and
 * `issueReports.submit` (deliberately anonymous, one-shot forms),
 * registering for an event is a standing record tied to one identity, and
 * the duplicate-registration decision below (REFUSED, not idempotent, not
 * allowed) is only meaningful against a stable identifier — this repo
 * already made the same call for the other identity-bound write in this
 * batch, `date-time-picker`'s booking page
 * (`app/[locale]/dashboard/consultant/book/page.tsx`, authenticated). A
 * signed-out visitor can browse `/events` and `/events/[slug]` freely; only
 * the registration write itself requires `ctx.auth.getUserIdentity()` to
 * return non-null, exactly like `convex/files.ts`'s upload-URL mutations
 * gate on identity for a write, not a read.
 *
 * DUPLICATE REGISTRATION — DECIDED, WRITTEN DOWN, NOT SILENT: refused. A
 * second `register` call for an event the caller is already registered for
 * throws `ConvexError("You are already registered for this event.")` before
 * either the capacity check or any write runs (`by_event_and_user` lookup,
 * below). Idempotent-success or allow-multiple were both considered and
 * rejected: an event seat is a single, named commitment, and silently
 * letting one identity hold two of a capacity-bounded resource is the
 * wrong default for a feature whose entire risk (per this bullet's brief)
 * is capacity.
 *
 * CAPACITY — THE GUARANTEE, NAMED RATHER THAN ASSUMED. `register` reads
 * `events.registeredCount` and, in the SAME mutation invocation, either
 * inserts the `eventRegistrations` row and patches `registeredCount + 1`,
 * or throws without writing anything. The property this relies on is
 * Convex's transactional optimistic concurrency control (OCC) over a
 * mutation's read/write set: a Convex mutation runs to completion as one
 * atomic, serializable transaction, and if two concurrent `register` calls
 * for the SAME event both read the same `registeredCount` value, only one
 * of their transactions can commit — the other's write set conflicts with
 * the first's, so Convex retries it automatically, and the retry re-reads
 * the now-incremented `registeredCount` before deciding again. There is no
 * window in which two callers can both observe capacity available and both
 * write past it: the read-then-write is one transaction, not two separate
 * calls (`ctx.runQuery` then `ctx.runMutation`), which is exactly the
 * "splitting logic up... introduces the risk of race conditions" case
 * `convex/_generated/ai/guidelines.md` warns against — this mutation
 * deliberately does the read and the write inside the one function body it
 * already has, never across two.
 *
 * `registeredCount` is a denormalized counter (see `convex/schema.ts`
 * header) precisely because `.collect().length` on `eventRegistrations` is
 * banned by the same guidelines file and would not compose with the
 * single-transaction guarantee above anyway — a recount at read time is a
 * second read against a table that keeps growing, not a value already
 * inside the one document this mutation locks.
 *
 * PUBLIC SURFACE, WHAT PROTECTS IT (register only — list/getBySlug are
 * read-only and carry no write risk):
 *  1. Auth required — `ctx.auth.getUserIdentity()` must be non-null, or the
 *     mutation throws before touching the database.
 *  2. Capacity bound — enforced atomically as described above; an
 *     over-capacity request is refused with a named error, nothing written.
 *  3. Duplicate bound — one registration per (event, identity) pair,
 *     enforced via `by_event_and_user` before capacity is even checked.
 *  4. `eventId` is validated as a real `events` row before either check
 *     runs (`ctx.db.get` returning `null` throws a named "Event not found"
 *     error) — an invalid or deleted id can never reach the capacity/
 *     duplicate logic.
 *
 * NOT covered: no rate limit on `register` itself, unlike
 * `contactSubmissions.create` / `issueReports.submit`. This is a smaller
 * gap than it looks — the identity + duplicate check already bounds one
 * signed-in user to one registration per event, so the only residual risk
 * is an authenticated identity registering for MANY DIFFERENT events in a
 * tight loop, which is bounded by Clerk's own session/rate posture, not by
 * this file. Named here rather than left to be rediscovered.
 */

import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
	args: {},
	returns: v.array(
		v.object({
			_id: v.id("events"),
			slug: v.string(),
			title: v.string(),
			description: v.string(),
			startDateTime: v.string(),
			timezone: v.string(),
			capacity: v.number(),
			registeredCount: v.number(),
		}),
	),
	handler: async (ctx) => {
		const events = await ctx.db.query("events").order("desc").take(50);
		return events.map((event) => ({
			_id: event._id,
			slug: event.slug,
			title: event.title,
			description: event.description,
			startDateTime: event.startDateTime,
			timezone: event.timezone,
			capacity: event.capacity,
			registeredCount: event.registeredCount,
		}));
	},
});

export const getBySlug = query({
	args: { slug: v.string() },
	returns: v.union(
		v.object({
			_id: v.id("events"),
			slug: v.string(),
			title: v.string(),
			description: v.string(),
			agenda: v.array(v.string()),
			startDateTime: v.string(),
			timezone: v.string(),
			capacity: v.number(),
			registeredCount: v.number(),
		}),
		v.null(),
	),
	handler: async (ctx, args) => {
		const event = await ctx.db
			.query("events")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.unique();
		if (!event) {
			return null;
		}
		return {
			_id: event._id,
			slug: event.slug,
			title: event.title,
			description: event.description,
			agenda: event.agenda,
			startDateTime: event.startDateTime,
			timezone: event.timezone,
			capacity: event.capacity,
			registeredCount: event.registeredCount,
		};
	},
});

export const register = mutation({
	args: { eventId: v.id("events") },
	returns: v.object({
		success: v.literal(true),
		registrationId: v.id("eventRegistrations"),
	}),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError("Sign in to register for this event.");
		}

		const event = await ctx.db.get(args.eventId);
		if (!event) {
			throw new ConvexError("Event not found.");
		}

		// Duplicate check BEFORE the capacity check, and before any write —
		// decided and written above: refused, not idempotent, not allowed.
		const existing = await ctx.db
			.query("eventRegistrations")
			.withIndex("by_event_and_user", (q) =>
				q.eq("eventId", args.eventId).eq("clerkUserId", identity.subject),
			)
			.unique();
		if (existing) {
			throw new ConvexError("You are already registered for this event.");
		}

		// Capacity check + write happen in this SAME mutation transaction —
		// see this file's header for why that single-transaction shape is
		// exactly what makes the concurrency guarantee hold.
		if (event.registeredCount >= event.capacity) {
			throw new ConvexError("This event is full.");
		}

		const registrationId = await ctx.db.insert("eventRegistrations", {
			eventId: args.eventId,
			clerkUserId: identity.subject,
			registeredAt: Date.now(),
		});

		await ctx.db.patch(args.eventId, {
			registeredCount: event.registeredCount + 1,
		});

		return { success: true as const, registrationId };
	},
});
