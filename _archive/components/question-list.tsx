"use client";

import type { DragEndEvent } from "@dnd-kit/core";
import {
	closestCenter,
	DndContext,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { HelpCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FlowQuestion } from "@/lib/refinement-flow-store";
import { EmptyState } from "./EmptyState";
import { QuestionSortableItem } from "./question-sortable-item";

interface QuestionListProps {
	questions: FlowQuestion[];
	onAdd: () => void;
	onEdit: (question: FlowQuestion) => void;
	onDelete: (questionId: string) => void;
	onReorder: (questions: FlowQuestion[]) => void;
}

export function QuestionList({
	questions,
	onAdd,
	onEdit,
	onDelete,
	onReorder,
}: QuestionListProps) {
	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			const oldIndex = questions.findIndex((q) => q.id === active.id);
			const newIndex = questions.findIndex((q) => q.id === over.id);
			onReorder(arrayMove(questions, oldIndex, newIndex));
		}
	};

	if (questions.length === 0) {
		return (
			<div>
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-lg font-semibold">Questions</h2>
					<Button onClick={onAdd} className="gap-2">
						<Plus className="w-4 h-4" />
						Add Question
					</Button>
				</div>
				<EmptyState
					icon={HelpCircle}
					title="No questions yet"
					description="Add questions to guide users through the refinement process"
					action={{ label: "Add First Question", onClick: onAdd }}
				/>
			</div>
		);
	}

	return (
		<div>
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-lg font-semibold">
					Questions ({questions.length})
				</h2>
				<Button onClick={onAdd} className="gap-2">
					<Plus className="w-4 h-4" />
					Add Question
				</Button>
			</div>

			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={questions.map((q) => q.id)}
					strategy={verticalListSortingStrategy}
				>
					<div className="space-y-3">
						{questions.map((question) => (
							<QuestionSortableItem
								key={question.id}
								question={question}
								onEdit={onEdit}
								onDelete={onDelete}
							/>
						))}
					</div>
				</SortableContext>
			</DndContext>
		</div>
	);
}
