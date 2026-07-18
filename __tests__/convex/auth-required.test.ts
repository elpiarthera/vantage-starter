/// <reference types="vite/client" />
/**
 * Auth-required regression tests (PR #28 follow-up).
 *
 * PR #28 added identity checks to 12 previously-public Convex mutations.
 * A lexical sweep proved the auth call now exists; it did NOT prove that an
 * unauthenticated call actually gets rejected. This file closes that gap:
 * every test below calls the mutation through `api.*` with NO identity
 * attached (no `t.withIdentity(...)`) and asserts the call throws.
 *
 * In scope — functions that gained a *runtime* auth check and remain public
 * (`api.*`):
 *   - api.agents.update / api.agents.remove        (requireAuthWithWorkspace)
 *   - api.skills.update / api.skills.remove         (requireAuthWithWorkspace)
 *   - api.agents.incrementUsage / api.skills.incrementUsage (requireAuth)
 *   - api.users.syncUser                            (self-sync identity check)
 *
 * Out of scope (documented, not tested here): agents.generateToken,
 * agents.rotateToken, subscriptions.create, subscriptions.cancel,
 * workspaces.ensureDefault — all converted to `internalMutation` by PR #28,
 * so they are no longer reachable via `api.*` at all. A test could only
 * assert a TypeScript/absence fact (the property doesn't exist on `api`),
 * which is exactly the false-comfort this suite exists to avoid. The only
 * behavioural claim worth making about them — "an internal-only mutation is
 * unreachable from an unauthenticated HTTP client holding just the
 * deployment URL" — is a platform guarantee of Convex's internal/public
 * function boundary, not something this app's code decides; it is not
 * meaningfully re-testable at the convex-test level (convex-test's `t`
 * exposes `api` typed access; there is no `t.mutation(<untyped string>)`
 * path here that would exercise the wire boundary).
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

const OWNER_CLERK_ID = "user_auth_required_owner";

/**
 * Seed a workspace + user + everything an agent/skill row needs to reach the
 * authorization line (role/persona for agents). Returns ids for use in tests.
 */
async function seedWorkspaceGraph(t: ReturnType<typeof makeT>) {
	return await t.run(async (ctx) => {
		const now = Date.now();

		const userId = await ctx.db.insert("users", {
			clerkUserId: OWNER_CLERK_ID,
			organizationId: undefined,
			email: `${OWNER_CLERK_ID}@test.com`,
			createdAt: now,
			updatedAt: now,
		});

		const workspaceId = await ctx.db.insert("workspaces", {
			organizationId: "personal",
			ownerId: OWNER_CLERK_ID,
			name: "Owner Workspace",
			isDefault: true,
			createdAt: now,
			updatedAt: now,
		});

		const roleId = await ctx.db.insert("customRoles", {
			name: "Test Role",
			icon: "🤖",
			description: "role for auth tests",
			category: "general",
			expertise: [],
			systemPrompt: "You are a test role.",
			workspaceId,
			createdBy: OWNER_CLERK_ID,
			createdAt: now,
			updatedAt: now,
		});

		const personaId = await ctx.db.insert("customPersonas", {
			name: "Test Persona",
			icon: "🎭",
			description: "persona for auth tests",
			traits: [],
			communicationStyle: "direct",
			decisionMaking: "analytical",
			systemPromptModifier: "Be direct.",
			workspaceId,
			createdBy: OWNER_CLERK_ID,
			createdAt: now,
			updatedAt: now,
		});

		const agentId = await ctx.db.insert("agents", {
			workspaceId,
			createdBy: OWNER_CLERK_ID,
			name: "Test Agent",
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
			createdAt: now,
			updatedAt: now,
		});

		const skillId = await ctx.db.insert("skills", {
			name: "Test Skill",
			slug: "test-skill",
			description: "skill for auth tests",
			instructions: "Do the thing.",
			category: "development",
			isSystem: false,
			createdBy: OWNER_CLERK_ID,
			workspaceId,
			visibility: "workspace",
			usageCount: 0,
			createdAt: now,
			updatedAt: now,
		});

		return { userId, workspaceId, roleId, personaId, agentId, skillId };
	});
}

describe("Auth required: agents.update / agents.remove", () => {
	let t: ReturnType<typeof makeT>;
	let agentId: Id<"agents">;

	beforeEach(async () => {
		t = makeT();
		({ agentId } = await seedWorkspaceGraph(t));
	});

	it("agents.update rejects an unauthenticated caller", async () => {
		await expect(
			t.mutation(api.agents.update, {
				agentId,
				name: "Renamed by attacker",
			}),
		).rejects.toThrow(/Unauthorized|Authentication required/);
	});

	it("agents.remove rejects an unauthenticated caller", async () => {
		await expect(t.mutation(api.agents.remove, { agentId })).rejects.toThrow(
			/Unauthorized|Authentication required/,
		);
	});
});

describe("Auth required: skills.update / skills.remove", () => {
	let t: ReturnType<typeof makeT>;
	let skillId: Id<"skills">;

	beforeEach(async () => {
		t = makeT();
		({ skillId } = await seedWorkspaceGraph(t));
	});

	it("skills.update rejects an unauthenticated caller", async () => {
		await expect(
			t.mutation(api.skills.update, {
				skillId,
				name: "Renamed by attacker",
			}),
		).rejects.toThrow(/Unauthorized|Authentication required/);
	});

	it("skills.remove rejects an unauthenticated caller", async () => {
		await expect(t.mutation(api.skills.remove, { skillId })).rejects.toThrow(
			/Unauthorized|Authentication required/,
		);
	});
});

describe("Auth required: agents.incrementUsage / skills.incrementUsage", () => {
	let t: ReturnType<typeof makeT>;
	let agentId: Id<"agents">;
	let skillId: Id<"skills">;

	beforeEach(async () => {
		t = makeT();
		({ agentId, skillId } = await seedWorkspaceGraph(t));
	});

	it("agents.incrementUsage rejects an unauthenticated caller", async () => {
		await expect(
			t.mutation(api.agents.incrementUsage, { agentId }),
		).rejects.toThrow(/Unauthorized|Authentication required/);
	});

	it("skills.incrementUsage rejects an unauthenticated caller", async () => {
		await expect(
			t.mutation(api.skills.incrementUsage, { skillId }),
		).rejects.toThrow(/Unauthorized|Authentication required/);
	});
});

describe("Auth required: users.syncUser", () => {
	it("rejects an unauthenticated caller entirely", async () => {
		const t = makeT();
		await expect(
			t.mutation(api.users.syncUser, {
				clerkUserId: "user_never_signed_in",
				email: "ghost@example.com",
			}),
		).rejects.toThrow(/Unauthorized|Authentication required/);
	});

	// Sharper case — this is the only in-scope function with a real product
	// caller (components/UserSyncProvider.tsx). It is not enough that SOME
	// identity is present; the identity must match the row being written.
	it("rejects self-sync spoofing: authenticated as user_A, writing user_B", async () => {
		const t = makeT();
		const asUserA = t.withIdentity({ subject: "user_A" });

		await expect(
			asUserA.mutation(api.users.syncUser, {
				clerkUserId: "user_B",
				email: "spoofed@example.com",
			}),
		).rejects.toThrow(/cannot sync a different user/);
	});

	it("succeeds when the authenticated identity matches clerkUserId", async () => {
		const t = makeT();
		const asUserA = t.withIdentity({ subject: "user_A" });

		const userId = await asUserA.mutation(api.users.syncUser, {
			clerkUserId: "user_A",
			email: "real@example.com",
		});

		expect(userId).toBeDefined();
	});
});
