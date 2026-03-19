"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { MetaCategoryDialog } from "@/components/admin/MetaCategoryDialog";
import { MetaCategoryList } from "@/components/admin/MetaCategoryList";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";

export default function MetaCategoriesPage() {
	const t = useTranslations("admin.meta_categories");
	const tools = useQuery(api.tools.getAllTools);
	const categories = useQuery(api.tools.getAllCategories, {});
	const createTool = useMutation(api.tools.createTool);
	const updateTool = useMutation(api.tools.updateTool);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingMetaCategory, setEditingMetaCategory] =
		useState<Doc<"tools"> | null>(null);

	const categoryCounts = useMemo(() => {
		const counts: Record<string, number> = {};
		if (!categories) return counts;
		for (const category of categories) {
			counts[category.toolId] = (counts[category.toolId] || 0) + 1;
		}
		return counts;
	}, [categories]);

	const handleCreate = () => {
		setEditingMetaCategory(null);
		setIsDialogOpen(true);
	};

	const handleEdit = (metaCategory: Doc<"tools">) => {
		setEditingMetaCategory(metaCategory);
		setIsDialogOpen(true);
	};

	const handleSave = async (data: {
		key: string;
		name: string;
		nameTranslationKey: string;
		description: string;
		descriptionTranslationKey: string;
		targetUrl: string;
		hasCategories: boolean;
		hasSubCategories: boolean;
		hasThemes: boolean;
		categoryParamName?: string;
		subCategoryParamName?: string;
		themeParamName?: string;
		sortOrder: number;
		imageUrl?: string;
		isActive: boolean;
	}) => {
		if (editingMetaCategory) {
			await updateTool({
				toolId: editingMetaCategory._id,
				updates: {
					name: data.name,
					description: data.description,
					sortOrder: data.sortOrder,
					isActive: data.isActive,
					imageUrl: data.imageUrl,
					categoryParamName: data.categoryParamName,
					subCategoryParamName: data.subCategoryParamName,
					themeParamName: data.themeParamName,
				},
			});
		} else {
			await createTool(data);
		}
		setIsDialogOpen(false);
		setEditingMetaCategory(null);
	};

	const handleDelete = async (id: Doc<"tools">["_id"]) => {
		if (confirm(t("confirm_delete"))) {
			await updateTool({ toolId: id, updates: { isActive: false } });
		}
	};

	const handleToggleActive = async (
		id: Doc<"tools">["_id"],
		isActive: boolean,
	) => {
		await updateTool({ toolId: id, updates: { isActive } });
	};

	return (
		<div className="h-full flex flex-col">
			<AdminHeader
				title={t("title")}
				description={t("description")}
				action={{ label: t("actions.add"), onClick: handleCreate }}
			/>

			<div className="flex-1 overflow-auto">
				<MetaCategoryList
					metaCategories={tools || []}
					categoryCounts={categoryCounts}
					onEdit={handleEdit}
					onDelete={handleDelete}
					onToggleActive={handleToggleActive}
					onCreate={handleCreate}
				/>
			</div>

			<MetaCategoryDialog
				open={isDialogOpen}
				metaCategory={editingMetaCategory}
				onClose={() => {
					setIsDialogOpen(false);
					setEditingMetaCategory(null);
				}}
				onSave={handleSave}
			/>
		</div>
	);
}
