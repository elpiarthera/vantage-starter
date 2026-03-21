"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import Link from "next/link";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import { useUserSync } from "@/components/UserSyncProvider";
import { api } from "@/convex/_generated/api";
import { useCredits } from "@/hooks/business-logic/useCredits";
import { cn } from "@/lib/utils";

// ── Status badge ──────────────────────────────────────────────────────────────

function SessionStatusBadge({ status }: { status: string }) {
	return (
		<span
			className={cn(
				"text-xs px-2 py-0.5 border shrink-0 font-medium",
				status === "active"
					? "border-[oklch(0.62_0.18_240)]/40 text-[oklch(0.62_0.18_240)] bg-[oklch(0.62_0.18_240)]/8"
					: "border-border text-muted-foreground bg-transparent",
			)}
		>
			{status}
		</span>
	);
}

// ── Credit metric card ────────────────────────────────────────────────────────

function CreditCard_({
	balance,
	isLoading,
}: {
	balance: number;
	isLoading: boolean;
}) {
	return (
		<div className="card-elevated border border-border p-6 flex items-center justify-between gap-6">
			<div className="flex items-center gap-4">
				<div className="icon-container shrink-0" aria-hidden="true">
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
						className="text-muted-foreground"
						aria-hidden="true"
					>
						<rect x="2" y="5" width="20" height="14" rx="2" />
						<path d="M2 10h20" />
					</svg>
				</div>
				<div>
					<p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.06em]">
						Credit balance
					</p>
					<p className="text-xs text-muted-foreground/70 mt-0.5">
						Architect sessions &amp; AI ops
					</p>
				</div>
			</div>
			{isLoading ? (
				<div className="animate-pulse bg-muted rounded h-8 w-16" />
			) : (
				<span className="font-heading font-bold text-3xl text-foreground tabular-nums tracking-[-0.03em]">
					{balance}
				</span>
			)}
		</div>
	);
}

// ── Architect CTA card ────────────────────────────────────────────────────────

function ArchitectCTA() {
	return (
		<div className="card-elevated border border-border p-6 flex items-start justify-between gap-6">
			<div className="flex items-start gap-4">
				<div className="icon-container shrink-0 mt-0.5" aria-hidden="true">
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
						className="text-[oklch(0.62_0.18_240)]"
						aria-hidden="true"
					>
						<path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
						<path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75L19 15z" />
						<path d="M5 3l.5 1.5L7 5l-1.5.5L5 7l-.5-1.5L3 5l1.5-.5L5 3z" />
					</svg>
				</div>
				<div className="space-y-1">
					<h2 className="font-heading font-semibold text-foreground tracking-[-0.03em]">
						Start with the Architect
					</h2>
					<p className="text-sm text-muted-foreground leading-relaxed">
						Describe what you want to build. The Architect decomposes it into
						missions and orchestrates your agent team.
					</p>
				</div>
			</div>
			<Link href="/dashboard/architect" className="shrink-0">
				<ui-button
					variant="primary"
					size="sm"
					class="btn-shadow active-scale rounded-full font-medium"
				>
					Open Architect
				</ui-button>
			</Link>
		</div>
	);
}

// ── Recent sessions ───────────────────────────────────────────────────────────

interface Session {
	_id: string;
	_creationTime: number;
	title?: string | null;
	status: string;
}

function SessionRow({ session }: { session: Session }) {
	return (
		<Link
			href={`/dashboard/architect?session=${session._id}`}
			className="group flex items-center justify-between px-6 py-4 hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			style={{
				transitionDuration: "150ms",
				transitionTimingFunction: "var(--ease-out-expo)",
			}}
		>
			<div className="min-w-0 flex-1">
				<p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors duration-150">
					{session.title ?? "Untitled session"}
				</p>
				<p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
					{new Date(session._creationTime).toLocaleDateString("en-GB", {
						day: "numeric",
						month: "short",
						year: "numeric",
					})}
				</p>
			</div>
			<SessionStatusBadge status={session.status} />
		</Link>
	);
}

function SessionsEmptyState() {
	return (
		<div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
			<div className="icon-container" aria-hidden="true">
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.5"
					className="text-muted-foreground"
					aria-hidden="true"
				>
					<path d="M12 2L2 7l10 5 10-5-10-5z" />
					<path d="M2 17l10 5 10-5" />
					<path d="M2 12l10 5 10-5" />
				</svg>
			</div>
			<div className="space-y-1">
				<p className="text-sm font-medium text-foreground tracking-[-0.015em]">
					No sessions yet
				</p>
				<p className="text-xs text-muted-foreground">
					Your Architect sessions will appear here.
				</p>
			</div>
			<Link
				href="/dashboard/architect"
				className="text-xs text-primary hover:underline underline-offset-4 transition-colors duration-150"
			>
				Start your first session
			</Link>
		</div>
	);
}

function RecentSessions({ sessions }: { sessions: Session[] }) {
	return (
		<div className="border border-border">
			<div className="px-6 py-4 border-b border-border flex items-center justify-between">
				<h2 className="font-heading font-semibold text-sm text-foreground tracking-[-0.015em]">
					Recent sessions
				</h2>
				{sessions.length > 0 && (
					<Link
						href="/dashboard/architect"
						className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
					>
						View all
					</Link>
				)}
			</div>
			<div className="divide-y divide-border">
				{sessions.length === 0 ? (
					<SessionsEmptyState />
				) : (
					sessions.map((session) => (
						<SessionRow key={session._id} session={session} />
					))
				)}
			</div>
		</div>
	);
}

// ── Page ──────────────────────────────────────────────────────────────────────

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
			<div className="max-w-6xl mx-auto px-6 lg:px-12 py-8 space-y-4 animate-in fade-in duration-300">
				<div className="animate-pulse bg-muted rounded h-24" />
				<div className="animate-pulse bg-muted rounded h-24" />
				<div className="animate-pulse bg-muted rounded h-56" />
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
		<div className="max-w-6xl mx-auto px-6 lg:px-12 py-8 space-y-4 animate-in fade-in duration-300">
			<CreditCard_ balance={creditsRemaining} isLoading={creditsLoading} />
			<ArchitectCTA />
			<RecentSessions sessions={sessions} />
		</div>
	);
}
