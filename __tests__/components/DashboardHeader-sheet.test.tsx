/**
 * Consumer coverage for the M7 Radix -> Base UI `sheet.tsx` migration
 * (docs/migration-base-ui.md §M7). `DashboardHeader`'s mobile user-menu is
 * one of the two real consumers passing `<SheetTrigger asChild>` (the other
 * is `app/[locale]/admin/layout.tsx`). The migration risk is the `asChild` ->
 * `render` bridge: if `SheetTrigger` dropped the bridge and simply spread
 * `asChild` onto Base UI's `Trigger` (which has no such prop) or wrapped its
 * child in an extra element instead of rendering it directly, the queried
 * trigger below would stop resolving to the real `<button>` with the
 * `aria-label="User menu"` — it would resolve to a default wrapper tag
 * instead (or duplicate/none at all).
 *
 * What would redden this test: `SheetTrigger` losing the render bridge
 * (child no longer rendered as the actual DOM node) or `SheetContent`'s
 * `Popup`/`Backdrop` swap leaving stale `data-[state=...]` selectors so the
 * sheet content never becomes queryable after the click.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import en from "@/messages/en.json";

type Dict = Record<string, unknown>;

function resolve(dict: Dict, ns: string, key: string, vars?: Dict): string {
	const nsDict = dict[ns] as Dict | undefined;
	const value = nsDict?.[key];
	if (typeof value !== "string") return key;
	if (!vars) return value;
	return Object.entries(vars).reduce(
		(acc, [k, v]) => acc.replace(`{${k}}`, String(v)),
		value,
	);
}

jest.mock("next-intl", () => ({
	useTranslations: (ns: string) => (key: string, vars?: Dict) =>
		resolve(en, ns, key, vars),
}));

jest.mock("@/contexts/DeviceContext", () => ({
	useDevice: () => ({ isMobile: true }),
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

describe("DashboardHeader mobile user menu (Sheet migrated to Base UI)", () => {
	test("SheetTrigger asChild renders the real <button>, not a Base UI default wrapper", () => {
		render(<DashboardHeader />);

		const trigger = screen.getByRole("button", { name: "User menu" });
		expect(trigger.tagName).toBe("BUTTON");
	});

	test("clicking the trigger opens the sheet and reveals its content", async () => {
		const user = userEvent.setup();
		render(<DashboardHeader />);

		await user.click(screen.getByRole("button", { name: "User menu" }));

		expect(screen.getByText("My Account")).toBeInTheDocument();
		expect(screen.getByText("Profile")).toBeInTheDocument();
	});
});
