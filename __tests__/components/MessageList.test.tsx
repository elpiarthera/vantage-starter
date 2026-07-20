/**
 * Coverage for the mcpcn `message-bubble` + `chat-conversation` wiring into
 * `MessageList`.
 *
 * Before this change, message rendering was a hand-rolled bubble div
 * (`rounded-2xl px-4 py-3 ...`) with its own inline `AgentAvatar`/
 * `StreamingCursor` — never emitting `data-slot="message-bubble"`. This
 * test asserts the ported block is actually rendered, and that every
 * pre-existing behaviour (streaming cursor, i18n empty state, the
 * `role="log"` live region) survives the rewiring.
 */

import { render, screen } from "@testing-library/react";
import type { UIMessage } from "ai";
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
	useTranslations:
		(ns: string) => (key: string, vars?: Record<string, unknown>) => {
			const resolved = resolve(en, ns, key);
			if (vars && typeof resolved === "string") {
				return Object.entries(vars).reduce(
					(acc, [k, v]) => acc.replace(`{${k}}`, String(v)),
					resolved,
				);
			}
			return resolved;
		},
}));

import { MessageList } from "@/components/chat/MessageList";

function textMessage(
	id: string,
	role: "user" | "assistant",
	text: string,
): UIMessage {
	return {
		id,
		role,
		parts: [{ type: "text", text, state: "done" }],
	} as UIMessage;
}

describe("MessageList", () => {
	it("renders assistant + user text through the ported message-bubble block", () => {
		const messages = [
			textMessage("1", "user", "Hello there"),
			textMessage("2", "assistant", "General Kenobi"),
		];

		render(<MessageList messages={messages} isStreaming={false} />);

		const bubbles = document.querySelectorAll('[data-slot="message-bubble"]');
		expect(bubbles.length).toBe(2);
		expect(screen.getByText("Hello there")).toBeInTheDocument();
		expect(screen.getByText("General Kenobi")).toBeInTheDocument();
	});

	it("keeps the streaming cursor on the last assistant message while streaming", () => {
		const messages = [textMessage("1", "assistant", "Thinking")];

		render(<MessageList messages={messages} isStreaming={true} />);

		const cursor = document.querySelector(".animate-pulse");
		expect(cursor).not.toBeNull();
	});

	it("keeps the aria-live log region and its i18n label", () => {
		const messages = [textMessage("1", "user", "Hi")];

		render(<MessageList messages={messages} isStreaming={false} />);

		const log = screen.getByRole("log");
		expect(log).toHaveAttribute("aria-live", "polite");
		expect(log).toHaveAttribute("aria-label", "Chat messages");
	});

	it("keeps the empty state with its i18n copy when there are no messages", () => {
		render(<MessageList messages={[]} isStreaming={false} />);

		expect(screen.getByText("Start a conversation")).toBeInTheDocument();
	});
});
