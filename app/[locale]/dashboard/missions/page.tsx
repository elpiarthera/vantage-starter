"use client";

import { useQuery } from "convex/react";
import { useState } from "react";
import { MissionBoard } from "@/components/missions/mission-board";
import {
	type MissionFilterState,
	MissionFilters,
} from "@/components/missions/mission-filters";
import { MissionListView } from "@/components/missions/mission-list-view";
import { MissionStats } from "@/components/missions/mission-stats";
import { MissionsEmptyState } from "@/components/missions/missions-empty-state";
import { MissionsHeader } from "@/components/missions/missions-header";
import { ViewOptions, type ViewType } from "@/components/missions/view-options";
import { api } from "@/convex/_generated/api";

export default function MissionsPage() {
	const [filters, setFilters] = useState<MissionFilterState>({
		statuses: [],
		priorities: [],
		showArchived: false,
	});
	const [viewType, setViewType] = useState<ViewType>("board");

	const workspaces = useQuery(api.workspaces.list);
	const workspaceId = workspaces?.[0]?._id;

	const missions = useQuery(
		api.missions.list,
		workspaceId
			? { workspaceId, includeArchived: filters.showArchived }
			: "skip",
	);

	const isLoading = workspaces === undefined || missions === undefined;
	const isEmpty = !isLoading && missions !== undefined && missions.length === 0;

	return (
		<div className="flex flex-col h-full overflow-hidden">
			<MissionsHeader>
				<MissionFilters filters={filters} onFiltersChange={setFilters} />
				<ViewOptions
					viewType={viewType}
					onChange={setViewType}
					allowedViews={["board", "list"]}
				/>
			</MissionsHeader>

			<main className="flex-1 overflow-hidden">
				{isLoading && (
					<div className="flex items-center justify-center h-full">
						<svg
							className="animate-spin size-6 text-[var(--muted-foreground)]"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							role="img"
							aria-label="Loading missions"
						>
							<circle
								className="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								strokeWidth="4"
							/>
							<path
								className="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
							/>
						</svg>
					</div>
				)}

				{!isLoading && isEmpty && <MissionsEmptyState />}

				{!isLoading && !isEmpty && workspaceId && (
					<>
						<MissionStats workspaceId={workspaceId} />
						{viewType === "board" && <MissionBoard missions={missions ?? []} />}
						{viewType === "list" && (
							<MissionListView missions={missions ?? []} filters={filters} />
						)}
					</>
				)}
			</main>
		</div>
	);
}
