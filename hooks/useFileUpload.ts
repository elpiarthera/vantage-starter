"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { validateFile } from "@/lib/validation/fileValidation";

interface UploadOptions {
	assetType: "image" | "video" | "audio";
	projectId?: Id<"projects">;
	sceneId?: Id<"scenes">;
	onProgress?: (progress: number) => void;
}

interface UploadResult {
	assetId: Id<"assets">;
	url: string;
	error?: never;
}

interface UploadError {
	assetId?: never;
	url?: never;
	error: string;
}

export function useFileUpload() {
	const [uploading, setUploading] = useState(false);
	const [progress, setProgress] = useState(0);

	const generateUploadUrl = useMutation(api.files.generateUploadUrl);
	const saveFileMetadata = useMutation(api.files.saveFileMetadata);

	const uploadFile = async (
		file: File,
		options: UploadOptions,
	): Promise<UploadResult | UploadError> => {
		const maxRetries = 3;
		let attempt = 0;

		while (attempt < maxRetries) {
			try {
				setUploading(true);
				setProgress(0);

				// Client-side validation
				const validation = validateFile(file, options.assetType);
				if (!validation.valid) {
					return { error: validation.error as string };
				}

				// Step 1: Get upload URL from Convex
				options.onProgress?.(10);
				setProgress(10);
				const uploadUrl = await generateUploadUrl();

				// Step 2: Upload file to Convex storage with retry logic
				options.onProgress?.(20);
				setProgress(20);

				const response = await fetch(uploadUrl, {
					method: "POST",
					headers: { "Content-Type": file.type },
					body: file,
				});

				if (!response.ok) {
					// If upload fails, retry with exponential backoff
					if (attempt < maxRetries - 1) {
						attempt++;
						const backoffMs = 2 ** attempt * 1000; // 2s, 4s, 8s
						console.log(
							`Upload failed, retrying in ${backoffMs}ms (attempt ${attempt}/${maxRetries})...`,
						);
						await new Promise((resolve) => setTimeout(resolve, backoffMs));
						continue; // Retry
					}
					throw new Error(
						`Upload failed after ${maxRetries} attempts: ${response.statusText}`,
					);
				}

				options.onProgress?.(70);
				setProgress(70);

				// Get storage ID from response
				const { storageId } = await response.json();

				// Step 3: Save metadata to database (with retry)
				options.onProgress?.(90);
				setProgress(90);

				let metadataResult: { assetId: Id<"assets">; url: string };
				try {
					metadataResult = await saveFileMetadata({
						storageId,
						fileName: file.name,
						fileType: file.type,
						fileSize: file.size,
						assetType: options.assetType,
						projectId: options.projectId,
						sceneId: options.sceneId,
					});
				} catch (_metadataError) {
					// If metadata save fails, retry
					if (attempt < maxRetries - 1) {
						attempt++;
						const backoffMs = 2 ** attempt * 1000;
						console.log(`Metadata save failed, retrying in ${backoffMs}ms...`);
						await new Promise((resolve) => setTimeout(resolve, backoffMs));
						continue; // Retry
					}
					throw new Error("Failed to save file metadata");
				}

				options.onProgress?.(100);
				setProgress(100);
				setUploading(false);

				return {
					assetId: metadataResult.assetId,
					url: metadataResult.url,
				};
			} catch (error) {
				// If we've exhausted retries, return error
				if (attempt >= maxRetries - 1) {
					setUploading(false);
					setProgress(0);

					const errorMessage =
						error instanceof Error ? error.message : "Upload failed";
					console.error("Upload error after retries:", errorMessage);

					return { error: errorMessage };
				}

				// Otherwise, retry
				attempt++;
				const backoffMs = 2 ** attempt * 1000;
				console.log(
					`Error occurred, retrying in ${backoffMs}ms (attempt ${attempt}/${maxRetries})...`,
				);
				await new Promise((resolve) => setTimeout(resolve, backoffMs));
			}
		}

		// Should never reach here, but TypeScript requires it
		return { error: "Upload failed after all retries" };
	};

	return {
		uploadFile,
		uploading,
		progress,
	};
}
