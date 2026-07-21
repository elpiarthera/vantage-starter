/**
 * Consumer coverage for the M3 Radix -> Base UI `tooltip.tsx` migration
 * (docs/migration-base-ui.md). `SidebarMenuButton` in `components/ui/sidebar.tsx`
 * is one of `tooltip.tsx`'s two consumers in the repo — this test mounts the
 * real `Sidebar` collapsed (so the tooltip is not force-hidden) and asserts
 * the migrated `Tooltip`/`TooltipTrigger` (driven through the `asChild`
 * public API) still exposes an accessible tooltip on hover, with
 * `sidebar.tsx`'s own source left untouched.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

describe("SidebarMenuButton tooltip (Tooltip migrated to Base UI)", () => {
	test("shows an accessible tooltip for a collapsed menu button on hover", async () => {
		const events = userEvent.setup();

		render(
			<SidebarProvider defaultOpen={false}>
				<Sidebar collapsible="icon">
					<SidebarContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton tooltip="Dashboard">
									Dashboard
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarContent>
				</Sidebar>
			</SidebarProvider>,
		);

		const trigger = screen.getByText("Dashboard").closest("button");
		expect(trigger).not.toBeNull();
		if (!trigger) throw new Error("menu button not found");

		await events.hover(trigger);

		const tooltip = await screen.findByRole("tooltip");
		expect(tooltip).toHaveTextContent("Dashboard");
	});
});
