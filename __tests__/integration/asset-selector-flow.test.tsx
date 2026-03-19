/**
 * AssetSelector Integration Test
 *
 * This test verifies the COMPLETE flow of:
 * 1. Opening the asset selector modal
 * 2. Generating an AI image
 * 3. Selecting the generated image
 * 4. Verifying the scene is updated with the image URL
 *
 * This is a TRUE integration test that catches the bugs we've been facing:
 * - Generated images grid not showing
 * - Scene startFrame not being updated
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/** @vitest-environment jsdom */

// Mock window.matchMedia for responsive hooks
Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: vi.fn().mockImplementation((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});

// Track all function calls for verification
const callTracker = {
	generateAIImage: [] as Array<{ prompt: string; referenceImage?: string }>,
	onAssetSelect: [] as string[],
	onUpdateScene: [] as Array<{ id: string; updates: Record<string, unknown> }>,
	deductCredits: [] as Array<Record<string, unknown>>,
};

// Reset tracker before each test
beforeEach(() => {
	callTracker.generateAIImage = [];
	callTracker.onAssetSelect = [];
	callTracker.onUpdateScene = [];
	callTracker.deductCredits = [];
	vi.clearAllMocks();
});

// Mock Clerk
vi.mock("@clerk/nextjs", () => ({
	useUser: () => ({
		user: { id: "user_test123" },
		isLoaded: true,
		isSignedIn: true,
	}),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
		info: vi.fn(),
	},
}));

// Mock useCredits with tracking
const mockDeductCredits = vi.fn().mockImplementation(async (args) => {
	callTracker.deductCredits.push(args);
	return {
		success: true,
		transactionId: "txn_test123",
		creditsDeducted: 5,
		newBalance: 95,
	};
});

vi.mock("@/hooks/business-logic/useCredits", () => ({
	useCredits: () => ({
		balance: 100,
		totalPurchased: 100,
		totalUsed: 0,
		isLoading: false,
		isProcessing: false,
		deductCredits: mockDeductCredits,
		refundCredits: vi.fn().mockResolvedValue({ success: true }),
	}),
}));

// Mock useAssetManagement with tracking
const mockGenerateAIImage = vi
	.fn()
	.mockImplementation(async (prompt, referenceImage) => {
		callTracker.generateAIImage.push({ prompt, referenceImage });
		// Simulate API delay
		await new Promise((resolve) => setTimeout(resolve, 100));
		return "https://convex.cloud/generated-image-test.jpg";
	});

vi.mock("@/hooks/business-logic/useAssetManagement", () => ({
	useAssetManagement: () => ({
		assets: [],
		uploadedAssets: [],
		loading: false,
		uploading: false,
		deleting: null,
		uploadAsset: vi.fn(),
		deleteAsset: vi.fn(),
		generateAIImage: mockGenerateAIImage,
	}),
}));

// Import components after mocks
import { AssetSelector } from "@/components/asset-management/AssetSelector";
import { FrameAssignment } from "@/components/scene-management/FrameAssignment";
import type { Scene } from "@/components/types";
import { DeviceProvider } from "@/contexts/DeviceContext";
import type { Id } from "@/convex/_generated/dataModel";

// Wrapper component with required providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
	<DeviceProvider>{children}</DeviceProvider>
);

describe("AssetSelector Complete Flow Integration", () => {
	const mockScene: Scene = {
		id: "scene_test123",
		title: "Test Scene",
		description: "A test scene",
		duration: 10,
		cinematicStyles: {
			ambiance: "romantic",
			cameraMovement: "slow pan",
			colorTone: "warm",
			visualStyle: "cinematic",
		},
	};

	const mockOnUpdateScene = vi.fn((id, updates) => {
		callTracker.onUpdateScene.push({ id, updates });
	});

	const mockOnAssetSelect = vi.fn((url) => {
		callTracker.onAssetSelect.push(url);
	});

	describe("AssetSelector Component", () => {
		it("should show generated images grid after generation completes", async () => {
			const user = userEvent.setup();

			render(
				<TestWrapper>
					<AssetSelector
						onAssetSelect={mockOnAssetSelect}
						projectId={"project_test123" as Id<"projects">}
						sceneId={"scene_test123" as Id<"scenes">}
						assetType="image"
						frameType="start"
					/>
				</TestWrapper>,
			);

			// Navigate to AI Generator tab
			const aiGeneratorTab = screen.getByRole("tab", { name: /ai generator/i });
			await user.click(aiGeneratorTab);

			// Enter a prompt
			const promptInput = screen.getByPlaceholderText(
				/romantic wedding invitation/i,
			);
			await user.type(promptInput, "A beautiful sunset over the ocean");

			// Click generate button
			const generateButton = screen.getByRole("button", {
				name: /generate.*ai image/i,
			});
			await user.click(generateButton);

			// Wait for generation to complete
			await waitFor(
				() => {
					// Should show the generated images grid
					expect(
						screen.getByText(/choose your ai generated image/i),
					).toBeInTheDocument();
				},
				{ timeout: 5000 },
			);

			// Verify generateAIImage was called
			expect(callTracker.generateAIImage.length).toBeGreaterThan(0);
			expect(callTracker.generateAIImage[0].prompt).toBe(
				"A beautiful sunset over the ocean",
			);

			// Verify generated images are displayed
			const selectButtons = screen.getAllByRole("button", {
				name: /select this image/i,
			});
			expect(selectButtons.length).toBeGreaterThan(0);
		});

		it("should call onAssetSelect when user selects a generated image", async () => {
			const user = userEvent.setup();

			render(
				<TestWrapper>
					<AssetSelector
						onAssetSelect={mockOnAssetSelect}
						projectId={"project_test123" as Id<"projects">}
						sceneId={"scene_test123" as Id<"scenes">}
						assetType="image"
						frameType="start"
					/>
				</TestWrapper>,
			);

			// Navigate to AI Generator tab
			const aiGeneratorTab = screen.getByRole("tab", { name: /ai generator/i });
			await user.click(aiGeneratorTab);

			// Enter a prompt
			const promptInput = screen.getByPlaceholderText(
				/romantic wedding invitation/i,
			);
			await user.type(promptInput, "A beautiful sunset");

			// Click generate button
			const generateButton = screen.getByRole("button", {
				name: /generate.*ai image/i,
			});
			await user.click(generateButton);

			// Wait for generated images grid
			await waitFor(
				() => {
					expect(
						screen.getByText(/choose your ai generated image/i),
					).toBeInTheDocument();
				},
				{ timeout: 5000 },
			);

			// Click "Select This Image" on the first image
			const selectButton = screen.getAllByRole("button", {
				name: /select this image/i,
			})[0];
			await user.click(selectButton);

			// Verify onAssetSelect was called with the image URL
			expect(callTracker.onAssetSelect.length).toBe(1);
			expect(callTracker.onAssetSelect[0]).toBe(
				"https://convex.cloud/generated-image-test.jpg",
			);
		});

		it("should deduct credits before generating", async () => {
			const user = userEvent.setup();

			render(
				<TestWrapper>
					<AssetSelector
						onAssetSelect={mockOnAssetSelect}
						projectId={"project_test123" as Id<"projects">}
						sceneId={"scene_test123" as Id<"scenes">}
						assetType="image"
						frameType="start"
					/>
				</TestWrapper>,
			);

			// Navigate to AI Generator tab
			const aiGeneratorTab = screen.getByRole("tab", { name: /ai generator/i });
			await user.click(aiGeneratorTab);

			// Enter a prompt
			const promptInput = screen.getByPlaceholderText(
				/romantic wedding invitation/i,
			);
			await user.type(promptInput, "Test prompt");

			// Click generate button
			const generateButton = screen.getByRole("button", {
				name: /generate.*ai image/i,
			});
			await user.click(generateButton);

			// Wait for generation to start
			await waitFor(() => {
				expect(mockDeductCredits).toHaveBeenCalled();
			});

			// Verify credits were deducted
			expect(callTracker.deductCredits.length).toBeGreaterThan(0);
			expect(callTracker.deductCredits[0]).toMatchObject({
				actionType: "image_generation",
				projectId: "project_test123",
				resourceId: "scene_test123",
			});
		});
	});

	describe("FrameAssignment Integration", () => {
		it("should update scene when image is selected via FrameAssignment", async () => {
			const user = userEvent.setup();

			render(
				<TestWrapper>
					<FrameAssignment
						scene={mockScene}
						projectId={"project_test123" as Id<"projects">}
						onUpdateScene={mockOnUpdateScene}
					/>
				</TestWrapper>,
			);

			// Click on "Create Visual" to open the modal - the div with aria-label
			const createVisualArea = screen.getByLabelText(/select start frame/i);
			await user.click(createVisualArea);

			// Wait for modal to open - look for the dialog title
			await waitFor(() => {
				expect(screen.getByRole("dialog")).toBeInTheDocument();
			});

			// Navigate to AI Generator tab
			const aiGeneratorTab = screen.getByRole("tab", { name: /ai generator/i });
			await user.click(aiGeneratorTab);

			// Enter a prompt
			const promptInput = screen.getByPlaceholderText(
				/romantic wedding invitation/i,
			);
			await user.type(promptInput, "A romantic scene");

			// Click generate button
			const generateButton = screen.getByRole("button", {
				name: /generate.*ai image/i,
			});
			await user.click(generateButton);

			// Wait for generated images grid
			await waitFor(
				() => {
					expect(
						screen.getByText(/choose your ai generated image/i),
					).toBeInTheDocument();
				},
				{ timeout: 5000 },
			);

			// Click "Select This Image"
			const selectButton = screen.getAllByRole("button", {
				name: /select this image/i,
			})[0];
			await user.click(selectButton);

			// Verify onUpdateScene was called with the correct arguments
			expect(callTracker.onUpdateScene.length).toBe(1);
			expect(callTracker.onUpdateScene[0]).toEqual({
				id: "scene_test123",
				updates: {
					startFrameImage: "https://convex.cloud/generated-image-test.jpg",
				},
			});
		});
	});
});
