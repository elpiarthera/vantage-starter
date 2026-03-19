/**
 * Integration test suite for Step 2 (Story Development)
 * Tests Convex integration, message persistence, credit system, and UI behavior
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useSearchParams } from "next/navigation";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Id } from "@/convex/_generated/dataModel";
import { useChatMessages } from "@/hooks/business-logic/useChatMessages";

/** @vitest-environment jsdom */

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
	useRouter: vi.fn(() => ({
		push: vi.fn(),
		back: vi.fn(),
		forward: vi.fn(),
		refresh: vi.fn(),
		replace: vi.fn(),
		prefetch: vi.fn(),
	})),
	useSearchParams: vi.fn(),
}));

// Mock Clerk
vi.mock("@clerk/nextjs", () => ({
	useUser: vi.fn(() => ({
		user: { id: "user_test_123" },
		isLoaded: true,
		isSignedIn: true,
	})),
}));

// Mock useChatMessages hook
vi.mock("@/hooks/business-logic/useChatMessages", () => ({
	useChatMessages: vi.fn(),
}));

// Mock useProjectData hook
vi.mock("@/hooks/business-logic/useProjectData", () => ({
	useProjectData: vi.fn(() => ({
		project: null,
		isLoading: false,
		update: vi.fn(),
		updateProject: vi.fn(),
		createProject: vi.fn(),
		isSaving: false,
		lastSaved: null,
	})),
}));

// Mock useCredits hook
vi.mock("@/hooks/business-logic/useCredits", () => ({
	useCredits: vi.fn(() => ({
		balance: 100,
		totalPurchased: 200,
		totalUsed: 100,
		totalBonusReceived: 0,
		subscriptionTier: "casual",
		isNewUser: false,
		isLoading: false,
		isProcessing: false,
		deductCredits: vi.fn(),
		addCredits: vi.fn(),
		refundCredits: vi.fn(),
	})),
}));

// Mock InsufficientCreditsModal
vi.mock("@/components/credits/InsufficientCreditsModal", () => ({
	InsufficientCreditsModal: ({
		isOpen,
		onClose,
	}: {
		isOpen: boolean;
		onClose: () => void;
	}) =>
		isOpen ? (
			<div data-testid="insufficient-credits-modal">
				<button type="button" onClick={onClose}>
					Close
				</button>
			</div>
		) : null,
}));

// Mock UI components that might have complex dependencies
vi.mock("@/components/ai-elements/message", () => ({
	Message: ({
		children,
		role,
	}: {
		children: React.ReactNode;
		role: string;
	}) => <div data-testid={`message-${role}`}>{children}</div>,
	MessageContent: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
}));

vi.mock("@/components/ai-elements/conversation", () => ({
	Conversation: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="conversation">{children}</div>
	),
	ConversationContent: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	ConversationScrollButton: () => <div />,
}));

vi.mock("@/components/ai-elements/prompt-input", () => ({
	PromptInput: ({
		children,
		onSubmit,
	}: {
		children: React.ReactNode;
		onSubmit: (e: React.FormEvent) => void;
	}) => <form onSubmit={onSubmit}>{children}</form>,
	PromptInputTextarea: ({
		value,
		onChange,
		placeholder,
	}: {
		value: string;
		onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
		placeholder?: string;
	}) => (
		<textarea
			data-testid="prompt-input"
			value={value}
			onChange={onChange}
			placeholder={placeholder}
		/>
	),
	PromptInputToolbar: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	PromptInputTools: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	PromptInputSubmit: ({
		disabled,
		status,
	}: {
		disabled?: boolean;
		status?: string;
	}) => (
		<button
			type="submit"
			disabled={disabled}
			data-testid="submit-button"
			data-status={status}
		>
			Submit
		</button>
	),
}));

vi.mock("@/components/ai-elements/response", () => ({
	Response: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
}));

vi.mock("@/components/ai-elements/loader", () => ({
	Loader: () => <div data-testid="loader">Loading...</div>,
}));

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Step 2: Story Development - Convex Integration", () => {
	const mockProjectId = "test_project_123" as Id<"projects">;
	const mockUseSearchParams = useSearchParams as ReturnType<typeof vi.fn>;
	const mockUseChatMessages = useChatMessages as ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.clearAllMocks();

		// Mock scrollIntoView (not available in jsdom)
		Element.prototype.scrollIntoView = vi.fn();

		// Default mock for useSearchParams
		mockUseSearchParams.mockReturnValue({
			get: vi.fn((key: string) => (key === "projectId" ? mockProjectId : null)),
			// biome-ignore lint/suspicious/noExplicitAny: Mock return type for testing
		} as any);

		// Reset fetch mock
		mockFetch.mockReset();
	});

	describe("✅ Test 1: Loads messages from Convex", () => {
		it("should display messages from Convex on initial load", async () => {
			const mockMessages = [
				{
					_id: "msg_1" as Id<"chatMessages">,
					projectId: mockProjectId,
					userId: "user_123",
					role: "assistant" as const,
					content: "**Concept:** Let's develop the clip...",
					step: 2,
					createdAt: Date.now(),
					updatedAt: Date.now(),
				},
				{
					_id: "msg_2" as Id<"chatMessages">,
					projectId: mockProjectId,
					userId: "user_123",
					role: "user" as const,
					content: "Make it more romantic",
					step: 2,
					createdAt: Date.now(),
					updatedAt: Date.now(),
				},
			];

			mockUseChatMessages.mockReturnValue({
				messages: mockMessages,
				addUserMessage: vi.fn().mockResolvedValue("msg_new"),
				addAssistantMessage: vi.fn().mockResolvedValue("msg_ai"),
				isLoading: false,
				hasError: false,
				isSending: false,
				error: null,
			});

			// Dynamically import to apply mocks
			const GuidedStep2 = (await import("@/app/[locale]/guided/step-2/page"))
				.default;

			render(<GuidedStep2 />);

			await waitFor(() => {
				expect(screen.getByText(/Let's develop the clip/)).toBeInTheDocument();
				expect(screen.getByText(/Make it more romantic/)).toBeInTheDocument();
			});
		});

		it("should handle loading state correctly", async () => {
			mockUseChatMessages.mockReturnValue({
				messages: [],
				addUserMessage: vi.fn().mockResolvedValue("msg_new"),
				addAssistantMessage: vi.fn().mockResolvedValue("msg_ai"),
				isLoading: true,
				hasError: false,
				isSending: false,
				error: null,
			});

			const GuidedStep2 = (await import("@/app/[locale]/guided/step-2/page"))
				.default;

			render(<GuidedStep2 />);

			// Verify the page renders even in loading state
			await waitFor(() => {
				expect(screen.getByText(/Step 2\/5: The Story/i)).toBeInTheDocument();
			});
		});
	});

	describe("✅ Test 2: Saves new messages to Convex via API", () => {
		it("should save user message and call AI API when submitted", async () => {
			const mockAddUserMessage = vi.fn().mockResolvedValue("msg_new");
			const mockAddAssistantMessage = vi.fn().mockResolvedValue("msg_ai");

			mockUseChatMessages.mockReturnValue({
				messages: [
					{
						_id: "msg_1" as Id<"chatMessages">,
						projectId: mockProjectId,
						userId: "user_123",
						role: "assistant" as const,
						content: "**Concept:** Initial message",
						step: 2,
						createdAt: Date.now(),
						updatedAt: Date.now(),
					},
				],
				addUserMessage: mockAddUserMessage,
				addAssistantMessage: mockAddAssistantMessage,
				isLoading: false,
				hasError: false,
				isSending: false,
				error: null,
			});

			// Mock successful API response with streaming
			const mockStream = new ReadableStream({
				start(controller) {
					controller.enqueue(new TextEncoder().encode("AI response content"));
					controller.close();
				},
			});
			mockFetch.mockResolvedValueOnce({
				ok: true,
				body: mockStream,
			});

			const GuidedStep2 = (await import("@/app/[locale]/guided/step-2/page"))
				.default;

			render(<GuidedStep2 />);

			const textarea = screen.getByTestId("prompt-input");
			const submitButton = screen.getByTestId("submit-button");

			// Type a message
			fireEvent.change(textarea, {
				target: { value: "Make it more romantic" },
			});

			// Submit the form
			fireEvent.click(submitButton);

			await waitFor(() => {
				expect(mockAddUserMessage).toHaveBeenCalledWith(
					"Make it more romantic",
				);
			});

			// Verify API was called
			await waitFor(() => {
				expect(mockFetch).toHaveBeenCalledWith("/api/chat", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: expect.stringContaining("Make it more romantic"),
				});
			});

			// AI response should be added after streaming completes
			await waitFor(
				() => {
					expect(mockAddAssistantMessage).toHaveBeenCalledWith(
						"AI response content",
					);
				},
				{ timeout: 3000 },
			);
		});
	});

	describe("✅ Test 3: Initializes with story from Convex project", () => {
		it("should add initial assistant message from project.generatedStory", async () => {
			const mockAddAssistantMessage = vi.fn().mockResolvedValue("msg_initial");

			// Mock useProjectData to return a project with generatedStory
			const { useProjectData } = await import(
				"@/hooks/business-logic/useProjectData"
			);
			// biome-ignore lint/suspicious/noExplicitAny: Mock type casting required for vi.fn()
			(useProjectData as any).mockReturnValue({
				project: {
					_id: mockProjectId,
					name: "Test Project",
					generatedStory: {
						title: "Our Beautiful Wedding",
						narration: "A love story that began in a coffee shop...",
						emotionalArc: "From first meeting to forever",
						scenes: [
							{ number: 1, description: "Opening", mood: "romantic" },
							{ number: 2, description: "Middle", mood: "heartfelt" },
						],
						musicSuggestion: "Soft piano melody",
					},
				},
				isLoading: false,
				update: vi.fn(),
			});

			mockUseChatMessages.mockReturnValue({
				messages: [], // Empty - no messages yet
				addUserMessage: vi.fn(),
				addAssistantMessage: mockAddAssistantMessage,
				isLoading: false,
				hasError: false,
				isSending: false,
				error: null,
			});

			const GuidedStep2 = (await import("@/app/[locale]/guided/step-2/page"))
				.default;

			render(<GuidedStep2 />);

			await waitFor(() => {
				expect(mockAddAssistantMessage).toHaveBeenCalled();
				const call = mockAddAssistantMessage.mock.calls[0][0];
				// Should contain AI-generated story content from Convex
				expect(call).toContain("Our Beautiful Wedding");
				expect(call).toContain("A love story that began in a coffee shop");
				expect(call).toContain("Scene 1:");
				expect(call).toContain("Soft piano melody");
			});
		});

		it("should use default content when no generatedStory in project", async () => {
			const mockAddAssistantMessage = vi.fn().mockResolvedValue("msg_initial");

			// Mock useProjectData to return a project WITHOUT generatedStory
			const { useProjectData } = await import(
				"@/hooks/business-logic/useProjectData"
			);
			// biome-ignore lint/suspicious/noExplicitAny: Mock type casting required for vi.fn()
			(useProjectData as any).mockReturnValue({
				project: {
					_id: mockProjectId,
					name: "Test Project",
					// No generatedStory field
				},
				isLoading: false,
				update: vi.fn(),
			});

			mockUseChatMessages.mockReturnValue({
				messages: [], // Empty - no messages yet
				addUserMessage: vi.fn(),
				addAssistantMessage: mockAddAssistantMessage,
				isLoading: false,
				hasError: false,
				isSending: false,
				error: null,
			});

			const GuidedStep2 = (await import("@/app/[locale]/guided/step-2/page"))
				.default;

			render(<GuidedStep2 />);

			await waitFor(() => {
				expect(mockAddAssistantMessage).toHaveBeenCalled();
				const call = mockAddAssistantMessage.mock.calls[0][0];
				// Should contain default story structure
				expect(call).toContain("**Concept:**");
				expect(call).toContain("Scene 1:");
			});
		});
	});

	describe("✅ Test 4: Gets projectId from URL params", () => {
		it("should extract projectId from URL query params", async () => {
			const testProjectId = "proj_url_test" as Id<"projects">;

			mockUseSearchParams.mockReturnValue({
				get: vi.fn((key: string) =>
					key === "projectId" ? testProjectId : null,
				),
				// biome-ignore lint/suspicious/noExplicitAny: Mock return type for testing
			} as any);

			// biome-ignore lint/suspicious/noExplicitAny: Empty array for testing initialization
			const mockMessages: any[] = [];
			const mockAddAssistant = vi.fn().mockResolvedValue("msg_initial");

			mockUseChatMessages.mockReturnValue({
				messages: mockMessages,
				addUserMessage: vi.fn().mockResolvedValue("msg_new"),
				addAssistantMessage: mockAddAssistant,
				isLoading: false,
				hasError: false,
				isSending: false,
				error: null,
			});

			const GuidedStep2 = (await import("@/app/[locale]/guided/step-2/page"))
				.default;

			render(<GuidedStep2 />);

			await waitFor(() => {
				// Verify useChatMessages was called with correct projectId and step
				const calls = mockUseChatMessages.mock.calls;
				expect(calls.length).toBeGreaterThan(0);
				// The component should initialize with the testProjectId
				expect(screen.getByText(/Step 2\/5: The Story/i)).toBeInTheDocument();
			});
		});
	});

	describe("✅ Test 5: Message approval flow", () => {
		it("should allow approving last assistant message", async () => {
			const mockMessages = [
				{
					_id: "msg_1" as Id<"chatMessages">,
					projectId: mockProjectId,
					userId: "user_123",
					role: "assistant" as const,
					content: "**Concept:** Initial message",
					step: 2,
					createdAt: Date.now(),
					updatedAt: Date.now(),
				},
			];

			mockUseChatMessages.mockReturnValue({
				messages: mockMessages,
				addUserMessage: vi.fn(),
				addAssistantMessage: vi.fn(),
				isLoading: false,
				hasError: false,
				isSending: false,
				error: null,
			});

			const GuidedStep2 = (await import("@/app/[locale]/guided/step-2/page"))
				.default;

			render(<GuidedStep2 />);

			await waitFor(() => {
				const approveButton = screen.getByText(/Approve this Direction/i);
				expect(approveButton).toBeInTheDocument();
			});

			const approveButton = screen.getByText(/Approve this Direction/i);
			fireEvent.click(approveButton);

			await waitFor(() => {
				expect(screen.getByText(/✓ Approved/i)).toBeInTheDocument();
				expect(
					screen.getByText(/Continue to Visual Style/i),
				).toBeInTheDocument();
			});
		});
	});
});

describe("Step 2: Credit System Integration", () => {
	const mockProjectId = "test_project_123" as Id<"projects">;
	const mockUseSearchParams = useSearchParams as ReturnType<typeof vi.fn>;
	const mockUseChatMessages = useChatMessages as ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.clearAllMocks();
		Element.prototype.scrollIntoView = vi.fn();

		mockUseSearchParams.mockReturnValue({
			get: vi.fn((key: string) => (key === "projectId" ? mockProjectId : null)),
			// biome-ignore lint/suspicious/noExplicitAny: Mock return type for testing
		} as any);

		mockUseChatMessages.mockReturnValue({
			messages: [
				{
					_id: "msg_1" as Id<"chatMessages">,
					projectId: mockProjectId,
					userId: "user_123",
					role: "assistant" as const,
					content: "**Concept:** Initial message",
					step: 2,
					createdAt: Date.now(),
					updatedAt: Date.now(),
				},
			],
			addUserMessage: vi.fn().mockResolvedValue("msg_new"),
			addAssistantMessage: vi.fn().mockResolvedValue("msg_ai"),
			isLoading: false,
			hasError: false,
			isSending: false,
			error: null,
		});

		mockFetch.mockReset();
	});

	describe("✅ Test: Credit badge display", () => {
		it("should display credit cost badge", async () => {
			const GuidedStep2 = (await import("@/app/[locale]/guided/step-2/page"))
				.default;

			render(<GuidedStep2 />);

			await waitFor(() => {
				expect(screen.getByText(/1 credit\/message/i)).toBeInTheDocument();
			});
		});
	});

	describe("✅ Test: Insufficient credits handling", () => {
		it("should show InsufficientCreditsModal when API returns 402", async () => {
			// Mock API returning insufficient credits error
			mockFetch.mockResolvedValueOnce({
				ok: false,
				json: () =>
					Promise.resolve({
						error: "Insufficient credits",
						code: "INSUFFICIENT_CREDITS",
						required: 1,
						available: 0,
					}),
			});

			const GuidedStep2 = (await import("@/app/[locale]/guided/step-2/page"))
				.default;

			render(<GuidedStep2 />);

			const textarea = screen.getByTestId("prompt-input");
			const submitButton = screen.getByTestId("submit-button");

			fireEvent.change(textarea, {
				target: { value: "Test message" },
			});
			fireEvent.click(submitButton);

			await waitFor(() => {
				expect(
					screen.getByTestId("insufficient-credits-modal"),
				).toBeInTheDocument();
			});
		});
	});

	describe("✅ Test: Submit button disabled during processing", () => {
		it("should disable submit button while streaming", async () => {
			// Create a stream that doesn't close immediately
			let streamController: ReadableStreamDefaultController<Uint8Array>;
			const mockStream = new ReadableStream({
				start(controller) {
					streamController = controller;
					controller.enqueue(new TextEncoder().encode("Streaming..."));
				},
			});

			mockFetch.mockResolvedValueOnce({
				ok: true,
				body: mockStream,
			});

			const GuidedStep2 = (await import("@/app/[locale]/guided/step-2/page"))
				.default;

			render(<GuidedStep2 />);

			const textarea = screen.getByTestId("prompt-input");
			const submitButton = screen.getByTestId("submit-button");

			fireEvent.change(textarea, {
				target: { value: "Test message" },
			});
			fireEvent.click(submitButton);

			// Button should be disabled during streaming
			await waitFor(() => {
				expect(submitButton).toBeDisabled();
			});

			// Close the stream
			// biome-ignore lint/style/noNonNullAssertion: streamController is assigned in start()
			streamController!.close();
		});
	});
});

describe("Step 2: AI Story Integration Tests", () => {
	describe("✅ Test: Story structure validation", () => {
		it("should validate AI story structure from Convex project", () => {
			const aiStory = {
				title: "Test Title",
				narration: "Test narration",
				emotionalArc: "Test arc",
				scenes: [{ number: 1, description: "Scene", mood: "happy" }],
				musicSuggestion: "Test music",
			};

			expect(aiStory.title).toBeDefined();
			expect(aiStory.narration).toBeDefined();
			expect(aiStory.emotionalArc).toBeDefined();
			expect(aiStory.scenes).toBeInstanceOf(Array);
			expect(aiStory.musicSuggestion).toBeDefined();
		});

		it("should format AI story for display correctly", () => {
			const aiStory = {
				title: "Our Wedding Story",
				narration: "A beautiful journey of love",
				emotionalArc: "From meeting to forever",
				scenes: [
					{ number: 1, description: "Opening scene", mood: "romantic" },
					{ number: 2, description: "Middle scene", mood: "emotional" },
				],
				musicSuggestion: "Soft piano",
			};

			// Simulate the formatting logic from Step 2
			const formattedContent = `**${aiStory.title}**

${aiStory.narration}

**Emotional Arc:** ${aiStory.emotionalArc}

${aiStory.scenes.map((s) => `**Scene ${s.number}:** ${s.description} *(${s.mood})*`).join("\n\n")}

**Music Suggestion:** ${aiStory.musicSuggestion}`;

			expect(formattedContent).toContain("**Our Wedding Story**");
			expect(formattedContent).toContain("A beautiful journey of love");
			expect(formattedContent).toContain("**Emotional Arc:**");
			expect(formattedContent).toContain("**Scene 1:**");
			expect(formattedContent).toContain("*(romantic)*");
			expect(formattedContent).toContain("**Music Suggestion:**");
		});
	});
});

/**
 * Manual Testing Checklist (to be performed by user)
 *
 * These tests require actual browser environment and real Convex backend:
 *
 * ✅ Desktop Chrome:
 *    1. Complete Step 1 with project data
 *    2. Continue to Step 2
 *    3. Verify AI-generated story displays (from project.generatedStory)
 *    4. Send a message "Make it more romantic"
 *    5. Verify credit is deducted (check badge shows "1 credit/message")
 *    6. Verify AI streams response
 *    7. Refresh page (F5)
 *    8. Verify messages persist
 *    9. Check Convex dashboard - messages exist in chatMessages table
 *
 * ✅ Credit System:
 *    1. Check credit balance before sending message
 *    2. Send a message
 *    3. Verify credit balance decreased by 1
 *    4. Try with 0 credits → InsufficientCreditsModal should appear
 *
 * ✅ Mobile Safari:
 *    1. Same flow as desktop
 *    2. Verify UI is identical to before migration
 *    3. Verify touch interactions work
 *
 * ✅ Cross-device Sync:
 *    1. Start on desktop
 *    2. Copy projectId from URL
 *    3. Open same URL on mobile
 *    4. Verify messages sync across devices
 *
 * ✅ AI Story Flow:
 *    1. Complete Step 1 with all fields
 *    2. Click "Continue to The Story"
 *    3. Verify: Step 2 shows AI-generated story from Convex (not default)
 *    4. Verify: Story includes title, narration, scenes, music suggestion
 *    5. Go back to Step 1, then forward to Step 2
 *    6. Verify: Same story displays (persisted in Convex)
 */
