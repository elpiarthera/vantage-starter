"use client";

import { useMutation, useQuery } from "convex/react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ThemeDialog } from "@/components/admin/ThemeDialog";
import { ThemeList } from "@/components/admin/ThemeList";
import { Button } from "@/components/ui/button";
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

export default function ThemesPage() {
	const searchParams = useSearchParams();
	const subCategoryIdFromUrl = searchParams?.get("subcategoryId");
	const t = useTranslations("admin.themes");
	const tools = useQuery(api.tools.getAllTools);
	const categories = useQuery(api.tools.getAllCategories, {});
	const subCategories = useQuery(api.tools.getAllSubCategories, {});
	const themes = useQuery(api.tools.getAllThemes);
	const createTheme = useMutation(api.tools.createTheme);
	const updateTheme = useMutation(api.tools.updateTheme);
	const assignTheme = useMutation(api.tools.assignThemeToSubCategory);
	const removeTheme = useMutation(api.tools.removeThemeFromSubCategory);
	const [selectedToolId, setSelectedToolId] = useState<string | "all">("all");
	const [selectedCategoryId, setSelectedCategoryId] = useState<string | "all">(
		"all",
	);
	const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<
		string | "all"
	>(subCategoryIdFromUrl || "all");
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingTheme, setEditingTheme] = useState<Doc<"toolThemes"> | null>(
		null,
	);
	const [selectedThemeId, setSelectedThemeId] = useState<string | "">("");
	const assignedThemes = useQuery(
		api.tools.listThemesForSubCategory,
		selectedSubCategoryId !== "all"
			? {
					subcategoryId:
						selectedSubCategoryId as Doc<"toolSubCategories">["_id"],
				}
			: "skip",
	);

	const filteredCategories = useMemo(() => {
		if (!categories) return [];
		if (selectedToolId === "all") return categories;
		return categories.filter((category) => category.toolId === selectedToolId);
	}, [categories, selectedToolId]);

	const filteredSubCategories = useMemo(() => {
		if (!subCategories) return [];
		if (selectedCategoryId === "all") return subCategories;
		return subCategories.filter(
			(subcategory) => subcategory.categoryId === selectedCategoryId,
		);
	}, [subCategories, selectedCategoryId]);

	const filteredThemes = useMemo(() => themes || [], [themes]);
	const assignedThemeList = useMemo(
		() => (assignedThemes || []).filter(Boolean) as Doc<"toolThemes">[],
		[assignedThemes],
	);

	const handleCreate = () => {
		setEditingTheme(null);
		setIsDialogOpen(true);
	};

	const handleEdit = (theme: Doc<"toolThemes">) => {
		setEditingTheme(theme);
		setIsDialogOpen(true);
	};

	const handleSave = async (data: {
		key: string;
		name: string;
		nameTranslationKey: string;
		description?: string;
		descriptionTranslationKey?: string;
		color?: string;
		sortOrder: number;
		imageUrl?: string;
		isActive: boolean;
	}) => {
		if (editingTheme) {
			await updateTheme({
				themeId: editingTheme._id,
				updates: {
					key: data.key,
					name: data.name,
					nameTranslationKey: data.nameTranslationKey,
					description: data.description,
					descriptionTranslationKey: data.descriptionTranslationKey,
					color: data.color,
					sortOrder: data.sortOrder,
					isActive: data.isActive,
					imageUrl: data.imageUrl,
				},
			});
		} else {
			await createTheme(data);
		}
		setIsDialogOpen(false);
		setEditingTheme(null);
	};

	const handleDelete = async (id: Doc<"toolThemes">["_id"]) => {
		if (confirm(t("confirm_delete"))) {
			await updateTheme({ themeId: id, updates: { isActive: false } });
		}
	};

	const handleToggleActive = async (
		id: Doc<"toolThemes">["_id"],
		isActive: boolean,
	) => {
		await updateTheme({ themeId: id, updates: { isActive } });
	};

	const handleAssignTheme = async () => {
		if (
			!selectedSubCategoryId ||
			selectedSubCategoryId === "all" ||
			!selectedThemeId
		) {
			return;
		}
		const currentCount = assignedThemeList.length;
		await assignTheme({
			toolSubCategoryId:
				selectedSubCategoryId as Doc<"toolSubCategories">["_id"],
			toolThemeId: selectedThemeId as Doc<"toolThemes">["_id"],
			order: currentCount + 1,
		});
		setSelectedThemeId("");
	};

	const handleRemoveAssignedTheme = async (
		themeId: Doc<"toolThemes">["_id"],
	) => {
		if (!selectedSubCategoryId || selectedSubCategoryId === "all") return;
		await removeTheme({
			toolSubCategoryId:
				selectedSubCategoryId as Doc<"toolSubCategories">["_id"],
			toolThemeId: themeId,
		});
	};

	// Update selected subcategory when URL param changes
	useEffect(() => {
		if (subCategoryIdFromUrl) {
			setSelectedSubCategoryId(subCategoryIdFromUrl);
		}
	}, [subCategoryIdFromUrl]);

	const selectedSubCategory = subCategories?.find(
		(subcategory) => subcategory._id === selectedSubCategoryId,
	);
	const selectedCategory = selectedSubCategory
		? categories?.find(
				(category) => category._id === selectedSubCategory.categoryId,
			)
		: null;
	const selectedTool = selectedCategory
		? tools?.find((tool) => tool._id === selectedCategory.toolId)
		: null;

	return (
		<div className="h-full flex flex-col">
			<AdminHeader
				title={t("title")}
				description={
					selectedSubCategory && selectedTool
						? t("description_selected", {
								category: selectedSubCategory.name,
								tool: selectedTool.name,
							})
						: t("description_all")
				}
				action={{ label: t("actions.add"), onClick: handleCreate }}
			/>

			<div className="px-8 pt-6 pb-2 grid gap-4 md:grid-cols-3">
				<div>
					<Label htmlFor="toolId">{t("filters.tool_label")}</Label>
					<Select value={selectedToolId} onValueChange={setSelectedToolId}>
						<SelectTrigger id="toolId" className="mt-2">
							<SelectValue placeholder={t("filters.tool_placeholder")} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{t("filters.all_tools")}</SelectItem>
							{(tools || []).map((tool) => (
								<SelectItem key={tool._id} value={tool._id}>
									{tool.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div>
					<Label htmlFor="categoryId">{t("filters.category_label")}</Label>
					<Select
						value={selectedCategoryId}
						onValueChange={setSelectedCategoryId}
					>
						<SelectTrigger id="categoryId" className="mt-2">
							<SelectValue placeholder={t("filters.category_placeholder")} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{t("filters.all_categories")}</SelectItem>
							{filteredCategories.map((category) => (
								<SelectItem key={category._id} value={category._id}>
									{category.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div>
					<Label htmlFor="subcategoryId">
						{t("filters.subcategory_label")}
					</Label>
					<Select
						value={selectedSubCategoryId}
						onValueChange={setSelectedSubCategoryId}
					>
						<SelectTrigger id="subcategoryId" className="mt-2">
							<SelectValue placeholder={t("filters.subcategory_placeholder")} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">
								{t("filters.all_subcategories")}
							</SelectItem>
							{filteredSubCategories.map((subcategory) => (
								<SelectItem key={subcategory._id} value={subcategory._id}>
									{subcategory.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="flex-1 overflow-auto">
				<ThemeList
					themes={filteredThemes}
					onEdit={handleEdit}
					onDelete={handleDelete}
					onToggleActive={handleToggleActive}
					onCreate={handleCreate}
				/>
			</div>

			<div className="px-8 pb-10">
				<div className="border border-border rounded-xl p-6 bg-card">
					<h2 className="text-lg font-semibold text-foreground mb-4">
						{t("assignment.title")}
					</h2>
					<p className="text-sm text-muted-foreground leading-relaxed mb-4">
						{t("assignment.description")}
					</p>
					<div className="grid gap-3 md:grid-cols-[1fr_auto]">
						<Select value={selectedThemeId} onValueChange={setSelectedThemeId}>
							<SelectTrigger>
								<SelectValue placeholder={t("assignment.select_theme")} />
							</SelectTrigger>
							<SelectContent>
								{(themes || []).map((theme) => (
									<SelectItem key={theme._id} value={theme._id}>
										{theme.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Button
							onClick={handleAssignTheme}
							disabled={!selectedThemeId || selectedSubCategoryId === "all"}
						>
							{t("assignment.add")}
						</Button>
					</div>

					<div className="mt-6 space-y-3">
						{assignedThemeList.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								{t("assignment.empty")}
							</p>
						) : (
							assignedThemeList.map((theme) => (
								<div
									key={theme._id}
									className="flex items-center justify-between rounded-lg border border-border px-4 py-2"
								>
									<span className="text-sm text-foreground">{theme.name}</span>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleRemoveAssignedTheme(theme._id)}
									>
										{t("assignment.remove")}
									</Button>
								</div>
							))
						)}
					</div>
				</div>
			</div>

			<ThemeDialog
				open={isDialogOpen}
				theme={editingTheme}
				onClose={() => {
					setIsDialogOpen(false);
					setEditingTheme(null);
				}}
				onSave={handleSave}
			/>
		</div>
	);
}
