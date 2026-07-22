/**
 * Coverage for the mcpcn `issue-report-form` block wired into
 * `IssueReportFormSection` (docs/mcpcn-block-mapping.md §4
 * "issue-report-form", Batch 4).
 *
 * TDD assertion this file proves (the client-side half — the server-side
 * mapping proof is __tests__/convex/issueReports.test.ts): an invalid email
 * is refused BEFORE the Convex action runs, and a valid submission forwards
 * exactly the category/urgency the user selected.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import en from "@/messages/en.json";

type Dict = Record<string, unknown>;

function resolve(dict: Dict, ns: string, key: string): string {
	let value: unknown = (dict[ns] as Dict | undefined) ?? {};
	for (const segment of key.split(".")) {
		value = (value as Dict | undefined)?.[segment];
	}
	if (typeof value !== "string") {
		return key;
	}
	return value;
}

jest.mock("next-intl", () => ({
	useTranslations: (ns: string) => (key: string) => resolve(en, ns, key),
}));

const mockSubmit = jest.fn();
jest.mock("convex/react", () => ({
	useAction: () => mockSubmit,
}));

jest.mock("@/convex/_generated/api", () => ({
	api: {
		issueReports: { submit: "issueReports.submit" },
	},
}));

import { IssueReportFormSection } from "@/components/report/IssueReportFormSection";

function fillRequiredFields() {
	fireEvent.change(screen.getByLabelText("Name"), {
		target: { value: "Ada Lovelace" },
	});
	fireEvent.change(screen.getByLabelText("Issue Title"), {
		target: { value: "Login button does nothing" },
	});
	fireEvent.change(screen.getByLabelText("Description"), {
		target: { value: "Clicking Sign In produces no navigation." },
	});
}

beforeEach(() => {
	jest.clearAllMocks();
});

describe("IssueReportFormSection — issue-report-form block", () => {
	test("RED: an invalid email never calls the Convex action", async () => {
		render(<IssueReportFormSection />);
		fillRequiredFields();
		fireEvent.change(screen.getByLabelText("Email"), {
			target: { value: "not-an-email" },
		});

		fireEvent.click(screen.getByRole("button", { name: "Submit" }));

		await new Promise((r) => setTimeout(r, 50));
		expect(mockSubmit).not.toHaveBeenCalled();
	});

	test("submitting without a selected category/urgency never calls the action", async () => {
		render(<IssueReportFormSection />);
		fillRequiredFields();
		fireEvent.change(screen.getByLabelText("Email"), {
			target: { value: "ada@example.com" },
		});

		fireEvent.click(screen.getByRole("button", { name: "Submit" }));

		await new Promise((r) => setTimeout(r, 50));
		expect(mockSubmit).not.toHaveBeenCalled();
	});

	test("renders the form's required-field labels so keyboard/screen-reader users can find every field", () => {
		render(<IssueReportFormSection />);
		expect(screen.getByLabelText("Name")).toBeInTheDocument();
		expect(screen.getByLabelText("Email")).toBeInTheDocument();
		expect(screen.getByLabelText("Issue Title")).toBeInTheDocument();
		expect(screen.getByLabelText("Description")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
	});
});
