/**
 * Coverage for the mcpcn `quick-reply` block wired into `MessageList`.
 *
 * Batch 1 (docs/mcpcn-block-mapping.md): quick-reply buttons appear after
 * the last assistant message (when not streaming) so the user can tap a
 * fixed reply instead of typing. Asserts real behaviour: tapping a
 * quick-reply option calls the same send-message path a typed Enter would,
 * with that option's literal text.
 */

import { fireEvent, render, screen } from "@testing-library/react";
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

describe("MessageList — quick-reply", () => {
	it("shows quick-reply options after the last assistant message once streaming has stopped, and tapping one calls onQuickReply with its literal text", () => {
		const messages = [
			textMessage("1", "user", "What should we do with this?"),
			textMessage("2", "assistant", "Add this to the roadmap now or later?"),
		];
		const onQuickReply = jest.fn();

		render(
			<MessageList
				messages={messages}
				isStreaming={false}
				onQuickReply={onQuickReply}
			/>,
		);

		const nowButton = screen.getByRole("button", { name: "Add now" });
		fireEvent.click(nowButton);

		expect(onQuickReply).toHaveBeenCalledWith("Add now");
	});

	it("does not show quick-reply options while the assistant is still streaming", () => {
		const messages = [
			textMessage("1", "assistant", "Add this to the roadmap now or later?"),
		];
		const onQuickReply = jest.fn();

		render(
			<MessageList
				messages={messages}
				isStreaming={true}
				onQuickReply={onQuickReply}
			/>,
		);

		expect(screen.queryByRole("button", { name: "Add now" })).toBeNull();
	});

	it("does not show quick-reply options after a user message (only after the assistant)", () => {
		const messages = [
			textMessage("1", "assistant", "Add this to the roadmap now or later?"),
			textMessage("2", "user", "Now please"),
		];
		const onQuickReply = jest.fn();

		render(
			<MessageList
				messages={messages}
				isStreaming={false}
				onQuickReply={onQuickReply}
			/>,
		);

		expect(screen.queryByRole("button", { name: "Add now" })).toBeNull();
	});
});
