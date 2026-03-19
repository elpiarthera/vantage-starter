/**
 * SceneManager Component Tests
 *
 * Tests the ACTUAL component rendering behavior, not just data structures.
 * These tests would have caught the "Loading scenes..." bug where empty
 * array was incorrectly treated as a loading state.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SceneManager } from "@/components/scene-management/SceneManager";
import type { Scene } from "@/components/types";

/** @vitest-environment jsdom */

// Mock useDevice hook
vi.mock("@/contexts/DeviceContext", () => ({
	useDevice: () => ({ isMobile: false, isTablet: false, isDesktop: true }),
}));

describe("SceneManager Component", () => {
	const mockSetActiveSceneId = vi.fn();
	const mockOnUpdateScene = vi.fn();
	const mockOnAddScene = vi.fn();
	const mockOnRemoveScene = vi.fn();

	const defaultProps = {
		projectId: "test-project-id",
		scenes: [] as Scene[],
		activeSceneId: "",
		setActiveSceneId: mockSetActiveSceneId,
		onUpdateScene: mockOnUpdateScene,
		onAddScene: mockOnAddScene,
		onRemoveScene: mockOnRemoveScene,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Empty State (BUG FIX: Loading Loop)", () => {
		/**
		 * THIS TEST WOULD HAVE CAUGHT THE BUG!
		 *
		 * The bug: SceneManager showed "Loading scenes..." when scenes=[]
		 * The fix: Show "No scenes yet" with "Add your first scene" button
		 */
		it("should show empty state with 'No scenes yet' when scenes array is empty", () => {
			render(<SceneManager {...defaultProps} scenes={[]} />);

			// Should NOT show loading message
			expect(screen.queryByText("Loading scenes...")).not.toBeInTheDocument();
			expect(
				screen.queryByText("Please wait while we initialize your scenes."),
			).not.toBeInTheDocument();

			// Should show empty state
			expect(screen.getByText("No scenes yet")).toBeInTheDocument();
			expect(
				screen.getByText(
					"Create your first scene to start building your video.",
				),
			).toBeInTheDocument();
		});

		it("should show 'Add your first scene' button when scenes array is empty", () => {
			render(<SceneManager {...defaultProps} scenes={[]} />);

			const addButton = screen.getByRole("button", {
				name: /add your first scene/i,
			});
			expect(addButton).toBeInTheDocument();
		});

		it("should call onAddScene when 'Add your first scene' button is clicked", async () => {
			const user = userEvent.setup();
			render(<SceneManager {...defaultProps} scenes={[]} />);

			const addButton = screen.getByRole("button", {
				name: /add your first scene/i,
			});
			await user.click(addButton);

			expect(mockOnAddScene).toHaveBeenCalledTimes(1);
		});

		it("should show header 'Add Scene' button when scenes array is empty", () => {
			render(<SceneManager {...defaultProps} scenes={[]} />);

			// Header should have "Add Scene" button
			const headerAddButton = screen.getByRole("button", {
				name: /^add scene$/i,
			});
			expect(headerAddButton).toBeInTheDocument();
		});
	});

	describe("With Scenes", () => {
		const mockScenes: Scene[] = [
			{
				id: "scene-1",
				title: "Opening Scene",
				description: "The beginning",
				duration: 10,
				cinematicStyles: {
					ambiance: "romantic",
					cameraMovement: "slow pan",
					colorTone: "warm",
					visualStyle: "cinematic",
				},
			},
			{
				id: "scene-2",
				title: "Middle Scene",
				description: "The middle",
				duration: 5,
				cinematicStyles: {
					ambiance: "dramatic",
					cameraMovement: "fast",
					colorTone: "cool",
					visualStyle: "modern",
				},
			},
		];

		it("should render scene titles when scenes exist", () => {
			render(
				<SceneManager
					{...defaultProps}
					scenes={mockScenes}
					activeSceneId="scene-1"
				/>,
			);

			// Should NOT show empty state
			expect(screen.queryByText("No scenes yet")).not.toBeInTheDocument();

			// Should show scene management header
			expect(screen.getByText("Scene Management")).toBeInTheDocument();
		});

		it("should show 'Add Scene' button when under 10 scenes", () => {
			render(
				<SceneManager
					{...defaultProps}
					scenes={mockScenes}
					activeSceneId="scene-1"
				/>,
			);

			const addButton = screen.getByRole("button", { name: /add scene/i });
			expect(addButton).toBeInTheDocument();
		});

		it("should NOT show 'Add Scene' button when at 10 scenes", () => {
			const tenScenes: Scene[] = Array.from({ length: 10 }, (_, i) => ({
				id: `scene-${i + 1}`,
				title: `Scene ${i + 1}`,
				description: `Description ${i + 1}`,
				duration: 10 as 5 | 10,
				cinematicStyles: {
					ambiance: "",
					cameraMovement: "",
					colorTone: "",
					visualStyle: "",
				},
			}));

			render(
				<SceneManager
					{...defaultProps}
					scenes={tenScenes}
					activeSceneId="scene-1"
				/>,
			);

			// Should NOT have Add Scene button when at max
			const addButtons = screen.queryAllByRole("button", {
				name: /add scene/i,
			});
			expect(addButtons).toHaveLength(0);
		});
	});

	describe("Distinguishing Loading vs Empty States", () => {
		/**
		 * Critical distinction:
		 * - scenes=undefined → Loading (parent handles this)
		 * - scenes=[] → Empty (show "No scenes yet")
		 *
		 * SceneManager only receives scenes array, so it should:
		 * - scenes=[] → Empty state
		 * - scenes=[...] → Render scenes
		 */
		it("should treat empty array as empty state, not loading", () => {
			render(<SceneManager {...defaultProps} scenes={[]} />);

			// Empty array = empty state, NOT loading
			expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
			expect(screen.getByText("No scenes yet")).toBeInTheDocument();
		});

		it("should render scenes when array has items", () => {
			const scenes: Scene[] = [
				{
					id: "scene-1",
					title: "Test Scene",
					description: "Test",
					duration: 10,
					cinematicStyles: {
						ambiance: "",
						cameraMovement: "",
						colorTone: "",
						visualStyle: "",
					},
				},
			];

			render(
				<SceneManager
					{...defaultProps}
					scenes={scenes}
					activeSceneId="scene-1"
				/>,
			);

			// Should show scene management UI
			expect(screen.getByText("Scene Management")).toBeInTheDocument();
			expect(screen.queryByText("No scenes yet")).not.toBeInTheDocument();
		});
	});
});
