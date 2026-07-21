/// <reference types="vite/client" />
/**
 * Session naming — two remaining shapes of the "constant instead of derived
 * name" class beyond the first-exchange auto-title covered by
 * session-auto-title.test.ts:
 *
 *   1. MISSION NAME: a session that produces a mission takes the mission's
 *      name at `complete` time — unless the user has already renamed the
 *      session (`isTitleCustom: true`), which must survive untouched.
 *   2. CATCH-UP: a session that already had a message when the auto-title
 *      mechanism shipped could never be titled — the gate was
 *      `priorMessages.length === 0` (true only at the literal first
 *      message), not "does this session have a title yet". Fixed by gating
 *      on `!session.title` instead, so the very next message on an old,
 *      never-titled session names it.
 */

import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import schema from "../../convex/schema";
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

const OWNER = "user_session_mission_title_owner";

async function seedOwnerWorkspace(t: ReturnType<typeof makeT>) {
	return await t.run(async (ctx) => {
		const now = Date.now();
		await ctx.db.insert("users", {
			clerkUserId: OWNER,
			organizationId: undefined,
			email: `${OWNER}@test.com`,
			createdAt: now,
			updatedAt: now,
		});
		const workspaceId = await ctx.db.insert("workspaces", {
			organizationId: "personal",
			ownerId: OWNER,
			name: "Owner Workspace",
			isDefault: true,
			createdAt: now,
			updatedAt: now,
		});
		return { workspaceId };
	});
}

const MINIMAL_PROPOSAL = {
	name: "Migrate billing to Polar",
	brief: "Move subscriptions off Stripe onto Polar.",
	objective: "Zero-downtime billing migration",
	successCriteria: ["All active subs migrated", "No failed charges"],
	estimatedTimeline: "1 week",
	operations: [
		{
			id: "op1",
			name: "Audit current Stripe subscriptions",
			description: "List all active subs",
			type: "ai" as const,
			estimatedMinutes: 30,
			prompt: "Audit Stripe subs",
		},
	],
};

describe("MISSION NAME: session takes the mission's name on completion", () => {
	let t: ReturnType<typeof makeT>;
	let workspaceId: Id<"workspaces">;

	beforeEach(async () => {
		t = makeT();
		({ workspaceId } = await seedOwnerWorkspace(t));
	});

	it("a session that produces a mission takes the mission's name", async () => {
		const asOwner = t.withIdentity({ subject: OWNER });

		const sessionId = await asOwner.mutation(api.architectSessions.create, {
			workspaceId,
		});

		const missionId = await asOwner.mutation(api.missions.createFromProposal, {
			workspaceId,
			proposal: MINIMAL_PROPOSAL,
		});

		await asOwner.mutation(api.architectSessions.complete, {
			sessionId,
			missionId,
		});

		const session = await t.run(async (ctx) => await ctx.db.get(sessionId));
		expect(session?.title).toBe("Migrate billing to Polar");
	});

	it("a session the user renamed does NOT take the mission's name", async () => {
		const asOwner = t.withIdentity({ subject: OWNER });

		const sessionId = await asOwner.mutation(api.architectSessions.create, {
			workspaceId,
		});

		await asOwner.mutation(api.architectSessions.updateTitle, {
			sessionId,
			title: "My Custom Session Name",
		});

		const missionId = await asOwner.mutation(api.missions.createFromProposal, {
			workspaceId,
			proposal: MINIMAL_PROPOSAL,
		});

		await asOwner.mutation(api.architectSessions.complete, {
			sessionId,
			missionId,
		});

		const session = await t.run(async (ctx) => await ctx.db.get(sessionId));
		expect(session?.title).toBe("My Custom Session Name");
	});
});

describe("CATCH-UP: an old, never-titled session gets named on its next message", () => {
	let t: ReturnType<typeof makeT>;
	let workspaceId: Id<"workspaces">;

	beforeEach(async () => {
		t = makeT();
		({ workspaceId } = await seedOwnerWorkspace(t));
	});

	it("an old session with an existing message and no derived title gets a name", async () => {
		const asOwner = t.withIdentity({ subject: OWNER });

		const sessionId = await asOwner.mutation(api.architectSessions.create, {
			workspaceId,
		});

		// Simulate a session that predates the auto-title mechanism: it already
		// has a first user message inserted directly (bypassing addMessage's
		// derivation), so `title` stays undefined exactly like a row created
		// before this fix shipped.
		await t.run(async (ctx) => {
			await ctx.db.insert("architectMessages", {
				sessionId,
				role: "user",
				content: "Plan a mission to migrate our billing system to Polar",
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
		});

		const before = await t.run(async (ctx) => await ctx.db.get(sessionId));
		expect(before?.title).toBeFalsy();

		// Any subsequent message is the catch-up trigger.
		await asOwner.mutation(api.architectSessions.addMessage, {
			sessionId,
			role: "user",
			content: "Also make sure we keep license keys working",
		});

		const session = await t.run(async (ctx) => await ctx.db.get(sessionId));
		expect(session?.title).toBeTruthy();
		expect(session?.title).not.toBe("New session");
		// Derived from the session's OWN FIRST message, not the newest one.
		expect(session?.title?.toLowerCase()).toContain("migrate our billing");
	});
});

describe("DORMANT ROWS: read-time derivation reaches sessions that will never write again", () => {
	let t: ReturnType<typeof makeT>;
	let workspaceId: Id<"workspaces">;

	beforeEach(async () => {
		t = makeT();
		({ workspaceId } = await seedOwnerWorkspace(t));
	});

	it("an already-completed session with existingMissionId set and no title shows the mission's name (listRecent)", async () => {
		const asOwner = t.withIdentity({ subject: OWNER });

		const sessionId = await asOwner.mutation(api.architectSessions.create, {
			workspaceId,
		});

		const missionId = await asOwner.mutation(api.missions.createFromProposal, {
			workspaceId,
			proposal: MINIMAL_PROPOSAL,
		});

		// Simulate a row that finished BEFORE this fix shipped: `complete`
		// never had the chance to write a title, so the session is exactly
		// the dormant "New session" row on Laurent's screen — status
		// completed, existingMissionId set, no `addMessage` will ever fire on
		// it again. Patch directly, bypassing the (now-fixed) mutation.
		await t.run(async (ctx) => {
			await ctx.db.patch(sessionId, {
				status: "completed",
				existingMissionId: missionId,
			});
		});

		const stored = await t.run(async (ctx) => await ctx.db.get(sessionId));
		expect(stored?.title).toBeFalsy(); // still absent in the DATA — derived, not stored

		const { sessions } = await asOwner.query(api.architectSessions.listRecent, {
			workspaceId,
		});
		const found = sessions.find((s) => s._id === sessionId);
		expect(found?.title).toBe("Migrate billing to Polar");
	});

	it("an already-completed session with existingMissionId set and no title shows the mission's name (get)", async () => {
		const asOwner = t.withIdentity({ subject: OWNER });

		const sessionId = await asOwner.mutation(api.architectSessions.create, {
			workspaceId,
		});

		const missionId = await asOwner.mutation(api.missions.createFromProposal, {
			workspaceId,
			proposal: MINIMAL_PROPOSAL,
		});

		await t.run(async (ctx) => {
			await ctx.db.patch(sessionId, {
				status: "completed",
				existingMissionId: missionId,
			});
		});

		const found = await asOwner.query(api.architectSessions.get, { sessionId });
		expect(found?.title).toBe("Migrate billing to Polar");
	});

	it("a dormant session with messages but no mission derives from its own first message (listRecent)", async () => {
		const asOwner = t.withIdentity({ subject: OWNER });

		const sessionId = await asOwner.mutation(api.architectSessions.create, {
			workspaceId,
		});

		await t.run(async (ctx) => {
			await ctx.db.insert("architectMessages", {
				sessionId,
				role: "user",
				content: "Plan a mission to migrate our billing system to Polar",
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
			await ctx.db.patch(sessionId, { status: "abandoned" });
		});

		const { sessions } = await asOwner.query(api.architectSessions.listRecent, {
			workspaceId,
		});
		const found = sessions.find((s) => s._id === sessionId);
		expect(found?.title?.toLowerCase()).toContain("migrate our billing");
	});
});
