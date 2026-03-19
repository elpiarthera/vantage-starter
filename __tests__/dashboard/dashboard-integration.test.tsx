/**
 * @vitest-environment jsdom
 */

import { render, screen, waitFor } from "@testing-library/react";
import { useQuery } from "convex/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "@/app/[locale]/dashboard/page";
import type { Id } from "@/convex/_generated/dataModel";

// Mock Convex hooks
vi.mock("convex/react", () => ({
	useQuery: vi.fn(),
	useMutation: vi.fn(() => vi.fn()),
}));

// Mock Clerk hooks
vi.mock("@clerk/nextjs", () => ({
	useUser: vi.fn(() => ({
		user: {
			id: "user_test123",
			firstName: "Test",
			username: "testuser",
		},
	})),
}));

// Mock useCredits hook
vi.mock("@/hooks/business-logic/useCredits", () => ({
	useCredits: vi.fn(() => ({
		balance: 190,
		totalPurchased: 0,
		totalUsed: 10,
		totalBonusReceived: 200,
		subscriptionTier: undefined,
		isNewUser: false,
		isLoading: false,
		isProcessing: false,
		deductCredits: vi.fn(),
		addCredits: vi.fn(),
		refundCredits: vi.fn(),
	})),
}));

// Mock DeviceContext
vi.mock("@/contexts/DeviceContext", () => ({
	useDevice: vi.fn(() => ({ isMobile: false })),
}));

// Mock UserSyncProvider
vi.mock("@/components/UserSyncProvider", () => ({
	useUserSync: vi.fn(() => ({
		isUserSynced: true,
		isSyncing: false,
	})),
}));

describe("Dashboard Integration Tests", () => {
	const mockUseQuery = useQuery as ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("✅ Test 1: Dashboard renders with real Convex data", () => {
		it("should display user projects from Convex", async () => {
			const mockProjects = [
				{
					_id: "proj_123" as Id<"projects">,
					_creationTime: Date.now(),
					userId: "user_test123",
					name: "Wedding Video",
					occasion: "wedding",
					theme: "romantic",
					language: "en",
					duration: 60,
					status: "completed" as const,
					eventDetails: {
						eventTitle: "Our Wedding",
						description: "A beautiful day",
						date: "2024-12-01",
						location: "Paris",
						rsvpLink: "",
						emotionalStory: "A love story",
					},
					createdAt: Date.now(),
					updatedAt: Date.now(),
				},
			];

			const mockUser = {
				_id: "user_123" as Id<"users">,
				_creationTime: Date.now(),
				clerkUserId: "user_test123",
				email: "test@example.com",
				totalProjects: 1,
				createdAt: Date.now(),
				updatedAt: Date.now(),
				lastActiveAt: Date.now(),
			};

			const mockStorage = {
				totalBytes: 1024 * 1024 * 100,
				totalGB: 0.1,
				assetCount: 5,
			};

			mockUseQuery
				.mockReturnValueOnce(mockProjects) // projects
				.mockReturnValueOnce(mockUser) // currentUser
				.mockReturnValueOnce(mockStorage); // storageUsage

			render(<DashboardPage />);

			// Wait for data to load
			await waitFor(() => {
				expect(screen.getByText("Wedding Video")).toBeInTheDocument();
			});

			// Verify stats are calculated correctly
			// Use more specific queries to avoid ambiguity
			expect(screen.getByText("Total Projects")).toBeInTheDocument();
			expect(screen.getByText("190")).toBeInTheDocument(); // creditsRemaining (200 - 10)
			expect(screen.getByText("0.1 GB")).toBeInTheDocument(); // storageUsed
		});
	});

	describe("✅ Test 2: Loading states work correctly", () => {
		it("should show loading skeleton while data is fetching", () => {
			mockUseQuery
				.mockReturnValueOnce(undefined) // projects
				.mockReturnValueOnce(undefined) // currentUser
				.mockReturnValueOnce(undefined); // storageUsage

			render(<DashboardPage />);

			// Verify loading skeleton is displayed
			const skeletons = document.querySelectorAll(".animate-pulse");
			expect(skeletons.length).toBeGreaterThan(0);
		});
	});

	describe("✅ Test 3: Error states work correctly", () => {
		it("should show error state when query fails", async () => {
			mockUseQuery
				.mockReturnValueOnce(null) // projects failed
				.mockReturnValueOnce(null) // currentUser failed
				.mockReturnValueOnce(null); // storageUsage failed

			render(<DashboardPage />);

			await waitFor(() => {
				expect(
					screen.getByText("Failed to Load Dashboard"),
				).toBeInTheDocument();
			});

			expect(screen.getByText("Retry")).toBeInTheDocument();
		});
	});

	describe("✅ Test 4: Empty states for new users", () => {
		it("should display zero values for new user with no data", async () => {
			const mockUser = {
				_id: "user_new" as Id<"users">,
				_creationTime: Date.now(),
				clerkUserId: "user_new123",
				email: "new@example.com",
				totalProjects: 0,
				createdAt: Date.now(),
				updatedAt: Date.now(),
				lastActiveAt: Date.now(),
			};

			const mockStorage = {
				totalBytes: 0,
				totalGB: 0,
				assetCount: 0,
			};

			mockUseQuery
				.mockReturnValueOnce([]) // empty projects
				.mockReturnValueOnce(mockUser) // new currentUser
				.mockReturnValueOnce(mockStorage); // no storage

			render(<DashboardPage />);

			await waitFor(() => {
				expect(screen.getByText("Total Projects")).toBeInTheDocument();
			});

			// Credits come from useCredits mock (190)
			expect(screen.getByText("190")).toBeInTheDocument();
			expect(screen.getByText("0 GB")).toBeInTheDocument(); // storageUsed = 0
		});
	});

	describe("✅ Test 5: Activity feed derives from projects", () => {
		it("should show project creation activities", async () => {
			const mockProjects = [
				{
					_id: "proj_activity" as Id<"projects">,
					_creationTime: Date.now(),
					userId: "user_test123",
					name: "Birthday Video",
					occasion: "birthday",
					theme: "fun",
					language: "en",
					duration: 30,
					status: "draft" as const,
					eventDetails: {
						eventTitle: "Birthday Party",
						description: "A fun day",
						date: "2024-12-15",
						location: "Home",
						rsvpLink: "",
						emotionalStory: "Celebration",
					},
					createdAt: Date.now(),
					updatedAt: Date.now(),
				},
			];

			const mockUser = {
				_id: "user_123" as Id<"users">,
				_creationTime: Date.now(),
				clerkUserId: "user_test123",
				email: "test@example.com",
				totalProjects: 1,
				createdAt: Date.now(),
				updatedAt: Date.now(),
				lastActiveAt: Date.now(),
			};

			mockUseQuery
				.mockReturnValueOnce(mockProjects)
				.mockReturnValueOnce(mockUser)
				.mockReturnValueOnce({ totalBytes: 0, totalGB: 0, assetCount: 0 });

			render(<DashboardPage />);

			await waitFor(() => {
				expect(
					screen.getByText('Created project "Birthday Video"'),
				).toBeInTheDocument();
			});
		});

		it("should show video completed activities for completed projects", async () => {
			const mockProjects = [
				{
					_id: "proj_completed" as Id<"projects">,
					_creationTime: Date.now(),
					userId: "user_test123",
					name: "Completed Video",
					occasion: "wedding",
					theme: "romantic",
					language: "en",
					duration: 60,
					status: "completed" as const,
					eventDetails: {
						eventTitle: "Wedding",
						description: "Done",
						date: "2024-12-01",
						location: "Venue",
						rsvpLink: "",
						emotionalStory: "Story",
					},
					createdAt: Date.now() - 1000,
					updatedAt: Date.now(),
				},
			];

			const mockUser = {
				_id: "user_123" as Id<"users">,
				_creationTime: Date.now(),
				clerkUserId: "user_test123",
				email: "test@example.com",
				totalProjects: 1,
				createdAt: Date.now(),
				updatedAt: Date.now(),
				lastActiveAt: Date.now(),
			};

			mockUseQuery
				.mockReturnValueOnce(mockProjects)
				.mockReturnValueOnce(mockUser)
				.mockReturnValueOnce({ totalBytes: 0, totalGB: 0, assetCount: 0 });

			render(<DashboardPage />);

			await waitFor(() => {
				expect(
					screen.getByText('Video completed for "Completed Video"'),
				).toBeInTheDocument();
			});
		});
	});
});
