"use client";

import { useMutation, useQuery } from "convex/react";
import { Play, Save } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { FlowSettings } from "@/components/admin/flow-settings";
import { QuestionEditorDialog } from "@/components/admin/question-editor-dialog";
import { QuestionList } from "@/components/admin/question-list";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import type { FlowQuestion } from "@/lib/refinement-flow-store";

// Convex question types
type ConvexQuestionType =
	| "text-radio"
	| "text-checkbox"
	| "visual-categories"
	| "visual-subcategories"
	| "visual-ads";

// Map FlowQuestion types to Convex question types
function mapToConvexQuestionType(
	type: FlowQuestion["type"],
): ConvexQuestionType {
	switch (type) {
		case "text":
		case "single-select":
		case "text-radio":
			return "text-radio";
		case "multi-select":
		case "text-checkbox":
			return "text-checkbox";
		case "visual":
		case "visual-categories":
			return "visual-categories";
		case "visual-subcategories":
			return "visual-subcategories";
		case "visual-ads":
			return "visual-ads";
		default:
			return "text-radio";
	}
}

// Extended FlowQuestion with Convex ID for tracking
interface LocalQuestion extends FlowQuestion {
	_id?: Id<"refinementQuestions">;
	sortOrder: number;
}

export default function EditFlowPage() {
	const params = useParams();
	const router = useRouter();
	const locale = useLocale();
	const flowId = params.id as string;
	const isNew = flowId === "new";

	// Local state for flow settings (before saving)
	const [localFlow, setLocalFlow] = useState<{
		name: string;
		description: string;
		triggerLevel: "tool" | "category" | "subcategory" | "vague";
		targetId: string;
		isActive: boolean;
		showConsultantIntro: boolean;
		consultantMessage: string;
		allowSkip: boolean;
	} | null>(null);

	// Local state for questions (before saving)
	const [localQuestions, setLocalQuestions] = useState<LocalQuestion[]>([]);
	const [editingQuestion, setEditingQuestion] = useState<LocalQuestion | null>(
		null,
	);
	const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

	// Convex queries - only fetch if not new
	const existingFlow = useQuery(
		api.refinementFlows.getFlowById,
		!isNew && flowId ? { flowId: flowId as Id<"refinementFlows"> } : "skip",
	);
	const existingQuestions = useQuery(
		api.refinementFlows.getQuestionsForFlow,
		!isNew && flowId ? { flowId: flowId as Id<"refinementFlows"> } : "skip",
	);

	// Convex mutations
	const createFlowMutation = useMutation(api.refinementFlows.createFlow);
	const updateFlowMutation = useMutation(api.refinementFlows.updateFlow);
	const createQuestionMutation = useMutation(
		api.refinementFlows.createQuestion,
	);
	const updateQuestionMutation = useMutation(
		api.refinementFlows.updateQuestion,
	);
	const deleteQuestionMutation = useMutation(
		api.refinementFlows.deleteQuestion,
	);
	const _reorderQuestionsMutation = useMutation(
		api.refinementFlows.reorderQuestions,
	);

	// Initialize local state from Convex data
	useEffect(() => {
		if (isNew && !localFlow) {
			setLocalFlow({
				name: "",
				description: "",
				triggerLevel: "tool",
				targetId: "",
				isActive: false,
				showConsultantIntro: false,
				consultantMessage: "",
				allowSkip: true,
			});
			setLocalQuestions([]);
		} else if (existingFlow && !localFlow) {
			setLocalFlow({
				name: existingFlow.name,
				description: existingFlow.description,
				triggerLevel: existingFlow.triggerLevel,
				targetId: existingFlow.targetId,
				isActive: existingFlow.isActive,
				showConsultantIntro: existingFlow.showConsultantIntro ?? false,
				consultantMessage: existingFlow.consultantMessage ?? "",
				allowSkip: existingFlow.allowSkip ?? true,
			});
		}
	}, [isNew, existingFlow, localFlow]);

	// Initialize questions from Convex
	useEffect(() => {
		if (
			existingQuestions &&
			localQuestions.length === 0 &&
			!hasUnsavedChanges
		) {
			setLocalQuestions(
				existingQuestions.map((q) => ({
					id: q._id,
					_id: q._id,
					type: q.type as FlowQuestion["type"],
					question: q.question,
					text: q.question,
					description: q.description,
					isRequired: q.isRequired,
					allowOther: q.allowOther,
					allowMultiple: q.allowMultiple,
					options: q.options,
					visualSource: q.visualSource,
					layout: q.layout,
					gridCols: q.gridCols,
					showIf: q.showIf,
					defaultValue: q.defaultValue,
					sortOrder: q.sortOrder,
					order: q.sortOrder,
				})),
			);
		}
	}, [existingQuestions, localQuestions.length, hasUnsavedChanges]);

	const handleSave = async () => {
		if (!localFlow) return;

		try {
			let savedFlowId: Id<"refinementFlows">;

			if (isNew) {
				// Create new flow
				savedFlowId = await createFlowMutation({
					name: localFlow.name,
					description: localFlow.description,
					triggerLevel: localFlow.triggerLevel,
					targetId: localFlow.targetId,
					isActive: localFlow.isActive,
					showConsultantIntro: localFlow.showConsultantIntro,
					consultantMessage: localFlow.consultantMessage,
					allowSkip: localFlow.allowSkip,
				});

				// Create all questions
				for (const q of localQuestions) {
					// Map FlowQuestion types to Convex question types
					const convexType = mapToConvexQuestionType(q.type);
					await createQuestionMutation({
						flowId: savedFlowId,
						type: convexType,
						question: q.question,
						description: q.description,
						isRequired: q.isRequired,
						allowOther: q.allowOther,
						allowMultiple: q.allowMultiple,
						options: q.options,
						visualSource: q.visualSource,
						layout: q.layout,
						gridCols: q.gridCols,
						showIf: q.showIf,
						defaultValue: q.defaultValue,
						sortOrder: q.sortOrder,
					});
				}
			} else {
				savedFlowId = flowId as Id<"refinementFlows">;

				// Update flow
				await updateFlowMutation({
					flowId: savedFlowId,
					updates: {
						name: localFlow.name,
						description: localFlow.description,
						triggerLevel: localFlow.triggerLevel,
						targetId: localFlow.targetId,
						isActive: localFlow.isActive,
						showConsultantIntro: localFlow.showConsultantIntro,
						consultantMessage: localFlow.consultantMessage,
						allowSkip: localFlow.allowSkip,
					},
				});

				// Handle questions - update existing, create new, delete removed
				const existingIds = new Set(existingQuestions?.map((q) => q._id) ?? []);
				const localIds = new Set(
					localQuestions.filter((q) => q._id).map((q) => q._id),
				);

				// Delete removed questions
				for (const existingQ of existingQuestions ?? []) {
					if (!localIds.has(existingQ._id)) {
						await deleteQuestionMutation({ questionId: existingQ._id });
					}
				}

				// Update or create questions
				for (const q of localQuestions) {
					const convexType = mapToConvexQuestionType(q.type);
					if (q._id && existingIds.has(q._id)) {
						// Update existing
						await updateQuestionMutation({
							questionId: q._id,
							updates: {
								type: convexType,
								question: q.question,
								description: q.description,
								isRequired: q.isRequired,
								allowOther: q.allowOther,
								allowMultiple: q.allowMultiple,
								options: q.options,
								visualSource: q.visualSource,
								layout: q.layout,
								gridCols: q.gridCols,
								showIf: q.showIf,
								defaultValue: q.defaultValue,
								sortOrder: q.sortOrder,
							},
						});
					} else {
						// Create new
						await createQuestionMutation({
							flowId: savedFlowId,
							type: convexType,
							question: q.question,
							description: q.description,
							isRequired: q.isRequired,
							allowOther: q.allowOther,
							allowMultiple: q.allowMultiple,
							options: q.options,
							visualSource: q.visualSource,
							layout: q.layout,
							gridCols: q.gridCols,
							showIf: q.showIf,
							defaultValue: q.defaultValue,
							sortOrder: q.sortOrder,
						});
					}
				}
			}

			setHasUnsavedChanges(false);
			router.push(`/${locale}/admin/refinement-flows`);
		} catch (error) {
			console.error("Failed to save flow:", error);
			alert("Failed to save flow. Please try again.");
		}
	};

	const handleSettingsChange = (settings: Partial<typeof localFlow>) => {
		if (!localFlow) return;
		setLocalFlow({ ...localFlow, ...settings });
		setHasUnsavedChanges(true);
	};

	const handleAddQuestion = () => {
		setEditingQuestion(null);
		setIsQuestionDialogOpen(true);
	};

	const handleEditQuestion = (question: FlowQuestion) => {
		setEditingQuestion(question as LocalQuestion);
		setIsQuestionDialogOpen(true);
	};

	const handleSaveQuestion = (question: FlowQuestion) => {
		const localQ: LocalQuestion = {
			...question,
			sortOrder: question.order,
		};
		if (editingQuestion) {
			setLocalQuestions(
				localQuestions.map((q) => (q.id === localQ.id ? localQ : q)),
			);
		} else {
			const newQ: LocalQuestion = {
				...localQ,
				id: crypto.randomUUID(),
				sortOrder: localQuestions.length,
				order: localQuestions.length,
			};
			setLocalQuestions([...localQuestions, newQ]);
		}
		setHasUnsavedChanges(true);
		setIsQuestionDialogOpen(false);
		setEditingQuestion(null);
	};

	const handleDeleteQuestion = (questionId: string) => {
		if (confirm("Are you sure you want to delete this question?")) {
			setLocalQuestions(localQuestions.filter((q) => q.id !== questionId));
			setHasUnsavedChanges(true);
		}
	};

	const handleReorderQuestions = (questions: FlowQuestion[]) => {
		setLocalQuestions(
			questions.map(
				(q, index) =>
					({ ...q, sortOrder: index, order: index }) as LocalQuestion,
			),
		);
		setHasUnsavedChanges(true);
	};

	if (!localFlow) {
		return <div className="p-8">Loading...</div>;
	}

	// Create a flow-like object for FlowSettings component
	const flowForSettings = {
		id: flowId,
		_id: flowId as Id<"refinementFlows">,
		...localFlow,
		questions: localQuestions,
	};

	return (
		<div className="h-full flex flex-col">
			<AdminHeader
				title={isNew ? "Create Refinement Flow" : "Edit Refinement Flow"}
				description="Configure questions and settings for this refinement flow"
				action={{
					label: "Save Flow",
					onClick: handleSave,
					icon: Save,
				}}
			/>

			<div className="flex-1 overflow-auto">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
					<div className="lg:col-span-1">
						<FlowSettings
							flow={flowForSettings}
							onChange={handleSettingsChange}
						/>

						{!isNew && (
							<div className="mt-6">
								<Button
									variant="outline"
									className="w-full gap-2 bg-transparent"
									asChild
								>
									<Link
										href={`/${locale}/admin/refinement-flows/${flowId}/preview`}
									>
										<Play className="w-4 h-4" />
										Preview Flow
									</Link>
								</Button>
							</div>
						)}
					</div>

					<div className="lg:col-span-2">
						<QuestionList
							questions={localQuestions as FlowQuestion[]}
							onAdd={handleAddQuestion}
							onEdit={handleEditQuestion}
							onDelete={handleDeleteQuestion}
							onReorder={handleReorderQuestions}
						/>
					</div>
				</div>
			</div>

			<QuestionEditorDialog
				open={isQuestionDialogOpen}
				question={editingQuestion as FlowQuestion | null}
				flowId={flowId}
				onClose={() => {
					setIsQuestionDialogOpen(false);
					setEditingQuestion(null);
				}}
				onSave={handleSaveQuestion}
			/>
		</div>
	);
}
