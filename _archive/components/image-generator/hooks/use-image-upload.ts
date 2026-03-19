"use client";

import { useRef, useState } from "react";

export type ImageUploadTranslate = (key: string) => string;

export function useImageUpload(t: ImageUploadTranslate) {
	const [image1, setImage1] = useState<File | null>(null);
	const [image1Preview, setImage1Preview] = useState("");
	const [image1Url, setImage1Url] = useState("");
	const [image2, setImage2] = useState<File | null>(null);
	const [image2Preview, setImage2Preview] = useState("");
	const [image2Url, setImage2Url] = useState("");
	// Keep state variables for backward compatibility but they're no longer used
	const [isConvertingHeic] = useState(false);
	const [heicProgress] = useState(0);

	const showToast = useRef<
		((message: string, type?: "success" | "error") => void) | null
	>(null);

	/**
	 * Check if file is HEIC/HEIF format (not supported for client-side preview).
	 * HEIC files cause CSP issues with conversion libraries, so we reject them
	 * and ask users to convert to JPEG/PNG before uploading.
	 */
	const isHeicFormat = (file: File): boolean => {
		return (
			file.type.toLowerCase().includes("heic") ||
			file.type.toLowerCase().includes("heif") ||
			file.name.toLowerCase().endsWith(".heic") ||
			file.name.toLowerCase().endsWith(".heif")
		);
	};

	const validateImageFormat = (file: File): boolean => {
		// Supported formats that browsers can display natively
		const supportedTypes = [
			"image/jpeg",
			"image/jpg",
			"image/png",
			"image/webp",
			"image/gif",
			"image/bmp",
		];

		if (supportedTypes.includes(file.type.toLowerCase())) {
			return true;
		}

		const fileName = file.name.toLowerCase();
		const supportedExtensions = [
			".jpg",
			".jpeg",
			".png",
			".webp",
			".gif",
			".bmp",
		];
		return supportedExtensions.some((ext) => fileName.endsWith(ext));
	};

	const compressImage = async (
		file: File,
		maxWidth = 1280,
		quality = 0.75,
	): Promise<File> => {
		return new Promise((resolve, reject) => {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			if (!ctx) {
				reject(new Error("Canvas 2d context not available")); // internal; not shown to user
				return;
			}
			const img = new Image();

			img.onload = () => {
				let { width, height } = img;
				if (width > height) {
					if (width > maxWidth) {
						height = (height * maxWidth) / width;
						width = maxWidth;
					}
				} else {
					if (height > maxWidth) {
						width = (width * maxWidth) / height;
						height = maxWidth;
					}
				}

				canvas.width = width;
				canvas.height = height;
				ctx.drawImage(img, 0, 0, width, height);

				canvas.toBlob(
					(blob) => {
						if (blob) {
							const compressedFile = new File([blob], file.name, {
								type: "image/jpeg",
								lastModified: Date.now(),
							});
							resolve(compressedFile);
						} else {
							resolve(file);
						}
					},
					"image/jpeg",
					quality,
				);
			};

			img.onerror = () => {
				// If image fails to load (e.g., unsupported format), return original file
				resolve(file);
			};

			img.src = URL.createObjectURL(file);
		});
	};

	const handleImageUpload = async (file: File, imageNumber: 1 | 2) => {
		// Reject HEIC/HEIF files - they cause CSP issues and browsers can't display them
		if (isHeicFormat(file)) {
			showToast.current?.(t("heic_not_supported"), "error");
			return;
		}

		if (!validateImageFormat(file)) {
			showToast.current?.(t("invalid_image_file"), "error");
			return;
		}

		let processedFile = file;

		try {
			processedFile = await compressImage(processedFile);
		} catch (error) {
			console.error("Error compressing image:", error);
		}

		const reader = new FileReader();
		reader.onload = (e) => {
			const result = e.target?.result as string;

			if (imageNumber === 1) {
				setImage1(processedFile);
				setImage1Preview(result);
			} else {
				setImage2(processedFile);
				setImage2Preview(result);
			}
		};
		reader.onerror = () => {
			showToast.current?.(t("image_read_error"), "error");
		};
		reader.readAsDataURL(processedFile);
	};

	const handleUrlChange = (url: string, imageNumber: 1 | 2) => {
		if (imageNumber === 1) {
			setImage1Url(url);
			setImage1Preview(url);
			setImage1(null);
		} else {
			setImage2Url(url);
			setImage2Preview(url);
			setImage2(null);
		}
	};

	const clearImage = (imageNumber: 1 | 2) => {
		if (imageNumber === 1) {
			setImage1(null);
			setImage1Preview("");
			setImage1Url("");
		} else {
			setImage2(null);
			setImage2Preview("");
			setImage2Url("");
		}
	};

	return {
		image1,
		image1Preview,
		image1Url,
		image2,
		image2Preview,
		image2Url,
		isConvertingHeic,
		heicProgress,
		handleImageUpload,
		handleUrlChange,
		clearImage,
		showToast,
	};
}
