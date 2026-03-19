"use client";

import {
	ChevronRight,
	Edit,
	Eye,
	EyeOff,
	LayoutGrid,
	Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { EmptyState } from "@/components/admin/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Doc } from "@/convex/_generated/dataModel";

interface CategoryListProps {
	categories: Doc<"toolCategories">[];
	metaCategories: Doc<"tools">[];
	subCategoryCounts: Record<string, number>;
	onEdit: (category: Doc<"toolCategories">) => void;
	onDelete: (id: Doc<"toolCategories">["_id"]) => void;
	onToggleActive: (id: Doc<"toolCategories">["_id"], isActive: boolean) => void;
	onCreate?: () => void;
}

export function CategoryList({
	categories,
	metaCategories,
	subCategoryCounts,
	onEdit,
	onDelete,
	onToggleActive,
	onCreate,
}: CategoryListProps) {
	const t = useTranslations("admin");
	const locale = useLocale();

	if (categories.length === 0) {
		return (
			<EmptyState
				icon={LayoutGrid}
				title={t("categories.empty_title")}
				description={t("categories.empty_description")}
				action={{
					label: t("categories.empty_action"),
					onClick: onCreate ?? (() => {}),
				}}
			/>
		);
	}

	return (
		<div className="p-8">
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{categories.map((category) => {
					const metaCategory = metaCategories.find(
						(m) => m._id === category.toolId,
					);
					const subCategoryCount = subCategoryCounts[category._id] || 0;

					return (
						<div
							key={category._id}
							className="group relative bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
						>
							{/* Category Image */}
							<div className="relative aspect-[4/3] bg-muted overflow-hidden">
								<Image
									src={category.imageUrl || "/placeholder.svg"}
									alt={category.name}
									fill
									className="object-cover group-hover:scale-105 transition-transform duration-300"
								/>
								<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

								{/* Meta-Category Badge */}
								{metaCategory && (
									<div className="absolute top-3 left-3">
										<Badge
											variant="outline"
											className="backdrop-blur-sm bg-black/40 border-white/20 text-white"
										>
											{metaCategory.name}
										</Badge>
									</div>
								)}

								{/* Status Badge */}
								<div className="absolute top-3 right-3">
									<Badge
										variant={category.isActive ? "default" : "secondary"}
										className="backdrop-blur-sm"
									>
										{category.isActive
											? t("status.active")
											: t("status.inactive")}
									</Badge>
								</div>

								{/* Order Badge */}
								<div className="absolute bottom-3 left-3">
									<Badge
										variant="outline"
										className="backdrop-blur-sm bg-black/40 border-white/20 text-white"
									>
										{t("labels.order", { order: category.sortOrder })}
									</Badge>
								</div>

								{/* SubCategory Count */}
								<div className="absolute bottom-3 right-3">
									<Badge
										variant="outline"
										className="backdrop-blur-sm bg-black/40 border-white/20 text-white"
									>
										{t("categories.subcategory_count", {
											count: subCategoryCount,
										})}
									</Badge>
								</div>
							</div>

							{/* Category Content */}
							<div className="p-4">
								<h3 className="text-lg font-semibold text-foreground mb-1">
									{category.name}
								</h3>
								<p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
									{category.description || t("labels.no_description")}
								</p>

								{/* Manage SubCategories Link */}
								<Link
									href={`/${locale}/admin/subcategories?categoryId=${category._id}`}
									className="mt-3 flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors"
								>
									{t("categories.manage_subcategories")}
									<ChevronRight className="w-3 h-3" />
								</Link>

								{/* Action Buttons */}
								<div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
									<Button
										variant="ghost"
										size="sm"
										onClick={() =>
											onToggleActive(category._id, !category.isActive)
										}
										className="flex-1 gap-2"
									>
										{category.isActive ? (
											<EyeOff className="w-4 h-4" />
										) : (
											<Eye className="w-4 h-4" />
										)}
										{category.isActive
											? t("actions.deactivate")
											: t("actions.activate")}
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => onEdit(category)}
									>
										<Edit className="w-4 h-4" />
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => onDelete(category._id)}
									>
										<Trash2 className="w-4 h-4 text-destructive" />
									</Button>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
