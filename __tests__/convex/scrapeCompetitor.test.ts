/// <reference types="vite/client" />
/**
 * scrapeCompetitor action — failure visibility regression tests.
 *
 * Mirrors __tests__/convex/scrapeClient.test.ts for the competitor scrape
 * path. `global.fetch` is stubbed — no real network call is ever made by
 * this suite.
 */

import { convexTest } from "convex-test";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import schema from "../../convex/schema";

const modules = import.meta.glob([
	"../../convex/**/*.ts",
	"../../convex/**/*.js",
	"!../../convex/**/*.d.ts",
]);

const OWNER = "user_scrape_competitor_owner";

function makeT() {
	return convexTest(schema, modules);
}

async function seedProjectWithCompetitor(t: ReturnType<typeof makeT>): Promise<{
	projectId: Id<"consultantProjects">;
}> {
	return await t.run(async (ctx) => {
		const now = Date.now();
		const workspaceId = await ctx.db.insert("workspaces", {
			organizationId: "personal",
			ownerId: OWNER,
			name: "test workspace",
			createdAt: now,
			updatedAt: now,
		});
		const projectId = await ctx.db.insert("consultantProjects", {
			workspaceId,
			name: "Project",
			clientName: "Acme",
			clientWebsiteUrl: "https://acme.example",
			sector: "technology",
			status: "competitors",
			competitors: [{ name: "Rival Inc", url: "https://rival.example" }],
			createdBy: OWNER,
			createdAt: now,
			updatedAt: now,
		});
		return { projectId };
	});
}

afterEach(() => {
	vi.unstubAllGlobals();
	vi.unstubAllEnvs();
});

describe("scrapeCompetitor.run — failure visibility", () => {
	it("RED 3 (fixed): FIRECRAWL_API_KEY absent -> observable configMissing state on the competitor profile", async () => {
		vi.stubEnv("FIRECRAWL_API_KEY", "");
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);

		const t = makeT();
		const { projectId } = await seedProjectWithCompetitor(t);
		const asOwner = t.withIdentity({ subject: OWNER });

		const result = await asOwner.action(api.actions.scrapeCompetitor.run, {
			projectId,
			competitorIndex: 0,
			url: "https://rival.example",
		});

		expect(result.success).toBe(false);
		expect(result.configMissing).toBe(true);

		const project = await asOwner.query(api.consultantProjects.get, {
			projectId,
		});
		expect(project?.competitors?.[0]?.error).toBeTruthy();
		expect(project?.competitors?.[0]?.configMissing).toBe(true);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("RED 2 (fixed): a failed extraction is observable on the competitor profile", async () => {
		vi.stubEnv("FIRECRAWL_API_KEY", "fc-test-key");
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(new Response("server error", { status: 500 })),
		);

		const t = makeT();
		const { projectId } = await seedProjectWithCompetitor(t);
		const asOwner = t.withIdentity({ subject: OWNER });

		const result = await asOwner.action(api.actions.scrapeCompetitor.run, {
			projectId,
			competitorIndex: 0,
			url: "https://rival.example",
		});

		expect(result.success).toBe(false);
		expect(result.configMissing).toBeFalsy();

		const project = await asOwner.query(api.consultantProjects.get, {
			projectId,
		});
		expect(project?.competitors?.[0]?.error).toBeTruthy();
		expect(project?.competitors?.[0]?.configMissing).toBeFalsy();
	});

	it("RED 1 (fixed): a successful Firecrawl scrape produces a non-empty competitor profile", async () => {
		vi.stubEnv("FIRECRAWL_API_KEY", "fc-test-key");
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(
				new Response(
					JSON.stringify({
						success: true,
						data: {
							html: '<html><head><meta property="og:description" content="Rival Inc — the only rocket company you need."></head><body></body></html>',
							metadata: { url: "https://rival.example/" },
						},
					}),
					{ status: 200 },
				),
			),
		);

		const t = makeT();
		const { projectId } = await seedProjectWithCompetitor(t);
		const asOwner = t.withIdentity({ subject: OWNER });

		const result = await asOwner.action(api.actions.scrapeCompetitor.run, {
			projectId,
			competitorIndex: 0,
			url: "https://rival.example",
		});

		expect(result.success).toBe(true);

		const project = await asOwner.query(api.consultantProjects.get, {
			projectId,
		});
		expect(project?.competitors?.[0]?.positioning).toBeTruthy();
	});
});
