"use client";

import { Loader2 } from "lucide-react";
import Image from "next/image";
import type React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Generation } from "./types";

interface GenerationHistoryProps {
	generations: Generation[];
	selectedId?: string | null;
	onSelect: (id: string | null) => void;
	onCancel: (id: string) => void;
	onDelete?: (id: string) => Promise<void>;
	isLoading?: boolean;
	hasMore?: boolean;
	onLoadMore?: () => void;
	isLoadingMore?: boolean;
	className?: string;
	compact?: boolean;
	/** When set, empty state shows this title, description, and CTA button (design system). */
	emptyStateTitle?: string;
	emptyStateDescription?: string;
	emptyStateCtaLabel?: string;
	onEmptyStateCta?: () => void;
	/** Override "History" heading. */
	historyLabel?: string;
	/** Override "No generations yet" fallback empty label. */
	noGenerationsLabel?: string;
	/** Override "Cancel" button label inside loading thumbnail. */
	cancelLabel?: string;
	/** Override "Load More" button label in history strip. */
	loadMoreLabel?: string;
	/** Override "Delete generation" aria-label. */
	deleteAriaLabel?: string;
	/** Override "Generation failed" sr-only label on error thumbnails. */
	failedLabel?: string;
}

export function GenerationHistory({
	generations,
	selectedId,
	onSelect,
	onCancel,
	onDelete,
	isLoading = false,
	hasMore = false,
	onLoadMore,
	isLoadingMore = false,
	className,
	compact = false,
	emptyStateTitle,
	emptyStateDescription,
	emptyStateCtaLabel,
	onEmptyStateCta,
	historyLabel = "History",
	noGenerationsLabel = "No generations yet",
	cancelLabel = "Cancel",
	loadMoreLabel = "Load\nMore",
	deleteAriaLabel = "Delete generation",
	failedLabel = "Generation failed",
}: GenerationHistoryProps) {
	const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const handleDelete = async (e: React.MouseEvent, id: string) => {
		e.stopPropagation();

		if (!onDelete) return;

		setDeletingId(id);
		try {
			await onDelete(id);
		} catch (error) {
			console.error("Failed to delete generation:", error);
		} finally {
			setDeletingId(null);
		}
	};

	return (
		<div className={cn("flex flex-col w-full", className)}>
			{!compact && (
				<h4 className="text-xs md:text-sm font-medium text-muted-foreground mb-1">
					{historyLabel}
				</h4>
			)}
			<div
				className={cn(
					"w-full flex gap-1 overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent items-end",
					compact ? "pb-1 h-20 md:h-28" : "pb-2",
					generations.length === 0 && emptyStateTitle
						? "min-h-[140px] flex-col justify-center"
						: "h-20 md:h-28",
				)}
			>
				{isLoading ? (
					<div className="flex items-center justify-center w-full h-20 md:h-28 text-muted-foreground">
						<Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin" />
					</div>
				) : generations.length === 0 && emptyStateTitle ? (
					<div className="flex flex-col items-center justify-center w-full py-4 px-2 text-center">
						<div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-muted flex items-center justify-center mb-3">
							<svg
								className="w-6 h-6 md:w-7 md:h-7 text-muted-foreground"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden
								role="img"
							>
								<title>Images</title>
								<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
								<circle cx="8.5" cy="8.5" r="1.5" />
								<polyline points="21,15 16,10 5,21" />
							</svg>
						</div>
						<p className="text-sm font-medium text-foreground">
							{emptyStateTitle}
						</p>
						{emptyStateDescription && (
							<p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
								{emptyStateDescription}
							</p>
						)}
						{emptyStateCtaLabel && onEmptyStateCta && (
							<button
								type="button"
								onClick={onEmptyStateCta}
								className="mt-3 min-h-[44px] px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
							>
								{emptyStateCtaLabel}
							</button>
						)}
					</div>
				) : generations.length === 0 ? (
					<div className="flex items-center justify-center w-full h-20 md:h-28 text-muted-foreground text-xs md:text-sm">
						{noGenerationsLabel}
					</div>
				) : (
					<>
						{generations.map((gen, index) => (
							<button
								type="button"
								key={gen.id}
								onClick={() => onSelect(gen.id)}
								className={cn(
									"relative flex-shrink-0 w-18 h-18 md:w-24 md:h-24 overflow-hidden transition-all cursor-pointer group border-0 bg-transparent p-0 block text-left",
									selectedId === gen.id
										? "border-2 border-primary opacity-100"
										: "border border-border hover:border-border opacity-60 hover:opacity-100",
									index === 0 &&
										"animate-in fade-in-0 slide-in-from-left-4 duration-500",
									deletingId === gen.id && "opacity-50 pointer-events-none",
								)}
								aria-label={`Generation ${index + 1}${gen.prompt ? `: ${gen.prompt.slice(0, 60)}` : ""}`}
							>
								{gen.status === "loading" ? (
									<div className="absolute inset-0 flex flex-col items-center justify-center">
										<span className="text-sm md:text-base text-foreground/90 font-mono font-semibold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
											{Math.round(gen.progress)}%
										</span>
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												onCancel(gen.id);
											}}
											className="mt-1 min-h-[44px] min-w-[44px] flex items-center justify-center px-3 text-xs rounded bg-muted/30 hover:bg-foreground text-foreground hover:text-background transition-smooth"
											aria-label={cancelLabel}
										>
											{cancelLabel}
										</button>
									</div>
								) : gen.status === "error" ? (
									<div className="absolute inset-0 bg-background/50 flex items-center justify-center">
										<svg
											className="w-6 h-6 text-muted-foreground"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											aria-hidden
											role="img"
										>
											<title>Error</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M6 18L18 6M6 6l12 12"
											/>
										</svg>
										<span className="sr-only">{failedLabel}</span>
										{onDelete && (
											<button
												type="button"
												onClick={(e) => handleDelete(e, gen.id)}
												disabled={deletingId === gen.id}
												className="absolute top-0 right-0 flex items-center justify-center min-h-[44px] min-w-[44px] translate-x-1/4 -translate-y-1/4 rounded-bl bg-background/70 hover:bg-destructive text-foreground hover:text-destructive-foreground transition-smooth disabled:opacity-50 z-10"
												aria-label={deleteAriaLabel}
											>
												{deletingId === gen.id ? (
													<Loader2 className="w-3 h-3 animate-spin" />
												) : (
													<svg
														className="w-3 h-3"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
														strokeWidth={2}
														aria-hidden
														role="img"
													>
														<title>Delete</title>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															d="M6 18L18 6M6 6l12 12"
														/>
													</svg>
												)}
											</button>
										)}
									</div>
								) : (
									<>
										{onDelete && (
											<button
												type="button"
												onClick={(e) => handleDelete(e, gen.id)}
												disabled={deletingId === gen.id}
												className="absolute top-0 right-0 flex items-center justify-center min-h-[44px] min-w-[44px] translate-x-1/4 -translate-y-1/4 rounded-bl bg-background/70 hover:bg-destructive text-foreground hover:text-destructive-foreground opacity-0 group-hover:opacity-100 active:opacity-100 transition-smooth disabled:opacity-50 z-10"
												aria-label={deleteAriaLabel}
											>
												{deletingId === gen.id ? (
													<Loader2 className="w-3 h-3 animate-spin" />
												) : (
													<svg
														className="w-3 h-3"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
														strokeWidth={2}
														aria-hidden
														role="img"
													>
														<title>Delete</title>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															d="M6 18L18 6M6 6l12 12"
														/>
													</svg>
												)}
											</button>
										)}
										<Image
											src={gen.imageUrl || "/placeholder.svg"}
											alt={gen.prompt || "Generated image"}
											fill
											sizes="(max-width: 768px) 80px, 96px"
											className={cn(
												"object-cover transition-opacity duration-300",
												loadedImages.has(gen.id) ? "opacity-100" : "opacity-0",
											)}
											onLoad={() => {
												setLoadedImages((prev) => new Set(prev).add(gen.id));
											}}
											unoptimized={gen.imageUrl?.includes("blob:") ?? false}
										/>
										{!loadedImages.has(gen.id) && (
											<div className="absolute inset-0 bg-muted animate-pulse" />
										)}
									</>
								)}
							</button>
						))}
						{hasMore && onLoadMore && (
							<button
								type="button"
								onClick={onLoadMore}
								disabled={isLoadingMore}
								className="flex-shrink-0 w-18 h-18 md:w-24 md:h-24 border border-border hover:border-primary bg-background/30 hover:bg-background/50 transition-all flex items-center justify-center text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
								aria-label={loadMoreLabel}
							>
								{isLoadingMore ? (
									<Loader2 className="w-5 h-5 animate-spin" />
								) : (
									<span className="font-medium whitespace-pre-line text-center">
										{loadMoreLabel}
									</span>
								)}
							</button>
						)}
					</>
				)}
			</div>
		</div>
	);
}
