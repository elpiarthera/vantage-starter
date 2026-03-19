"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useFileUpload } from "@/hooks/useFileUpload";
import { trackUserInteraction } from "@/lib/monitoring/analytics";

interface UseAssetManagementOptions {
	projectId?: Id<"projects">;
	sceneId?: Id<"scenes">;
	assetType?: "image" | "video" | "audio";
	frameType?: "start" | "end";
}

interface Asset {
	_id: Id<"assets">;
	url: string;
	filename: string;
	size: number;
	type: "image" | "video" | "audio";
	projectId?: Id<"projects">;
	sceneId?: Id<"scenes">;
	uploadedAt: number;
}

export function useAssetManagement(options: UseAssetManagementOptions = {}) {
	const [deleting, setDeleting] = useState<Id<"assets"> | null>(null);
	const [uploadedAssets, setUploadedAssets] = useState<Asset[]>([]);

	// Query assets with filters from Convex
	// Note: For "Project Assets" we only filter by projectId (not sceneId)
	// because generated images are stored with projectId but not sceneId
	const assets = useQuery(
		api.assets.list,
		options.projectId
			? {
					projectId: options.projectId,
					// Don't filter by sceneId for project assets - images are stored at project level
					assetType: options.assetType,
				}
			: "skip", // Skip query if no projectId (avoid loading all assets)
	);

	// Mutation for deleting assets
	const removeAssetMutation = useMutation(api.assets.remove);

	// Action for generating AI images
	const generateFrameImageAction = useAction(
		api.actions.imageGeneration.generateFrameImage,
	);

	// File upload hook
	const { uploadFile, uploading } = useFileUpload();

	// Delete asset with confirmation
	const deleteAsset = async (assetId: Id<"assets">) => {
		try {
			setDeleting(assetId);
			trackUserInteraction("delete_asset", "AssetManagement", {
				assetId,
			});

			await removeAssetMutation({ assetId });

			toast.success("Asset deleted successfully");
			trackUserInteraction("delete_asset_completed", "AssetManagement", {
				success: true,
			});
		} catch (error) {
			console.error("[AssetManagement] Delete error:", error);
			toast.error("Failed to delete asset");
			trackUserInteraction("delete_asset_completed", "AssetManagement", {
				success: false,
			});
		} finally {
			setDeleting(null);
		}
	};

	// Upload asset and add to local state
	const uploadAsset = async (file: File) => {
		try {
			trackUserInteraction("upload_asset", "AssetManagement", {
				filename: file.name,
				size: file.size,
			});

			const result = await uploadFile(file, {
				assetType: options.assetType || "image",
				projectId: options.projectId,
				sceneId: options.sceneId,
			});

			if (result.error) {
				toast.error(result.error);
				return null;
			}

			toast.success("Asset uploaded successfully");
			trackUserInteraction("upload_asset_completed", "AssetManagement", {
				success: true,
			});

			// Add to local uploaded assets for immediate display
			if (result.assetId && result.url) {
				const newAsset: Asset = {
					_id: result.assetId as Id<"assets">,
					url: result.url,
					filename: file.name,
					size: file.size,
					type: (options.assetType || "image") as "image" | "video" | "audio",
					projectId: options.projectId,
					sceneId: options.sceneId,
					uploadedAt: Date.now(),
				};
				setUploadedAssets((prev) => [newAsset, ...prev]);
			}

			return result.url;
		} catch (error) {
			console.error("[AssetManagement] Upload error:", error);
			toast.error("Failed to upload asset");
			trackUserInteraction("upload_asset_completed", "AssetManagement", {
				success: false,
			});
			return null;
		}
	};

	// Generate AI image using Convex action
	// Supports both text-to-image and image-to-image transformation
	const generateAIImage = async (
		prompt: string,
		referenceImage?: string,
	): Promise<string> => {
		if (!options.sceneId || !options.projectId) {
			throw new Error("sceneId and projectId are required for AI generation");
		}

		try {
			const isImageToImage = !!referenceImage;
			trackUserInteraction(
				isImageToImage ? "transform_ai_image" : "generate_ai_image",
				"AssetManagement",
				{
					promptLength: prompt.length,
					hasReferenceImage: isImageToImage,
					mode: isImageToImage ? "image-to-image" : "text-to-image",
				},
			);

			const result = await generateFrameImageAction({
				sceneId: options.sceneId,
				projectId: options.projectId,
				frameType: options.frameType || "start",
				prompt,
				referenceImageUrl: referenceImage, // Pass reference image for image-to-image transformation
			});

			if (!result.imageUrl) {
				throw new Error("No image URL returned from generation");
			}

			trackUserInteraction("generate_ai_image_completed", "AssetManagement", {
				success: true,
			});

			return result.imageUrl;
		} catch (error) {
			console.error("[AssetManagement] AI generation error:", error);
			trackUserInteraction("generate_ai_image_completed", "AssetManagement", {
				success: false,
			});
			throw error;
		}
	};

	return {
		// Data from Convex
		assets: (assets || []) as Asset[],
		loading: assets === undefined,

		// Uploaded assets (session state for immediate display)
		uploadedAssets,

		// Actions
		deleteAsset,
		uploadAsset,
		generateAIImage,

		// State
		deleting,
		uploading,
	};
}
