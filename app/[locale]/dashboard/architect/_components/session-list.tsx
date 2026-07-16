"use client";

import { useQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface SessionListProps {
	workspaceId: Id<"workspaces">;
	activeSessionId: string | null;
	onSessionSelect: (sessionId: string) => void;
	onNewSession: () => void;
}

type RelativeTimeMessages = {
	justNow: string;
	minutesAgo: (minutes: number) => string;
	hoursAgo: (hours: number) => string;
	daysAgo: (days: number) => string;
};

export function formatRelativeTime(
	timestamp: number,
	locale: string,
	messages: RelativeTimeMessages,
): string {
	const now = Date.now();
	const diff = now - timestamp;
	const minutes = Math.floor(diff / 60_000);
	const hours = Math.floor(diff / 3_600_000);
	const days = Math.floor(diff / 86_400_000);

	if (minutes < 1) return messages.justNow;
	if (minutes < 60) return messages.minutesAgo(minutes);
	if (hours < 24) return messages.hoursAgo(hours);
	if (days < 7) return messages.daysAgo(days);
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
	const t = useTranslations("architect");
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
				{t("no_sessions_yet")}
				<br />
				{t("start_one_above")}
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
	const t = useTranslations("architect");
	const result = useQuery(api.architectSessions.listRecent, { workspaceId });
	const sessions = result?.sessions ?? [];
	const loading = result === undefined;

	const relativeTimeMessages = {
		justNow: t("just_now"),
		minutesAgo: (minutes: number) => t("minutes_ago", { minutes }),
		hoursAgo: (hours: number) => t("hours_ago", { hours }),
		daysAgo: (days: number) => t("days_ago", { days }),
	};

	return (
		<div className="flex flex-col gap-4">
			{/* Header */}
			<div className="space-y-3">
				<p className="text-xs font-medium text-muted-foreground">
					{t("sessions_title")}
				</p>
				<button
					type="button"
					onClick={onNewSession}
					className="btn-shadow w-full rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					aria-label={t("start_new_session_aria")}
				>
					{t("new_session")}
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
									? t("plan_prefix", {
											name: session.missionContext.missionName,
										})
									: t("new_session"));

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
												{formatRelativeTime(
													session.createdAt,
													locale,
													relativeTimeMessages,
												)}
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
