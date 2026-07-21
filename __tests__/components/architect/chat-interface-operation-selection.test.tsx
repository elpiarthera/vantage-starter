/**
 * RED-first coverage for the defect: the architect plan confirm screen has
 * ONE button that takes the WHOLE proposal — there is no way to approve
 * only some operations (k1764ek8). Before this fix, `handleConfirm` always
 * sent every extracted operation to `createFromProposal`; unchecking an
 * operation had no effect because no checkbox existed at all.
 *
 * Two poles:
 * - RED1 / defect pole: unchecking an operation removes it from the
 *   created mission's proposal.
 * - RED2 / regression guard: unchecking nothing sends every operation, same
 *   as before the fix — the common case must not regress.
 * - RED3 / dependency-edge decision: unchecking an operation cascades to the
 *   operation that depends on it (see lib/architect/operation-selection.ts),
 *   and that dependent cannot be manually re-checked directly.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import en from "@/messages/en.json";

type Dict = Record<string, unknown>;

function resolve(
	dict: Dict,
	ns: string,
	key: string,
	params?: Record<string, string | number>,
): string {
	let value: unknown = (dict[ns] as Dict | undefined) ?? {};
	for (const segment of key.split(".")) {
		value = (value as Dict | undefined)?.[segment];
	}
	const text = typeof value === "string" ? value : key;
	if (!params) return text;
	return Object.entries(params).reduce(
		(acc, [paramKey, paramValue]) =>
			acc.replaceAll(`{${paramKey}}`, String(paramValue)),
		text,
	);
}

jest.mock("next-intl", () => ({
	useTranslations:
		(ns: string) => (key: string, params?: Record<string, string | number>) =>
			resolve(en, ns, key, params),
}));

const createFromProposalMock = jest.fn().mockResolvedValue("mission-1");
const completeSessionMock = jest.fn().mockResolvedValue(undefined);

jest.mock("convex/react", () => ({
	useMutation: (ref: string) => {
		if (ref === "missions.createFromProposal") return createFromProposalMock;
		if (ref === "architectSessions.complete") return completeSessionMock;
		return jest.fn();
	},
}));

jest.mock("@/convex/_generated/api", () => ({
	api: {
		architectSessions: {
			addMessage: "addMessage",
			complete: "architectSessions.complete",
		},
		missions: { createFromProposal: "missions.createFromProposal" },
	},
}));

const spec = {
	root: "root",
	elements: {
		root: {
			type: "MissionProposal",
			children: ["op1", "op2"],
			props: {
				name: "Landing page",
				brief: "Build it",
				objective: "Ship a page",
				estimatedTimeline: "2 days",
				successCriteria: [],
			},
		},
		op1: {
			type: "OperationItem",
			props: { id: "op1", name: "Design the layout", type: "ai" },
		},
		op2: {
			type: "OperationItem",
			props: {
				id: "op2",
				name: "Implement the layout",
				type: "ai",
				dependsOn: ["op1"],
			},
		},
	},
};

const mockChatState: {
	messages: Array<{
		id: string;
		role: "user" | "assistant";
		text: string;
		// biome-ignore lint/suspicious/noExplicitAny: minimal test double for Spec
		spec: any;
	}>;
	isStreaming: boolean;
	error: null;
	send: jest.Mock;
} = {
	messages: [{ id: "1", role: "assistant", text: "", spec }],
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

class MockResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
}
// biome-ignore lint/suspicious/noExplicitAny: test-only global polyfill
(global as any).ResizeObserver = MockResizeObserver;
Element.prototype.scrollIntoView = jest.fn();

import { ChatInterface } from "@/app/[locale]/dashboard/architect/_components/chat-interface";

describe("ChatInterface — per-operation plan approval", () => {
	beforeEach(() => {
		createFromProposalMock.mockClear();
		completeSessionMock.mockClear();
	});

	test("RED2 regression guard: confirming without unchecking anything sends every operation", async () => {
		render(
			<ChatInterface
				sessionId={"session-1" as never}
				workspaceId={"workspace-1" as never}
				onPlanConfirmed={jest.fn()}
			/>,
		);

		fireEvent.click(
			screen.getByRole("button", { name: /confirm and create mission/i }),
		);

		await screen.findByRole("button", { name: /confirm and create mission/i });
		expect(createFromProposalMock).toHaveBeenCalledTimes(1);
		const [{ proposal }] = createFromProposalMock.mock.calls[0];
		expect(proposal.operations.map((op: { id: string }) => op.id)).toEqual([
			"op1",
			"op2",
		]);
	});

	test("RED1: unchecking op1 (which op2 depends on) excludes both from the created mission", async () => {
		render(
			<ChatInterface
				sessionId={"session-1" as never}
				workspaceId={"workspace-1" as never}
				onPlanConfirmed={jest.fn()}
			/>,
		);

		const op1Checkbox = screen.getByRole("checkbox", {
			name: /design the layout/i,
		});
		fireEvent.click(op1Checkbox);

		fireEvent.click(
			screen.getByRole("button", { name: /confirm and create mission/i }),
		);

		await screen.findByRole("button", { name: /confirm and create mission/i });
		expect(createFromProposalMock).toHaveBeenCalledTimes(1);
		const [{ proposal }] = createFromProposalMock.mock.calls[0];
		expect(proposal.operations).toEqual([]);
	});

	test("RED3 dependency-edge decision: op2 (dependent) cannot be manually re-checked while op1 stays excluded", () => {
		render(
			<ChatInterface
				sessionId={"session-1" as never}
				workspaceId={"workspace-1" as never}
				onPlanConfirmed={jest.fn()}
			/>,
		);

		const op1Checkbox = screen.getByRole("checkbox", {
			name: /design the layout/i,
		});
		fireEvent.click(op1Checkbox); // exclude op1 -> op2 cascades to blocked

		const op2Checkbox = screen.getByRole("checkbox", {
			name: /implement the layout/i,
		});
		expect(op2Checkbox).toHaveAttribute("aria-disabled", "true");
		expect(op2Checkbox).toHaveAttribute("aria-checked", "false");

		// Attempting to click it must not re-include it.
		fireEvent.click(op2Checkbox);
		expect(op2Checkbox).toHaveAttribute("aria-checked", "false");
	});
});
