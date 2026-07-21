/**
 * Consumer coverage for the M9 Radix -> Base UI `sidebar.tsx` migration
 * (docs/migration-base-ui.md §M9). Five `asChild` sites in `sidebar.tsx`
 * (`SidebarGroupLabel`, `SidebarGroupAction`, `SidebarMenuButton`,
 * `SidebarMenuAction`, `SidebarMenuSubButton`) moved off
 * `@radix-ui/react-slot`'s `Slot` onto the same `useAsChildRender` helper
 * proven in `button-aschild.test.tsx`. This suite drives `SidebarMenuButton`
 * with a real `asChild`-wrapped anchor (the same shape `app-sidebar.tsx`'s nav
 * tree uses), proving the merge lands on the anchor rather than wrapping it.
 *
 * MUTATION THAT REDDENS THIS SUITE: in `components/ui/sidebar.tsx`,
 * `SidebarMenuButton`'s `useAsChildRender` call with the `asChild` branch
 * reverted to a plain wrapper (dropping the `render:` branch so `asChild`
 * renders a `<button>` host around the anchor child) makes
 * `getByRole("link")` resolve to an `<a>` nested inside a `<button>`, and
 * both the `closest("button")` assertion and the `data-sidebar` /
 * `sidebarMenuButtonVariants` className assertions on the anchor fail.
 * Restoring the real `render:` branch turns the suite green with an empty
 * `git diff`.
 */

import { render, screen } from "@testing-library/react";
import {
	Sidebar,
	SidebarContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
} from "@/components/ui/sidebar";

jest.mock("next-intl", () => ({
	useTranslations: () => (key: string) => key,
}));

beforeAll(() => {
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: (query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addEventListener: jest.fn(),
			removeEventListener: jest.fn(),
			addListener: jest.fn(),
			removeListener: jest.fn(),
			dispatchEvent: jest.fn(),
		}),
	});
});

describe("SidebarMenuButton asChild (Slot -> useRender migration, sidebar.tsx)", () => {
	test("merges sidebar classes and data attributes onto the child anchor instead of wrapping it", () => {
		render(
			<SidebarProvider defaultOpen={true}>
				<Sidebar collapsible="icon">
					<SidebarContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton asChild isActive>
									<a href="/dashboard">Dashboard</a>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarContent>
				</Sidebar>
			</SidebarProvider>,
		);

		const link = screen.getByRole("link", { name: "Dashboard" });

		// The rendered element IS the anchor — not an <a> nested in a <button>.
		expect(link.tagName).toBe("A");
		expect(link.closest("button")).toBeNull();
		expect(link).toHaveAttribute("href", "/dashboard");

		// SidebarMenuButton's own data-* attributes and variant className
		// landed on the anchor itself.
		expect(link).toHaveAttribute("data-sidebar", "menu-button");
		expect(link).toHaveAttribute("data-active", "true");
		expect(link).toHaveClass("peer/menu-button");
	});
});
