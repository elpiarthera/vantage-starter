/// <reference types="vite/client" />
/**
 * Org-scoping regression tests (org-scoping audit follow-up).
 *
 * The three read-only audits (analysis/org-scoping-group-{a,b,c}.md) found
 * 16 cross-tenant defects across three classes:
 *   1. No authentication at all on a public read.
 *   2. Authenticated, but never checks the row belongs to the caller.
 *   3. Accepts `clerkUserId` as a plain argument and never compares it to
 *      the caller's identity.
 *
 * Every test below seeds a victim ("org A" / "user B") row and then calls
 * the function as an attacker (no identity, or a *different* identity /
 * organization) and asserts the call is REJECTED — either it throws, or
 * (for functions with a documented degrade-to-empty pattern) it returns no
 * data belonging to the victim. A test that only asserts "the function is
 * defined" proves nothing; every assertion here targets the actual leak
 * described in the audit.
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
const ATTACKER_B = "user_org_b_attacker";

/**
 * Seed a full workspace graph for "org A" (owner OWNER_A), with one agent
 * and one private skill — mirrors the seed used by auth-required.test.ts.
 */
async function seedOrgAGraph(t: ReturnType<typeof makeT>) {
	return await t.run(async (ctx) => {
		const now = Date.now();

		const userId = await ctx.db.insert("users", {
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
			description: "role for org-scoping tests",
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
			description: "persona for org-scoping tests",
			traits: [],
			communicationStyle: "direct",
			decisionMaking: "analytical",
			systemPromptModifier: "Be direct.",
			workspaceId,
			createdBy: OWNER_A,
			createdAt: now,
			updatedAt: now,
		});

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

		const skillId = await ctx.db.insert("skills", {
			name: "Org A Private Skill",
			slug: "org-a-private-skill",
			description: "skill for org-scoping tests",
			instructions: "PROPRIETARY: do the secret thing.",
			category: "development",
			isSystem: false,
			createdBy: OWNER_A,
			workspaceId,
			visibility: "private",
			usageCount: 0,
			createdAt: now,
			updatedAt: now,
		});

		return { userId, workspaceId, roleId, personaId, agentId, skillId };
	});
}

/** Seed an unrelated "org B" workspace owned by ATTACKER_B. */
async function seedOrgBWorkspace(t: ReturnType<typeof makeT>) {
	return await t.run(async (ctx) => {
		const now = Date.now();
		await ctx.db.insert("users", {
			clerkUserId: ATTACKER_B,
			organizationId: undefined,
			email: `${ATTACKER_B}@test.com`,
			createdAt: now,
			updatedAt: now,
		});
		const workspaceId = await ctx.db.insert("workspaces", {
			organizationId: "personal",
			ownerId: ATTACKER_B,
			name: "Org B Workspace",
			isDefault: true,
			createdAt: now,
			updatedAt: now,
		});
		return { workspaceId };
	});
}

// ============================================================================
// CLASS 1 — no authentication at all on a public read
// ============================================================================

describe("Class 1: agents.get", () => {
	let t: ReturnType<typeof makeT>;
	let agentId: Id<"agents">;

	beforeEach(async () => {
		t = makeT();
		({ agentId } = await seedOrgAGraph(t));
	});

	it("rejects an unauthenticated caller (no identity at all)", async () => {
		await expect(t.query(api.agents.get, { agentId })).rejects.toThrow(
			/Unauthorized|Authentication required/,
		);
	});

	it("rejects a caller from a different organization/workspace", async () => {
		await seedOrgBWorkspace(t);
		const asAttacker = t.withIdentity({ subject: ATTACKER_B });
		await expect(asAttacker.query(api.agents.get, { agentId })).rejects.toThrow(
			/Unauthorized/,
		);
	});
});

describe("Class 1: skills.get", () => {
	let t: ReturnType<typeof makeT>;
	let skillId: Id<"skills">;

	beforeEach(async () => {
		t = makeT();
		({ skillId } = await seedOrgAGraph(t));
	});

	it("rejects an unauthenticated caller (no identity at all)", async () => {
		await expect(t.query(api.skills.get, { skillId })).rejects.toThrow(
			/Unauthorized|Authentication required/,
		);
	});

	it("rejects a caller from a different organization/workspace", async () => {
		await seedOrgBWorkspace(t);
		const asAttacker = t.withIdentity({ subject: ATTACKER_B });
		await expect(asAttacker.query(api.skills.get, { skillId })).rejects.toThrow(
			/Unauthorized/,
		);
	});
});

describe("Class 1: files.getFileUrl", () => {
	it("rejects an unauthenticated caller", async () => {
		const t = makeT();
		const { storageId } = await t.run(async (ctx) => {
			const blob = new Blob(["victim file contents"], {
				type: "text/plain",
			});
			const storageId = await ctx.storage.store(blob);
			return { storageId };
		});

		await expect(
			t.query(api.files.getFileUrl, { storageId: storageId as string }),
		).rejects.toThrow(/Not authenticated/);
	});

	it("rejects a caller who does not own the asset row for this storageId", async () => {
		const t = makeT();
		const now = Date.now();

		const { storageId } = await t.run(async (ctx) => {
			await ctx.db.insert("users", {
				clerkUserId: OWNER_A,
				organizationId: undefined,
				email: `${OWNER_A}@test.com`,
				createdAt: now,
				updatedAt: now,
			});
			const blob = new Blob(["victim file contents"], {
				type: "text/plain",
			});
			const storageId = await ctx.storage.store(blob);
			const url = await ctx.storage.getUrl(storageId);
			await ctx.db.insert("assets", {
				userId: OWNER_A,
				type: "image",
				url: url as string,
				filename: "victim.png",
				size: 123,
				uploadedAt: now,
			});
			return { storageId };
		});

		const asAttacker = t.withIdentity({ subject: ATTACKER_B });
		await expect(
			asAttacker.query(api.files.getFileUrl, {
				storageId: storageId as string,
			}),
		).rejects.toThrow(/Unauthorized/);
	});
});

describe("Class 1: users.getUserByClerkId", () => {
	let t: ReturnType<typeof makeT>;

	beforeEach(async () => {
		t = makeT();
		await seedOrgAGraph(t);
	});

	it("rejects an unauthenticated caller", async () => {
		await expect(
			t.query(api.users.getUserByClerkId, { clerkUserId: OWNER_A }),
		).rejects.toThrow(/Unauthorized|Authentication required/);
	});

	it("rejects a caller reading a different user's profile", async () => {
		const asAttacker = t.withIdentity({ subject: ATTACKER_B });
		await expect(
			asAttacker.query(api.users.getUserByClerkId, {
				clerkUserId: OWNER_A,
			}),
		).rejects.toThrow(/Unauthorized/);
	});
});

// ============================================================================
// CLASS 2 — authenticated but never checks the row belongs to the caller
// ============================================================================

describe("Class 2: agents.incrementUsage / skills.incrementUsage cross-tenant", () => {
	let t: ReturnType<typeof makeT>;
	let agentId: Id<"agents">;
	let skillId: Id<"skills">;

	beforeEach(async () => {
		t = makeT();
		({ agentId, skillId } = await seedOrgAGraph(t));
		await seedOrgBWorkspace(t);
	});

	it("agents.incrementUsage rejects a caller from a different workspace", async () => {
		const asAttacker = t.withIdentity({ subject: ATTACKER_B });
		await expect(
			asAttacker.mutation(api.agents.incrementUsage, { agentId }),
		).rejects.toThrow(/Unauthorized/);
	});

	it("skills.incrementUsage rejects a caller from a different workspace", async () => {
		const asAttacker = t.withIdentity({ subject: ATTACKER_B });
		await expect(
			asAttacker.mutation(api.skills.incrementUsage, { skillId }),
		).rejects.toThrow(/Unauthorized/);
	});
});

describe("Class 2: files.deleteFile cross-tenant", () => {
	it("rejects a caller who does not own the asset row for this storageId", async () => {
		const t = makeT();
		const now = Date.now();

		const { storageId } = await t.run(async (ctx) => {
			await ctx.db.insert("users", {
				clerkUserId: OWNER_A,
				organizationId: undefined,
				email: `${OWNER_A}@test.com`,
				createdAt: now,
				updatedAt: now,
			});
			const blob = new Blob(["victim file contents"], {
				type: "text/plain",
			});
			const storageId = await ctx.storage.store(blob);
			const url = await ctx.storage.getUrl(storageId);
			await ctx.db.insert("assets", {
				userId: OWNER_A,
				type: "image",
				url: url as string,
				filename: "victim.png",
				size: 123,
				uploadedAt: now,
			});
			return { storageId };
		});

		const asAttacker = t.withIdentity({ subject: ATTACKER_B });
		await expect(
			asAttacker.mutation(api.files.deleteFile, {
				storageId: storageId as string,
			}),
		).rejects.toThrow(/Unauthorized/);
	});
});

describe("Class 2: chatMessages.list cross-tenant", () => {
	it("does not return another organization's messages for a guessed projectId", async () => {
		const t = makeT();
		const now = Date.now();
		const SHARED_PROJECT_ID = "shared-guessable-project-id";

		await t.run(async (ctx) => {
			await ctx.db.insert("users", {
				clerkUserId: OWNER_A,
				organizationId: "org_a",
				email: `${OWNER_A}@test.com`,
				createdAt: now,
				updatedAt: now,
			});
			await ctx.db.insert("chatMessages", {
				organizationId: "org_a",
				projectId: SHARED_PROJECT_ID,
				userId: OWNER_A,
				role: "user",
				content: "org A secret chat content",
				context: 0,
				metadata: {},
				createdAt: now,
				updatedAt: now,
			});
		});

		await t.run(async (ctx) => {
			await ctx.db.insert("users", {
				clerkUserId: ATTACKER_B,
				organizationId: "org_b",
				email: `${ATTACKER_B}@test.com`,
				createdAt: now,
				updatedAt: now,
			});
		});

		const asAttacker = t.withIdentity({ subject: ATTACKER_B });
		const results = await asAttacker.query(api.chatMessages.list, {
			projectId: SHARED_PROJECT_ID,
		});

		expect(results).toEqual([]);
	});
});

describe("Class 2: sharedLinks.list / sharedLinks.create cross-tenant", () => {
	it("list does not return another organization's shared links for a guessed resourceId", async () => {
		const t = makeT();
		const now = Date.now();
		const SHARED_RESOURCE_ID = "shared-guessable-resource-id";

		await t.run(async (ctx) => {
			await ctx.db.insert("users", {
				clerkUserId: OWNER_A,
				organizationId: "org_a",
				email: `${OWNER_A}@test.com`,
				createdAt: now,
				updatedAt: now,
			});
			await ctx.db.insert("sharedLinks", {
				organizationId: "org_a",
				resourceId: SHARED_RESOURCE_ID,
				userId: OWNER_A,
				token: "org-a-token",
				allowDownload: true,
				viewCount: 0,
				createdAt: now,
				updatedAt: now,
			});
		});

		await t.run(async (ctx) => {
			await ctx.db.insert("users", {
				clerkUserId: ATTACKER_B,
				organizationId: "org_b",
				email: `${ATTACKER_B}@test.com`,
				createdAt: now,
				updatedAt: now,
			});
		});

		const asAttacker = t.withIdentity({ subject: ATTACKER_B });
		const results = await asAttacker.query(api.sharedLinks.list, {
			resourceId: SHARED_RESOURCE_ID,
		});

		expect(results).toEqual([]);
	});

	it("create attributes the link to the caller's own organization, never a client-supplied one", async () => {
		const t = makeT();
		const now = Date.now();

		await t.run(async (ctx) => {
			await ctx.db.insert("users", {
				clerkUserId: ATTACKER_B,
				organizationId: "org_b",
				email: `${ATTACKER_B}@test.com`,
				createdAt: now,
				updatedAt: now,
			});
		});

		const asAttacker = t.withIdentity({ subject: ATTACKER_B });
		const { linkId } = await asAttacker.mutation(api.sharedLinks.create, {
			resourceId: "some-resource",
			allowDownload: false,
		});

		const stored = await t.run(async (ctx) => await ctx.db.get(linkId));
		expect(stored?.organizationId).toBe("org_b");
	});
});

describe("Class 2: skills.importFromUrl cross-tenant", () => {
	it("rejects writing into a workspace the caller does not own/belong to", async () => {
		const t = makeT();
		const { workspaceId: orgAWorkspaceId } = await seedOrgAGraph(t);
		await seedOrgBWorkspace(t);

		const asAttacker = t.withIdentity({ subject: ATTACKER_B });
		await expect(
			asAttacker.action(api.skills.importFromUrl, {
				workspaceId: orgAWorkspaceId,
				url: "https://example.com/does-not-matter-should-reject-before-fetch.md",
				category: "development",
				visibility: "workspace",
			}),
		).rejects.toThrow(/Unauthorized/);
	});
});

// ============================================================================
// CLASS 3 — accepts clerkUserId as a plain argument, never compares to caller
// ============================================================================

describe("Class 3: credits.getUserCredits / hasEnoughCredits / getTransactionHistory", () => {
	let t: ReturnType<typeof makeT>;

	beforeEach(async () => {
		t = makeT();
		const now = Date.now();
		await t.run(async (ctx) => {
			await ctx.db.insert("users", {
				clerkUserId: OWNER_A,
				organizationId: undefined,
				email: `${OWNER_A}@test.com`,
				createdAt: now,
				updatedAt: now,
			});
			await ctx.db.insert("userCredits", {
				clerkUserId: OWNER_A,
				balance: 9999,
				totalPurchased: 9999,
				totalUsed: 0,
				totalBonusReceived: 0,
				createdAt: now,
				updatedAt: now,
			});
			await ctx.db.insert("creditTransactions", {
				clerkUserId: OWNER_A,
				type: "purchase",
				amount: 9999,
				balanceAfter: 9999,
				description: "victim's secret purchase",
				timestamp: now,
			});
		});
	});

	it("getUserCredits rejects a caller reading another user's balance", async () => {
		const asAttacker = t.withIdentity({ subject: ATTACKER_B });
		await expect(
			asAttacker.query(api.credits.getUserCredits, { clerkUserId: OWNER_A }),
		).rejects.toThrow(/Unauthorized/);
	});

	it("getUserCredits rejects an unauthenticated caller entirely", async () => {
		await expect(
			t.query(api.credits.getUserCredits, { clerkUserId: OWNER_A }),
		).rejects.toThrow(/Unauthorized|Authentication required/);
	});

	it("hasEnoughCredits rejects a caller reading another user's balance", async () => {
		const asAttacker = t.withIdentity({ subject: ATTACKER_B });
		await expect(
			asAttacker.query(api.credits.hasEnoughCredits, {
				clerkUserId: OWNER_A,
				actionType: "chat",
			}),
		).rejects.toThrow(/Unauthorized/);
	});

	it("getTransactionHistory rejects a caller reading another user's transactions", async () => {
		const asAttacker = t.withIdentity({ subject: ATTACKER_B });
		await expect(
			asAttacker.query(api.credits.getTransactionHistory, {
				clerkUserId: OWNER_A,
			}),
		).rejects.toThrow(/Unauthorized/);
	});
});

describe("Class 3: subscriptions.getByClerkUserId / getFormattedSubscription", () => {
	let t: ReturnType<typeof makeT>;

	beforeEach(async () => {
		t = makeT();
		const now = Date.now();
		await t.run(async (ctx) => {
			await ctx.db.insert("users", {
				clerkUserId: OWNER_A,
				organizationId: "org_a",
				email: `${OWNER_A}@test.com`,
				createdAt: now,
				updatedAt: now,
			});
			await ctx.db.insert("subscriptions", {
				clerkUserId: OWNER_A,
				organizationId: "org_a",
				tierKey: "tier_1",
				polarSubscriptionId: "sub_victim",
				polarCustomerId: "cus_victim_billing_pii",
				polarProductId: "prod_victim",
				status: "active",
				currentPeriodStart: now,
				currentPeriodEnd: now + 1000 * 60 * 60 * 24 * 30,
				cancelAtPeriodEnd: false,
				plan: {
					name: "Starter",
					tier: "starter",
					monthlyCredits: 200,
					features: [],
				},
				createdAt: now,
				updatedAt: now,
			});
		});
	});

	it("getByClerkUserId rejects a caller reading another user's subscription/billing PII", async () => {
		const asAttacker = t.withIdentity({ subject: ATTACKER_B });
		await expect(
			asAttacker.query(api.subscriptions.getByClerkUserId, {
				clerkUserId: OWNER_A,
			}),
		).rejects.toThrow(/Unauthorized/);
	});

	it("getByClerkUserId rejects an unauthenticated caller entirely", async () => {
		await expect(
			t.query(api.subscriptions.getByClerkUserId, { clerkUserId: OWNER_A }),
		).rejects.toThrow(/Unauthorized|Authentication required/);
	});

	it("getFormattedSubscription rejects a caller reading another user's subscription/billing PII", async () => {
		const asAttacker = t.withIdentity({ subject: ATTACKER_B });
		await expect(
			asAttacker.query(api.subscriptions.getFormattedSubscription, {
				clerkUserId: OWNER_A,
			}),
		).rejects.toThrow(/Unauthorized/);
	});
});

// ============================================================================
// Sanity: legitimate same-tenant access still works after the fix (no
// false-positive lockout of the owner's own data).
// ============================================================================

describe("Sanity: owner can still read/act on their own rows post-fix", () => {
	it("agents.get succeeds for the owning workspace's own member", async () => {
		const t = makeT();
		const { agentId } = await seedOrgAGraph(t);
		const asOwner = t.withIdentity({ subject: OWNER_A });
		const result = await asOwner.query(api.agents.get, { agentId });
		expect(result?._id).toBe(agentId);
	});

	it("credits.getUserCredits succeeds for the credit owner themselves", async () => {
		const t = makeT();
		const now = Date.now();
		await t.run(async (ctx) => {
			await ctx.db.insert("users", {
				clerkUserId: OWNER_A,
				organizationId: undefined,
				email: `${OWNER_A}@test.com`,
				createdAt: now,
				updatedAt: now,
			});
			await ctx.db.insert("userCredits", {
				clerkUserId: OWNER_A,
				balance: 100,
				totalPurchased: 100,
				totalUsed: 0,
				totalBonusReceived: 0,
				createdAt: now,
				updatedAt: now,
			});
		});
		const asOwner = t.withIdentity({ subject: OWNER_A });
		const result = await asOwner.query(api.credits.getUserCredits, {
			clerkUserId: OWNER_A,
		});
		expect(result.balance).toBe(100);
	});
});
