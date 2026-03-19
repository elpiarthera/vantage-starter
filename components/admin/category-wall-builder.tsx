"use client";

import type { DragEndEvent } from "@dnd-kit/core";
import {
	closestCenter,
	DndContext,
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
import { Palette } from "lucide-react";
import type {
	AdminAd,
	AdminCategory,
	CategoryWallItem,
} from "@/lib/admin-mock-data";
import { CategorySortableItem } from "./CategorySortableItem";
import { EmptyState } from "./EmptyState";
import { ItemPicker } from "./item-picker";

interface CategoryWallBuilderProps {
	config: CategoryWallItem[];
	availableCategories: AdminCategory[];
	availableAds: AdminAd[];
	onAddItem: (type: "category" | "ad", referenceId: string) => void;
	onRemoveItem: (id: string) => void;
	onReorder: (items: CategoryWallItem[]) => void;
}

export function CategoryWallBuilder({
	config,
	availableCategories,
	availableAds,
	onAddItem,
	onRemoveItem,
	onReorder,
}: CategoryWallBuilderProps) {
	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			const oldIndex = config.findIndex((item) => item.id === active.id);
			const newIndex = config.findIndex((item) => item.id === over.id);

			const reordered = arrayMove(config, oldIndex, newIndex).map(
				(item, index) => ({
					...item,
					order: index + 1,
				}),
			);

			onReorder(reordered);
		}
	};

	// Get full data for each item
	const itemsWithData = config.map((item) => {
		if (item.type === "category") {
			const category = availableCategories.find(
				(c) => c.id === item.referenceId,
			);
			return { ...item, data: category };
		} else {
			const ad = availableAds.find((a) => a.id === item.referenceId);
			return { ...item, data: ad };
		}
	});

	return (
		<div className="p-8">
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Current Wall Configuration */}
				<div className="lg:col-span-2">
					<div className="mb-4">
						<h2 className="text-lg font-semibold text-foreground">
							Current Category Wall
						</h2>
						<p className="text-sm text-muted-foreground">
							Drag items to reorder them
						</p>
					</div>

					{config.length === 0 ? (
						<EmptyState
							icon={Palette}
							title="No items on the wall"
							description="Add categories or ads from the picker on the right to get started"
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
										<CategorySortableItem
											key={item.id}
											item={item}
											onRemove={onRemoveItem}
										/>
									))}
								</div>
							</SortableContext>
						</DndContext>
					)}
				</div>

				{/* Item Picker */}
				<div>
					<ItemPicker
						categories={availableCategories}
						ads={availableAds}
						selectedIds={config.map((item) => item.referenceId)}
						onAddItem={onAddItem}
					/>
				</div>
			</div>
		</div>
	);
}
