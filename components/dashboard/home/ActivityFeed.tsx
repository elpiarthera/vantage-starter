"use client";

import { FolderOpen, Video } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";
import { EmptyState } from "@/components/shared/EmptyState";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useDevice } from "@/contexts/DeviceContext";
import type { Id } from "@/convex/_generated/dataModel";

interface ActivityFeedProps {
	projects: Array<{
		_id: Id<"projects">;
		name: string;
		createdAt: number;
		updatedAt: number;
		status: "draft" | "in_progress" | "completed";
	}>;
}

export function ActivityFeed({ projects }: ActivityFeedProps) {
	const { isMobile } = useDevice();
	const t = useTranslations("dashboard.activity_feed");
	const format = useFormatter();

	const activityIcons = {
		project_created: <FolderOpen className="h-4 w-4 text-blue-400" />,
		video_completed: <Video className="h-4 w-4 text-orange-400" />,
	};

	const now = useMemo(() => new Date(), []);

	const formatTimeAgo = (timestamp: number) => {
		const date = new Date(timestamp);
		const diffMs = now.getTime() - date.getTime();

		if (diffMs < 60000) {
			return t("just_now");
		}

		return format.relativeTime(date, now);
	};

	// Derive activities from projects
	const recentActivities = useMemo(() => {
		return projects
			.flatMap((p) => [
				{
					id: `${p._id}_created`,
					type: "project_created",
					name: p.name,
					timestamp: p.createdAt,
				},
				// Add completed activity if status is completed
				...(p.status === "completed"
					? [
							{
								id: `${p._id}_completed`,
								type: "video_completed",
								name: p.name,
								timestamp: p.updatedAt,
							},
						]
					: []),
			])
			.sort((a, b) => b.timestamp - a.timestamp)
			.slice(0, 5);
	}, [projects]);

	const getActivityDescription = (activity: { type: string; name: string }) => {
		if (activity.type === "project_created") {
			return t("created_project", { name: activity.name });
		}
		if (activity.type === "video_completed") {
			return t("video_completed", { name: activity.name });
		}
		return activity.name;
	};

	return (
		<Card className="bg-slate-800 border-slate-700">
			<CardHeader>
				<CardTitle className="text-white text-lg md:text-xl">
					{t("title")}
				</CardTitle>
				<CardDescription className="text-gray-400">
					{t("description")}
				</CardDescription>
			</CardHeader>
			<CardContent>
				{recentActivities.length === 0 ? (
					<EmptyState
						title={t("empty_title")}
						description={t("empty_description")}
						icon={<FolderOpen className="h-12 w-12 text-gray-400" />}
					/>
				) : (
					<div className="space-y-4">
						{recentActivities.map((activity) => (
							<div
								key={activity.id}
								className={`
                  flex items-start gap-3 p-3 rounded-lg bg-slate-700/50
                  ${isMobile ? "active:bg-slate-700" : "hover:bg-slate-700"}
                  transition-colors
                `}
							>
								<div className="mt-1">
									{activityIcons[activity.type as keyof typeof activityIcons]}
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-white text-sm">
										{getActivityDescription(activity)}
									</p>
									<p className="text-gray-400 text-xs mt-1">
										{formatTimeAgo(activity.timestamp)}
									</p>
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
