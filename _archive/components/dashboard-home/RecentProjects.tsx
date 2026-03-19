"use client";

import { FolderOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useDevice } from "@/contexts/DeviceContext";
import type { Id } from "@/convex/_generated/dataModel";
import { Link } from "@/i18n/routing";

interface RecentProjectsProps {
	projects: Array<{
		_id: Id<"projects">;
		name: string;
		occasion: string;
		status: "draft" | "in_progress" | "completed";
	}>;
}

export function RecentProjects({ projects }: RecentProjectsProps) {
	const { isMobile } = useDevice();
	const t = useTranslations("dashboard.recent_projects");
	const tOccasions = useTranslations("occasions");
	const tStatus = useTranslations("status");

	return (
		<Card className="bg-slate-800 border-slate-700">
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="text-white text-lg md:text-xl">
							{t("title")}
						</CardTitle>
						<CardDescription className="text-gray-400">
							{t("description")}
						</CardDescription>
					</div>
					<Link
						href="/dashboard/projects"
						className={`
              text-blue-400 text-sm
              ${isMobile ? "active:text-blue-300" : "hover:text-blue-300"}
            `}
					>
						{t("view_all")}
					</Link>
				</div>
			</CardHeader>
			<CardContent>
				{projects.length === 0 ? (
					<EmptyState
						title={t("empty_title")}
						description={t("empty_description")}
						icon={<FolderOpen className="h-12 w-12 text-gray-400" />}
					/>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{projects.map((project) => (
							<Link
								key={project._id}
								href={`/dashboard/projects/${project._id}`}
							>
								<Card
									className={`
                  bg-slate-700 border-slate-600 min-h-[120px]
                  ${isMobile ? "active:bg-slate-600" : "hover:bg-slate-600"}
                  transition-colors cursor-pointer
                `}
								>
									<CardContent className="p-4">
										<div className="aspect-video bg-slate-600 rounded-lg mb-3 flex items-center justify-center">
											<FolderOpen className="h-8 w-8 text-gray-400" />
										</div>
										<p className="text-white text-sm font-medium mb-2 truncate">
											{project.name}
										</p>
										<div className="flex items-center gap-2 flex-wrap">
											<Badge variant="secondary" className="text-xs">
												{tOccasions(
													project.occasion.replace(/-/g, "_") as never,
												)}
											</Badge>
											<Badge
												variant={
													project.status === "completed" ? "default" : "outline"
												}
												className="text-xs"
											>
												{tStatus(project.status)}
											</Badge>
										</div>
									</CardContent>
								</Card>
							</Link>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
