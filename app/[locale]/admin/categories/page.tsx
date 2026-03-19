"use client";

import { useMutation, useQuery } from "convex/react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { CategoryDialog } from "@/components/admin/CategoryDialog";
import { CategoryList } from "@/components/admin/CategoryList";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";

export default function CategoriesPage() {
	const searchParams = useSearchParams();
	const toolIdFromUrl = searchParams?.get("toolId");
	const t = useTranslations("admin.categories");
	const tools = useQuery(api.tools.getAllTools);
	const categories = useQuery(api.tools.getAllCategories, {});
	const subCategories = useQuery(api.tools.getAllSubCategories, {});
	const createCategory = useMutation(api.tools.createCategory);
	const updateCategory = useMutation(api.tools.updateCategory);
	const [selectedToolId, setSelectedToolId] = useState<string | "all">(
		toolIdFromUrl || "all",
	);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingCategory, setEditingCategory] =
		useState<Doc<"toolCategories"> | null>(null);

	// Filter categories based on selected meta-category
	const filteredCategories = useMemo(() => {
		if (!categories) return [];
		if (selectedToolId === "all") return categories;
		return categories.filter((category) => category.toolId === selectedToolId);
	}, [categories, selectedToolId]);

	const subCategoryCounts = useMemo(() => {
		const counts: Record<string, number> = {};
		if (!subCategories) return counts;
		for (const subCategory of subCategories) {
			counts[subCategory.categoryId] =
				(counts[subCategory.categoryId] || 0) + 1;
		}
		return counts;
	}, [subCategories]);

	const handleCreate = () => {
		setEditingCategory(null);
		setIsDialogOpen(true);
	};

	const handleEdit = (category: Doc<"toolCategories">) => {
		setEditingCategory(category);
		setIsDialogOpen(true);
	};

	const handleSave = async (data: {
		toolId: Doc<"tools">["_id"];
		key: string;
		name: string;
		nameTranslationKey: string;
		description?: string;
		descriptionTranslationKey?: string;
		sortOrder: number;
		imageUrl?: string;
		isActive: boolean;
	}) => {
		if (editingCategory) {
			await updateCategory({
				categoryId: editingCategory._id,
				updates: {
					key: data.key,
					name: data.name,
					nameTranslationKey: data.nameTranslationKey,
					description: data.description,
					descriptionTranslationKey: data.descriptionTranslationKey,
					sortOrder: data.sortOrder,
					isActive: data.isActive,
					imageUrl: data.imageUrl,
				},
			});
		} else {
			await createCategory(data);
		}
		setIsDialogOpen(false);
		setEditingCategory(null);
	};

	const handleDelete = async (id: Doc<"toolCategories">["_id"]) => {
		if (confirm(t("confirm_delete"))) {
			await updateCategory({ categoryId: id, updates: { isActive: false } });
		}
	};

	const handleToggleActive = async (
		id: Doc<"toolCategories">["_id"],
		isActive: boolean,
	) => {
		await updateCategory({ categoryId: id, updates: { isActive } });
	};

	// Update selected meta-category when URL param changes
	useEffect(() => {
		if (toolIdFromUrl) {
			setSelectedToolId(toolIdFromUrl);
		}
	}, [toolIdFromUrl]);

	const selectedTool = tools?.find((tool) => tool._id === selectedToolId);

	return (
		<div className="h-full flex flex-col">
			<AdminHeader
				title={t("title")}
				description={
					selectedTool
						? t("description_selected", { name: selectedTool.name })
						: t("description_all")
				}
				action={{ label: t("actions.add"), onClick: handleCreate }}
			/>

			{/* Filter by Meta-Category */}
			<div className="px-8 pt-6 pb-2">
				<div className="max-w-xs">
					<Label htmlFor="toolId">{t("filter_label")}</Label>
					<Select value={selectedToolId} onValueChange={setSelectedToolId}>
						<SelectTrigger id="toolId" className="mt-2">
							<SelectValue placeholder={t("filter_placeholder")} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{t("filter_all")}</SelectItem>
							{(tools || []).map((tool) => (
								<SelectItem key={tool._id} value={tool._id}>
									{tool.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="flex-1 overflow-auto">
				<CategoryList
					categories={filteredCategories}
					metaCategories={tools || []}
					subCategoryCounts={subCategoryCounts}
					onEdit={handleEdit}
					onDelete={handleDelete}
					onToggleActive={handleToggleActive}
					onCreate={handleCreate}
				/>
			</div>

			<CategoryDialog
				open={isDialogOpen}
				category={editingCategory}
				metaCategories={tools || []}
				defaultMetaCategoryId={
					selectedToolId === "all" ? undefined : selectedToolId
				}
				onClose={() => {
					setIsDialogOpen(false);
					setEditingCategory(null);
				}}
				onSave={handleSave}
			/>
		</div>
	);
}
