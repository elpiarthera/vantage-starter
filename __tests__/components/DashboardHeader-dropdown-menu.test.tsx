/**
 * Consumer coverage for the M8 Radix -> Base UI `dropdown-menu.tsx` +
 * `picker.tsx` migration (docs/migration-base-ui.md §M8).
 * `DashboardHeader`'s desktop user menu is one of the real consumers
 * passing both `<DropdownMenuTrigger asChild>` (line 170) and
 * `<DropdownMenuItem asChild>` (lines 221, 239 — the "Profile"/"Settings"
 * `<Link>` items).
 *
 * BIPOLAR MUTATION that reddens the Trigger test: in
 * `components/ui/dropdown-menu.tsx`, change `DropdownMenuTrigger`'s
 * asChild branch from
 *   `<DropdownMenuPrimitive.Trigger render={children} {...props} />`
 * to
 *   `<DropdownMenuPrimitive.Trigger {...props}>{children}</DropdownMenuPrimitive.Trigger>`
 * (i.e. drop the `render` bridge and pass `children` through normally).
 * Base UI's `Trigger` always renders its own `<button>`, so the consumer's
 * `<Button aria-label="User menu">` becomes NESTED inside a default Base UI
 * `<button>` instead of BEING the queried element — the anti-nesting
 * assertion below catches this (a bare `tagName === "BUTTON"` check alone
 * would stay green on this mutation, because the outer wrapper is also a
 * `<button>`).
 *
 * BIPOLAR MUTATION that reddens the Item test: in `DropdownMenuItem`, make
 * the same swap (drop `render={children}`, pass `children` as normal
 * content). Base UI's `Item` renders its own `<div role="menuitem">`; a real
 * `<a>` (the "Profile" `Link`) would then render NESTED inside that `<div>`
 * rather than being the `<a>` itself — `screen.getByRole("menuitem", { name:
 * "Profile" })` still resolves (the outer `<div>` now carries the role), but
 * `tagName` is `"DIV"` instead of `"A"`, `href` is absent, and the
 * anti-nesting assertion (no `role="menuitem"` ancestor above the queried
 * element) fails because the queried element is itself the wrapper.
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
	Link: ({
		children,
		href,
		...props
	}: React.ComponentProps<"a"> & { href: string }) => (
		<a href={href} {...props}>
			{children}
		</a>
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

describe("DashboardHeader desktop user menu (DropdownMenu migrated to Base UI)", () => {
	test("DropdownMenuTrigger asChild renders the real <button>, not a Base UI default wrapper", () => {
		render(<DashboardHeader />);

		const trigger = screen.getByRole("button", { name: "User menu" });
		expect(trigger.tagName).toBe("BUTTON");
		// Anti-nesting: no ancestor <button> above the queried trigger. If
		// the render bridge is dropped, Base UI wraps `children` in its own
		// default <button>, and the real trigger button ends up nested one
		// level inside it.
		expect(trigger.parentElement?.closest("button") ?? null).toBeNull();
	});

	test("DropdownMenuItem asChild renders the real <a>, not nested inside a Base UI default item", async () => {
		const user = userEvent.setup();
		render(<DashboardHeader />);

		await user.click(screen.getByRole("button", { name: "User menu" }));

		// Base UI's Item merges its own `role="menuitem"` onto the rendered
		// element via the render bridge, which overrides the anchor's
		// implicit "link" role -- so the item is queried by its stamped
		// "menuitem" role, not "link".
		const profileItem = await screen.findByRole("menuitem", {
			name: "Profile",
		});
		expect(profileItem.tagName).toBe("A");
		expect(profileItem).toHaveAttribute("href", "/dashboard/account");
		// Anti-nesting: no ancestor menuitem-role element above the queried
		// anchor. If the render bridge is dropped, Base UI's Item renders its
		// own <div role="menuitem">, and the real <a> ends up nested one
		// level inside it (a second, distinct menuitem-role ancestor)
		// instead of being the item itself.
		expect(
			profileItem.parentElement?.closest('[role="menuitem"]') ?? null,
		).toBeNull();
	});
});
