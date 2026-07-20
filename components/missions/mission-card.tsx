"use client";

import { useMutation, useQuery } from "convex/react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { useRouter } from "@/i18n/routing";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

type Mission = Doc<"missions">;

const priorityColors: Record<string, { bg: string; text: string }> = {
	urgent: { bg: "bg-destructive/10", text: "text-destructive" },
	high: { bg: "bg-warning/10", text: "text-warning" },
	medium: { bg: "bg-warning/10", text: "text-warning" },
	low: { bg: "bg-success/10", text: "text-success" },
};

interface MissionCardProps {
	mission: Mission;
	onClick?: () => void;
}

export function MissionCard({ mission, onClick }: MissionCardProps) {
	const t = useTranslations("missions.card");
	const format = useFormatter();
	const router = useRouter();
	const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	const operationStats = useQuery(api.operations.getStatsByMission, {
		missionId: mission._id,
	});

	const archiveMission = useMutation(api.missions.archive);

	const priorityStyle =
		priorityColors[mission.priority ?? "medium"] ?? priorityColors.medium;

	const handleViewDetails = () => {
		router.push(ROUTES.dashboardMission(mission._id));
	};

	const handleArchive = async () => {
		setMenuOpen(false);
		try {
			await archiveMission({ id: mission._id });
		} catch (error) {
			console.error("Failed to archive mission:", error);
		}
	};

	// Close menu on outside click
	useEffect(() => {
		if (!menuOpen) return;
		const handler = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setMenuOpen(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [menuOpen]);

	const progress = operationStats
		? operationStats.total > 0
			? Math.round((operationStats.completed / operationStats.total) * 100)
			: 0
		: (mission.progress ?? 0);

	return (
		<article
			className="rounded-xl border border-border bg-card p-4 cursor-pointer hover:bg-accent transition-colors"
			onClick={onClick ?? handleViewDetails}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					(onClick ?? handleViewDetails)();
				}
			}}
		>
			{/* Header: Priority Badge + Menu */}
			<div className="flex items-start justify-between mb-4">
				<span
					className={cn(
						"inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium capitalize",
						priorityStyle.bg,
						priorityStyle.text,
					)}
				>
					{mission.priority ?? "medium"}
				</span>

				{/* Dropdown menu */}
				<div ref={menuRef} className="relative">
					<button
						type="button"
						className="flex items-center justify-center size-6 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
						onClick={(e) => {
							e.stopPropagation();
							setMenuOpen((prev) => !prev);
						}}
						aria-label={t("actions_aria")}
						aria-expanded={menuOpen}
						aria-haspopup="menu"
					>
						{/* MoreHorizontal icon */}
						<svg
							xmlns="http://www.w3.org/2000/svg"
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
							<circle cx="5" cy="12" r="1" />
							<circle cx="12" cy="12" r="1" />
							<circle cx="19" cy="12" r="1" />
						</svg>
					</button>

					{menuOpen && (
						<div
							role="menu"
							className="absolute right-0 top-7 z-50 min-w-[140px] rounded-lg border border-border bg-card shadow-lg py-1 text-sm"
						>
							<button
								type="button"
								role="menuitem"
								className="w-full text-left px-3 py-1.5 text-foreground hover:bg-accent transition-colors"
								onClick={(e) => {
									e.stopPropagation();
									setMenuOpen(false);
									handleViewDetails();
								}}
							>
								{t("view_details")}
							</button>
							<div className="h-px bg-border my-1" />
							<button
								type="button"
								role="menuitem"
								className="w-full text-left px-3 py-1.5 text-destructive hover:bg-accent transition-colors"
								onClick={(e) => {
									e.stopPropagation();
									handleArchive();
								}}
							>
								{t("archive")}
							</button>
						</div>
					)}
				</div>
			</div>

			{/* Title & Brief */}
			<div className="mb-3">
				<h3 className="text-xs font-semibold mb-2 line-clamp-2 text-foreground">
					{mission.name}
				</h3>
				{mission.brief && (
					<div className="flex items-start gap-1.5 text-muted-foreground">
						{/* FileText icon */}
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
							className="mt-0.5 shrink-0"
							aria-hidden="true"
						>
							<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
							<path d="M14 2v4a2 2 0 0 0 2 2h4" />
							<path d="M10 9H8" />
							<path d="M16 13H8" />
							<path d="M16 17H8" />
						</svg>
						<span className="text-xs line-clamp-2">{mission.brief}</span>
					</div>
				)}
				{!mission.brief && mission.description && (
					<p className="text-xs text-muted-foreground line-clamp-2">
						{mission.description}
					</p>
				)}
			</div>

			{/* Meta Row */}
			<div className="flex items-center gap-3 text-muted-foreground mb-4">
				{mission.targetDate && (
					<div
						className="flex items-center gap-1.5"
						title={t("target_title", {
							date: format.dateTime(new Date(mission.targetDate), {
								day: "numeric",
								month: "short",
								year: "numeric",
							}),
						})}
					>
						{/* Calendar icon */}
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
							<rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
							<line x1="16" x2="16" y1="2" y2="6" />
							<line x1="8" x2="8" y1="2" y2="6" />
							<line x1="3" x2="21" y1="10" y2="10" />
						</svg>
						<span className="text-xs">{t("due")}</span>
						<span className="text-xs text-foreground">
							{format.relativeTime(new Date(mission.targetDate))}
						</span>
					</div>
				)}

				{operationStats && operationStats.total > 0 && (
					<div
						className="flex items-center gap-1.5"
						title={t("operations_complete", {
							completed: operationStats.completed,
							total: operationStats.total,
						})}
					>
						{/* Target icon */}
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
							<circle cx="12" cy="12" r="6" />
							<circle cx="12" cy="12" r="2" />
						</svg>
						<span className="text-xs">
							{operationStats.completed}/{operationStats.total}
						</span>
					</div>
				)}
			</div>

			{/* Separator */}
			<div className="h-px bg-border/60 mb-4" />

			{/* Footer: Progress */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-1.5 text-muted-foreground">
					<ProgressRing progress={progress} size={18} />
					<span className="text-[10px]">{progress}%</span>
				</div>

				{/* AI Agent avatar placeholder */}
				<div
					className="size-6 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center"
					title={t("ai_agent")}
				>
					<span className="text-[8px] font-medium text-primary">A</span>
				</div>
			</div>
		</article>
	);
}

interface ProgressRingProps {
	progress: number;
	size?: number;
	strokeWidth?: number;
}

function ProgressRing({
	progress,
	size = 18,
	strokeWidth = 2,
}: ProgressRingProps) {
	const radius = (size - strokeWidth) / 2;
	const circumference = radius * 2 * Math.PI;
	const offset = circumference - (progress / 100) * circumference;

	return (
		<svg
			width={size}
			height={size}
			className="transform -rotate-90"
			aria-hidden="true"
		>
			<circle
				cx={size / 2}
				cy={size / 2}
				r={radius}
				fill="none"
				stroke="currentColor"
				strokeWidth={strokeWidth}
				className="text-muted/30"
			/>
			<circle
				cx={size / 2}
				cy={size / 2}
				r={radius}
				fill="none"
				stroke="currentColor"
				strokeWidth={strokeWidth}
				strokeDasharray={circumference}
				strokeDashoffset={offset}
				strokeLinecap="round"
				className={cn(
					"transition-all duration-300",
					progress >= 100
						? "text-success"
						: progress >= 75
							? "text-success"
							: progress >= 50
								? "text-primary"
								: progress >= 25
									? "text-warning"
									: "text-muted-foreground",
				)}
			/>
		</svg>
	);
}
