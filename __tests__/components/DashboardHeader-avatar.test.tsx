/**
 * Consumer coverage for the M4 Radix -> Base UI `avatar.tsx` migration
 * (docs/migration-base-ui.md). `DashboardHeader` is the first of `avatar.tsx`'s
 * two consumers in the repo — this test mounts the real desktop user-menu
 * trigger and proves the migrated `Avatar` still renders the user's fallback
 * initials, with `DashboardHeader`'s own source left untouched.
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

jest.mock("@/contexts/DeviceContext", () => ({
	useDevice: () => ({ isMobile: false }),
}));

jest.mock("@/hooks/business-logic/useCredits", () => ({
	useCredits: () => ({ balance: 42 }),
}));

jest.mock("@clerk/nextjs", () => ({
	useUser: () => ({
		user: {
			fullName: "Ada Lovelace",
			username: "ada",
			imageUrl: "",
		},
	}),
	OrganizationSwitcher: () => <div data-testid="org-switcher" />,
	SignOutButton: ({ children }: { children: React.ReactNode }) => (
		<>{children}</>
	),
}));

jest.mock("@/i18n/routing", () => ({
	Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
		<a href={href}>{children}</a>
	),
}));

jest.mock("@/components/shared/LanguageSwitcher", () => ({
	LanguageSwitcher: () => <div data-testid="language-switcher" />,
}));

jest.mock("@/components/theme-toggle", () => ({
	ThemeToggle: () => <button type="button">theme</button>,
}));

jest.mock("@/components/dashboard/account/modals/PurchaseCreditsModal", () => ({
	PurchaseCreditsModal: () => null,
}));

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

describe("DashboardHeader (Avatar migrated to Base UI)", () => {
	test("renders the migrated Avatar fallback with the user's initials in the desktop user menu", () => {
		render(<DashboardHeader />);

		expect(screen.getByText("AL")).toBeInTheDocument();
	});
});
