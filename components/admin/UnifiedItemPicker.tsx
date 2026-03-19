"use client";

import { Check, Plus, Search } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Id } from "@/convex/_generated/dataModel";

interface ItemData {
	_id:
		| Id<"tools">
		| Id<"toolCategories">
		| Id<"toolSubCategories">
		| Id<"toolThemes">;
	name: string;
	description?: string;
	imageUrl?: string;
	key: string;
}

interface UnifiedItemPickerProps {
	items: ItemData[];
	itemType: "tool" | "category" | "subcategory" | "theme";
	selectedIds: string[];
	onAddItem: (
		type: "tool" | "category" | "subcategory" | "theme",
		referenceId: string,
	) => void;
}

export function UnifiedItemPicker({
	items,
	itemType,
	selectedIds,
	onAddItem,
}: UnifiedItemPickerProps) {
	const t = useTranslations("admin.wall_builder");
	const [searchQuery, setSearchQuery] = useState("");

	const filteredItems = items.filter(
		(item) =>
			item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ??
				false),
	);

	const isItemSelected = (id: string) => selectedIds.includes(id);

	const _getItemTypeLabel = () => {
		const labels = {
			tool: "Tools",
			category: "Categories",
			subcategory: "SubCategories",
			theme: "Themes",
		};
		return labels[itemType];
	};

	return (
		<Card className="p-4">
			<h3 className="text-lg font-semibold text-foreground mb-4">
				{t("available_items")}
			</h3>

			{/* Search */}
			<div className="relative mb-4">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
				<Input
					placeholder={t("search_items")}
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="pl-9"
				/>
			</div>

			{/* Items List */}
			<div className="max-h-[600px] overflow-y-auto space-y-2">
				{filteredItems.length === 0 ? (
					<p className="text-sm text-muted-foreground leading-relaxed text-center py-8">
						{t("no_items_available")}
					</p>
				) : (
					filteredItems.map((item) => {
						const selected = isItemSelected(item._id);
						return (
							<div
								key={item._id}
								className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-accent/50 transition-smooth"
							>
								<div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-muted">
									<Image
										src={item.imageUrl || "/placeholder.svg"}
										alt={item.name}
										fill
										className="object-cover"
									/>
								</div>
								<div className="flex-1 min-w-0">
									<p className="font-medium text-sm truncate leading-6">
										{item.name}
									</p>
									<p className="text-xs text-muted-foreground truncate leading-relaxed">
										{item.description || ""}
									</p>
								</div>
								<Button
									size="icon"
									variant={selected ? "outline" : "default"}
									onClick={() => onAddItem(itemType, item._id)}
									disabled={selected}
									className="min-h-[44px] min-w-[44px]"
									aria-label={
										selected
											? t("aria_already_on_wall")
											: t("aria_add_to_wall", { item: item.name })
									}
								>
									{selected ? (
										<Check className="w-4 h-4" />
									) : (
										<Plus className="w-4 h-4" />
									)}
								</Button>
							</div>
						);
					})
				)}
			</div>
		</Card>
	);
}
