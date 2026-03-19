"use client";

import { useMutation } from "convex/react";
import { Eye, ImageIcon, Trash2, Video } from "lucide-react";
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
import { Card } from "@/components/ui/card";
import { useDevice } from "@/contexts/DeviceContext";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useDateFormatter } from "@/hooks/useDateFormatter";
import { AssetPreviewModal } from "./AssetPreviewModal";

interface AssetCardProps {
	asset: Doc<"assets"> & { id?: string }; // id for backwards compatibility
}

export function AssetCard({ asset }: AssetCardProps) {
	const { isMobile } = useDevice();
	const [isPreviewOpen, setIsPreviewOpen] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const t = useTranslations("asset_card");
	const tPreview = useTranslations("asset_preview_modal");
	const { formatShort } = useDateFormatter();
	const removeAsset = useMutation(api.assets.remove);

	// Format file size
	const formatSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	};

	const handleDelete = () => {
		removeAsset({ assetId: asset._id as Id<"assets"> }).catch((e) =>
			console.error("[AssetCard] Delete failed:", e),
		);
		setShowDeleteConfirm(false);
	};

	return (
		<>
			<Card
				className={`
          bg-[#223649] border-[#314d68] overflow-hidden
          min-h-[120px] flex flex-col
          ${isMobile ? "active:bg-[#2a4159]" : "hover:bg-[#2a4159]"}
          transition-colors
        `}
			>
				{/* Asset Preview */}
				<div className="relative aspect-video bg-[#182634] flex items-center justify-center overflow-hidden">
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
						<ImageIcon className="h-12 w-12 md:h-16 md:w-16 text-gray-500" />
					) : (
						<Video className="h-12 w-12 md:h-16 md:w-16 text-gray-500" />
					)}
					{/* Type Badge */}
					<div className="absolute top-2 right-2 px-2 py-1 bg-[#182634]/80 rounded text-xs text-gray-300">
						{t(`asset_type_${asset.type}`)}
					</div>
				</div>

				{/* Asset Info */}
				<div className="p-3 md:p-4 flex-1 flex flex-col">
					<h4 className="text-sm md:text-base font-medium text-white truncate mb-1">
						{asset.filename}
					</h4>
					<div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
						<span>{formatSize(asset.size)}</span>
						<span>•</span>
						<span>{formatShort(asset.uploadedAt)}</span>
					</div>

					{/* Actions */}
					<div className="flex gap-2 mt-auto">
						<Button
							onClick={() => setIsPreviewOpen(true)}
							variant="outline"
							size={isMobile ? "sm" : "default"}
							className={`
                min-h-[44px] flex-1
                bg-[#182634] border-[#314d68] text-white
                ${isMobile ? "active:bg-[#223649]" : "hover:bg-[#223649]"}
              `}
						>
							<Eye className="h-4 w-4 mr-1" />
							<span className={isMobile ? "text-xs" : "text-sm"}>
								{t("view_button")}
							</span>
						</Button>
						<Button
							onClick={() => setShowDeleteConfirm(true)}
							variant="outline"
							size={isMobile ? "sm" : "default"}
							className={`
                min-h-[44px] min-w-[44px]
                bg-[#182649] border-[#314d68] text-red-400
                ${isMobile ? "active:bg-[#223649]" : "hover:bg-[#223649]"}
              `}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</Card>

			{/* Asset Preview Modal */}
			<AssetPreviewModal
				asset={asset}
				isOpen={isPreviewOpen}
				onClose={() => setIsPreviewOpen(false)}
				onDelete={handleDelete}
			/>

			{/* Delete confirmation (same as AssetPreviewModal) when deleting from card */}
			<AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
				<AlertDialogContent className="bg-[#182634] border-[#314d68]">
					<AlertDialogHeader>
						<AlertDialogTitle className="text-white">
							{tPreview("delete_confirm_title")}
						</AlertDialogTitle>
						<AlertDialogDescription className="text-gray-400">
							{tPreview("delete_confirm_description")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="border-[#314d68] text-gray-300 hover:bg-[#223649]">
							{tPreview("delete_confirm_cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className="bg-red-600 text-white hover:bg-red-700"
						>
							{tPreview("delete_confirm_submit")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
