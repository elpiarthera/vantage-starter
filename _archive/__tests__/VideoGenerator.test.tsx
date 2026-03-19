/**
 * Integration tests for VideoGenerator component
 * Tests credit system integration for video generation
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

// Mock useVideoStatus hook
vi.mock("@/hooks/business-logic/useVideoStatus", () => ({
	useVideoStatus: vi.fn(() => ({
		generationStatus: "idle",
		progress: 0,
		videoUrl: null,
		isGenerating: false,
		isCompleted: false,
		isFailed: false,
		error: null,
		cost: null,
	})),
}));

// Mock useVideoRegeneration hook
vi.mock("@/hooks/business-logic/useVideoRegeneration", () => ({
	useVideoRegeneration: vi.fn(() => ({
		regenerate: vi.fn(),
		regenerationCount: 0,
		canRegenerate: true,
		maxRegenerations: 3,
	})),
}));

// Note: useSceneStore mock removed - VideoGenerator now uses props for sceneTitle/sceneDescription

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

// Mock VideoRegenerationChat
vi.mock("@/components/video-generation/VideoRegenerationChat", () => ({
	VideoRegenerationChat: () => null,
}));

describe("VideoGenerator: Credit System Integration", () => {
	const mockSceneId = "scene_123";
	const mockProjectId = "project_123";

	// Default props for all tests
	const defaultProps = {
		sceneId: mockSceneId,
		projectId: mockProjectId,
		startFrameImage: "https://example.com/start.png",
		endFrameImage: "https://example.com/end.png",
		duration: 10 as const,
		cinematicStyles: {
			ambiance: "romantic",
			cameraMovement: "slow pan",
			colorTone: "warm",
			visualStyle: "cinematic",
		},
		sceneTitle: "Test Scene",
		sceneDescription: "A beautiful sunset scene",
		// Project-level context from Step 1 & Step 2b
		visualStyle: "cinematic",
		occasion: "wedding",
		theme: "romantic",
		emotionalStory: "A love story that began under the stars",
	};

	beforeEach(() => {
		vi.clearAllMocks();

		// Default: user has enough credits
		mockUseCredits.mockReturnValue({
			balance: 100,
			isLoading: false,
		});

		// Default: mutation succeeds (deductCredits)
		mockConvexMutation.mockResolvedValue({
			success: true,
			transactionId: "tx_video_123" as Id<"creditTransactions">,
			newBalance: 80,
		});

		// Default: action succeeds (generateVideo)
		mockConvexAction.mockResolvedValue({
			success: true,
			requestId: "req_123",
			statusUrl: "https://queue.fal.run/status/req_123",
		});
	});

	describe("✅ Credit badge display", () => {
		it("should display 20 credits cost on generate button", async () => {
			const { VideoGenerator } = await import(
				"@/components/video-generation/VideoGenerator"
			);

			render(<VideoGenerator {...defaultProps} />);

			// Should show 20 credits for video generation
			expect(screen.getByText(/20 credits/i)).toBeInTheDocument();
		});
	});

	describe("✅ Successful generation flow", () => {
		it("should deduct 20 credits on video generation", async () => {
			const { VideoGenerator } = await import(
				"@/components/video-generation/VideoGenerator"
			);

			const mockOnGenerateVideo = vi.fn();

			render(
				<VideoGenerator
					{...defaultProps}
					onGenerateVideo={mockOnGenerateVideo}
				/>,
			);

			// Click generate video button
			const generateButton = screen.getByRole("button", {
				name: /generate video from frames/i,
			});
			fireEvent.click(generateButton);

			await waitFor(() => {
				expect(mockConvexMutation).toHaveBeenCalledWith({
					clerkUserId: "user_test_123",
					actionType: "video_generation",
					projectId: mockProjectId,
				});
			});

			await waitFor(() => {
				expect(mockConvexAction).toHaveBeenCalled();
			});

			expect(mockOnGenerateVideo).toHaveBeenCalledWith(mockSceneId);
		});
	});

	describe("✅ Insufficient credits handling", () => {
		it("should show InsufficientCreditsModal when user has less than 20 credits", async () => {
			// Mock low balance
			mockUseCredits.mockReturnValue({
				balance: 15, // Less than 20 required
				isLoading: false,
			});

			const { VideoGenerator } = await import(
				"@/components/video-generation/VideoGenerator"
			);

			render(<VideoGenerator {...defaultProps} />);

			// Click generate video button
			const generateButton = screen.getByRole("button", {
				name: /generate video from frames/i,
			});
			fireEvent.click(generateButton);

			await waitFor(() => {
				expect(
					screen.getByTestId("insufficient-credits-modal"),
				).toBeInTheDocument();
			});

			// Verify modal shows correct values
			expect(screen.getByTestId("required-credits")).toHaveTextContent("20");
			expect(screen.getByTestId("available-credits")).toHaveTextContent("15");

			// Should NOT have called mutation
			expect(mockConvexMutation).not.toHaveBeenCalled();
		});

		it("should show modal when deductCredits returns failure", async () => {
			mockConvexMutation.mockResolvedValueOnce({
				success: false,
				error: "Insufficient credits",
				required: 20,
				available: 5,
			});

			const { VideoGenerator } = await import(
				"@/components/video-generation/VideoGenerator"
			);

			render(<VideoGenerator {...defaultProps} />);

			const generateButton = screen.getByRole("button", {
				name: /generate video from frames/i,
			});
			fireEvent.click(generateButton);

			await waitFor(() => {
				expect(
					screen.getByTestId("insufficient-credits-modal"),
				).toBeInTheDocument();
			});

			// Should NOT have called generateVideo action
			expect(mockConvexAction).not.toHaveBeenCalled();
		});
	});

	describe("✅ Button disabled states", () => {
		it("should disable generate button when frames are missing", async () => {
			const { VideoGenerator } = await import(
				"@/components/video-generation/VideoGenerator"
			);

			render(
				<VideoGenerator
					{...defaultProps}
					startFrameImage="" // Missing
				/>,
			);

			const generateButton = screen.getByRole("button", {
				name: /generate video from frames/i,
			});
			expect(generateButton).toBeDisabled();
		});

		it("should enable generate button when both frames are provided", async () => {
			const { VideoGenerator } = await import(
				"@/components/video-generation/VideoGenerator"
			);

			render(<VideoGenerator {...defaultProps} />);

			const generateButton = screen.getByRole("button", {
				name: /generate video from frames/i,
			});
			expect(generateButton).not.toBeDisabled();
		});
	});
});
