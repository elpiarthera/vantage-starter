/**
 * Consultant onboarding Step 1 — bare-domain URL regression test.
 *
 * Laurent hit this on the preview: typing a bare domain
 * ("perello.consulting", no scheme) into the website URL field blocked
 * step 1 -> 2. This test drives the REAL `Step1ProjectForm` (via the page
 * default export) with a scheme-less value and asserts the mutation the
 * component actually calls receives a normalized, fully-qualified URL.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
	useTranslations: (ns: string) => (key: string) => resolve(en, ns, key),
}));

jest.mock("@/i18n/routing", () => ({
	useRouter: () => ({ push: jest.fn() }),
}));

const createProjectMock = jest.fn().mockResolvedValue("project-1");
const scrapeClientMock = jest.fn().mockResolvedValue(undefined);

jest.mock("convex/react", () => ({
	useQuery: () => [{ _id: "workspace-1" }],
	useMutation: (ref: string) => {
		if (ref === "consultantProjects.create") return createProjectMock;
		return jest.fn().mockResolvedValue(undefined);
	},
	useAction: (ref: string) => {
		if (ref === "actions.scrapeClient.run") return scrapeClientMock;
		return jest.fn().mockResolvedValue(undefined);
	},
}));

jest.mock("@/convex/_generated/api", () => ({
	api: {
		workspaces: { list: "workspaces.list" },
		consultantProjects: {
			create: "consultantProjects.create",
			addCompetitor: "consultantProjects.addCompetitor",
			updateStatus: "consultantProjects.updateStatus",
		},
		actions: {
			scrapeClient: { run: "actions.scrapeClient.run" },
			scrapeCompetitor: { run: "actions.scrapeCompetitor.run" },
		},
	},
}));

import ConsultantOnboardPage from "@/app/[locale]/dashboard/consultant/onboard/page";

describe("Consultant onboarding Step 1 — scheme-less domain input", () => {
	beforeEach(() => {
		createProjectMock.mockClear();
		scrapeClientMock.mockClear();
	});

	it("normalizes a bare domain to a fully-qualified URL before calling createProject", async () => {
		render(<ConsultantOnboardPage />);

		fireEvent.change(screen.getByLabelText(/^Project Name/), {
			target: { value: "Perello audit" },
		});
		fireEvent.change(screen.getByLabelText(/^Client Name/), {
			target: { value: "Perello Consulting" },
		});
		fireEvent.change(screen.getByLabelText(/^Website URL/), {
			target: { value: "perello.consulting" },
		});

		fireEvent.click(screen.getByRole("button", { name: "Next" }));

		await waitFor(() => {
			expect(createProjectMock).toHaveBeenCalled();
		});

		expect(createProjectMock.mock.calls[0]?.[0]?.clientWebsiteUrl).toBe(
			"https://perello.consulting/",
		);
		await waitFor(() => {
			expect(scrapeClientMock).toHaveBeenCalledWith(
				expect.objectContaining({ url: "https://perello.consulting/" }),
			);
		});
	});
});
