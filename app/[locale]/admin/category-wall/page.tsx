"use client";

import { useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { CategoryWallBuilder } from "@/components/admin/category-wall-builder";
import {
	type AdminAd,
	AdminAdStore,
	type AdminCategory,
	AdminCategoryStore,
	CategoryWallConfigStore,
	type CategoryWallItem,
} from "@/lib/admin-mock-data";

export default function CategoryWallPage() {
	const [config, setConfig] = useState<CategoryWallItem[]>(
		CategoryWallConfigStore.getConfig(),
	);
	const [availableCategories] = useState<AdminCategory[]>(
		AdminCategoryStore.getAll().filter((c) => c.isActive),
	);
	const [availableAds] = useState<AdminAd[]>(
		AdminAdStore.getAll().filter((a) => a.isActive),
	);

	const handleAddItem = (type: "category" | "ad", referenceId: string) => {
		// Check if already added
		const exists = config.find(
			(item) => item.type === type && item.referenceId === referenceId,
		);
		if (exists) {
			alert("This item is already on the category wall");
			return;
		}

		const _newItem = CategoryWallConfigStore.addItem(type, referenceId);
		setConfig(CategoryWallConfigStore.getConfig());
	};

	const handleRemoveItem = (id: string) => {
		CategoryWallConfigStore.removeItem(id);
		setConfig(CategoryWallConfigStore.getConfig());
	};

	const handleReorder = (items: CategoryWallItem[]) => {
		CategoryWallConfigStore.reorderItems(items);
		setConfig(items);
	};

	return (
		<div className="h-full flex flex-col">
			<AdminHeader
				title="Category Wall"
				description="Configure which categories and ads appear on the store homepage"
			/>

			<div className="flex-1 overflow-auto">
				<CategoryWallBuilder
					config={config}
					availableCategories={availableCategories}
					availableAds={availableAds}
					onAddItem={handleAddItem}
					onRemoveItem={handleRemoveItem}
					onReorder={handleReorder}
				/>
			</div>
		</div>
	);
}
