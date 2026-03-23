"use client";

import { useState } from "react";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { MissionCard } from "./mission-card";

type MissionStatus =
	| "pending"
	| "executing"
	| "awaiting_checkpoint"
	| "completed"
	| "failed";

const STATUS_LABELS: Record<MissionStatus, string> = {
	pending: "Pending",
	executing: "Executing",
	awaiting_checkpoint: "Awaiting Checkpoint",
	completed: "Completed",
	failed: "Failed",
};

const STATUS_HEADER_CLASSES: Record<MissionStatus, string> = {
	pending: "bg-muted text-muted-foreground",
	executing: "bg-warning/10 text-warning",
	awaiting_checkpoint: "bg-primary/10 text-primary",
	completed: "bg-success/10 text-success",
	failed: "bg-destructive/10 text-destructive",
};

function StatusIcon({ status }: { status: MissionStatus }) {
	if (status === "pending") {
		return (
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
				<circle cx="12" cy="12" r="10" />
				<polyline points="12 6 12 12 16 14" />
			</svg>
		);
	}
	if (status === "executing") {
		return (
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
				<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
			</svg>
		);
	}
	if (status === "awaiting_checkpoint") {
		return (
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
				<circle cx="11" cy="11" r="8" />
				<path d="m21 21-4.3-4.3" />
			</svg>
		);
	}
	if (status === "completed") {
		return (
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
				<circle cx="12" cy="12" r="10" />
				<path d="m9 12 2 2 4-4" />
			</svg>
		);
	}
	return (
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
			<circle cx="12" cy="12" r="10" />
			<path d="m15 9-6 6" />
			<path d="m9 9 6 6" />
		</svg>
	);
}

interface MissionColumnProps {
	status: MissionStatus;
	missions: Doc<"missions">[];
	onMissionClick?: (missionId: Doc<"missions">["_id"]) => void;
	draggingId: Id<"missions"> | null;
	onDragStart: (id: Id<"missions">) => void;
	onDragEnd: () => void;
	onDrop: (missionId: Id<"missions">) => void;
}

export function MissionColumn({
	status,
	missions,
	onMissionClick,
	draggingId,
	onDragStart,
	onDragEnd,
	onDrop,
}: MissionColumnProps) {
	const [isDragOver, setIsDragOver] = useState(false);

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragOver(true);
	};

	const handleDragLeave = () => {
		setIsDragOver(false);
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragOver(false);
		const missionId = e.dataTransfer.getData(
			"text/mission-id",
		) as Id<"missions">;
		if (missionId) {
			onDrop(missionId);
		}
	};

	return (
		<section
			aria-label={`${STATUS_LABELS[status]} column`}
			className={cn(
				"flex flex-col min-w-[280px] max-w-[320px] shrink-0 rounded-xl transition-colors",
				isDragOver && "bg-muted/50 ring-2 ring-primary/20",
			)}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
		>
			<div
				className={cn(
					"flex items-center gap-2 px-3 py-2 rounded-lg mb-3",
					STATUS_HEADER_CLASSES[status],
				)}
			>
				<StatusIcon status={status} />
				<span className="text-xs font-medium uppercase tracking-wider">
					{STATUS_LABELS[status]}
				</span>
				<span className="ml-auto text-xs font-medium bg-background/50 px-1.5 py-0.5 rounded-full">
					{missions.length}
				</span>
			</div>

			<ul className="flex flex-col gap-3 flex-1 overflow-y-auto pb-4 min-h-[120px]">
				{missions.map((mission) => (
					<DraggableMissionCard
						key={mission._id}
						mission={mission}
						isDragging={draggingId === mission._id}
						onDragStart={() => onDragStart(mission._id)}
						onDragEnd={onDragEnd}
						onClick={
							onMissionClick ? () => onMissionClick(mission._id) : undefined
						}
					/>
				))}

				{missions.length === 0 && (
					<div
						className={cn(
							"flex items-center justify-center h-24 border border-dashed border-border rounded-lg text-xs text-muted-foreground transition-colors",
							isDragOver && "border-primary bg-primary/5",
						)}
					>
						{isDragOver ? "Drop here" : "No missions"}
					</div>
				)}
			</ul>
		</section>
	);
}

interface DraggableMissionCardProps {
	mission: Doc<"missions">;
	isDragging: boolean;
	onDragStart: () => void;
	onDragEnd: () => void;
	onClick?: () => void;
}

function DraggableMissionCard({
	mission,
	isDragging,
	onDragStart,
	onDragEnd,
	onClick,
}: DraggableMissionCardProps) {
	const handleDragStart = (e: React.DragEvent<HTMLLIElement>) => {
		e.dataTransfer.setData("text/mission-id", mission._id);
		e.dataTransfer.effectAllowed = "move";
		onDragStart();
	};

	return (
		<li
			draggable
			className={cn(
				"transition-all",
				isDragging ? "cursor-grabbing opacity-50 scale-[0.98]" : "cursor-grab",
			)}
			onDragStart={handleDragStart}
			onDragEnd={onDragEnd}
		>
			<MissionCard mission={mission} onClick={onClick} />
		</li>
	);
}
