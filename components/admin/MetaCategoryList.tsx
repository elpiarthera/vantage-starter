"use client";

import { ChevronRight, Edit, Eye, EyeOff, Layers, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { EmptyState } from "@/components/admin/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Doc } from "@/convex/_generated/dataModel";

interface MetaCategoryListProps {
	metaCategories: Doc<"tools">[];
	categoryCounts: Record<string, number>;
	onEdit: (metaCategory: Doc<"tools">) => void;
	onDelete: (id: Doc<"tools">["_id"]) => void;
	onToggleActive: (id: Doc<"tools">["_id"], isActive: boolean) => void;
	onCreate?: () => void;
}

export function MetaCategoryList({
	metaCategories,
	categoryCounts,
	onEdit,
	onDelete,
	onToggleActive,
	onCreate,
}: MetaCategoryListProps) {
	const t = useTranslations("admin");
	const locale = useLocale();

	if (metaCategories.length === 0) {
		return (
			<EmptyState
				icon={Layers}
				title={t("meta_categories.empty_title")}
				description={t("meta_categories.empty_description")}
				action={{
					label: t("meta_categories.empty_action"),
					onClick: onCreate ?? (() => {}),
				}}
			/>
		);
	}

	return (
		<div className="p-8">
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{metaCategories.map((metaCategory) => {
					const categoryCount = categoryCounts[metaCategory._id] || 0;

					return (
						<div
							key={metaCategory._id}
							className="group relative bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
						>
							{/* Meta Category Image */}
							<div className="relative aspect-[4/3] bg-muted overflow-hidden">
								<Image
									src={metaCategory.imageUrl || "/placeholder.svg"}
									alt={metaCategory.name}
									fill
									className="object-cover group-hover:scale-105 transition-transform duration-300"
								/>
								<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

								{/* Status Badge */}
								<div className="absolute top-3 right-3">
									<Badge
										variant={metaCategory.isActive ? "default" : "secondary"}
										className="backdrop-blur-sm"
									>
										{metaCategory.isActive
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
										{t("labels.order", { order: metaCategory.sortOrder })}
									</Badge>
								</div>

								{/* Category Count */}
								<div className="absolute bottom-3 right-3">
									<Badge
										variant="outline"
										className="backdrop-blur-sm bg-black/40 border-white/20 text-white"
									>
										{t("meta_categories.category_count", {
											count: categoryCount,
										})}
									</Badge>
								</div>
							</div>

							{/* Meta Category Content */}
							<div className="p-4">
								<h3 className="text-lg font-semibold text-foreground mb-1">
									{metaCategory.name}
								</h3>
								<p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
									{metaCategory.description}
								</p>

								{/* Manage Categories Link */}
								<Link
									href={`/${locale}/admin/categories?toolId=${metaCategory._id}`}
									className="mt-3 flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors"
								>
									{t("meta_categories.manage_categories")}
									<ChevronRight className="w-3 h-3" />
								</Link>

								{/* Action Buttons */}
								<div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
									<Button
										variant="ghost"
										size="sm"
										onClick={() =>
											onToggleActive(metaCategory._id, !metaCategory.isActive)
										}
										className="flex-1 gap-2"
									>
										{metaCategory.isActive ? (
											<EyeOff className="w-4 h-4" />
										) : (
											<Eye className="w-4 h-4" />
										)}
										{metaCategory.isActive
											? t("actions.deactivate")
											: t("actions.activate")}
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => onEdit(metaCategory)}
									>
										<Edit className="w-4 h-4" />
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => onDelete(metaCategory._id)}
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
