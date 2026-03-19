/**
 * Integration tests for FrameGenerator component
 * Tests credit system integration for image generation
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Id } from "@/convex/_generated/dataModel";

/** @vitest-environment jsdom */

// Mock Clerk
vi.mock("@clerk/nextjs", () => ({
	useUser: vi.fn(() => ({
		user: { id: "user_test_123" },
		isLoaded: true,
		isSignedIn: true,
	})),
}));

// Mock Convex hooks - use a single mock that handles all calls
const mockConvexMutation = vi.fn();
const mockConvexAction = vi.fn();

vi.mock("convex/react", () => ({
	useAction: vi.fn(() => mockConvexAction),
	useMutation: vi.fn(() => mockConvexMutation),
}));

// Mock useCredits hook
const mockUseCredits = vi.fn();
vi.mock("@/hooks/business-logic/useCredits", () => ({
	// biome-ignore lint/suspicious/noExplicitAny: Mock type casting required for vi.fn()
	useCredits: (...args: any[]) => mockUseCredits(...args),
}));

// Mock InsufficientCreditsModal
vi.mock("@/components/credits/InsufficientCreditsModal", () => ({
	InsufficientCreditsModal: ({
		isOpen,
		onClose,
		required,
		available,
	}: {
		isOpen: boolean;
		onClose: () => void;
		required: number;
		available: number;
	}) =>
		isOpen ? (
			<div data-testid="insufficient-credits-modal">
				<span data-testid="required-credits">{required}</span>
				<span data-testid="available-credits">{available}</span>
				<button type="button" onClick={onClose}>
					Close
				</button>
			</div>
		) : null,
}));

describe("FrameGenerator: Credit System Integration", () => {
	const mockSceneId = "scene_123" as Id<"scenes">;
	const mockProjectId = "project_123" as Id<"projects">;

	beforeEach(() => {
		vi.clearAllMocks();

		// Default: user has enough credits
		mockUseCredits.mockReturnValue({
			balance: 100,
			isLoading: false,
		});

		// Default: mutation succeeds (deductCredits/refundCredits)
		mockConvexMutation.mockResolvedValue({
			success: true,
			transactionId: "tx_123",
			newBalance: 94,
		});

		// Default: action succeeds
		mockConvexAction
			.mockResolvedValueOnce({
				enhanced: "Enhanced cinematic prompt for beautiful sunset scene",
			})
			.mockResolvedValueOnce({
				success: true,
				imageUrl: "https://example.com/generated-image.png",
				assetId: "asset_123",
			});
	});

	describe("✅ Credit badge display", () => {
		it("should display total credit cost (6 credits) on generate button", async () => {
			const { FrameGenerator } = await import(
				"@/components/scene-management/FrameGenerator"
			);

			render(
				<FrameGenerator
					sceneId={mockSceneId}
					projectId={mockProjectId}
					frameType="start"
				/>,
			);

			// Should show 6 credits (1 for enhancement + 5 for image)
			expect(screen.getByText(/6 credits/i)).toBeInTheDocument();
		});
	});

	describe("✅ Successful generation flow", () => {
		it("should deduct credits twice (prompt + image) on successful generation", async () => {
			const { FrameGenerator } = await import(
				"@/components/scene-management/FrameGenerator"
			);

			const mockOnGenerated = vi.fn();

			render(
				<FrameGenerator
					sceneId={mockSceneId}
					projectId={mockProjectId}
					frameType="start"
					onGenerated={mockOnGenerated}
				/>,
			);

			// Enter a prompt
			const textarea = screen.getByRole("textbox");
			fireEvent.change(textarea, {
				target: { value: "A beautiful sunset on the beach" },
			});

			// Click generate
			const generateButton = screen.getByRole("button", {
				name: /generate start frame/i,
			});
			fireEvent.click(generateButton);

			await waitFor(() => {
				// Should call mutation twice (once for prompt, once for image)
				expect(mockConvexMutation).toHaveBeenCalledTimes(2);
			});

			// First call for prompt enhancement
			expect(mockConvexMutation).toHaveBeenNthCalledWith(
				1,
				expect.objectContaining({
					clerkUserId: "user_test_123",
					actionType: "image_prompt_enhancement",
				}),
			);

			// Second call for image generation
			expect(mockConvexMutation).toHaveBeenNthCalledWith(
				2,
				expect.objectContaining({
					clerkUserId: "user_test_123",
					actionType: "image_generation",
				}),
			);

			await waitFor(() => {
				expect(mockOnGenerated).toHaveBeenCalledWith(
					"https://example.com/generated-image.png",
				);
			});
		});
	});

	describe("✅ Insufficient credits handling", () => {
		it("should show InsufficientCreditsModal when user has less than 6 credits", async () => {
			// Mock low balance
			mockUseCredits.mockReturnValue({
				balance: 3, // Less than 6 required
				isLoading: false,
			});

			const { FrameGenerator } = await import(
				"@/components/scene-management/FrameGenerator"
			);

			render(
				<FrameGenerator
					sceneId={mockSceneId}
					projectId={mockProjectId}
					frameType="start"
				/>,
			);

			// Enter a prompt
			const textarea = screen.getByRole("textbox");
			fireEvent.change(textarea, {
				target: { value: "A beautiful sunset" },
			});

			// Click generate
			const generateButton = screen.getByRole("button", {
				name: /generate start frame/i,
			});
			fireEvent.click(generateButton);

			await waitFor(() => {
				expect(
					screen.getByTestId("insufficient-credits-modal"),
				).toBeInTheDocument();
			});

			// Verify modal shows correct values
			expect(screen.getByTestId("required-credits")).toHaveTextContent("6");
			expect(screen.getByTestId("available-credits")).toHaveTextContent("3");

			// Should NOT have called mutation
			expect(mockConvexMutation).not.toHaveBeenCalled();
		});
	});

	describe("✅ Button disabled states", () => {
		it("should disable generate button when prompt is empty", async () => {
			const { FrameGenerator } = await import(
				"@/components/scene-management/FrameGenerator"
			);

			render(
				<FrameGenerator
					sceneId={mockSceneId}
					projectId={mockProjectId}
					frameType="start"
				/>,
			);

			const generateButton = screen.getByRole("button", {
				name: /generate start frame/i,
			});

			// Button should be disabled when prompt is empty
			expect(generateButton).toBeDisabled();
		});

		it("should enable generate button when prompt has content", async () => {
			const { FrameGenerator } = await import(
				"@/components/scene-management/FrameGenerator"
			);

			render(
				<FrameGenerator
					sceneId={mockSceneId}
					projectId={mockProjectId}
					frameType="start"
				/>,
			);

			const textarea = screen.getByRole("textbox");
			fireEvent.change(textarea, {
				target: { value: "A beautiful sunset" },
			});

			const generateButton = screen.getByRole("button", {
				name: /generate start frame/i,
			});

			// Button should be enabled when prompt has content
			expect(generateButton).not.toBeDisabled();
		});
	});
});
