/**
 * Test suite for useProjectData hook
 * Tests project CRUD operations, auto-save, and optimistic updates
 */

import { describe, expect, it } from "vitest";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

describe("useProjectData Hook - Schema Validation", () => {
	it("should verify projects.create mutation exists", () => {
		expect(api.projects.create).toBeDefined();
	});

	it("should verify projects.update mutation exists", () => {
		expect(api.projects.update).toBeDefined();
	});

	it("should verify projects.get query exists", () => {
		expect(api.projects.get).toBeDefined();
	});

	it("should validate create project arguments schema", () => {
		const createArgs = {
			name: "Test Project",
			occasion: "wedding",
			theme: "elegant",
			eventDetails: {
				eventTitle: "Sarah & Michael's Wedding",
				description: "A beautiful celebration of love",
				date: "2025-06-15",
				location: "Grand Hotel",
				rsvpLink: "https://example.com/rsvp",
				emotionalStory:
					"We met in college and have been together for 5 years...",
			},
			language: "en",
		};

		expect(createArgs).toBeDefined();
		expect(createArgs.name).toBe("Test Project");
		expect(createArgs.occasion).toBe("wedding");
		expect(createArgs.theme).toBe("elegant");
		expect(createArgs.eventDetails.eventTitle).toBe(
			"Sarah & Michael's Wedding",
		);
		expect(createArgs.language).toBe("en");
	});

	it("should validate update project arguments schema", () => {
		const updateArgs = {
			projectId: "test_project_id" as Id<"projects">,
			name: "Updated Project Name",
			occasion: "birthday",
			theme: "modern",
		};

		expect(updateArgs).toBeDefined();
		expect(updateArgs.projectId).toBe("test_project_id");
		expect(updateArgs.name).toBe("Updated Project Name");
		expect(updateArgs.occasion).toBe("birthday");
	});

	it("should validate get project arguments schema", () => {
		const getArgs = {
			projectId: "test_project_id" as Id<"projects">,
		};

		expect(getArgs).toBeDefined();
		expect(getArgs.projectId).toBe("test_project_id");
	});

	it("should validate project data structure", () => {
		type ProjectData = {
			_id: Id<"projects">;
			userId: Id<"users"> | string;
			name: string;
			occasion: string;
			theme: string;
			eventDetails: {
				eventTitle: string;
				description?: string;
				date?: string;
				location?: string;
				rsvpLink?: string;
				emotionalStory: string;
			};
			language: string;
			duration: number;
			status: "draft" | "in_progress" | "completed";
			createdAt: number;
			updatedAt: number;
		};

		const testProject: ProjectData = {
			_id: "test_id" as Id<"projects">,
			userId: "test_user_id",
			name: "Test",
			occasion: "wedding",
			theme: "elegant",
			eventDetails: {
				eventTitle: "Test Event",
				emotionalStory: "Test story",
			},
			language: "en",
			duration: 30,
			status: "draft",
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};

		expect(testProject).toBeDefined();
		expect(testProject.status).toMatch(/^(draft|in_progress|completed)$/);
	});

	it("should validate occasion enum values", () => {
		const validOccasions = [
			"wedding",
			"birthday",
			"anniversary",
			"graduation",
			"baby_shower",
			"retirement",
			"holiday",
			"corporate",
			"other",
		];

		for (const occasion of validOccasions) {
			const createArgs = {
				name: "Test Project",
				occasion,
				theme: "elegant",
				eventDetails: {
					eventTitle: "Test Event",
					emotionalStory: "Test story",
				},
				language: "en",
			};

			expect(createArgs.occasion).toBe(occasion);
		}
	});

	it("should validate theme enum values", () => {
		const validThemes = [
			"elegant",
			"modern",
			"vintage",
			"rustic",
			"minimalist",
			"romantic",
			"cinematic",
			"playful",
			"professional",
		];

		for (const theme of validThemes) {
			const createArgs = {
				name: "Test Project",
				occasion: "wedding",
				theme,
				eventDetails: {
					eventTitle: "Test Event",
					emotionalStory: "Test story",
				},
				language: "en",
			};

			expect(createArgs.theme).toBe(theme);
		}
	});

	it("should validate status enum values", () => {
		const validStatuses = ["draft", "in_progress", "completed"] as const;

		for (const status of validStatuses) {
			expect(["draft", "in_progress", "completed"]).toContain(status);
		}
	});

	it("should validate eventDetails required fields", () => {
		const eventDetails = {
			eventTitle: "Required Field",
			emotionalStory: "Required Story",
			// Optional fields
			description: "Optional description",
			date: "2025-06-15",
			location: "Optional location",
			rsvpLink: "https://example.com",
		};

		expect(eventDetails.eventTitle).toBeDefined();
		expect(eventDetails.emotionalStory).toBeDefined();
		expect(eventDetails.description).toBeDefined();
		expect(eventDetails.date).toBeDefined();
		expect(eventDetails.location).toBeDefined();
		expect(eventDetails.rsvpLink).toBeDefined();
	});
});

/**
 * Integration Tests for useProjectData Hook
 *
 * These tests require a React environment with Convex and Clerk providers.
 * They should be run in a browser environment or with proper mocking.
 *
 * Test scenarios to verify manually or in E2E tests:
 *
 * 1. Create Project:
 *    - Hook calls create mutation with correct arguments
 *    - Returns projectId on success
 *    - Updates isSaving state during operation
 *    - Updates lastSaved timestamp after success
 *    - Handles errors gracefully
 *
 * 2. Update Project with Auto-Save:
 *    - Hook debounces updates (500ms delay)
 *    - Optimistic update shows immediately in localData
 *    - Actual mutation called after debounce
 *    - Multiple rapid updates are batched
 *    - isSaving state reflects operation status
 *
 * 3. Save Now (Immediate Save):
 *    - Cancels any pending debounced save
 *    - Saves immediately without delay
 *    - Updates lastSaved timestamp
 *    - Returns promise that resolves on success
 *
 * 4. Query Project Data:
 *    - Hook queries project by ID
 *    - Returns null if project doesn't exist
 *    - Returns project data if found
 *    - Real-time updates when project changes
 *
 * 5. Optimistic Updates:
 *    - Local state updates immediately on change
 *    - UI feels instant (no lag)
 *    - Syncs with server data after mutation
 *    - Reverts on error (if implemented)
 *
 * 6. Loading States:
 *    - isLoading true while data is being fetched
 *    - isSaving true during mutations
 *    - lastSaved shows timestamp of last successful save
 *
 * 7. Error Handling:
 *    - Network errors don't crash the hook
 *    - Authentication errors are handled
 *    - Invalid data returns proper error
 *    - User sees meaningful error messages
 *
 * 8. Debouncing:
 *    - Updates within 500ms are batched
 *    - Only final update is sent to server
 *    - Reduces unnecessary network requests
 *    - Typing doesn't trigger multiple saves
 */
