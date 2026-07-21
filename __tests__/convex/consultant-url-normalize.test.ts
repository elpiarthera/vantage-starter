/// <reference types="vite/client" />
/**
 * Consultant onboarding — URL normalization regression tests.
 *
 * Real users type a bare domain ("perello.consulting") into the client
 * website field, never a fully-qualified URL. `convex/consultantProjects.ts`
 * used to validate with a bare `new URL(args.clientWebsiteUrl)`, which
 * throws on scheme-less input and blocked step 1 -> 2 of onboarding for
 * every real user. `create` now normalizes (adds `https://` when missing)
 * before validating and storing.
 *
 * These tests call the REAL `consultantProjects.create` mutation via
 * convex-test — not a reimplementation of the validation logic — so they
 * prove the actual mutation's behavior, not a copy of it.
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

const OWNER = "user_consultant_owner";

async function seedWorkspace(t: ReturnType<typeof makeT>) {
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
			name: "Consultant Workspace",
			isDefault: true,
			createdAt: now,
			updatedAt: now,
		});
		return { workspaceId };
	});
}

describe("consultantProjects.create — URL normalization", () => {
	let t: ReturnType<typeof makeT>;
	let workspaceId: Id<"workspaces">;

	beforeEach(async () => {
		t = makeT();
		({ workspaceId } = await seedWorkspace(t));
	});

	it("RED 1: accepts a scheme-less domain and stores a parseable URL", async () => {
		const asOwner = t.withIdentity({ subject: OWNER });
		const projectId = await asOwner.mutation(api.consultantProjects.create, {
			workspaceId,
			name: "Perello Project",
			clientName: "Perello Consulting",
			clientWebsiteUrl: "perello.consulting",
			sector: "consulting",
		});

		const stored = await t.run(async (ctx) => await ctx.db.get(projectId));
		expect(stored).not.toBeNull();
		// RED 3: the stored value is normalized, not the raw input.
		expect(stored?.clientWebsiteUrl).toBe("https://perello.consulting/");
		// The stored value must itself be parseable by `new URL` — this is
		// exactly what the downstream scrape actions require.
		expect(() => new URL(stored?.clientWebsiteUrl ?? "")).not.toThrow();
	});

	it("RED 2: rejects genuinely invalid input with the specific error", async () => {
		const asOwner = t.withIdentity({ subject: OWNER });
		await expect(
			asOwner.mutation(api.consultantProjects.create, {
				workspaceId,
				name: "Bad Project",
				clientName: "Bad Client",
				clientWebsiteUrl: "hello world",
				sector: "consulting",
			}),
		).rejects.toThrow(/Invalid clientWebsiteUrl: must be a valid URL/);
	});

	it("RED 2b: rejects an all-punctuation non-domain", async () => {
		const asOwner = t.withIdentity({ subject: OWNER });
		await expect(
			asOwner.mutation(api.consultantProjects.create, {
				workspaceId,
				name: "Bad Project 2",
				clientName: "Bad Client 2",
				clientWebsiteUrl: "....",
				sector: "consulting",
			}),
		).rejects.toThrow(/Invalid clientWebsiteUrl: must be a valid URL/);
	});

	it("RED 2c: rejects an empty string", async () => {
		const asOwner = t.withIdentity({ subject: OWNER });
		await expect(
			asOwner.mutation(api.consultantProjects.create, {
				workspaceId,
				name: "Bad Project 3",
				clientName: "Bad Client 3",
				clientWebsiteUrl: "   ",
				sector: "consulting",
			}),
		).rejects.toThrow(/Invalid clientWebsiteUrl: must be a valid URL/);
	});

	it("still accepts a fully-qualified URL unchanged in scheme", async () => {
		const asOwner = t.withIdentity({ subject: OWNER });
		const projectId = await asOwner.mutation(api.consultantProjects.create, {
			workspaceId,
			name: "Already Qualified",
			clientName: "Already Qualified Client",
			clientWebsiteUrl: "https://already-qualified.example",
			sector: "consulting",
		});
		const stored = await t.run(async (ctx) => await ctx.db.get(projectId));
		expect(stored?.clientWebsiteUrl).toBe("https://already-qualified.example/");
	});
});

describe("consultantProjects.update — URL normalization", () => {
	let t: ReturnType<typeof makeT>;
	let workspaceId: Id<"workspaces">;
	let projectId: Id<"consultantProjects">;

	beforeEach(async () => {
		t = makeT();
		({ workspaceId } = await seedWorkspace(t));
		const asOwner = t.withIdentity({ subject: OWNER });
		projectId = await asOwner.mutation(api.consultantProjects.create, {
			workspaceId,
			name: "Update Target",
			clientName: "Update Target Client",
			clientWebsiteUrl: "https://original.example",
			sector: "consulting",
		});
	});

	it("normalizes a scheme-less domain passed to update", async () => {
		const asOwner = t.withIdentity({ subject: OWNER });
		await asOwner.mutation(api.consultantProjects.update, {
			projectId,
			clientWebsiteUrl: "perello.consulting",
		});
		const stored = await t.run(async (ctx) => await ctx.db.get(projectId));
		expect(stored?.clientWebsiteUrl).toBe("https://perello.consulting/");
	});

	it("rejects genuinely invalid input on update", async () => {
		const asOwner = t.withIdentity({ subject: OWNER });
		await expect(
			asOwner.mutation(api.consultantProjects.update, {
				projectId,
				clientWebsiteUrl: "hello world",
			}),
		).rejects.toThrow(/Invalid clientWebsiteUrl: must be a valid URL/);
	});
});

describe("consultantProjects.addCompetitor — URL normalization", () => {
	let t: ReturnType<typeof makeT>;
	let workspaceId: Id<"workspaces">;
	let projectId: Id<"consultantProjects">;

	beforeEach(async () => {
		t = makeT();
		({ workspaceId } = await seedWorkspace(t));
		const asOwner = t.withIdentity({ subject: OWNER });
		projectId = await asOwner.mutation(api.consultantProjects.create, {
			workspaceId,
			name: "Competitor Host",
			clientName: "Competitor Host Client",
			clientWebsiteUrl: "https://host.example",
			sector: "consulting",
		});
	});

	it("normalizes a scheme-less competitor domain and stores it normalized", async () => {
		const asOwner = t.withIdentity({ subject: OWNER });
		const index = await asOwner.mutation(api.consultantProjects.addCompetitor, {
			projectId,
			name: "Rival Co",
			url: "rival.example",
		});
		const stored = await t.run(async (ctx) => await ctx.db.get(projectId));
		expect(stored?.competitors?.[index]?.url).toBe("https://rival.example/");
	});

	it("rejects genuinely invalid competitor URL input", async () => {
		const asOwner = t.withIdentity({ subject: OWNER });
		await expect(
			asOwner.mutation(api.consultantProjects.addCompetitor, {
				projectId,
				name: "Bad Rival",
				url: "hello world",
			}),
		).rejects.toThrow(/Invalid competitor URL: must be a valid URL/);
	});
});
