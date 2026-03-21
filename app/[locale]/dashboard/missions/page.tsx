"use client";

import { useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { Layers, Target } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

// ── Status badge config ───────────────────────────────────────────────────────

type MissionStatus =
	| "pending"
	| "executing"
	| "awaiting_checkpoint"
	| "completed"
	| "failed";

const STATUS_CONFIG: Record<
	MissionStatus,
	{ label: string; className: string }
> = {
	pending: {
		label: "Pending",
		className: "border-transparent bg-muted text-muted-foreground",
	},
	executing: {
		label: "Executing",
		className: "border-transparent bg-blue-500/15 text-blue-400",
	},
	awaiting_checkpoint: {
		label: "Awaiting checkpoint",
		className: "border-transparent bg-amber-500/15 text-amber-400",
	},
	completed: {
		label: "Completed",
		className: "border-transparent bg-green-500/15 text-green-400",
	},
	failed: {
		label: "Failed",
		className: "border-transparent bg-red-500/15 text-red-400",
	},
};

function MissionStatusBadge({ status }: { status: MissionStatus }) {
	const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
	return (
		<Badge className={cn("text-xs font-medium rounded-full", config.className)}>
			{config.label}
		</Badge>
	);
}

// ── Mission card ──────────────────────────────────────────────────────────────

interface MissionCardProps {
	mission: {
		_id: Id<"missions">;
		name: string;
		status: MissionStatus;
		progress?: number;
		createdAt: number;
		description?: string;
	};
	operationCount: number;
	locale: string;
}

function MissionCard({ mission, operationCount, locale }: MissionCardProps) {
	const progress = mission.progress ?? 0;

	return (
		<Link
			href={`/${locale}/dashboard/missions/${mission._id}`}
			className="group card-elevated block border border-border bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			aria-label={`View mission: ${mission.name}`}
		>
			<div className="p-6 space-y-4">
				{/* Header row */}
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						<h2 className="font-heading font-semibold text-foreground truncate text-base tracking-[-0.03em] leading-snug group-hover:text-primary transition-colors duration-150">
							{mission.name}
						</h2>
						{mission.description && (
							<p className="mt-1 text-sm text-muted-foreground line-clamp-1">
								{mission.description}
							</p>
						)}
					</div>
					<MissionStatusBadge status={mission.status} />
				</div>

				{/* Progress bar */}
				<div className="space-y-1.5">
					<div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
						<span>{operationCount} operations</span>
						<span>{progress}%</span>
					</div>
					<Progress value={progress} className="h-1" />
				</div>

				{/* Footer */}
				<div className="flex items-center justify-between text-xs text-muted-foreground">
					<span>
						Created{" "}
						{formatDistanceToNow(mission.createdAt, { addSuffix: true })}
					</span>
				</div>
			</div>
		</Link>
	);
}

// ── Skeletons ──────────────────────────────────────────────────────────────────

function MissionCardSkeleton() {
	return (
		<div className="border border-border bg-card p-6 space-y-4">
			<div className="flex items-start justify-between gap-3">
				<div className="space-y-2 flex-1 min-w-0">
					<Skeleton className="h-5 w-3/4" />
					<Skeleton className="h-4 w-1/2" />
				</div>
				<Skeleton className="h-5 w-20 rounded-full shrink-0" />
			</div>
			<div className="space-y-1.5">
				<div className="flex justify-between">
					<Skeleton className="h-3 w-24" />
					<Skeleton className="h-3 w-8" />
				</div>
				<Skeleton className="h-1 w-full" />
			</div>
			<Skeleton className="h-3 w-32" />
		</div>
	);
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
	return (
		<div className="flex flex-col items-center justify-center py-24 px-6 text-center gap-6 border border-dashed border-border">
			<div className="flex flex-col items-center gap-4">
				<div className="icon-container" aria-hidden="true">
					<Target className="size-4 text-muted-foreground" />
				</div>
				<div className="space-y-1">
					<h2 className="text-sm font-semibold text-foreground font-heading tracking-[-0.03em]">
						No missions yet
					</h2>
					<p className="text-sm text-muted-foreground max-w-xs">
						Use the Architect to plan and commit your first mission.
					</p>
				</div>
			</div>
			<Link href="/dashboard/architect">
				<Button
					size="sm"
					className="btn-shadow active-scale rounded-full gap-2 font-medium"
					aria-label="Go to Architect to create a mission"
				>
					<Layers className="size-3.5" aria-hidden="true" />
					Open Architect
				</Button>
			</Link>
		</div>
	);
}

// ── Missions list ─────────────────────────────────────────────────────────────

function MissionsList({ locale }: { locale: string }) {
	const workspaces = useQuery(api.workspaces.list);
	const workspaceId = workspaces?.[0]?._id;

	const missions = useQuery(
		api.missions.listByWorkspace,
		workspaceId ? { workspaceId } : "skip",
	);

	const operationCounts = useQuery(
		api.operations.listAll,
		workspaceId ? { workspaceId } : "skip",
	);

	const isLoading =
		workspaces === undefined ||
		missions === undefined ||
		operationCounts === undefined;

	if (isLoading) {
		return (
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{["sk-1", "sk-2", "sk-3", "sk-4"].map((id) => (
					<MissionCardSkeleton key={id} />
				))}
			</div>
		);
	}

	if (!workspaceId) {
		return (
			<div className="flex flex-col items-center justify-center py-24 px-6 text-center gap-4 border border-dashed border-border">
				<div className="icon-container" aria-hidden="true">
					<Target className="size-4 text-muted-foreground" />
				</div>
				<p className="text-sm text-muted-foreground">
					No workspace found. Create a workspace first.
				</p>
			</div>
		);
	}

	if (missions.length === 0) {
		return <EmptyState />;
	}

	const countMap = new Map<string, number>();
	for (const op of operationCounts) {
		const count = countMap.get(op.missionId) ?? 0;
		countMap.set(op.missionId, count + 1);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			{missions.map((mission) => (
				<MissionCard
					key={mission._id}
					mission={mission as MissionCardProps["mission"]}
					operationCount={countMap.get(mission._id) ?? 0}
					locale={locale}
				/>
			))}
		</div>
	);
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MissionsPage() {
	const params = useParams();
	const locale = typeof params?.locale === "string" ? params.locale : "en";

	return (
		<div className="max-w-6xl mx-auto px-6 lg:px-12 py-10">
			<header className="mb-8">
				<h1 className="font-heading text-2xl font-bold tracking-[-0.03em] text-foreground">
					Missions
				</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Committed plans and their execution status.
				</p>
			</header>

			<MissionsList locale={locale} />
		</div>
	);
}
