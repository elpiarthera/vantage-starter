/**
 * Static source analysis tests for convex/voiceModels.ts
 *
 * Verifies sprint-39 cleanup:
 * - listVoiceHistory deleted (was reading stale voiceToolHistory table)
 * - listVoicesByProject deleted (same)
 * - listVoiceHistoryFromTracks present and auth-gated
 * - listVoicesByProjectFromTracks present and auth-gated
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
	path.resolve(process.cwd(), "convex/voiceModels.ts"),
	"utf-8",
);

describe("voiceModels.ts — deleted legacy queries", () => {
	it("listVoiceHistory is NOT present in source", () => {
		expect(source).not.toMatch(/export const listVoiceHistory\b/);
	});

	it("listVoicesByProject is NOT present in source", () => {
		expect(source).not.toMatch(/export const listVoicesByProject\b/);
	});
});

describe("voiceModels.ts — replacement queries from audioTracks", () => {
	describe("listVoiceHistoryFromTracks", () => {
		it("is exported from source", () => {
			expect(source).toMatch(/export const listVoiceHistoryFromTracks\b/);
		});

		it("calls ctx.auth.getUserIdentity", () => {
			// Extract the function body for listVoiceHistoryFromTracks
			const fnStart = source.indexOf("export const listVoiceHistoryFromTracks");
			const fnEnd = source.indexOf(
				"export const listVoicesByProjectFromTracks",
			);
			const fnBody = source.slice(fnStart, fnEnd);
			expect(fnBody).toMatch(/ctx\.auth\.getUserIdentity\(\)/);
		});
	});

	describe("listVoicesByProjectFromTracks", () => {
		it("is exported from source", () => {
			expect(source).toMatch(/export const listVoicesByProjectFromTracks\b/);
		});

		it("calls ctx.auth.getUserIdentity", () => {
			const fnStart = source.indexOf(
				"export const listVoicesByProjectFromTracks",
			);
			const fnBody = source.slice(fnStart);
			expect(fnBody).toMatch(/ctx\.auth\.getUserIdentity\(\)/);
		});
	});
});
