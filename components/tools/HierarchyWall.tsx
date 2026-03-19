/**
 * Hierarchy Wall Component
 * Sprint 24: Tool Selection Wall Feature
 *
 * User-facing wall for navigating 4-level tool hierarchy
 * Ported from: vertical-ai-alpha/components/commerce/hierarchy-wall.tsx
 *
 * Features:
 * - Bento grid layout (first item large)
 * - Framer Motion animations
 * - 4-level navigation: Tools → Categories → SubCategories → Themes
 * - Expand/collapse for items beyond 4
 * - MyShortReel design tokens
 * - Full i18n support
 */

"use client";

import { useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronLeft, ChevronUp } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";

interface HierarchyWallProps {
	onSelectItem: (payload: {
		level: "tool" | "category" | "subcategory" | "theme";
		id: Id<any>;
		key: string;
		toolId?: Id<"tools">;
		categoryId?: Id<"toolCategories">;
		subcategoryId?: Id<"toolSubCategories">;
	}) => void;
}

type NavigationLevel = "meta" | "category" | "subcategory" | "theme";

interface NavigationState {
	level: NavigationLevel;
	toolId?: Id<"tools">;
	categoryId?: Id<"toolCategories">;
	subcategoryId?: Id<"toolSubCategories">;
}

export function HierarchyWall({ onSelectItem }: HierarchyWallProps) {
	const t = useTranslations("tools.hierarchy_wall");
	const locale = useLocale();
	const router = useRouter();
	const [navigationState, setNavigationState] = useState<NavigationState>({
		level: "meta",
	});
	const [isExpanded, setIsExpanded] = useState(false);

	// Fetch current level items based on navigation state
	const tools = useQuery(
		api.tools.listActiveTools,
		navigationState.level === "meta" ? {} : "skip",
	);

	const categories = useQuery(
		api.tools.listCategories,
		navigationState.level === "category" && navigationState.toolId
			? { toolId: navigationState.toolId }
			: "skip",
	);

	const subcategories = useQuery(
		api.tools.listSubCategories,
		navigationState.level === "subcategory" && navigationState.categoryId
			? { categoryId: navigationState.categoryId }
			: "skip",
	);

	const themes = useQuery(
		api.tools.listThemes,
		navigationState.level === "theme" && navigationState.subcategoryId
			? { subcategoryId: navigationState.subcategoryId }
			: "skip",
	);

	const wallConfig = useQuery(
		api.tools.getWallConfig,
		navigationState.level === "meta"
			? { level: "tool" }
			: navigationState.level === "category" && navigationState.toolId
				? { level: "category", toolId: navigationState.toolId }
				: navigationState.level === "subcategory" && navigationState.categoryId
					? { level: "subcategory", categoryId: navigationState.categoryId }
					: navigationState.level === "theme" && navigationState.subcategoryId
						? { level: "theme", subcategoryId: navigationState.subcategoryId }
						: "skip",
	);

	// Get current tool for param names
	const currentTool = useQuery(
		api.tools.getById,
		navigationState.toolId ? { toolId: navigationState.toolId } : "skip",
	);

	type WallItem =
		| Doc<"tools">
		| Doc<"toolCategories">
		| Doc<"toolSubCategories">
		| (Doc<"toolThemes"> & { order?: number });

	const currentItemsRaw: WallItem[] = useMemo(() => {
		if (navigationState.level === "meta") return (tools || []) as WallItem[];
		if (navigationState.level === "category")
			return (categories || []) as WallItem[];
		if (navigationState.level === "subcategory")
			return (subcategories || []) as WallItem[];
		if (navigationState.level === "theme") return (themes || []) as WallItem[];
		return [];
	}, [navigationState, tools, categories, subcategories, themes]);

	const currentItems: WallItem[] = useMemo(() => {
		if (!wallConfig || wallConfig.length === 0) {
			return currentItemsRaw;
		}

		const itemById = new Map(
			currentItemsRaw.map((item) => [item._id.toString(), item]),
		);

		return wallConfig
			.slice()
			.sort((a, b) => a.order - b.order)
			.map((config) => itemById.get(config.referenceId))
			.filter((item): item is WallItem => Boolean(item));
	}, [currentItemsRaw, wallConfig]);

	// Split into primary (first 4) and expanded (rest)
	const primaryItems = currentItems.slice(0, 4);
	const _expandedItems = currentItems.slice(4);
	const visibleItems = isExpanded ? currentItems : primaryItems;

	// Handle tile click
	const handleTileClick = (item: any) => {
		if (navigationState.level === "meta") {
			// Tool clicked
			if (!item.hasCategories) {
				// Navigate directly to tool
				const localizedTarget = item.targetUrl?.startsWith(`/${locale}`)
					? item.targetUrl
					: item.targetUrl?.startsWith("/")
						? `/${locale}${item.targetUrl}`
						: item.targetUrl;
				if (localizedTarget) {
					router.push(localizedTarget);
				}
				return;
			}
			setNavigationState({ level: "category", toolId: item._id });
			setIsExpanded(false);
		} else if (navigationState.level === "category") {
			// Category clicked
			if (!currentTool?.hasSubCategories) {
				onSelectItem({
					level: "category",
					id: item._id,
					key: item.key,
					toolId: navigationState.toolId,
				});
				return;
			}
			setNavigationState({
				...navigationState,
				level: "subcategory",
				categoryId: item._id,
			});
			setIsExpanded(false);
		} else if (navigationState.level === "subcategory") {
			// SubCategory clicked
			if (!currentTool?.hasThemes) {
				onSelectItem({
					level: "subcategory",
					id: item._id,
					key: item.key,
					toolId: navigationState.toolId,
					categoryId: navigationState.categoryId,
				});
				return;
			}
			setNavigationState({
				...navigationState,
				level: "theme",
				subcategoryId: item._id,
			});
			setIsExpanded(false);
		} else if (navigationState.level === "theme") {
			// Theme clicked - final selection
			onSelectItem({
				level: "theme",
				id: item._id,
				key: item.key,
				toolId: navigationState.toolId,
				categoryId: navigationState.categoryId,
				subcategoryId: navigationState.subcategoryId,
			});
		}
	};

	// Handle back navigation
	const handleBack = () => {
		if (navigationState.level === "theme") {
			setNavigationState({
				...navigationState,
				level: "subcategory",
				subcategoryId: undefined,
			});
		} else if (navigationState.level === "subcategory") {
			setNavigationState({
				...navigationState,
				level: "category",
				categoryId: undefined,
			});
		} else if (navigationState.level === "category") {
			setNavigationState({ level: "meta" });
		}
		setIsExpanded(false);
	};

	// Get title based on level
	const getTitle = () => {
		if (navigationState.level === "meta") return t("select_tool");
		if (navigationState.level === "category") return t("choose_category");
		if (navigationState.level === "subcategory") return t("select_style");
		if (navigationState.level === "theme") return t("pick_theme");
		return t("categories");
	};

	const getFallbackName = (item: WallItem) =>
		"name" in item ? item.name : undefined;
	const getFallbackDescription = (item: WallItem) =>
		"description" in item ? (item.description ?? "") : "";
	const getTranslated = (key: string | undefined, fallback?: string) => {
		if (key && t.has(key)) {
			return t(key);
		}
		return fallback ?? key ?? "";
	};

	return (
		<div className="flex flex-col gap-6 p-4">
			{/* Header */}
			<div className="text-center py-6 md:py-10 px-4 md:px-6">
				<AnimatePresence mode="wait">
					<motion.div
						key={navigationState.level}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						transition={{ duration: 0.2, ease: "easeOut" }}
					>
						{navigationState.level !== "meta" && (
							<Button
								variant="ghost"
								onClick={handleBack}
								aria-label={t("back")}
								className="mb-4 gap-2 min-h-[44px] min-w-[44px]"
							>
								<ChevronLeft className="w-4 h-4" />
								<span className="hidden md:inline">{t("back")}</span>
							</Button>
						)}
						<h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
							{getTitle()}
						</h1>
					</motion.div>
				</AnimatePresence>
			</div>

			{/* Grid of tiles - Bento layout from vertical-ai-alpha */}
			<motion.div
				layout
				transition={{ type: "spring", stiffness: 350, damping: 35, mass: 0.8 }}
				className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[180px] md:auto-rows-[220px]"
			>
				<AnimatePresence mode="popLayout">
					{visibleItems.map((tile: WallItem, index: number) => {
						const isLarge = index === 0 && !isExpanded;
						const isWide = isExpanded && (index === 4 || index === 8);

						return (
							<motion.button
								key={tile._id}
								layout
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.9 }}
								transition={{
									layout: { type: "spring", stiffness: 350, damping: 35 },
									opacity: { duration: 0.2, delay: index * 0.03 },
									scale: { duration: 0.2, delay: index * 0.03 },
								}}
								onClick={() => handleTileClick(tile)}
								className={`
                  relative overflow-hidden rounded-lg group cursor-pointer
                  min-h-[180px] md:min-h-[220px]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                  will-change-transform
                  ${isLarge ? "md:col-span-2 md:row-span-2" : ""}
                  ${isWide ? "md:col-span-2" : ""}
                `}
							>
								{/* Background Image */}
								{tile.imageUrl && (
									<Image
										src={tile.imageUrl}
										alt={getTranslated(
											tile.nameTranslationKey,
											getFallbackName(tile),
										)}
										fill
										className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05] will-change-transform"
									/>
								)}

								{/* Gradient Overlay - Stronger for better contrast */}
								<div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/50 to-transparent" />

								{/* Content */}
								<div className="absolute inset-0 flex flex-col justify-end p-4 md:p-6">
									<h3
										className={`font-semibold text-foreground ${isLarge ? "text-2xl md:text-3xl" : "text-base md:text-lg"}`}
									>
										{getTranslated(
											tile.nameTranslationKey,
											getFallbackName(tile),
										)}
									</h3>
									<p
										className={`text-muted-foreground leading-relaxed mt-0.5 ${isLarge ? "text-sm md:text-base" : "text-xs md:text-sm"} line-clamp-2`}
									>
										{getTranslated(
											tile.descriptionTranslationKey,
											getFallbackDescription(tile),
										)}
									</p>
								</div>

								{/* Border */}
								<div className="absolute inset-0 rounded-lg border-2 border-transparent group-hover:border-primary/30 transition-colors duration-300" />
							</motion.button>
						);
					})}
				</AnimatePresence>
			</motion.div>

			{/* Expand/Collapse button */}
			{currentItems.length > 4 && (
				<motion.div layout className="flex justify-center">
					<Button
						variant="outline"
						size="lg"
						onClick={() => setIsExpanded(!isExpanded)}
						className="rounded-full gap-2 min-h-[44px] hover:scale-105 transition-transform-smooth"
					>
						{isExpanded ? (
							<>
								{t("show_less")}
								<motion.div
									animate={{ y: [0, -3, 0] }}
									transition={{
										repeat: Number.POSITIVE_INFINITY,
										duration: 1.5,
										ease: "easeInOut",
									}}
								>
									<ChevronUp className="w-4 h-4" />
								</motion.div>
							</>
						) : (
							<>
								{t("explore_all", { count: currentItems.length })}
								<motion.div
									animate={{ y: [0, 3, 0] }}
									transition={{
										repeat: Number.POSITIVE_INFINITY,
										duration: 1.5,
										ease: "easeInOut",
									}}
								>
									<ChevronDown className="w-4 h-4" />
								</motion.div>
							</>
						)}
					</Button>
				</motion.div>
			)}
		</div>
	);
}
