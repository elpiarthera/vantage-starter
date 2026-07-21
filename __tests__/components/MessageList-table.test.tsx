/**
 * Coverage for the mcpcn `table` block wired into `MessageList` (Batch 2,
 * docs/mcpcn-block-mapping.md §4 "table"): a new `data-table` message-part
 * renderer so the agent can emit a real sortable/selectable table inline in
 * chat instead of a markdown wall of text. Replaces nothing — asserts the
 * `table` block renders the SAME row/column data the markdown fallback
 * carried, and that selecting a row fires a callback with that row's id.
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

function tableMessage(
	id: string,
	rows: Record<string, unknown>[],
	columns: { accessor: string; header: string }[],
): UIMessage {
	return {
		id,
		role: "assistant",
		parts: [
			{
				type: "data-table",
				data: { rows, columns },
			},
		],
	} as unknown as UIMessage;
}

describe("MessageList — table (mcpcn `table` block)", () => {
	const columns = [
		{ accessor: "fix", header: "Candidate fix" },
		{ accessor: "risk", header: "Risk" },
	];
	const rows = [
		{ id: "fix-1", fix: "Bump timeout", risk: "Low" },
		{ id: "fix-2", fix: "Retry with backoff", risk: "Medium" },
	];

	it("renders the same row/column data a markdown table would carry", () => {
		const messages = [tableMessage("1", rows, columns)];

		render(<MessageList messages={messages} isStreaming={false} />);

		expect(screen.getByText("Candidate fix")).toBeInTheDocument();
		expect(screen.getByText("Risk")).toBeInTheDocument();
		expect(screen.getByText("Bump timeout")).toBeInTheDocument();
		expect(screen.getByText("Retry with backoff")).toBeInTheDocument();
		expect(screen.getByText("Low")).toBeInTheDocument();
		expect(screen.getByText("Medium")).toBeInTheDocument();
	});

	it("selecting a row fires onTableRowSelect with that row's id", () => {
		const onTableRowSelect = jest.fn();
		const messages = [tableMessage("1", rows, columns)];

		render(
			<MessageList
				messages={messages}
				isStreaming={false}
				onTableRowSelect={onTableRowSelect}
			/>,
		);

		const targetRow = screen.getByText("Retry with backoff").closest("tr");
		expect(targetRow).not.toBeNull();
		if (targetRow) fireEvent.click(targetRow);

		expect(onTableRowSelect).toHaveBeenCalledWith("fix-2");
	});

	it("does not render an interactive table for a message with no data-table part (text messages unaffected)", () => {
		const messages: UIMessage[] = [
			{
				id: "text-1",
				role: "assistant",
				parts: [{ type: "text", text: "Hello there", state: "done" }],
			} as UIMessage,
		];

		render(<MessageList messages={messages} isStreaming={false} />);

		expect(document.querySelector("table")).toBeNull();
		expect(screen.getByText("Hello there")).toBeInTheDocument();
	});
});
