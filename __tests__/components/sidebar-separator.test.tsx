/**
 * Consumer coverage for the M2 Radix -> Base UI `separator.tsx` migration
 * (docs/migration-base-ui.md). `components/ui/sidebar.tsx`'s `SidebarSeparator`
 * is the sole consumer of `components/ui/separator.tsx` in the repo — this
 * test mounts the real `Sidebar` + `SidebarSeparator` inside a real
 * `SidebarProvider` and asserts the divider renders with its accessible
 * `separator` role and orientation, alongside real sidebar content either
 * side of it.
 */

import { render, screen } from "@testing-library/react";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarProvider,
	SidebarSeparator,
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

describe("SidebarSeparator (Separator migrated to Base UI)", () => {
	test("renders between real sidebar groups with an accessible separator role", () => {
		render(
			<SidebarProvider>
				<Sidebar>
					<SidebarContent>
						<SidebarGroup>Group above</SidebarGroup>
						<SidebarSeparator data-testid="sidebar-divider" />
						<SidebarGroup>Group below</SidebarGroup>
					</SidebarContent>
				</Sidebar>
			</SidebarProvider>,
		);

		expect(screen.getByText("Group above")).toBeInTheDocument();
		expect(screen.getByText("Group below")).toBeInTheDocument();

		const divider = screen.getByTestId("sidebar-divider");
		expect(divider).toHaveAttribute("role", "separator");
		expect(divider).toHaveAttribute("aria-orientation", "horizontal");
	});
});
