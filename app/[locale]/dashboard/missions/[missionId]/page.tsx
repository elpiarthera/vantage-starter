"use client";

import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import {
	AlertTriangle,
	ArrowLeft,
	Bot,
	CheckCircle2,
	Circle,
	Clock,
	Flag,
	Loader2,
	User,
	XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

// ── Status configs ────────────────────────────────────────────────────────────

type MissionStatus =
	| "pending"
	| "executing"
	| "awaiting_checkpoint"
	| "completed"
	| "failed";

type OperationStatus =
	| "pending"
	| "blocked"
	| "in_progress"
	| "awaiting_review"
	| "completed"
	| "failed";

type CheckpointStatus = "pending" | "approved" | "rejected";

const MISSION_STATUS: Record<
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

const OPERATION_STATUS: Record<
	OperationStatus,
	{ label: string; className: string; icon: React.FC<{ className?: string }> }
> = {
	pending: {
		label: "Pending",
		className: "bg-muted text-muted-foreground border-transparent",
		icon: Circle,
	},
	blocked: {
		label: "Blocked",
		className: "bg-amber-500/15 text-amber-400 border-transparent",
		icon: Clock,
	},
	in_progress: {
		label: "In progress",
		className: "bg-blue-500/15 text-blue-400 border-transparent",
		icon: Loader2,
	},
	awaiting_review: {
		label: "Awaiting review",
		className: "bg-purple-500/15 text-purple-400 border-transparent",
		icon: Flag,
	},
	completed: {
		label: "Completed",
		className: "bg-green-500/15 text-green-400 border-transparent",
		icon: CheckCircle2,
	},
	failed: {
		label: "Failed",
		className: "bg-red-500/15 text-red-400 border-transparent",
		icon: XCircle,
	},
};

// ── Operation item ─────────────────────────────────────────────────────────────

interface OperationItemProps {
	operation: {
		_id: Id<"operations">;
		name: string;
		type: "ai" | "human";
		status: OperationStatus;
		assignedAgentId?: Id<"agents">;
		dependsOn?: Id<"operations">[];
		output?: string;
		description?: string;
	};
	agentName?: string;
	dependencyNames: string[];
}

function OperationItem({
	operation,
	agentName,
	dependencyNames,
}: OperationItemProps) {
	const statusConfig =
		OPERATION_STATUS[operation.status] ?? OPERATION_STATUS.pending;
	const StatusIcon = statusConfig.icon;
	const isCompleted = operation.status === "completed";

	return (
		<div
			className={cn(
				"flex gap-3 py-3 px-4 border-l-2 transition-colors duration-150",
				isCompleted ? "border-l-green-500/40" : "border-l-border",
			)}
		>
			{/* Type icon */}
			<div className="shrink-0 mt-0.5">
				{operation.type === "ai" ? (
					<Bot className="size-4 text-muted-foreground" aria-hidden="true" />
				) : (
					<User className="size-4 text-muted-foreground" aria-hidden="true" />
				)}
			</div>

			{/* Content */}
			<div className="flex-1 min-w-0 space-y-1.5">
				<div className="flex items-start justify-between gap-2 flex-wrap">
					<span
						className={cn(
							"text-sm font-medium leading-snug",
							isCompleted
								? "text-muted-foreground line-through"
								: "text-foreground",
						)}
					>
						{operation.name}
					</span>
					<Badge className={cn("text-xs shrink-0", statusConfig.className)}>
						<StatusIcon
							className="size-3 mr-1 inline-block"
							aria-hidden="true"
						/>
						{statusConfig.label}
					</Badge>
				</div>

				{/* Assigned agent */}
				{agentName && (
					<p className="text-xs text-muted-foreground">Assigned: {agentName}</p>
				)}

				{/* Dependencies */}
				{dependencyNames.length > 0 && (
					<p className="text-xs text-muted-foreground">
						Waiting on:{" "}
						{dependencyNames.map((name, i) => (
							<span key={name}>
								{i > 0 && ", "}
								<span className="text-amber-400">{name}</span>
							</span>
						))}
					</p>
				)}

				{/* Output preview */}
				{operation.output && (
					<p className="text-xs text-muted-foreground bg-muted/50 px-2 py-1.5 rounded-sm line-clamp-2">
						{operation.output.slice(0, 200)}
						{operation.output.length > 200 && "…"}
					</p>
				)}
			</div>
		</div>
	);
}

// ── Checkpoint gate ───────────────────────────────────────────────────────────

interface CheckpointGateProps {
	checkpoint: {
		_id: Id<"checkpoints">;
		description: string;
		status: CheckpointStatus;
		approvedBy?: string;
		approvedAt?: number;
		rejectionReason?: string;
	};
}

function CheckpointGate({ checkpoint }: CheckpointGateProps) {
	const approve = useMutation(api.checkpoints.approve);
	const reject = useMutation(api.checkpoints.reject);
	const [rejectReason, setRejectReason] = useState("");
	const [isApproving, setIsApproving] = useState(false);
	const [isRejecting, setIsRejecting] = useState(false);

	const handleApprove = async () => {
		setIsApproving(true);
		try {
			await approve({ checkpointId: checkpoint._id });
		} finally {
			setIsApproving(false);
		}
	};

	const handleReject = async () => {
		setIsRejecting(true);
		try {
			await reject({
				checkpointId: checkpoint._id,
				rejectionReason: rejectReason || undefined,
			});
		} finally {
			setIsRejecting(false);
		}
	};

	const statusColors: Record<CheckpointStatus, string> = {
		pending: "border-amber-500/40 bg-amber-500/5",
		approved: "border-green-500/40 bg-green-500/5",
		rejected: "border-red-500/40 bg-red-500/5",
	};

	return (
		<section
			className={cn(
				"mx-4 my-2 border px-4 py-3 rounded-none",
				statusColors[checkpoint.status],
			)}
			aria-label={`Checkpoint: ${checkpoint.description}`}
		>
			<div className="flex items-start justify-between gap-3 flex-wrap">
				<div className="space-y-0.5 min-w-0">
					<div className="flex items-center gap-2">
						<Flag
							className="size-3.5 text-amber-400 shrink-0"
							aria-hidden="true"
						/>
						<span className="text-xs font-semibold text-foreground uppercase tracking-wide">
							Checkpoint
						</span>
						<Badge
							className={cn(
								"text-xs",
								checkpoint.status === "pending" &&
									"bg-amber-500/15 text-amber-400 border-transparent",
								checkpoint.status === "approved" &&
									"bg-green-500/15 text-green-400 border-transparent",
								checkpoint.status === "rejected" &&
									"bg-red-500/15 text-red-400 border-transparent",
							)}
						>
							{checkpoint.status}
						</Badge>
					</div>
					<p className="text-sm text-muted-foreground">
						{checkpoint.description}
					</p>
					{checkpoint.approvedAt && (
						<p className="text-xs text-muted-foreground">
							Approved{" "}
							{formatDistanceToNow(checkpoint.approvedAt, { addSuffix: true })}
						</p>
					)}
					{checkpoint.rejectionReason && (
						<p className="text-xs text-red-400">
							Reason: {checkpoint.rejectionReason}
						</p>
					)}
				</div>

				{checkpoint.status === "pending" && (
					<div className="flex items-center gap-2 shrink-0">
						<Button
							size="sm"
							onClick={handleApprove}
							disabled={isApproving || isRejecting}
							className="rounded-full h-8 px-4 text-xs"
						>
							{isApproving ? (
								<Loader2
									className="size-3 animate-spin mr-1.5"
									aria-hidden="true"
								/>
							) : (
								<CheckCircle2 className="size-3 mr-1.5" aria-hidden="true" />
							)}
							Approve
						</Button>

						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button
									size="sm"
									variant="destructive"
									disabled={isApproving || isRejecting}
									className="rounded-full h-8 px-4 text-xs"
								>
									{isRejecting ? (
										<Loader2
											className="size-3 animate-spin mr-1.5"
											aria-hidden="true"
										/>
									) : (
										<XCircle className="size-3 mr-1.5" aria-hidden="true" />
									)}
									Reject
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle className="font-[Space_Grotesk,sans-serif]">
										Reject this checkpoint?
									</AlertDialogTitle>
									<AlertDialogDescription>
										This will permanently fail the mission. There is no undo.
										All downstream operations will be cancelled.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<div className="px-6 pb-4">
									<label
										className="text-xs text-muted-foreground block mb-1.5"
										htmlFor="reject-reason"
									>
										Reason (optional)
									</label>
									<textarea
										id="reject-reason"
										className="w-full text-sm bg-muted border border-border rounded-md px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none h-20"
										placeholder="Why are you rejecting this checkpoint?"
										value={rejectReason}
										onChange={(e) => setRejectReason(e.target.value)}
									/>
								</div>
								<AlertDialogFooter>
									<AlertDialogCancel className="rounded-full">
										Cancel
									</AlertDialogCancel>
									<AlertDialogAction
										onClick={handleReject}
										className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
									>
										Permanently fail mission
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</div>
				)}
			</div>
		</section>
	);
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function DetailSkeleton() {
	return (
		<div className="max-w-6xl mx-auto px-6 lg:px-12 py-10 space-y-8">
			<div className="flex items-center gap-2">
				<Skeleton className="h-4 w-4" />
				<Skeleton className="h-4 w-24" />
			</div>
			<div className="space-y-3">
				<div className="flex items-center gap-3">
					<Skeleton className="h-7 w-64" />
					<Skeleton className="h-5 w-24 rounded-full" />
				</div>
				<Skeleton className="h-2 w-full" />
			</div>
			<div className="space-y-2">
				{[1, 2, 3, 4].map((i) => (
					<Skeleton key={i} className="h-16 w-full" />
				))}
			</div>
		</div>
	);
}

// ── Main detail component ─────────────────────────────────────────────────────

interface MissionDetailProps {
	missionId: Id<"missions">;
	locale: string;
}

function MissionDetail({ missionId, locale }: MissionDetailProps) {
	const mission = useQuery(api.missions.get, { id: missionId });
	const operations = useQuery(api.operations.listByMission, { missionId });
	const checkpoints = useQuery(api.checkpoints.listByMission, { missionId });
	const stats = useQuery(api.operations.getStatsByMission, { missionId });

	const isLoading =
		mission === undefined ||
		operations === undefined ||
		checkpoints === undefined ||
		stats === undefined;

	if (isLoading) return <DetailSkeleton />;

	if (!mission) {
		return (
			<div className="max-w-6xl mx-auto px-6 lg:px-12 py-10">
				<div className="flex flex-col items-center justify-center py-24 text-center">
					<AlertTriangle
						className="size-8 text-muted-foreground mb-4"
						aria-hidden="true"
					/>
					<h1 className="text-lg font-semibold text-foreground font-[Space_Grotesk,sans-serif] mb-2">
						Mission not found
					</h1>
					<p className="text-sm text-muted-foreground mb-6">
						This mission may have been deleted or you don't have access.
					</p>
					<Button asChild variant="outline" className="rounded-full">
						<Link href={`/${locale}/dashboard/missions`}>Back to missions</Link>
					</Button>
				</div>
			</div>
		);
	}

	const missionStatus = mission.status as MissionStatus;
	const statusConfig = MISSION_STATUS[missionStatus] ?? MISSION_STATUS.pending;
	const progress = stats?.progress ?? mission.progress ?? 0;

	// Build a map of operationId → operation name for dependency display
	const opNameMap = new Map<string, string>();
	for (const op of operations) {
		opNameMap.set(op._id, op.name);
	}

	// Build a set of checkpoint afterOperationIds for inline placement
	const checkpointByOpId = new Map<string, (typeof checkpoints)[number]>();
	for (const cp of checkpoints) {
		checkpointByOpId.set(cp.afterOperationId, cp);
	}

	// We won't fetch agent names in this MVP (no agents query without workspaceId).
	// Show agentId last 8 chars as fallback until agent list is available.

	return (
		<div className="max-w-6xl mx-auto px-6 lg:px-12 py-10 space-y-8">
			{/* Back link */}
			<Link
				href={`/${locale}/dashboard/missions`}
				className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
			>
				<ArrowLeft className="size-3.5" aria-hidden="true" />
				All missions
			</Link>

			{/* Mission header */}
			<header className="space-y-4">
				<div className="flex items-start justify-between gap-3 flex-wrap">
					<h1 className="text-2xl font-bold tracking-tight text-foreground font-[Space_Grotesk,sans-serif]">
						{mission.name}
					</h1>
					<Badge
						className={cn(
							"text-xs font-medium shrink-0",
							statusConfig.className,
						)}
					>
						{statusConfig.label}
					</Badge>
				</div>

				{/* Progress */}
				<div className="space-y-1.5">
					<div className="flex items-center justify-between text-xs text-muted-foreground">
						<span>
							{stats.completed}/{stats.total} operations completed
						</span>
						<span>{progress}%</span>
					</div>
					<Progress value={progress} className="h-1.5" />
				</div>

				{/* Meta */}
				{(mission.brief || mission.objective) && (
					<div className="space-y-2 pt-1">
						{mission.brief && (
							<p className="text-sm text-muted-foreground leading-relaxed">
								{mission.brief}
							</p>
						)}
						{mission.objective && (
							<p className="text-sm text-foreground/70 italic">
								Objective: {mission.objective}
							</p>
						)}
					</div>
				)}

				{/* Success criteria */}
				{mission.successCriteria && mission.successCriteria.length > 0 && (
					<div className="space-y-1.5 pt-1">
						<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
							Success criteria
						</p>
						<ul className="space-y-1">
							{mission.successCriteria.map((criterion) => (
								<li
									key={criterion}
									className="flex items-start gap-2 text-sm text-muted-foreground"
								>
									<CheckCircle2
										className="size-3.5 mt-0.5 shrink-0 text-muted-foreground/50"
										aria-hidden="true"
									/>
									{criterion}
								</li>
							))}
						</ul>
					</div>
				)}
			</header>

			{/* Operations + checkpoints */}
			<section aria-label="Operations">
				<h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
					Operations
				</h2>

				{operations.length === 0 ? (
					<div className="py-8 text-center text-sm text-muted-foreground border border-border">
						No operations in this mission.
					</div>
				) : (
					<div className="border border-border divide-y divide-border">
						<ScrollArea className="max-h-[60vh]">
							{operations.map((op) => {
								const depNames = (op.dependsOn ?? [])
									.map((id) => opNameMap.get(id) ?? id.slice(-6))
									.filter(Boolean);

								// Agent display name: fallback to last 8 chars of ID
								const agentDisplay = op.assignedAgentId
									? `Agent …${op.assignedAgentId.slice(-6)}`
									: undefined;

								return (
									<div key={op._id}>
										<OperationItem
											operation={op as OperationItemProps["operation"]}
											agentName={agentDisplay}
											dependencyNames={depNames}
										/>
										{/* Render checkpoint after this operation if one exists */}
										{checkpointByOpId.has(op._id) && (
											<CheckpointGate
												checkpoint={
													// biome-ignore lint/style/noNonNullAssertion: guarded by .has() check above
													checkpointByOpId.get(
														op._id,
													)! as CheckpointGateProps["checkpoint"]
												}
											/>
										)}
									</div>
								);
							})}
						</ScrollArea>
					</div>
				)}
			</section>

			{/* Created timestamp */}
			<footer className="text-xs text-muted-foreground">
				Created {formatDistanceToNow(mission.createdAt, { addSuffix: true })}
			</footer>
		</div>
	);
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MissionDetailPage() {
	const params = useParams();
	const locale = typeof params?.locale === "string" ? params.locale : "en";
	const missionId =
		typeof params?.missionId === "string" ? params.missionId : "";

	return (
		<MissionDetail missionId={missionId as Id<"missions">} locale={locale} />
	);
}
