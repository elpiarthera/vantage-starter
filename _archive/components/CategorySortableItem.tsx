"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ImageIcon, LayoutGrid, X } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
	AdminAd,
	AdminCategory,
	CategoryWallItem,
} from "@/lib/admin-mock-data";

interface CategorySortableItemProps {
	item: CategoryWallItem & { data?: AdminCategory | AdminAd };
	onRemove: (id: string) => void;
}

export function CategorySortableItem({
	item,
	onRemove,
}: CategorySortableItemProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: item.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	if (!item.data) return null;

	const data = item.data;
	const name =
		"name" in data ? (data as AdminCategory).name : (data as AdminAd).title;

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`flex items-center gap-3 p-4 bg-card border border-border rounded-lg ${
				isDragging ? "opacity-50 shadow-lg" : ""
			}`}
		>
			{/* Drag Handle */}
			<button
				{...attributes}
				{...listeners}
				className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
			>
				<GripVertical className="w-5 h-5" />
			</button>

			{/* Item Image */}
			<div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
				<Image
					src={data.imageUrl || "/placeholder.svg"}
					alt={name}
					fill
					className="object-cover"
				/>
			</div>

			{/* Item Info */}
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 mb-1">
					<Badge variant="outline" className="gap-1">
						{item.type === "category" ? (
							<LayoutGrid className="w-3 h-3" />
						) : (
							<ImageIcon className="w-3 h-3" />
						)}
						{item.type === "category" ? "Category" : "Ad"}
					</Badge>
					<span className="text-xs text-muted-foreground">
						Order: {item.order}
					</span>
				</div>
				<h4 className="font-semibold text-foreground truncate">{name}</h4>
				<p className="text-sm text-muted-foreground truncate">
					{data.baseline}
				</p>
			</div>

			{/* Remove Button */}
			<Button variant="ghost" size="sm" onClick={() => onRemove(item.id)}>
				<X className="w-4 h-4" />
			</Button>
		</div>
	);
}
