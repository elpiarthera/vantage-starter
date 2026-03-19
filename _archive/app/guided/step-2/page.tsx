"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { ArrowLeft, CreditCard, Home, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type React from "react";
import { Suspense, useEffect, useRef, useState } from "react";
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
import { PurchaseCreditsModal } from "@/components/dashboard/account/modals/PurchaseCreditsModal";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useChatMessages } from "@/hooks/business-logic/useChatMessages";
import { useCredits } from "@/hooks/business-logic/useCredits";
import { useProjectData } from "@/hooks/business-logic/useProjectData";
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

// Default story content when no AI-generated story is available
function getDefaultStoryContent(): string {
	return `**Concept:** Let's develop the clip with three parts.

**Scene 1: Introduction - Opening Welcome** (10 seconds)
A warm, intimate greeting featuring your names with soft, romantic visuals that immediately capture the joy and excitement of your upcoming celebration.

**Scene 2: Main Part - Event Details** (10 seconds)  
Essential information presented with elegant typography and beautiful imagery - the date, time, and venue details shared in a way that builds anticipation for the special day.

**Scene 3: Final part - Invitation** (10 seconds)
A heartfelt invitation that makes each guest feel personally valued and wanted, ending with a sincere RSVP request that resonates emotionally with your loved ones.

This narrative flows from excitement to information to emotional connection, creating a complete journey that reflects your unique love story.

---
*Note: For the best experience, start from Step 1 to generate a personalized story based on your event details.*`;
}

function GuidedStep2Content() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { user } = useUser();
	const t = useTranslations("guided_step2");
	const tCredits = useTranslations("credits");

	// Get projectId from URL query params
	const projectIdFromUrl = searchParams.get("projectId");
	const projectId = projectIdFromUrl
		? (projectIdFromUrl as Id<"projects">)
		: undefined;
	const returnTo = searchParams.get("returnTo");

	// ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURN
	const [input, setInput] = useState("");
	const [status, setStatus] = useState<"idle" | "streaming" | "submitted">(
		"idle",
	);
	const [approvedMessageId, setApprovedMessageId] = useState<string | null>(
		null,
	);
	const [streamingContent, setStreamingContent] = useState("");
	const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] =
		useState(false);
	const [showPurchaseModal, setShowPurchaseModal] = useState(false);
	const [requiredCredits, setRequiredCredits] = useState(0);
	const [isAddingInitialStory, setIsAddingInitialStory] = useState(false);
	const conversationEndRef = useRef<HTMLDivElement>(null);
	const hasInitializedStory = useRef(false); // Prevent duplicate story addition

	// Initialize Convex hooks
	const {
		messages: convexMessages,
		isLoading: messagesLoading,
		addUserMessage,
		addAssistantMessage,
	} = useChatMessages(projectId, 2); // Step 2

	// Load project data to get/save approvedMessageId
	const { project, update } = useProjectData(projectId);

	// Credit system
	const { balance: currentCredits } = useCredits(user?.id || "");
	usePurchaseSuccessToast();

	// Hook for parsing and updating refined story (must be at top level)
	const parseAndUpdateStory = useMutation(
		api.projects.parseAndUpdateRefinedStory,
	);

	// Redirect to Step 1 if projectId is missing (graceful handling)
	useEffect(() => {
		if (!projectIdFromUrl) {
			console.warn("Missing projectId in URL - redirecting to Step 1");
			router.replace("/guided/step-1");
		}
	}, [projectIdFromUrl, router]);

	// Load approved message from Convex when project loads
	useEffect(() => {
		if (project?.approvedMessageId) {
			setApprovedMessageId(project.approvedMessageId);
		}
	}, [project]);

	// Convert Convex messages to local format for UI
	const messages: ChatMessage[] = convexMessages.map((msg) => ({
		id: msg._id,
		role: msg.role as "user" | "assistant",
		content: msg.content,
		isApproved: msg._id === approvedMessageId,
	}));

	// Initialize with AI-generated story from project (Convex) or fallback to default
	useEffect(() => {
		// Wait for messages to finish loading before checking
		if (
			messagesLoading ||
			!projectId ||
			project === undefined ||
			isAddingInitialStory
		) {
			return;
		}

		// Prevent duplicate initialization - check ref first
		if (hasInitializedStory.current) {
			return;
		}

		// Check if story message already exists in messages (prevent duplicates)
		// Use a more robust check: look for story title AND the signature text
		const storyTitle = project?.generatedStory?.title;
		const storySignature =
			"This story was generated based on your inputs in Step 1";

		const storyAlreadyExists = storyTitle
			? convexMessages.some(
					(msg) =>
						msg.role === "assistant" &&
						msg.content.includes(storyTitle) &&
						msg.content.includes(storySignature),
				)
			: false;

		// If story already exists in messages, mark as initialized and skip
		if (storyAlreadyExists) {
			console.log(
				"[Step 2] Story already exists in messages, skipping initialization",
			);
			hasInitializedStory.current = true;
			return;
		}

		// If we have messages but no story match, don't add default story
		// (user might have deleted it or started fresh)
		if (convexMessages.length > 0 && !project?.generatedStory) {
			console.log(
				"[Step 2] Messages exist but no generated story, skipping default",
			);
			hasInitializedStory.current = true;
			return;
		}

		// Try to get the AI-generated story from the project (saved in Convex)
		let initialContent: string;

		if (project?.generatedStory) {
			const storyData = project.generatedStory;
			// Format the AI-generated story for display
			initialContent = `**${storyData.title || "Your Video Story"}**

${storyData.narration || ""}

**Emotional Arc:** ${storyData.emotionalArc || "A journey through your special moments"}

${
	storyData.scenes && storyData.scenes.length > 0
		? storyData.scenes
				.map(
					(scene: { number: number; description: string; mood: string }) =>
						`**Scene ${scene.number}:** ${scene.description} *(${scene.mood})*`,
				)
				.join("\n\n")
		: ""
}

**Music Suggestion:** ${storyData.musicSuggestion || "Emotional background music"}

---
*This story was generated based on your inputs in Step 1. Feel free to refine it by chatting with me!*`;

			console.log("[Step 2] Adding story from Convex project to messages");
		} else {
			// No stored story, use default
			initialContent = getDefaultStoryContent();
			console.log("[Step 2] No story found, using default content");
		}

		// Mark as initialized and set adding flag BEFORE async call to prevent race condition
		hasInitializedStory.current = true;
		setIsAddingInitialStory(true);

		addAssistantMessage(initialContent)
			.then(() => {
				console.log("[Step 2] Initial story message added successfully");
			})
			.catch((err) => {
				console.error("[Step 2] Failed to add initial message:", err);
				// Reset flags on error so it can retry
				hasInitializedStory.current = false;
			})
			.finally(() => {
				setIsAddingInitialStory(false);
			});
	}, [
		projectId,
		convexMessages,
		messagesLoading,
		isAddingInitialStory,
		addAssistantMessage,
		project,
	]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: messages is derived from convexMessages, which would cause circular dependency
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
		if (!input.trim() || !projectId || status !== "idle") return;

		const userMessage = input.trim();
		setInput("");
		setStatus("submitted");
		setStreamingContent("");

		try {
			// Add user message to Convex first
			await addUserMessage(userMessage);

			// Build messages array for API (include conversation history)
			const apiMessages = [
				...convexMessages.map((msg) => ({
					role: msg.role as "user" | "assistant",
					content: msg.content,
				})),
				{ role: "user" as const, content: userMessage },
			];

			// Call the real AI API
			setStatus("streaming");
			const response = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					messages: apiMessages,
					projectId,
					projectName: project?.name,
					occasion: project?.occasion,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				if (errorData.code === "INSUFFICIENT_CREDITS") {
					setRequiredCredits(errorData.required || 1);
					setShowInsufficientCreditsModal(true);
					setStatus("idle");
					return;
				}
				throw new Error(errorData.error || "Failed to get AI response");
			}

			// Handle streaming response
			const reader = response.body?.getReader();
			if (!reader) {
				throw new Error("No response body");
			}

			const decoder = new TextDecoder();
			let fullContent = "";

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value, { stream: true });
				fullContent += chunk;
				setStreamingContent(fullContent);
			}

			// Save the complete AI response to Convex
			await addAssistantMessage(fullContent);
			setStreamingContent("");
			setStatus("idle");
		} catch (error) {
			console.error("[Step 2] Failed to send message:", error);
			alert(error instanceof Error ? error.message : "Failed to send message");
			setStatus("idle");
			setStreamingContent("");
		}
	};

	const approveMessage = (messageId: string) => {
		setApprovedMessageId(messageId);

		// Save to Convex
		if (projectId) {
			update({ approvedMessageId: messageId });

			// Get the approved message content
			const approvedMsg = messages.find((m) => m.id === messageId);
			if (approvedMsg && approvedMsg.role === "assistant") {
				// Parse and update the refined story in generatedStory
				// This ensures Step 3 uses the refined scene descriptions
				parseAndUpdateStory({
					projectId,
					refinedStoryContent: approvedMsg.content,
				})
					.then((result) => {
						if (result.updated) {
							console.log(
								`[Step 2] Updated generatedStory with ${result.sceneCount} refined scenes`,
							);
						}
					})
					.catch((err) => {
						console.error("[Step 2] Failed to update refined story:", err);
					});
			}
		}
	};

	const startOverWithNewIdea = async () => {
		if (!projectId || status !== "idle") return;

		// Check credits for AI call
		if ((currentCredits ?? 0) < 1) {
			setRequiredCredits(1);
			setShowInsufficientCreditsModal(true);
			return;
		}

		try {
			setStatus("submitted");
			setStreamingContent("");

			// Call /api/chat which uses AI_DIRECTOR_PROMPT from prompts system
			// with a user request for a fresh story approach
			const response = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					messages: [
						{
							role: "user",
							content:
								"Generate a completely fresh story concept with a different creative approach. Use a different tone, structure, or storytelling angle than before.",
						},
					],
					projectId,
					projectName: project?.name,
					occasion: project?.occasion,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				if (errorData.code === "INSUFFICIENT_CREDITS") {
					setRequiredCredits(errorData.required || 1);
					setShowInsufficientCreditsModal(true);
					setStatus("idle");
					return;
				}
				throw new Error(errorData.error || "Failed to get AI response");
			}

			// Handle streaming response
			const reader = response.body?.getReader();
			if (!reader) {
				throw new Error("No response body");
			}

			setStatus("streaming");
			const decoder = new TextDecoder();
			let fullContent = "";

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value, { stream: true });
				fullContent += chunk;
				setStreamingContent(fullContent);
			}

			// Add new AI-generated story to Convex
			await addAssistantMessage(fullContent);
			setApprovedMessageId(null);
			setStreamingContent("");
			setStatus("idle");
		} catch (error) {
			console.error("[Step 2] Failed to start over:", error);
			setStatus("idle");
			setStreamingContent("");
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
					<Link href={`/guided/step-1?projectId=${projectId}`}>
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
							value={33}
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
								<span className="hidden sm:inline">✍️</span>
							</span>
							{[3, 4, 5, 6].map((num) => (
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

					<LanguageSwitcher />

					<Link href="/">
						<Button
							variant="ghost"
							className="text-foreground hover:bg-secondary p-2 md:px-4"
							aria-label={t("home_aria_label")}
						>
							<Home className="h-4 w-4 md:mr-2" />
							<span className="hidden md:inline">{t("home")}</span>
						</Button>
					</Link>
					<button
						type="button"
						onClick={() => setShowPurchaseModal(true)}
						className="flex items-center gap-1 min-h-[44px] px-2 rounded-md hover:bg-secondary active:scale-95 transition-colors cursor-pointer"
						aria-label={tCredits("your_balance", { balance: currentCredits })}
					>
						<CreditCard className="h-4 w-4 text-muted-foreground" />
						<Badge
							variant="outline"
							className="text-xs border-muted text-muted-foreground hover:border-primary hover:text-foreground cursor-pointer transition-colors"
						>
							{tCredits("your_balance", { balance: currentCredits })}
						</Badge>
					</button>
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
						{t("subtitle")}
					</p>
				</div>

				<div className="px-2 md:max-w-4xl md:mx-auto md:px-4">
					<div className="flex flex-col">
						<div className="w-full">
							<Conversation className="w-full">
								<ConversationContent>
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
									{status === "streaming" && streamingContent && (
										// biome-ignore lint/a11y/useValidAriaRole: role is a custom prop for Message component, not ARIA role
										<Message role="assistant">
											<MessageContent>
												<Response>{streamingContent}</Response>
											</MessageContent>
										</Message>
									)}
									<div ref={conversationEndRef} />
								</ConversationContent>
								<ConversationScrollButton className="hidden md:block" />
							</Conversation>
						</div>

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
										>
											{t("start_over")}
										</Button>
										<Badge
											variant="secondary"
											className="ml-2 bg-[#223649] text-gray-300"
										>
											{t("credit_per_message")}
										</Badge>
									</PromptInputTools>
									<PromptInputSubmit
										disabled={!input || status !== "idle"}
										status={status}
									/>
								</PromptInputToolbar>
							</PromptInput>
						</div>
					</div>

					{messages.length > 0 &&
						messages[messages.length - 1].role === "assistant" && (
							<div className="mt-8 mb-4 flex flex-col items-center gap-3">
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
										: t("approve_direction")}
								</Button>

								{messages[messages.length - 1].isApproved && (
									<Button
										onClick={() => {
											const nextStep = returnTo ?? "step-2b";
											router.push(`/guided/${nextStep}?projectId=${projectId}`);
										}}
										className="h-10 px-6 text-sm font-medium"
										style={{ backgroundColor: "#0d7ff2" }}
									>
										{t("continue_visual_style")}
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
				available={currentCredits}
				actionName={t("action_name")}
				returnUrl={
					typeof window !== "undefined" ? window.location.href : undefined
				}
			/>
			<PurchaseCreditsModal
				isOpen={showPurchaseModal}
				onClose={() => setShowPurchaseModal(false)}
				successUrl={
					typeof window !== "undefined" ? window.location.href : undefined
				}
			/>
		</div>
	);
}

export default function GuidedStep2() {
	return (
		<Suspense fallback={<Loading />}>
			<GuidedStep2Content />
		</Suspense>
	);
}
