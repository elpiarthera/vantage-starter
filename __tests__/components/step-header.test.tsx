/**
 * Consumer coverage for the M3 Radix -> Base UI `progress.tsx` migration
 * (docs/migration-base-ui.md). `StepHeader` is one of `progress.tsx`'s two
 * consumers in the repo — this test proves the migrated wrapper's public
 * API (`Progress` with a `value` prop) still renders a real
 * `role="progressbar"` element with the correct `aria-valuenow`, with
 * `step-header.tsx`'s own source left untouched.
 */

import { render, screen } from "@testing-library/react";
import en from "@/messages/en.json";

type Dict = Record<string, unknown>;

function resolve(dict: Dict, ns: string, key: string): string {
	const nsDict = dict[ns] as Dict | undefined;
	const value = nsDict?.[key];
	return typeof value === "string" ? value : key;
}

jest.mock("next-intl", () => ({
	useTranslations: (ns: string) => (key: string) => resolve(en, ns, key),
}));

jest.mock("@/i18n/routing", () => ({
	Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
		<a href={href}>{children}</a>
	),
}));

jest.mock("@clerk/nextjs", () => ({
	SignOutButton: ({ children }: { children: React.ReactNode }) => children,
}));

import { StepHeader } from "@/components/shared/step-header";

describe("StepHeader", () => {
	test("renders the migrated Progress bar with the correct completion value", () => {
		render(<StepHeader currentStep={3} backHref="/dashboard/missions/new" />);

		const progressbar = screen.getByRole("progressbar");
		expect(progressbar).toBeInTheDocument();
		expect(progressbar).toHaveAttribute("aria-valuenow", String((3 / 6) * 100));
	});

	test("renders navigation and profile controls alongside the progress bar", () => {
		render(<StepHeader currentStep={1} backHref="/dashboard/missions/new" />);

		expect(
			screen.getByRole("button", { name: en.step_header.back_button }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: en.step_header.home_button }),
		).toBeInTheDocument();
	});
});
