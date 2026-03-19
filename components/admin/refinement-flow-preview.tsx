"use client";

import { AnimatePresence } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AIAvatarDots } from "@/components/refinement/ai-avatar-dots";
import { VisualOptionCard } from "@/components/refinement/visual-option-card";
import { EventCard } from "@/components/resources/event-card";
import { EventDetailPanel } from "@/components/resources/event-detail-panel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	CategoryStore,
	SubCategoryStore,
} from "@/lib/meta-categories-mock-data";
import type { RefinementFlow } from "@/lib/refinement-flow-store";

interface RefinementFlowPreviewProps {
	flow: RefinementFlow;
}

export function RefinementFlowPreview({ flow }: RefinementFlowPreviewProps) {
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [answers, setAnswers] = useState<Record<number, string>>({});
	const [isComplete, setIsComplete] = useState(false);
	const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
	const [selectedAnswer, setSelectedAnswer] = useState(""); // Declare selectedAnswer
	const [showOtherInput, setShowOtherInput] = useState(false);
	const [otherInputValue, setOtherInputValue] = useState("");

	const scrollRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, []);

	console.log("[v0] RefinementFlowPreview flow prop:", flow);
	console.log("[v0] Flow questions array:", flow.questions);
	console.log("[v0] Questions count:", flow.questions?.length || 0);

	if (!flow.questions || flow.questions.length === 0) {
		console.log("[v0] No questions found in flow!");
		return (
			<div className="h-full flex items-center justify-center">
				<div className="text-center space-y-4">
					<p className="text-muted-foreground">
						This flow has no questions configured.
					</p>
					<p className="text-sm text-muted-foreground">
						Please add questions in the editor to preview the flow.
					</p>
				</div>
			</div>
		);
	}

	const currentQuestion = flow.questions[currentQuestionIndex];

	if (!currentQuestion && !isComplete) {
		console.log(
			"[v0] Current question is undefined at index:",
			currentQuestionIndex,
		);
		return (
			<div className="h-full flex items-center justify-center">
				<div className="text-center space-y-4">
					<p className="text-muted-foreground">Error loading question.</p>
					<Button onClick={() => setCurrentQuestionIndex(0)}>Restart</Button>
				</div>
			</div>
		);
	}

	const isFirstQuestion = currentQuestionIndex === 0;
	const isLastQuestion = currentQuestionIndex === flow.questions.length - 1;

	const handleNext = () => {
		if (!currentQuestion) return;

		// Save answer
		setAnswers((prev) => ({ ...prev, [currentQuestion.id]: selectedAnswer }));

		if (isLastQuestion) {
			setIsComplete(true);
		} else {
			setCurrentQuestionIndex((prev) => prev + 1);
			setSelectedAnswer("");
			setShowOtherInput(false);
			setOtherInputValue("");
		}
	};

	const handleSkip = () => {
		if (isLastQuestion) {
			setIsComplete(true);
		} else {
			setCurrentQuestionIndex((prev) => prev + 1);
			setSelectedAnswer("");
			setShowOtherInput(false);
			setOtherInputValue("");
		}
	};

	const handleRestart = () => {
		console.log("[v0] Restarting flow");
		setCurrentQuestionIndex(0);
		setAnswers({});
		setSelectedAnswer("");
		setIsComplete(false);
		setSelectedEvent(null); // Reset selected event on restart
		setShowOtherInput(false);
		setOtherInputValue("");
	};

	const handleAnswerChange = (value: string) => {
		setSelectedAnswer(value);
		setShowOtherInput(false);
		setOtherInputValue("");
	};

	const handleCheckboxChange = (value: string) => {
		setAnswers((prev: Record<string, string>) => {
			const questionId = currentQuestion?.id;
			const current = prev[questionId] ? prev[questionId].split(",") : [];
			return current.includes(value)
				? {
						...prev,
						[questionId]: current.filter((v: string) => v !== value).join(","),
					}
				: { ...prev, [questionId]: [...current, value].join(",") };
		});
	};

	const handleOtherClick = () => {
		setShowOtherInput(true);
		setSelectedAnswer(""); // Clear any previously selected option
	};

	const canProceed =
		selectedAnswer !== "" || (showOtherInput && otherInputValue.trim() !== "");

	// Get visual items based on question type
	let visualItems: any[] = [];
	if (currentQuestion) {
		if (
			currentQuestion.type === "visual-categories" &&
			currentQuestion.visualReferenceIds
		) {
			// Load categories by their IDs
			visualItems = currentQuestion.visualReferenceIds
				.map((id) => {
					const category = CategoryStore.getById(id);
					if (!category) return null;
					return {
						id: category.id,
						name: category.name,
						description: category.description,
						imageUrl: category.imageUrl,
						isSponsored: false,
					};
				})
				.filter(Boolean);
		} else if (
			currentQuestion.type === "visual-subcategories" &&
			currentQuestion.visualReferenceIds
		) {
			// Load subcategories by their IDs
			visualItems = currentQuestion.visualReferenceIds
				.map((id) => {
					const subCategory = SubCategoryStore.getById(id);
					if (!subCategory) return null;
					return {
						id: subCategory.id,
						name: subCategory.name,
						description: subCategory.description,
						imageUrl: subCategory.imageUrl,
						isSponsored: false,
					};
				})
				.filter(Boolean);
		}
	}

	console.log(
		"[v0] Current question:",
		currentQuestion?.id,
		"Visual items loaded:",
		visualItems.length,
	);

	const useHorizontalScroll = visualItems.length > 6;
	const gridCols =
		visualItems.length === 1
			? "grid-cols-1"
			: visualItems.length === 2
				? "grid-cols-2"
				: visualItems.length === 3
					? "grid-cols-3"
					: visualItems.length === 4
						? "grid-cols-2"
						: visualItems.length === 5
							? "grid-cols-2 md:grid-cols-3"
							: "grid-cols-2 md:grid-cols-3";

	const formatAnswer = (
		answer: string,
		question: (typeof flow.questions)[number],
	) => {
		if (answer.startsWith("other:")) {
			return answer.replace("other:", "");
		}

		// For visual categories, lookup the category name
		if (question.type === "visual-categories") {
			const category = CategoryStore.getById(answer);
			return category?.name || answer;
		}

		// For visual subcategories, lookup the subcategory name
		if (question.type === "visual-subcategories") {
			const subcategory = SubCategoryStore.getById(answer);
			return subcategory?.name || answer;
		}

		// For text options, lookup the label
		return (
			question.options?.find((opt) => opt.value === answer)?.label || answer
		);
	};

	const mockResults = [
		{
			id: "event-1",
			name: "Rock the Night Festival",
			image: "/rock-concert-festival-night-lights.jpg",
			venue: "The Electric Arena",
			date: "Tonight, 8:00 PM",
			price: "€15",
			tags: ["Rock", "Live Music", "Budget-friendly"],
			vibe: "Romantic atmosphere with candlelit seating",
		},
		{
			id: "event-2",
			name: "Acoustic Sunset Sessions",
			image: "/acoustic-guitar-concert-intimate-romantic.jpg",
			venue: "Rooftop Garden Bar",
			date: "Tonight, 7:30 PM",
			price: "€12",
			tags: ["Rock", "Acoustic", "Intimate"],
			vibe: "Perfect romantic evening under the stars",
		},
		{
			id: "event-3",
			name: "Underground Rock Showcase",
			image: "/underground-rock-concert-dark-venue.jpg",
			venue: "The Basement Club",
			date: "Tonight, 9:00 PM",
			price: "€10",
			tags: ["Rock", "Indie", "Budget-friendly"],
			vibe: "Cozy and intimate setting",
		},
		{
			id: "event-4",
			name: "Classic Rock Revival",
			image: "/classic-rock-band-concert-stage-lights.jpg",
			venue: "Vintage Hall",
			date: "Tonight, 8:30 PM",
			price: "€18",
			tags: ["Rock", "Classic", "Nostalgic"],
			vibe: "Romantic vibes with timeless classics",
		},
	];

	return (
		<div className="h-full flex flex-col bg-background">
			{/* Preview Info Bar */}
			<div className="flex-none border-b border-border bg-muted/30 px-6 py-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4 text-sm text-muted-foreground">
						<span>Preview Mode - Simulating User Experience</span>
						{!isComplete && (
							<span className="text-xs">
								Step {currentQuestionIndex + 1} of {flow.questions.length}
							</span>
						)}
					</div>
					<Button variant="outline" size="sm" onClick={handleRestart}>
						<RotateCcw className="w-4 h-4 mr-2" />
						Restart
					</Button>
				</div>
			</div>

			{/* Chat-style Container */}
			<div ref={scrollRef} className="flex-1 overflow-y-auto">
				<div className="max-w-4xl mx-auto p-6 space-y-6">
					{/* Welcome Message */}
					{isFirstQuestion && flow.consultantMessage && (
						<div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
							<AIAvatarDots isAnswered={false} />
							<div className="flex-1 bg-muted rounded-2xl rounded-tl-sm p-4">
								<p className="text-sm leading-relaxed">
									{flow.consultantMessage}
								</p>
							</div>
						</div>
					)}

					{/* Previous Questions & Answers */}
					{Object.entries(answers).map(([questionId, answer], _index) => {
						const q = flow.questions.find((q) => q.id === questionId);
						if (!q) return null;

						return (
							<div
								key={questionId}
								className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500"
							>
								{/* AI Question */}
								<div className="flex items-start gap-3">
									<AIAvatarDots isAnswered={true} />
									<div className="flex-1 bg-muted rounded-2xl rounded-tl-sm p-4">
										<p className="font-medium">{q.question}</p>
										{q.description && (
											<p className="text-sm text-muted-foreground mt-1">
												{q.description}
											</p>
										)}
									</div>
								</div>

								{/* User Answer */}
								<div className="flex justify-end">
									<div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 max-w-md">
										<p className="text-sm">{formatAnswer(answer, q)}</p>
									</div>
								</div>
							</div>
						);
					})}

					{/* Current Question */}
					{!isComplete && currentQuestion && (
						<div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
							{/* AI Question */}
							<div className="flex items-start gap-3">
								<AIAvatarDots isAnswered={false} />
								<div className="flex-1 bg-muted rounded-2xl rounded-tl-sm p-4">
									<p className="font-medium">{currentQuestion.question}</p>
									{currentQuestion.description && (
										<p className="text-sm text-muted-foreground mt-1">
											{currentQuestion.description}
										</p>
									)}
								</div>
							</div>

							{/* Answer Options */}
							<div className="pl-14 space-y-3">
								{/* Text Radio */}
								{currentQuestion.type === "text-radio" &&
									currentQuestion.options && (
										<div className="space-y-2">
											{currentQuestion.options.map((option) => (
												<div
													key={option.id}
													className={`flex items-center space-x-3 p-3 rounded-lg transition-colors cursor-pointer border ${
														selectedAnswer === option.value
															? "bg-primary/10 border-primary"
															: "border-border hover:bg-muted/50"
													}`}
													onClick={() => handleAnswerChange(option.value)}
												>
													<div
														className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
															selectedAnswer === option.value
																? "border-primary"
																: "border-muted-foreground"
														}`}
													>
														{selectedAnswer === option.value && (
															<div className="w-2 h-2 bg-primary rounded-full" />
														)}
													</div>
													<Label
														htmlFor={option.id}
														className="cursor-pointer flex-1"
													>
														{option.label}
													</Label>
												</div>
											))}
										</div>
									)}

								{/* Text Checkbox */}
								{currentQuestion.type === "text-checkbox" &&
									currentQuestion.options && (
										<div className="space-y-2">
											{currentQuestion.options.map((option) => (
												<div
													key={option.id}
													className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer border border-border"
													onClick={() => handleCheckboxChange(option.value)}
												>
													<Checkbox
														id={option.id}
														checked={(answers as Record<string, string>)[
															currentQuestion.id
														]?.includes(option.value)}
														onCheckedChange={() =>
															handleCheckboxChange(option.value)
														}
													/>
													<Label
														htmlFor={option.id}
														className="cursor-pointer flex-1"
													>
														{option.label}
													</Label>
												</div>
											))}
										</div>
									)}

								{/* Visual Options */}
								{(currentQuestion.type === "visual-categories" ||
									currentQuestion.type === "visual-subcategories" ||
									currentQuestion.type === "visual-ads") && (
									<div className="space-y-4">
										{useHorizontalScroll ? (
											<div className="overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
												<div className="flex gap-3 pb-2">
													{visualItems.map((item) => (
														<div
															key={item.id}
															className="snap-start flex-shrink-0 w-[200px]"
														>
															<VisualOptionCard
																id={item.id}
																name={item.name}
																description={item.description}
																imageUrl={item.imageUrl}
																isSelected={
																	(answers as Record<string, string>)[
																		currentQuestion.id
																	] === item.id.toString()
																}
																isSponsored={item.isSponsored}
																onSelect={(value) =>
																	handleAnswerChange(value.toString())
																}
															/>
														</div>
													))}
												</div>
											</div>
										) : (
											<div className={`grid ${gridCols} gap-3`}>
												{visualItems.map((item) => (
													<VisualOptionCard
														key={item.id}
														id={item.id}
														name={item.name}
														description={item.description}
														imageUrl={item.imageUrl}
														isSelected={
															(answers as Record<string, string>)[
																currentQuestion.id
															] === item.id.toString()
														}
														isSponsored={item.isSponsored}
														onSelect={(value) =>
															handleAnswerChange(value.toString())
														}
													/>
												))}
											</div>
										)}

										{currentQuestion.allowOther && (
											<Button
												variant="outline"
												onClick={handleOtherClick}
												className="w-full bg-transparent"
											>
												Other (please specify)
											</Button>
										)}

										{showOtherInput && (
											<div className="space-y-2">
												<Label htmlFor="other-input" className="text-sm">
													Please specify:
												</Label>
												<Input
													id="other-input"
													value={otherInputValue}
													onChange={(e) => setOtherInputValue(e.target.value)}
													placeholder="Type your answer..."
													autoFocus
												/>
											</div>
										)}
									</div>
								)}

								{/* Action Buttons */}
								<div className="flex gap-3 pt-2">
									{flow.allowSkip && (
										<Button variant="ghost" onClick={handleSkip}>
											Skip
										</Button>
									)}
									<Button
										onClick={handleNext}
										disabled={!canProceed}
										className="flex-1"
									>
										{isLastQuestion ? "Complete" : "Next"}
									</Button>
								</div>
							</div>
						</div>
					)}

					{/* Results Section */}
					{isComplete && (
						<div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
							{/* Success Message */}
							<div className="flex items-start gap-3">
								<AIAvatarDots variant="success" isAnswered={true} />
								<div className="flex-1 bg-muted rounded-2xl rounded-tl-sm p-4">
									<p className="font-medium">
										Perfect! I found some great events for you tonight!
									</p>
									<p className="text-sm text-muted-foreground mt-1">
										Based on your preferences: Rock concerts with a romantic
										vibe and budget-friendly prices.
									</p>
								</div>
							</div>

							{/* Results Grid */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-14">
								{mockResults.map((event) => (
									<EventCard
										key={event.id}
										event={event}
										onViewDetails={(eventId) => setSelectedEvent(eventId)}
									/>
								))}
							</div>

							{/* Preview Note */}
							<div className="pl-14 p-4 bg-muted/50 rounded-lg border border-border">
								<p className="text-sm text-muted-foreground">
									<strong>Preview Mode:</strong> In production, these results
									would be dynamically generated based on real event data, user
									preferences, and availability.
								</p>
							</div>
						</div>
					)}
				</div>
			</div>

			<AnimatePresence>
				{selectedEvent && (
					<EventDetailPanel
						event={mockResults.find((e) => e.id === selectedEvent)!}
						onClose={() => setSelectedEvent(null)}
						onBookTickets={(eventId) => {
							console.log("[v0] Book tickets for event:", eventId);
							// Future: Handle booking flow
						}}
					/>
				)}
			</AnimatePresence>
		</div>
	);
}
