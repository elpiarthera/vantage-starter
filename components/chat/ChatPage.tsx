"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MessageList } from "./MessageList";

interface ChatPageProps {
	chatId?: string;
}

export function ChatPage({ chatId }: ChatPageProps) {
	// v6 useChat: sendMessage replaces handleSubmit+handleInputChange
	// transport defaults to DefaultChatTransport → /api/chat
	// id namespaces the client-side message store per chat session
	const { messages, sendMessage, stop, status, error } = useChat({
		id: chatId,
	});

	const isStreaming = status === "streaming" || status === "submitted";

	const scrollRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [input, setInput] = useState("");
	const [textareaHeight, setTextareaHeight] = useState(44);

	// Auto-scroll to bottom on new messages
	// biome-ignore lint/correctness/useExhaustiveDependencies: messages and isStreaming are intentional triggers; scrollRef is stable
	useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;
		el.scrollTop = el.scrollHeight;
	}, [messages.length, isStreaming]);

	// Auto-resize textarea
	const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setInput(e.target.value);
		const el = e.target;
		el.style.height = "auto";
		const newHeight = Math.min(Math.max(el.scrollHeight, 44), 160);
		el.style.height = `${newHeight}px`;
		setTextareaHeight(newHeight);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			if (input.trim() && !isStreaming) {
				submitMessage();
			}
		}
	};

	const submitMessage = async () => {
		if (!input.trim() || isStreaming) return;
		const text = input.trim();
		setInput("");
		if (textareaRef.current) {
			textareaRef.current.style.height = "44px";
			setTextareaHeight(44);
		}
		await sendMessage({ text });
	};

	const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		submitMessage();
	};

	return (
		<div className="flex flex-col h-[calc(100vh-8rem)]">
			{/* Page header */}
			<div className="border-b border-border px-4 md:px-6 py-4 shrink-0">
				<div className="flex items-center gap-3">
					<div className="size-8 rounded-xl bg-muted flex items-center justify-center">
						<svg
							className="size-4 text-muted-foreground"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
							/>
						</svg>
					</div>
					<div>
						<h1 className="text-base font-semibold text-foreground">
							AI Agent
						</h1>
						<p className="text-xs text-muted-foreground">
							ToolLoopAgent — knowledge base + tools
						</p>
					</div>

					{/* Live indicator */}
					{isStreaming && (
						<output
							className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground"
							aria-live="polite"
						>
							<span
								className="size-2 rounded-full bg-muted-foreground animate-pulse"
								aria-hidden="true"
							/>
							Generating
						</output>
					)}
				</div>
			</div>

			{/* Message area */}
			<section
				ref={scrollRef}
				className="flex-1 overflow-y-auto"
				aria-label="Chat conversation"
			>
				<MessageList messages={messages} isStreaming={isStreaming} />
			</section>

			{/* Error banner */}
			{error && (
				<div
					role="alert"
					className="mx-4 mb-2 px-4 py-3 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20"
				>
					<span className="font-medium">Error: </span>
					{error.message ?? "Something went wrong. Please try again."}
				</div>
			)}

			{/* Input area */}
			<div className="shrink-0 px-4 md:px-6 py-4">
				<div className="bg-card border border-border rounded-xl p-3">
					<form
						onSubmit={handleFormSubmit}
						className="flex items-end gap-2"
						aria-label="Send a message"
					>
						<div className="flex-1 relative">
							<Textarea
								ref={textareaRef}
								value={input}
								onChange={handleTextareaChange}
								onKeyDown={handleKeyDown}
								placeholder="Ask the agent anything..."
								rows={1}
								disabled={isStreaming}
								aria-label="Message input"
								className={cn(
									"resize-none overflow-hidden pr-2 min-h-[44px] py-2.5",
									"leading-relaxed transition-none",
								)}
								style={{ height: textareaHeight }}
							/>
						</div>

						{/* Stop / Send button */}
						{isStreaming ? (
							<Button
								type="button"
								variant="outline"
								size="icon"
								onClick={stop}
								className="shrink-0 size-11 rounded-xl"
								aria-label="Stop generating"
							>
								<svg
									className="size-4"
									viewBox="0 0 16 16"
									fill="currentColor"
									aria-hidden="true"
								>
									<rect x="3" y="3" width="10" height="10" rx="1" />
								</svg>
							</Button>
						) : (
							<Button
								type="submit"
								size="icon"
								disabled={!input.trim()}
								className="shrink-0 size-11 rounded-xl"
								aria-label="Send message"
							>
								<svg
									className="size-4"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									aria-hidden="true"
								>
									<path d="M14 8H2M14 8L8 2M14 8L8 14" />
								</svg>
							</Button>
						)}
					</form>
				</div>

				<p className="text-[11px] text-muted-foreground mt-2 text-center">
					Press Enter to send · Shift+Enter for new line
				</p>
			</div>
		</div>
	);
}
