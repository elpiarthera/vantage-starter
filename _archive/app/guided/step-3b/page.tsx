"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Edit, Home, Loader2, Save, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type React from "react";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
	PromptInput,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputToolbar,
	PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Response } from "@/components/ai-elements/response";
import { InsufficientCreditsModal } from "@/components/credits/InsufficientCreditsModal";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useChatMessages } from "@/hooks/business-logic/useChatMessages";
import { useCreditCost, useCredits } from "@/hooks/business-logic/useCredits";
import { usePurchaseSuccessToast } from "@/hooks/business-logic/usePurchaseSuccessToast";
import { Link } from "@/i18n/routing";

interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	isApproved?: boolean;
}

// Loading component for Suspense
function Loading() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-[#101a23]">
			<Loader2 className="h-12 w-12 animate-spin text-[#0d7ff2]" />
		</div>
	);
}

function GuidedStep3bContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { user } = useUser();
	const t = useTranslations("guided_step3b");

	// Get projectId from URL query params
	const projectIdFromUrl = searchParams.get("projectId");
	const projectId = projectIdFromUrl
		? (projectIdFromUrl as Id<"projects">)
		: undefined;

	// ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURN
	const [input, setInput] = useState("");
	const [status, setStatus] = useState<
		"idle" | "streaming" | "submitted" | "generating_initial"
	>("idle");
	const [approvedMessageId, setApprovedMessageId] = useState<string | null>(
		null,
	);
	const [isEditing, setIsEditing] = useState(false);
	const [editedContent, setEditedContent] = useState("");
	const conversationEndRef = useRef<HTMLDivElement>(null);
	const isInitializing = useRef(false);

	// Initialize Convex hook for chat messages (Step 3 for narration)
	const {
		messages: convexMessages,
		isLoading: messagesLoading,
		addUserMessage,
		addAssistantMessage,
		updateLastAssistantMessage,
	} = useChatMessages(projectId, 3); // Step 3 for narration

	// Project context for language/occasion/theme
	const project = useQuery(
		api.projects.get,
		projectId ? { projectId } : "skip",
	);
	const scenes = useQuery(api.scenes.list, projectId ? { projectId } : "skip");
	const updateProject = useMutation(api.projects.update);

	// Credits
	const { balance, deductCredits, refundCredits, isProcessing } = useCredits(
		user?.id ?? "",
	);
	usePurchaseSuccessToast();
	const { cost: chatCost } = useCreditCost("step3b_chat_message");
	const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] =
		useState(false);
	const [requiredCredits, setRequiredCredits] = useState(0);

	// Redirect to Step 1 if projectId is missing (graceful handling)
	useEffect(() => {
		if (!projectIdFromUrl) {
			console.warn("Missing projectId in URL - redirecting to Step 1");
			router.replace("/guided/step-1");
		}
	}, [projectIdFromUrl, router]);

	// Convert Convex messages to local format for UI
	const messages: ChatMessage[] = convexMessages.map((msg) => ({
		id: msg._id,
		role: msg.role as "user" | "assistant",
		content: msg.content,
		isApproved: msg._id === approvedMessageId,
	}));

	// Build full project context for API calls
	const buildProjectContext = useCallback(() => {
		if (!project) return {};
		return {
			occasion: project.occasion,
			theme: project.theme,
			language: project.language,
			languageCode: project.language?.toLowerCase().slice(0, 2),
			// Event details (available from schema)
			eventTitle: project.eventDetails?.eventTitle,
			eventDate: project.eventDetails?.date,
			eventLocation: project.eventDetails?.location,
			emotionalStory: project.eventDetails?.emotionalStory,
			// Story context (from Step 2)
			storyNarration: project.generatedStory?.narration,
			emotionalArc: project.generatedStory?.emotionalArc,
		};
	}, [project]);

	// Build scene context for API calls
	const buildSceneContext = useCallback(() => {
		if (!Array.isArray(scenes)) return [];
		return scenes.map((s) => ({
			number: s.sceneNumber,
			title: s.title,
			description: s.description,
			duration: s.duration,
			mood: s.cinematicStyles?.visualStyle,
		}));
	}, [scenes]);

	// Generate initial narration using AI (not hardcoded template)
	const generateInitialNarration = useCallback(async () => {
		if (!projectId || !project) return;

		setStatus("generating_initial");

		try {
			console.log("[Step 3b] Generating initial narration with AI...");

			const response = await fetch("/api/step3b/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					messages: [
						{
							role: "user",
							content:
								"Generate the initial narration script for this video invitation based on all the event details and scenes provided.",
						},
					],
					projectContext: buildProjectContext(),
					sceneContext: buildSceneContext(),
				}),
			});

			if (!response.ok || !response.body) {
				throw new Error("Failed to generate initial narration");
			}

			// Read streaming response
			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let fullText = "";
			let done = false;
			while (!done) {
				const { value, done: doneReading } = await reader.read();
				done = doneReading;
				fullText += decoder.decode(value || new Uint8Array(), {
					stream: !done,
				});
			}

			await addAssistantMessage(fullText);
			console.log("[Step 3b] Initial narration generated successfully");
		} catch (error) {
			console.error("[Step 3b] Failed to generate initial narration:", error);
			// Fallback to a simple clean message
			const eventTitle =
				project.eventDetails?.eventTitle || "our special celebration";
			await addAssistantMessage(
				`Welcome to ${eventTitle}! <#0.5#> We're so excited to share this moment with you. <#0.5#> Your presence means the world to us. <#0.3#> Please join us for an unforgettable experience.`,
			);
		} finally {
			setStatus("idle");
		}
	}, [
		projectId,
		project,
		buildProjectContext,
		buildSceneContext,
		addAssistantMessage,
	]);

	// Initialize with narration script:
	// 1. If approvedNarrationScript exists in project, use that
	// 2. Otherwise, generate fresh narration using AI
	// IMPORTANT: Wait for messages query to finish loading before checking length
	useEffect(() => {
		if (
			projectId &&
			!messagesLoading && // ← Wait for query to finish loading
			convexMessages.length === 0 && // Then check if truly empty
			project !== undefined &&
			!isInitializing.current
		) {
			isInitializing.current = true;

			// Check if we already have an approved narration script
			if (project?.approvedNarrationScript) {
				console.log(
					"[Step 3b] Loading existing approved narration from project",
				);
				addAssistantMessage(project.approvedNarrationScript).catch((err) => {
					console.error("[Step 3b] Failed to add existing narration:", err);
				});
			} else {
				// Generate fresh narration using AI with full context
				generateInitialNarration();
			}
		}
	}, [
		projectId,
		messagesLoading,
		convexMessages.length,
		project,
		addAssistantMessage,
		generateInitialNarration,
	]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: messages is derived from convexMessages
	useEffect(() => {
		if (conversationEndRef.current) {
			conversationEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages]);

	// Show loading while redirecting or if no projectId
	if (!projectIdFromUrl) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[#101a23]">
				<Loader2 className="h-12 w-12 animate-spin text-[#0d7ff2]" />
			</div>
		);
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim() || !projectId || isProcessing) return;

		const needed = chatCost?.credits ?? 1;
		if (balance < needed) {
			setRequiredCredits(needed);
			setShowInsufficientCreditsModal(true);
			return;
		}

		let transactionId: Id<"creditTransactions"> | undefined;

		try {
			// Deduct credits before calling AI
			const deductResult = await deductCredits({
				actionType: "step3b_chat_message",
				projectId,
			});
			if (!deductResult.success) {
				setRequiredCredits(needed);
				setShowInsufficientCreditsModal(true);
				return;
			}
			transactionId = deductResult.transactionId;

			await addUserMessage(input);
			setInput("");
			setStatus("submitted");

			setStatus("streaming");

			// Call API route with full context
			const response = await fetch("/api/step3b/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					messages: [...messages, { role: "user", content: input }],
					projectContext: buildProjectContext(),
					sceneContext: buildSceneContext(),
				}),
			});

			if (!response.ok || !response.body) {
				throw new Error("AI response failed");
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let fullText = "";
			let done = false;
			while (!done) {
				const { value, done: doneReading } = await reader.read();
				done = doneReading;
				fullText += decoder.decode(value || new Uint8Array(), {
					stream: !done,
				});
			}

			await addAssistantMessage(fullText);
			setStatus("idle");
		} catch (error) {
			console.error("[Step 3b] Failed to send message:", error);
			setStatus("idle");
			if (transactionId) {
				try {
					await refundCredits(transactionId, "step3b_chat_failed");
				} catch (refundError) {
					console.error("[Step 3b] Failed to refund credits:", refundError);
				}
			}
		}
	};

	const approveMessage = async (messageId: string) => {
		setApprovedMessageId(messageId);
		const approvedContent = messages.find((m) => m.id === messageId)?.content;
		if (approvedContent && projectId) {
			try {
				await updateProject({
					projectId,
					approvedNarrationScript: approvedContent,
				});
			} catch (err) {
				console.error("[Step 3b] Failed to save approved narration:", err);
			}
		}
	};

	const startOverWithNewIdea = async () => {
		if (!projectId || isProcessing) return;

		// Check credits for AI call
		const needed = chatCost?.credits ?? 1;
		if (balance < needed) {
			setRequiredCredits(needed);
			setShowInsufficientCreditsModal(true);
			return;
		}

		let transactionId: Id<"creditTransactions"> | undefined;

		try {
			// Deduct credits before calling AI
			const deductResult = await deductCredits({
				actionType: "step3b_chat_message",
				projectId,
			});
			if (!deductResult.success) {
				setRequiredCredits(needed);
				setShowInsufficientCreditsModal(true);
				return;
			}
			transactionId = deductResult.transactionId;

			setStatus("submitted");

			// Call API with fresh approach request
			const response = await fetch("/api/step3b/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					messages: [
						{
							role: "user",
							content:
								"Generate a completely fresh narration script with a different creative approach. Use a different tone, structure, or storytelling angle than before. Remember: output ONLY the spoken words with pause markers, no markdown formatting.",
						},
					],
					projectContext: buildProjectContext(),
					sceneContext: buildSceneContext(),
				}),
			});

			if (!response.ok || !response.body) {
				throw new Error("AI response failed");
			}

			// Read streaming response
			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let fullText = "";
			let done = false;
			while (!done) {
				const { value, done: doneReading } = await reader.read();
				done = doneReading;
				fullText += decoder.decode(value || new Uint8Array(), {
					stream: !done,
				});
			}

			// Add new AI-generated narration to Convex
			await addAssistantMessage(fullText);
			setApprovedMessageId(null);
			setStatus("idle");
		} catch (error) {
			console.error("[Step 3b] Failed to start over:", error);
			setStatus("idle");
			if (transactionId) {
				try {
					await refundCredits(transactionId, "step3b_start_over_failed");
				} catch (refundError) {
					console.error("[Step 3b] Failed to refund credits:", refundError);
				}
			}
		}
	};

	// Edit mode handlers
	const startEditing = () => {
		const lastMessage = messages[messages.length - 1];
		if (lastMessage?.role === "assistant") {
			setEditedContent(lastMessage.content);
			setIsEditing(true);
		}
	};

	const cancelEditing = () => {
		setIsEditing(false);
		setEditedContent("");
	};

	const saveEdit = async () => {
		if (!editedContent.trim() || !projectId) return;

		try {
			// Update the last assistant message in Convex
			await updateLastAssistantMessage(editedContent);
			setIsEditing(false);
			setEditedContent("");
		} catch (error) {
			console.error("[Step 3b] Failed to save edit:", error);
		}
	};

	return (
		<div
			className="h-screen flex flex-col overflow-hidden"
			style={{ backgroundColor: "#101a23" }}
		>
			<div
				className="shadow-md p-3 md:p-4 fixed top-0 w-full z-50"
				style={{
					backgroundColor: "#182634",
					borderBottom: "1px solid #223649",
				}}
			>
				<div className="max-w-6xl mx-auto flex items-center justify-between">
					<Link href={`/guided/step-3?projectId=${projectId}`}>
						<Button
							variant="ghost"
							className="text-white hover:bg-[#223649] p-2 md:px-4"
							aria-label={t("back_aria_label")}
						>
							<ArrowLeft className="h-4 w-4 md:mr-2" />
							<span className="hidden md:inline">{t("back")}</span>
						</Button>
					</Link>

					<div className="flex-1 max-w-md mx-4 md:mx-8">
						<Progress
							value={60}
							className="h-2 mb-2"
							style={{ backgroundColor: "#314d68" }}
						/>
						<div className="flex justify-between text-xs text-gray-400">
							<span className="flex items-center gap-1">
								<div
									className="w-5 h-5 md:w-6 md:h-6 rounded-full text-white flex items-center justify-center text-xs"
									style={{ backgroundColor: "#0d7ff2" }}
								>
									1
								</div>
							</span>
							<span className="flex items-center gap-1">
								<div
									className="w-5 h-5 md:w-6 md:h-6 rounded-full text-white flex items-center justify-center text-xs"
									style={{ backgroundColor: "#0d7ff2" }}
								>
									2
								</div>
							</span>
							<span className="flex items-center gap-1">
								<div
									className="w-5 h-5 md:w-6 md:h-6 rounded-full text-white flex items-center justify-center text-xs"
									style={{ backgroundColor: "#0d7ff2" }}
								>
									3
								</div>
							</span>
							<span className="flex items-center gap-1">
								<div
									className="w-5 h-5 md:w-6 md:h-6 rounded-full text-white flex items-center justify-center text-xs"
									style={{ backgroundColor: "#0d7ff2" }}
								>
									4
								</div>
								<span className="hidden sm:inline">🎙️</span>
							</span>
							{[5, 6].map((num) => (
								<span key={num} className="flex items-center gap-1">
									<div
										className="w-5 h-5 md:w-6 md:h-6 rounded-full text-gray-400 flex items-center justify-center text-xs"
										style={{ backgroundColor: "#314d68" }}
									>
										{num}
									</div>
								</span>
							))}
						</div>
					</div>

					<Link href="/">
						<Button
							variant="ghost"
							className="text-white hover:bg-[#223649] p-2 md:px-4"
							aria-label={t("home_aria_label")}
						>
							<Home className="h-4 w-4 md:mr-2" />
							<span className="hidden md:inline">{t("home")}</span>
						</Button>
					</Link>
				</div>
			</div>

			<div className="flex-1 pt-20 md:pt-24 pb-4 overflow-auto">
				<div className="text-center mb-6 md:mb-8 px-4">
					<h1 className="text-2xl md:text-3xl font-bold text-center mb-2 text-white">
						{t("title")}
					</h1>
					<p
						className="text-lg md:text-xl italic text-center mb-6 md:mb-8"
						style={{ color: "#0d7ff2" }}
					>
						{t("subtitle") ||
							"Chat with your AI Director to refine the narration"}
					</p>
				</div>

				<div className="max-w-4xl mx-auto px-4">
					<div className="flex flex-col">
						<div className="w-full">
							<Conversation className="w-full">
								<ConversationContent>
									{status === "generating_initial" && (
										<div className="flex items-center justify-center py-8">
											<div className="text-center">
												<Loader2 className="h-8 w-8 animate-spin text-[#0d7ff2] mx-auto mb-3" />
												<p className="text-gray-400">
													{t("generating_narration") ||
														"Generating your personalized narration..."}
												</p>
											</div>
										</div>
									)}
									{messages.map((message) => (
										<div key={message.id}>
											<Message role={message.role}>
												<MessageContent>
													<Response>{message.content}</Response>
												</MessageContent>
											</Message>
										</div>
									))}
									{status === "submitted" && <Loader />}
									<div ref={conversationEndRef} />
								</ConversationContent>
								<ConversationScrollButton />
							</Conversation>
						</div>

						{/* Edit Mode */}
						{isEditing &&
							messages.length > 0 &&
							messages[messages.length - 1].role === "assistant" && (
								<div className="mt-4 p-4 rounded-lg border border-[#314d68] bg-[#182634]">
									<div className="flex items-center justify-between mb-3">
										<h3 className="text-white font-medium">
											{t("edit_narration") || "Edit Narration"}
										</h3>
										<Button
											variant="ghost"
											size="sm"
											onClick={cancelEditing}
											className="text-gray-400 hover:text-white"
										>
											<X className="h-4 w-4" />
										</Button>
									</div>
									<Textarea
										value={editedContent}
										onChange={(e) => setEditedContent(e.target.value)}
										className="min-h-[200px] bg-[#223649] border-[#314d68] text-white resize-y"
										placeholder={
											t("edit_placeholder") || "Edit your narration script..."
										}
									/>
									<div className="flex items-center justify-between mt-3">
										<p className="text-xs text-gray-400">
											{editedContent.split(/\s+/).filter(Boolean).length}{" "}
											{t("words") || "words"}
										</p>
										<div className="flex gap-2">
											<Button
												onClick={cancelEditing}
												variant="outline"
												size="sm"
												className="border-[#314d68] text-white hover:bg-[#223649]"
											>
												{t("cancel") || "Cancel"}
											</Button>
											<Button
												onClick={saveEdit}
												size="sm"
												className="bg-green-600 hover:bg-green-700 text-white"
											>
												<Save className="h-4 w-4 mr-2" />
												{t("save_changes") || "Save Changes"}
											</Button>
										</div>
									</div>
								</div>
							)}

						<div className="w-full">
							<PromptInput
								onSubmit={handleSubmit}
								className="mt-4 flex-shrink-0 w-full"
							>
								<PromptInputTextarea
									onChange={(e) => setInput(e.target.value)}
									value={input}
									placeholder={t("placeholder")}
								/>
								<PromptInputToolbar>
									<PromptInputTools>
										<Button
											onClick={startOverWithNewIdea}
											variant="outline"
											size="sm"
											className="text-white border-[#314d68] hover:bg-[#223649] bg-transparent"
											disabled={status !== "idle"}
										>
											{t("start_over") || "Start Over with a New Idea"}
										</Button>
									</PromptInputTools>
									<div className="flex items-center gap-2">
										<PromptInputSubmit
											disabled={!input || isProcessing || status !== "idle"}
											status={status === "streaming" ? "streaming" : status}
										/>
										<span className="text-xs text-gray-300">
											{chatCost?.credits ?? 1} credit
										</span>
									</div>
								</PromptInputToolbar>
							</PromptInput>
						</div>
					</div>

					{messages.length > 0 &&
						messages[messages.length - 1].role === "assistant" &&
						!isEditing && (
							<div className="mt-8 mb-4 flex flex-col items-center gap-3">
								{/* Edit Button */}
								<Button
									onClick={startEditing}
									variant="outline"
									size="sm"
									className="text-white border-[#314d68] hover:bg-[#223649] bg-transparent"
								>
									<Edit className="h-4 w-4 mr-2" />
									{t("edit_narration") || "Edit Narration"}
								</Button>

								{/* Approve Button */}
								<Button
									onClick={() =>
										approveMessage(messages[messages.length - 1].id)
									}
									size="default"
									variant={
										messages[messages.length - 1].isApproved
											? "default"
											: "outline"
									}
									className={`h-10 px-6 text-sm font-medium ${
										messages[messages.length - 1].isApproved
											? "bg-green-600 hover:bg-green-700 text-white"
											: "text-white border-[#314d68] hover:bg-[#223649] bg-transparent"
									}`}
								>
									{messages[messages.length - 1].isApproved
										? t("approved")
										: t("approve_narration")}
								</Button>

								{messages[messages.length - 1].isApproved && (
									<Button
										onClick={() =>
											router.push(`/guided/step-4?projectId=${projectId}`)
										}
										className="h-10 px-6 text-sm font-medium"
										style={{ backgroundColor: "#0d7ff2" }}
									>
										{t("continue_audio")}
									</Button>
								)}
							</div>
						)}
				</div>
			</div>

			<InsufficientCreditsModal
				isOpen={showInsufficientCreditsModal}
				onClose={() => setShowInsufficientCreditsModal(false)}
				required={requiredCredits}
				available={balance ?? 0}
				returnUrl={
					typeof window !== "undefined" ? window.location.href : undefined
				}
			/>
		</div>
	);
}

export default function GuidedStep3b() {
	return (
		<Suspense fallback={<Loading />}>
			<GuidedStep3bContent />
		</Suspense>
	);
}
