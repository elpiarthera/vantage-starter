/**
 * @vitest-environment jsdom
 */

import { useUser } from "@clerk/nextjs";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WelcomeHeader } from "@/components/dashboard/home/WelcomeHeader";

// Mock Clerk
vi.mock("@clerk/nextjs", () => ({
	useUser: vi.fn(),
}));

// Mock DeviceContext
vi.mock("@/contexts/DeviceContext", () => ({
	useDevice: vi.fn(() => ({ isMobile: false })),
}));

// Mock QuickStatsCards
vi.mock("@/components/dashboard/home/QuickStatsCards", () => ({
	QuickStatsCards: () => <div data-testid="quick-stats">Stats</div>,
}));

describe("WelcomeHeader", () => {
	const defaultProps = {
		totalProjects: 5,
		creditsRemaining: 190,
		videosGenerated: 3,
		storageUsed: { totalGB: 1.2 },
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should display user first name when available", () => {
		(useUser as ReturnType<typeof vi.fn>).mockReturnValue({
			user: {
				firstName: "Laurent",
				username: "lperello",
			},
		} as ReturnType<typeof useUser>);

		render(<WelcomeHeader {...defaultProps} />);

		expect(screen.getByText(/Welcome back, Laurent!/i)).toBeInTheDocument();
	});

	it("should display username when first name is not available", () => {
		(useUser as ReturnType<typeof vi.fn>).mockReturnValue({
			user: {
				firstName: null,
				username: "testuser",
			},
		} as ReturnType<typeof useUser>);

		render(<WelcomeHeader {...defaultProps} />);

		expect(screen.getByText(/Welcome back, testuser!/i)).toBeInTheDocument();
	});

	it("should display fallback text when no user data available", () => {
		(useUser as ReturnType<typeof vi.fn>).mockReturnValue({
			user: {
				firstName: null,
				username: null,
			},
		} as ReturnType<typeof useUser>);

		render(<WelcomeHeader {...defaultProps} />);

		expect(screen.getByText(/Welcome back, there!/i)).toBeInTheDocument();
	});

	it("should render project summary text", () => {
		(useUser as ReturnType<typeof vi.fn>).mockReturnValue({
			user: { firstName: "John" },
		} as ReturnType<typeof useUser>);

		render(<WelcomeHeader {...defaultProps} />);

		expect(
			screen.getByText(/Here's what's happening with your projects/i),
		).toBeInTheDocument();
	});

	it("should render QuickStatsCards component", () => {
		(useUser as ReturnType<typeof vi.fn>).mockReturnValue({
			user: { firstName: "John" },
		} as ReturnType<typeof useUser>);

		render(<WelcomeHeader {...defaultProps} />);

		expect(screen.getByTestId("quick-stats")).toBeInTheDocument();
	});
});
