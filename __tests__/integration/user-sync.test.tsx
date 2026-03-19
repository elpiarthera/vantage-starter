/**
 * Integration Tests: UserSyncProvider
 *
 * Critical functionality: Ensures users are automatically synced
 * from Clerk to Convex database on authentication.
 *
 * Tests cover:
 * 1. User syncs when authenticated
 * 2. Sync only happens once per session
 * 3. Sync fails gracefully with retry
 * 4. Sync state resets on sign-out
 */

import { useAuth, useUser } from "@clerk/nextjs";
import { render, screen, waitFor } from "@testing-library/react";
import { useMutation } from "convex/react";
import type { ReactNode } from "react";
import { UserSyncProvider } from "@/components/UserSyncProvider";

// Mock Clerk hooks
jest.mock("@clerk/nextjs", () => ({
	useAuth: jest.fn(),
	useUser: jest.fn(),
}));

// Mock Convex useMutation
jest.mock("convex/react", () => ({
	useMutation: jest.fn(),
}));

describe("UserSyncProvider", () => {
	const mockSyncUser = jest.fn();
	const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
	const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;
	const mockUseMutation = useMutation as jest.MockedFunction<
		typeof useMutation
	>;

	beforeEach(() => {
		jest.clearAllMocks();
		// Mock the mutation function - cast needed for Jest mock compatibility
		// biome-ignore lint/suspicious/noExplicitAny: Required for Jest mock type compatibility
		mockUseMutation.mockReturnValue(mockSyncUser as any);
		mockSyncUser.mockResolvedValue("user_123"); // Default success
	});

	const TestComponent = ({ children }: { children?: ReactNode }) => (
		<UserSyncProvider>
			<div data-testid="test-content">{children || "Test Content"}</div>
		</UserSyncProvider>
	);

	describe("✅ Test 1: User syncs on authentication", () => {
		it("should call syncUser when user is authenticated", async () => {
			// Arrange: Mock authenticated user
			mockUseAuth.mockReturnValue({ isSignedIn: true } as ReturnType<
				typeof useAuth
			>);
			mockUseUser.mockReturnValue({
				user: {
					id: "clerk_user_123",
					primaryEmailAddress: { emailAddress: "test@example.com" },
					firstName: "John",
					lastName: "Doe",
					username: "johndoe",
					imageUrl: "https://example.com/avatar.jpg",
				},
			} as ReturnType<typeof useUser>);

			// Act: Render component
			render(<TestComponent />);

			// Assert: syncUser called with correct data
			await waitFor(() => {
				expect(mockSyncUser).toHaveBeenCalledTimes(1);
				expect(mockSyncUser).toHaveBeenCalledWith({
					clerkUserId: "clerk_user_123",
					email: "test@example.com",
					firstName: "John",
					lastName: "Doe",
					username: "johndoe",
					imageUrl: "https://example.com/avatar.jpg",
				});
			});

			// Verify content renders
			expect(screen.getByTestId("test-content")).toBeInTheDocument();
		});

		it("should handle optional user fields", async () => {
			// Arrange: User with minimal data
			mockUseAuth.mockReturnValue({ isSignedIn: true } as ReturnType<
				typeof useAuth
			>);
			mockUseUser.mockReturnValue({
				user: {
					id: "clerk_user_456",
					primaryEmailAddress: { emailAddress: "minimal@example.com" },
					firstName: null,
					lastName: null,
					username: null,
					imageUrl: null,
				},
			} as unknown as ReturnType<typeof useUser>);

			// Act
			render(<TestComponent />);

			// Assert: syncUser called with undefined for optional fields
			await waitFor(() => {
				expect(mockSyncUser).toHaveBeenCalledWith({
					clerkUserId: "clerk_user_456",
					email: "minimal@example.com",
					firstName: undefined,
					lastName: undefined,
					username: undefined,
					imageUrl: undefined,
				});
			});
		});
	});

	describe("✅ Test 2: Sync only happens once per session", () => {
		it("should not sync multiple times for same user", async () => {
			// Arrange
			mockUseAuth.mockReturnValue({ isSignedIn: true } as ReturnType<
				typeof useAuth
			>);
			mockUseUser.mockReturnValue({
				user: {
					id: "clerk_user_789",
					primaryEmailAddress: { emailAddress: "once@example.com" },
				},
			} as ReturnType<typeof useUser>);

			// Act: Render and re-render multiple times
			const { rerender } = render(<TestComponent />);

			await waitFor(() => {
				expect(mockSyncUser).toHaveBeenCalledTimes(1);
			});

			// Rerender multiple times
			rerender(<TestComponent>Updated Content</TestComponent>);
			rerender(<TestComponent>Updated Again</TestComponent>);

			// Assert: Still only called once
			// No need to await here, should be synchronous check after initial sync
			expect(mockSyncUser).toHaveBeenCalledTimes(1);
		});
	});

	describe("✅ Test 3: Sync fails gracefully with retry", () => {
		it("should handle sync errors without breaking app", async () => {
			// Arrange: Mock sync failure
			const consoleError = jest.spyOn(console, "error").mockImplementation();
			mockSyncUser.mockRejectedValueOnce(new Error("Network error"));
			mockUseAuth.mockReturnValue({ isSignedIn: true } as ReturnType<
				typeof useAuth
			>);
			mockUseUser.mockReturnValue({
				user: {
					id: "clerk_user_error",
					primaryEmailAddress: { emailAddress: "error@example.com" },
				},
			} as ReturnType<typeof useUser>);

			// Act
			render(<TestComponent />);

			// Assert: Error logged but app still renders
			await waitFor(() => {
				expect(consoleError).toHaveBeenCalledWith(
					expect.stringContaining("[UserSync] ❌ Failed to sync user:"),
					expect.any(Object),
				);
			});

			expect(screen.getByTestId("test-content")).toBeInTheDocument();

			consoleError.mockRestore();
		});

		it("should retry sync on next render after failure", async () => {
			// Arrange: First call fails, second succeeds
			mockSyncUser
				.mockRejectedValueOnce(new Error("First attempt failed"))
				.mockResolvedValueOnce("user_success");

			mockUseAuth.mockReturnValue({ isSignedIn: true } as ReturnType<
				typeof useAuth
			>);
			mockUseUser.mockReturnValue({
				user: {
					id: "clerk_user_retry",
					primaryEmailAddress: { emailAddress: "retry@example.com" },
				},
			} as ReturnType<typeof useUser>);

			// Act: Initial render (fails)
			const { rerender } = render(<TestComponent />);

			await waitFor(() => {
				expect(mockSyncUser).toHaveBeenCalledTimes(1);
			});

			// To trigger a re-render that causes the effect to re-run,
			// we can simulate a change in one of its dependencies.
			// Here, we'll just re-render with the same props, which is sufficient
			// because the internal state 'isSyncing' will have changed.
			rerender(<TestComponent />);

			// Assert: Second attempt succeeds
			await waitFor(() => {
				expect(mockSyncUser).toHaveBeenCalledTimes(2);
			});
		});
	});

	describe("✅ Test 4: Sync state resets on sign-out", () => {
		it("should reset sync state when user signs out and allow resync", async () => {
			// Arrange: Start signed in
			mockUseAuth.mockReturnValue({ isSignedIn: true } as ReturnType<
				typeof useAuth
			>);
			mockUseUser.mockReturnValue({
				user: {
					id: "clerk_user_signout",
					primaryEmailAddress: { emailAddress: "signout@example.com" },
				},
			} as ReturnType<typeof useUser>);

			// Act: Initial render (user signed in)
			const { rerender } = render(<TestComponent />);

			await waitFor(() => {
				expect(mockSyncUser).toHaveBeenCalledTimes(1);
			});

			// Act: User signs out
			mockUseAuth.mockReturnValue({ isSignedIn: false } as ReturnType<
				typeof useAuth
			>);
			mockUseUser.mockReturnValue({ user: null } as ReturnType<typeof useUser>);
			rerender(<TestComponent />);

			// Act: User signs in again
			mockUseAuth.mockReturnValue({ isSignedIn: true } as ReturnType<
				typeof useAuth
			>);
			mockUseUser.mockReturnValue({
				user: {
					id: "clerk_user_signout", // Same user
					primaryEmailAddress: { emailAddress: "signout@example.com" },
				},
			} as ReturnType<typeof useUser>);
			rerender(<TestComponent />);

			// Assert: Sync called again (state was reset)
			await waitFor(() => {
				expect(mockSyncUser).toHaveBeenCalledTimes(2);
			});
		});
	});

	describe("❌ Edge Cases", () => {
		it("should not sync when user is not signed in", async () => {
			// Arrange
			mockUseAuth.mockReturnValue({ isSignedIn: false } as ReturnType<
				typeof useAuth
			>);
			mockUseUser.mockReturnValue({ user: null } as ReturnType<typeof useUser>);

			// Act
			render(<TestComponent />);

			// Assert: syncUser never called. We wait a moment to be sure.
			await new Promise((r) => setTimeout(r, 100));
			expect(mockSyncUser).not.toHaveBeenCalled();
		});

		it("should handle missing email address", async () => {
			// Arrange
			mockUseAuth.mockReturnValue({ isSignedIn: true } as ReturnType<
				typeof useAuth
			>);
			mockUseUser.mockReturnValue({
				user: {
					id: "clerk_user_no_email",
					primaryEmailAddress: null,
				},
			} as unknown as ReturnType<typeof useUser>);

			// Act
			render(<TestComponent />);

			// Assert: syncUser called with empty string for email
			await waitFor(() => {
				expect(mockSyncUser).toHaveBeenCalledWith(
					expect.objectContaining({
						clerkUserId: "clerk_user_no_email",
						email: "",
					}),
				);
			});
		});
	});
});
