"use client";

import { useQuery } from "convex/react";
import { ArrowLeft, Edit, Share2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDevice } from "@/contexts/DeviceContext";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useDateFormatter } from "@/hooks/useDateFormatter";
import { useRouter } from "@/i18n/routing";
import { DeleteProjectModal } from "./modals/DeleteProjectModal";
import { ShareProjectModal } from "./modals/ShareProjectModal";
import { ProjectTabs } from "./ProjectTabs";

interface ProjectDetailProps {
	projectId: string;
}

export function ProjectDetail({ projectId }: ProjectDetailProps) {
	const router = useRouter();
	const { isMobile } = useDevice();
	const [activeTab, setActiveTab] = useState("scenes");
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [isShareModalOpen, setIsShareModalOpen] = useState(false);

	const tErrors = useTranslations("errors");
	const tStatus = useTranslations("status");
	const tCommon = useTranslations("common");
	const tOccasions = useTranslations("occasions");
	const tProjectCard = useTranslations("project_card");

	const { formatShort: _formatShort } = useDateFormatter();

	// Fetch project from Convex
	const project = useQuery(api.projects.get, {
		projectId: projectId as Id<"projects">,
	});

	const isLoading = project === undefined;
	const hasError = project === null;

	const handleRetry = () => {
		window.location.reload();
	};

	if (isLoading) {
		return (
			<div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">
				<Skeleton className="h-10 w-40" />
				<div className="space-y-3 md:space-y-4">
					<Skeleton className="h-10 w-full max-w-md" />
					<div className="flex gap-2">
						<Skeleton className="h-6 w-20" />
						<Skeleton className="h-6 w-24" />
					</div>
					<div className="flex gap-2">
						<Skeleton className="h-10 w-32" />
						<Skeleton className="h-10 w-24" />
						<Skeleton className="h-10 w-24" />
					</div>
				</div>
				<Skeleton className="h-96 w-full" />
			</div>
		);
	}

	if (hasError || !project) {
		return (
			<div className="animate-in fade-in duration-300">
				<ErrorState
					title={tErrors("project_load_failed_title")}
					description={
						hasError
							? tErrors("project_load_error_description")
							: tErrors("project_not_found_description")
					}
					actionLabel={
						hasError ? tCommon("retry") : tCommon("back_to_projects")
					}
					onAction={
						hasError ? handleRetry : () => router.push("/dashboard/projects")
					}
				/>
			</div>
		);
	}

	// Status badge color
	const statusColors = {
		draft: "bg-gray-500/20 text-gray-300 border-gray-500/30",
		in_progress: "bg-blue-500/20 text-blue-300 border-blue-500/30",
		completed: "bg-green-500/20 text-green-300 border-green-500/30",
	};

	// Occasion badge color (using lowercase to match Convex data)
	const occasionColors: Record<string, string> = {
		wedding: "bg-pink-500/20 text-pink-300 border-pink-500/30",
		birthday: "bg-purple-500/20 text-purple-300 border-purple-500/30",
		anniversary: "bg-red-500/20 text-red-300 border-red-500/30",
		corporate_event: "bg-blue-500/20 text-blue-300 border-blue-500/30",
		baby_shower: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
		graduation: "bg-green-500/20 text-green-300 border-green-500/30",
		holiday_party: "bg-orange-500/20 text-orange-300 border-orange-500/30",
		engagement: "bg-rose-500/20 text-rose-300 border-rose-500/30",
	};

	const handleEdit = () => {
		router.push(`/guided/step-1?projectId=${projectId}`);
	};

	const handleDelete = () => {
		setIsDeleteModalOpen(true);
	};

	const handleShare = () => {
		setIsShareModalOpen(true);
	};

	const _handleDeleteConfirm = () => {
		console.log("Delete project:", projectId);
		setIsDeleteModalOpen(false);
		router.push("/dashboard/projects");
	};

	return (
		<div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">
			{/* Page Header */}
			<div className="space-y-4">
				{/* Back Button */}
				<Button
					variant="ghost"
					onClick={() => router.push("/dashboard/projects")}
					className={`
            text-white min-h-[44px] min-w-[44px]
            ${isMobile ? "active:bg-slate-700" : "hover:bg-slate-700"}
          `}
				>
					<ArrowLeft className="h-4 w-4 mr-2" />
					{tCommon("back_to_projects")}
				</Button>

				{/* Project Info */}
				<div className="space-y-3 md:space-y-4">
					{/* Project Name */}
					<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">
						{project.name}
					</h1>

					{/* Badges */}
					<div className="flex flex-wrap gap-2">
						<Badge
							variant="outline"
							className={
								occasionColors[project.occasion] ||
								"bg-gray-500/20 text-gray-300 border-gray-500/30"
							}
						>
							{tOccasions(project.occasion.replace(/-/g, "_") as never)}
						</Badge>
						<Badge variant="outline" className={statusColors[project.status as keyof typeof statusColors]}>
							{tStatus(project.status)}
						</Badge>
					</div>

					{/* Action Buttons */}
					<div className="flex flex-wrap gap-2 md:gap-3">
						<Button
							onClick={handleEdit}
							className={`
                min-h-[44px] min-w-[44px]
                ${isMobile ? "active:scale-98" : "hover:scale-105"}
                transition-transform
              `}
						>
							<Edit className="h-4 w-4 mr-2" />
							{tProjectCard("edit")}
						</Button>
						<Button
							variant="outline"
							onClick={handleShare}
							className={`
                min-h-[44px] min-w-[44px]
                ${isMobile ? "active:bg-slate-700" : "hover:bg-slate-700"}
              `}
						>
							<Share2 className="h-4 w-4 mr-2" />
							{tProjectCard("share")}
						</Button>
						<Button
							variant="destructive"
							onClick={handleDelete}
							className={`
                min-h-[44px] min-w-[44px]
                ${isMobile ? "active:scale-98" : "hover:scale-105"}
                transition-transform
              `}
						>
							<Trash2 className="h-4 w-4 mr-2" />
							{tProjectCard("delete")}
						</Button>
					</div>
				</div>
			</div>

			{/* Project Tabs */}
			<ProjectTabs
				projectId={projectId}
				project={project}
				activeTab={activeTab}
				onTabChange={setActiveTab}
			/>

			{/* Modals */}
			<DeleteProjectModal
				projectName={project.name}
				projectId={project._id}
				isOpen={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
			/>

			<ShareProjectModal
				projectName={project.name}
				projectId={project._id}
				isOpen={isShareModalOpen}
				onClose={() => setIsShareModalOpen(false)}
			/>
		</div>
	);
}
