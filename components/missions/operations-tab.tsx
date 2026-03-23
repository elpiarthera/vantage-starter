"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { CreateOperationModal } from "./create-operation-modal";
import { OperationDetailSheet } from "./operation-detail-sheet";

// Status dot colors — inline, no external dependency
const STATUS_DOT: Record<string, string> = {
	pending: "bg-[oklch(0.65_0.01_232)]",
	blocked: "bg-[oklch(0.55_0.18_25)]",
	in_progress: "bg-[oklch(0.6_0.15_232)]",
	awaiting_review: "bg-[oklch(0.72_0.15_85)]",
	completed: "bg-[oklch(0.62_0.15_145)]",
	failed: "bg-[oklch(0.5_0.2_25)]",
};

interface OperationsTabProps {
	missionId: Id<"missions">;
	operationStats:
		| {
				total: number;
				completed: number;
				inProgress: number;
				failed: number;
				pending: number;
				progress: number;
				byStatus: Record<string, number>;
				byType: Record<string, number>;
		  }
		| null
		| undefined;
}

export function OperationsTab({
	missionId,
	operationStats,
}: OperationsTabProps) {
	const operations = useQuery(api.operations.listByMission, { missionId });

	if (operations === undefined) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="animate-pulse text-muted-foreground text-sm">
					Loading operations...
				</div>
			</div>
		);
	}

	if (!operations || operations.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
					{/* list-todo icon */}
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="text-muted-foreground"
						aria-hidden="true"
					>
						<rect x="3" y="5" width="6" height="6" rx="1" />
						<path d="m3 17 2 2 4-4" />
						<path d="M13 6h8" />
						<path d="M13 12h8" />
						<path d="M13 18h8" />
					</svg>
				</div>
				<h3 className="text-lg font-medium mb-2">No operations yet</h3>
				<p className="text-sm text-muted-foreground mb-6 max-w-[280px]">
					Operations are the tasks that make up this mission. Add them manually
					or use the Architect to generate a plan automatically.
				</p>
				<div className="flex flex-col gap-3 w-full max-w-[280px]">
					<CreateOperationModal missionId={missionId} />
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<p className="text-sm text-muted-foreground">
					{operationStats?.completed ?? 0} of {operationStats?.total ?? 0}{" "}
					complete
				</p>
				<CreateOperationModal missionId={missionId} />
			</div>

			<div className="space-y-2">
				{operations.map((op) => (
					<OperationCard key={op._id} operation={op} />
				))}
			</div>
		</div>
	);
}

function OperationCard({ operation }: { operation: Doc<"operations"> }) {
	const [isDetailOpen, setIsDetailOpen] = useState(false);
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const removeOperation = useMutation(api.operations.remove);

	const typeLabels: Record<string, string> = {
		ai: "AI Task",
		human: "Human Task",
	};

	const handleDelete = async () => {
		try {
			await removeOperation({ id: operation._id });
			toast.success("Operation deleted");
		} catch (error) {
			toast.error("Failed to delete operation");
			console.error(error);
		}
	};

	const statusDotClass = STATUS_DOT[operation.status] ?? "bg-muted-foreground";

	return (
		<>
			<div
				className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer group relative"
				onClick={() => setIsDetailOpen(true)}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						setIsDetailOpen(true);
					}
				}}
				role="button"
				tabIndex={0}
				aria-label={`View ${operation.name}`}
			>
				{/* Status dot */}
				<span
					className={`h-2 w-2 rounded-full shrink-0 ${statusDotClass}`}
					aria-hidden="true"
				/>

				<div className="flex-1 min-w-0">
					<p className="text-sm font-medium truncate">{operation.name}</p>
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<span>{typeLabels[operation.type] ?? operation.type}</span>
						<span aria-hidden="true">•</span>
						<span className="capitalize">
							{operation.status.replace(/_/g, " ")}
						</span>
					</div>
				</div>

				{/* Priority badge — only non-medium */}
				{operation.priority && operation.priority !== "medium" && (
					<span className="text-xs capitalize px-2 py-0.5 rounded-full border border-border text-muted-foreground">
						{operation.priority}
					</span>
				)}

				{/* Actions menu */}
				<div
					className="relative"
					onClick={(e) => e.stopPropagation()}
					onKeyDown={(e) => e.stopPropagation()}
				>
					<button
						type="button"
						className="h-8 w-8 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
						onClick={(e) => {
							e.stopPropagation();
							setIsMenuOpen((v) => !v);
						}}
						aria-label="Operation actions"
						aria-expanded={isMenuOpen}
					>
						{/* more-horizontal icon */}
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<circle cx="12" cy="12" r="1" />
							<circle cx="19" cy="12" r="1" />
							<circle cx="5" cy="12" r="1" />
						</svg>
					</button>

					{isMenuOpen && (
						<>
							{/* Backdrop */}
							<div
								className="fixed inset-0 z-10"
								onClick={() => setIsMenuOpen(false)}
								aria-hidden="true"
							/>
							<div className="absolute right-0 top-full mt-1 z-20 w-40 rounded-lg border border-border bg-card shadow-lg py-1">
								<button
									type="button"
									className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
									onClick={() => {
										setIsMenuOpen(false);
										setIsDetailOpen(true);
									}}
								>
									{/* eye icon */}
									<svg
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
										<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
										<circle cx="12" cy="12" r="3" />
									</svg>
									View Details
								</button>
								<hr className="border-border my-1" />
								<button
									type="button"
									className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[oklch(0.55_0.18_25)] hover:bg-muted transition-colors"
									onClick={() => {
										setIsMenuOpen(false);
										void handleDelete();
									}}
								>
									{/* trash icon */}
									<svg
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
										<path d="M3 6h18" />
										<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
										<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
									</svg>
									Delete
								</button>
							</div>
						</>
					)}
				</div>
			</div>

			<OperationDetailSheet
				operation={operation}
				open={isDetailOpen}
				onOpenChange={setIsDetailOpen}
				onDelete={handleDelete}
			/>
		</>
	);
}
