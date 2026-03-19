"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import type { Generation } from "./types";

interface FullscreenViewerProps {
	imageUrl: string;
	generations: Generation[];
	onClose: () => void;
	onNavigate: (direction: "prev" | "next") => void;
}

export function FullscreenViewer({
	imageUrl,
	generations,
	onClose,
	onNavigate,
}: FullscreenViewerProps) {
	const t = useTranslations("image_generator");
	const dialogRef = useRef<HTMLDivElement>(null);
	const completedGenerations = generations.filter(
		(g) => g.status === "complete" && g.imageUrl,
	);
	const hasMultipleImages = completedGenerations.length > 1;

	useEffect(() => {
		dialogRef.current?.focus();
	}, []);

	return (
		<div
			ref={dialogRef}
			className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8 select-none overflow-hidden"
			onClick={onClose}
			onKeyDown={(e) => {
				if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onClose();
				}
			}}
			role="dialog"
			aria-modal="true"
			aria-label={t("fullscreen_viewer_aria_label")}
			tabIndex={-1}
		>
			<div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
				<button
					type="button"
					onClick={onClose}
					className="absolute top-4 right-4 z-10 min-h-[44px] min-w-[44px] flex items-center justify-center bg-background/80 hover:bg-background/90 text-foreground p-2 rounded-lg transition-smooth"
					title="Close (ESC)"
					aria-label="Close fullscreen"
				>
					<svg
						className="w-5 h-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden
					>
						<title>Close</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
				{hasMultipleImages && (
					<>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onNavigate("prev");
							}}
							className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background/90 text-foreground p-3 rounded-lg transition-smooth"
							title="Previous (←)"
							aria-label="Previous image"
						>
							<svg
								className="w-6 h-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden
							>
								<title>Previous</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M15 19l-7-7 7-7"
								/>
							</svg>
						</button>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onNavigate("next");
							}}
							className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background/90 text-foreground p-3 rounded-lg transition-smooth"
							title="Next (→)"
							aria-label="Next image"
						>
							<svg
								className="w-6 h-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden
							>
								<title>Next</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 5l7 7-7 7"
								/>
							</svg>
						</button>
					</>
				)}
				{/* biome-ignore lint/a11y/noStaticElementInteractions: propagation stopper only, not interactive */}
				<div
					className="relative w-full h-full min-h-[50vh] max-h-[90vh] flex items-center justify-center"
					onClick={(e) => e.stopPropagation()}
					onKeyDown={(e) => e.stopPropagation()}
					role="presentation"
				>
					{/* biome-ignore lint/performance/noImgElement: Using native img to fix next/image fill prop issue */}
					<img
						src={imageUrl || "/placeholder.svg"}
						alt={t("fullscreen_alt")}
						className="max-w-[90vw] max-h-[90vh] object-contain mx-auto shadow-2xl"
					/>
				</div>
			</div>
		</div>
	);
}
