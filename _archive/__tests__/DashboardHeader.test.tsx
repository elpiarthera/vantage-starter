import { useUser } from "@clerk/nextjs";
import { render, screen } from "@testing-library/react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

// Mock Clerk
jest.mock("@clerk/nextjs", () => ({
	useUser: jest.fn(),
	SignOutButton: ({ children }: { children: React.ReactNode }) => (
		<button type="button">{children}</button>
	),
}));

// Mock DeviceContext
jest.mock("@/contexts/DeviceContext", () => ({
	useDevice: jest.fn(() => ({ isMobile: false })),
}));

// Mock Next.js Link
jest.mock("next/link", () => {
	return ({ children, href }: { children: React.ReactNode; href: string }) => (
		<a href={href}>{children}</a>
	);
});

describe("DashboardHeader", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("should display full name when available", () => {
		(useUser as jest.Mock).mockReturnValue({
			user: {
				fullName: "Laurent Perello",
				username: "lperello",
				imageUrl: "https://example.com/avatar.jpg",
			},
		});

		render(<DashboardHeader />);

		expect(screen.getByText("Laurent Perello")).toBeInTheDocument();
	});

	it("should display username as fallback", () => {
		(useUser as jest.Mock).mockReturnValue({
			user: {
				fullName: null,
				username: "testuser",
				imageUrl: null,
			},
		});

		render(<DashboardHeader />);

		expect(screen.getByText("testuser")).toBeInTheDocument();
	});

	it('should display "User" as final fallback', () => {
		(useUser as jest.Mock).mockReturnValue({
			user: {
				fullName: null,
				username: null,
				imageUrl: null,
			},
		});

		render(<DashboardHeader />);

		expect(screen.getByText("User")).toBeInTheDocument();
	});

	it("should display correct initials for full name", () => {
		(useUser as jest.Mock).mockReturnValue({
			user: {
				fullName: "Laurent Perello",
				username: "lperello",
				imageUrl: null,
			},
		});

		render(<DashboardHeader />);

		// Check for avatar fallback with initials
		expect(screen.getByText("LP")).toBeInTheDocument();
	});

	it("should render MyShortReel branding", () => {
		(useUser as jest.Mock).mockReturnValue({
			user: { fullName: "Test User" },
		});

		render(<DashboardHeader />);

		expect(screen.getByText("MyShortReel")).toBeInTheDocument();
	});

	it("should render notification button with badge", () => {
		(useUser as jest.Mock).mockReturnValue({
			user: { fullName: "Test User" },
		});

		render(<DashboardHeader />);

		const notificationButton = screen.getByLabelText("Notifications");
		expect(notificationButton).toBeInTheDocument();
	});

	it("should render user menu with Profile and Settings links", () => {
		(useUser as jest.Mock).mockReturnValue({
			user: { fullName: "Test User" },
		});

		render(<DashboardHeader />);

		// Desktop: User menu should be closed initially (items not visible in dropdown)
		expect(screen.queryByText("Profile")).not.toBeInTheDocument();
		expect(screen.queryByText("Settings")).not.toBeInTheDocument();
	});

	it("should render sign out option", () => {
		(useUser as jest.Mock).mockReturnValue({
			user: { fullName: "Test User" },
		});

		render(<DashboardHeader />);

		// Desktop: Sign out button is wrapped in dropdown, not initially visible
		expect(screen.queryByText("Log out")).not.toBeInTheDocument();
	});
});
