"use client";

import { useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface SessionListProps {
	workspaceId: Id<"workspaces">;
	activeSessionId: string | null;
	onSessionSelect: (sessionId: string) => void;
	onNewSession: () => void;
}

function formatRelativeTime(timestamp: number): string {
	const now = Date.now();
	const diff = now - timestamp;
	const minutes = Math.floor(diff / 60_000);
	const hours = Math.floor(diff / 3_600_000);
	const days = Math.floor(diff / 86_400_000);

	if (minutes < 1) return "Just now";
	if (minutes < 60) return `${minutes}m ago`;
	if (hours < 24) return `${hours}h ago`;
	if (days < 7) return `${days}d ago`;
	return new Date(timestamp).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	});
}

function StatusDot({ status }: { status: string }) {
	return (
		<span
			className={cn(
				"shrink-0 w-1.5 h-1.5 rounded-full mt-1.5",
				status === "active" && "bg-[oklch(0.62_0.18_240)]",
				status === "completed" && "bg-[oklch(0.65_0.01_240)]",
				status === "abandoned" && "bg-[oklch(0.65_0.2_25)]",
			)}
			title={status}
			aria-hidden="true"
		/>
	);
}

export function SessionList({
	workspaceId,
	activeSessionId,
	onSessionSelect,
	onNewSession,
}: SessionListProps) {
	const result = useQuery(api.architectSessions.listRecent, { workspaceId });
	const sessions = result?.sessions ?? [];
	const loading = result === undefined;

	return (
		<div className="flex flex-col h-full">
			{/* Header */}
			<div className="px-4 py-4 border-b border-border">
				<div className="flex items-center justify-between mb-1">
					<h2 className="font-space-grotesk text-xs font-semibold text-[oklch(0.65_0.01_240)] uppercase tracking-wider">
						Sessions
					</h2>
				</div>
				<Button
					onClick={onNewSession}
					className="w-full rounded-full text-sm h-9 font-medium"
					size="sm"
					aria-label="Start a new Architect session"
				>
					New session
				</Button>
			</div>

			{/* Session list */}
			<ScrollArea className="flex-1">
				<div className="py-2">
					{loading ? (
						<div className="space-y-1 px-2">
							{["sk-1", "sk-2", "sk-3", "sk-4"].map((skKey) => (
								<div
									key={skKey}
									className="h-14 bg-[oklch(0.17_0.01_240)] animate-pulse"
									aria-hidden="true"
								/>
							))}
						</div>
					) : sessions.length === 0 ? (
						<div className="px-4 py-8 text-center">
							<p className="text-xs text-[oklch(0.65_0.01_240)] leading-relaxed">
								No sessions yet.
								<br />
								Start one above.
							</p>
						</div>
					) : (
						<ul className="px-2 space-y-0.5">
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
												"w-full text-left px-3 py-2.5 flex items-start gap-2",
												"transition-colors duration-100",
												"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.62_0.18_240)]",
												isActive
													? "bg-[oklch(0.17_0.01_240)] border-l-2 border-[oklch(0.62_0.18_240)]"
													: "hover:bg-[oklch(0.17_0.01_240)] border-l-2 border-transparent",
											)}
											aria-current={isActive ? "true" : undefined}
										>
											<StatusDot status={session.status} />
											<div className="flex-1 min-w-0">
												<p
													className={cn(
														"text-xs font-medium truncate leading-snug",
														isActive
															? "text-[oklch(0.93_0.01_240)]"
															: "text-[oklch(0.65_0.01_240)]",
													)}
												>
													{title}
												</p>
												<p className="text-xs text-[oklch(0.65_0.01_240)]/60 tabular-nums mt-0.5">
													{formatRelativeTime(session.createdAt)}
												</p>
											</div>
										</button>
									</li>
								);
							})}
						</ul>
					)}
				</div>
			</ScrollArea>
		</div>
	);
}
