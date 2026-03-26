"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

// Inline SVGs replacing lucide-react icons
function IconTarget({ className }: { className?: string }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="10" />
			<circle cx="12" cy="12" r="6" />
			<circle cx="12" cy="12" r="2" />
		</svg>
	);
}

function IconCog({ className }: { className?: string }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			aria-hidden="true"
		>
			<path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
			<path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
			<path d="M12 2v2" />
			<path d="M12 22v-2" />
			<path d="m17 20.66-1-1.73" />
			<path d="M11 10.27 7 3.34" />
			<path d="m20.66 17-1.73-1" />
			<path d="m3.34 7 1.73 1" />
			<path d="M14 12h8" />
			<path d="M2 12h2" />
			<path d="m20.66 7-1.73 1" />
			<path d="m3.34 17 1.73-1" />
			<path d="m17 3.34-1 1.73" />
			<path d="m11 13.73-4 6.93" />
		</svg>
	);
}

function IconCheckCircle({ className }: { className?: string }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="10" />
			<path d="m9 12 2 2 4-4" />
		</svg>
	);
}

function IconAlertTriangle({ className }: { className?: string }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			aria-hidden="true"
		>
			<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
			<path d="M12 9v4" />
			<path d="M12 17h.01" />
		</svg>
	);
}

type Trend = "up" | "down" | "neutral";

interface StatCardProps {
	icon: React.ReactNode;
	title: string;
	value: number;
	change?: string;
	comparison: string;
	trend: Trend;
	className?: string;
}

function StatCard({
	icon,
	title,
	value,
	change,
	comparison,
	trend,
	className,
}: StatCardProps) {
	const containerClass =
		trend === "up"
			? "bg-success/5 border border-success/20"
			: trend === "down"
				? "bg-destructive/5 border border-destructive/20"
				: "bg-card border border-border";

	const changeClass =
		trend === "up"
			? "text-success"
			: trend === "down"
				? "text-destructive"
				: "text-muted-foreground";

	return (
		<div
			className={cn(
				"flex-1 min-w-0 space-y-4 rounded-xl p-4",
				containerClass,
				className,
			)}
		>
			<div className="flex items-center gap-1.5">
				{icon}
				<span className="text-xs text-muted-foreground">{title}</span>
			</div>
			<p className="text-4xl font-bold text-foreground">{value}</p>
			<div className="flex items-center gap-2 text-xs">
				{change && (
					<>
						<span className={cn("font-medium", changeClass)}>{change}</span>
						<span className="size-1 rounded-full bg-muted-foreground" />
					</>
				)}
				<span className="text-muted-foreground">{comparison}</span>
			</div>
		</div>
	);
}

function StatCardSkeleton() {
	return (
		<div className="flex-1 min-w-0 space-y-4 animate-pulse">
			<div className="h-4 w-24 rounded bg-muted" />
			<div className="h-10 w-16 rounded bg-muted" />
			<div className="h-3 w-32 rounded bg-muted" />
		</div>
	);
}

interface MissionStatsProps {
	workspaceId: Id<"workspaces">;
}

export function MissionStats({ workspaceId }: MissionStatsProps) {
	const stats = useQuery(api.missions.getStats, { workspaceId });

	if (stats === undefined) {
		return (
			<div className="pt-4 sm:pt-6 px-4 sm:px-6 flex items-center justify-center w-full">
				<div className="rounded-xl border border-border p-4 sm:p-6 w-full">
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
						<StatCardSkeleton />
						<StatCardSkeleton />
						<StatCardSkeleton />
						<StatCardSkeleton />
					</div>
				</div>
			</div>
		);
	}

	const inProgress =
		(stats.byStatus.executing ?? 0) + (stats.byStatus.awaiting_checkpoint ?? 0);
	const completed = stats.byStatus.completed ?? 0;
	const failed = stats.byStatus.failed ?? 0;
	const needsAttention = (stats.byPriority.urgent ?? 0) + failed;

	const inProgressTrend: Trend = inProgress > 0 ? "up" : "neutral";
	const completedTrend: Trend = completed > 0 ? "up" : "neutral";
	const needsAttentionTrend: Trend = needsAttention > 0 ? "down" : "neutral";

	return (
		<div className="pt-4 sm:pt-6 px-4 sm:px-6 flex items-center justify-center w-full">
			<div className="rounded-xl border border-border p-4 sm:p-6 w-full">
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
					<StatCard
						icon={<IconTarget className="size-[18px] text-muted-foreground" />}
						title="Total Missions"
						value={stats.total}
						comparison="in workspace"
						trend="neutral"
					/>
					<StatCard
						icon={<IconCog className="size-[18px] text-muted-foreground" />}
						title="In Progress"
						value={inProgress}
						comparison="executing or awaiting checkpoint"
						trend={inProgressTrend}
						change={inProgress > 0 ? `${inProgress} active` : undefined}
					/>
					<StatCard
						icon={
							<IconCheckCircle className="size-[18px] text-muted-foreground" />
						}
						title="Completed"
						value={completed}
						comparison="missions done"
						trend={completedTrend}
						change={completed > 0 ? `${completed} done` : undefined}
					/>
					<StatCard
						icon={
							<IconAlertTriangle className="size-[18px] text-muted-foreground" />
						}
						title="Needs Attention"
						value={needsAttention}
						comparison="urgent or failed"
						trend={needsAttentionTrend}
						change={needsAttention > 0 ? `${needsAttention} urgent` : undefined}
					/>
				</div>
			</div>
		</div>
	);
}
