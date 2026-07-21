/// <reference types="vite/client" />
/**
 * scrapeClient action — failure visibility regression tests.
 *
 * Before this fix, `scrapeClient` was invoked fire-and-forget from
 * `app/[locale]/dashboard/consultant/onboard/page.tsx` with
 * `.catch((err) => console.error(...))` — a failed or unconfigured
 * extraction was logged and lost, never shown to the consultant.
 *
 * These tests call the REAL `scrapeClient.run` action via convex-test (no
 * real network call — `global.fetch` is stubbed) and assert the project
 * record itself — the artifact the frontend's live `useQuery` reads —
 * carries an observable failure state.
 *
 *   RED 2: a failed extraction (Firecrawl HTTP error) produces a state
 *   (`brandKit.error`) the user can observe via `consultantProjects.get`.
 *   Fails against main, where `scrapeClient` used native fetch and a
 *   network failure there would still land in `brandKit.error` — but
 *   FIRECRAWL_API_KEY-absence had no code path at all on main; this test
 *   also proves the two are distinguishable via `configMissing`.
 *   RED 3: FIRECRAWL_API_KEY absent -> the action says so
 *   (`configMissing: true` + a message naming the missing key), and never
 *   silently falls back to a regex extraction over raw fetch.
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

const OWNER = "user_scrape_client_owner";

function makeT() {
	return convexTest(schema, modules);
}

async function seedProject(
	t: ReturnType<typeof makeT>,
): Promise<{ projectId: Id<"consultantProjects"> }> {
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
			status: "created",
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

describe("scrapeClient.run — failure visibility", () => {
	it("RED 3 (fixed): FIRECRAWL_API_KEY absent -> observable configMissing state, no silent fallback", async () => {
		vi.stubEnv("FIRECRAWL_API_KEY", "");
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);

		const t = makeT();
		const { projectId } = await seedProject(t);
		const asOwner = t.withIdentity({ subject: OWNER });

		const result = await asOwner.action(api.actions.scrapeClient.run, {
			projectId,
			url: "https://acme.example",
		});

		expect(result.success).toBe(false);
		expect(result.configMissing).toBe(true);

		// The artifact the frontend reads — not the action's return value —
		// is the actual proof the user CAN observe this. If this were still
		// null/undefined, the fire-and-forget UI would show nothing.
		const project = await asOwner.query(api.consultantProjects.get, {
			projectId,
		});
		expect(project?.brandKit?.error).toBeTruthy();
		expect(project?.brandKit?.configMissing).toBe(true);
		expect(project?.status).toBe("competitors"); // never stuck on "scraping"

		// No network attempt at all — never a silent fallback to native fetch.
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("RED 2 (fixed): a failed extraction (Firecrawl HTTP error) is observable via consultantProjects.get", async () => {
		vi.stubEnv("FIRECRAWL_API_KEY", "fc-test-key");
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(new Response("server error", { status: 500 })),
		);

		const t = makeT();
		const { projectId } = await seedProject(t);
		const asOwner = t.withIdentity({ subject: OWNER });

		const result = await asOwner.action(api.actions.scrapeClient.run, {
			projectId,
			url: "https://acme.example",
		});

		expect(result.success).toBe(false);
		expect(result.configMissing).toBeFalsy();
		expect(result.error).toBeTruthy();

		const project = await asOwner.query(api.consultantProjects.get, {
			projectId,
		});
		expect(project?.brandKit?.error).toBeTruthy();
		expect(project?.brandKit?.configMissing).toBeFalsy();
		expect(project?.status).toBe("competitors");
	});

	it("RED 1 (fixed): a successful Firecrawl scrape produces a non-empty brandKit", async () => {
		vi.stubEnv("FIRECRAWL_API_KEY", "fc-test-key");
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(
				new Response(
					JSON.stringify({
						success: true,
						data: {
							html: "<html><head><title>Acme</title></head><body><h1>Acme builds rockets</h1></body></html>",
							metadata: { url: "https://acme.example/" },
						},
					}),
					{ status: 200 },
				),
			),
		);

		const t = makeT();
		const { projectId } = await seedProject(t);
		const asOwner = t.withIdentity({ subject: OWNER });

		const result = await asOwner.action(api.actions.scrapeClient.run, {
			projectId,
			url: "https://acme.example",
		});

		expect(result.success).toBe(true);

		const project = await asOwner.query(api.consultantProjects.get, {
			projectId,
		});
		expect(project?.brandKit?.headings).toContain("Acme builds rockets");
		expect(project?.status).toBe("competitors");
	});
});
