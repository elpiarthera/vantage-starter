/**
 * Client-side file validation
 * Server-side validation happens in Convex mutations
 */

export const FILE_VALIDATION = {
	image: {
		maxSize: 10 * 1024 * 1024, // 10MB
		allowedTypes: [
			"image/jpeg",
			"image/jpg",
			"image/png",
			"image/webp",
			"image/heic", // iOS photos
		],
		allowedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".heic"],
	},
	video: {
		maxSize: 50 * 1024 * 1024, // 50MB
		allowedTypes: [
			"video/mp4",
			"video/quicktime", // MOV files
			"video/webm",
		],
		allowedExtensions: [".mp4", ".mov", ".webm"],
	},
	audio: {
		maxSize: 10 * 1024 * 1024, // 10MB
		allowedTypes: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/m4a"],
		allowedExtensions: [".mp3", ".wav", ".m4a"],
	},
};

export function validateFile(
	file: File,
	assetType: "image" | "video" | "audio",
): { valid: boolean; error?: string } {
	const config = FILE_VALIDATION[assetType];

	// Check file size
	if (file.size > config.maxSize) {
		return {
			valid: false,
			error: `File too large. Maximum size: ${config.maxSize / 1024 / 1024}MB`,
		};
	}

	// Check MIME type
	if (!config.allowedTypes.includes(file.type)) {
		return {
			valid: false,
			error: `Invalid file type. Allowed: ${config.allowedExtensions.join(", ")}`,
		};
	}

	// Check file extension
	const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
	if (!config.allowedExtensions.includes(extension)) {
		return {
			valid: false,
			error: `Invalid file extension. Allowed: ${config.allowedExtensions.join(", ")}`,
		};
	}

	return { valid: true };
}

export function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
}
