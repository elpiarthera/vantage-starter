/// <reference types="vite/client" />
/**
 * agents.list / agents.listSystem must never return the per-agent HTTP auth
 * secret (`token` / `tokenCreatedAt`).
 *
 * `agents.get` already redacts these fields (destructure-and-drop) and says
 * so in its own comment. `agents.list` and `agents.listSystem` returned raw
 * `agents` docs from the same table through the same public surface — a
 * redaction on one read is defeated by an unredacted second read of the
 * same field. Worst case: `list`'s `systemAgents` branch is filtered only on
 * `isSystem`, with no workspace/org check at all, so any authenticated
 * caller in ANY workspace could read a system agent's token if one were ever
 * set — a cross-tenant credential leak, not merely an inconsistency.
 *
 * These tests assert the ABSENCE of the field on every returned object,
 * never merely that the function returns something.
 */

import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import schema from "../../convex/schema";

const modules = import.meta.glob([
	"../../convex/**/*.ts",
	"../../convex/**/*.js",
	"!../../convex/**/*.d.ts",
]);

function makeT() {
	return convexTest(schema, modules);
}

const OWNER_A = "user_org_a_owner";

async function seedWorkspaceWithTokenedAgent(t: ReturnType<typeof makeT>) {
	return await t.run(async (ctx) => {
		const now = Date.now();

		await ctx.db.insert("users", {
			clerkUserId: OWNER_A,
			organizationId: undefined,
			email: `${OWNER_A}@test.com`,
			createdAt: now,
			updatedAt: now,
		});

		const workspaceId = await ctx.db.insert("workspaces", {
			organizationId: "personal",
			ownerId: OWNER_A,
			name: "Org A Workspace",
			isDefault: true,
			createdAt: now,
			updatedAt: now,
		});

		const roleId = await ctx.db.insert("customRoles", {
			name: "Test Role",
			icon: "🤖",
			description: "role for token-redaction tests",
			category: "general",
			expertise: [],
			systemPrompt: "You are a test role.",
			workspaceId,
			createdBy: OWNER_A,
			createdAt: now,
			updatedAt: now,
		});

		const personaId = await ctx.db.insert("customPersonas", {
			name: "Test Persona",
			icon: "🎭",
			description: "persona for token-redaction tests",
			traits: [],
			communicationStyle: "direct",
			decisionMaking: "analytical",
			systemPromptModifier: "Be direct.",
			workspaceId,
			createdBy: OWNER_A,
			createdAt: now,
			updatedAt: now,
		});

		// Workspace-owned agent, WITH a token — the caller's own agent.
		const agentId = await ctx.db.insert("agents", {
			workspaceId,
			createdBy: OWNER_A,
			name: "Org A Agent",
			roleId,
			roleName: "Test Role",
			roleSystemPrompt: "You are a test role.",
			personaId,
			personaName: "Test Persona",
			personaModifier: "Be direct.",
			skillIds: [],
			model: "claude-sonnet-4-5",
			provider: "anthropic",
			isSystem: false,
			isActive: true,
			usageCount: 0,
			visibility: "workspace",
			token: "super-secret-agent-token",
			tokenCreatedAt: now,
			createdAt: now,
			updatedAt: now,
		});

		// System agent — schema permits `token` on ANY agents row, system or
		// not (`token: v.optional(v.string())`, no `isSystem` exclusion at the
		// schema level). Seed one WITH a token to prove the redaction is
		// enforced by the query, not merely "no row happens to have one".
		const systemAgentId = await ctx.db.insert("agents", {
			workspaceId: undefined,
			createdBy: "system",
			name: "System Agent",
			roleId,
			roleName: "Test Role",
			roleSystemPrompt: "You are a test role.",
			personaId,
			personaName: "Test Persona",
			personaModifier: "Be direct.",
			skillIds: [],
			model: "claude-sonnet-4-5",
			provider: "anthropic",
			isSystem: true,
			isActive: true,
			usageCount: 0,
			visibility: "workspace",
			token: "super-secret-system-agent-token",
			tokenCreatedAt: now,
			createdAt: now,
			updatedAt: now,
		});

		return { workspaceId, agentId, systemAgentId };
	});
}

describe("agents.list never returns token/tokenCreatedAt", () => {
	let t: ReturnType<typeof makeT>;
	let workspaceId: Id<"workspaces">;

	beforeEach(async () => {
		t = makeT();
		({ workspaceId } = await seedWorkspaceWithTokenedAgent(t));
	});

	it("strips token/tokenCreatedAt from the caller's own workspace agent", async () => {
		const asOwner = t.withIdentity({ subject: OWNER_A });
		const results = await asOwner.query(api.agents.list, { workspaceId });

		expect(results.length).toBeGreaterThan(0);
		for (const agent of results) {
			expect(agent).not.toHaveProperty("token");
			expect(agent).not.toHaveProperty("tokenCreatedAt");
		}
	});

	it("strips token/tokenCreatedAt from the cross-tenant systemAgents branch", async () => {
		const asOwner = t.withIdentity({ subject: OWNER_A });
		const results = await asOwner.query(api.agents.list, { workspaceId });

		const systemAgent = results.find((a) => a.isSystem);
		expect(systemAgent).toBeDefined();
		expect(systemAgent).not.toHaveProperty("token");
		expect(systemAgent).not.toHaveProperty("tokenCreatedAt");
	});
});

describe("agents.listSystem never returns token/tokenCreatedAt", () => {
	let t: ReturnType<typeof makeT>;

	beforeEach(async () => {
		t = makeT();
		await seedWorkspaceWithTokenedAgent(t);
	});

	it("strips token/tokenCreatedAt even though this query requires no auth at all", async () => {
		const results = await t.query(api.agents.listSystem, {});

		expect(results.length).toBeGreaterThan(0);
		for (const agent of results) {
			expect(agent).not.toHaveProperty("token");
			expect(agent).not.toHaveProperty("tokenCreatedAt");
		}
	});
});
