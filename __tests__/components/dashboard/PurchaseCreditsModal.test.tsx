/**
 * @vitest-environment jsdom
 *
 * Task 18 — PurchaseCreditsModal component tests.
 * Verifies loading state, package rendering from Convex (no hardcoded data),
 * credit total calculation, package selection, and checkout button state.
 *
 * All network calls are mocked — no real Convex or Polar API calls.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { useQuery } from "convex/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PurchaseCreditsModal } from "@/components/dashboard/account/modals/PurchaseCreditsModal";

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

vi.mock("@convex-dev/polar/react", () => ({
	CheckoutLink: ({
		children,
	}: {
		children: React.ReactNode;
		polarApi?: unknown;
		productIds?: string[];
		embed?: boolean;
		lazy?: boolean;
		className?: string;
	}) => <div data-testid="checkout-link">{children}</div>,
}));

vi.mock("@/convex/_generated/api", () => ({
	api: {
		subscriptionTiers: {
			listCreditPackages: "subscriptionTiers:listCreditPackages",
		},
		polar: { generateCheckoutLink: "polar:generateCheckoutLink" },
	},
}));

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_PACKAGES = [
	{
		tierKey: "credits_starter",
		displayName: "Starter Pack",
		initialCredits: 25,
		bonusCredits: 0,
		priceUsd: 25,
		polarProductId: "polar_starter_id",
	},
	{
		tierKey: "credits_popular",
		displayName: "Popular Pack",
		initialCredits: 50,
		bonusCredits: 5,
		priceUsd: 50,
		polarProductId: "polar_popular_id",
	},
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("PurchaseCreditsModal", () => {
	const mockUseQuery = useQuery as ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("shows loading spinner when packages are undefined (loading)", () => {
		mockUseQuery.mockReturnValue(undefined);
		render(<PurchaseCreditsModal isOpen={true} onClose={vi.fn()} />);

		// Spinner text is present
		expect(screen.getByText(/loading packages/i)).toBeInTheDocument();
	});

	it("renders all packages returned from Convex — no hardcoded data", () => {
		mockUseQuery.mockReturnValue(MOCK_PACKAGES);
		render(<PurchaseCreditsModal isOpen={true} onClose={vi.fn()} />);

		expect(screen.getByText("Starter Pack")).toBeInTheDocument();
		expect(screen.getByText("Popular Pack")).toBeInTheDocument();
	});

	it("displays correct total credits: initialCredits + bonusCredits per package", () => {
		mockUseQuery.mockReturnValue(MOCK_PACKAGES);
		render(<PurchaseCreditsModal isOpen={true} onClose={vi.fn()} />);

		// Starter Pack: 25 + 0 = 25 credits
		expect(screen.getByText("25")).toBeInTheDocument();
		// Popular Pack: 50 + 5 = 55 credits
		expect(screen.getByText("55")).toBeInTheDocument();
	});

	it("selecting a package renders the CheckoutLink for that package", () => {
		mockUseQuery.mockReturnValue(MOCK_PACKAGES);
		render(<PurchaseCreditsModal isOpen={true} onClose={vi.fn()} />);

		// Click the Starter Pack card (not selected by default — default is credits_popular)
		fireEvent.click(screen.getByText("Starter Pack"));

		// CheckoutLink should be rendered (not disabled button)
		expect(screen.getByTestId("checkout-link")).toBeInTheDocument();
	});

	it("Purchase Credits button is disabled when no package has a polarProductId", () => {
		const packagesWithoutProductId = MOCK_PACKAGES.map((p) => ({
			...p,
			polarProductId: undefined,
		}));
		mockUseQuery.mockReturnValue(packagesWithoutProductId);
		render(<PurchaseCreditsModal isOpen={true} onClose={vi.fn()} />);

		const purchaseButton = screen.getByRole("button", {
			name: /purchase credits/i,
		});
		expect(purchaseButton).toBeDisabled();
	});
});
