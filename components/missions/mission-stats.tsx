"use client";

import { useQuery } from "convex/react";
import { AlertTriangle, CheckCircle, Cog, Target } from "lucide-react";
import { useTranslations } from "next-intl";
import { StatCardItem } from "@/components/ui/stat-card";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

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
			? "bg-success/5 border-success/20"
			: trend === "down"
				? "bg-destructive/5 border-destructive/20"
				: "bg-card border-border";

	const changeClass =
		trend === "up"
			? "text-success"
			: trend === "down"
				? "text-destructive"
				: "text-muted-foreground";

	return (
		<StatCardItem
			stat={{ trend }}
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
		</StatCardItem>
	);
}

function StatCardSkeleton() {
	return (
		<StatCardItem stat={{}} className="flex-1 min-w-0 space-y-4 animate-pulse">
			<div className="h-4 w-24 rounded bg-muted" />
			<div className="h-10 w-16 rounded bg-muted" />
			<div className="h-3 w-32 rounded bg-muted" />
		</StatCardItem>
	);
}

interface MissionStatsProps {
	workspaceId: Id<"workspaces">;
}

export function MissionStats({ workspaceId }: MissionStatsProps) {
	const t = useTranslations("missions.stats");
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
						icon={<Target className="size-[18px] text-muted-foreground" />}
						title={t("total")}
						value={stats.total}
						comparison={t("in_workspace")}
						trend="neutral"
					/>
					<StatCard
						icon={<Cog className="size-[18px] text-muted-foreground" />}
						title={t("in_progress")}
						value={inProgress}
						comparison={t("executing_or_awaiting")}
						trend={inProgressTrend}
						change={
							inProgress > 0
								? t("active_count", { count: inProgress })
								: undefined
						}
					/>
					<StatCard
						icon={<CheckCircle className="size-[18px] text-muted-foreground" />}
						title={t("completed")}
						value={completed}
						comparison={t("missions_done")}
						trend={completedTrend}
						change={
							completed > 0 ? t("done_count", { count: completed }) : undefined
						}
					/>
					<StatCard
						icon={
							<AlertTriangle className="size-[18px] text-muted-foreground" />
						}
						title={t("needs_attention")}
						value={needsAttention}
						comparison={t("urgent_or_failed")}
						trend={needsAttentionTrend}
						change={
							needsAttention > 0
								? t("urgent_count", { count: needsAttention })
								: undefined
						}
					/>
				</div>
			</div>
		</div>
	);
}
