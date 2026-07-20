/// <reference types="vite/client" />
/**
 * Session auto-title regression tests.
 *
 * Class of defect: a session's displayed name is a constant rather than a
 * property derived from the session's own content. Two shapes:
 *   1. CHAT — the constant is written at CREATION (client passes a
 *      translated "New chat" literal as `title`).
 *   2. ARCHITECT — the constant is applied at DISPLAY (the UI falls back to
 *      a translated "New session" literal when `title` is empty).
 *
 * Fix: both `chats` and `architectSessions` derive a title from their first
 * user message, unless the user has explicitly renamed the session
 * (`isTitleCustom: true`), in which case the automatic mechanism never
 * overwrites it again.
 */

import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import schema from "../../convex/schema";
// No public subpath export for the ratelimiter component's internal schema —
// this is test-only wiring against the component's compiled output via a
// direct filesystem path (the package's "exports" map has no public subpath
// for it). TypeScript resolves the adjacent .d.ts fine under this repo's
// moduleResolution; no suppression needed.
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

const OWNER = "user_session_title_owner";

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

describe("CHAT: auto-title from first exchange", () => {
	let t: ReturnType<typeof makeT>;
	let workspaceId: Id<"workspaces">;

	beforeEach(async () => {
		t = makeT();
		({ workspaceId } = await seedOwnerWorkspace(t));
	});

	it("a freshly created chat, after its first exchange, no longer carries the default label", async () => {
		const asOwner = t.withIdentity({ subject: OWNER });

		// Client no longer burns a translated literal into `title` at creation —
		// it creates untitled and lets the first exchange name the chat.
		const chatId = await asOwner.mutation(api.chats.create, {
			workspaceId,
			title: "",
		});

		await asOwner.mutation(api.messages.save, {
			chatId,
			role: "user",
			content:
				"Help me draft a go-to-market plan for a B2B SaaS onboarding tool",
		});

		const chat = await t.run(async (ctx) => await ctx.db.get(chatId));
		expect(chat?.title).not.toBe("");
		expect(chat?.title).not.toBe("New chat");
		expect(chat?.title?.toLowerCase()).toContain("go-to-market");
	});

	it("a user-set chat title survives the automatic mechanism", async () => {
		const asOwner = t.withIdentity({ subject: OWNER });

		const chatId = await asOwner.mutation(api.chats.create, {
			workspaceId,
			title: "",
		});

		// User renames before the first exchange lands.
		await asOwner.mutation(api.chats.update, {
			id: chatId,
			title: "My Custom Chat Name",
		});

		await asOwner.mutation(api.messages.save, {
			chatId,
			role: "user",
			content: "This content must never overwrite the user's chosen title",
		});

		const chat = await t.run(async (ctx) => await ctx.db.get(chatId));
		expect(chat?.title).toBe("My Custom Chat Name");
	});
});

describe("ARCHITECT: auto-title from first exchange", () => {
	let t: ReturnType<typeof makeT>;
	let workspaceId: Id<"workspaces">;

	beforeEach(async () => {
		t = makeT();
		({ workspaceId } = await seedOwnerWorkspace(t));
	});

	it("a freshly created architect session, after its first exchange, no longer carries the default label", async () => {
		const asOwner = t.withIdentity({ subject: OWNER });

		const sessionId = await asOwner.mutation(api.architectSessions.create, {
			workspaceId,
		});

		await asOwner.mutation(api.architectSessions.addMessage, {
			sessionId,
			role: "user",
			content: "Plan a mission to migrate our billing system to Polar",
		});

		const session = await t.run(async (ctx) => await ctx.db.get(sessionId));
		expect(session?.title).toBeTruthy();
		expect(session?.title).not.toBe("New session");
		expect(session?.title?.toLowerCase()).toContain("migrate our billing");
	});

	it("a user-set architect session title survives the automatic mechanism", async () => {
		const asOwner = t.withIdentity({ subject: OWNER });

		const sessionId = await asOwner.mutation(api.architectSessions.create, {
			workspaceId,
		});

		await asOwner.mutation(api.architectSessions.updateTitle, {
			sessionId,
			title: "My Custom Session Name",
		});

		await asOwner.mutation(api.architectSessions.addMessage, {
			sessionId,
			role: "user",
			content: "This content must never overwrite the user's chosen title",
		});

		const session = await t.run(async (ctx) => await ctx.db.get(sessionId));
		expect(session?.title).toBe("My Custom Session Name");
	});
});
