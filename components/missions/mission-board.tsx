"use client";

import { useMutation } from "convex/react";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { MissionColumn } from "./mission-column";

type MissionStatus =
	| "pending"
	| "executing"
	| "awaiting_checkpoint"
	| "completed"
	| "failed";

const STATUS_ORDER: MissionStatus[] = [
	"pending",
	"executing",
	"awaiting_checkpoint",
	"completed",
	"failed",
];

interface MissionBoardProps {
	missions: Doc<"missions">[];
	onMissionClick?: (missionId: Doc<"missions">["_id"]) => void;
}

export function MissionBoard({ missions, onMissionClick }: MissionBoardProps) {
	const [items, setItems] = useState<Doc<"missions">[]>(missions);
	const [draggingId, setDraggingId] = useState<Id<"missions"> | null>(null);

	const updateStatus = useMutation(api.missions.updateStatus);

	useEffect(() => {
		setItems(missions);
	}, [missions]);

	const missionsByStatus = useMemo(() => {
		const m = new Map<MissionStatus, Doc<"missions">[]>();
		for (const s of STATUS_ORDER) m.set(s, []);
		for (const mission of items) {
			m.get(mission.status as MissionStatus)?.push(mission);
		}
		return m;
	}, [items]);

	const handleDrop = async (
		status: MissionStatus,
		missionId: Id<"missions">,
	) => {
		setItems((prev) =>
			prev.map((m) => (m._id === missionId ? { ...m, status } : m)),
		);
		setDraggingId(null);

		try {
			await updateStatus({ id: missionId, status });
		} catch (error) {
			console.error("Failed to update mission status:", error);
		}
	};

	return (
		<div className="flex gap-4 h-full overflow-x-auto pb-4 px-4 md:px-6">
			{STATUS_ORDER.map((status) => (
				<MissionColumn
					key={status}
					status={status}
					missions={missionsByStatus.get(status) ?? []}
					onMissionClick={onMissionClick}
					draggingId={draggingId}
					onDragStart={setDraggingId}
					onDragEnd={() => setDraggingId(null)}
					onDrop={(missionId) => handleDrop(status, missionId)}
				/>
			))}
		</div>
	);
}
