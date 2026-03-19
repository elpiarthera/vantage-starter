"use client";

import { useMutation } from "convex/react";
import { Clock, Edit, Eye, Film, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import React from "react";
import { toast } from "sonner";
import { ScenePreviewModal } from "@/components/dashboard/scenes/ScenePreviewModal";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDevice } from "@/contexts/DeviceContext";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Link } from "@/i18n/routing";

interface SceneCardProps {
	scene: Doc<"scenes">;
}

export function SceneCard({ scene }: SceneCardProps) {
	const { isMobile } = useDevice();
	const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
	const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
	const [isDeleting, setIsDeleting] = React.useState(false);
	const t = useTranslations("scene_card");
	const tStatus = useTranslations("status");

	const removeScene = useMutation(api.scenes.remove);

	const handleConfirmDelete = async () => {
		setIsDeleting(true);
		setDeleteConfirmOpen(false);
		try {
			await removeScene({ sceneId: scene._id });
			toast.success(t("delete_success_toast"));
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : t("delete_failed_toast"),
			);
		} finally {
			setIsDeleting(false);
		}
	};

	// Status badge colors
	const statusColors: Record<string, string> = {
		draft: "bg-gray-500 text-white",
		generating: "bg-yellow-500 text-black",
		completed: "bg-green-500 text-white",
		failed: "bg-red-500 text-white",
	};

	// Format duration (seconds to MM:SS)
	const formatDuration = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	// Get display status
	const displayStatus = tStatus(scene.status);

	return (
		<>
			<Card
				className={`
          bg-[#223649] border-[#314d68]
          min-h-[120px] md:min-h-[140px]
          ${isMobile ? "active:bg-[#2a4159]" : "hover:bg-[#2a4159]"}
          transition-colors
        `}
			>
				<div className="p-4 md:p-5 space-y-3 md:space-y-4">
					{/* Scene Thumbnail */}
					<div className="relative aspect-video bg-[#182634] rounded-lg overflow-hidden">
						{scene.videoUrl ? (
							<video
								src={scene.videoUrl}
								className="w-full h-full object-cover"
								poster={scene.videoGeneration?.startFrameUrl || undefined}
							>
								<track kind="captions" />
							</video>
						) : scene.videoGeneration?.startFrameUrl ? (
							<Image
								src={scene.videoGeneration.startFrameUrl}
								alt={scene.title}
								fill
								className="object-cover"
								unoptimized
							/>
						) : (
							<div className="w-full h-full flex items-center justify-center">
								<Film className="h-8 w-8 md:h-10 md:w-10 text-gray-500" />
							</div>
						)}

						{/* Scene Number Badge */}
						<div className="absolute top-2 left-2">
							<Badge className="bg-[#0d7ff2] text-white text-xs">
								{t("scene_number_badge", { sceneNumber: scene.sceneNumber })}
							</Badge>
						</div>

						{/* Status Badge */}
						<div className="absolute top-2 right-2">
							<Badge
								className={`${statusColors[scene.status] || statusColors.draft} text-xs`}
							>
								{displayStatus}
							</Badge>
						</div>
					</div>

					{/* Scene Info */}
					<div className="space-y-2">
						<h4 className="text-sm md:text-base font-semibold text-white line-clamp-1">
							{scene.title}
						</h4>

						<p className="text-xs md:text-sm text-gray-400 line-clamp-2">
							{scene.description}
						</p>

						<div className="flex items-center gap-2 text-xs md:text-sm text-gray-400">
							<Clock className="h-3 w-3 md:h-4 md:w-4" />
							<span>{formatDuration(scene.duration)}</span>
						</div>
					</div>

					{/* Actions */}
					<div className="flex items-center gap-2">
						<Link
							href={`/guided/step-3?projectId=${scene.projectId}&sceneId=${scene._id}`}
							className="flex-1"
						>
							<Button
								variant="outline"
								size={isMobile ? "sm" : "default"}
								className={`
                  w-full min-h-[44px]
                  ${isMobile ? "active:bg-[#314d68]" : "hover:bg-[#314d68]"}
                  border-[#314d68] text-white
                `}
							>
								<Edit className="h-4 w-4 mr-2" />
								{t("edit_button")}
							</Button>
						</Link>

						<Button
							variant="outline"
							size={isMobile ? "sm" : "default"}
							className={`
                min-h-[44px] min-w-[44px]
                ${isMobile ? "active:bg-[#314d68]" : "hover:bg-[#314d68]"}
                border-[#314d68] text-white
              `}
							disabled={scene.status !== "completed"}
							onClick={() => setIsPreviewOpen(true)}
						>
							<Eye className="h-4 w-4" />
						</Button>

						<Button
							type="button"
							variant="outline"
							size={isMobile ? "sm" : "default"}
							disabled={isDeleting}
							onClick={() => setDeleteConfirmOpen(true)}
							className={`
                min-h-[44px] min-w-[44px]
                ${isMobile ? "active:bg-red-600" : "hover:bg-red-600"}
                border-red-500 text-red-500
                ${isMobile ? "active:text-white" : "hover:text-white"}
              `}
						>
							{isDeleting ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Trash2 className="h-4 w-4" />
							)}
						</Button>
					</div>
				</div>
			</Card>

			<ScenePreviewModal
				scene={scene}
				isOpen={isPreviewOpen}
				onClose={() => setIsPreviewOpen(false)}
			/>

			<AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
				<AlertDialogContent className="bg-[#182634] border-[#314d68]">
					<AlertDialogHeader>
						<AlertDialogTitle className="text-white">
							{t("delete_confirm_title")}
						</AlertDialogTitle>
						<AlertDialogDescription className="text-gray-400">
							{t("delete_confirm_description")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="border-[#314d68] text-gray-300 hover:bg-[#223649]">
							{t("delete_confirm_cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmDelete}
							className="bg-red-600 text-white hover:bg-red-700"
						>
							{t("delete_confirm_submit")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
