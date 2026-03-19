import { trackEvent } from "@/lib/monitoring/analytics";

export interface UploadResult {
	success: boolean;
	url?: string;
	error?: string;
}

export async function uploadAsset(file: File): Promise<UploadResult> {
	trackEvent("asset_upload_started", {
		fileName: file.name,
		fileSize: file.size,
		fileType: file.type,
	});

	try {
		// Validate file type
		if (!file.type.startsWith("image/")) {
			throw new Error("Only image files are supported");
		}

		// Validate file size (max 10MB for demo)
		const maxSize = 10 * 1024 * 1024; // 10MB
		if (file.size > maxSize) {
			throw new Error("File size must be less than 10MB");
		}

		// Simulate upload delay
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// In demo mode, create object URL for local preview
		const url = URL.createObjectURL(file);

		const result: UploadResult = {
			success: true,
			url,
		};

		trackEvent("asset_upload_completed", {
			fileName: file.name,
			fileSize: file.size,
			success: true,
		});

		return result;
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";

		trackEvent("asset_upload_failed", {
			fileName: file.name,
			error: errorMessage,
		});

		return {
			success: false,
			error: errorMessage,
		};
	}
}

export async function uploadMultipleAssets(
	files: FileList,
): Promise<UploadResult[]> {
	const results: UploadResult[] = [];

	for (let i = 0; i < files.length; i++) {
		const result = await uploadAsset(files[i]);
		results.push(result);
	}

	return results;
}

export function revokeAssetUrl(url: string): void {
	try {
		URL.revokeObjectURL(url);
		trackEvent("asset_url_revoked", { url });
	} catch (error) {
		console.warn("[AssetUpload] Failed to revoke URL:", error);
	}
}
