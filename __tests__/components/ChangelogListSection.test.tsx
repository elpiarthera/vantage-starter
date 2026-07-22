/**
 * Coverage for the mcpcn `post-card` / `post-list` blocks wired into
 * `ChangelogListSection` (docs/mcpcn-block-mapping.md §4 "Content / blog",
 * Batch 4 fifth bullet).
 *
 * `ChangelogListSection` is a plain, synchronous Server Component — it
 * takes parsed entries and a resolved translator as props (see its own
 * header for why it no longer owns the `parseChangelog()`/`getTranslations()`
 * reads itself), so it renders directly with `render()` like any other
 * synchronous component.
 */

import { render, screen } from "@testing-library/react";
import en from "@/messages/en.json";

const t = (key: string, values?: Record<string, string | number>) => {
	const template = (en.changelog as Record<string, string>)[key] ?? key;
	if (!values) {
		return template;
	}
	return Object.entries(values).reduce(
		(acc, [name, value]) => acc.replaceAll(`{${name}}`, String(value)),
		template,
	);
};

let mockEntries: {
	slug: string;
	type: string;
	date: string;
	title: string;
	body: string;
}[];

jest.mock("@/lib/changelog/formatChangelogDate", () => ({
	formatChangelogDate: (date: string) => date,
}));

import { ChangelogListSection } from "@/components/changelog/ChangelogListSection";

beforeEach(() => {
	mockEntries = [
		{
			slug: "2026-07-22-first-entry",
			type: "Added",
			date: "2026-07-22",
			title: "The browse-pick-register-confirm flow",
			body: "First line of the body.\nSecond line.",
		},
	];
});

describe("ChangelogListSection — post-card / post-list blocks", () => {
	test("renders one post-card per parsed entry, carrying its title and excerpt", () => {
		render(<ChangelogListSection entries={mockEntries} locale="en" t={t} />);

		expect(
			screen.getByText("The browse-pick-register-confirm flow"),
		).toBeInTheDocument();
		expect(screen.getByText("First line of the body.")).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: en.changelog.read_more }),
		).toHaveAttribute("href", "/changelog/2026-07-22-first-entry");
	});

	test("shows an empty state when no entries are returned, and no card is offered", () => {
		mockEntries = [];
		render(<ChangelogListSection entries={mockEntries} locale="en" t={t} />);

		expect(screen.getByText(en.changelog.empty)).toBeInTheDocument();
		expect(screen.queryByRole("link")).not.toBeInTheDocument();
	});

	test("defaults to the grid variant so nothing changes without asking for it", () => {
		const { container } = render(
			<ChangelogListSection entries={mockEntries} locale="en" t={t} />,
		);
		expect(container.querySelector('[data-slot="post-list"]')).toHaveClass(
			"grid",
		);
	});

	test("wires variant=fullwidth into PostList with translated pagination labels", () => {
		mockEntries = Array.from({ length: 3 }, (_, i) => ({
			slug: `2026-07-2${i}-entry`,
			type: "Added",
			date: "2026-07-22",
			title: `Entry ${i}`,
			body: "Body.",
		}));

		render(
			<ChangelogListSection
				entries={mockEntries}
				locale="en"
				t={t}
				variant="fullwidth"
				pageSize={2}
			/>,
		);

		expect(screen.getByText("Entry 0")).toBeInTheDocument();
		expect(screen.getByText("Entry 1")).toBeInTheDocument();
		expect(screen.queryByText("Entry 2")).not.toBeInTheDocument();
		expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
	});
});
