/**
 * Behaviour tests for GitHub issue #188: "After buying credits, user is
 * redirected to profile page instead of original workflow step."
 *
 * These tests replace a prior `fs.readFileSync(...) + toContain(...)`
 * source-text suite (see git history) that asserted the SHAPE of the code
 * (imports present, string literals present) rather than its BEHAVIOUR.
 * Eta proved that suite could stay green after `const router = useRouter();`
 * was deleted from the real component — it never rendered anything, so it
 * could never observe the regression it claimed to guard. Every test below
 * renders the real component/hook and asserts an argument, a DOM state, or a
 * side effect it produces — never a substring of its source file.
 */

import type { UserResource } from "@clerk/shared/types";
import { render, renderHook, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import en from "@/messages/en.json";

type Dict = Record<string, unknown>;

function resolve(dict: Dict, ns: string, key: string): string {
	const nsDict = dict[ns] as Dict | undefined;
	const value = nsDict?.[key];
	return typeof value === "string" ? value : key;
}

// ── Shared mocks (used by every describe block in this file) ──────────────

jest.mock("next-intl", () => ({
	useTranslations: (ns: string) => (key: string) => resolve(en, ns, key),
	useFormatter: () => ({ dateTime: () => "" }),
	useLocale: () => "en",
}));

const mockRouterPush = jest.fn();
jest.mock("@/i18n/routing", () => ({
	useRouter: () => ({ push: mockRouterPush }),
}));

jest.mock("@/contexts/DeviceContext", () => ({
	useDevice: () => ({ isMobile: false }),
}));

// Mutable — each test sets this before rendering to control what
// `useSearchParams()` returns, matching the pattern already used for other
// dynamic module-level mocks in this repo (e.g. AdaptiveNavigation.test.tsx
// mocks `useDevice` the same way).
let mockSearchParams = new URLSearchParams();
jest.mock("next/navigation", () => ({
	useSearchParams: () => mockSearchParams,
}));

const mockUseQueryImpl = jest.fn();
const mockGenerateCheckoutLink = jest.fn();
jest.mock("convex/react", () => ({
	useQuery: (...args: unknown[]) => mockUseQueryImpl(...args),
	useAction: () => mockGenerateCheckoutLink,
	useMutation: () => jest.fn(),
}));

jest.mock("@/convex/_generated/api", () => ({
	api: {
		subscriptionTiers: { listCreditPackages: "listCreditPackages" },
		polar: { generateCheckoutLink: "generateCheckoutLink" },
		usageTracking: { listByUser: "listByUser" },
		credits: {
			getManualTopupPresets: "getManualTopupPresets",
			recordManualTopUp: "recordManualTopUp",
		},
	},
}));

jest.mock("@/hooks/business-logic/useCredits", () => ({
	useCredits: () => ({
		balance: 10,
		totalUsed: 5,
		totalPurchased: 15,
		isLoading: false,
	}),
}));

const mockToastSuccess = jest.fn();
jest.mock("sonner", () => ({
	toast: { success: (...args: unknown[]) => mockToastSuccess(...args) },
}));

// Pulled in transitively via AccountTabs -> SubscriptionTab. SubscriptionTab
// itself is never rendered in this file's tests (only the "usage" tab is
// ever selected), but its module still needs to load without throwing —
// `@convex-dev/polar/react` ships an untransformed ESM build.
jest.mock("@convex-dev/polar/react", () => ({
	CustomerPortalLink: () => null,
}));

// Pulled in transitively via AccountTabs -> ProfileTab (never rendered here).
jest.mock("@clerk/nextjs", () => ({
	useUser: () => ({ user: { id: "user_1" } }),
	useClerk: () => ({}),
}));

import { InsufficientCreditsModal } from "@/components/credits/InsufficientCreditsModal";
import { AccountTabs } from "@/components/dashboard/account/AccountTabs";
import { PurchaseCreditsModal } from "@/components/dashboard/account/modals/PurchaseCreditsModal";
import { UsageCreditsTab } from "@/components/dashboard/account/tabs/UsageCreditsTab";
import { usePurchaseSuccessToast } from "@/hooks/business-logic/usePurchaseSuccessToast";

beforeEach(() => {
	jest.clearAllMocks();
	mockSearchParams = new URLSearchParams();
	mockUseQueryImpl.mockReturnValue([]);
});

// jest-environment-jsdom 30 / jsdom 26 declare `window.location` (and every
// one of its own accessors, e.g. `href`) as `configurable: false`. Neither
// `Object.defineProperty(window, "location", ...)` nor `delete
// window.location` nor `jest.spyOn(window.location, "href", "set")` can
// override or observe it — all three throw
// "Property `location`/`href` is not declared configurable". `history.
// pushState` is the one legitimate, fully-implemented same-origin mechanism
// jsdom exposes for moving `window.location.href`/`.search` under test.
function setWindowLocationPath(pathWithQuery: string) {
	window.history.pushState({}, "", pathWithQuery);
}

// ── InsufficientCreditsModal ────────────────────────────────────────────

describe("InsufficientCreditsModal", () => {
	test("smart default: navigates via the locale-aware router with tab=usage AND returnTo=<returnUrl>", async () => {
		const user = userEvent.setup();
		render(
			<InsufficientCreditsModal
				isOpen
				onClose={jest.fn()}
				required={20}
				available={5}
				returnUrl="https://app.example.com/workflow/step-2"
			/>,
		);

		await user.click(screen.getByRole("button", { name: /Purchase Credits/i }));

		expect(mockRouterPush).toHaveBeenCalledTimes(1);
		const pushedUrl = mockRouterPush.mock.calls[0][0] as string;
		const [path, query] = pushedUrl.split("?");
		const params = new URLSearchParams(query);
		expect(path).toBe("/dashboard/account");
		expect(params.get("tab")).toBe("usage");
		expect(params.get("returnTo")).toBe(
			"https://app.example.com/workflow/step-2",
		);
	});

	test("backward-compat: calls onPurchase instead of the router when provided", async () => {
		const user = userEvent.setup();
		const onPurchase = jest.fn();
		render(
			<InsufficientCreditsModal
				isOpen
				onClose={jest.fn()}
				onPurchase={onPurchase}
				required={20}
				available={5}
				returnUrl="https://app.example.com/workflow/step-2"
			/>,
		);

		await user.click(screen.getByRole("button", { name: /Purchase Credits/i }));

		expect(onPurchase).toHaveBeenCalledTimes(1);
		expect(mockRouterPush).not.toHaveBeenCalled();
	});
});

// ── PurchaseCreditsModal ────────────────────────────────────────────────

describe("PurchaseCreditsModal", () => {
	const packages = [
		{
			tierKey: "credits_popular",
			polarProductId: "prod_popular_1",
			displayName: "Popular Pack",
			initialCredits: 100,
			bonusCredits: 10,
			priceUsd: 9.99,
		},
	];

	beforeEach(() => {
		mockUseQueryImpl.mockReturnValue(packages);
	});

	test("checkout calls generateCheckoutLink with successUrl carrying creditsAdded=1 and the same-origin path/query it started from", async () => {
		const user = userEvent.setup();
		mockGenerateCheckoutLink.mockResolvedValue({
			url: "https://polar.sh/checkout/abc123",
		});
		setWindowLocationPath("/workflow/step-2");

		render(
			<PurchaseCreditsModal
				isOpen
				onClose={jest.fn()}
				successUrl="http://localhost/workflow/step-2"
			/>,
		);

		await user.click(screen.getByRole("button", { name: /Purchase Credits/i }));

		expect(mockGenerateCheckoutLink).toHaveBeenCalledTimes(1);
		const callArg = mockGenerateCheckoutLink.mock.calls[0][0] as {
			productIds: string[];
			successUrl: string;
			origin: string;
		};
		expect(callArg.productIds).toEqual(["prod_popular_1"]);
		expect(callArg.origin).toBe(window.location.origin);
		const successUrl = new URL(callArg.successUrl);
		expect(successUrl.searchParams.get("creditsAdded")).toBe("1");
		expect(successUrl.pathname).toBe("/workflow/step-2");

		// NOT independently assertable in this suite: jest-environment-jsdom 30
		// declares every accessor on `window.location` (including `href`)
		// `configurable: false`, so neither redefining, deleting, nor spying on
		// it is possible — confirmed by hand above (see `setWindowLocationPath`
		// comment). The component's final `window.location.href = url;` line
		// executes without throwing (proven implicitly: this test would fail
		// with an uncaught exception otherwise), but the resulting `href`
		// value cannot be read back or spied on from test code. This is a
		// genuine jsdom limitation, not an untested behaviour skipped for
		// convenience.
	});
});

// ── UsageCreditsTab ──────────────────────────────────────────────────────

describe("UsageCreditsTab", () => {
	test("passes ?returnTo=<x> from the URL down to PurchaseCreditsModal as its successUrl prop (proven via the checkout call it drives)", async () => {
		mockSearchParams = new URLSearchParams(
			"returnTo=https%3A%2F%2Fapp.example.com%2Fworkflow%2Fstep-2",
		);
		// `useQuery` is called by both UsageCreditsTab (`usageHistory`) and
		// PurchaseCreditsModal (`packages`); route by query key so each gets a
		// shape matching what it actually renders (avoids a spurious React
		// "missing key" warning from usageHistory rows keying off `_id`).
		mockUseQueryImpl.mockImplementation((query: string) => {
			if (query === "listCreditPackages") {
				return [
					{
						tierKey: "credits_popular",
						polarProductId: "prod_popular_1",
						displayName: "Popular Pack",
						initialCredits: 100,
						bonusCredits: 0,
						priceUsd: 9.99,
					},
				];
			}
			return [];
		});
		mockGenerateCheckoutLink.mockResolvedValue({ url: "https://polar.sh/x" });

		const user = userEvent.setup();
		render(<UsageCreditsTab user={{} as UserResource} />);

		// Open the modal via the tab's own "Purchase Credits" CTA.
		await user.click(screen.getByRole("button", { name: /Purchase Credits/i }));

		// Both UsageCreditsTab's own CTA and PurchaseCreditsModal's internal CTA
		// render the same "Purchase Credits" label — scope to the dialog to hit
		// PurchaseCreditsModal's checkout button specifically.
		const dialog = screen.getByRole("dialog");
		const checkoutButton = within(dialog).getByRole("button", {
			name: /Purchase Credits/i,
		});
		await user.click(checkoutButton);

		expect(mockGenerateCheckoutLink).toHaveBeenCalledTimes(1);
		const callArg = mockGenerateCheckoutLink.mock.calls[0][0] as {
			successUrl: string;
		};
		const successUrl = new URL(callArg.successUrl);
		// If UsageCreditsTab had NOT wired `returnTo` through as `successUrl`,
		// PurchaseCreditsModal would fall back to `window.location.href` (the
		// full `/dashboard/account?...` URL) instead of the workflow URL below.
		expect(successUrl.origin + successUrl.pathname).toBe(
			"https://app.example.com/workflow/step-2",
		);
	});
});

// ── AccountTabs ──────────────────────────────────────────────────────────

describe("AccountTabs", () => {
	test("with ?tab=usage in the URL, the usage tab renders selected and its content mounts", () => {
		mockSearchParams = new URLSearchParams("tab=usage");
		mockUseQueryImpl.mockReturnValue([]);

		render(<AccountTabs user={{} as UserResource} />);

		const usageNavButton = screen.getByRole("button", { name: /Usage/i });
		expect(usageNavButton).toHaveClass("border-foreground");
		expect(usageNavButton).toHaveClass("text-foreground");

		const profileNavButton = screen.getByRole("button", { name: /Profile/i });
		expect(profileNavButton).not.toHaveClass("border-foreground");

		// The Usage tab's own content (unique to UsageCreditsTab) is mounted;
		// ProfileTab's content is not, proving the URL param — not the
		// hardcoded "profile" default — drove which panel rendered.
		expect(
			screen.getByRole("heading", { name: /Credit Balance/i }),
		).toBeInTheDocument();
	});
});

// ── usePurchaseSuccessToast ──────────────────────────────────────────────

describe("usePurchaseSuccessToast", () => {
	test("fires the resolved i18n toast once when ?creditsAdded=1 is present, then strips the param from the URL", () => {
		mockSearchParams = new URLSearchParams("creditsAdded=1&foo=bar");
		setWindowLocationPath("/dashboard/account?creditsAdded=1&foo=bar");
		const replaceStateSpy = jest.spyOn(window.history, "replaceState");

		renderHook(() => usePurchaseSuccessToast());

		expect(mockToastSuccess).toHaveBeenCalledTimes(1);
		expect(mockToastSuccess).toHaveBeenCalledWith(
			"Credits added successfully! You can continue now.",
		);

		expect(replaceStateSpy).toHaveBeenCalledTimes(1);
		const strippedUrl = replaceStateSpy.mock.calls[0][2] as string;
		expect(strippedUrl).not.toContain("creditsAdded");
		expect(strippedUrl).toContain("foo=bar");

		replaceStateSpy.mockRestore();
	});

	test("does not fire when creditsAdded is absent", () => {
		mockSearchParams = new URLSearchParams("foo=bar");

		renderHook(() => usePurchaseSuccessToast());

		expect(mockToastSuccess).not.toHaveBeenCalled();
	});

	test("uses the provided showToast callback instead of sonner's toast when given", () => {
		mockSearchParams = new URLSearchParams("creditsAdded=1");
		setWindowLocationPath("/dashboard/account?creditsAdded=1");
		const showToast = jest.fn();

		renderHook(() => usePurchaseSuccessToast(showToast));

		expect(showToast).toHaveBeenCalledWith(
			"Credits added successfully! You can continue now.",
		);
		expect(mockToastSuccess).not.toHaveBeenCalled();
	});
});
