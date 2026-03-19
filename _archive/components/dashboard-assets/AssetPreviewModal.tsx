"use client";

import { Download, ImageIcon, Trash2, Video } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
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
import { Button } from "@/components/ui/button";
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
import { useDateFormatter } from "@/hooks/useDateFormatter";

interface AssetPreviewModalProps {
	asset: Doc<"assets"> & { id?: string };
	isOpen: boolean;
	onClose: () => void;
	onDelete?: () => void;
}

export function AssetPreviewModal({
	asset,
	isOpen,
	onClose,
	onDelete,
}: AssetPreviewModalProps) {
	const { isMobile } = useDevice();
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const t = useTranslations("asset_preview_modal");
	const tAssetCard = useTranslations("asset_card");
	const { formatLong } = useDateFormatter();

	// Format file size
	const formatSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	};

	const handleDownload = () => {
		// TODO: Implement actual download
		console.log("[v0] Download asset:", asset.id);
	};

	const handleDeleteClick = () => {
		setShowDeleteConfirm(true);
	};

	const handleConfirmDelete = () => {
		onDelete?.();
		onClose();
		setShowDeleteConfirm(false);
	};

	const content = (
		<div className="space-y-4 md:space-y-6">
			{/* Asset Preview - same pattern as AssetCard: image/video when url exists, else icon */}
			<div className="relative aspect-video bg-[#182634] rounded-lg overflow-hidden flex items-center justify-center">
				{asset.type === "image" && asset.url ? (
					<Image
						src={asset.url}
						alt={asset.filename}
						fill
						className="object-cover"
						sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
					/>
				) : asset.type === "video" && asset.url ? (
					<video
						src={asset.url}
						className="w-full h-full object-cover"
						muted
						playsInline
					/>
				) : asset.type === "image" ? (
					<ImageIcon className="h-16 w-16 md:h-24 md:w-24 text-gray-500" />
				) : (
					<Video className="h-16 w-16 md:h-24 md:w-24 text-gray-500" />
				)}
				{/* Type Badge */}
				<div className="absolute top-3 right-3 px-3 py-1.5 bg-[#182634]/90 rounded text-sm font-medium text-white">
					{tAssetCard(`asset_type_${asset.type}`)}
				</div>
			</div>

			{/* Asset Details */}
			<div className="space-y-3 md:space-y-4">
				<div>
					<h3 className="text-sm text-gray-400 mb-1">{t("filename_label")}</h3>
					<p className="text-base md:text-lg text-white font-medium break-all">
						{asset.filename}
					</p>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div>
						<h3 className="text-sm text-gray-400 mb-1">
							{t("file_size_label")}
						</h3>
						<p className="text-base text-white">{formatSize(asset.size)}</p>
					</div>
					<div>
						<h3 className="text-sm text-gray-400 mb-1">{t("type_label")}</h3>
						<p className="text-base text-white capitalize">
							{tAssetCard(`asset_type_${asset.type.toLowerCase()}`)}
						</p>
					</div>
				</div>

				<div>
					<h3 className="text-sm text-gray-400 mb-1">{t("uploaded_label")}</h3>
					<p className="text-base text-white">{formatLong(asset.uploadedAt)}</p>
				</div>
			</div>

			{/* Actions */}
			<div className="flex flex-col sm:flex-row gap-3 pt-2">
				<Button
					onClick={handleDownload}
					className={`
            min-h-[44px] flex-1
            bg-[#0d7ff2] text-white
            ${isMobile ? "active:bg-[#0b6dd4]" : "hover:bg-[#0b6dd4]"}
          `}
				>
					<Download className="h-4 w-4 mr-2" />
					{t("download_button")}
				</Button>
				<Button
					onClick={handleDeleteClick}
					variant="outline"
					className={`
            min-h-[44px] flex-1
            bg-[#182634] border-[#314d68] text-red-400
            ${isMobile ? "active:bg-[#223649]" : "hover:bg-[#223649]"}
          `}
				>
					<Trash2 className="h-4 w-4 mr-2" />
					{t("delete_button")}
				</Button>
			</div>
		</div>
	);

	const deleteConfirmDialog = (
		<AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
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
	);

	if (isMobile) {
		return (
			<>
				<Drawer open={isOpen} onOpenChange={onClose}>
					<DrawerContent className="bg-[#182634] border-[#314d68]">
						<DrawerHeader className="border-b border-[#314d68]">
							<DrawerTitle className="text-white">
								{t("asset_preview_title")}
							</DrawerTitle>
						</DrawerHeader>
						<div className="p-4 pb-8">{content}</div>
					</DrawerContent>
				</Drawer>
				{deleteConfirmDialog}
			</>
		);
	}

	return (
		<>
			<Dialog open={isOpen} onOpenChange={onClose}>
				<DialogContent className="bg-[#182634] border-[#314d68] max-w-2xl">
					<DialogHeader>
						<DialogTitle className="text-white">
							{t("asset_preview_title")}
						</DialogTitle>
					</DialogHeader>
					{content}
				</DialogContent>
			</Dialog>
			{deleteConfirmDialog}
		</>
	);
}
