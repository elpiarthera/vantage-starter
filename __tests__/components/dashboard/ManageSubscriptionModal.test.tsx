/**
 * @vitest-environment jsdom
 *
 * Task 19 — ManageSubscriptionModal component tests.
 * Verifies plan rendering from Convex DB, CTA label logic
 * (upgrade/downgrade/current), and Polar Customer Portal integration.
 *
 * All network calls are mocked — no real Convex or Polar API calls.
 *
 * NOTE: Cancellation is handled via Polar Customer Portal, not in-app.
 */

import { act, fireEvent, render, screen } from "@testing-library/react";
import { useQuery } from "convex/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ManageSubscriptionModal } from "@/components/dashboard/account/modals/ManageSubscriptionModal";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockGeneratePortalUrl = vi.fn().mockResolvedValue({
	url: "https://sandbox.polar.sh/portal?token=test",
});

vi.mock("convex/react", () => ({
	useQuery: vi.fn(),
	useAction: vi.fn((actionName: string) => {
		if (String(actionName).includes("generateCustomerPortalUrl")) {
			return mockGeneratePortalUrl;
		}
		return vi.fn();
	}),
}));

vi.mock("next-intl", () => ({
	useTranslations: () => (key: string) => key,
}));

vi.mock("@/contexts/DeviceContext", () => ({
	useDevice: vi.fn(() => ({ isMobile: false })),
}));

vi.mock("@convex-dev/polar/react", () => ({
	CheckoutLink: ({
		children,
	}: {
		children: React.ReactNode;
		polarApi?: unknown;
		productIds?: string[];
		className?: string;
		lazy?: boolean;
	}) => <div data-testid="checkout-link">{children}</div>,
}));

vi.mock("@/convex/_generated/api", () => ({
	api: {
		subscriptionTiers: {
			listSubscriptionPlans: "subscriptionTiers:listSubscriptionPlans",
		},
		polar: {
			generateCheckoutLink: "polar:generateCheckoutLink",
			generateCustomerPortalUrl: "polar:generateCustomerPortalUrl",
		},
	},
}));

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_DB_TIERS = [
	{
		tierKey: "tier_1",
		displayName: "Starter",
		priceUsd: 9.99,
		monthlyCredits: 200,
		sortOrder: 1,
		polarProductId: "polar_starter_id",
	},
	{
		tierKey: "tier_2",
		displayName: "Pro",
		priceUsd: 29.99,
		monthlyCredits: 1000,
		sortOrder: 2,
		polarProductId: "polar_pro_id",
	},
	{
		tierKey: "tier_3",
		displayName: "Enterprise",
		priceUsd: 99.99,
		monthlyCredits: 5000,
		sortOrder: 3,
		polarProductId: "polar_enterprise_id",
	},
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("ManageSubscriptionModal", () => {
	const mockUseQuery = useQuery as ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.clearAllMocks();
		mockGeneratePortalUrl.mockResolvedValue({
			url: "https://sandbox.polar.sh/portal?token=test",
		});
		vi.stubGlobal("open", vi.fn());
	});

	it("shows loading spinner when dbTiers is undefined", () => {
		mockUseQuery.mockReturnValue(undefined);
		render(
			<ManageSubscriptionModal
				isOpen={true}
				onClose={vi.fn()}
				currentPlan="free"
			/>,
		);

		// Spinner is present, no plan cards
		expect(document.querySelector(".animate-spin")).toBeInTheDocument();
		expect(screen.queryByText("Starter")).not.toBeInTheDocument();
	});

	it("renders free plan + all 3 DB tiers once data loads (4 plan cards total)", () => {
		mockUseQuery.mockReturnValue(MOCK_DB_TIERS);
		render(
			<ManageSubscriptionModal
				isOpen={true}
				onClose={vi.fn()}
				currentPlan="free"
			/>,
		);

		expect(screen.getByText("plan_name_free")).toBeInTheDocument();
		expect(screen.getByText("Starter")).toBeInTheDocument();
		expect(screen.getByText("Pro")).toBeInTheDocument();
		expect(screen.getByText("Enterprise")).toBeInTheDocument();
	});

	it("current plan card shows 'current_plan_badge' and its CTA button is disabled", () => {
		mockUseQuery.mockReturnValue(MOCK_DB_TIERS);
		render(
			<ManageSubscriptionModal
				isOpen={true}
				onClose={vi.fn()}
				currentPlan="pro"
			/>,
		);

		expect(screen.getByText("current_plan_badge")).toBeInTheDocument();
		// The current plan button is disabled
		const currentButton = screen.getByRole("button", {
			name: "current_plan_button",
		});
		expect(currentButton).toBeDisabled();
	});

	it("higher-tier plan shows upgrade_button; lower-tier shows downgrade_button", () => {
		mockUseQuery.mockReturnValue(MOCK_DB_TIERS);
		render(
			<ManageSubscriptionModal
				isOpen={true}
				onClose={vi.fn()}
				currentPlan="starter"
			/>,
		);

		// Pro and Enterprise are upgrades
		const upgradeButtons = screen.getAllByText("upgrade_button");
		expect(upgradeButtons.length).toBeGreaterThanOrEqual(1);

		// Free is a downgrade
		expect(screen.getByText("downgrade_button")).toBeInTheDocument();
	});

	it("manage in portal button renders when currentPlan is not free", () => {
		mockUseQuery.mockReturnValue(MOCK_DB_TIERS);
		render(
			<ManageSubscriptionModal
				isOpen={true}
				onClose={vi.fn()}
				currentPlan="starter"
			/>,
		);

		expect(
			screen.getByRole("button", { name: "manage_in_portal_button" }),
		).toBeInTheDocument();
	});

	it("manage in portal button is NOT rendered when currentPlan is free", () => {
		mockUseQuery.mockReturnValue(MOCK_DB_TIERS);
		render(
			<ManageSubscriptionModal
				isOpen={true}
				onClose={vi.fn()}
				currentPlan="free"
			/>,
		);

		expect(
			screen.queryByRole("button", { name: "manage_in_portal_button" }),
		).not.toBeInTheDocument();
	});

	it("upgrade/downgrade buttons for paid subscribers open the Polar Customer Portal in a new tab", async () => {
		mockUseQuery.mockReturnValue(MOCK_DB_TIERS);
		render(
			<ManageSubscriptionModal
				isOpen={true}
				onClose={vi.fn()}
				currentPlan="starter"
			/>,
		);

		// For paid users, no CheckoutLink wrappers — buttons call handleOpenPortal directly
		expect(screen.queryAllByTestId("checkout-link").length).toBe(0);

		// Click the Pro "Upgrade" button — wrapped in act to flush async state updates
		await act(async () => {
			fireEvent.click(screen.getAllByText("upgrade_button")[0]);
		});

		// generateCustomerPortalUrl action must have been called
		expect(mockGeneratePortalUrl).toHaveBeenCalledWith({});

		// Portal URL must be opened in a new tab
		expect(window.open).toHaveBeenCalledWith(
			"https://sandbox.polar.sh/portal?token=test",
			"_blank",
		);
	});

	it("clicking manage in portal opens Polar Customer Portal", async () => {
		mockUseQuery.mockReturnValue(MOCK_DB_TIERS);
		render(
			<ManageSubscriptionModal
				isOpen={true}
				onClose={vi.fn()}
				currentPlan="starter"
			/>,
		);

		// Click manage in portal button
		await act(async () => {
			fireEvent.click(
				screen.getByRole("button", { name: "manage_in_portal_button" }),
			);
		});

		// generateCustomerPortalUrl action must have been called
		expect(mockGeneratePortalUrl).toHaveBeenCalledWith({});

		// Portal URL must be opened in a new tab
		expect(window.open).toHaveBeenCalledWith(
			"https://sandbox.polar.sh/portal?token=test",
			"_blank",
		);
	});

	it("downgrade to free button opens Polar Customer Portal", async () => {
		mockUseQuery.mockReturnValue(MOCK_DB_TIERS);
		render(
			<ManageSubscriptionModal
				isOpen={true}
				onClose={vi.fn()}
				currentPlan="starter"
			/>,
		);

		// Click downgrade button on free plan card
		await act(async () => {
			fireEvent.click(screen.getByText("downgrade_button"));
		});

		// Should open portal for cancellation
		expect(mockGeneratePortalUrl).toHaveBeenCalledWith({});
		expect(window.open).toHaveBeenCalledWith(
			"https://sandbox.polar.sh/portal?token=test",
			"_blank",
		);
	});
});
