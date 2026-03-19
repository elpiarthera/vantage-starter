"use client";

import { useQuery } from "convex/react";
import { ImageIcon, Lightbulb, Sparkles } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

/**
 * InspirationEmptyState - Shows curated prompts when no images generated
 * Sprint 30e.4: Inspiration Empty State
 *
 * Fetches categories from Convex toolCategories for the image_generator tool.
 * Falls back to a simple empty state if no categories exist.
 */

interface InspirationEmptyStateProps {
	/** Callback when user clicks a category to use its prompt */
	onSelectPrompt: (prompt: string, params?: Record<string, unknown>) => void;
	/** Callback to open full inspiration wall (Sprint 30f) */
	onSeeMore?: () => void;
	/** Additional CSS classes */
	className?: string;
}

export function InspirationEmptyState({
	onSelectPrompt,
	onSeeMore,
	className,
}: InspirationEmptyStateProps) {
	const t = useTranslations("image_generator");

	// Fetch the image_generator tool
	const imageGeneratorTool = useQuery(api.tools.getByKey, {
		key: "image_generator",
	});

	// Fetch categories for the tool (skip if tool not found)
	const categories = useQuery(
		api.tools.listCategories,
		imageGeneratorTool ? { toolId: imageGeneratorTool._id } : "skip",
	);

	// Take first 4 categories for preview
	const previewCategories = categories?.slice(0, 4) ?? [];
	const isLoading =
		imageGeneratorTool === undefined || categories === undefined;
	const hasCategories = previewCategories.length > 0;

	// Render a category card
	const renderCategoryCard = (
		category: (typeof previewCategories)[number],
		index: number,
	) => {
		const name = category.nameTranslationKey
			? t(category.nameTranslationKey, { fallback: category.name })
			: category.name;

		// Use description as prompt, or fall back to a translated prompt
		const prompt =
			category.description ??
			t("empty_state.fallback_prompt", { category: name.toLowerCase() });

		return (
			<button
				key={category._id}
				type="button"
				onClick={() => onSelectPrompt(prompt)}
				className={cn(
					"group relative overflow-hidden rounded-xl border border-border/30 bg-background/40 backdrop-blur-sm",
					"transition-smooth hover:border-primary/50 hover:bg-background/60 active:scale-[0.98]",
					"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
					"aspect-[4/3] w-full",
				)}
			>
				{/* Background image or gradient */}
				{category.imageUrl ? (
					<Image
						src={category.imageUrl}
						alt={name}
						fill
						className="object-cover opacity-60 group-hover:opacity-80 transition-smooth"
					/>
				) : (
					<div
						className={cn(
							"absolute inset-0 opacity-30",
							// Gradient based on index for variety
							index % 4 === 0 &&
								"bg-gradient-to-br from-primary/30 to-purple-500/30",
							index % 4 === 1 &&
								"bg-gradient-to-br from-blue-500/30 to-cyan-500/30",
							index % 4 === 2 &&
								"bg-gradient-to-br from-orange-500/30 to-red-500/30",
							index % 4 === 3 &&
								"bg-gradient-to-br from-green-500/30 to-teal-500/30",
						)}
					/>
				)}

				{/* Content overlay */}
				<div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
					<Sparkles
						className="size-6 text-primary mb-2 opacity-80"
						aria-hidden="true"
					/>
					<span className="text-sm font-medium text-foreground line-clamp-2">
						{name}
					</span>
				</div>
			</button>
		);
	};

	// Loading skeleton
	if (isLoading) {
		return (
			<div className={cn("flex flex-col items-center gap-6 p-8", className)}>
				<Skeleton className="h-12 w-12 rounded-full" />
				<Skeleton className="h-6 w-48" />
				<div className="grid grid-cols-2 gap-3 w-full max-w-md">
					{[0, 1, 2, 3].map((i) => (
						<Skeleton key={i} className="aspect-[4/3] rounded-xl" />
					))}
				</div>
			</div>
		);
	}

	// No categories - show simple empty state
	if (!hasCategories) {
		return (
			<div
				className={cn(
					"flex flex-col items-center justify-center gap-4 p-8 text-center",
					className,
				)}
			>
				<div className="flex size-16 items-center justify-center rounded-full bg-muted/50">
					<ImageIcon className="size-8 text-muted-foreground" />
				</div>
				<div className="space-y-2">
					<h3 className="text-lg font-semibold text-foreground">
						{t("empty_state.title")}
					</h3>
					<p className="text-sm text-muted-foreground max-w-xs">
						{t("empty_state.description")}
					</p>
				</div>
			</div>
		);
	}

	// Categories available - show inspiration grid
	return (
		<div
			className={cn("flex flex-col items-center gap-6 p-6 md:p-8", className)}
		>
			{/* Header */}
			<div className="flex flex-col items-center gap-2 text-center">
				<div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
					<Lightbulb className="size-6 text-primary" />
				</div>
				<h3 className="text-lg font-semibold text-foreground">
					{t("empty_state.title")}
				</h3>
				<p className="text-sm text-muted-foreground max-w-xs">
					{t("empty_state.description")}
				</p>
			</div>

			{/* 2x2 Grid of category cards */}
			<div className="grid grid-cols-2 gap-3 w-full max-w-md">
				{previewCategories.map((category, index) =>
					renderCategoryCard(category, index),
				)}
			</div>

			{/* See more button (for Sprint 30f) - 44px touch target */}
			{onSeeMore && categories && categories.length > 4 && (
				<Button
					variant="ghost"
					onClick={onSeeMore}
					className="min-h-[44px] text-sm text-muted-foreground hover:text-foreground"
				>
					{t("empty_state.see_more")}
				</Button>
			)}
		</div>
	);
}
