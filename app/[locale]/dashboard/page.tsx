"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { ActivityFeed } from "@/components/dashboard/home/ActivityFeed";
import { QuickActions } from "@/components/dashboard/home/QuickActions";
import { RecentProjects } from "@/components/dashboard/home/RecentProjects";
import { WelcomeHeader } from "@/components/dashboard/home/WelcomeHeader";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import { useUserSync } from "@/components/UserSyncProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { useCredits } from "@/hooks/business-logic/useCredits";

export default function DashboardPage() {
	// Wait for user to be synced to Convex before querying
	const { isUserSynced, isSyncing } = useUserSync();
	const { user } = useUser();

	// Get real credit balance from Convex
	const { balance: creditsRemaining, isLoading: creditsLoading } = useCredits(
		user?.id || "",
	);

	// Only fetch data after user is synced (prevents "Not authenticated" error)
	const currentUser = useQuery(
		api.users.getCurrentUser,
		isUserSynced ? undefined : "skip",
	);
	const storageUsage = useQuery(
		api.assets.getUserStorageUsage,
		isUserSynced ? undefined : "skip",
	);

	// Loading state: Still syncing user OR queries are undefined
	const isLoading =
		isSyncing ||
		!isUserSynced ||
		currentUser === undefined ||
		creditsLoading ||
		storageUsage === undefined;

	// Error state: null means query failed
	const hasError = currentUser === null || storageUsage === null;

	const handleRetry = () => {
		window.location.reload();
	};

	if (isLoading) {
		return (
			<div className="container mx-auto px-4 md:px-6 py-6 md:py-10 space-y-6 md:space-y-8 animate-in fade-in duration-300">
				{/* Welcome Header Skeleton */}
				<div className="space-y-4 md:space-y-6">
					<div className="text-center md:text-left">
						<Skeleton className="h-8 w-64 mx-auto md:mx-0 mb-2" />
						<Skeleton className="h-4 w-48 mx-auto md:mx-0" />
					</div>
					{/* Quick Stats Skeleton */}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
						{[1, 2, 3, 4].map((i) => (
							<Skeleton key={i} className="h-24 md:h-32" />
						))}
					</div>
				</div>

				{/* Quick Actions Skeleton */}
				<Skeleton className="h-48" />

				{/* Recent Projects Skeleton */}
				<Skeleton className="h-64" />

				{/* Activity Feed Skeleton */}
				<Skeleton className="h-64" />
			</div>
		);
	}

	if (hasError) {
		return (
			<div className="container mx-auto px-4 md:px-6 py-6 md:py-10 animate-in fade-in duration-300">
				<ErrorState
					title="Failed to Load Dashboard"
					description="Unable to load dashboard data. Please try again."
					actionLabel="Retry"
					onAction={handleRetry}
				/>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 md:px-6 py-6 md:py-10 space-y-6 md:space-y-8 animate-in fade-in duration-300">
			<WelcomeHeader
				creditsRemaining={creditsRemaining}
				storageUsed={storageUsage || { totalGB: 0 }}
			/>
			<QuickActions />
			<RecentProjects />
			<ActivityFeed />
		</div>
	);
}
