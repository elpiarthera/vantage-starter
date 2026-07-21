/**
 * RED-first coverage for the mcpcn `tag-select` wiring into `MissionFilters`.
 *
 * Before this change, the status filter section was a hand-rolled list of
 * `<input type="checkbox">` rows (`CheckboxRow`) — functionally a multi-select
 * toggle list with a "clear" affordance, which is exactly what the ported
 * `tag-select` block already does. This test asserts the BEHAVIOUR the
 * status filter must keep after the block replaces the checkboxes:
 *   - clicking a status tag toggles it into `filters.statuses` and calls
 *     `onFiltersChange` with the updated array (live filtering, no separate
 *     "apply" step — this is the property that made a naive `TagSelect`
 *     wiring risky, since the block's `onValidate` action requires an
 *     explicit submit; the wiring must forward every toggle instead).
 *   - clicking twice removes it again (untoggle).
 *   - the tag-select "clear" action empties the whole status selection.
 * Never asserts import/source substrings (banned by PR #77).
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import {
	type MissionFilterState,
	MissionFilters,
} from "@/components/missions/mission-filters";
import en from "@/messages/en.json";

type Dict = Record<string, unknown>;

function resolve(dict: Dict, ns: string, key: string): string {
	let value: unknown = dict;
	for (const segment of [...ns.split("."), ...key.split(".")]) {
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

function ControlledMissionFilters({
	onForward,
}: {
	onForward: (statuses: MissionFilterState["statuses"]) => void;
}) {
	const [filters, setFilters] = useState<MissionFilterState>({
		statuses: [],
		priorities: [],
		showArchived: false,
	});
	return (
		<MissionFilters
			filters={filters}
			onFiltersChange={(next) => {
				onForward(next.statuses);
				setFilters(next);
			}}
		/>
	);
}

function openPanel() {
	fireEvent.click(screen.getByRole("button", { name: /all active|filters/i }));
}

describe("MissionFilters status selection (ported tag-select)", () => {
	it("toggles a status tag on then off, forwarding the updated array to onFiltersChange both times", () => {
		const onForward = jest.fn();
		render(<ControlledMissionFilters onForward={onForward} />);
		openPanel();

		const completedTag = screen.getByRole("button", { name: "Completed" });

		fireEvent.click(completedTag);
		expect(completedTag).toHaveAttribute("aria-pressed", "true");
		// Assert the value that actually reached `onFiltersChange` — not just
		// the block's own internal `aria-pressed` visual state, which stays
		// green even with forwarding fully dead (verified: replacing the
		// `StatusTagSync` guard's `if (!same)` with `if (false)` keeps this
		// exact assertion passing, because `aria-pressed` is read straight
		// off `TagSelect`'s own uncontrolled state, not off the forwarded
		// `filters.statuses` this component actually persists).
		expect(onForward).toHaveBeenLastCalledWith(["completed"]);

		fireEvent.click(completedTag);
		expect(completedTag).toHaveAttribute("aria-pressed", "false");
		expect(onForward).toHaveBeenLastCalledWith([]);
	});

	it("selecting a status tag filters results — count badge reflects one active filter", () => {
		const onForward = jest.fn();
		render(<ControlledMissionFilters onForward={onForward} />);
		openPanel();

		fireEvent.click(screen.getByRole("button", { name: "Failed" }));
		expect(screen.getByText("1 filter")).toBeInTheDocument();
		expect(onForward).toHaveBeenLastCalledWith(["failed"]);
	});

	it("the tag-select clear action empties every selected status in one click", () => {
		const onForward = jest.fn();
		render(<ControlledMissionFilters onForward={onForward} />);
		openPanel();

		fireEvent.click(screen.getByRole("button", { name: "Pending" }));
		fireEvent.click(screen.getByRole("button", { name: "Executing" }));
		expect(screen.getByText("2 filters")).toBeInTheDocument();
		expect(onForward).toHaveBeenLastCalledWith(
			expect.arrayContaining(["pending", "executing"]),
		);

		fireEvent.click(screen.getByRole("button", { name: "Clear" }));
		expect(screen.getByRole("button", { name: "Pending" })).toHaveAttribute(
			"aria-pressed",
			"false",
		);
		expect(screen.getByRole("button", { name: "Executing" })).toHaveAttribute(
			"aria-pressed",
			"false",
		);
		expect(onForward).toHaveBeenLastCalledWith([]);
	});

	it("clicking the panel-level 'Show All' button clears every status without looping", () => {
		const onForward = jest.fn();
		render(<ControlledMissionFilters onForward={onForward} />);
		openPanel();

		fireEvent.click(screen.getByRole("button", { name: "Pending" }));
		expect(onForward).toHaveBeenLastCalledWith(["pending"]);

		fireEvent.click(screen.getByRole("button", { name: /show all/i }));

		expect(onForward).toHaveBeenLastCalledWith([]);
		expect(screen.getByRole("button", { name: "Pending" })).toHaveAttribute(
			"aria-pressed",
			"false",
		);
	}, 10_000);

	it("'Show All' also resets priorities and showArchived, and those keep forwarding correctly afterwards", () => {
		function ControlledFull({
			onForward: forward,
		}: {
			onForward: (state: MissionFilterState) => void;
		}) {
			const [filters, setFilters] = useState<MissionFilterState>({
				statuses: [],
				priorities: [],
				showArchived: false,
			});
			return (
				<MissionFilters
					filters={filters}
					onFiltersChange={(next) => {
						forward(next);
						setFilters(next);
					}}
				/>
			);
		}
		const forward = jest.fn();
		render(<ControlledFull onForward={forward} />);
		openPanel();

		fireEvent.click(screen.getByRole("checkbox", { name: /urgent/i }));
		expect(forward).toHaveBeenLastCalledWith(
			expect.objectContaining({ priorities: ["urgent"] }),
		);

		fireEvent.click(screen.getByRole("checkbox", { name: /archived/i }));
		expect(forward).toHaveBeenLastCalledWith(
			expect.objectContaining({ showArchived: true }),
		);

		fireEvent.click(screen.getByRole("button", { name: /show all/i }));
		expect(forward).toHaveBeenLastCalledWith({
			statuses: [],
			priorities: [],
			showArchived: false,
		});

		// negative control: dimensions still forward correctly afterwards
		fireEvent.click(screen.getByRole("checkbox", { name: /high/i }));
		expect(forward).toHaveBeenLastCalledWith(
			expect.objectContaining({ priorities: ["high"] }),
		);
	}, 10_000);
});
