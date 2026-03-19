/**
 * FrameAssignment Component Tests
 *
 * Tests the component receives scene data via props (from Convex)
 * and calls onUpdateScene callback (to Convex) correctly.
 *
 * BUG FIX VERIFICATION: This component was previously using useSceneStore (Zustand)
 * which was EMPTY after the Convex migration. Now it uses props from SceneEditor.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FrameAssignment } from "@/components/scene-management/FrameAssignment";
import type { Scene } from "@/components/types";

/** @vitest-environment jsdom */

// Mock the AdaptiveModal component
vi.mock("@/components/adaptive/AdaptiveModal", () => ({
	AdaptiveModal: ({
		isOpen,
		onClose,
		title,
		children,
	}: {
		isOpen: boolean;
		onClose: () => void;
		title: string;
		children: React.ReactNode;
	}) =>
		isOpen ? (
			<div data-testid="adaptive-modal" role="dialog" aria-label={title}>
				<h2>{title}</h2>
				<button type="button" onClick={onClose}>
					Close
				</button>
				{children}
			</div>
		) : null,
}));

// Mock the AssetSelector component
vi.mock("@/components/asset-management/AssetSelector", () => ({
	AssetSelector: ({
		onAssetSelect,
	}: {
		onAssetSelect: (url: string) => void;
	}) => (
		<div data-testid="asset-selector">
			<button
				type="button"
				onClick={() => onAssetSelect("https://example.com/test-image.jpg")}
			>
				Select Test Asset
			</button>
		</div>
	),
}));

describe("FrameAssignment Component", () => {
	const mockOnUpdateScene = vi.fn();

	const createMockScene = (overrides?: Partial<Scene>): Scene => ({
		id: "scene-123",
		title: "Test Scene",
		description: "Test description",
		duration: 10,
		cinematicStyles: {
			ambiance: "romantic",
			cameraMovement: "slow pan",
			colorTone: "warm",
			visualStyle: "cinematic",
		},
		...overrides,
	});

	const defaultProps = {
		scene: createMockScene(),
		onUpdateScene: mockOnUpdateScene,
		projectId:
			"proj_test123" as import("@/convex/_generated/dataModel").Id<"projects">,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Rendering with Scene Prop (BUG FIX VERIFICATION)", () => {
		/**
		 * CRITICAL TEST: Verifies the bug fix
		 *
		 * Before fix: Component used useSceneStore() which was empty → returned null
		 * After fix: Component uses scene prop → renders correctly
		 */
		it("should render 'Set Your Frames' card when scene prop is provided", () => {
			render(<FrameAssignment {...defaultProps} />);

			expect(screen.getByText("Set Your Frames")).toBeInTheDocument();
		});

		it("should render Start Frame section", () => {
			render(<FrameAssignment {...defaultProps} />);

			expect(screen.getByText("Start Frame")).toBeInTheDocument();
			expect(
				screen.getByText(
					"This will be the first frame that appears in this scene",
				),
			).toBeInTheDocument();
		});

		it("should show 'Create Visual' placeholder when no start frame image", () => {
			render(<FrameAssignment {...defaultProps} />);

			expect(screen.getByText("Create Visual")).toBeInTheDocument();
			expect(
				screen.getByText("Click to select start frame"),
			).toBeInTheDocument();
		});

		it("should NOT render End Frame section when no start frame", () => {
			render(<FrameAssignment {...defaultProps} />);

			// End Frame only shows after start frame is set
			expect(screen.queryByText("End Frame")).not.toBeInTheDocument();
		});
	});

	describe("With Start Frame Image", () => {
		it("should display start frame image when provided", () => {
			const sceneWithStartFrame = createMockScene({
				startFrameImage: "https://example.com/start-frame.jpg",
			});

			render(<FrameAssignment {...defaultProps} scene={sceneWithStartFrame} />);

			const startImage = screen.getByAltText("Start frame");
			expect(startImage).toBeInTheDocument();
			expect(startImage).toHaveAttribute(
				"src",
				"https://example.com/start-frame.jpg",
			);
		});

		it("should show 'Start Frame Created' text when start frame exists", () => {
			const sceneWithStartFrame = createMockScene({
				startFrameImage: "https://example.com/start-frame.jpg",
			});

			render(<FrameAssignment {...defaultProps} scene={sceneWithStartFrame} />);

			expect(screen.getByText("Start Frame Created")).toBeInTheDocument();
			expect(
				screen.getByText("Click to change start frame"),
			).toBeInTheDocument();
		});

		it("should show End Frame section when start frame exists", () => {
			const sceneWithStartFrame = createMockScene({
				startFrameImage: "https://example.com/start-frame.jpg",
			});

			render(<FrameAssignment {...defaultProps} scene={sceneWithStartFrame} />);

			expect(screen.getByText("End Frame")).toBeInTheDocument();
			expect(
				screen.getByText(
					"This will be the last frame that appears in this scene",
				),
			).toBeInTheDocument();
		});

		it("should show delete button for start frame", () => {
			const sceneWithStartFrame = createMockScene({
				startFrameImage: "https://example.com/start-frame.jpg",
			});

			render(<FrameAssignment {...defaultProps} scene={sceneWithStartFrame} />);

			const deleteButton = screen.getByRole("button", {
				name: /delete start frame/i,
			});
			expect(deleteButton).toBeInTheDocument();
		});
	});

	describe("With Both Frames", () => {
		it("should display both start and end frame images", () => {
			const sceneWithBothFrames = createMockScene({
				startFrameImage: "https://example.com/start-frame.jpg",
				endFrameImage: "https://example.com/end-frame.jpg",
			});

			render(<FrameAssignment {...defaultProps} scene={sceneWithBothFrames} />);

			expect(screen.getByAltText("Start frame")).toBeInTheDocument();
			expect(screen.getByAltText("End frame")).toBeInTheDocument();
		});

		it("should show 'End Frame Created' text when end frame exists", () => {
			const sceneWithBothFrames = createMockScene({
				startFrameImage: "https://example.com/start-frame.jpg",
				endFrameImage: "https://example.com/end-frame.jpg",
			});

			render(<FrameAssignment {...defaultProps} scene={sceneWithBothFrames} />);

			expect(screen.getByText("End Frame Created")).toBeInTheDocument();
		});
	});

	describe("onUpdateScene Callback (Convex Integration)", () => {
		/**
		 * CRITICAL TEST: Verifies the callback is used correctly
		 *
		 * Before fix: Used useSceneStore().updateScene (Zustand) which didn't persist
		 * After fix: Uses onUpdateScene prop which writes to Convex
		 */
		it("should call onUpdateScene with startFrameImage when selecting start frame", async () => {
			const user = userEvent.setup();
			render(<FrameAssignment {...defaultProps} />);

			// Click to open modal
			const startFrameArea = screen.getByRole("button", {
				name: /select start frame/i,
			});
			await user.click(startFrameArea);

			// Verify modal opened
			expect(screen.getByTestId("adaptive-modal")).toBeInTheDocument();
			expect(screen.getByText("Select Start Frame")).toBeInTheDocument();

			// Select an asset
			const selectAssetButton = screen.getByText("Select Test Asset");
			await user.click(selectAssetButton);

			// Verify callback was called with correct arguments
			expect(mockOnUpdateScene).toHaveBeenCalledTimes(1);
			expect(mockOnUpdateScene).toHaveBeenCalledWith("scene-123", {
				startFrameImage: "https://example.com/test-image.jpg",
			});
		});

		it("should call onUpdateScene with endFrameImage when selecting end frame", async () => {
			const user = userEvent.setup();
			const sceneWithStartFrame = createMockScene({
				startFrameImage: "https://example.com/start-frame.jpg",
			});

			render(<FrameAssignment {...defaultProps} scene={sceneWithStartFrame} />);

			// Click to open end frame modal
			const endFrameArea = screen.getByRole("button", {
				name: /select end frame/i,
			});
			await user.click(endFrameArea);

			// Verify modal opened for end frame
			expect(screen.getByText("Select End Frame")).toBeInTheDocument();

			// Select an asset
			const selectAssetButton = screen.getByText("Select Test Asset");
			await user.click(selectAssetButton);

			// Verify callback was called with correct arguments
			expect(mockOnUpdateScene).toHaveBeenCalledTimes(1);
			expect(mockOnUpdateScene).toHaveBeenCalledWith("scene-123", {
				endFrameImage: "https://example.com/test-image.jpg",
			});
		});

		it("should call onUpdateScene with undefined when deleting start frame", async () => {
			const user = userEvent.setup();
			const sceneWithStartFrame = createMockScene({
				startFrameImage: "https://example.com/start-frame.jpg",
			});

			render(<FrameAssignment {...defaultProps} scene={sceneWithStartFrame} />);

			// Click delete button
			const deleteButton = screen.getByRole("button", {
				name: /delete start frame/i,
			});
			await user.click(deleteButton);

			// Verify callback was called with undefined to clear the frame
			expect(mockOnUpdateScene).toHaveBeenCalledTimes(1);
			expect(mockOnUpdateScene).toHaveBeenCalledWith("scene-123", {
				startFrameImage: undefined,
			});
		});

		it("should call onUpdateScene with undefined when deleting end frame", async () => {
			const user = userEvent.setup();
			const sceneWithBothFrames = createMockScene({
				startFrameImage: "https://example.com/start-frame.jpg",
				endFrameImage: "https://example.com/end-frame.jpg",
			});

			render(<FrameAssignment {...defaultProps} scene={sceneWithBothFrames} />);

			// Click delete button for end frame
			const deleteButton = screen.getByRole("button", {
				name: /delete end frame/i,
			});
			await user.click(deleteButton);

			// Verify callback was called with undefined to clear the frame
			expect(mockOnUpdateScene).toHaveBeenCalledTimes(1);
			expect(mockOnUpdateScene).toHaveBeenCalledWith("scene-123", {
				endFrameImage: undefined,
			});
		});
	});

	describe("Modal Behavior", () => {
		it("should close modal after selecting an asset", async () => {
			const user = userEvent.setup();
			render(<FrameAssignment {...defaultProps} />);

			// Open modal
			const startFrameArea = screen.getByRole("button", {
				name: /select start frame/i,
			});
			await user.click(startFrameArea);

			// Modal should be open
			expect(screen.getByTestId("adaptive-modal")).toBeInTheDocument();

			// Select asset
			const selectAssetButton = screen.getByText("Select Test Asset");
			await user.click(selectAssetButton);

			// Modal should be closed
			expect(screen.queryByTestId("adaptive-modal")).not.toBeInTheDocument();
		});

		it("should close modal when close button is clicked", async () => {
			const user = userEvent.setup();
			render(<FrameAssignment {...defaultProps} />);

			// Open modal
			const startFrameArea = screen.getByRole("button", {
				name: /select start frame/i,
			});
			await user.click(startFrameArea);

			// Modal should be open
			expect(screen.getByTestId("adaptive-modal")).toBeInTheDocument();

			// Click close button
			const closeButton = screen.getByRole("button", { name: /close/i });
			await user.click(closeButton);

			// Modal should be closed
			expect(screen.queryByTestId("adaptive-modal")).not.toBeInTheDocument();

			// onUpdateScene should NOT have been called
			expect(mockOnUpdateScene).not.toHaveBeenCalled();
		});
	});

	describe("Keyboard Accessibility", () => {
		it("should open start frame modal on Enter key", async () => {
			const user = userEvent.setup();
			render(<FrameAssignment {...defaultProps} />);

			const startFrameArea = screen.getByRole("button", {
				name: /select start frame/i,
			});
			startFrameArea.focus();
			await user.keyboard("{Enter}");

			expect(screen.getByTestId("adaptive-modal")).toBeInTheDocument();
		});

		it("should open start frame modal on Space key", async () => {
			const user = userEvent.setup();
			render(<FrameAssignment {...defaultProps} />);

			const startFrameArea = screen.getByRole("button", {
				name: /select start frame/i,
			});
			startFrameArea.focus();
			await user.keyboard(" ");

			expect(screen.getByTestId("adaptive-modal")).toBeInTheDocument();
		});
	});
});
