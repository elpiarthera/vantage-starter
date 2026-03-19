"use client";

import { AlertTriangle, ImageIcon, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AdaptiveModal } from "@/components/adaptive/AdaptiveModal";
import type { Scene } from "@/components/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { useDevice } from "@/contexts/DeviceContext";
import type { Id } from "@/convex/_generated/dataModel";
import { AssetSelector } from "../asset-management/AssetSelector";

interface FrameAssignmentProps {
	scene: Scene; // Scene data passed from parent (Convex)
	projectId?: Id<"projects">; // Project ID to filter assets
	onUpdateScene: (id: string, updates: Partial<Scene>) => void; // Callback to update scene in Convex
	visualStyle?: string; // Visual style from Step 2b
	onDeleteFrame?: (id: string, frameType: "start" | "end") => void; // Immediate delete callback (no debounce)
	onFrameChanged?: (sceneId: string) => void;
}

export function FrameAssignment({
	scene,
	projectId,
	onUpdateScene,
	visualStyle,
	onDeleteFrame,
	onFrameChanged,
}: FrameAssignmentProps) {
	const t = useTranslations("frame_assignment");
	const { isMobile } = useDevice();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [showPortraitError, setShowPortraitError] = useState(false);
	const [currentFrameType, setCurrentFrameType] = useState<"start" | "end">(
		"start",
	);

	const openFrameModal = (frameType: "start" | "end") => {
		setCurrentFrameType(frameType);
		setIsModalOpen(true);
	};

	async function checkImageOrientation(url: string): Promise<boolean> {
		return new Promise((resolve) => {
			const img = new window.Image();
			img.onload = () => resolve(img.naturalWidth >= img.naturalHeight);
			img.onerror = () => resolve(true);
			img.src = url;
		});
	}

	const handleAssetSelect = async (assetUrl: string) => {
		console.log("[FrameAssignment] handleAssetSelect called:", {
			assetUrl,
			currentFrameType,
			sceneId: scene.id,
		});

		const isLandscape = await checkImageOrientation(assetUrl);
		if (!isLandscape) {
			setShowPortraitError(true);
			setIsModalOpen(false);
			return;
		}

		// Update scene in Convex via callback
		if (currentFrameType === "start") {
			console.log("[FrameAssignment] Updating startFrameImage");
			onUpdateScene(scene.id, { startFrameImage: assetUrl });
		} else {
			console.log("[FrameAssignment] Updating endFrameImage");
			onUpdateScene(scene.id, { endFrameImage: assetUrl });
		}
		onFrameChanged?.(scene.id);
		setIsModalOpen(false);
	};

	const deleteFrame = async (frameType: "start" | "end") => {
		// Use immediate delete if available (for red cross button), otherwise use regular update
		if (onDeleteFrame) {
			console.log("[FrameAssignment] Using immediate delete for:", frameType);
			await onDeleteFrame(scene.id, frameType);
		} else {
			// Fallback to regular update (debounced)
			console.log("[FrameAssignment] Using regular update for:", frameType);
			if (frameType === "start") {
				onUpdateScene(scene.id, { startFrameImage: undefined });
			} else {
				onUpdateScene(scene.id, { endFrameImage: undefined });
			}
		}
		onFrameChanged?.(scene.id);
	};

	return (
		<>
			<Card className="bg-[#182634] border-[#223649]">
				<CardHeader>
					<CardTitle className="text-white flex items-center gap-2">
						<ImageIcon className="h-5 w-5" />
						{t("set_frames_title")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col gap-6">
						{/* Start Frame */}
						<div className="space-y-3">
							<div className="space-y-2">
								<h3 className="text-lg font-semibold text-white">
									{t("start_frame_title")}
								</h3>
								<p className="text-sm text-gray-400">
									{t("start_frame_description")}
								</p>
							</div>
							{/* biome-ignore lint/a11y/useSemanticElements: Complex dropzone layout requires div */}
							<div
								className="border-2 border-dashed border-[#314d68] rounded-lg p-8 text-center cursor-pointer hover:bg-[#223649] transition-colors min-h-[200px] flex flex-col items-center justify-center relative"
								onClick={() => openFrameModal("start")}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										openFrameModal("start");
									}
								}}
								role="button"
								tabIndex={0}
								aria-label={t("select_start_frame")}
							>
								{scene.startFrameImage ? (
									<>
										<button
											type="button"
											onClick={async (e) => {
												e.stopPropagation();
												await deleteFrame("start");
											}}
											className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors z-10"
											title={t("delete_image")}
											aria-label={t("delete_start_frame")}
										>
											<X className="h-4 w-4" />
										</button>
										{/* biome-ignore lint/performance/noImgElement: Dynamic asset URLs require <img> */}
										<img
											src={scene.startFrameImage}
											alt={t("start_frame_alt")}
											className="w-48 h-48 object-cover rounded mb-3"
										/>
										<p className="text-gray-300 font-medium">
											{t("start_frame_created")}
										</p>
										<p className="text-sm text-gray-500">
											{t("click_to_change_start")}
										</p>
									</>
								) : (
									<>
										<Plus className="h-12 w-12 mb-3 text-gray-400" />
										<p className="text-gray-300 font-medium">
											{t("create_visual")}
										</p>
										<p className="text-sm text-gray-500">
											{t("click_to_select_start")}
										</p>
									</>
								)}
							</div>
						</div>

						{/* End Frame - Only visible after start frame is created */}
						{scene.startFrameImage && (
							<div className="space-y-3">
								<div className="space-y-2">
									<h3 className="text-lg font-semibold text-white">
										{t("end_frame_title")}
									</h3>
									<p className="text-sm text-gray-400">
										{t("end_frame_description")}
									</p>
								</div>
								{/* biome-ignore lint/a11y/useSemanticElements: Complex dropzone layout requires div */}
								<div
									className="border-2 border-dashed border-[#314d68] rounded-lg p-8 text-center cursor-pointer hover:bg-[#223649] transition-colors min-h-[200px] flex flex-col items-center justify-center relative"
									onClick={() => openFrameModal("end")}
									onKeyDown={(e) => {
										if (e.key === "Enter" || e.key === " ") {
											openFrameModal("end");
										}
									}}
									role="button"
									tabIndex={0}
									aria-label={t("select_end_frame")}
								>
									{scene.endFrameImage ? (
										<>
											<button
												type="button"
												onClick={async (e) => {
													e.stopPropagation();
													await deleteFrame("end");
												}}
												className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors z-10"
												title={t("delete_image")}
												aria-label={t("delete_end_frame")}
											>
												<X className="h-4 w-4" />
											</button>
											{/* biome-ignore lint/performance/noImgElement: Dynamic asset URLs require <img> */}
											<img
												src={scene.endFrameImage}
												alt={t("end_frame_alt")}
												className="w-48 h-48 object-cover rounded mb-3"
											/>
											<p className="text-gray-300 font-medium">
												{t("end_frame_created")}
											</p>
											<p className="text-sm text-gray-500">
												{t("click_to_change_end")}
											</p>
										</>
									) : (
										<>
											<Plus className="h-12 w-12 mb-3 text-gray-400" />
											<p className="text-gray-300 font-medium">
												{t("create_visual")}
											</p>
											<p className="text-sm text-gray-500">
												{t("click_to_select_end")}
											</p>
										</>
									)}
								</div>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Asset Selection Modal with Convex Integration */}
			<AdaptiveModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				title={t("select_frame_title", {
					frameType: t(
						currentFrameType === "start"
							? "frame_type_start"
							: "frame_type_end",
					),
				})}
				description={t("modal_description")}
				size="full"
			>
				<AssetSelector
					onAssetSelect={handleAssetSelect}
					projectId={projectId}
					sceneId={scene.id as Id<"scenes">}
					assetType="image"
					frameType={currentFrameType}
					visualStyle={visualStyle}
				/>
			</AdaptiveModal>

			{/* Portrait Image Error Modal */}
			{isMobile ? (
				<Drawer
					open={showPortraitError}
					onOpenChange={(open) => !open && setShowPortraitError(false)}
				>
					<DrawerContent className="bg-[#182634] border-[#314d68]">
						<DrawerHeader className="text-center">
							<DrawerTitle className="text-white">
								{t("portrait_image_title")}
							</DrawerTitle>
							<DrawerDescription className="text-gray-400">
								{t("portrait_image_description")}
							</DrawerDescription>
						</DrawerHeader>
						<div className="px-4 pb-8 flex flex-col items-center gap-6">
							<div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
								<AlertTriangle className="w-8 h-8 text-amber-500" />
							</div>
							<Button
								onClick={() => setShowPortraitError(false)}
								className="w-full bg-[#314d68] hover:bg-[#3d5f7d] text-white border-0 min-h-[44px]"
							>
								{t("portrait_image_cta")}
							</Button>
						</div>
					</DrawerContent>
				</Drawer>
			) : (
				<Dialog
					open={showPortraitError}
					onOpenChange={(open) => !open && setShowPortraitError(false)}
				>
					<DialogContent className="bg-[#182634] border-[#314d68] sm:max-w-md">
						<DialogHeader className="text-center">
							<DialogTitle className="text-white">
								{t("portrait_image_title")}
							</DialogTitle>
							<DialogDescription className="text-gray-400">
								{t("portrait_image_description")}
							</DialogDescription>
						</DialogHeader>
						<div className="flex flex-col items-center gap-6 pt-2">
							<div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
								<AlertTriangle className="w-8 h-8 text-amber-500" />
							</div>
							<Button
								onClick={() => setShowPortraitError(false)}
								className="w-full bg-[#314d68] hover:bg-[#3d5f7d] text-white border-0 min-h-[44px]"
							>
								{t("portrait_image_cta")}
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			)}
		</>
	);
}
