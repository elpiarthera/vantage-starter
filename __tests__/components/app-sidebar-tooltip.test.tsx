/**
 * Consumer coverage for the M3 Radix -> Base UI `tooltip.tsx` migration
 * (docs/migration-base-ui.md). `AppSidebar` is the other of `tooltip.tsx`'s
 * two consumers in the repo (it wraps the whole navigation tree in the
 * migrated `TooltipProvider`) — this test mounts the real `AppSidebar`
 * inside a real `SidebarProvider` and asserts the navigation renders real
 * content, proving `TooltipProvider` composes without runtime error, with
 * `app-sidebar.tsx`'s own source left untouched.
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
	useLocale: () => "en",
}));

jest.mock("next/navigation", () => ({
	useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock("@/i18n/routing", () => ({
	Link: ({
		href,
		children,
		...props
	}: {
		href: string;
		children: React.ReactNode;
	}) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
	usePathname: () => "/dashboard",
}));

jest.mock("@/components/search-modal", () => ({
	SearchModal: () => null,
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

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

describe("AppSidebar (TooltipProvider migrated to Base UI)", () => {
	test("renders the real navigation tree wrapped in the migrated TooltipProvider", () => {
		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		expect(
			screen.getByLabelText(en.app_sidebar.nav_aria_label),
		).toBeInTheDocument();
		expect(
			screen.getAllByText(en.app_sidebar.nav_dashboard).length,
		).toBeGreaterThan(0);
		expect(
			screen.getAllByText(en.app_sidebar.nav_settings).length,
		).toBeGreaterThan(0);
	});
});
