"use client";

import { useQuery } from "convex/react";
import { useLocale } from "next-intl";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface SessionListProps {
	workspaceId: Id<"workspaces">;
	activeSessionId: string | null;
	onSessionSelect: (sessionId: string) => void;
	onNewSession: () => void;
}

export function formatRelativeTime(timestamp: number, locale: string): string {
	const now = Date.now();
	const diff = now - timestamp;
	const minutes = Math.floor(diff / 60_000);
	const hours = Math.floor(diff / 3_600_000);
	const days = Math.floor(diff / 86_400_000);

	if (minutes < 1) return "Just now";
	if (minutes < 60) return `${minutes}m ago`;
	if (hours < 24) return `${hours}h ago`;
	if (days < 7) return `${days}d ago`;
	return new Intl.DateTimeFormat(locale, {
		month: "short",
		day: "numeric",
	}).format(new Date(timestamp));
}

function StatusDot({ status }: { status: string }) {
	return (
		<span
			className={cn(
				"shrink-0 w-1.5 h-1.5 rounded-full mt-2",
				status === "active" && "bg-[oklch(0.62_0.18_240)]",
				status === "completed" && "bg-muted-foreground/50",
				status === "abandoned" && "bg-[oklch(0.65_0.2_25)]/70",
			)}
			title={status}
			aria-hidden="true"
		/>
	);
}

function SessionsEmptyState() {
	return (
		<div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
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
					<rect x="2" y="3" width="20" height="14" rx="2" />
					<path d="M8 21h8M12 17v4" />
				</svg>
			</div>
			<p className="text-xs text-muted-foreground leading-relaxed">
				No sessions yet.
				<br />
				Start one above.
			</p>
		</div>
	);
}

export function SessionList({
	workspaceId,
	activeSessionId,
	onSessionSelect,
	onNewSession,
}: SessionListProps) {
	const locale = useLocale();
	const result = useQuery(api.architectSessions.listRecent, { workspaceId });
	const sessions = result?.sessions ?? [];
	const loading = result === undefined;

	return (
		<div className="flex flex-col gap-4">
			{/* Header */}
			<div className="space-y-3">
				<p className="text-xs font-medium text-muted-foreground">Sessions</p>
				<button
					type="button"
					onClick={onNewSession}
					className="btn-shadow w-full rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					aria-label="Start a new Architect session"
				>
					New session
				</button>
			</div>

			{/* Session list */}
			<div className="overflow-y-auto">
				{loading ? (
					<div className="space-y-2">
						{["sk-1", "sk-2", "sk-3", "sk-4"].map((skKey) => (
							<div
								key={skKey}
								className="h-16 bg-muted/40 animate-pulse rounded-xl"
								aria-hidden="true"
							/>
						))}
					</div>
				) : sessions.length === 0 ? (
					<SessionsEmptyState />
				) : (
					<ul className="space-y-2">
						{sessions.map((session) => {
							const isActive = session._id === activeSessionId;
							const title =
								session.title ??
								(session.missionContext?.missionName
									? `Plan: ${session.missionContext.missionName}`
									: "New session");

							return (
								<li key={session._id}>
									<button
										type="button"
										onClick={() => onSessionSelect(session._id)}
										className={cn(
											"w-full text-left px-4 py-3 flex items-start gap-2.5 rounded-xl border",
											"transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
											isActive
												? "bg-primary/10 border-primary/30"
												: "bg-card border-border hover:bg-accent",
										)}
										style={{
											transitionDuration: "150ms",
											transitionTimingFunction: "var(--ease-out-expo)",
										}}
										aria-current={isActive ? "true" : undefined}
									>
										<StatusDot status={session.status} />
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium text-foreground truncate leading-snug">
												{title}
											</p>
											<p className="text-xs text-muted-foreground tabular-nums mt-0.5">
												{formatRelativeTime(session.createdAt, locale)}
											</p>
										</div>
									</button>
								</li>
							);
						})}
					</ul>
				)}
			</div>
		</div>
	);
}
