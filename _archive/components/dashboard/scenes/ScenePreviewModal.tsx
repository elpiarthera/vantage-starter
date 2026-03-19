"use client";

import { Camera, Clock, Film, Palette, Sun } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { useDevice } from "@/contexts/DeviceContext";
import type { Doc } from "@/convex/_generated/dataModel";

interface ScenePreviewModalProps {
	scene: Doc<"scenes">;
	isOpen: boolean;
	onClose: () => void;
}

export function ScenePreviewModal({
	scene,
	isOpen,
	onClose,
}: ScenePreviewModalProps) {
	const { isMobile } = useDevice();
	const t = useTranslations("scene_preview_modal");
	const tStatus = useTranslations("status");

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
	const getDisplayStatus = (status: string) => {
		return tStatus(status);
	};

	const content = (
		<div className="space-y-4 md:space-y-6">
			{/* Video Preview */}
			<div className="relative aspect-video bg-[#182634] rounded-lg overflow-hidden">
				{scene.videoUrl ? (
					<video
						src={scene.videoUrl}
						controls
						autoPlay
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
					<div className="w-full h-full flex flex-col items-center justify-center gap-3">
						<Film className="h-12 w-12 md:h-16 md:w-16 text-gray-500" />
						<p className="text-sm md:text-base text-gray-400">
							{t("video_preview_not_available")}
						</p>
					</div>
				)}
			</div>

			{/* Scene Details */}
			<div className="space-y-4">
				{/* Title and Status */}
				<div className="flex items-start justify-between gap-3">
					<div className="flex-1 space-y-1">
						<div className="flex items-center gap-2">
							<Badge className="bg-[#0d7ff2] text-white text-xs">
								{t("scene_number_badge", { sceneNumber: scene.sceneNumber })}
							</Badge>
							<Badge
								className={`${statusColors[scene.status] || statusColors.draft} text-xs`}
							>
								{getDisplayStatus(scene.status)}
							</Badge>
						</div>
						<h3 className="text-base md:text-lg font-semibold text-white">
							{scene.title}
						</h3>
					</div>
				</div>

				{/* Description */}
				<div className="space-y-2">
					<p className="text-sm md:text-base text-gray-300">
						{scene.description}
					</p>
				</div>

				{/* Duration */}
				<div className="flex items-center gap-2 text-sm md:text-base text-gray-400">
					<Clock className="h-4 w-4 md:h-5 md:w-5" />
					<span>
						{t("duration_label")}: {formatDuration(scene.duration)}
					</span>
				</div>

				{/* Cinematic Styles */}
				{scene.cinematicStyles && (
					<div className="space-y-3 pt-2 border-t border-[#314d68]">
						<h4 className="text-sm md:text-base font-semibold text-white">
							{t("cinematic_styles_title")}
						</h4>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							{scene.cinematicStyles.ambiance && (
								<div className="flex items-center gap-2 text-sm text-gray-300">
									<Sun className="h-4 w-4 text-[#0d7ff2]" />
									<span className="text-gray-400">{t("ambiance_label")}:</span>
									<span className="capitalize">
										{scene.cinematicStyles.ambiance}
									</span>
								</div>
							)}
							{scene.cinematicStyles.cameraMovement && (
								<div className="flex items-center gap-2 text-sm text-gray-300">
									<Camera className="h-4 w-4 text-[#0d7ff2]" />
									<span className="text-gray-400">{t("camera_label")}:</span>
									<span className="capitalize">
										{scene.cinematicStyles.cameraMovement.replace("-", " ")}
									</span>
								</div>
							)}
							{scene.cinematicStyles.colorTone && (
								<div className="flex items-center gap-2 text-sm text-gray-300">
									<Palette className="h-4 w-4 text-[#0d7ff2]" />
									<span className="text-gray-400">
										{t("color_tone_label")}:
									</span>
									<span className="capitalize">
										{scene.cinematicStyles.colorTone.replace("-", " ")}
									</span>
								</div>
							)}
							{scene.cinematicStyles.visualStyle && (
								<div className="flex items-center gap-2 text-sm text-gray-300">
									<Film className="h-4 w-4 text-[#0d7ff2]" />
									<span className="text-gray-400">
										{t("visual_style_label")}:
									</span>
									<span className="capitalize">
										{scene.cinematicStyles.visualStyle}
									</span>
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);

	// Mobile: Drawer
	if (isMobile) {
		return (
			<Drawer open={isOpen} onOpenChange={onClose}>
				<DrawerContent className="bg-[#182634] border-[#314d68] max-h-[90vh]">
					<DrawerHeader className="border-b border-[#314d68]">
						<DrawerTitle className="text-white">
							{t("scene_preview_title")}
						</DrawerTitle>
					</DrawerHeader>
					<div className="p-4 overflow-y-auto">{content}</div>
				</DrawerContent>
			</Drawer>
		);
	}

	// Desktop: Modal
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="bg-[#182634] border-[#314d68] max-w-3xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-white">
						{t("scene_preview_title")}
					</DialogTitle>
				</DialogHeader>
				{content}
			</DialogContent>
		</Dialog>
	);
}
