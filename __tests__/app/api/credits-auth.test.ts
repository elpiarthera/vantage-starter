/**
 * Integration tests: API routes must pass a Clerk JWT to all Convex fetchMutation calls
 *
 * Root cause of issue #165:
 *   fetchMutation called from Next.js API routes (server-side) does NOT carry a Clerk
 *   session automatically. ctx.auth.getUserIdentity() returns null unless a { token }
 *   option with a valid Clerk JWT (getToken({ template: "convex" })) is passed.
 *
 * Tests cover:
 *   1. Clerk → Convex auth bridge: getToken + { token } on ALL credit + tracking calls
 *   2. refundCreditsPublic ownership check (identity.subject === transaction.clerkUserId)
 *   3. saveGeneratedStory: ctx.auth identity mismatch guard
 *   4. projects.get fetchQuery carries { token }
 *   5. logAIUsage calls carry { token }
 *   6. No raw api.credits.deductCredits calls (must be internal)
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(process.cwd());

function readRoute(relPath: string): string {
	return readFileSync(join(ROOT, relPath), "utf-8");
}

function countOccurrences(source: string, pattern: RegExp): number {
	return (source.match(pattern) ?? []).length;
}

// ─── routes under test ──────────────────────────────────────────────────────

const ROUTES = [
	"app/api/step1/generate-story/route.ts",
	"app/api/step1/refine-story/route.ts",
	"app/api/chat/route.ts",
] as const;

// ─── 1. Clerk → Convex auth bridge ──────────────────────────────────────────

describe("API routes: Clerk → Convex auth bridge", () => {
	for (const routePath of ROUTES) {
		describe(routePath, () => {
			const source = readRoute(routePath);

			it("imports auth from @clerk/nextjs/server", () => {
				expect(source).toMatch(/from ['"]@clerk\/nextjs\/server['"]/);
			});

			it("stores authResult to call getToken on it", () => {
				expect(source).toMatch(/const authResult\s*=\s*await auth\(\)/);
			});

			it("calls getToken({ template: 'convex' }) to obtain a Convex JWT", () => {
				expect(source).toMatch(/getToken\(\s*\{\s*template:\s*['"]convex['"]/);
			});

			it("declares convexToken with let at function scope (accessible in catch)", () => {
				expect(source).toMatch(/let convexToken/);
			});

			it("does not call api.credits.deductCredits directly (internalMutation only)", () => {
				expect(
					countOccurrences(source, /api\.credits\.deductCredits(?!Public)/g),
				).toBe(0);
			});

			it("passes { token: convexToken } to deductCreditsPublic", () => {
				expect(source).toMatch(/deductCreditsPublic/);
				expect(source).toMatch(
					/deductCreditsPublic[\s\S]{0,300}\{\s*token:\s*convexToken\s*\}/,
				);
			});

			it("passes { token: convexToken } to every refundCreditsPublic call", () => {
				const total = countOccurrences(source, /refundCreditsPublic/g);
				if (total === 0) return;
				// Count call sites that include the token option — each is wrapped in its own block
				const withToken = countOccurrences(
					source,
					/refundCreditsPublic[\s\S]{0,300}\{\s*token:\s*convexToken\s*\}/g,
				);
				expect(withToken).toBe(total);
			});

			it("passes { token: convexToken } to every logAIUsage call", () => {
				const total = countOccurrences(source, /logAIUsage/g);
				if (total === 0) return;
				const withToken = countOccurrences(
					source,
					/logAIUsage[\s\S]{0,400}\{\s*token:\s*convexToken\s*\}/g,
				);
				expect(withToken).toBe(total);
			});

			it("returns 401 when user is not authenticated", () => {
				expect(source).toMatch(/if\s*\(!userId\)/);
				expect(source).toMatch(/status:\s*401/);
			});
		});
	}
});

// ─── 2. generate-story: all Convex calls carry { token } ────────────────────

describe("generate-story/route.ts: complete token coverage", () => {
	const source = readRoute("app/api/step1/generate-story/route.ts");

	it("passes { token: convexToken } to projects.get fetchQuery", () => {
		expect(source).toMatch(
			/api\.projects\.get[\s\S]{0,200}\{\s*token:\s*convexToken\s*\}/,
		);
	});

	it("passes { token: convexToken } to saveGeneratedStory", () => {
		expect(source).toMatch(
			/saveGeneratedStory[\s\S]{0,300}\{\s*token:\s*convexToken\s*\}/,
		);
	});
});

// ─── 3. refundCreditsPublic: ownership check ─────────────────────────────────

describe("convex/credits.ts: refundCreditsPublic ownership check", () => {
	const creditsSource = readRoute("convex/credits.ts");

	it("checks identity is authenticated before refunding", () => {
		// Must call getUserIdentity and throw if null
		expect(creditsSource).toMatch(
			/refundCreditsPublic[\s\S]{0,400}getUserIdentity\(\)/,
		);
		expect(creditsSource).toMatch(
			/refundCreditsPublic[\s\S]{0,500}Not authenticated/,
		);
	});

	it("verifies the caller owns the transaction (identity.subject check)", () => {
		// Must compare identity.subject to originalTransaction.clerkUserId
		expect(creditsSource).toMatch(
			/originalTransaction\.clerkUserId\s*!==\s*identity\.subject/,
		);
	});

	it("throws Unauthorized when subject does not match transaction owner", () => {
		expect(creditsSource).toMatch(/transaction belongs to a different user/);
	});
});

// ─── 4. saveGeneratedStory: ctx.auth identity mismatch guard ────────────────

describe("convex/projects.ts: saveGeneratedStory identity guard", () => {
	const projectsSource = readRoute("convex/projects.ts");

	it("saveGeneratedStory function exists and calls ctx.auth.getUserIdentity()", () => {
		// Both patterns must exist in the file — saveGeneratedStory and getUserIdentity
		expect(projectsSource).toMatch(/saveGeneratedStory/);
		expect(projectsSource).toMatch(
			/getUserIdentity[\s\S]{0,200}identity mismatch/,
		);
	});

	it("throws on identity subject mismatch with clerkUserId arg", () => {
		expect(projectsSource).toMatch(/identity mismatch/);
	});

	it("still performs DB-level ownership check as defence-in-depth", () => {
		expect(projectsSource).toMatch(/you don't own this project/);
	});
});

// ─── 5. convex/credits.ts: public vs internal boundary ──────────────────────

describe("convex/credits.ts: public/internal boundary", () => {
	const creditsSource = readRoute("convex/credits.ts");

	it("deductCredits is internalMutation", () => {
		expect(creditsSource).toMatch(
			/export const deductCredits\s*=\s*internalMutation/,
		);
		expect(
			creditsSource.match(/export const deductCredits\s*=\s*mutation\s*\(/),
		).toBeNull();
	});

	it("refundCredits is internalMutation", () => {
		expect(creditsSource).toMatch(
			/export const refundCredits\s*=\s*internalMutation/,
		);
		expect(
			creditsSource.match(/export const refundCredits\s*=\s*mutation\s*\(/),
		).toBeNull();
	});

	it("deductCreditsPublic is a public mutation", () => {
		expect(creditsSource).toMatch(
			/export const deductCreditsPublic\s*=\s*mutation\s*\(/,
		);
	});

	it("refundCreditsPublic is a public mutation", () => {
		expect(creditsSource).toMatch(
			/export const refundCreditsPublic\s*=\s*mutation\s*\(/,
		);
	});

	it("deductCreditsPublic checks auth identity", () => {
		expect(creditsSource).toMatch(
			/deductCreditsPublic[\s\S]{0,400}Not authenticated/,
		);
	});

	it("deductCreditsPublic checks identity.subject matches clerkUserId arg", () => {
		expect(creditsSource).toMatch(
			/identity\.subject\s*!==\s*args\.clerkUserId/,
		);
	});
});

// ─── 6. Convex actions: use internal.credits.* not api.credits.* ────────────

describe("Convex actions: no direct api.credits.* calls", () => {
	const internalActionFiles = [
		"convex/actions/imageToolGeneric.ts",
		"convex/actions/voiceToolGeneric.ts",
		"convex/actions/voiceProcessing.ts",
		"convex/actions/videoAssembly.ts",
		"convex/imageTool.ts",
		"convex/voiceTool.ts",
	];

	for (const filePath of internalActionFiles) {
		it(`${filePath}: no api.credits.deductCredits (must use internal.*)`, () => {
			const source = readRoute(filePath);
			expect(
				countOccurrences(source, /api\.credits\.deductCredits(?!Public)/g),
			).toBe(0);
		});

		it(`${filePath}: no api.credits.refundCredits (must use internal.*)`, () => {
			const source = readRoute(filePath);
			expect(
				countOccurrences(source, /api\.credits\.refundCredits(?!Public)/g),
			).toBe(0);
		});
	}
});
