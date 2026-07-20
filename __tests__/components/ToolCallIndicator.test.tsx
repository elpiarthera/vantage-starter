/**
 * Coverage for the mcpcn `status-badge` wiring into `ToolCallIndicator`.
 *
 * Before this change, the pill's active/done markup was hand-rolled inline
 * SVGs (`<svg><path d="M2 6l3 3 5-5" .../></svg>` for done, a spinning
 * `<span>` border for active) with a hardcoded `oklch(...)` color for the
 * active state — never emitting `data-slot="status-badge"`. This test
 * asserts the ported block is actually rendered (`data-slot="status-badge"`)
 * and that no hardcoded oklch color leaks into the DOM className.
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
	useTranslations: (ns: string) => (key: string, vars?: Record<string, unknown>) => {
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

import { ToolCallIndicator } from "@/components/chat/ToolCallIndicator";

describe("ToolCallIndicator", () => {
	it("renders the ported status-badge block (not a bespoke pill) for an active tool call", () => {
		render(<ToolCallIndicator toolName="searchKB" state="streaming" />);

		const badge = document.querySelector('[data-slot="status-badge"]');
		expect(badge).not.toBeNull();
		expect(screen.getByText("Searching knowledge base...")).toBeInTheDocument();
	});

	it("renders the ported status-badge block for a completed tool call", () => {
		render(<ToolCallIndicator toolName="searchKB" state="result" />);

		const badge = document.querySelector('[data-slot="status-badge"]');
		expect(badge).not.toBeNull();
		expect(screen.getByText("Knowledge base searched")).toBeInTheDocument();
	});

	it("never emits a hardcoded oklch() color in the rendered className", () => {
		const { container } = render(
			<ToolCallIndicator toolName="searchKB" state="streaming" />,
		);

		const html = container.innerHTML;
		expect(html).not.toMatch(/oklch\(/i);
	});
});
