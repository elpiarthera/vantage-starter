/**
 * Coverage for the mcpcn `post-detail` block wired into
 * `ChangelogDetailSection` (docs/mcpcn-block-mapping.md §4 "Content / blog",
 * Batch 4 fifth bullet).
 *
 * `ChangelogDetailSection` is a plain, synchronous Server Component — it
 * takes the parsed entries, the slug, and a resolved translator as props
 * (see its own header for why), so it renders directly with `render()`
 * like any other synchronous component.
 */

import { render, screen } from "@testing-library/react";
import en from "@/messages/en.json";

const t = (key: string) => (en.changelog as Record<string, string>)[key] ?? key;

const mockNotFound = jest.fn();
jest.mock("next/navigation", () => ({
	notFound: () => mockNotFound(),
}));

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

import { ChangelogDetailSection } from "@/components/changelog/ChangelogDetailSection";

beforeEach(() => {
	jest.clearAllMocks();
	mockEntries = [
		{
			slug: "2026-07-22-known-entry",
			type: "Added",
			date: "2026-07-22",
			title: "Known entry title",
			body: "Full body text of the known entry.",
		},
		{
			slug: "2026-07-21-other-entry",
			type: "Fixed",
			date: "2026-07-21",
			title: "Another entry",
			body: "Other body.",
		},
	];
});

describe("ChangelogDetailSection — post-detail block", () => {
	test("visiting a known slug renders that entry's title and body", () => {
		render(
			<ChangelogDetailSection
				entries={mockEntries}
				slug="2026-07-22-known-entry"
				locale="en"
				t={t}
			/>,
		);

		expect(screen.getByText("Known entry title")).toBeInTheDocument();
		expect(
			screen.getByText("Full body text of the known entry."),
		).toBeInTheDocument();
		expect(mockNotFound).not.toHaveBeenCalled();
	});

	test("renders the other entry as a related link", () => {
		render(
			<ChangelogDetailSection
				entries={mockEntries}
				slug="2026-07-22-known-entry"
				locale="en"
				t={t}
			/>,
		);

		expect(screen.getByRole("link", { name: "Another entry" })).toHaveAttribute(
			"href",
			"/changelog/2026-07-21-other-entry",
		);
	});

	test("an unknown slug calls notFound()", () => {
		ChangelogDetailSection({
			entries: mockEntries,
			slug: "does-not-exist",
			locale: "en",
			t,
		});
		expect(mockNotFound).toHaveBeenCalledTimes(1);
	});
});
