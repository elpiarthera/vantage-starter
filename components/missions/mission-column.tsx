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

const STATUS_ICONS: Record<MissionStatus, string> = {
	pending: "🕐",
	executing: "⚡",
	awaiting_checkpoint: "🔍",
	completed: "✅",
	failed: "❌",
};

const STATUS_HEADER_CLASSES: Record<MissionStatus, string> = {
	pending: "bg-blue-500/10 text-blue-500",
	executing: "bg-amber-500/10 text-amber-500",
	awaiting_checkpoint: "bg-purple-500/10 text-purple-500",
	completed: "bg-emerald-500/10 text-emerald-500",
	failed: "bg-red-500/10 text-red-500",
};

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
		<div
			role="region"
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
				<span>{STATUS_ICONS[status]}</span>
				<span className="font-medium text-sm">{STATUS_LABELS[status]}</span>
				<span className="ml-auto text-xs font-medium bg-background/50 px-1.5 py-0.5 rounded">
					{missions.length}
				</span>
			</div>

			<div className="flex flex-col gap-3 flex-1 overflow-y-auto pb-4 min-h-[120px]">
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
			</div>
		</div>
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
	const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
		e.dataTransfer.setData("text/mission-id", mission._id);
		e.dataTransfer.effectAllowed = "move";
		onDragStart();
	};

	return (
		<div
			role="listitem"
			draggable
			className={cn(
				"transition-all",
				isDragging ? "cursor-grabbing opacity-50 scale-[0.98]" : "cursor-grab",
			)}
			onDragStart={handleDragStart}
			onDragEnd={onDragEnd}
		>
			<MissionCard mission={mission} onClick={onClick} />
		</div>
	);
}
