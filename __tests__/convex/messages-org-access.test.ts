/// <reference types="vite/client" />
/**
 * messages.ts org-member access regression tests.
 *
 * Class of defect: `convex/messages.ts` hand-rolled `workspace.ownerId ===
 * identity.subject` checks instead of consuming `requireAuthWithWorkspace`
 * (convex/lib/auth.ts), the helper used by every other workspace-scoped
 * module (agents, architectSessions, checkpoints, consultantProjects,
 * missions, operations, projects, skills). That helper accepts owner OR org
 * member; messages.ts accepted owner only — so a legitimate organization
 * member was REFUSED on messages while passing everywhere else. A false
 * negative (broken feature), not an open door.
 *
 * Bipolar per guard:
 *   - RED/GREEN: an org member (same organizationId, not the owner) must be
 *     let in on `list`, `getById`, `save`, `deleteAfterTimestamp`.
 *   - MUST_PASS (must not regress): a caller outside the workspace (neither
 *     owner nor org member) must still be refused on every one of those.
 *   - Sanity: the owner path still works.
 */

import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import schema from "../../convex/schema";
// Test-only wiring against the ratelimiter component's compiled output —
// same pattern as session-auto-title.test.ts (no public subpath export).
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

const OWNER = "user_msg_org_owner";
const ORG_MEMBER = "user_msg_org_member";
const OUTSIDER = "user_msg_org_outsider";
const ORG_ID = "org_messages_test";

async function seedWorkspaceWithChatAndMessage(t: ReturnType<typeof makeT>) {
	return await t.run(async (ctx) => {
		const now = Date.now();

		await ctx.db.insert("users", {
			clerkUserId: OWNER,
			organizationId: ORG_ID,
			email: `${OWNER}@test.com`,
			createdAt: now,
			updatedAt: now,
		});
		await ctx.db.insert("users", {
			clerkUserId: ORG_MEMBER,
			organizationId: ORG_ID,
			email: `${ORG_MEMBER}@test.com`,
			createdAt: now,
			updatedAt: now,
		});
		await ctx.db.insert("users", {
			clerkUserId: OUTSIDER,
			organizationId: "org_other",
			email: `${OUTSIDER}@test.com`,
			createdAt: now,
			updatedAt: now,
		});

		const workspaceId = await ctx.db.insert("workspaces", {
			organizationId: ORG_ID,
			ownerId: OWNER,
			name: "Org Workspace",
			isDefault: true,
			createdAt: now,
			updatedAt: now,
		});

		const chatId = await ctx.db.insert("chats", {
			title: "Test chat",
			workspaceId,
			createdBy: OWNER,
			visibility: "workspace",
			createdAt: now,
			updatedAt: now,
		});

		const messageId = await ctx.db.insert("messages", {
			chatId,
			role: "user",
			content: "hello world",
			createdAt: now,
		});

		return { workspaceId, chatId, messageId };
	});
}

describe("messages.list — workspace access (owner OR org member)", () => {
	let t: ReturnType<typeof makeT>;
	let chatId: Id<"chats">;

	beforeEach(async () => {
		t = makeT();
		({ chatId } = await seedWorkspaceWithChatAndMessage(t));
	});

	it("RED/GREEN: an org member (not the owner) can read the chat's messages", async () => {
		const asMember = t.withIdentity({ subject: ORG_MEMBER });
		const result = await asMember.query(api.messages.list, { chatId });
		expect(result.length).toBe(1);
	});

	it("MUST_PASS: an outsider (neither owner nor org member) gets no messages", async () => {
		const asOutsider = t.withIdentity({ subject: OUTSIDER });
		const result = await asOutsider.query(api.messages.list, { chatId });
		expect(result).toEqual([]);
	});

	it("sanity: the owner can still read their own chat's messages", async () => {
		const asOwner = t.withIdentity({ subject: OWNER });
		const result = await asOwner.query(api.messages.list, { chatId });
		expect(result.length).toBe(1);
	});
});

describe("messages.getById — workspace access (owner OR org member)", () => {
	let t: ReturnType<typeof makeT>;
	let messageId: Id<"messages">;

	beforeEach(async () => {
		t = makeT();
		({ messageId } = await seedWorkspaceWithChatAndMessage(t));
	});

	it("RED/GREEN: an org member (not the owner) can fetch the message by ID", async () => {
		const asMember = t.withIdentity({ subject: ORG_MEMBER });
		const result = await asMember.query(api.messages.getById, {
			id: messageId,
		});
		expect(result?._id).toBe(messageId);
	});

	it("MUST_PASS: an outsider is rejected", async () => {
		const asOutsider = t.withIdentity({ subject: OUTSIDER });
		await expect(
			asOutsider.query(api.messages.getById, { id: messageId }),
		).rejects.toThrow(/Unauthorized|Forbidden/);
	});

	it("sanity: the owner can still fetch their own message", async () => {
		const asOwner = t.withIdentity({ subject: OWNER });
		const result = await asOwner.query(api.messages.getById, { id: messageId });
		expect(result?._id).toBe(messageId);
	});
});

describe("messages.save — workspace access (owner OR org member)", () => {
	let t: ReturnType<typeof makeT>;
	let chatId: Id<"chats">;

	beforeEach(async () => {
		t = makeT();
		({ chatId } = await seedWorkspaceWithChatAndMessage(t));
	});

	it("RED/GREEN: an org member (not the owner) can save a message to the chat", async () => {
		const asMember = t.withIdentity({ subject: ORG_MEMBER });
		const messageId = await asMember.mutation(api.messages.save, {
			chatId,
			role: "user",
			content: "member message",
		});
		expect(messageId).toBeDefined();
	});

	it("MUST_PASS: an outsider cannot save a message to the chat", async () => {
		const asOutsider = t.withIdentity({ subject: OUTSIDER });
		await expect(
			asOutsider.mutation(api.messages.save, {
				chatId,
				role: "user",
				content: "outsider message",
			}),
		).rejects.toThrow(/Unauthorized|Forbidden/);
	});

	it("sanity: the owner can still save a message", async () => {
		const asOwner = t.withIdentity({ subject: OWNER });
		const messageId = await asOwner.mutation(api.messages.save, {
			chatId,
			role: "user",
			content: "owner message",
		});
		expect(messageId).toBeDefined();
	});
});

describe("messages.deleteAfterTimestamp — workspace access (owner OR org member)", () => {
	let t: ReturnType<typeof makeT>;
	let chatId: Id<"chats">;

	beforeEach(async () => {
		t = makeT();
		({ chatId } = await seedWorkspaceWithChatAndMessage(t));
	});

	it("RED/GREEN: an org member (not the owner) can delete messages after a timestamp", async () => {
		const asMember = t.withIdentity({ subject: ORG_MEMBER });
		const result = await asMember.mutation(api.messages.deleteAfterTimestamp, {
			chatId,
			timestamp: 0,
		});
		expect(result.deleted).toBe(1);
	});

	it("MUST_PASS: an outsider cannot delete messages in this chat", async () => {
		const asOutsider = t.withIdentity({ subject: OUTSIDER });
		await expect(
			asOutsider.mutation(api.messages.deleteAfterTimestamp, {
				chatId,
				timestamp: 0,
			}),
		).rejects.toThrow(/Unauthorized|Forbidden/);
	});

	it("sanity: the owner can still delete messages after a timestamp", async () => {
		const asOwner = t.withIdentity({ subject: OWNER });
		const result = await asOwner.mutation(api.messages.deleteAfterTimestamp, {
			chatId,
			timestamp: 0,
		});
		expect(result.deleted).toBe(1);
	});
});
