"use client";

import { FileIcon, ImageIcon, Loader2, Upload, Video, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
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
import { Progress } from "@/components/ui/progress";
import { useDevice } from "@/contexts/DeviceContext";
import type { Id } from "@/convex/_generated/dataModel";
import { useFileUpload } from "@/hooks/useFileUpload";

interface AssetUploadModalProps {
	projectId: Id<"projects">;
	isOpen: boolean;
	onClose: () => void;
	onUploadComplete?: (assetIds: Id<"assets">[], urls: string[]) => void;
}

export function AssetUploadModal({
	projectId,
	isOpen,
	onClose,
	onUploadComplete,
}: AssetUploadModalProps) {
	const { isMobile } = useDevice();
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const [isDragging, setIsDragging] = useState(false);
	const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
	const [uploadProgress, setUploadProgress] = useState(0);
	const { uploadFile } = useFileUpload();
	const t = useTranslations("asset_upload_modal");
	const tCommon = useTranslations("common");

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(event.target.files || []);
		setSelectedFiles(files);
	};

	const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		setIsDragging(false);
		const files = Array.from(event.dataTransfer.files);
		setSelectedFiles(files);
	};

	const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = () => {
		setIsDragging(false);
	};

	const handleUpload = async () => {
		if (selectedFiles.length === 0) return;

		const uploadedAssets: { assetId: Id<"assets">; url: string }[] = [];

		try {
			// Upload files sequentially with progress tracking
			for (let i = 0; i < selectedFiles.length; i++) {
				const file = selectedFiles[i];
				setUploadingIndex(i);
				setUploadProgress(0);

				// Determine asset type from file MIME type
				const assetType = file.type.startsWith("image/")
					? "image"
					: file.type.startsWith("video/")
						? "video"
						: "audio";

				toast.info(t("uploading_file", { fileName: file.name }), {
					id: `upload-${i}`,
				});

				const result = await uploadFile(file, {
					assetType,
					projectId,
					onProgress: (progress) => {
						setUploadProgress(progress);
					},
				});

				if (result.error) {
					toast.error(t("failed_to_upload", { fileName: file.name }), {
						id: `upload-${i}`,
						description: result.error,
					});
					continue;
				}

				// Type guard: result has assetId and url (no error)
				if (result.assetId && result.url) {
					uploadedAssets.push({
						assetId: result.assetId,
						url: result.url,
					});

					toast.success(t("upload_success", { fileName: file.name }), {
						id: `upload-${i}`,
					});
				}
			}

			// Notify parent of successful uploads
			if (onUploadComplete && uploadedAssets.length > 0) {
				onUploadComplete(
					uploadedAssets.map((a) => a.assetId),
					uploadedAssets.map((a) => a.url),
				);
			}

			// Reset and close
			setSelectedFiles([]);
			setUploadingIndex(null);
			setUploadProgress(0);
			onClose();
		} catch (error) {
			console.error("Upload error:", error);
			toast.error(t("upload_failed_title"), {
				description:
					error instanceof Error
						? error.message
						: t("upload_failed_description"),
			});
		}
	};

	const handleRemoveFile = (index: number) => {
		setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
	};

	const formatSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	};

	const getFileIcon = (file: File) => {
		if (file.type.startsWith("image/"))
			return <ImageIcon className="h-5 w-5 text-[#0d7ff2]" />;
		if (file.type.startsWith("video/"))
			return <Video className="h-5 w-5 text-[#0d7ff2]" />;
		return <FileIcon className="h-5 w-5 text-gray-400" />;
	};

	const isUploading = uploadingIndex !== null;

	const content = (
		<div className="space-y-4 md:space-y-6">
			{/* Dropzone */}
			{/* biome-ignore lint/a11y/useSemanticElements: dropzone needs div for drag-and-drop functionality */}
			<div
				onDrop={handleDrop}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				role="button"
				tabIndex={0}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						document.getElementById("file-input-modal")?.click();
					}
				}}
				className={`
          relative border-2 border-dashed rounded-lg p-8 md:p-12
          flex flex-col items-center justify-center
          min-h-[200px] md:min-h-[240px]
          transition-colors
          ${isDragging ? "border-[#0d7ff2] bg-[#0d7ff2]/10" : "border-[#314d68] bg-[#223649]"}
          ${isMobile ? "active:bg-[#2a4159]" : "hover:bg-[#2a4159]"}
          ${isUploading ? "opacity-50 pointer-events-none" : ""}
        `}
			>
				<Upload className="h-12 w-12 md:h-16 md:w-16 text-gray-400 mb-4" />
				<p className="text-base md:text-lg text-white font-medium mb-2 text-center">
					{isDragging ? t("drop_files_here") : t("drag_drop_files")}
				</p>
				<p className="text-sm text-gray-400 mb-4 text-center">
					{t("or_click_to_browse")}
				</p>
				<input
					id="file-input-modal"
					type="file"
					multiple
					accept="image/*,video/*"
					onChange={handleFileSelect}
					disabled={isUploading}
					className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
					// Enable camera on mobile
					capture={isMobile ? "environment" : undefined}
				/>
				<p className="text-xs text-gray-500 text-center">
					{t("supported_formats")}
				</p>
			</div>

			{/* Selected Files */}
			{selectedFiles.length > 0 && (
				<div className="space-y-2">
					<h3 className="text-sm font-medium text-white">
						{t("selected_files_header", { count: selectedFiles.length })}
					</h3>
					<div className="space-y-2 max-h-[200px] overflow-y-auto">
						{selectedFiles.map((file, index) => (
							<div
								key={`${file.name}-${index}`}
								className="flex items-center gap-3 p-3 bg-[#223649] rounded-lg border border-[#314d68]"
							>
								{getFileIcon(file)}
								<div className="flex-1 min-w-0">
									<p className="text-sm text-white truncate">{file.name}</p>
									<p className="text-xs text-gray-400">
										{formatSize(file.size)}
									</p>
								</div>
								{uploadingIndex === index ? (
									<Loader2 className="h-4 w-4 animate-spin text-[#0d7ff2]" />
								) : (
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleRemoveFile(index)}
										disabled={isUploading}
										className={`
                      min-h-[36px] min-w-[36px] p-0
                      text-gray-400
                      ${isMobile ? "active:text-red-400" : "hover:text-red-400"}
                      disabled:opacity-50
                    `}
									>
										<X className="h-4 w-4" />
									</Button>
								)}
							</div>
						))}
					</div>
				</div>
			)}

			{/* Upload Progress */}
			{isUploading && (
				<div className="space-y-2">
					<div className="flex justify-between text-sm">
						<span className="text-white">
							{t("uploading_progress", {
								current: (uploadingIndex || 0) + 1,
								total: selectedFiles.length,
							})}
						</span>
						<span className="text-gray-400">{uploadProgress}%</span>
					</div>
					<Progress value={uploadProgress} className="h-2" />
				</div>
			)}

			{/* Actions */}
			<div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
				<Button
					onClick={onClose}
					variant="outline"
					disabled={isUploading}
					className={`
            min-h-[44px] flex-1
            bg-[#182634] border-[#314d68] text-white
            ${isMobile ? "active:bg-[#223649]" : "hover:bg-[#223649]"}
            disabled:opacity-50
          `}
				>
					{isUploading ? t("uploading_button") : tCommon("cancel")}
				</Button>
				<Button
					onClick={handleUpload}
					disabled={selectedFiles.length === 0 || isUploading}
					className={`
            min-h-[44px] flex-1
            bg-[#0d7ff2] text-white
            ${isMobile ? "active:bg-[#0b6dd4]" : "hover:bg-[#0b6dd4]"}
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
				>
					{isUploading ? (
						<>
							<Loader2 className="h-4 w-4 mr-2 animate-spin" />
							{t("uploading_button")}
						</>
					) : (
						<>
							<Upload className="h-4 w-4 mr-2" />
							{t("upload_button", { count: selectedFiles.length })}
						</>
					)}
				</Button>
			</div>
		</div>
	);

	if (isMobile) {
		return (
			<Drawer open={isOpen} onOpenChange={isUploading ? undefined : onClose}>
				<DrawerContent className="bg-[#182634] border-[#314d68]">
					<DrawerHeader className="border-b border-[#314d68]">
						<DrawerTitle className="text-white">
							{t("upload_assets_title")}
						</DrawerTitle>
					</DrawerHeader>
					<div className="p-4 pb-8">{content}</div>
				</DrawerContent>
			</Drawer>
		);
	}

	return (
		<Dialog open={isOpen} onOpenChange={isUploading ? undefined : onClose}>
			<DialogContent className="bg-[#182634] border-[#314d68] max-w-2xl">
				<DialogHeader>
					<DialogTitle className="text-white">
						{t("upload_assets_title")}
					</DialogTitle>
				</DialogHeader>
				{content}
			</DialogContent>
		</Dialog>
	);
}
