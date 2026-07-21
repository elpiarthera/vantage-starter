/**
 * Consumer coverage for the M6 Radix -> Base UI `scroll-area.tsx` migration
 * (docs/migration-base-ui.md). `OnboardingChat` is one of `scroll-area.tsx`'s
 * three consumers — this test proves the real chat message bubbles render
 * as content correctly nested inside the migrated
 * `data-slot="scroll-area-viewport"` element, not merely that the component
 * mounts.
 */

import { render, screen } from "@testing-library/react";
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

jest.mock("@/i18n/routing", () => ({
	useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("convex/react", () => ({
	useMutation: () => jest.fn(),
	useQuery: () => ({
		_id: "project_1",
		name: "Acme Corp onboarding",
		clientName: "Acme Corp",
		sector: "retail",
		sessionId: "session_1",
	}),
}));

jest.mock("@/convex/_generated/api", () => ({
	api: {
		architectSessions: { addMessage: "addMessage" },
		consultantProjects: { get: "consultantProjects.get" },
	},
}));

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
	messages: [
		{ id: "1", role: "user", text: "We sell running shoes", spec: null },
		{
			id: "2",
			role: "assistant",
			text: "Got it, let's map your team next.",
			spec: null,
		},
	],
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

// Base UI's ScrollArea.Viewport uses ResizeObserver internally, which jsdom
// does not implement.
class MockResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
}
// biome-ignore lint/suspicious/noExplicitAny: test-only global polyfill
(global as any).ResizeObserver = MockResizeObserver;

// jsdom does not implement scrollIntoView; OnboardingChat's sentinel-follow
// effect calls it on mount.
Element.prototype.scrollIntoView = jest.fn();

import { OnboardingChat } from "@/app/[locale]/dashboard/consultant/onboard/[projectId]/_components/onboarding-chat";

describe("OnboardingChat (ScrollArea migrated to Base UI)", () => {
	test("renders real message bubbles nested inside the scroll-area viewport", () => {
		render(<OnboardingChat projectId="project_1" />);

		const userMessage = screen.getByText("We sell running shoes");
		const assistantMessage = screen.getByText(
			"Got it, let's map your team next.",
		);
		expect(userMessage).toBeInTheDocument();
		expect(assistantMessage).toBeInTheDocument();

		const viewport = document.querySelector(
			'[data-slot="scroll-area-viewport"]',
		);
		expect(viewport).not.toBeNull();
		expect(viewport).toContainElement(userMessage);
		expect(viewport).toContainElement(assistantMessage);
	});
});
