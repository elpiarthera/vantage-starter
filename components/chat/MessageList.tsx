"use client";

import {
	getToolName,
	isDataUIPart,
	isTextUIPart,
	isToolUIPart,
	type UIMessage,
} from "ai";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import {
	ChatConversation,
	ChatConversationMessages,
} from "@/components/ui/chat-conversation";
import {
	MessageBubble,
	MessageBubbleContent,
} from "@/components/ui/message-bubble";
import {
	QuickReply,
	QuickReplyList,
	type QuickReplyOption,
} from "@/components/ui/quick-reply";
import {
	Table,
	type TableColumn,
	TableGrid,
	useTable,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ToolCallIndicator } from "./ToolCallIndicator";

/**
 * Payload shape for the `data-table` message part (mcpcn `table` block,
 * Batch 2 — docs/mcpcn-block-mapping.md §4 "table"): the architect agent
 * emits this instead of a markdown table when it wants the user to pick a
 * row (e.g. "here are 6 candidate fixes, pick one"). No schema change — this
 * is a client-side rendering contract on top of the AI SDK v6 generic
 * `data-*` UI part, not a new persisted type.
 */
interface TableMessagePartData {
	columns: TableColumn<Record<string, unknown>>[];
	rows: Record<string, unknown>[];
}

function isTableMessagePart(
	part: unknown,
): part is { type: "data-table"; data: TableMessagePartData } {
	return (
		isDataUIPart(part as never) &&
		(part as { type: string }).type === "data-table"
	);
}

interface MessageListProps {
	messages: UIMessage[];
	isStreaming: boolean;
	/**
	 * Fired when the user taps a quick-reply option instead of typing.
	 * Wired by the caller (ChatPage) to the same `sendMessage` call a typed
	 * Enter would trigger. Optional — quick-reply is additive; a caller that
	 * omits it simply gets no quick-reply row.
	 */
	onQuickReply?: (text: string) => void;
	/**
	 * Fired when the user selects a row of an inline `data-table` message
	 * part (mcpcn `table` block). Carries that row's `id` field. Optional —
	 * additive; a caller that omits it simply gets no selection callback
	 * (the table still renders and highlights the tapped row).
	 */
	onTableRowSelect?: (rowId: string) => void;
}

// DECLARED DIVERGENCE (not wired to a ported block): upstream `message-bubble`
// only models an avatar as either an image URL or a single fallback letter
// (`avatarFallback`/`avatarUrl`) — it has no slot for an arbitrary brand SVG
// icon. Routing this through that model would replace the app's spark icon
// with a plain letter square, a visible regression. Kept hand-written.
function AgentAvatar() {
	return (
		<div
			data-agent-avatar="true"
			className="size-7 rounded-lg bg-primary flex items-center justify-center shrink-0 mt-0.5"
			aria-hidden="true"
		>
			<svg
				className="size-3.5 text-primary-foreground"
				viewBox="0 0 16 16"
				fill="none"
				aria-hidden="true"
			>
				<path
					d="M8 2L10 6H14L11 9L12 13L8 11L4 13L5 9L2 6H6L8 2Z"
					fill="currentColor"
				/>
			</svg>
		</div>
	);
}

// LEGITIMATE EXCEPTION: upstream mcpcn ships no streaming-cursor concept at
// all (its blocks render static demo data, never a live-generating message).
// There is nothing to port here — kept hand-written by necessity, not choice.
function StreamingCursor() {
	return (
		<span
			aria-hidden="true"
			className="inline-block w-2 h-4 bg-primary ml-0.5 animate-pulse rounded-sm align-middle"
		/>
	);
}

// Map v6 tool state names to what ToolCallIndicator expects
type ToolCallState = "streaming" | "call" | "result" | "partial-call";

function mapToolState(state: string): ToolCallState {
	switch (state) {
		case "input-streaming":
			return "streaming";
		case "input-available":
			return "call";
		case "output-available":
		case "output-error":
		case "approval-requested":
		case "approval-denied":
			return "result";
		default:
			return "call";
	}
}

interface MessageBubbleProps {
	message: UIMessage;
	isLastMessage: boolean;
	isStreaming: boolean;
	onTableRowSelect?: (rowId: string) => void;
}

/**
 * Renders a `data-table` message part through the ported `table` block
 * (mcpcn, Batch 2). Row selection reads the row's own `id` field — if a row
 * carries no `id`, selecting it is a no-op rather than surfacing `undefined`
 * to the caller.
 */
function TableMessagePart({
	data,
	onTableRowSelect,
}: {
	data: TableMessagePartData;
	onTableRowSelect?: (rowId: string) => void;
}) {
	const t = useTranslations("chat");

	return (
		<Table
			appearance={{
				selectable: onTableRowSelect ? "single" : "none",
				showActions: false,
				showHeader: false,
				showFooter: false,
				emptyMessage: t("messageList.table.emptyMessage"),
			}}
			data={{ columns: data.columns, rows: data.rows }}
		>
			<TableGridWithSelection onTableRowSelect={onTableRowSelect} />
		</Table>
	);
}

/**
 * Thin wrapper around `TableGrid` that reads the block's own selection
 * context (`useTable`) — set by `TableGrid`'s row `onClick` — and, when the
 * selected row carries an `id` field, fires `onTableRowSelect` with it.
 * Composes the ported block's real selection state rather than forking it
 * with a parallel DOM-level click handler.
 */
function TableGridWithSelection({
	onTableRowSelect,
}: {
	onTableRowSelect?: (rowId: string) => void;
}) {
	const { selectedRows } = useTable();
	const lastNotifiedRef = useRef<string | null>(null);

	useEffect(() => {
		if (!onTableRowSelect) return;
		const lastSelected = selectedRows.at(-1);
		const rowId = typeof lastSelected?.id === "string" ? lastSelected.id : null;
		if (rowId && rowId !== lastNotifiedRef.current) {
			lastNotifiedRef.current = rowId;
			onTableRowSelect(rowId);
		}
	}, [selectedRows, onTableRowSelect]);

	return <TableGrid />;
}

function MessageListItem({
	message,
	isLastMessage,
	isStreaming,
	onTableRowSelect,
}: MessageBubbleProps) {
	const isUser = message.role === "user";
	const isAssistant = message.role === "assistant";

	const parts = message.parts ?? [];

	// Collect text content from TextUIPart
	const textContent = parts
		.filter(isTextUIPart)
		.map((p) => p.text)
		.join("");

	// Collect tool parts using v6 API
	const toolParts = parts.filter(isToolUIPart);

	// Collect data-table parts (mcpcn `table` block, Batch 2)
	const tableParts = parts.filter(isTableMessagePart);

	const showCursor = isAssistant && isLastMessage && isStreaming && textContent;

	return (
		<div className={cn("flex gap-3 w-full", isUser && "flex-row-reverse")}>
			{/* Avatar — agent only */}
			{isAssistant && <AgentAvatar />}

			<div
				className={cn(
					"flex flex-col gap-2 max-w-[85%] md:max-w-[75%]",
					isUser && "items-end",
				)}
			>
				{/* Tool call indicators — rendered above the text */}
				{toolParts.length > 0 && (
					<div className="flex flex-col gap-1.5">
						{toolParts.map((part, i) => {
							const toolName = getToolName(part);
							const isDynamic = part.type === "dynamic-tool";
							const toolCallId = isDynamic
								? (part as { toolCallId: string }).toolCallId
								: `${toolName}-${i}`;
							const state = "state" in part ? String(part.state) : "call";

							return (
								<ToolCallIndicator
									key={toolCallId}
									toolName={toolName}
									state={mapToolState(state)}
								/>
							);
						})}
					</div>
				)}

				{/* Text content — rendered through the ported message-bubble block */}
				{textContent && (
					<div className={cn("flex flex-col", isUser && "items-end")}>
						<MessageBubble
							appearance={{ isOwn: isUser }}
							data={{ content: textContent }}
						>
							<MessageBubbleContent />
						</MessageBubble>
						{showCursor && <StreamingCursor />}
					</div>
				)}

				{/* Data tables — rendered through the ported table block (mcpcn, Batch 2) */}
				{tableParts.map((part, i) => (
					<TableMessagePart
						key={`${message.id}-table-${i}`}
						data={part.data}
						onTableRowSelect={onTableRowSelect}
					/>
				))}

				{/* Streaming placeholder — shows cursor when no text yet */}
				{isAssistant && isLastMessage && isStreaming && !textContent && (
					<div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
						<StreamingCursor />
					</div>
				)}
			</div>
		</div>
	);
}

// Fixed quick-reply set for the "add this to the roadmap now or later?"
// style prompt (docs/mcpcn-block-mapping.md Batch 1). Net-new affordance —
// replaces nothing; shown after the last assistant text message once
// streaming has stopped, so the user can tap instead of typing.
function useQuickReplyOptions(): QuickReplyOption[] {
	const t = useTranslations("chat");
	return [
		{ label: t("messageList.quickReply.addNow") },
		{ label: t("messageList.quickReply.addLater") },
		{ label: t("messageList.quickReply.tellMeMore") },
	];
}

export function MessageList({
	messages,
	isStreaming,
	onQuickReply,
	onTableRowSelect,
}: MessageListProps) {
	const t = useTranslations("chat");
	const quickReplyOptions = useQuickReplyOptions();
	const lastMessage = messages[messages.length - 1];
	const showQuickReply =
		Boolean(onQuickReply) &&
		!isStreaming &&
		lastMessage?.role === "assistant" &&
		(lastMessage.parts ?? []).some(isTextUIPart);

	if (messages.length === 0) {
		// DECLARED DIVERGENCE (not wired to `chat-conversation`): upstream ships
		// no empty-state concept, and its Root always applies card styling
		// (`rounded-xl bg-card p-4`) that would visibly box this full-height,
		// transparent, centered state — a look nobody asked for. Kept hand-written.
		return (
			<div className="flex flex-col items-center justify-center h-full gap-4 px-4 text-center">
				<div className="size-12 rounded-2xl bg-muted flex items-center justify-center">
					<svg
						className="size-6 text-primary"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
						aria-hidden="true"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
						/>
					</svg>
				</div>
				<div>
					<p className="text-base font-medium text-foreground">
						{t("messageList.emptyTitle")}
					</p>
					<p className="text-sm text-muted-foreground mt-1">
						{t("messageList.emptyDescription")}
					</p>
				</div>
			</div>
		);
	}

	// Wired to the ported `chat-conversation` shell: `ChatConversation` supplies
	// the list container, `ChatConversationMessages` the list layout. The
	// card styling is neutralized (twMerge resolves the conflicting utility
	// classes) so the previous transparent, flush-padded look is unchanged;
	// `data={{ messages: [] }}` is unused context — we always pass explicit
	// children below to keep tool-call indicators, per-message avatars, and
	// the streaming cursor, none of which the upstream default renderer knows.
	return (
		<ChatConversation
			role="log"
			aria-label={t("messageList.ariaLabel")}
			aria-live="polite"
			className="rounded-none bg-transparent p-0 px-4 py-4"
			data={{ messages: [] }}
		>
			<ChatConversationMessages>
				{messages.map((message, index) => (
					<MessageListItem
						key={message.id}
						message={message}
						isLastMessage={index === messages.length - 1}
						isStreaming={isStreaming}
						onTableRowSelect={onTableRowSelect}
					/>
				))}
				{showQuickReply && (
					<QuickReply
						data={{ replies: quickReplyOptions }}
						actions={{
							onSelectReply: (reply) => {
								if (reply.label) onQuickReply?.(reply.label);
							},
						}}
						aria-label={t("messageList.quickReply.ariaLabel")}
						className="bg-transparent p-0"
					>
						<QuickReplyList />
					</QuickReply>
				)}
			</ChatConversationMessages>
		</ChatConversation>
	);
}
