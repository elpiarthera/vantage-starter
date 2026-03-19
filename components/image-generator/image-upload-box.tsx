"use client";

import Image from "next/image";
import type React from "react";

import { cn } from "@/lib/utils";

interface ImageUploadBoxProps {
	imageNumber: 1 | 2;
	preview: string | null;
	onDrop: (e: React.DragEvent) => void;
	onClear: () => void;
	onSelect: () => void;
	uploadLabel?: string;
	secondImageLabel?: string;
	dragDropLabel?: string;
}

export function ImageUploadBox({
	imageNumber,
	preview,
	onDrop,
	onClear,
	onSelect,
	uploadLabel = "Upload Image",
	secondImageLabel = "Second Image",
	dragDropLabel = "(or drag & drop)",
}: ImageUploadBoxProps) {
	return (
		<button
			type="button"
			className={cn(
				"w-full h-[60px] sm:h-[80px] md:h-[100px] lg:h-[12vh] xl:h-[14vh] border border-border flex items-center justify-center cursor-pointer hover:border-primary transition-all bg-background/30 relative group text-left",
				preview && "border-primary",
			)}
			onDrop={onDrop}
			onDragOver={(e) => e.preventDefault()}
			onClick={onSelect}
			aria-label={`Upload image ${imageNumber}`}
		>
			{preview ? (
				<div className="w-full h-full p-1 sm:p-2 relative">
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onClear();
						}}
						className="absolute top-0 right-0 z-10 flex items-center justify-center min-h-[44px] min-w-[44px] translate-x-1/4 -translate-y-1/4 rounded-bl bg-background/80 hover:bg-destructive text-foreground hover:text-destructive-foreground transition-smooth shadow-lg"
						aria-label={`Clear image ${imageNumber}`}
					>
						<svg
							className="w-3 h-3 sm:w-4 sm:h-4"
							fill="none"
							stroke="currentColor"
							strokeWidth={2.5}
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<line x1="18" y1="6" x2="6" y2="18" />
							<line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					</button>
					<Image
						src={preview || "/placeholder.svg"}
						alt={`Upload ${imageNumber}`}
						fill
						className="object-contain"
						unoptimized={preview?.startsWith("blob:") === true}
					/>
				</div>
			) : (
				<div className="text-center text-muted-foreground py-1 sm:py-4">
					<svg
						className="w-3 h-3 sm:w-5 sm:h-5 md:w-6 md:h-6 mx-auto mb-1"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
						/>
					</svg>
					<p className="text-xs">
						{imageNumber === 1 ? uploadLabel : secondImageLabel}
					</p>
					<p className="text-[10px] text-muted-foreground mt-0.5 hidden lg:block">
						{dragDropLabel}
					</p>
				</div>
			)}
		</button>
	);
}
