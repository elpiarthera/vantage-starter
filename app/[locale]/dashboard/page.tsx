"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { useFormatter, useTranslations } from "next-intl";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import { useUserSync } from "@/components/UserSyncProvider";
import { api } from "@/convex/_generated/api";
import { useCredits } from "@/hooks/business-logic/useCredits";
import { Link } from "@/i18n/routing";
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
	const t = useTranslations("dashboard");
	return (
		<div className="card-elevated bg-card border border-border rounded-xl p-6 flex items-center justify-between gap-6">
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
						{t("credit_balance_label")}
					</p>
					<p className="text-xs text-muted-foreground/70 mt-0.5">
						{t("credit_balance_subtitle")}
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
	const t = useTranslations("dashboard");
	return (
		<div className="card-elevated bg-card border border-border rounded-xl p-6 flex items-start justify-between gap-6">
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
						{t("architect_cta_title")}
					</h2>
					<p className="text-sm text-muted-foreground leading-relaxed">
						{t("architect_cta_description")}
					</p>
				</div>
			</div>
			<Link href="/dashboard/architect" className="shrink-0">
				<ui-button
					variant="primary"
					size="sm"
					class="btn-shadow active-scale rounded-full font-medium"
				>
					{t("open_architect")}
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
	const t = useTranslations("dashboard");
	const format = useFormatter();
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
					{session.title ?? t("untitled_session")}
				</p>
				<p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
					{format.dateTime(new Date(session._creationTime), {
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
	const t = useTranslations("dashboard");
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
					{t("no_sessions_title")}
				</p>
				<p className="text-xs text-muted-foreground">
					{t("no_sessions_description")}
				</p>
			</div>
			<Link
				href="/dashboard/architect"
				className="text-xs text-primary hover:underline underline-offset-4 transition-colors duration-150"
			>
				{t("start_first_session")}
			</Link>
		</div>
	);
}

function RecentSessions({ sessions }: { sessions: Session[] }) {
	const t = useTranslations("dashboard");
	return (
		<div className="bg-card border border-border rounded-xl overflow-hidden">
			<div className="px-6 py-4 border-b border-border flex items-center justify-between">
				<h2 className="font-heading font-semibold text-sm text-foreground tracking-[-0.015em]">
					{t("recent_sessions_title")}
				</h2>
				{sessions.length > 0 && (
					<Link
						href="/dashboard/architect"
						className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
					>
						{t("recent_sessions_view_all")}
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
	const t = useTranslations("dashboard");
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
					title={t("error_title")}
					description={t("error_description")}
					actionLabel={t("retry")}
					onAction={handleRetry}
				/>
			</div>
		);
	}

	const sessions = recentSessions?.sessions ?? [];

	return (
		<div className="max-w-6xl mx-auto p-6 md:p-8 space-y-6 animate-in fade-in duration-300">
			<CreditCard_ balance={creditsRemaining} isLoading={creditsLoading} />
			<ArchitectCTA />
			<RecentSessions sessions={sessions} />
		</div>
	);
}
