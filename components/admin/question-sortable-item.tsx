"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Edit, GripVertical, ImageIcon, Trash2, Type } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FlowQuestion } from "@/lib/refinement-flow-store";

interface QuestionSortableItemProps {
	question: FlowQuestion;
	onEdit: (question: FlowQuestion) => void;
	onDelete: (questionId: string) => void;
}

export function QuestionSortableItem({
	question,
	onEdit,
	onDelete,
}: QuestionSortableItemProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: question.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg hover:shadow-md transition-shadow"
		>
			<button
				type="button"
				{...attributes}
				{...listeners}
				className="cursor-grab active:cursor-grabbing touch-none"
			>
				<GripVertical className="w-5 h-5 text-muted-foreground" />
			</button>

			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 mb-1">
					<Badge variant="outline" className="text-xs">
						{question.order}
					</Badge>
					{question.type === "text" ? (
						<Type className="w-4 h-4" />
					) : (
						<ImageIcon className="w-4 h-4" />
					)}
					<span className="font-medium text-sm">
						{question.type === "text" ? "Text" : "Visual"}
					</span>
					{question.allowMultiple && (
						<Badge variant="secondary">Multi-select</Badge>
					)}
				</div>
				<p className="text-sm text-foreground truncate">{question.text}</p>
				<p className="text-xs text-muted-foreground">
					{question.type === "text"
						? `${question.options?.length || 0} options`
						: `${question.visualSource?.categoryIds?.length || 0} visual items`}
				</p>
			</div>

			<div className="flex items-center gap-1">
				<Button variant="ghost" size="sm" onClick={() => onEdit(question)}>
					<Edit className="w-4 h-4" />
				</Button>
				<Button variant="ghost" size="sm" onClick={() => onDelete(question.id)}>
					<Trash2 className="w-4 h-4 text-destructive" />
				</Button>
			</div>
		</div>
	);
}
