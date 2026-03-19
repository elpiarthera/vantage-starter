/** @vitest-environment jsdom */

import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GuidedStep6 from "@/app/[locale]/guided/step-6/page";

const scenesMock = [{ _id: "scene-1" }];

type ProjectState = {
	_id: string;
	name: string;
	eventDetails: { emotionalStory: string; eventTitle: string };
	status: string;
	assemblyStatus?: string;
	finalVideoUrl?: string;
	narrationAudioUrl?: string;
	musicAudioUrl?: string;
};

let projectState: ProjectState = {
	_id: "proj-1",
	name: "Test Project",
	eventDetails: { emotionalStory: "Story", eventTitle: "Event" },
	status: "in_progress",
	assemblyStatus: undefined,
	finalVideoUrl: undefined,
	narrationAudioUrl: "https://nar.mp3",
	musicAudioUrl: "https://music.mp3",
};

vi.mock("@clerk/nextjs", () => ({
	useUser: () => ({ user: { id: "user-1" } }),
}));

vi.mock("next/navigation", () => {
	const params = new URLSearchParams("projectId=proj-1");
	return {
		useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
		useSearchParams: () => params,
	};
});

vi.mock("convex/react", () => ({
	useAction: () => vi.fn(),
	useMutation: () => vi.fn(),
	useQuery: () => scenesMock,
}));

vi.mock("@/hooks/business-logic/useCredits", () => ({
	useCredits: () => ({ balance: 10 }),
}));

vi.mock("@/hooks/business-logic/useProjectData", () => ({
	useProjectData: () => ({ project: projectState, isLoading: false }),
}));

describe("Step 6 UI", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("shows render animation on initial load", () => {
		projectState = {
			...projectState,
			assemblyStatus: undefined,
			finalVideoUrl: undefined,
		};

		render(<GuidedStep6 />);

		// Initial state shows the rendering animation
		expect(
			screen.getByText(/Assembling Your Masterpiece/i),
		).toBeInTheDocument();
		expect(
			screen.getByText(/Generating video clips with Kling/i),
		).toBeInTheDocument();
	});

	it("shows progress state during assembly", () => {
		projectState = {
			...projectState,
			assemblyStatus: "processing_media",
		};

		render(<GuidedStep6 />);
		act(() => {
			vi.advanceTimersByTime(100);
		});

		expect(screen.getByText(/Assembly in Progress/i)).toBeInTheDocument();
		expect(
			screen.getByText(/Mixing audio & stitching scenes/i),
		).toBeInTheDocument();
	});

	it("shows success UI when assembly completes", () => {
		projectState = {
			...projectState,
			assemblyStatus: "completed",
			finalVideoUrl: "https://convex/final.mp4",
		};

		render(<GuidedStep6 />);
		act(() => {
			vi.advanceTimersByTime(100);
		});

		expect(screen.getByText(/Your video is ready/i)).toBeInTheDocument();
		expect(screen.getByText(/Download/i)).toBeInTheDocument();
	});

	it("shows failed state with retry option", () => {
		projectState = {
			...projectState,
			assemblyStatus: "failed",
			finalVideoUrl: undefined,
		};

		render(<GuidedStep6 />);
		act(() => {
			vi.advanceTimersByTime(100);
		});

		expect(screen.getByText(/Assembly Failed/i)).toBeInTheDocument();
		expect(screen.getByText(/Try Again/i)).toBeInTheDocument();
	});
});
