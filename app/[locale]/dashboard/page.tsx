"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { CreditCard, Sparkles } from "lucide-react";
import Link from "next/link";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import { useUserSync } from "@/components/UserSyncProvider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { useCredits } from "@/hooks/business-logic/useCredits";

export default function DashboardPage() {
	const { isUserSynced, isSyncing } = useUserSync();
	const { user } = useUser();

	const { balance: creditsRemaining, isLoading: creditsLoading } = useCredits(
		user?.id || "",
	);

	const currentUser = useQuery(
		api.users.getCurrentUser,
		isUserSynced ? undefined : "skip",
	);

	const workspaces = useQuery(
		api.workspaces.list,
		isUserSynced ? undefined : "skip",
	);

	const workspaceId = workspaces?.[0]?._id;

	const recentSessions = useQuery(
		api.architectSessions.listRecent,
		workspaceId ? { workspaceId, limit: 5 } : "skip",
	);

	const isLoading =
		isSyncing ||
		!isUserSynced ||
		currentUser === undefined ||
		creditsLoading ||
		workspaces === undefined;

	const hasError = currentUser === null;

	const handleRetry = () => {
		window.location.reload();
	};

	if (isLoading) {
		return (
			<div className="max-w-6xl mx-auto px-6 lg:px-12 py-8 space-y-6 animate-in fade-in duration-300">
				<Skeleton className="h-28" />
				<Skeleton className="h-40" />
				<Skeleton className="h-48" />
			</div>
		);
	}

	if (hasError) {
		return (
			<div className="max-w-6xl mx-auto px-6 lg:px-12 py-8 animate-in fade-in duration-300">
				<ErrorState
					title="Failed to Load Dashboard"
					description="Unable to load dashboard data. Please try again."
					actionLabel="Retry"
					onAction={handleRetry}
				/>
			</div>
		);
	}

	const sessions = recentSessions?.sessions ?? [];

	return (
		<div className="max-w-6xl mx-auto px-6 lg:px-12 py-8 space-y-6 animate-in fade-in duration-300">
			{/* Credit balance */}
			<div className="border border-border p-6 flex items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<CreditCard
						className="size-5 text-muted-foreground shrink-0"
						aria-hidden="true"
					/>
					<div>
						<p className="text-sm font-medium text-foreground">
							Credit balance
						</p>
						<p className="text-xs text-muted-foreground mt-0.5">
							Used for Architect sessions and AI operations
						</p>
					</div>
				</div>
				<span className="font-heading font-bold text-2xl text-foreground tabular-nums">
					{creditsRemaining}
				</span>
			</div>

			{/* Architect CTA */}
			<div className="border border-border p-6 space-y-4">
				<div className="flex items-start justify-between gap-4">
					<div className="space-y-1">
						<h2 className="font-heading font-semibold text-base text-foreground">
							Start with the Architect
						</h2>
						<p className="text-sm text-muted-foreground">
							Describe what you want to build. The Architect decomposes it into
							missions and orchestrates your agent team.
						</p>
					</div>
					<Link href="/dashboard/architect" className="shrink-0">
						<Button size="sm" className="rounded-full gap-2">
							<Sparkles className="size-4" aria-hidden="true" />
							Open Architect
						</Button>
					</Link>
				</div>
			</div>

			{/* Recent Architect sessions */}
			<div className="border border-border">
				<div className="px-6 py-4 border-b border-border">
					<h2 className="font-heading font-semibold text-base text-foreground">
						Recent sessions
					</h2>
				</div>
				<div className="divide-y divide-border">
					{sessions.length === 0 ? (
						<div className="px-6 py-8 text-center">
							<p className="text-sm text-muted-foreground">
								No sessions yet.{" "}
								<Link
									href="/dashboard/architect"
									className="text-primary hover:underline underline-offset-4"
								>
									Start your first session
								</Link>
							</p>
						</div>
					) : (
						sessions.map((session) => (
							<Link
								key={session._id}
								href={`/dashboard/architect?session=${session._id}`}
								className="flex items-center justify-between px-6 py-4 hover:bg-accent/40 transition-colors duration-150 group"
							>
								<div className="min-w-0 flex-1">
									<p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors duration-150">
										{session.title ?? "Untitled session"}
									</p>
									<p className="text-xs text-muted-foreground mt-0.5">
										{new Date(session._creationTime).toLocaleDateString(
											"en-GB",
											{
												day: "numeric",
												month: "short",
												year: "numeric",
											},
										)}
									</p>
								</div>
								<span
									className={`text-xs px-2 py-0.5 border shrink-0 ml-4 ${
										session.status === "active"
											? "border-primary text-primary"
											: "border-border text-muted-foreground"
									}`}
								>
									{session.status}
								</span>
							</Link>
						))
					)}
				</div>
			</div>
		</div>
	);
}
