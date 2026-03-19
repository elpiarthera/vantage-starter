"use client";

import { useMutation, useQuery } from "convex/react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SubCategoryDialog } from "@/components/admin/SubCategoryDialog";
import { SubCategoryList } from "@/components/admin/SubCategoryList";
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

export default function SubCategoriesPage() {
	const searchParams = useSearchParams();
	const categoryIdFromUrl = searchParams?.get("categoryId");
	const t = useTranslations("admin.subcategories");
	const tools = useQuery(api.tools.getAllTools);
	const categories = useQuery(api.tools.getAllCategories, {});
	const subCategories = useQuery(api.tools.getAllSubCategories, {});
	const createSubCategory = useMutation(api.tools.createSubCategory);
	const updateSubCategory = useMutation(api.tools.updateSubCategory);
	const [selectedCategoryId, setSelectedCategoryId] = useState<string | "all">(
		categoryIdFromUrl || "all",
	);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingSubCategory, setEditingSubCategory] =
		useState<Doc<"toolSubCategories"> | null>(null);

	// Filter subcategories based on selected category
	const filteredSubCategories = useMemo(() => {
		if (!subCategories) return [];
		if (selectedCategoryId === "all") return subCategories;
		return subCategories.filter(
			(subcategory) => subcategory.categoryId === selectedCategoryId,
		);
	}, [subCategories, selectedCategoryId]);

	const handleCreate = () => {
		setEditingSubCategory(null);
		setIsDialogOpen(true);
	};

	const handleEdit = (subCategory: Doc<"toolSubCategories">) => {
		setEditingSubCategory(subCategory);
		setIsDialogOpen(true);
	};

	const handleSave = async (data: {
		toolId: Doc<"tools">["_id"];
		categoryId: Doc<"toolCategories">["_id"];
		key: string;
		name: string;
		nameTranslationKey: string;
		description?: string;
		descriptionTranslationKey?: string;
		sortOrder: number;
		imageUrl?: string;
		isActive: boolean;
	}) => {
		if (editingSubCategory) {
			await updateSubCategory({
				subCategoryId: editingSubCategory._id,
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
			await createSubCategory(data);
		}
		setIsDialogOpen(false);
		setEditingSubCategory(null);
	};

	const handleDelete = async (id: Doc<"toolSubCategories">["_id"]) => {
		if (confirm(t("confirm_delete"))) {
			await updateSubCategory({
				subCategoryId: id,
				updates: { isActive: false },
			});
		}
	};

	const handleToggleActive = async (
		id: Doc<"toolSubCategories">["_id"],
		isActive: boolean,
	) => {
		await updateSubCategory({ subCategoryId: id, updates: { isActive } });
	};

	// Update selected category when URL param changes
	useEffect(() => {
		if (categoryIdFromUrl) {
			setSelectedCategoryId(categoryIdFromUrl);
		}
	}, [categoryIdFromUrl]);

	const selectedCategory = categories?.find(
		(category) => category._id === selectedCategoryId,
	);
	const selectedTool = selectedCategory
		? tools?.find((tool) => tool._id === selectedCategory.toolId)
		: null;

	return (
		<div className="h-full flex flex-col">
			<AdminHeader
				title={t("title")}
				description={
					selectedCategory && selectedTool
						? t("description_selected", {
								category: selectedCategory.name,
								tool: selectedTool.name,
							})
						: t("description_all")
				}
				action={{ label: t("actions.add"), onClick: handleCreate }}
			/>

			{/* Filter by Category */}
			<div className="px-8 pt-6 pb-2">
				<div className="max-w-xs">
					<Label htmlFor="category">{t("filter_label")}</Label>
					<Select
						value={selectedCategoryId}
						onValueChange={setSelectedCategoryId}
					>
						<SelectTrigger id="category" className="mt-2">
							<SelectValue placeholder={t("filter_placeholder")} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{t("filter_all")}</SelectItem>
							{(categories || []).map((cat) => {
								const tool = tools?.find((meta) => meta._id === cat.toolId);
								return (
									<SelectItem key={cat._id} value={cat._id}>
										{tool?.name} {cat.name}
									</SelectItem>
								);
							})}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="flex-1 overflow-auto">
				<SubCategoryList
					subCategories={filteredSubCategories}
					categories={categories || []}
					metaCategories={tools || []}
					onEdit={handleEdit}
					onDelete={handleDelete}
					onToggleActive={handleToggleActive}
					onCreate={handleCreate}
				/>
			</div>

			<SubCategoryDialog
				open={isDialogOpen}
				subCategory={editingSubCategory}
				categories={categories || []}
				metaCategories={tools || []}
				defaultCategoryId={
					selectedCategoryId === "all" ? undefined : selectedCategoryId
				}
				onClose={() => {
					setIsDialogOpen(false);
					setEditingSubCategory(null);
				}}
				onSave={handleSave}
			/>
		</div>
	);
}
