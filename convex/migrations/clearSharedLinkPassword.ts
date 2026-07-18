import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction, internalMutation } from "../_generated/server";

/**
 * One-time backfill: clear any plaintext `password` value stored on
 * existing `sharedLinks` rows before/around the removal of the `password`
 * field from `convex/schema.ts` (see CHANGELOG.md — "remove decorative
 * share password").
 *
 * WHY THIS EXISTS: removing a field from the schema does NOT delete data
 * already stored on existing documents. A row that still carries a
 * plaintext password after the field is "removed" from the schema is the
 * worst of both worlds — invisible to every reader in this codebase (no
 * function selects it) yet still sitting at rest in the datastore. This
 * migration deletes that residue explicitly instead of leaving it silent.
 *
 * VERIFIED (dev deployment, `secret-parakeet-855`, checked before this file
 * was written): `pnpm exec convex data sharedLinks --limit 100` ->
 * "There are no documents in this table." Zero rows exist in dev today, so
 * this migration is a no-op there. It is shipped anyway for any other
 * deployment (staging/prod, or any fork of this template) that may already
 * have rows with a stored `password` value from before this fix — AT ANY
 * ROW COUNT: see PAGINATION below for what makes that true regardless of
 * table size.
 *
 * PAGINATION: `clearBatch` reads one bounded page at a time via
 * `ctx.db.query(...).paginate(...)` — never an unbounded `.collect()` — so
 * a single mutation invocation never risks Convex's per-query read/mutation
 * limits no matter how many rows the table holds. `run` is the orchestrator:
 * an `internalAction` (no 1-second mutation budget, so it may `await` a
 * loop) that calls `clearBatch` repeatedly, accumulating `scanned`/`cleared`
 * across every page, until `isDone`. `run` also accepts an optional
 * `cursor` argument, so if the action itself is ever interrupted mid-sweep
 * (deploy restart, manual cancel), the operator resumes with
 * `pnpm exec convex run migrations/clearSharedLinkPassword:run '{"cursor": "<last logged cursor>"}'`
 * instead of re-scanning from the start — `clearBatch` is idempotent per
 * page (a page with no `password` fields is a no-op), so resuming from a
 * slightly-stale cursor never double-clears or corrupts data, at worst it
 * re-scans a handful of already-clean rows.
 *
 * IDEMPOTENT: safe to re-run in full. A row with no `password` key is read
 * as `raw.password === undefined` and is skipped (not re-replaced).
 *
 * ROLLBACK: there is no data-preserving rollback. This migration performs a
 * destructive, one-way clear of plaintext secret material — that is the
 * intended outcome (the field never protected anything; see CHANGELOG.md
 * and `convex/sharedLinks.ts`). If a `password` value must be recovered,
 * the only path is an out-of-band backup taken *before* this migration runs
 * (e.g. a Convex point-in-time snapshot/export) — this codebase keeps no
 * copy of the pre-clear values by design, since retaining a copy of a
 * plaintext secret defeats the purpose of clearing it.
 *
 * RUN: `pnpm exec convex run migrations/clearSharedLinkPassword:run`
 * against the target deployment, once, before or immediately after
 * deploying the schema change that drops `password` from `sharedLinks`.
 * Progress (`scanned`/`cleared` running totals and the page cursor) is
 * logged via `console.log` after every page — read it from
 * `pnpm exec convex logs` if the action is long-running.
 *
 * EXISTING IDIOM CHECKED: `rg -n "\.paginate\(" convex/*.ts` before writing
 * this file returned zero real usages in this codebase (`convex/chats.ts`
 * only mentions `paginate()` in an unrelated `@deprecated` comment on a
 * different function). There is no prior paginated-migration pattern to
 * match here — this file follows Convex's own documented
 * page-mutation-plus-orchestrating-action shape instead of inventing a
 * bespoke one.
 */
const BATCH_SIZE = 200;

export const clearBatch = internalMutation({
	args: {
		paginationOpts: paginationOptsValidator,
	},
	returns: v.object({
		scanned: v.number(),
		cleared: v.number(),
		isDone: v.boolean(),
		continueCursor: v.string(),
	}),
	handler: async (ctx, args) => {
		const page = await ctx.db
			.query("sharedLinks")
			.paginate(args.paginationOpts);
		let cleared = 0;

		for (const row of page.page) {
			// `password` no longer exists on the current schema type, so read it
			// off the raw stored document instead of the typed `row`.
			const raw = row as unknown as Record<string, unknown>;
			if (raw.password === undefined) {
				continue;
			}

			// `db.patch` merges by key; there is no supported "unset one field"
			// verb, so the row is fully replaced with everything except
			// `password`. `_id`/`_creationTime` are stripped before the call —
			// `db.replace` rejects them as part of the value argument.
			const { password: _password, _id, _creationTime, ...rest } = raw;
			await ctx.db.replace(row._id, rest as typeof row);
			cleared++;
		}

		return {
			scanned: page.page.length,
			cleared,
			isDone: page.isDone,
			continueCursor: page.continueCursor,
		};
	},
});

export const run = internalAction({
	args: {
		cursor: v.optional(v.string()),
	},
	returns: v.object({
		scanned: v.number(),
		cleared: v.number(),
	}),
	handler: async (ctx, args) => {
		let cursor: string | null = args.cursor ?? null;
		let isDone = false;
		let totalScanned = 0;
		let totalCleared = 0;

		while (!isDone) {
			const result = await ctx.runMutation(
				internal.migrations.clearSharedLinkPassword.clearBatch,
				{ paginationOpts: { numItems: BATCH_SIZE, cursor } },
			);
			totalScanned += result.scanned;
			totalCleared += result.cleared;
			isDone = result.isDone;
			cursor = result.continueCursor;

			console.log(
				`clearSharedLinkPassword: scanned=${totalScanned} cleared=${totalCleared} isDone=${isDone} nextCursor=${cursor}`,
			);
		}

		return { scanned: totalScanned, cleared: totalCleared };
	},
});
