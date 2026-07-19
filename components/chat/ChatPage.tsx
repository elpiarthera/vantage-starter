"use client";

import { useChat } from "@ai-sdk/react";
import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { MessageList } from "./MessageList";
import { ModelSelector } from "./ModelSelector";

interface ChatPageProps {
	chatId?: string;
}

export function ChatPage({ chatId }: ChatPageProps) {
	const t = useTranslations("chat");
	const [selectedModel, setSelectedModel] = useState("claude-sonnet-4-5");

	// Chat metadata — used to show + rename the chat's own display title.
	const chat = useQuery(
		api.chats.getById,
		chatId ? { id: chatId as Id<"chats"> } : "skip",
	);
	const updateChatTitle = useMutation(api.chats.update);
	const [isRenamingTitle, setIsRenamingTitle] = useState(false);
	const [titleDraft, setTitleDraft] = useState("");

	async function commitTitleRename() {
		setIsRenamingTitle(false);
		const trimmed = titleDraft.trim();
		if (!chatId || trimmed.length === 0) return;
		await updateChatTitle({ id: chatId as Id<"chats">, title: trimmed });
	}

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
		// Pass selectedModel per-request via ChatRequestOptions.body
		// so the route can read body.selectedModel without a static transport
		await sendMessage({ text }, { body: { selectedModel } });
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
					<div className="min-w-0">
						{isRenamingTitle ? (
							<input
								type="text"
								value={titleDraft}
								onChange={(e) => setTitleDraft(e.target.value)}
								onBlur={commitTitleRename}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.currentTarget.blur();
									} else if (e.key === "Escape") {
										setIsRenamingTitle(false);
									}
								}}
								ref={(el) => el?.focus()}
								aria-label={t("rename")}
								className="text-base font-semibold text-foreground bg-transparent border-b border-primary focus:outline-none"
							/>
						) : (
							<button
								type="button"
								onClick={() => {
									setTitleDraft(chat?.title ?? "");
									setIsRenamingTitle(true);
								}}
								disabled={!chat}
								className="group flex items-center gap-1.5 text-left disabled:cursor-default"
								aria-label={t("rename")}
							>
								<h1 className="text-base font-semibold text-foreground truncate">
									{chat?.title || t("page.agentName")}
								</h1>
								{chat && (
									<svg
										className="size-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										aria-hidden="true"
									>
										<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
										<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
									</svg>
								)}
							</button>
						)}
						<p className="text-xs text-muted-foreground">
							{t("page.agentSubtitle")}
						</p>
					</div>

					<ModelSelector
						selectedModelId={selectedModel}
						onModelChange={setSelectedModel}
					/>

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
							{t("page.generating")}
						</output>
					)}
				</div>
			</div>

			{/* Message area */}
			<section
				ref={scrollRef}
				className="flex-1 overflow-y-auto"
				aria-label={t("page.conversationAriaLabel")}
			>
				<MessageList messages={messages} isStreaming={isStreaming} />
			</section>

			{/* Error banner */}
			{error && (
				<div
					role="alert"
					className="mx-4 mb-2 px-4 py-3 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20"
				>
					<span className="font-medium">{t("page.errorLabel")} </span>
					{error.message ?? t("page.errorGeneric")}
				</div>
			)}

			{/* Input area */}
			<div className="shrink-0 px-4 md:px-6 py-4">
				<div className="bg-card border border-border rounded-xl p-3">
					<form
						onSubmit={handleFormSubmit}
						className="flex items-end gap-2"
						aria-label={t("page.formAriaLabel")}
					>
						<div className="flex-1 relative">
							<Textarea
								ref={textareaRef}
								value={input}
								onChange={handleTextareaChange}
								onKeyDown={handleKeyDown}
								placeholder={t("page.inputPlaceholder")}
								rows={1}
								disabled={isStreaming}
								aria-label={t("page.inputAriaLabel")}
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
								aria-label={t("page.stopGenerating")}
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
								aria-label={t("page.sendMessage")}
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
					{t("page.inputHint")}
				</p>
			</div>
		</div>
	);
}
