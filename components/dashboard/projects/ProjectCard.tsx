"use client";

import {
	Calendar,
	Clock,
	Edit,
	MoreVertical,
	Share2,
	Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDevice } from "@/contexts/DeviceContext";
import type { Doc } from "@/convex/_generated/dataModel";
import { useDateFormatter } from "@/hooks/useDateFormatter";
import { useRouter } from "@/i18n/routing";
import { DeleteProjectModal } from "./modals/DeleteProjectModal";
import { ShareProjectModal } from "./modals/ShareProjectModal";

interface ProjectCardProps {
	project: Doc<"projects">;
	viewMode: "grid" | "list";
}

export function ProjectCard({ project, viewMode }: ProjectCardProps) {
	const router = useRouter();
	const { isMobile } = useDevice();
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [isShareModalOpen, setIsShareModalOpen] = useState(false);
	const tProjectCard = useTranslations("project_card");
	const tStatus = useTranslations("status");
	const tOccasions = useTranslations("occasions");
	const { formatShort } = useDateFormatter();

	const statusColors = {
		draft: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
		in_progress: "bg-blue-500/10 text-blue-500 border-blue-500/20",
		completed: "bg-green-500/10 text-green-500 border-green-500/20",
	};

	const handleEdit = (e: React.MouseEvent) => {
		e.stopPropagation();
		router.push(`/guided/step-1?projectId=${project._id}`);
	};

	const handleShare = (e: React.MouseEvent) => {
		e.stopPropagation();
		setIsShareModalOpen(true);
	};

	const handleDelete = (e: React.MouseEvent) => {
		e.stopPropagation();
		setIsDeleteModalOpen(true);
	};

	return (
		<>
			<Card
				onClick={() => router.push(`/dashboard/projects/${project._id}`)}
				className={`
        cursor-pointer transition-all min-h-[120px]
        ${isMobile ? "active:scale-[0.98] active:bg-card/80" : "hover:shadow-lg hover:border-primary/50"}
        ${viewMode === "list" ? "flex flex-row items-center" : ""}
      `}
			>
				<div
					className={`
        p-4 md:p-6 flex flex-col gap-3
        ${viewMode === "list" ? "flex-1" : ""}
      `}
				>
					{/* Header */}
					<div className="flex items-start justify-between gap-2">
						<div className="flex-1 min-w-0">
							<h3 className="text-base md:text-lg font-semibold text-foreground truncate">
								{project.name}
							</h3>
							<p className="text-xs md:text-sm text-muted-foreground mt-1">
								{tOccasions(project.occasion.replace(/-/g, "_") as never)}
							</p>
						</div>

						{/* Actions Dropdown */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									className="min-h-[44px] min-w-[44px] -mr-2"
									onClick={(e) => e.stopPropagation()}
								>
									<MoreVertical className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onClick={handleEdit}>
									<Edit className="h-4 w-4 mr-2" />
									{tProjectCard("edit")}
								</DropdownMenuItem>
								<DropdownMenuItem onClick={handleShare}>
									<Share2 className="h-4 w-4 mr-2" />
									{tProjectCard("share")}
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={handleDelete}
									className="text-destructive"
								>
									<Trash2 className="h-4 w-4 mr-2" />
									{tProjectCard("delete")}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					{/* Status Badge */}
					<div className="flex items-center gap-2">
						<Badge
							variant="outline"
							className={`${statusColors[project.status]} text-xs`}
						>
							{tStatus(project.status)}
						</Badge>
						<Badge variant="outline" className="text-xs">
							{project.theme}
						</Badge>
					</div>

					{/* Metadata */}
					<div className="flex items-center gap-4 text-xs text-muted-foreground">
						<div className="flex items-center gap-1">
							<Calendar className="h-3 w-3" />
							<span>{formatShort(project.updatedAt)}</span>
						</div>
						<div className="flex items-center gap-1">
							<Clock className="h-3 w-3" />
							<span>{project.duration}s</span>
						</div>
					</div>
				</div>
			</Card>

			<DeleteProjectModal
				isOpen={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
				projectName={project.name}
				projectId={project._id}
			/>

			<ShareProjectModal
				isOpen={isShareModalOpen}
				onClose={() => setIsShareModalOpen(false)}
				projectName={project.name}
				projectId={project._id}
			/>
		</>
	);
}
