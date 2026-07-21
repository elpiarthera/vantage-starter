/**
 * Coverage for the mcpcn `amount-input` block wired into `UsageCreditsTab`
 * (docs/mcpcn-block-mapping.md §4 "amount-input", Batch 2).
 *
 * Real behaviour asserted: tapping a preset amount calls
 * `api.credits.recordManualTopUp` with that exact preset amount, and the
 * displayed balance reflects the mutation's returned `newBalance` — not a
 * substring of the component's source.
 *
 * Presets are never a literal in the test either: they come from the same
 * `getManualTopupPresets` query the component reads, mocked per-test so a
 * change to `systemConfig`'s seeded values cannot silently desync this file
 * from the component under test.
 */

import type { UserResource } from "@clerk/shared/types";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import en from "@/messages/en.json";

type Dict = Record<string, unknown>;

function resolve(dict: Dict, ns: string, key: string): string {
	let value: unknown = (dict[ns] as Dict | undefined) ?? {};
	for (const segment of key.split(".")) {
		value = (value as Dict | undefined)?.[segment];
	}
	if (typeof value !== "string") {
		return key;
	}
	return value;
}

jest.mock("next-intl", () => ({
	useTranslations:
		(ns: string) => (key: string, vars?: Record<string, unknown>) => {
			const resolved = resolve(en, ns, key);
			if (vars && typeof resolved === "string") {
				return Object.entries(vars).reduce(
					(acc, [k, v]) => acc.replace(`{${k}}`, String(v)),
					resolved,
				);
			}
			return resolved;
		},
	useFormatter: () => ({ dateTime: () => "" }),
	useLocale: () => "en",
}));

jest.mock("@/contexts/DeviceContext", () => ({
	useDevice: () => ({ isMobile: false }),
}));

jest.mock("next/navigation", () => ({
	useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@clerk/nextjs", () => ({
	useUser: () => ({ user: { id: "user_topup_1" } }),
}));

const PRESETS = [10, 25, 50];
const mockRecordManualTopUp = jest.fn();

const mockUseQueryImpl = jest.fn();
jest.mock("convex/react", () => ({
	useQuery: (...args: unknown[]) => mockUseQueryImpl(...args),
	useMutation: () => mockRecordManualTopUp,
	useAction: () => jest.fn(),
}));

jest.mock("@/convex/_generated/api", () => ({
	api: {
		usageTracking: { listByUser: "listByUser" },
		subscriptionTiers: { listCreditPackages: "listCreditPackages" },
		polar: { generateCheckoutLink: "generateCheckoutLink" },
		credits: {
			getManualTopupPresets: "getManualTopupPresets",
			recordManualTopUp: "recordManualTopUp",
		},
	},
}));

// Pulled in transitively via PurchaseCreditsModal, never opened in this suite.
jest.mock("@convex-dev/polar/react", () => ({
	CustomerPortalLink: () => null,
}));

jest.mock("@/hooks/business-logic/useCredits", () => ({
	useCredits: () => ({
		balance: 100,
		totalUsed: 5,
		totalPurchased: 15,
		isLoading: false,
	}),
}));

jest.mock("sonner", () => ({
	toast: { success: jest.fn(), error: jest.fn() },
}));

import { UsageCreditsTab } from "@/components/dashboard/account/tabs/UsageCreditsTab";

beforeEach(() => {
	jest.clearAllMocks();
	mockUseQueryImpl.mockImplementation((query: string) => {
		if (query === "getManualTopupPresets") return PRESETS;
		return [];
	});
});

describe("UsageCreditsTab — manual top-up (amount-input block)", () => {
	test("tapping the $25 preset calls recordManualTopUp with clerkUserId and amount=25", async () => {
		mockRecordManualTopUp.mockResolvedValue({
			success: true,
			transactionId: "tx_1",
			newBalance: 125,
		});
		const user = userEvent.setup();

		render(<UsageCreditsTab user={{} as UserResource} />);

		const presetButton = screen.getByRole("button", { name: "€25" });
		await user.click(presetButton);

		await waitFor(() => {
			expect(mockRecordManualTopUp).toHaveBeenCalledWith({
				clerkUserId: "user_topup_1",
				amount: 25,
			});
		});
	});

	test("after a successful top-up, the displayed balance reflects the mutation's newBalance", async () => {
		mockRecordManualTopUp.mockResolvedValue({
			success: true,
			transactionId: "tx_2",
			newBalance: 150,
		});
		const user = userEvent.setup();

		render(<UsageCreditsTab user={{} as UserResource} />);

		const presetButton = screen.getByRole("button", { name: "€50" });
		await user.click(presetButton);

		await waitFor(() => {
			expect(screen.getByText("150 credits")).toBeInTheDocument();
		});
	});

	test("renders no preset literal that is not sourced from the getManualTopupPresets query", async () => {
		mockUseQueryImpl.mockImplementation((query: string) => {
			if (query === "getManualTopupPresets") return [7, 13];
			return [];
		});

		render(<UsageCreditsTab user={{} as UserResource} />);

		expect(screen.getByRole("button", { name: "€7" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "€13" })).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "€10" })).toBeNull();
	});
});
