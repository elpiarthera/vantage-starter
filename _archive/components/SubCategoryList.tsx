"use client";

import { Edit, Eye, EyeOff, Layers, Trash2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/admin/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Doc } from "@/convex/_generated/dataModel";

interface SubCategoryListProps {
	subCategories: Doc<"toolSubCategories">[];
	categories: Doc<"toolCategories">[];
	metaCategories: Doc<"tools">[];
	onEdit: (subCategory: Doc<"toolSubCategories">) => void;
	onDelete: (id: Doc<"toolSubCategories">["_id"]) => void;
	onToggleActive: (
		id: Doc<"toolSubCategories">["_id"],
		isActive: boolean,
	) => void;
	onCreate?: () => void;
}

export function SubCategoryList({
	subCategories,
	categories,
	metaCategories,
	onEdit,
	onDelete,
	onToggleActive,
	onCreate,
}: SubCategoryListProps) {
	const t = useTranslations("admin");

	if (subCategories.length === 0) {
		return (
			<EmptyState
				icon={Layers}
				title={t("subcategories.empty_title")}
				description={t("subcategories.empty_description")}
				action={{
					label: t("subcategories.empty_action"),
					onClick: onCreate ?? (() => {}),
				}}
			/>
		);
	}

	return (
		<div className="p-8">
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{subCategories.map((subCategory) => {
					const category = categories.find(
						(c) => c._id === subCategory.categoryId,
					);
					const metaCategory = category
						? metaCategories.find((m) => m._id === category.toolId)
						: null;

					return (
						<div
							key={subCategory._id}
							className="group relative bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
						>
							{/* SubCategory Image */}
							<div className="relative aspect-[4/3] bg-muted overflow-hidden">
								<Image
									src={subCategory.imageUrl || "/placeholder.svg"}
									alt={subCategory.name}
									fill
									className="object-cover group-hover:scale-105 transition-transform duration-300"
								/>
								<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

								{/* Breadcrumb Badge */}
								{metaCategory && category && (
									<div className="absolute top-3 left-3">
										<Badge
											variant="outline"
											className="backdrop-blur-sm bg-black/40 border-white/20 text-white text-xs"
										>
											{category.name}
										</Badge>
									</div>
								)}

								{/* Status Badge */}
								<div className="absolute top-3 right-3">
									<Badge
										variant={subCategory.isActive ? "default" : "secondary"}
										className="backdrop-blur-sm"
									>
										{subCategory.isActive
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
										{t("labels.order", { order: subCategory.sortOrder })}
									</Badge>
								</div>
							</div>

							{/* SubCategory Content */}
							<div className="p-4">
								<h3 className="text-lg font-semibold text-foreground mb-1">
									{subCategory.name}
								</h3>
								<p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
									{subCategory.description || t("labels.no_description")}
								</p>

								{/* Action Buttons */}
								<div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
									<Button
										variant="ghost"
										size="sm"
										onClick={() =>
											onToggleActive(subCategory._id, !subCategory.isActive)
										}
										className="flex-1 gap-2"
									>
										{subCategory.isActive ? (
											<EyeOff className="w-4 h-4" />
										) : (
											<Eye className="w-4 h-4" />
										)}
										{subCategory.isActive
											? t("actions.deactivate")
											: t("actions.activate")}
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => onEdit(subCategory)}
									>
										<Edit className="w-4 h-4" />
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => onDelete(subCategory._id)}
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
