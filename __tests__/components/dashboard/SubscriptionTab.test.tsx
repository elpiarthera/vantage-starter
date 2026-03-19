/**
 * @vitest-environment jsdom
 *
 * Task 17 — SubscriptionTab component tests.
 * Verifies rendering logic for free/active/inactive states and
 * conditional sections (payment method, billing history, modal).
 *
 * All network calls are mocked — no real Convex or Polar API calls.
 */

import type { UserResource } from "@clerk/types";
import { fireEvent, render, screen } from "@testing-library/react";
import { useQuery } from "convex/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SubscriptionTab } from "@/components/dashboard/account/tabs/SubscriptionTab";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("convex/react", () => ({
	useQuery: vi.fn(),
}));

vi.mock("next-intl", () => ({
	useTranslations: () => (key: string) => key,
}));

vi.mock("@/contexts/DeviceContext", () => ({
	useDevice: vi.fn(() => ({ isMobile: false })),
}));

vi.mock("@/hooks/useDateFormatter", () => ({
	useDateFormatter: () => ({
		formatShort: () => "Jan 1, 2025",
	}),
}));

vi.mock("@convex-dev/polar/react", () => ({
	CustomerPortalLink: ({
		children,
	}: {
		children: React.ReactNode;
		polarApi?: unknown;
		className?: string;
	}) => children,
}));

vi.mock(
	"@/components/dashboard/account/modals/ManageSubscriptionModal",
	() => ({
		ManageSubscriptionModal: ({
			isOpen,
		}: {
			isOpen: boolean;
			onClose: () => void;
			currentPlan: string;
		}) =>
			isOpen ? (
				<div data-testid="manage-modal">ManageSubscriptionModal</div>
			) : null,
	}),
);

vi.mock("@/convex/_generated/api", () => ({
	api: {
		subscriptions: {
			getByClerkUserId: "subscriptions:getByClerkUserId",
			getFormattedSubscription: "subscriptions:getFormattedSubscription",
		},
		polar: { generateCustomerPortalUrl: "polar:generateCustomerPortalUrl" },
	},
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockUser = {
	id: "clerk_test_user",
} as unknown as UserResource;

const mockSubscription = {
	status: "active",
	plan: {
		tier: "starter",
		name: "Starter",
		features: ["200 credits/month", "SD video export"],
	},
	currentPeriodStart: Date.now() - 86400000,
	currentPeriodEnd: Date.now() + 86400000 * 30,
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("SubscriptionTab", () => {
	const mockUseQuery = useQuery as ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("shows 'status_inactive' badge when useQuery is loading (undefined)", () => {
		mockUseQuery.mockReturnValue(undefined);
		render(<SubscriptionTab user={mockUser} />);

		// Badge shows inactive when loading
		expect(screen.getByText("status_inactive")).toBeInTheDocument();
		// Plan name defaults to translation key
		expect(screen.getByText("plan_name_free")).toBeInTheDocument();
	});

	it("shows 'status_inactive' badge when subscription is null (no subscription)", () => {
		mockUseQuery.mockReturnValue(null);
		render(<SubscriptionTab user={mockUser} />);

		expect(screen.getByText("status_inactive")).toBeInTheDocument();
		expect(screen.getByText("plan_name_free")).toBeInTheDocument();
	});

	it("shows plan name and 'status_active' badge when subscription is active", () => {
		mockUseQuery.mockReturnValue(mockSubscription);
		render(<SubscriptionTab user={mockUser} />);

		expect(screen.getByText("Starter")).toBeInTheDocument();
		expect(screen.getByText("status_active")).toBeInTheDocument();
	});

	it.each([
		["starter", "$9.99"],
		["pro", "$29.99"],
		["enterprise", "$99.99"],
	])("shows correct price for %s tier", (tier, expectedPrice) => {
		mockUseQuery.mockReturnValue({
			...mockSubscription,
			plan: { ...mockSubscription.plan, tier, name: tier },
		});
		render(<SubscriptionTab user={mockUser} />);

		expect(
			screen.getByText(expectedPrice, { exact: false }),
		).toBeInTheDocument();
	});

	it("opens ManageSubscriptionModal when 'manage_subscription' button is clicked", () => {
		mockUseQuery.mockReturnValue(mockSubscription);
		render(<SubscriptionTab user={mockUser} />);

		// Modal is closed initially
		expect(screen.queryByTestId("manage-modal")).not.toBeInTheDocument();

		fireEvent.click(screen.getByText("manage_subscription"));

		expect(screen.getByTestId("manage-modal")).toBeInTheDocument();
	});

	it("payment method and billing history sections only render when subscription exists", () => {
		// Without subscription — sections should not render
		mockUseQuery.mockReturnValue(null);
		const { rerender } = render(<SubscriptionTab user={mockUser} />);

		expect(screen.queryByText("payment_method")).not.toBeInTheDocument();
		expect(screen.queryByText("billing_history")).not.toBeInTheDocument();

		// With subscription — sections should render
		mockUseQuery.mockReturnValue(mockSubscription);
		rerender(<SubscriptionTab user={mockUser} />);

		expect(screen.getByText("payment_method")).toBeInTheDocument();
		expect(screen.getByText("billing_history")).toBeInTheDocument();
	});
});

// ── Bug 1: UI uses correct data source (getFormattedSubscription) ──────────────

describe("Bug 1 — UI data source: getFormattedSubscription", () => {
	const mockUseQuery = useQuery as ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("calls getFormattedSubscription (not getByClerkUserId)", () => {
		mockUseQuery.mockReturnValue(null);
		render(<SubscriptionTab user={mockUser} />);

		// The mock maps getFormattedSubscription → "subscriptions:getFormattedSubscription"
		expect(mockUseQuery).toHaveBeenCalledWith(
			"subscriptions:getFormattedSubscription",
			{ clerkUserId: "clerk_test_user" },
		);
		expect(mockUseQuery).not.toHaveBeenCalledWith(
			"subscriptions:getByClerkUserId",
			expect.anything(),
		);
	});

	it("shows Starter Plan name and Active badge for active subscription from Polar component", () => {
		mockUseQuery.mockReturnValue({
			plan: {
				tier: "starter",
				name: "Starter Plan",
				monthlyCredits: 200,
				features: [],
			},
			status: "active",
			currentPeriodStart: Date.now() - 86400000,
			currentPeriodEnd: Date.now() + 86400000 * 30,
			polarSubscriptionId: "sub_123",
			polarCustomerId: "cust_123",
			polarProductId: "prod_123",
			tierKey: "tier_1",
			cancelAtPeriodEnd: false,
		});

		render(<SubscriptionTab user={mockUser} />);

		expect(screen.getByText("Starter Plan")).toBeInTheDocument();
		expect(screen.getByText("status_active")).toBeInTheDocument();
		expect(screen.queryByText("plan_name_free")).not.toBeInTheDocument();
	});

	it("shows Free plan and Inactive badge when Polar component returns null", () => {
		mockUseQuery.mockReturnValue(null);
		render(<SubscriptionTab user={mockUser} />);

		expect(screen.getByText("plan_name_free")).toBeInTheDocument();
		expect(screen.getByText("status_inactive")).toBeInTheDocument();
	});
});

// ── Bug 4: trialing subscription shows Active badge ───────────────────────────

describe("Bug 4 — trialing subscription shows Active badge", () => {
	const mockUseQuery = useQuery as ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("shows 'status_active' badge for trialing subscription", () => {
		mockUseQuery.mockReturnValue({
			plan: {
				tier: "pro",
				name: "Pro Plan",
				monthlyCredits: 1000,
				features: [],
			},
			status: "trialing",
			currentPeriodStart: Date.now() - 86400000,
			currentPeriodEnd: Date.now() + 86400000 * 7,
			polarSubscriptionId: "sub_trial",
			polarCustomerId: "cust_123",
			polarProductId: "prod_456",
			tierKey: "tier_2",
			cancelAtPeriodEnd: false,
		});

		render(<SubscriptionTab user={mockUser} />);

		expect(screen.getByText("status_active")).toBeInTheDocument();
		expect(screen.queryByText("status_inactive")).not.toBeInTheDocument();
	});

	it("shows 'status_inactive' badge for canceled subscription", () => {
		mockUseQuery.mockReturnValue({
			plan: {
				tier: "starter",
				name: "Starter Plan",
				monthlyCredits: 200,
				features: [],
			},
			status: "canceled",
			currentPeriodStart: Date.now() - 86400000 * 60,
			currentPeriodEnd: Date.now() - 86400000 * 30,
			polarSubscriptionId: "sub_123",
			polarCustomerId: "cust_123",
			polarProductId: "prod_123",
			tierKey: "tier_1",
			cancelAtPeriodEnd: false,
		});

		render(<SubscriptionTab user={mockUser} />);

		expect(screen.getByText("status_inactive")).toBeInTheDocument();
		expect(screen.queryByText("status_active")).not.toBeInTheDocument();
	});
});
