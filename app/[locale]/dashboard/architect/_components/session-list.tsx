"use client";

import { useMutation, useQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
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
	const updateTitle = useMutation(api.architectSessions.updateTitle);
	const [renamingId, setRenamingId] = useState<Id<"architectSessions"> | null>(
		null,
	);
	const [renameValue, setRenameValue] = useState("");

	function startRenaming(sessionId: Id<"architectSessions">, title: string) {
		setRenamingId(sessionId);
		setRenameValue(title);
	}

	async function commitRename(sessionId: Id<"architectSessions">) {
		const trimmed = renameValue.trim();
		setRenamingId(null);
		if (trimmed.length === 0) return;
		await updateTitle({ sessionId, title: trimmed });
	}

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

							const isRenaming = renamingId === session._id;

							return (
								<li key={session._id}>
									<div
										className={cn(
											"px-4 py-3 flex items-start gap-2.5 rounded-xl border",
											"transition-colors",
											isActive
												? "bg-primary/10 border-primary/30"
												: "bg-card border-border hover:bg-accent",
										)}
										style={{
											transitionDuration: "150ms",
											transitionTimingFunction: "var(--ease-out-expo)",
										}}
									>
										<StatusDot status={session.status} />
										{isRenaming ? (
											<input
												type="text"
												value={renameValue}
												onChange={(e) => setRenameValue(e.target.value)}
												onBlur={() => commitRename(session._id)}
												onKeyDown={(e) => {
													if (e.key === "Enter") {
														e.currentTarget.blur();
													} else if (e.key === "Escape") {
														setRenamingId(null);
													}
												}}
												ref={(el) => el?.focus()}
												aria-label={t("rename_session_aria")}
												className="flex-1 min-w-0 rounded-md border border-primary bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
											/>
										) : (
											<button
												type="button"
												onClick={() => onSessionSelect(session._id)}
												className="flex-1 min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
												aria-current={isActive ? "true" : undefined}
											>
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
											</button>
										)}
										{!isRenaming && (
											<button
												type="button"
												onClick={() =>
													startRenaming(session._id, session.title ?? "")
												}
												aria-label={t("rename_session_aria")}
												className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													width="14"
													height="14"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth="2"
													strokeLinecap="round"
													strokeLinejoin="round"
													aria-hidden="true"
												>
													<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
													<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
												</svg>
											</button>
										)}
									</div>
								</li>
							);
						})}
					</ul>
				)}
			</div>
		</div>
	);
}
