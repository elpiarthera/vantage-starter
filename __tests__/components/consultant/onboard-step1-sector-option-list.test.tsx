/**
 * Consultant onboarding Step 1 — sector picker wired to the mcpcn
 * `option-list` block (components/ui/option-list.tsx).
 *
 * Batch 1 (docs/mcpcn-block-mapping.md): `option-list` replaces the native
 * `<select>` sector field with the ported single-select pill picker.
 * Asserts real user behaviour — tapping a sector pill must produce the
 * exact same downstream effect the old `<select onChange>` did: the
 * `createProject` mutation is called with that sector's value.
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

describe("Consultant onboarding Step 1 — sector option-list picker", () => {
	beforeEach(() => {
		createProjectMock.mockClear();
		scrapeClientMock.mockClear();
	});

	it("tapping the Healthcare sector pill sends sector=healthcare to createProject, replacing the default technology sector", async () => {
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

		// Real behaviour: tap the pill-style option, not a native <select>.
		fireEvent.click(screen.getByRole("button", { name: "Healthcare" }));

		fireEvent.click(screen.getByRole("button", { name: "Next" }));

		await waitFor(() => {
			expect(createProjectMock).toHaveBeenCalled();
		});

		expect(createProjectMock.mock.calls[0]?.[0]?.sector).toBe("healthcare");
	});

	it("defaults to technology selected (option-list control mirrors the old default value)", async () => {
		render(<ConsultantOnboardPage />);

		const technologyPill = screen.getByRole("button", { name: "Technology" });
		expect(technologyPill).toHaveAttribute("aria-pressed", "true");
	});
});
