/**
 * Integration Tests for Authentication Pages
 * Tests sign-in and sign-up page redirects
 */

import { render, screen } from "@testing-library/react";
import SignInPage from "@/app/[locale]/sign-in/[[...sign-in]]/page";
import SignUpPage from "@/app/[locale]/sign-up/[[...sign-up]]/page";

// Mock Clerk components
jest.mock("@clerk/nextjs", () => ({
	SignIn: ({
		forceRedirectUrl,
		fallbackRedirectUrl,
	}: {
		forceRedirectUrl?: string;
		fallbackRedirectUrl?: string;
	}) => (
		<div data-testid="clerk-signin">
			<div data-testid="force-redirect">{forceRedirectUrl}</div>
			<div data-testid="fallback-redirect">{fallbackRedirectUrl}</div>
		</div>
	),
	SignUp: ({
		forceRedirectUrl,
		fallbackRedirectUrl,
	}: {
		forceRedirectUrl?: string;
		fallbackRedirectUrl?: string;
	}) => (
		<div data-testid="clerk-signup">
			<div data-testid="force-redirect">{forceRedirectUrl}</div>
			<div data-testid="fallback-redirect">{fallbackRedirectUrl}</div>
		</div>
	),
}));

describe("Authentication Pages Integration", () => {
	describe("Sign In Page", () => {
		it("should render sign-in page with correct title", () => {
			render(<SignInPage />);

			expect(screen.getByText("Welcome Back")).toBeInTheDocument();
			expect(
				screen.getByText("Sign in to continue to MyShortReel"),
			).toBeInTheDocument();
		});

		it("should configure redirect to dashboard after sign-in", () => {
			render(<SignInPage />);

			const forceRedirect = screen.getByTestId("force-redirect");
			const fallbackRedirect = screen.getByTestId("fallback-redirect");

			expect(forceRedirect).toHaveTextContent("/dashboard");
			expect(fallbackRedirect).toHaveTextContent("/dashboard");
		});

		it("should render Clerk SignIn component", () => {
			render(<SignInPage />);

			expect(screen.getByTestId("clerk-signin")).toBeInTheDocument();
		});

		it("should apply correct design system styling", () => {
			const { container } = render(<SignInPage />);

			const mainContainer = container.firstChild as HTMLElement;
			expect(mainContainer).toHaveClass("bg-[#101a23]"); // Dark background
		});
	});

	describe("Sign Up Page", () => {
		it("should render sign-up page with correct title", () => {
			render(<SignUpPage />);

			expect(screen.getByText("Create Account")).toBeInTheDocument();
			expect(
				screen.getByText("Start creating amazing video invitations"),
			).toBeInTheDocument();
		});

		it("should configure redirect to dashboard after sign-up", () => {
			render(<SignUpPage />);

			const forceRedirect = screen.getByTestId("force-redirect");
			const fallbackRedirect = screen.getByTestId("fallback-redirect");

			expect(forceRedirect).toHaveTextContent("/dashboard");
			expect(fallbackRedirect).toHaveTextContent("/dashboard");
		});

		it("should render Clerk SignUp component", () => {
			render(<SignUpPage />);

			expect(screen.getByTestId("clerk-signup")).toBeInTheDocument();
		});

		it("should apply correct design system styling", () => {
			const { container } = render(<SignUpPage />);

			const mainContainer = container.firstChild as HTMLElement;
			expect(mainContainer).toHaveClass("bg-[#101a23]"); // Dark background
		});
	});

	describe("Redirect Configuration", () => {
		it("should redirect to dashboard after successful sign-in", () => {
			render(<SignInPage />);

			const forceRedirect = screen.getByTestId("force-redirect");
			expect(forceRedirect).toHaveTextContent("/dashboard");
		});

		it("should redirect to dashboard after successful sign-up", () => {
			render(<SignUpPage />);

			const forceRedirect = screen.getByTestId("force-redirect");
			expect(forceRedirect).toHaveTextContent("/dashboard");
		});

		it("should use fallback redirect if force redirect fails", () => {
			render(<SignInPage />);

			const fallbackRedirect = screen.getByTestId("fallback-redirect");
			expect(fallbackRedirect).toHaveTextContent("/dashboard");
		});
	});
});
