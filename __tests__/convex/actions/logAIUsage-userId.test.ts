/**
 * Tests: logAIUsage userId propagation in Convex action files
 *
 * Root cause of the bug: logAIUsage's hardened handler requires either a
 * caller-supplied userId OR an authenticated identity. Scheduled/server-side
 * Convex actions run without a Clerk identity (ctx.auth.getUserIdentity()
 * returns null), so they MUST pass userId explicitly.
 *
 * These tests verify — via static source analysis — that every logAIUsage call
 * in every action file passes a userId field, and that actions without an
 * existing identity guard now have one.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ACTIONS_DIR = path.resolve(process.cwd(), "convex/actions");

function readAction(filename: string): string {
	return fs.readFileSync(path.join(ACTIONS_DIR, filename), "utf-8");
}

/**
 * Returns all logAIUsage call blocks from a source file.
 * A "block" is the content of the object literal passed to logAIUsage.
 */
function extractLogAIUsageBlocks(source: string): string[] {
	const blocks: string[] = [];
	const regex = /logAIUsage\s*,\s*\{([\s\S]*?)\}\s*\)/g;
	let match = regex.exec(source);
	while (match !== null) {
		blocks.push(match[1]);
		match = regex.exec(source);
	}
	return blocks;
}

// ─── Per-file tests ────────────────────────────────────────────────────────────

describe("logAIUsage userId propagation", () => {
	describe("videoAssembly.ts", () => {
		const source = readAction("videoAssembly.ts");
		const blocks = extractLogAIUsageBlocks(source);

		it("has at least one logAIUsage call", () => {
			expect(blocks.length).toBeGreaterThanOrEqual(1);
		});

		it("every logAIUsage call includes userId", () => {
			for (const block of blocks) {
				expect(block).toMatch(/userId\s*:/);
			}
		});

		it("handler has ctx.auth.getUserIdentity() guard", () => {
			expect(source).toMatch(/ctx\.auth\.getUserIdentity\(\)/);
			expect(source).toMatch(/throw new Error\("Not authenticated"\)/);
		});

		it("userId comes from identity.subject", () => {
			expect(source).toMatch(/userId\s*:\s*identity\.subject/);
		});
	});

	describe("imageGeneration.ts", () => {
		const source = readAction("imageGeneration.ts");
		const blocks = extractLogAIUsageBlocks(source);

		it("has at least one logAIUsage call", () => {
			expect(blocks.length).toBeGreaterThanOrEqual(1);
		});

		it("every logAIUsage call includes userId", () => {
			for (const block of blocks) {
				expect(block).toMatch(/userId\s*:/);
			}
		});

		it("userId comes from identity.subject", () => {
			expect(source).toMatch(/userId\s*:\s*identity\.subject/);
		});
	});

	describe("videoGeneration.ts", () => {
		const source = readAction("videoGeneration.ts");
		const blocks = extractLogAIUsageBlocks(source);

		it("has at least one logAIUsage call", () => {
			expect(blocks.length).toBeGreaterThanOrEqual(1);
		});

		it("every logAIUsage call includes userId", () => {
			for (const block of blocks) {
				expect(block).toMatch(/userId\s*:/);
			}
		});

		it("userId comes from identity.subject", () => {
			expect(source).toMatch(/userId\s*:\s*identity\.subject/);
		});
	});

	describe("videoRegeneration.ts", () => {
		const source = readAction("videoRegeneration.ts");
		const blocks = extractLogAIUsageBlocks(source);

		it("has at least one logAIUsage call", () => {
			expect(blocks.length).toBeGreaterThanOrEqual(1);
		});

		it("every logAIUsage call includes userId", () => {
			for (const block of blocks) {
				expect(block).toMatch(/userId\s*:/);
			}
		});

		it("userId comes from identity.subject", () => {
			expect(source).toMatch(/userId\s*:\s*identity\.subject/);
		});
	});

	describe("aiChat.ts", () => {
		const source = readAction("aiChat.ts");
		const blocks = extractLogAIUsageBlocks(source);

		it("has at least 2 logAIUsage calls (success + error paths)", () => {
			expect(blocks.length).toBeGreaterThanOrEqual(2);
		});

		it("every logAIUsage call includes userId", () => {
			for (const block of blocks) {
				expect(block).toMatch(/userId\s*:/);
			}
		});

		it("userId comes from identity.subject", () => {
			expect(source).toMatch(/userId\s*:\s*identity\.subject/);
		});
	});

	describe("videoPolling.ts", () => {
		const source = readAction("videoPolling.ts");
		const blocks = extractLogAIUsageBlocks(source);

		it("has at least 2 logAIUsage calls (success + error paths)", () => {
			expect(blocks.length).toBeGreaterThanOrEqual(2);
		});

		it("every logAIUsage call includes userId", () => {
			for (const block of blocks) {
				expect(block).toMatch(/userId\s*:/);
			}
		});

		it("uses identity.subject (Clerk user ID from auth context)", () => {
			expect(source).toMatch(/userId\s*:\s*identity\.subject/);
			expect(source).not.toMatch(/userId\s*:\s*scene\.userId/);
		});

		it("handler has ctx.auth.getUserIdentity() guard", () => {
			expect(source).toMatch(/ctx\.auth\.getUserIdentity\(\)/);
			expect(source).toMatch(/throw new Error\("Not authenticated"\)/);
		});
	});

	describe("musicGeneration.ts", () => {
		const source = readAction("musicGeneration.ts");
		const blocks = extractLogAIUsageBlocks(source);

		it("has at least one logAIUsage call", () => {
			expect(blocks.length).toBeGreaterThanOrEqual(1);
		});

		it("every logAIUsage call includes userId", () => {
			for (const block of blocks) {
				expect(block).toMatch(/userId\s*:/);
			}
		});

		it("handler has ctx.auth.getUserIdentity() guard added", () => {
			expect(source).toMatch(/ctx\.auth\.getUserIdentity\(\)/);
			expect(source).toMatch(/throw new Error\("Not authenticated"\)/);
		});

		it("userId comes from identity.subject", () => {
			expect(source).toMatch(/userId\s*:\s*identity\.subject/);
		});
	});

	describe("narrationGeneration.ts", () => {
		const source = readAction("narrationGeneration.ts");
		const blocks = extractLogAIUsageBlocks(source);

		it("has at least 3 logAIUsage calls (retry + success + fallback paths)", () => {
			expect(blocks.length).toBeGreaterThanOrEqual(3);
		});

		it("every logAIUsage call includes userId", () => {
			for (const block of blocks) {
				expect(block).toMatch(/userId\s*:/);
			}
		});

		it("handler has ctx.auth.getUserIdentity() guard added", () => {
			expect(source).toMatch(/ctx\.auth\.getUserIdentity\(\)/);
			expect(source).toMatch(/throw new Error\("Not authenticated"\)/);
		});

		it("userId comes from identity.subject", () => {
			expect(source).toMatch(/userId\s*:\s*identity\.subject/);
		});
	});
});

// ─── Voice action files ────────────────────────────────────────────────────────

describe("voiceToolGeneric.ts", () => {
	const source = readAction("voiceToolGeneric.ts");
	const blocks = extractLogAIUsageBlocks(source);

	it("has at least one logAIUsage call", () => {
		expect(blocks.length).toBeGreaterThanOrEqual(1);
	});

	it("every logAIUsage call includes userId", () => {
		for (const block of blocks) {
			expect(block).toMatch(/userId\s*:/);
		}
	});

	it("passes userId: args.clerkUserId to logAIUsage", () => {
		expect(source).toMatch(/userId\s*:\s*args\.clerkUserId/);
	});

	it("does NOT pass a raw Convex _id from a document fetch (no scene.userId pattern)", () => {
		expect(source).not.toMatch(/userId\s*:\s*\w+\.userId/);
	});
});

describe("voiceProcessing.ts", () => {
	const source = readAction("voiceProcessing.ts");
	const blocks = extractLogAIUsageBlocks(source);

	it("has at least one logAIUsage call", () => {
		expect(blocks.length).toBeGreaterThanOrEqual(1);
	});

	it("every logAIUsage call includes userId", () => {
		for (const block of blocks) {
			expect(block).toMatch(/userId\s*:/);
		}
	});

	it("passes userId: args.clerkUserId to logAIUsage", () => {
		expect(source).toMatch(/userId\s*:\s*args\.clerkUserId/);
	});

	it("does NOT pass a raw Convex _id from a document fetch (no scene.userId pattern)", () => {
		expect(source).not.toMatch(/userId\s*:\s*\w+\.userId/);
	});
});

// ─── usageTracking.ts handler logic ────────────────────────────────────────────

describe("usageTracking.ts logAIUsage handler", () => {
	const source = fs.readFileSync(
		path.resolve(process.cwd(), "convex/usageTracking.ts"),
		"utf-8",
	);

	it("accepts optional userId arg", () => {
		expect(source).toMatch(/userId\s*:\s*v\.optional\(v\.string\(\)\)/);
	});

	it("falls back to identity.subject when userId not provided", () => {
		expect(source).toMatch(/userId\s*=\s*identity\.subject/);
	});

	it("throws when no userId and no identity", () => {
		expect(source).toMatch(
			/throw new Error\("Not authenticated and no userId provided"\)/,
		);
	});

	it("rejects userId mismatch against authenticated identity", () => {
		expect(source).toMatch(
			/throw new Error\("Unauthorized: userId mismatch"\)/,
		);
	});
});
