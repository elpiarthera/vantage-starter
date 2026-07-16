/**
 * RED-first coverage for Laurent's #1 dashboard defect: switching to /fr
 * changes the locale prefix but the dashboard body stays English.
 *
 * These tests mock `next-intl` to pull REAL strings out of the project's own
 * messages/en.json and messages/fr.json (not an echo of the key), so a
 * passing test proves the component actually reads the active locale's
 * translation catalog — not merely that it calls useTranslations().
 */

import { render, screen } from "@testing-library/react";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";

type Dict = Record<string, unknown>;

function resolve(dict: Dict, ns: string, key: string): string {
	const nsDict = dict[ns] as Dict | undefined;
	const value = key
		.split(".")
		.reduce<unknown>((acc, part) => (acc as Dict | undefined)?.[part], nsDict);
	return typeof value === "string" ? value : key;
}

function makeUseTranslations(dict: Dict) {
	return (ns: string) =>
		(key: string, vars?: Record<string, string | number>) => {
			let str = resolve(dict, ns, key);
			if (vars) {
				for (const [k, v] of Object.entries(vars)) {
					str = str.replace(`{${k}}`, String(v));
				}
			}
			return str;
		};
}

let activeLocale = "fr";
const activeDict: Record<string, Dict> = { en, fr };

jest.mock("next-intl", () => ({
	useLocale: () => activeLocale,
	useTranslations: (ns: string) =>
		makeUseTranslations(activeDict[activeLocale])(ns),
	useFormatter: () => ({
		dateTime: (date: Date, opts?: Intl.DateTimeFormatOptions) =>
			new Intl.DateTimeFormat(activeLocale, opts).format(date),
	}),
}));

jest.mock("@/i18n/routing", () => ({
	routing: {
		locales: ["en", "fr", "de", "it", "es", "pt", "ru"],
		defaultLocale: "en",
	},
	Link: ({
		href,
		children,
		...rest
	}: {
		href: string;
		children: React.ReactNode;
	}) => (
		<a href={href} {...rest}>
			{children}
		</a>
	),
	usePathname: () => "/dashboard",
	useRouter: () => ({ replace: jest.fn() }),
}));

jest.mock("@clerk/nextjs", () => ({
	useUser: () => ({ user: { id: "user_1" } }),
}));

jest.mock("next/navigation", () => ({
	useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
	usePathname: () => "/dashboard",
}));

beforeAll(() => {
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: (query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: jest.fn(),
			removeListener: jest.fn(),
			addEventListener: jest.fn(),
			removeEventListener: jest.fn(),
			dispatchEvent: jest.fn(),
		}),
	});
});

jest.mock("@/components/UserSyncProvider", () => ({
	useUserSync: () => ({ isUserSynced: true, isSyncing: false }),
}));

jest.mock("@/hooks/business-logic/useCredits", () => ({
	useCredits: () => ({ balance: 42, isLoading: false }),
}));

jest.mock("convex/react", () => ({
	useQuery: (fn: unknown) => {
		const key = String(fn);
		if (key.includes("getCurrentUser")) return { _id: "u1" };
		if (key.includes("workspaces")) return [{ _id: "w1" }];
		if (key.includes("listRecent")) {
			return {
				sessions: [
					{
						_id: "s1",
						_creationTime: new Date("2026-01-15T00:00:00Z").getTime(),
						title: null,
						status: "active",
					},
				],
			};
		}
		return undefined;
	},
}));

jest.mock("@/convex/_generated/api", () => ({
	api: {
		users: { getCurrentUser: "users.getCurrentUser" },
		workspaces: { list: "workspaces.list" },
		architectSessions: { listRecent: "architectSessions.listRecent" },
	},
}));

describe("Dashboard body follows the active locale", () => {
	beforeEach(() => {
		activeLocale = "fr";
	});

	test("renders the French 'Open Architect' equivalent, not the English string", async () => {
		const { default: DashboardPage } = await import(
			"@/app/[locale]/dashboard/page"
		);
		render(<DashboardPage />);

		// This is the exact defect: today the component hardcodes English
		// regardless of locale. Under fr, "Open Architect" must NOT appear
		// and the French translation must be shown instead.
		expect(screen.queryByText("Open Architect")).not.toBeInTheDocument();
		expect(
			screen.getByText(fr.dashboard.open_architect as string),
		).toBeInTheDocument();
	});

	test("renders the French untitled-session label, not the English one", async () => {
		const { default: DashboardPage } = await import(
			"@/app/[locale]/dashboard/page"
		);
		render(<DashboardPage />);

		expect(screen.queryByText("Untitled session")).not.toBeInTheDocument();
		expect(
			screen.getByText(fr.dashboard.untitled_session as string),
		).toBeInTheDocument();
	});
});

describe("AppSidebar nav labels follow the active locale", () => {
	beforeEach(() => {
		activeLocale = "fr";
	});

	test("renders French nav labels, not the hardcoded English ones", async () => {
		const { AppSidebar } = await import("@/components/app-sidebar");
		const { SidebarProvider } = await import("@/components/ui/sidebar");

		render(
			<SidebarProvider>
				<AppSidebar />
			</SidebarProvider>,
		);

		// Today these are hardcoded English <span>Dashboard</span> etc.
		expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
		expect(
			screen.getByText(fr.app_sidebar.nav_dashboard as string),
		).toBeInTheDocument();
	});
});

describe("Session date rendering follows the active locale", () => {
	// Fixed timestamp from the mocked session above -- never Date.now().
	const FIXED_TIMESTAMP = new Date("2026-01-15T00:00:00Z").getTime();
	const DATE_OPTS: Intl.DateTimeFormatOptions = {
		day: "numeric",
		month: "short",
		year: "numeric",
	};

	beforeEach(() => {
		activeLocale = "fr";
	});

	test("renders the session date formatted for 'fr', not hardcoded 'en-GB'", async () => {
		const { default: DashboardPage } = await import(
			"@/app/[locale]/dashboard/page"
		);
		render(<DashboardPage />);

		const expectedFr = new Intl.DateTimeFormat("fr", DATE_OPTS).format(
			new Date(FIXED_TIMESTAMP),
		);
		const enGbRendering = new Intl.DateTimeFormat("en-GB", DATE_OPTS).format(
			new Date(FIXED_TIMESTAMP),
		);

		// A test that only asserts "not en-GB" would pass on any other locale,
		// including garbage. Assert BOTH: matches fr AND differs from en-GB.
		expect(screen.getByText(expectedFr)).toBeInTheDocument();
		expect(enGbRendering).not.toEqual(expectedFr);
		expect(screen.queryByText(enGbRendering)).not.toBeInTheDocument();
	});
});

describe("formatRelativeTime's published contract (session-list.tsx)", () => {
	// >= 7 days old to deterministically hit the absolute-date branch, which
	// reads Intl.DateTimeFormat(locale, ...) directly -- no Date.now() involved
	// in the assertion itself (Date.now() only decides which branch fires,
	// and 10 days back always lands in the absolute branch regardless of when
	// this test runs).
	const TEN_DAYS_AGO = Date.now() - 10 * 86_400_000;

	test("formats the absolute date per the given locale, 'fr' differs from 'en-GB'", async () => {
		const { formatRelativeTime } = await import(
			"@/app/[locale]/dashboard/architect/_components/session-list"
		);

		const fr = formatRelativeTime(TEN_DAYS_AGO, "fr");
		const enGb = formatRelativeTime(TEN_DAYS_AGO, "en-GB");

		const expectedFr = new Intl.DateTimeFormat("fr", {
			month: "short",
			day: "numeric",
		}).format(new Date(TEN_DAYS_AGO));

		expect(fr).toEqual(expectedFr);
		expect(fr).not.toEqual(enGb);
	});
});
