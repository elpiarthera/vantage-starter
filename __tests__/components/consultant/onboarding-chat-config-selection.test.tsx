/**
 * RED-first coverage for the defect: the consultant onboarding confirm
 * screen committed the WHOLE extracted config in one block — the user
 * could not keep some teams/agents/skills and drop others (CLASS survivor
 * of PR #71, k17ecjq9). Before this fix, `handleConfirm` always sent every
 * extracted team/agent/skill id to `updateProject`; unchecking one had no
 * effect because no checkbox existed at all.
 *
 * Two poles:
 * - RED1 / defect pole: unchecking a team removes it, its agent, and its
 *   skill from the committed project config.
 * - RED2 / regression guard: unchecking nothing sends every extracted id,
 *   same as before the fix — the common case must not regress.
 *
 * Mirrors __tests__/components/architect/chat-interface-operation-selection.test.tsx.
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

jest.mock("@/i18n/routing", () => ({
	useRouter: () => ({ push: jest.fn() }),
}));

const updateProjectMock = jest.fn().mockResolvedValue(undefined);
const updateStatusMock = jest.fn().mockResolvedValue(undefined);

jest.mock("convex/react", () => ({
	useMutation: (ref: string) => {
		if (ref === "consultantProjects.update") return updateProjectMock;
		if (ref === "consultantProjects.updateStatus") return updateStatusMock;
		return jest.fn();
	},
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
		consultantProjects: {
			get: "consultantProjects.get",
			update: "consultantProjects.update",
			updateStatus: "consultantProjects.updateStatus",
		},
	},
}));

const spec = {
	root: "root",
	elements: {
		root: {
			type: "OnboardingConfig",
			children: ["team1", "team2"],
			props: { summary: "Summary", painPoints: [] },
		},
		team1: {
			type: "TeamSelection",
			children: ["agent1"],
			props: {
				teamId: "team1",
				name: "Content Team",
				description: "",
				category: "content",
				agentCount: 1,
				selected: true,
			},
		},
		agent1: {
			type: "AgentSelection",
			children: ["skillA"],
			props: {
				agentId: "agent1",
				name: "Blog Writer",
				role: "writer",
				description: "",
				skills: ["skillA"],
				selected: true,
			},
		},
		skillA: {
			type: "SkillSelection",
			props: {
				skillId: "skillA",
				name: "SEO Copy",
				description: "",
				category: "content",
				selected: true,
			},
		},
		team2: {
			type: "TeamSelection",
			children: ["agent2"],
			props: {
				teamId: "team2",
				name: "Support Team",
				description: "",
				category: "support",
				agentCount: 1,
				selected: true,
			},
		},
		agent2: {
			type: "AgentSelection",
			children: ["skillB"],
			props: {
				agentId: "agent2",
				name: "Ticket Triage",
				role: "support",
				description: "",
				skills: ["skillB"],
				selected: true,
			},
		},
		skillB: {
			type: "SkillSelection",
			props: {
				skillId: "skillB",
				name: "Zendesk Routing",
				description: "",
				category: "support",
				selected: true,
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

import { OnboardingChat } from "@/app/[locale]/dashboard/consultant/onboard/[projectId]/_components/onboarding-chat";

describe("OnboardingChat — per-team/agent/skill config approval", () => {
	beforeEach(() => {
		updateProjectMock.mockClear();
		updateStatusMock.mockClear();
	});

	test("RED2 regression guard: confirming without unchecking anything commits every extracted id", async () => {
		render(<OnboardingChat projectId="project_1" />);

		fireEvent.click(
			screen.getByRole("button", { name: /deploy this config/i }),
		);

		await screen.findByRole("button", { name: /deploy this config/i });
		expect(updateProjectMock).toHaveBeenCalledTimes(1);
		const [call] = updateProjectMock.mock.calls[0];
		expect(call.selectedTeams).toEqual(["team1", "team2"]);
		expect(call.selectedAgents).toEqual(["agent1", "agent2"]);
		expect(call.selectedSkills).toEqual(["skillA", "skillB"]);
	});

	test("RED1: unchecking team1 excludes it, its agent, and its skill from the committed config", async () => {
		render(<OnboardingChat projectId="project_1" />);

		const team1Checkbox = screen.getByRole("checkbox", {
			name: /toggle team content team/i,
		});
		fireEvent.click(team1Checkbox);

		fireEvent.click(
			screen.getByRole("button", { name: /deploy this config/i }),
		);

		await screen.findByRole("button", { name: /deploy this config/i });
		expect(updateProjectMock).toHaveBeenCalledTimes(1);
		const [call] = updateProjectMock.mock.calls[0];
		expect(call.selectedTeams).toEqual(["team2"]);
		expect(call.selectedAgents).toEqual(["agent2"]);
		expect(call.selectedSkills).toEqual(["skillB"]);
	});

	test("dependency-edge decision: unchecking team1 blocks its agent's checkbox from being manually re-checked", () => {
		render(<OnboardingChat projectId="project_1" />);

		const team1Checkbox = screen.getByRole("checkbox", {
			name: /toggle team content team/i,
		});
		fireEvent.click(team1Checkbox); // exclude team1 -> agent1 cascades to blocked

		const agent1Checkbox = screen.getByRole("checkbox", {
			name: /toggle agent blog writer/i,
		});
		expect(agent1Checkbox).toHaveAttribute("aria-disabled", "true");
		expect(agent1Checkbox).toHaveAttribute("aria-checked", "false");

		// Attempting to click it must not re-include it.
		fireEvent.click(agent1Checkbox);
		expect(agent1Checkbox).toHaveAttribute("aria-checked", "false");

		// Re-checking team1 lifts the cascade and agent1 comes back
		// automatically. This does NOT guard the `blockedAgentIds`
		// early-return inside `toggleAgentExclusion`
		// (lib/consultant/config-selection.ts) — Base UI's
		// `<Checkbox disabled>` swallows the click before `onCheckedChange`
		// fires, so `handleToggleAgent` is never invoked on a blocked row.
		// That guard is unit-tested directly in
		// __tests__/lib/consultant/config-selection.test.ts.
		fireEvent.click(team1Checkbox); // re-check the team
		expect(agent1Checkbox).toHaveAttribute("aria-checked", "true");
	});
});
