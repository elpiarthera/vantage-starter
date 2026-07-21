"use client";

import type { Spec } from "@json-render/core";
import { JSONUIProvider, Renderer, useChatUI } from "@json-render/react";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
	resolveOperationSelection,
	toggleOperationExclusion,
} from "@/lib/architect/operation-selection";
import {
	extractProposalFromSpec,
	filterProposalOperations,
	type ProposalOperation,
} from "@/lib/architect/proposal";
import { vantageOSRegistry } from "@/lib/json-render/registry";
import { cn } from "@/lib/utils";

interface ChatInterfaceProps {
	sessionId: Id<"architectSessions">;
	workspaceId: Id<"workspaces">;
	onPlanConfirmed: (missionId: Id<"missions">) => void;
}

// ============================================================================
// MESSAGE BUBBLES
// ============================================================================

function UserBubble({ text }: { text: string }) {
	return (
		<div className="flex justify-end">
			<div
				className="max-w-[80%] px-4 py-3 border"
				style={{
					backgroundColor: "oklch(0.62 0.18 240 / 0.12)",
					borderColor: "oklch(0.62 0.18 240 / 0.25)",
				}}
			>
				<p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
					{text}
				</p>
			</div>
		</div>
	);
}

function StreamingDots() {
	return (
		<span className="flex gap-1 motion-reduce:hidden" aria-hidden="true">
			<span
				className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
				style={{ animationDelay: "0ms" }}
			/>
			<span
				className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
				style={{ animationDelay: "150ms" }}
			/>
			<span
				className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
				style={{ animationDelay: "300ms" }}
			/>
		</span>
	);
}

function AssistantBubble({
	text,
	spec,
	isStreaming,
}: {
	text: string;
	spec: Spec | null;
	isStreaming?: boolean;
}) {
	const t = useTranslations("architect");
	return (
		<div className="flex justify-start">
			<div className="max-w-[95%] w-full space-y-3">
				{/* Text portion */}
				{text && (
					<p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
						{text}
						{isStreaming && (
							<span
								className="inline-block w-1.5 h-3.5 ml-0.5 animate-pulse align-middle"
								style={{ backgroundColor: "oklch(0.62 0.18 240)" }}
								aria-hidden="true"
							/>
						)}
					</p>
				)}
				{/* Plan rendering */}
				{spec && (
					<JSONUIProvider registry={vantageOSRegistry}>
						<Renderer
							spec={spec}
							registry={vantageOSRegistry}
							loading={isStreaming}
						/>
					</JSONUIProvider>
				)}
				{/* Streaming indicator when no text yet */}
				{!text && !spec && isStreaming && (
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<output className="sr-only">{t("thinking")}</output>
						<StreamingDots />
					</div>
				)}
			</div>
		</div>
	);
}

// ============================================================================
// CONFIRM PLAN BAR
// ============================================================================

// ============================================================================
// PER-OPERATION SELECTION CHECKLIST
// ============================================================================
//
// Reuses the visual language of TeamSelection / SkillSelection
// (lib/json-render/registry.tsx): a bordered row that changes border +
// background when selected, with an accessible checkbox indicator. Built as
// its own React component (rather than threaded through the AI-authored
// json-render spec/registry) because the spec is a re-streamed, read-only
// artifact — the source of truth for "what will be created" belongs to this
// screen, not to the model's output.

function OperationSelectionRow({
	operation,
	selected,
	blocked,
	onToggle,
}: {
	operation: ProposalOperation;
	selected: boolean;
	blocked: boolean;
	onToggle: (id: string) => void;
}) {
	const t = useTranslations("architect");
	return (
		<div
			className={cn(
				"flex items-start gap-3 border px-3 py-2.5 transition-colors duration-150",
				selected
					? "border-[oklch(0.62_0.18_240)]/40 bg-[oklch(0.62_0.18_240)]/5"
					: "border-border bg-muted/20 opacity-60",
			)}
		>
			<Checkbox
				checked={selected}
				disabled={blocked}
				onCheckedChange={() => onToggle(operation.id)}
				aria-label={t("toggle_operation_aria", { name: operation.name })}
				className="mt-0.5"
			/>
			<div className="flex-1 min-w-0">
				<p className="text-sm font-medium text-foreground truncate">
					{operation.name}
				</p>
				{blocked && (
					<p className="text-xs text-muted-foreground mt-0.5">
						{t("operation_blocked_by_dependency")}
					</p>
				)}
			</div>
		</div>
	);
}

function OperationSelectionChecklist({
	operations,
	manuallyExcludedIds,
	onToggle,
}: {
	operations: ProposalOperation[];
	manuallyExcludedIds: ReadonlySet<string>;
	onToggle: (id: string) => void;
}) {
	const t = useTranslations("architect");
	const { excludedIds, blockedIds } = useMemo(
		() => resolveOperationSelection(operations, manuallyExcludedIds),
		[operations, manuallyExcludedIds],
	);

	if (operations.length === 0) return null;

	return (
		<div className="px-4 py-3 space-y-2 border-t border-border">
			<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
				{t("select_operations_to_include")}
			</p>
			<div className="space-y-1.5 max-h-48 overflow-y-auto">
				{operations.map((operation) => (
					<OperationSelectionRow
						key={operation.id}
						operation={operation}
						selected={!excludedIds.has(operation.id)}
						blocked={blockedIds.has(operation.id)}
						onToggle={onToggle}
					/>
				))}
			</div>
		</div>
	);
}

// ============================================================================
// CONFIRM PLAN BAR
// ============================================================================

function ConfirmPlanBar({
	spec,
	sessionId,
	workspaceId,
	onConfirmed,
}: {
	spec: Spec;
	sessionId: Id<"architectSessions">;
	workspaceId: Id<"workspaces">;
	onConfirmed: (missionId: Id<"missions">) => void;
}) {
	const t = useTranslations("architect");
	const [isConfirming, setIsConfirming] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [manuallyExcludedIds, setManuallyExcludedIds] = useState<Set<string>>(
		new Set(),
	);

	// A new plan (new spec identity) always starts with every operation
	// selected — exclusions never carry over from a previous plan.
	// biome-ignore lint/correctness/useExhaustiveDependencies: spec identity is the intentional reset trigger; the effect body doesn't need to read it
	useEffect(() => {
		setManuallyExcludedIds(new Set());
	}, [spec]);

	const proposal = useMemo(() => extractProposalFromSpec(spec), [spec]);
	const operations = proposal?.operations ?? [];

	const toggleOperation = useCallback(
		(id: string) => {
			setManuallyExcludedIds((prev) =>
				toggleOperationExclusion(operations, prev, id),
			);
		},
		[operations],
	);

	const completeSession = useMutation(api.architectSessions.complete);
	const createMission = useMutation(api.missions.createFromProposal);

	const handleConfirm = async () => {
		if (!proposal) {
			setError(t("extract_proposal_error"));
			return;
		}

		const { excludedIds } = resolveOperationSelection(
			operations,
			manuallyExcludedIds,
		);
		const filteredProposal = filterProposalOperations(proposal, excludedIds);

		setIsConfirming(true);
		setError(null);

		try {
			const missionId = await createMission({
				workspaceId,
				proposal: filteredProposal,
			});
			await completeSession({
				sessionId,
				missionId: missionId as Id<"missions">,
			});
			onConfirmed(missionId as Id<"missions">);
		} catch (err) {
			setError(err instanceof Error ? err.message : t("create_mission_error"));
		} finally {
			setIsConfirming(false);
		}
	};

	return (
		<div className="border-t border-border bg-muted/30">
			<OperationSelectionChecklist
				operations={operations}
				manuallyExcludedIds={manuallyExcludedIds}
				onToggle={toggleOperation}
			/>
			<div className="px-4 py-3">
				<div className="flex items-center justify-between gap-4">
					<div>
						<p className="text-sm font-medium text-foreground tracking-[-0.015em]">
							{t("plan_ready")}
						</p>
						<p className="text-xs text-muted-foreground mt-0.5">
							{t("confirm_plan_description")}
						</p>
						{error && (
							<p
								className="text-xs mt-1"
								style={{ color: "oklch(0.65 0.2 25)" }}
							>
								{error}
							</p>
						)}
					</div>
					<Button
						onClick={handleConfirm}
						disabled={isConfirming}
						className="btn-shadow active-scale rounded-full shrink-0 font-medium"
						size="sm"
						aria-label={t("confirm_and_create_mission_aria")}
					>
						{isConfirming ? t("creating") : t("confirm_plan_button")}
					</Button>
				</div>
			</div>
		</div>
	);
}

// ============================================================================
// CHAT EMPTY STATE
// ============================================================================

function ChatEmptyHint() {
	const t = useTranslations("architect");
	return (
		<div className="flex flex-col items-center justify-center text-center gap-4 py-16">
			<div className="size-10 rounded-full bg-muted flex items-center justify-center">
				<svg
					className="size-5 text-muted-foreground"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.5"
					aria-hidden="true"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M12 2L2 7l10 5 10-5-10-5z"
					/>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M2 17l10 5 10-5"
					/>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M2 12l10 5 10-5"
					/>
				</svg>
			</div>
			<div className="space-y-1">
				<h2 className="text-sm font-semibold text-foreground">
					{t("describe_what_you_want_to_accomplish")}
				</h2>
				<p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
					{t("ai_will_design_workforce")}
				</p>
			</div>
		</div>
	);
}

// ============================================================================
// MAIN CHAT INTERFACE
// ============================================================================

// How close to the bottom (in px) the viewport must be for new content to
// still be considered "followed". Below this the user has taken over.
const STICK_TO_BOTTOM_THRESHOLD_PX = 48;

export function ChatInterface({
	sessionId,
	workspaceId,
	onPlanConfirmed,
}: ChatInterfaceProps) {
	const t = useTranslations("architect");
	const sentinelRef = useRef<HTMLDivElement>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const isStuckToBottomRef = useRef(true);
	const [input, setInput] = useState("");

	const addMessage = useMutation(api.architectSessions.addMessage);

	const apiUrl = `/api/architect/chat?sessionId=${sessionId}&workspaceId=${workspaceId}`;

	const { messages, isStreaming, error, send } = useChatUI({
		api: apiUrl,
		onComplete: async (msg) => {
			if (msg.role === "assistant") {
				await addMessage({
					sessionId,
					role: "assistant",
					content: msg.text || "[plan]",
				}).catch(() => {});
			}
		},
	});

	const lastAssistantMessage = [...messages]
		.reverse()
		.find((m) => m.role === "assistant");
	const activePlan = lastAssistantMessage?.spec ?? null;

	// Track whether the user is currently stuck to the bottom of the
	// scrollable viewport. Radix's ScrollArea renders its own scrollable
	// element (`data-slot="scroll-area-viewport"`) inside our wrapper div —
	// that inner element is what actually scrolls, so we listen on it.
	useEffect(() => {
		const viewport = scrollContainerRef.current?.querySelector<HTMLElement>(
			'[data-slot="scroll-area-viewport"]',
		);
		if (!viewport) return;

		const handleScroll = () => {
			const distanceFromBottom =
				viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
			isStuckToBottomRef.current =
				distanceFromBottom <= STICK_TO_BOTTOM_THRESHOLD_PX;
		};

		handleScroll();
		viewport.addEventListener("scroll", handleScroll, { passive: true });
		return () => viewport.removeEventListener("scroll", handleScroll);
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: messages.length and isStreaming are intentional triggers; sentinelRef is stable
	useEffect(() => {
		// Only auto-follow the stream if the user has not scrolled away from
		// the bottom. Once they scroll up, the automatic recall stops until
		// they return to the bottom themselves — otherwise a long streaming
		// plan yanks the viewport back down on every chunk and its top
		// becomes unreachable for as long as the stream lasts.
		if (!isStuckToBottomRef.current) return;
		sentinelRef.current?.scrollIntoView({ behavior: "auto" });
	}, [messages.length, isStreaming]);

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
		}
		await send(text);
	};

	return (
		<div className="flex flex-col h-full">
			{/* Messages */}
			<div className="flex-1 min-h-0" ref={scrollContainerRef}>
				<ScrollArea className="h-full">
					<div className="px-4 md:px-6 py-6 space-y-6 max-w-3xl mx-auto">
						{messages.length === 0 && !isStreaming && <ChatEmptyHint />}

						{messages.map((msg) => (
							<div key={msg.id}>
								{msg.role === "user" ? (
									<UserBubble text={msg.text} />
								) : (
									<AssistantBubble
										text={msg.text}
										spec={msg.spec}
										isStreaming={
											isStreaming && msg === messages[messages.length - 1]
										}
									/>
								)}
							</div>
						))}

						{isStreaming && messages.length === 0 && (
							<AssistantBubble text="" spec={null} isStreaming />
						)}

						<div ref={sentinelRef} aria-hidden="true" />
					</div>
				</ScrollArea>
			</div>

			{/* Error display */}
			{error && (
				<div className="px-4 py-2 border-t border-border bg-[oklch(0.65_0.2_25)]/10">
					<p className="text-xs" style={{ color: "oklch(0.65 0.2 25)" }}>
						{error.message}
					</p>
				</div>
			)}

			{/* Confirm plan bar */}
			{activePlan && !isStreaming && (
				<ConfirmPlanBar
					spec={activePlan}
					sessionId={sessionId}
					workspaceId={workspaceId}
					onConfirmed={onPlanConfirmed}
				/>
			)}

			{/* Input */}
			<div className="shrink-0 px-4 md:px-6 py-4">
				<div className="bg-card border border-border rounded-xl p-3">
					<form
						onSubmit={(e) => {
							e.preventDefault();
							submitMessage();
						}}
						className="flex items-end gap-2"
						aria-label={t("send_a_message_aria")}
					>
						<div className="flex-1 relative">
							<Textarea
								ref={textareaRef}
								value={input}
								onChange={(e) => {
									setInput(e.target.value);
									e.target.style.height = "auto";
									const newH = Math.min(
										Math.max(e.target.scrollHeight, 44),
										160,
									);
									e.target.style.height = `${newH}px`;
								}}
								onKeyDown={handleKeyDown}
								placeholder={t("ask_architect_placeholder")}
								disabled={isStreaming}
								rows={1}
								className={cn(
									"resize-none overflow-hidden pr-2 min-h-[44px] py-2.5",
									"leading-relaxed transition-none",
								)}
								aria-label={t("message_to_architect_aria")}
							/>
						</div>

						{/* Stop / Send button */}
						{isStreaming ? (
							<Button
								type="button"
								variant="outline"
								size="icon"
								className="shrink-0 size-11 rounded-xl"
								aria-label={t("thinking_ellipsis_aria")}
								disabled
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
								aria-label={t("send_message_aria")}
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
					{t("press_enter_hint")}
				</p>
			</div>
		</div>
	);
}
