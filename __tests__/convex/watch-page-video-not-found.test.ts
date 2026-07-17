/**
 * Tests for GitHub issue #175: "Final video share link returns Video Not Found"
 *
 * Root cause: project.status remained "draft" after video assembly because
 * updateFinalVideo mutation never set status: "completed". The getPublic query
 * returns null when status === "draft", showing "Video Not Found" on the watch page.
 *
 * Fix: updateFinalVideo now sets status: "completed" alongside the final video URL.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

const projectsSource = fs.readFileSync(
	path.join(process.cwd(), "convex/projects.ts"),
	"utf-8",
);

describe("Issue #175 — watch page Video Not Found fix", () => {
	test("updateFinalVideo mutation sets status: 'completed' when writing finalVideoUrl", () => {
		// Find the updateFinalVideo mutation handler
		const updateFinalVideoIdx = projectsSource.indexOf("updateFinalVideo");
		expect(updateFinalVideoIdx).toBeGreaterThan(-1);

		// Get the section of code after the mutation definition
		const afterMutation = projectsSource.slice(updateFinalVideoIdx);

		// Find the db.patch call within this mutation (first occurrence after the definition)
		const patchIdx = afterMutation.indexOf("ctx.db.patch");
		expect(patchIdx).toBeGreaterThan(-1);

		// Extract the patch block (large enough to capture all fields including the comment)
		const patchBlock = afterMutation.slice(patchIdx, patchIdx + 700);

		// The patch must include status: "completed"
		expect(patchBlock).toContain('status: "completed"');
	});

	test("getPublic query returns null when status is 'draft' (guard is correct)", () => {
		// Find the getPublic query
		const getPublicIdx = projectsSource.indexOf("export const getPublic");
		expect(getPublicIdx).toBeGreaterThan(-1);

		const afterGetPublic = projectsSource.slice(
			getPublicIdx,
			getPublicIdx + 600,
		);

		// Guard should check status === "draft" (not status !== "completed")
		// so that "in_progress" projects with a finalVideoUrl are accessible
		expect(afterGetPublic).toContain('status === "draft"');
		expect(afterGetPublic).not.toContain('status !== "completed"');
	});

	test("updateFinalVideo also sets finalVideoUrl and assemblyStatus", () => {
		const updateFinalVideoIdx = projectsSource.indexOf("updateFinalVideo");
		const afterMutation = projectsSource.slice(updateFinalVideoIdx);
		const patchIdx = afterMutation.indexOf("ctx.db.patch");
		const patchBlock = afterMutation.slice(patchIdx, patchIdx + 700);

		expect(patchBlock).toContain("finalVideoUrl");
		expect(patchBlock).toContain("assemblyStatus");
		expect(patchBlock).toContain('status: "completed"');
	});
});
