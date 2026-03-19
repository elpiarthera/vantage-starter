"use client";

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMutation, useQuery } from "convex/react";
import { ChevronRight, Palette } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { EmptyState } from "./EmptyState";
import { SortableItem } from "./SortableItem";
import { UnifiedItemPicker } from "./UnifiedItemPicker";

type Level = "tool" | "category" | "subcategory" | "theme";

interface WallItem {
	id: string;
	type: Level;
	referenceId:
		| Id<"tools">
		| Id<"toolCategories">
		| Id<"toolSubCategories">
		| Id<"toolThemes">;
	order: number;
}

interface ItemData {
	_id:
		| Id<"tools">
		| Id<"toolCategories">
		| Id<"toolSubCategories">
		| Id<"toolThemes">;
	name: string;
	description?: string;
	imageUrl?: string;
	key: string;
}

export function UnifiedWallBuilder() {
	const t = useTranslations("admin.wall_builder");
	const [level, setLevel] = useState<Level>("tool");
	const [toolId, setToolId] = useState<Id<"tools"> | null>(null);
	const [categoryId, setCategoryId] = useState<Id<"toolCategories"> | null>(
		null,
	);
	const [subcategoryId, setSubcategoryId] =
		useState<Id<"toolSubCategories"> | null>(null);
	const [refreshKey, _setRefreshKey] = useState(0);

	// Sensors for drag-drop
	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	// Fetch data based on level
	const tools = useQuery(api.tools.listActiveTools);
	const categories = useQuery(
		api.tools.listCategories,
		toolId ? { toolId } : "skip",
	);
	const subcategories = useQuery(
		api.tools.listSubCategories,
		categoryId ? { categoryId } : "skip",
	);
	const themes = useQuery(
		api.tools.listThemes,
		subcategoryId ? { subcategoryId } : "skip",
	);
	const normalizedThemes = useMemo(
		() => (themes || []).filter(Boolean) as Doc<"toolThemes">[],
		[themes],
	);

	// Mutations
	const addItemToWall = useMutation(api.tools.addItemToWall);
	const removeItemFromWall = useMutation(api.tools.removeItemFromWall);
	const reorderWallItems = useMutation(api.tools.reorderWallItems);

	// Get wall configuration (admin version shows all items including inactive)
	const wallConfig = useQuery(api.tools.getWallConfigForAdmin, {
		level,
		toolId: toolId || undefined,
		categoryId: categoryId || undefined,
		subcategoryId: subcategoryId || undefined,
	});

	// Transform wall config to WallItem format
	const config: WallItem[] = useMemo(() => {
		if (!wallConfig) return [];
		return wallConfig.map((item) => ({
			id: item._id,
			type: item.level as Level,
			referenceId: item.referenceId as any,
			order: item.order,
		}));
	}, [wallConfig]);

	// Get available items based on level - map to ItemData format
	const toItemData = (
		item:
			| Doc<"tools">
			| Doc<"toolCategories">
			| Doc<"toolSubCategories">
			| Doc<"toolThemes">,
	): ItemData => ({
		_id: item._id,
		name: item.name,
		description: item.description,
		imageUrl: item.imageUrl || "/placeholder.svg",
		key: item.key,
	});

	const getAvailableItems = () => {
		if (level === "tool") {
			return {
				items: (tools || []).map((item) => toItemData(item)),
				itemType: "tool" as const,
			};
		}
		if (level === "category" && toolId) {
			return {
				items: (categories || []).map((item) => toItemData(item)),
				itemType: "category" as const,
			};
		}
		if (level === "subcategory" && categoryId) {
			return {
				items: (subcategories || []).map((item) => toItemData(item)),
				itemType: "subcategory" as const,
			};
		}
		if (level === "theme" && subcategoryId) {
			return {
				items: normalizedThemes.map((item) => toItemData(item)),
				itemType: "theme" as const,
			};
		}
		return { items: [], itemType: level };
	};

	// Get context options for dropdowns
	const getContextOptions = () => {
		if (level === "category") {
			return tools || [];
		}
		if (level === "subcategory") {
			return categories || [];
		}
		if (level === "theme") {
			return subcategories || [];
		}
		return [];
	};

	// Get breadcrumb trail - use name for display
	const getBreadcrumb = () => {
		const crumbs: Array<{ name: string; id: string }> = [];

		if (toolId && tools) {
			const tool = tools.find((t: Doc<"tools">) => t._id === toolId);
			if (tool) crumbs.push({ name: tool.name, id: tool._id });
		}

		if (categoryId && categories) {
			const category = categories.find(
				(c: Doc<"toolCategories">) => c._id === categoryId,
			);
			if (category) crumbs.push({ name: category.name, id: category._id });
		}

		if (subcategoryId && subcategories) {
			const subcategory = subcategories.find(
				(s: Doc<"toolSubCategories">) => s._id === subcategoryId,
			);
			if (subcategory)
				crumbs.push({ name: subcategory.name, id: subcategory._id });
		}

		return crumbs.length > 0 ? crumbs : null;
	};

	// Handle drag end
	const handleDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			const oldIndex = config.findIndex((item) => item.id === active.id);
			const newIndex = config.findIndex((item) => item.id === over.id);

			const reordered = arrayMove(config, oldIndex, newIndex).map(
				(item, index) => ({
					id: item.id as Id<"toolWallConfigs">,
					order: index + 1,
				}),
			);

			try {
				await reorderWallItems({ items: reordered });
			} catch (error) {
				console.error("Failed to reorder items:", error);
			}
		}
	};

	// Handle add item
	const handleAddItem = async (_type: Level, referenceId: string) => {
		try {
			await addItemToWall({
				level,
				referenceId: referenceId as any,
				toolId: toolId || undefined,
				categoryId: categoryId || undefined,
				subcategoryId: subcategoryId || undefined,
			});
		} catch (error) {
			console.error("Failed to add item:", error);
		}
	};

	// Handle remove item
	const handleRemoveItem = async (itemId: string) => {
		try {
			await removeItemFromWall({ configId: itemId as Id<"toolWallConfigs"> });
		} catch (error) {
			console.error("Failed to remove item:", error);
		}
	};

	// Resolve items with data
	const itemsWithData = useMemo(() => {
		return config.map((item) => {
			let data = null;

			if (item.type === "tool" && tools) {
				data = tools.find((t: Doc<"tools">) => t._id === item.referenceId);
			} else if (item.type === "category" && categories) {
				data = categories.find(
					(c: Doc<"toolCategories">) => c._id === item.referenceId,
				);
			} else if (item.type === "subcategory" && subcategories) {
				data = subcategories.find(
					(s: Doc<"toolSubCategories">) => s._id === item.referenceId,
				);
			} else if (item.type === "theme") {
				data = normalizedThemes.find(
					(th: Doc<"toolThemes">) => th._id === item.referenceId,
				);
			}
			if (!data) {
				return { ...item, data: undefined };
			}
			return {
				...item,
				data: {
					...data,
					imageUrl: data.imageUrl || "/placeholder.svg",
				},
			};
		});
	}, [config, tools, categories, subcategories, normalizedThemes]);

	const availableItems = getAvailableItems();
	const contextOptions = getContextOptions();
	const breadcrumb = getBreadcrumb();

	// Handle level change
	const handleLevelChange = (newLevel: Level) => {
		setLevel(newLevel);
		setToolId(null);
		setCategoryId(null);
		setSubcategoryId(null);
	};

	// Handle context selection
	const handleContextChange = (value: string) => {
		if (level === "category") {
			setToolId(value as Id<"tools">);
			setCategoryId(null);
			setSubcategoryId(null);
		} else if (level === "subcategory") {
			setCategoryId(value as Id<"toolCategories">);
			setSubcategoryId(null);
		} else if (level === "theme") {
			setSubcategoryId(value as Id<"toolSubCategories">);
		}
	};

	// Check if context is required but not selected
	const needsContext =
		level !== "tool" &&
		((level === "category" && !toolId) ||
			(level === "subcategory" && !categoryId) ||
			(level === "theme" && !subcategoryId));

	return (
		<div className="p-8" key={refreshKey}>
			{/* Header */}
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-foreground mb-2">
					{t("title")}
				</h1>
				<p className="text-muted-foreground leading-relaxed">{t("subtitle")}</p>
			</div>

			{/* Controls */}
			<div className="mb-6 space-y-4">
				<div className="flex items-center gap-4">
					{/* Level Selector */}
					<div className="flex-1">
						<Label htmlFor="level">{t("select_level")}</Label>
						<Select value={level} onValueChange={handleLevelChange}>
							<SelectTrigger id="level">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="tool">
									{t("levels.meta_category")}
								</SelectItem>
								<SelectItem value="category">{t("levels.category")}</SelectItem>
								<SelectItem value="subcategory">
									{t("levels.subcategory")}
								</SelectItem>
								<SelectItem value="theme">{t("levels.theme")}</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Context Selector */}
					{level !== "tool" && (
						<div className="flex-1">
							<Label htmlFor="context">
								{level === "category" && t("select_tool")}
								{level === "subcategory" && t("select_category")}
								{level === "theme" && t("select_subcategory")}
							</Label>
							<Select
								value={
									level === "category"
										? toolId || ""
										: level === "subcategory"
											? categoryId || ""
											: subcategoryId || ""
								}
								onValueChange={handleContextChange}
							>
								<SelectTrigger id="context">
									<SelectValue placeholder={t("select_parent_prompt")} />
								</SelectTrigger>
								<SelectContent>
									{contextOptions.map(
										(
											option:
												| Doc<"tools">
												| Doc<"toolCategories">
												| Doc<"toolSubCategories">,
										) => (
											<SelectItem key={option._id} value={option._id}>
												{option.name}
											</SelectItem>
										),
									)}
								</SelectContent>
							</Select>
						</div>
					)}
				</div>

				{/* Breadcrumb */}
				{breadcrumb && breadcrumb.length > 0 && (
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						{breadcrumb.map((crumb, index) => (
							<div key={crumb.id} className="flex items-center gap-2">
								{index > 0 && <ChevronRight className="w-4 h-4" />}
								<Badge variant="outline">{crumb.name}</Badge>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Main Content */}
			{needsContext ? (
				<div className="text-center py-12 text-muted-foreground leading-relaxed">
					<p>{t("select_parent")}</p>
				</div>
			) : (
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Current Wall */}
					<div className="lg:col-span-2">
						<div className="mb-4">
							<h2 className="text-lg font-semibold text-foreground">
								{t("current_wall")}
							</h2>
							<p className="text-sm text-muted-foreground leading-relaxed">
								{t("drag_to_reorder")}
							</p>
						</div>

						{config.length === 0 ? (
							<EmptyState
								icon={Palette}
								title={t("empty_states.empty_wall_title")}
								description={t("empty_states.empty_wall_description")}
							/>
						) : (
							<DndContext
								sensors={sensors}
								collisionDetection={closestCenter}
								onDragEnd={handleDragEnd}
							>
								<SortableContext
									items={config.map((item) => item.id)}
									strategy={verticalListSortingStrategy}
								>
									<div className="space-y-3">
										{itemsWithData.map((item) => (
											<SortableItem
												key={item.id}
												item={item}
												onRemove={handleRemoveItem}
											/>
										))}
									</div>
								</SortableContext>
							</DndContext>
						)}
					</div>

					{/* Item Picker */}
					<div>
						<UnifiedItemPicker
							items={availableItems.items}
							itemType={availableItems.itemType}
							selectedIds={config.map((item) => item.referenceId)}
							onAddItem={handleAddItem}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
