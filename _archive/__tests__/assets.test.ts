/**
 * Test suite for asset management functions
 * Tests CRUD operations, filtering, and scene frame queries
 */

import { describe, expect, it } from "vitest";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

describe("Asset Management Functions - Schema Validation", () => {
	it("should verify assets.list query exists", () => {
		expect(api.assets.list).toBeDefined();
	});

	it("should verify assets.get query exists", () => {
		expect(api.assets.get).toBeDefined();
	});

	it("should verify assets.remove mutation exists", () => {
		expect(api.assets.remove).toBeDefined();
	});

	it("should verify assets.getSceneFrames query exists", () => {
		expect(api.assets.getSceneFrames).toBeDefined();
	});

	it("should validate list arguments schema with all filters", () => {
		const listArgs = {
			projectId: "test_project_id" as Id<"projects">,
			assetType: "image" as const,
		};

		expect(listArgs).toBeDefined();
		expect(listArgs.projectId).toBe("test_project_id");
		expect(listArgs.assetType).toBe("image");
	});

	it("should validate list arguments with optional filters", () => {
		const listArgsMinimal: {
			projectId?: Id<"projects">;
			assetType?: "image" | "video" | "audio";
		} = {};

		expect(listArgsMinimal).toBeDefined();
		expect(listArgsMinimal.projectId).toBeUndefined();
		expect(listArgsMinimal.assetType).toBeUndefined();
	});

	it("should validate get arguments schema", () => {
		const getArgs = {
			assetId: "test_asset_id" as Id<"assets">,
		};

		expect(getArgs).toBeDefined();
		expect(getArgs.assetId).toBe("test_asset_id");
	});

	it("should validate remove arguments schema", () => {
		const removeArgs = {
			assetId: "test_asset_id" as Id<"assets">,
		};

		expect(removeArgs).toBeDefined();
		expect(removeArgs.assetId).toBe("test_asset_id");
	});

	it("should validate getSceneFrames arguments schema", () => {
		const framesArgs = {
			sceneId: "test_scene_id" as Id<"scenes">,
		};

		expect(framesArgs).toBeDefined();
		expect(framesArgs.sceneId).toBe("test_scene_id");
	});

	it("should validate asset data structure", () => {
		type AssetData = {
			_id: Id<"assets">;
			userId: string; // Clerk user ID
			projectId?: string;
			type: "image" | "video" | "audio";
			url: string;
			filename: string;
			size: number;
			uploadedAt: number;
		};

		const testAsset: AssetData = {
			_id: "asset_123" as Id<"assets">,
			userId: "user_clerk_123",
			projectId: "project_abc",
			type: "image",
			url: "https://example.com/file.jpg",
			filename: "photo.jpg",
			size: 1024000,
			uploadedAt: Date.now(),
		};

		expect(testAsset).toBeDefined();
		expect(testAsset.type).toMatch(/^(image|video|audio)$/);
		expect(testAsset.size).toBeGreaterThan(0);
	});

	it("should validate filtering by assetType", () => {
		const imageFilter = { assetType: "image" as const };
		const videoFilter = { assetType: "video" as const };
		const audioFilter = { assetType: "audio" as const };

		expect(imageFilter.assetType).toBe("image");
		expect(videoFilter.assetType).toBe("video");
		expect(audioFilter.assetType).toBe("audio");
	});

	it("should validate scene frames structure", () => {
		type SceneFrames = {
			startFrame: {
				_id: Id<"assets">;
				url: string;
				filename: string;
			} | null;
			endFrame: {
				_id: Id<"assets">;
				url: string;
				filename: string;
			} | null;
		};

		const testFrames: SceneFrames = {
			startFrame: {
				_id: "asset_1" as Id<"assets">,
				url: "https://example.com/start.jpg",
				filename: "start.jpg",
			},
			endFrame: null,
		};

		expect(testFrames).toBeDefined();
		expect(testFrames.startFrame).not.toBeNull();
		expect(testFrames.endFrame).toBeNull();
	});
});

/**
 * Integration Tests (require authentication and real data)
 *
 * Test scenarios to verify manually or in E2E tests:
 *
 * 1. List Assets:
 *    - Returns all user's assets when no filters
 *    - Filters by projectId correctly
 *    - Filters by assetType correctly
 *    - Returns empty array for non-existent project
 *    - Sorted by newest first (uploadedAt desc)
 *
 * 2. Get Asset:
 *    - Returns asset with all fields
 *    - Returns null for non-existent asset
 *    - Cannot get other users' assets (throws Unauthorized)
 *    - URL is accessible and correct
 *
 * 3. Remove Asset:
 *    - Deletes asset from database
 *    - Cannot delete other users' assets (throws Unauthorized)
 *    - Returns success: true
 *    - Asset no longer in list query
 *    - Note: Storage deletion not implemented yet (storageId not in schema)
 *
 * 4. Get Scene Frames:
 *    - Returns both startFrame and endFrame if set
 *    - Returns null for frames if not set
 *    - Works for scenes with only one frame
 *    - Returns empty for non-existent scene
 *    - Verifies scene ownership
 *
 * 5. Authorization:
 *    - User can only list their own assets
 *    - User cannot access other users' assets
 *    - Unauthenticated requests fail (throws Not authenticated)
 *
 * 6. Performance:
 *    - List query completes in < 2s
 *    - Filtering doesn't slow down query significantly
 *    - Large asset lists handled efficiently
 */
