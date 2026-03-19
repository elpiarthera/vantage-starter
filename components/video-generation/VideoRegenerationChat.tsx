"use client";

import { type UIMessage, useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import React, { useCallback, useState } from "react";
import {
	Conversation,
	ConversationContent,
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
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface VideoRegenerationChatProps {
	sceneId: string;
	sceneTitle: string;
	sceneDescription: string;
	isOpen: boolean;
	onClose: () => void;
	onRegenerateApproved: (sceneId: string, feedback: string) => void;
	regenerationCount: number;
	maxRegenerations?: number;
	projectId: string; // NEW: Required for AI chat API
	onSceneUpdate?: (description: string, reasoning: string) => void;
}

export const VideoRegenerationChat = React.memo(function VideoRegenerationChat({
	sceneId,
	sceneTitle,
	sceneDescription,
	isOpen,
	onClose,
	onRegenerateApproved,
	regenerationCount,
	maxRegenerations = 3,
	projectId, // NEW: Received from parent
	onSceneUpdate: _onSceneUpdate, // Reserved for future tool calling feature
}: VideoRegenerationChatProps) {
	const [input, setInput] = useState("");
	const [showApproval, setShowApproval] = useState(false);
	const [approved, setApproved] = useState(false);

	// Replace mock with real AI SDK v2 using TextStreamChatTransport
	const { messages, sendMessage, error, status } = useChat({
		transport: new TextStreamChatTransport({
			api: "/api/chat",
			headers: { "Content-Type": "application/json" },
			body: { sceneId, projectId },
		}),
		onFinish: () => {
			// Show approval buttons after AI response
			setShowApproval(true);
			setApproved(false);

			// Handle tool calls from AI (future feature)
			// Note: UIMessage in v2 uses 'parts' array structure
			// We'll implement tool handling when needed
		},
		onError: (error: Error) => {
			console.error("[AI Chat] Error:", error);
		},
	});

	const isLoading = status === "streaming" || status === "submitted";

	const handleChatSubmit = useCallback(
		(e: React.FormEvent<HTMLFormElement>) => {
			e.preventDefault();
			const messageContent = input;
			if (!messageContent.trim() || isLoading) return;

			// sendMessage expects a message object with parts array
			sendMessage({
				role: "user",
				parts: [{ type: "text", text: messageContent }],
			});
			setInput("");
			setShowApproval(false);
			setApproved(false);
		},
		[input, isLoading, sendMessage],
	);

	const handleApproveDirection = useCallback(() => {
		setApproved(true);
	}, []);

	const handleFinalRegenerate = useCallback(() => {
		const lastUserMessage = messages.filter((m) => m.role === "user").at(-1);
		const feedbackText =
			lastUserMessage?.parts
				?.filter((p) => p.type === "text")
				.map((p) => ("text" in p ? (p as { text: string }).text : ""))
				.join("") ?? "";

		onRegenerateApproved(sceneId, feedbackText);
		onClose();
	}, [messages, onRegenerateApproved, sceneId, onClose]);

	if (!isOpen) {
		return null;
	}

	const remainingRegenerations = maxRegenerations - regenerationCount - 1;

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent
				className="max-w-2xl max-h-[80vh] bg-[#182634] border-[#0d7ff2] border-2 text-white"
				aria-describedby="regeneration-chat-description"
			>
				<DialogHeader>
					<DialogTitle className="text-white">
						Refine Scene Video with AI
					</DialogTitle>
					<p
						id="regeneration-chat-description"
						className="text-sm text-gray-400"
					>
						Regenerations remaining: {remainingRegenerations} of{" "}
						{maxRegenerations - 1}
					</p>
				</DialogHeader>

				<div className="space-y-4">
					{/* Messages - Reuse existing Conversation component */}
					<div className="max-h-64 overflow-y-auto">
						<Conversation className="w-full">
							<ConversationContent>
								{/* Initial assistant message */}
								{messages.length === 0 && (
									<div>
										{/* biome-ignore lint/a11y/useValidAriaRole: role prop is for Message component, not ARIA */}
										<Message role="assistant">
											<MessageContent>
												<Response>
													{`I'll help you refine this scene. What would you like to change about the current video?

**Current Scene:** ${sceneTitle}
${sceneDescription}

Please describe what you'd like to improve or change in the video generation.`}
												</Response>
											</MessageContent>
										</Message>
									</div>
								)}
								{messages.map((message: UIMessage) => {
									// Extract text content from parts array
									const textContent = message.parts
										.filter((part) => part.type === "text")
										.map((part) => ("text" in part ? part.text : ""))
										.join("");

									return (
										<div key={message.id}>
											<Message
												role={message.role === "user" ? "user" : "assistant"}
											>
												<MessageContent>
													<Response>{textContent}</Response>
												</MessageContent>
											</Message>
										</div>
									);
								})}
								{isLoading && <Loader />}
								{error && (
									<div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
										⚠️{" "}
										{error.message ||
											"Failed to get AI response. Please try again."}
									</div>
								)}
							</ConversationContent>
						</Conversation>
					</div>

					{/* Input - Reuse existing PromptInput component */}
					<PromptInput onSubmit={handleChatSubmit} className="w-full">
						<PromptInputTextarea
							onChange={(e) => setInput(e.target.value)}
							value={input}
							placeholder="Describe what you'd like to change..."
							disabled={isLoading}
						/>
						<PromptInputToolbar>
							<PromptInputTools />
							<PromptInputSubmit
								disabled={isLoading || !input.trim()}
								status={isLoading ? "processing" : "idle"}
							/>
						</PromptInputToolbar>
					</PromptInput>

					{/* Approval buttons */}
					{showApproval && (
						<div className="flex flex-col items-center gap-3">
							<Button
								onClick={handleApproveDirection}
								size="default"
								variant="outline"
								className={`h-10 px-6 text-sm font-medium ${
									approved
										? "bg-green-600 hover:bg-green-700 text-white"
										: "text-white border-[#314d68] hover:bg-[#223649] bg-transparent"
								}`}
							>
								{approved ? "✓ Approved" : "✓ Approve this Direction"}
							</Button>

							{approved && (
								<Button
									onClick={handleFinalRegenerate}
									className="h-10 px-6 text-sm font-medium bg-[#0d7ff2] hover:bg-blue-600 text-white"
								>
									Regenerate Scene Video ✨
								</Button>
							)}
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
});
