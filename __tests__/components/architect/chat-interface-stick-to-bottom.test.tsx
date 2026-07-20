/**
 * RED-first coverage for the defect: a generated Architect plan's top is
 * unreachable. `ChatInterface`'s auto-scroll effect
 * (`sentinelRef.current?.scrollIntoView(...)`) fires on every
 * `messages.length`/`isStreaming` change with no regard for where the user
 * currently is. A long plan streams in over many chunks; each chunk yanks
 * the viewport back to the bottom sentinel, even if the user just scrolled
 * up to read the beginning of the plan. The "Confirm plan" button sits
 * right under the unreachable content.
 *
 * Fix: auto-scroll only follows the stream while the user is already at (or
 * near) the bottom of the scrollable viewport. The moment they scroll away,
 * the automatic recall stops until they return to the bottom themselves.
 *
 * Two poles are asserted:
 * - Defect pole: user has scrolled away from the bottom -> new streamed
 *   content must NOT pull the viewport back down.
 * - Guard pole: user IS at the bottom -> new streamed content DOES follow,
 *   so a lazy fix that simply deletes the auto-scroll effect also fails.
 */

import { render } from "@testing-library/react";
import en from "@/messages/en.json";

type Dict = Record<string, unknown>;

function resolve(dict: Dict, ns: string, key: string): string {
	let value: unknown = (dict[ns] as Dict | undefined) ?? {};
	for (const segment of key.split(".")) {
		value = (value as Dict | undefined)?.[segment];
	}
	return typeof value === "string" ? value : key;
}

jest.mock("next-intl", () => ({
	useTranslations: (ns: string) => (key: string) => resolve(en, ns, key),
}));

jest.mock("convex/react", () => ({
	useMutation: () => jest.fn(),
}));

jest.mock("@/convex/_generated/api", () => ({
	api: { architectSessions: { addMessage: "addMessage" } },
}));

// Minimal stand-in for @json-render/react — we only need JSONUIProvider /
// Renderer to render something inert, and useChatUI to be fully controlled
// by the test via `mockChatState`.
const mockChatState: {
	messages: Array<{
		id: string;
		role: "user" | "assistant";
		text: string;
		spec: null;
	}>;
	isStreaming: boolean;
	error: null;
	send: jest.Mock;
} = {
	messages: [],
	isStreaming: false,
	error: null,
	send: jest.fn(),
};

jest.mock("@json-render/react", () => ({
	useChatUI: () => mockChatState,
	JSONUIProvider: ({ children }: { children: React.ReactNode }) => (
		<>{children}</>
	),
	Renderer: () => null,
}));

// Radix ScrollArea's Viewport uses ResizeObserver internally, which jsdom
// does not implement.
class MockResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
}
// biome-ignore lint/suspicious/noExplicitAny: test-only global polyfill
(global as any).ResizeObserver = MockResizeObserver;

import { ChatInterface } from "@/app/[locale]/dashboard/architect/_components/chat-interface";

function getViewport(): HTMLElement {
	const viewport = document.querySelector<HTMLElement>(
		'[data-slot="scroll-area-viewport"]',
	);
	if (!viewport) throw new Error("scroll-area-viewport not found");
	return viewport;
}

/** Simulate a real scrollable viewport at a given scroll position. */
function setViewportScroll(
	viewport: HTMLElement,
	{
		scrollTop,
		scrollHeight,
		clientHeight,
	}: { scrollTop: number; scrollHeight: number; clientHeight: number },
) {
	Object.defineProperty(viewport, "scrollTop", {
		configurable: true,
		value: scrollTop,
	});
	Object.defineProperty(viewport, "scrollHeight", {
		configurable: true,
		value: scrollHeight,
	});
	Object.defineProperty(viewport, "clientHeight", {
		configurable: true,
		value: clientHeight,
	});
}

function renderInterface() {
	return render(
		<ChatInterface
			sessionId={"session-1" as never}
			workspaceId={"workspace-1" as never}
			onPlanConfirmed={jest.fn()}
		/>,
	);
}

describe("ChatInterface — stick-to-bottom auto-scroll", () => {
	let scrollIntoViewMock: jest.Mock;

	beforeEach(() => {
		mockChatState.messages = [];
		mockChatState.isStreaming = false;
		scrollIntoViewMock = jest.fn();
		// jsdom does not implement scrollIntoView at all.
		Element.prototype.scrollIntoView = scrollIntoViewMock;
	});

	test("while streaming, if the user has scrolled away from the bottom, the view is NOT pulled back down", () => {
		mockChatState.messages = [
			{ id: "1", role: "user", text: "Build me a landing page", spec: null },
			{
				id: "2",
				role: "assistant",
				text: "Here is the plan so far...",
				spec: null,
			},
		];
		mockChatState.isStreaming = true;

		const { rerender } = renderInterface();

		const viewport = getViewport();
		// User scrolled up, away from the bottom, mid-stream.
		setViewportScroll(viewport, {
			scrollTop: 0,
			scrollHeight: 4000,
			clientHeight: 600,
		});
		viewport.dispatchEvent(new Event("scroll"));

		scrollIntoViewMock.mockClear();

		// A new streamed chunk arrives -> message count / streaming state
		// change, the same trigger the production effect depends on.
		mockChatState.messages = [
			...mockChatState.messages,
			{
				id: "3",
				role: "assistant",
				text: "...continuing the plan",
				spec: null,
			},
		];
		rerender(
			<ChatInterface
				sessionId={"session-1" as never}
				workspaceId={"workspace-1" as never}
				onPlanConfirmed={jest.fn()}
			/>,
		);

		expect(scrollIntoViewMock).not.toHaveBeenCalled();
	});

	test("while streaming, if the user IS at the bottom, the view DOES follow new content", () => {
		mockChatState.messages = [
			{ id: "1", role: "user", text: "Build me a landing page", spec: null },
			{
				id: "2",
				role: "assistant",
				text: "Here is the plan so far...",
				spec: null,
			},
		];
		mockChatState.isStreaming = true;

		const { rerender } = renderInterface();

		const viewport = getViewport();
		// User is at the bottom (distance from bottom = 0).
		setViewportScroll(viewport, {
			scrollTop: 3400,
			scrollHeight: 4000,
			clientHeight: 600,
		});
		viewport.dispatchEvent(new Event("scroll"));

		scrollIntoViewMock.mockClear();

		mockChatState.messages = [
			...mockChatState.messages,
			{
				id: "3",
				role: "assistant",
				text: "...continuing the plan",
				spec: null,
			},
		];
		rerender(
			<ChatInterface
				sessionId={"session-1" as never}
				workspaceId={"workspace-1" as never}
				onPlanConfirmed={jest.fn()}
			/>,
		);

		expect(scrollIntoViewMock).toHaveBeenCalled();
	});
});
