"use client";

import { ChevronLeft, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { VisualOptionCard } from "@/components/refinement/visual-option-card";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AdminAdStore } from "@/lib/admin-mock-data";
import { metaCategoriesStore } from "@/lib/meta-categories-mock-data";
import {
	type FlowQuestion,
	type RefinementFlow,
	RefinementFlowStore,
	type RefinementQuestion,
} from "@/lib/refinement-flow-store";

interface RefinementModalProps {
	isOpen: boolean;
	onClose: () => void;
	flow: RefinementFlow;
	sessionId: string;
	onComplete: (answers: Record<string, string | string[]>) => void;
	onCancel: () => void;
}

export function RefinementModal({
	isOpen,
	onClose,
	flow,
	sessionId,
	onComplete,
	onCancel,
}: RefinementModalProps) {
	const [session, setSession] =
		useState<ReturnType<typeof RefinementFlowStore.getSession>>(null);
	const [currentQuestion, setCurrentQuestion] = useState<
		RefinementQuestion | FlowQuestion | null
	>(null);
	const [selectedAnswer, setSelectedAnswer] = useState<string | string[]>("");
	const [otherText, setOtherText] = useState("");
	const [showOtherInput, setShowOtherInput] = useState(false);
	const [showConfirmClose, setShowConfirmClose] = useState(false);
	const [_currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

	// Initialize or restore session
	useEffect(() => {
		if (isOpen && flow) {
			let existingSession = RefinementFlowStore.getSession(sessionId);

			if (!existingSession || existingSession.flowId !== flow.id) {
				// Create new session
				existingSession = RefinementFlowStore.createSession(flow.id, sessionId);
			}

			setSession(existingSession);

			// Load current question
			const question = RefinementFlowStore.getCurrentQuestion(existingSession);
			setCurrentQuestion(question);
			setCurrentQuestionIndex(existingSession.currentQuestionIndex);

			// Restore saved answer for this question
			if (question && existingSession.answers[question.id]) {
				const savedAnswer = existingSession.answers[question.id];
				setSelectedAnswer(savedAnswer);

				// Check if "other" was selected
				if (
					typeof savedAnswer === "string" &&
					savedAnswer.startsWith("other:")
				) {
					setShowOtherInput(true);
					setOtherText(savedAnswer.replace("other:", ""));
				}
			} else {
				// Use default value if available
				if (question?.defaultValue) {
					setSelectedAnswer(question.defaultValue);
				} else {
					setSelectedAnswer(question?.type === "text-checkbox" ? [] : "");
				}
				setShowOtherInput(false);
				setOtherText("");
			}
		}
	}, [isOpen, flow, sessionId]);

	// Get current progress
	const progress = useMemo(() => {
		if (!session || !currentQuestion) return { current: 0, total: 0 };

		const visibleQuestions = flow.questions.filter((q) => {
			if (!q.showIf) return true;

			const dependencyAnswer = session.answers[q.showIf.questionId];
			const expectedValue = q.showIf.answerValue;

			return Array.isArray(expectedValue)
				? Array.isArray(dependencyAnswer) &&
						dependencyAnswer.some((v) => expectedValue.includes(v))
				: dependencyAnswer === expectedValue;
		});

		const currentIndex = visibleQuestions.findIndex(
			(q) => q.id === currentQuestion.id,
		);
		return {
			current: currentIndex + 1,
			total: visibleQuestions.length,
		};
	}, [session, currentQuestion, flow]);

	// Handle answer change
	const handleAnswerChange = (value: string | string[]) => {
		setSelectedAnswer(value);

		// Reset "other" if changing away from it
		if (value !== "other") {
			setShowOtherInput(false);
			setOtherText("");
		}
	};

	// Handle checkbox change
	const handleCheckboxChange = (value: string) => {
		const current = selectedAnswer as string[];
		if (current.includes(value)) {
			handleAnswerChange(current.filter((v) => v !== value));
		} else {
			handleAnswerChange([...current, value]);
		}
	};

	// Handle "Other" selection
	const handleOtherClick = () => {
		setShowOtherInput(true);
		setSelectedAnswer("other");
	};

	// Handle next question
	const handleNext = () => {
		if (!session || !currentQuestion) return;

		// Validate required fields
		if (currentQuestion.isRequired) {
			if (Array.isArray(selectedAnswer) && selectedAnswer.length === 0) return;
			if (!Array.isArray(selectedAnswer) && !selectedAnswer) return;
			if (selectedAnswer === "other" && !otherText.trim()) return;
		}

		// Save answer
		const finalAnswer =
			selectedAnswer === "other" ? `other:${otherText}` : selectedAnswer;

		const updatedAnswers = {
			...session.answers,
			[currentQuestion.id]: finalAnswer,
		};

		RefinementFlowStore.updateSession(session.id, {
			answers: updatedAnswers,
			currentQuestionIndex: session.currentQuestionIndex + 1,
		});

		// Get next question
		const updatedSession = RefinementFlowStore.getSession(session.id)!;
		const nextQuestion = RefinementFlowStore.getCurrentQuestion(updatedSession);

		if (nextQuestion) {
			// Move to next question
			setCurrentQuestion(nextQuestion);
			setSession(updatedSession);
			setCurrentQuestionIndex(updatedSession.currentQuestionIndex);

			// Load saved answer or default
			if (updatedSession.answers[nextQuestion.id]) {
				const savedAnswer = updatedSession.answers[nextQuestion.id];
				setSelectedAnswer(savedAnswer);

				if (
					typeof savedAnswer === "string" &&
					savedAnswer.startsWith("other:")
				) {
					setShowOtherInput(true);
					setOtherText(savedAnswer.replace("other:", ""));
				}
			} else {
				setSelectedAnswer(
					nextQuestion.defaultValue ||
						(nextQuestion.type === "text-checkbox" ? [] : ""),
				);
				setShowOtherInput(false);
				setOtherText("");
			}
		} else {
			// Complete flow
			RefinementFlowStore.completeSession(session.id);
			onComplete(updatedAnswers);
		}
	};

	// Handle back
	const handleBack = () => {
		if (!session || !currentQuestion) return;

		// Find previous question index
		const currentIndex = flow.questions.findIndex(
			(q) => q.id === currentQuestion.id,
		);
		if (currentIndex <= 0) return;

		// Move back
		const previousQuestion = flow.questions[currentIndex - 1];
		setCurrentQuestion(previousQuestion);
		setCurrentQuestionIndex(currentIndex - 1);

		RefinementFlowStore.updateSession(session.id, {
			currentQuestionIndex: currentIndex - 1,
		});

		// Restore previous answer
		const savedAnswer = session.answers[previousQuestion.id];
		if (savedAnswer) {
			setSelectedAnswer(savedAnswer);
			if (typeof savedAnswer === "string" && savedAnswer.startsWith("other:")) {
				setShowOtherInput(true);
				setOtherText(savedAnswer.replace("other:", ""));
			}
		} else {
			setSelectedAnswer(previousQuestion.type === "text-checkbox" ? [] : "");
			setShowOtherInput(false);
			setOtherText("");
		}
	};

	// Handle close with confirmation
	const handleCloseAttempt = () => {
		if (
			session &&
			Object.keys(session.answers).length > 0 &&
			!session.isComplete
		) {
			setShowConfirmClose(true);
		} else {
			handleClose();
		}
	};

	const handleClose = () => {
		if (session) {
			RefinementFlowStore.abandonSession(session.id);
		}
		setShowConfirmClose(false);
		onClose();
	};

	const visualItems = useMemo(() => {
		if (
			!currentQuestion ||
			!("visualReferenceIds" in currentQuestion) ||
			!currentQuestion.visualReferenceIds
		)
			return [];

		const items = currentQuestion.visualReferenceIds
			.map((id: string) => {
				if (currentQuestion.type === "visual-categories") {
					const category = metaCategoriesStore.getCategoryById(id);
					return category
						? {
								id: category.id,
								name: category.name,
								description: category.baseline,
								imageUrl: category.imageUrl,
								isSponsored: false,
							}
						: null;
				} else if (currentQuestion.type === "visual-subcategories") {
					const subcategory = metaCategoriesStore.getSubCategoryById(id);
					return subcategory
						? {
								id: subcategory.id,
								name: subcategory.name,
								description: subcategory.baseline,
								imageUrl: subcategory.imageUrl,
								isSponsored: false,
							}
						: null;
				} else if (currentQuestion.type === "visual-ads") {
					const ad = AdminAdStore.getById(id);
					return ad
						? {
								id: ad.id,
								name: ad.title,
								description: ad.baseline,
								imageUrl: ad.imageUrl,
								isSponsored: true,
								linkUrl: ad.linkUrl,
							}
						: null;
				}
				return null;
			})
			.filter(
				(
					item: {
						id: string;
						name: string;
						description: string;
						imageUrl: string;
						isSponsored: boolean;
						linkUrl?: string;
					} | null,
				): item is NonNullable<typeof item> => item !== null,
			);

		return items;
	}, [currentQuestion]);

	const useHorizontalScroll = visualItems.length > 6;
	const gridCols = useMemo(() => {
		if (useHorizontalScroll) return ""; // Use scroll container instead
		if (visualItems.length <= 2) return "grid-cols-1 md:grid-cols-2";
		if (visualItems.length <= 4)
			return "grid-cols-2 md:grid-cols-2 lg:grid-cols-4";
		return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
	}, [visualItems.length, useHorizontalScroll]);

	// Check if can proceed
	const canProceed = useMemo(() => {
		if (!currentQuestion) return false;
		if (!currentQuestion.isRequired) return true;

		if (Array.isArray(selectedAnswer)) {
			return selectedAnswer.length > 0;
		}

		if (selectedAnswer === "other") {
			return otherText.trim().length > 0;
		}

		return !!selectedAnswer;
	}, [currentQuestion, selectedAnswer, otherText]);

	if (!currentQuestion || !session) return null;

	return (
		<>
			<Dialog open={isOpen} onOpenChange={handleCloseAttempt}>
				<DialogContent
					className="w-full h-[100dvh] md:h-auto md:max-w-2xl md:max-h-[85vh] p-0 gap-0 bg-[oklch(0.15_0.02_var(--hue))] border-white/10 md:rounded-2xl overflow-hidden flex flex-col touch-optimized"
					onPointerDownOutside={(e) => e.preventDefault()}
					onEscapeKeyDown={(e) => {
						e.preventDefault();
						handleCloseAttempt();
					}}
				>
					<div className="flex-none border-b border-white/10 bg-[oklch(0.12_0.02_var(--hue))] safe-top">
						<div className="flex items-center justify-between p-4 md:p-6">
							<div className="flex items-center gap-3">
								{progress.current > 1 && (
									<Button
										variant="ghost"
										size="icon"
										onClick={handleBack}
										className="text-white/70 hover:text-white min-w-[44px] min-h-[44px]"
									>
										<ChevronLeft className="w-5 h-5" />
									</Button>
								)}
								<div>
									<p className="text-xs text-white/50">
										Step {progress.current} of {progress.total}
									</p>
									<h2 className="text-lg font-semibold text-white">
										{flow.name}
									</h2>
								</div>
							</div>
							<Button
								variant="ghost"
								size="icon"
								onClick={handleCloseAttempt}
								className="text-white/70 hover:text-white min-w-[44px] min-h-[44px]"
							>
								<X className="w-5 h-5" />
							</Button>
						</div>

						{/* Progress bar */}
						<div className="h-1 bg-white/5">
							<div
								className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out gpu-accelerated"
								style={{
									width: `${(progress.current / progress.total) * 100}%`,
								}}
							/>
						</div>

						{/* Consultant intro (first question only) */}
						{progress.current === 1 &&
							flow.showConsultantIntro &&
							flow.consultantMessage && (
								<div className="p-4 md:p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-white/5">
									<div className="flex items-start gap-3">
										<div className="flex-none w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
											<Sparkles className="w-5 h-5 text-white" />
										</div>
										<p className="text-white/90 text-sm md:text-base leading-relaxed">
											{flow.consultantMessage}
										</p>
									</div>
								</div>
							)}
					</div>

					{/* Scrollable Content */}
					<div className="flex-1 overflow-y-auto overscroll-contain">
						<div className="p-4 md:p-8">
							{/* Question */}
							{currentQuestion && (
								<div className="space-y-4">
									<div>
										<h3 className="text-xl md:text-2xl font-semibold text-white mb-2">
											{currentQuestion.question}
										</h3>
										{currentQuestion.description && (
											<p className="text-sm text-white/60">
												{currentQuestion.description}
											</p>
										)}
									</div>

									{/* Text Radio Questions */}
									{currentQuestion.type === "text-radio" &&
										currentQuestion.options && (
											<RadioGroup
												value={selectedAnswer as string}
												onValueChange={handleAnswerChange}
											>
												<div className="space-y-2">
													{currentQuestion.options.map((option) => (
														<div
															key={option.id}
															className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
															onClick={() => handleAnswerChange(option.value)}
														>
															<RadioGroupItem
																value={option.value}
																id={option.id}
																className="border-white/30"
															/>
															<Label
																htmlFor={option.id}
																className="text-white cursor-pointer flex-1"
															>
																{option.label}
															</Label>
														</div>
													))}
												</div>
											</RadioGroup>
										)}

									{/* Text Checkbox Questions */}
									{currentQuestion.type === "text-checkbox" &&
										currentQuestion.options && (
											<div className="space-y-2">
												{currentQuestion.options.map((option) => (
													<div
														key={option.id}
														className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
														onClick={() => handleCheckboxChange(option.value)}
													>
														<Checkbox
															id={option.id}
															checked={
																Array.isArray(selectedAnswer) &&
																selectedAnswer.includes(option.value)
															}
															onCheckedChange={() =>
																handleCheckboxChange(option.value)
															}
															className="border-white/30"
														/>
														<Label
															htmlFor={option.id}
															className="text-white cursor-pointer flex-1"
														>
															{option.label}
														</Label>
													</div>
												))}
											</div>
										)}

									{(currentQuestion.type === "visual-categories" ||
										currentQuestion.type === "visual-subcategories" ||
										currentQuestion.type === "visual-ads") && (
										<div className="space-y-4">
											{useHorizontalScroll ? (
												// Horizontal scroll for >6 items
												<div className="relative -mx-4 md:-mx-6">
													<div className="overflow-x-auto snap-x snap-mandatory scrollbar-hide px-4 md:px-6">
														<div className="flex gap-3 md:gap-4 pb-2">
															{visualItems.map((item) => (
																<div
																	key={item.id}
																	className="snap-start flex-shrink-0 w-[180px] md:w-[220px]"
																>
																	<VisualOptionCard
																		id={item.id}
																		name={item.name}
																		description={item.description}
																		imageUrl={item.imageUrl}
																		isSelected={selectedAnswer === item.id}
																		isSponsored={item.isSponsored}
																		onSelect={handleAnswerChange}
																		size="default"
																	/>
																</div>
															))}
														</div>
													</div>
													{/* Scroll hint gradient */}
													<div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-[oklch(0.15_0.02_var(--hue))] to-transparent pointer-events-none" />
												</div>
											) : (
												// Grid layout for ≤6 items
												<div className={`grid ${gridCols} gap-3 md:gap-4`}>
													{visualItems.map((item) => (
														<VisualOptionCard
															key={item.id}
															id={item.id}
															name={item.name}
															description={item.description}
															imageUrl={item.imageUrl}
															isSelected={selectedAnswer === item.id}
															isSponsored={item.isSponsored}
															onSelect={handleAnswerChange}
														/>
													))}
												</div>
											)}

											{currentQuestion.allowOther && (
												<Button
													variant="outline"
													onClick={handleOtherClick}
													className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent"
												>
													Other (please specify)
												</Button>
											)}

											{showOtherInput && (
												<div className="space-y-2">
													<Label
														htmlFor="other-input"
														className="text-white/80 text-sm"
													>
														Please specify:
													</Label>
													<Input
														id="other-input"
														value={otherText}
														onChange={(e) => setOtherText(e.target.value)}
														placeholder="Type your answer..."
														className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
														autoFocus
													/>
												</div>
											)}
										</div>
									)}
								</div>
							)}
						</div>
					</div>

					<div className="flex-none border-t border-white/10 p-4 md:p-6 bg-[oklch(0.12_0.02_var(--hue))] safe-bottom">
						<div className="flex gap-3">
							<Button
								variant="outline"
								onClick={handleCloseAttempt}
								className="flex-1 border-white/20 text-white hover:bg-white/10 bg-transparent min-h-[48px] md:min-h-[40px] text-base md:text-sm font-medium"
							>
								Skip
							</Button>
							<Button
								onClick={handleNext}
								disabled={!canProceed}
								className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] md:min-h-[40px] text-base md:text-sm font-medium transition-all duration-200"
							>
								{progress.current === progress.total ? "Complete" : "Next"}
								<ChevronLeft className="w-4 h-4 ml-1" />
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Confirmation Dialog */}
			{showConfirmClose && (
				<AlertDialog open={showConfirmClose} onOpenChange={setShowConfirmClose}>
					<AlertDialogContent className="bg-[oklch(0.15_0.02_var(--hue))] border-white/10">
						<AlertDialogHeader>
							<AlertDialogTitle className="text-white">
								Leave refinement?
							</AlertDialogTitle>
							<AlertDialogDescription className="text-white/70">
								Your progress will be saved if you come back later.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel
								className="text-white border-white/20 hover:bg-white/10"
								onClick={() => setShowConfirmClose(false)}
							>
								Continue
							</AlertDialogCancel>
							<AlertDialogAction
								className="bg-red-500 hover:bg-red-600 text-white"
								onClick={handleClose}
							>
								Leave
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			)}
		</>
	);
}
