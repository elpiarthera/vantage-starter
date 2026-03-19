"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
	GripVertical,
	Image as ImageIcon,
	LayoutGrid,
	Palette,
	Sparkles,
	X,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Id } from "@/convex/_generated/dataModel";

interface WallItem {
	id: string;
	type: "tool" | "category" | "subcategory" | "theme";
	referenceId:
		| Id<"tools">
		| Id<"toolCategories">
		| Id<"toolSubCategories">
		| Id<"toolThemes">;
	order: number;
}

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

interface SortableItemProps {
	item: WallItem & { data?: ItemData };
	onRemove: (id: string) => void;
}

const TYPE_ICONS = {
	tool: LayoutGrid,
	category: Palette,
	subcategory: Sparkles,
	theme: ImageIcon,
};

export function SortableItem({ item, onRemove }: SortableItemProps) {
	const t = useTranslations("admin.wall_builder");
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

	const Icon = TYPE_ICONS[item.type];

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
				type="button"
				{...attributes}
				{...listeners}
				className="min-w-[44px] min-h-[44px] flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-smooth focus:outline-none focus:ring-2 focus:ring-ring rounded p-2"
				aria-label={t("aria_drag_to_reorder")}
			>
				<GripVertical className="w-5 h-5" />
			</button>

			{/* Item Image */}
			<div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
				<Image
					src={item.data.imageUrl || "/placeholder.svg"}
					alt={item.data.name}
					fill
					className="object-cover"
				/>
			</div>

			{/* Item Info */}
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 mb-1">
					<Badge variant="outline" className="gap-1">
						<Icon className="w-3 h-3" />
						{t(`type_labels.${item.type}`)}
					</Badge>
					<span className="text-xs text-muted-foreground">
						{t("order_label", { order: item.order })}
					</span>
				</div>
				<h4 className="font-semibold text-foreground truncate leading-6">
					{item.data.name}
				</h4>
				<p className="text-sm text-muted-foreground truncate leading-relaxed">
					{item.data.description || ""}
				</p>
			</div>

			{/* Remove Button */}
			<Button
				variant="ghost"
				size="icon"
				onClick={() => onRemove(item.id)}
				className="min-h-[44px] min-w-[44px]"
				aria-label={t("aria_remove_from_wall")}
			>
				<X className="w-4 h-4" />
			</Button>
		</div>
	);
}
