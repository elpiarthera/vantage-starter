"use client";

import { useTranslations } from "next-intl";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Doc } from "@/convex/_generated/dataModel";

interface SubCategoryDialogProps {
	open: boolean;
	subCategory: Doc<"toolSubCategories"> | null;
	categories: Doc<"toolCategories">[];
	metaCategories: Doc<"tools">[];
	defaultCategoryId?: string;
	onClose: () => void;
	onSave: (data: {
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
	}) => void;
}

export function SubCategoryDialog({
	open,
	subCategory,
	categories,
	metaCategories,
	defaultCategoryId,
	onClose,
	onSave,
}: SubCategoryDialogProps) {
	const t = useTranslations("admin.subcategories.dialog");
	const [formData, setFormData] = useState<{
		toolId: Doc<"tools">["_id"] | "";
		categoryId: Doc<"toolCategories">["_id"] | "";
		key: string;
		name: string;
		nameTranslationKey: string;
		description: string;
		descriptionTranslationKey: string;
		imageUrl: string;
		sortOrder: number;
		isActive: boolean;
	}>({
		toolId: "",
		categoryId: (defaultCategoryId as Doc<"toolCategories">["_id"]) || "",
		key: "",
		name: "",
		nameTranslationKey: "",
		description: "",
		descriptionTranslationKey: "",
		imageUrl: "",
		sortOrder: 1,
		isActive: true,
	});

	useEffect(() => {
		if (subCategory) {
			setFormData({
				toolId: subCategory.toolId,
				categoryId: subCategory.categoryId,
				key: subCategory.key,
				name: subCategory.name,
				nameTranslationKey: subCategory.nameTranslationKey,
				description: subCategory.description || "",
				descriptionTranslationKey: subCategory.descriptionTranslationKey || "",
				imageUrl: subCategory.imageUrl || "",
				sortOrder: subCategory.sortOrder,
				isActive: subCategory.isActive,
			});
		} else {
			const defaultCategory = categories.find(
				(category) => category._id === defaultCategoryId,
			);
			setFormData({
				toolId: defaultCategory?.toolId || "",
				categoryId: (defaultCategoryId as Doc<"toolCategories">["_id"]) || "",
				key: "",
				name: "",
				nameTranslationKey: "",
				description: "",
				descriptionTranslationKey: "",
				imageUrl: "",
				sortOrder: 1,
				isActive: true,
			});
		}
	}, [subCategory, defaultCategoryId, categories]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.toolId || !formData.categoryId) {
			alert(t("select_category_error"));
			return;
		}
		onSave({
			...formData,
			toolId: formData.toolId as Doc<"tools">["_id"],
			categoryId: formData.categoryId as Doc<"toolCategories">["_id"],
		});
	};
	const filteredCategories = useMemo(() => {
		if (!formData.toolId) return categories;
		return categories.filter((category) => category.toolId === formData.toolId);
	}, [categories, formData.toolId]);

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="w-full h-[100dvh] max-w-full top-0 left-0 translate-x-0 translate-y-0 rounded-none border-0 p-0 flex flex-col sm:max-w-full sm:h-[100dvh] sm:top-0 sm:left-0 sm:translate-x-0 sm:translate-y-0 sm:rounded-none sm:border-0 lg:top-[50%] lg:left-[50%] lg:translate-x-[-50%] lg:translate-y-[-50%] lg:h-auto lg:max-w-[720px] lg:max-h-[90vh] lg:rounded-lg lg:border lg:p-6">
				<div className="px-6 pt-6 lg:p-0 flex-shrink-0">
					<DialogHeader>
						<DialogTitle>
							{subCategory ? t("edit_title") : t("create_title")}
						</DialogTitle>
						<DialogDescription>
							{subCategory ? t("edit_description") : t("create_description")}
						</DialogDescription>
					</DialogHeader>
				</div>

				<form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
					<div className="space-y-6 py-6 px-6 lg:px-0 flex-1 overflow-y-auto">
						<div className="space-y-2">
							<Label htmlFor="toolId">{t("fields.tool")}</Label>
							<Select
								value={formData.toolId}
								onValueChange={(value) =>
									setFormData({
										...formData,
										toolId: value as Doc<"tools">["_id"],
										categoryId: "",
									})
								}
							>
								<SelectTrigger id="toolId">
									<SelectValue placeholder={t("placeholders.tool")} />
								</SelectTrigger>
								<SelectContent>
									{metaCategories.map((tool) => (
										<SelectItem key={tool._id} value={tool._id}>
											{tool.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="categoryId">{t("fields.category")}</Label>
							<Select
								value={formData.categoryId}
								onValueChange={(value) =>
									setFormData({
										...formData,
										categoryId: value as Doc<"toolCategories">["_id"],
									})
								}
							>
								<SelectTrigger id="categoryId">
									<SelectValue placeholder={t("placeholders.category")} />
								</SelectTrigger>
								<SelectContent>
									{filteredCategories.map((category) => (
										<SelectItem key={category._id} value={category._id}>
											{category.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="key">{t("fields.key")}</Label>
							<Input
								id="key"
								value={formData.key}
								onChange={(e) =>
									setFormData({ ...formData, key: e.target.value })
								}
								placeholder={t("placeholders.key")}
								disabled={Boolean(subCategory)}
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="name">{t("fields.name")}</Label>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								placeholder={t("placeholders.name")}
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="nameTranslationKey">
								{t("fields.name_translation_key")}
							</Label>
							<Input
								id="nameTranslationKey"
								value={formData.nameTranslationKey}
								onChange={(e) =>
									setFormData({
										...formData,
										nameTranslationKey: e.target.value,
									})
								}
								placeholder={t("placeholders.name_translation_key")}
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="description">{t("fields.description")}</Label>
							<Textarea
								id="description"
								value={formData.description}
								onChange={(e) =>
									setFormData({ ...formData, description: e.target.value })
								}
								placeholder={t("placeholders.description")}
								rows={3}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="descriptionTranslationKey">
								{t("fields.description_translation_key")}
							</Label>
							<Input
								id="descriptionTranslationKey"
								value={formData.descriptionTranslationKey}
								onChange={(e) =>
									setFormData({
										...formData,
										descriptionTranslationKey: e.target.value,
									})
								}
								placeholder={t("placeholders.description_translation_key")}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="imageUrl">{t("fields.image_url")}</Label>
							<Input
								id="imageUrl"
								value={formData.imageUrl}
								onChange={(e) =>
									setFormData({ ...formData, imageUrl: e.target.value })
								}
								placeholder={t("placeholders.image_url")}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="sortOrder">{t("fields.sort_order")}</Label>
							<Input
								id="sortOrder"
								type="number"
								min="0"
								value={formData.sortOrder}
								onChange={(e) =>
									setFormData({
										...formData,
										sortOrder: Number.parseInt(e.target.value || "0", 10),
									})
								}
								required
							/>
						</div>

						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label>{t("fields.active_status")}</Label>
								<p className="text-sm text-muted-foreground">
									{t("fields.active_hint")}
								</p>
							</div>
							<Switch
								checked={formData.isActive}
								onCheckedChange={(checked) =>
									setFormData({ ...formData, isActive: checked })
								}
							/>
						</div>
					</div>

					<DialogFooter className="px-6 pb-6 lg:px-0 lg:pb-0 border-t lg:border-t-0 pt-4 lg:pt-0 flex-shrink-0 bg-background">
						<Button type="button" variant="outline" onClick={onClose}>
							{t("actions.cancel")}
						</Button>
						<Button type="submit">
							{subCategory ? t("actions.save") : t("actions.create")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
