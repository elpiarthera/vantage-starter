/**
 * RED-first coverage for the mcpcn `progress-steps` wiring into the
 * consultant onboarding entry page (`app/[locale]/dashboard/consultant/
 * onboard/page.tsx`'s `StepIndicator`).
 *
 * Before this change, `StepIndicator` was a hand-rolled numbered-circle nav
 * (inline SVG checkmark + manually computed border/background colors per
 * step). This test asserts the BEHAVIOUR the block must keep: as the user
 * completes step 1's project form and advances, the indicator's
 * `aria-current="step"` marker must move from step 1 to step 2, and step 1
 * must show a completed checkmark — never an import/source substring
 * (banned by PR #77).
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

describe("Consultant onboarding StepIndicator (ported progress-steps)", () => {
	it("moves aria-current from step 1 to step 2 and marks step 1 completed after project creation", async () => {
		render(<ConsultantOnboardPage />);

		// Step 1 is current initially.
		const nav = screen.getByRole("navigation", { name: "Onboarding steps" });
		expect(nav.querySelectorAll('[aria-current="step"]')).toHaveLength(1);
		expect(screen.getByText("Create Project")).toBeInTheDocument();

		fireEvent.change(screen.getByLabelText(/^Project Name/), {
			target: { value: "Acme audit" },
		});
		fireEvent.change(screen.getByLabelText(/^Client Name/), {
			target: { value: "Acme Corp" },
		});
		fireEvent.change(screen.getByLabelText(/^Website URL/), {
			target: { value: "https://acme.example" },
		});

		fireEvent.click(screen.getByRole("button", { name: "Next" }));

		await waitFor(() => {
			expect(createProjectMock).toHaveBeenCalled();
		});

		// Step 2 must now be the ONLY current step, and it must be step 2's
		// label, not step 1's — a defect that advances `step` state but
		// leaves the indicator pointed at step 1 must fail this.
		await waitFor(() => {
			const current = nav.querySelectorAll('[aria-current="step"]');
			expect(current).toHaveLength(1);
			expect(current[0]?.textContent).toContain("Add Competitors");
		});

		// Step 1's indicator must show a completed checkmark (lucide-react
		// `Check`, which the ported block renders — not the old hand-coded
		// inline SVG polyline).
		const checkIcons = nav.querySelectorAll("svg.lucide-check");
		expect(checkIcons.length).toBe(1);
	});
});
