"use client";

import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Doc } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import type { MissionFilterState } from "./mission-filters";

type MissionStatus =
	| "pending"
	| "executing"
	| "awaiting_checkpoint"
	| "completed"
	| "failed";

// Inline status badge styles replacing cva + missionStatusBadge from lib/status-variants
const STATUS_BADGE_CLASSES: Record<MissionStatus, string> = {
	pending:
		"inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground",
	executing:
		"inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-warning/10 text-warning",
	awaiting_checkpoint:
		"inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary",
	completed:
		"inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-success/10 text-success",
	failed:
		"inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-destructive/10 text-destructive",
};

const PRIORITY_COLORS: Record<string, string> = {
	urgent: "text-destructive",
	high: "text-warning",
	medium: "text-primary",
	low: "text-muted-foreground",
};

// Inline SVGs replacing lucide-react
function IconFlag({ className }: { className?: string }) {
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
			<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
			<line x1="4" x2="4" y1="22" y2="15" />
		</svg>
	);
}

function IconCalendar({ className }: { className?: string }) {
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
			<rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
			<line x1="16" x2="16" y1="2" y2="6" />
			<line x1="8" x2="8" y1="2" y2="6" />
			<line x1="3" x2="21" y1="10" y2="10" />
		</svg>
	);
}

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

function IconChevronRight({ className }: { className?: string }) {
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
			<path d="m9 18 6-6-6-6" />
		</svg>
	);
}

interface MissionListViewProps {
	missions: Doc<"missions">[];
	filters: MissionFilterState;
	onMissionClick?: (missionId: Doc<"missions">["_id"]) => void;
}

export function MissionListView({
	missions,
	filters,
	onMissionClick,
}: MissionListViewProps) {
	const t = useTranslations("missions.list_view");
	const router = useRouter();

	// Apply filters
	const filteredMissions = missions.filter((mission) => {
		// Status filter — cast to MissionStatus since schema enforces the enum
		if (
			filters.statuses.length > 0 &&
			!filters.statuses.includes(mission.status as MissionStatus)
		) {
			return false;
		}
		// Priority filter
		if (
			filters.priorities.length > 0 &&
			!filters.priorities.includes(
				(mission.priority ?? "medium") as "urgent" | "high" | "medium" | "low",
			)
		) {
			return false;
		}
		return true;
	});

	const handleClick = (missionId: Doc<"missions">["_id"]) => {
		if (onMissionClick) {
			onMissionClick(missionId);
		} else {
			router.push(`/missions/${missionId}`);
		}
	};

	if (filteredMissions.length === 0) {
		return (
			<div className="flex flex-1 items-center justify-center text-muted-foreground py-12">
				{t("empty")}
			</div>
		);
	}

	return (
		<div className="flex-1 overflow-auto">
			<div className="divide-y divide-border">
				{filteredMissions.map((mission) => {
					const status = mission.status as MissionStatus;
					const priority = mission.priority ?? "medium";

					return (
						<button
							key={mission._id}
							type="button"
							className="flex w-full items-center gap-4 px-4 py-3 lg:px-6 hover:bg-accent cursor-pointer transition-colors rounded-lg min-h-[60px] text-left"
							onClick={() => handleClick(mission._id)}
						>
							{/* Status badge */}
							<span
								className={cn(
									STATUS_BADGE_CLASSES[status] ?? STATUS_BADGE_CLASSES.pending,
								)}
							>
								{t(`status_${status}`)}
							</span>

							{/* Name & description */}
							<div className="flex-1 min-w-0">
								<p className="font-medium truncate text-foreground">
									{mission.name}
								</p>
								{mission.description && (
									<p className="text-sm text-muted-foreground truncate">
										{mission.description}
									</p>
								)}
							</div>

							{/* Priority */}
							<div
								className={cn(
									"hidden sm:flex items-center gap-1",
									PRIORITY_COLORS[priority] ?? "text-muted-foreground",
								)}
							>
								<IconFlag className="size-4" />
								<span className="text-xs capitalize">{priority}</span>
							</div>

							{/* Target date */}
							{mission.targetDate && (
								<div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
									<IconCalendar className="size-4" />
									<span>
										{formatDistanceToNow(new Date(mission.targetDate), {
											addSuffix: true,
										})}
									</span>
								</div>
							)}

							{/* Progress */}
							{mission.progress !== undefined && mission.progress > 0 && (
								<div className="hidden lg:flex items-center gap-1 text-xs text-muted-foreground">
									<IconTarget className="size-4" />
									<span>{mission.progress}%</span>
								</div>
							)}

							{/* Arrow */}
							<IconChevronRight className="size-4 text-muted-foreground shrink-0" />
						</button>
					);
				})}
			</div>
		</div>
	);
}
