"use client";

import type { Spec } from "@json-render/core";
import { Renderer, useChatUI } from "@json-render/react";
import { useMutation } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { vantageOSRegistry } from "@/lib/json-render/registry";
import { cn } from "@/lib/utils";

interface ChatInterfaceProps {
	sessionId: Id<"architectSessions">;
	workspaceId: Id<"workspaces">;
	onPlanConfirmed: (missionId: Id<"missions">) => void;
}

// ============================================================================
// EXTRACTED PROPOSAL TYPES — must match operationProposalValidator / checkpointProposalValidator
// ============================================================================

interface ProposalOperation {
	id: string;
	name: string;
	description?: string;
	type: "ai" | "human";
	assignedAgentId?: string;
	estimatedMinutes?: number;
	dependsOn?: string[];
	requiresReview?: boolean;
	requiredTools?: string[];
}

interface ProposalCheckpoint {
	afterOperationId: string;
	description: string;
}

// ============================================================================
// MESSAGE BUBBLE
// ============================================================================

function UserBubble({ text }: { text: string }) {
	return (
		<div className="flex justify-end">
			<div className="max-w-[80%] bg-[oklch(0.62_0.18_240)]/15 border border-[oklch(0.62_0.18_240)]/30 px-4 py-3">
				<p className="text-sm text-[oklch(0.93_0.01_240)] leading-relaxed whitespace-pre-wrap">
					{text}
				</p>
			</div>
		</div>
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
	return (
		<div className="flex justify-start">
			<div className="max-w-[95%] w-full space-y-3">
				{/* Text portion */}
				{text && (
					<p className="text-sm text-[oklch(0.65_0.01_240)] leading-relaxed whitespace-pre-wrap">
						{text}
						{isStreaming && (
							<span
								className="inline-block w-1.5 h-3.5 bg-[oklch(0.62_0.18_240)] ml-0.5 animate-pulse"
								aria-hidden="true"
							/>
						)}
					</p>
				)}
				{/* Plan rendering */}
				{spec && (
					<Renderer
						spec={spec}
						registry={vantageOSRegistry}
						loading={isStreaming}
					/>
				)}
				{/* Streaming indicator when no text yet */}
				{!text && !spec && isStreaming && (
					<div className="flex items-center gap-2 text-xs text-[oklch(0.65_0.01_240)]">
						<output className="sr-only">Thinking</output>
						<span
							className="flex gap-1 motion-reduce:hidden"
							aria-hidden="true"
						>
							<span className="w-1 h-1 rounded-full bg-[oklch(0.65_0.01_240)] animate-bounce [animation-delay:0ms]" />
							<span className="w-1 h-1 rounded-full bg-[oklch(0.65_0.01_240)] animate-bounce [animation-delay:150ms]" />
							<span className="w-1 h-1 rounded-full bg-[oklch(0.65_0.01_240)] animate-bounce [animation-delay:300ms]" />
						</span>
					</div>
				)}
			</div>
		</div>
	);
}

// ============================================================================
// CONFIRM PLAN BUTTON
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
	const [isConfirming, setIsConfirming] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Extract mission proposal data from spec
	const extractProposal = useCallback(() => {
		if (!spec?.elements) return null;

		const rootId = spec.root;
		if (!rootId) return null;

		const root = spec.elements[rootId as string];
		if (!root || root.type !== "MissionProposal") return null;

		const ops: ProposalOperation[] = [];
		const checkpoints: ProposalCheckpoint[] = [];

		for (const childId of root.children ?? []) {
			const child = spec.elements[childId as string];
			if (!child) continue;

			// Cast child.props from `unknown` — safe, AI always outputs per system prompt format
			const cp = child.props as Record<string, unknown>;

			if (child.type === "OperationItem") {
				const rawType = String(cp.type ?? "ai");
				ops.push({
					id: String(cp.id ?? childId),
					name: String(cp.name ?? ""),
					description:
						cp.description !== undefined ? String(cp.description) : undefined,
					type: rawType === "human" ? "human" : "ai",
					assignedAgentId:
						cp.assignedAgentId !== undefined
							? String(cp.assignedAgentId)
							: undefined,
					estimatedMinutes:
						typeof cp.estimatedMinutes === "number"
							? cp.estimatedMinutes
							: undefined,
					dependsOn: Array.isArray(cp.dependsOn)
						? (cp.dependsOn as unknown[]).map(String)
						: undefined,
					requiresReview:
						typeof cp.requiresReview === "boolean"
							? cp.requiresReview
							: undefined,
					requiredTools: Array.isArray(cp.requiredTools)
						? (cp.requiredTools as unknown[]).map(String)
						: undefined,
				});
			} else if (child.type === "Checkpoint") {
				checkpoints.push({
					afterOperationId: String(cp.afterOperationId ?? ""),
					description: String(cp.description ?? ""),
				});
			}
		}

		// Cast root props from `unknown` — safe, same guarantee
		const p = root.props as Record<string, unknown>;
		return {
			name: String(p.name ?? ""),
			brief: String(p.brief ?? ""),
			objective: String(p.objective ?? ""),
			estimatedTimeline: String(p.estimatedTimeline ?? ""),
			successCriteria: Array.isArray(p.successCriteria)
				? (p.successCriteria as string[])
				: [],
			intent: "delivery" as const,
			structure: "linear" as const,
			operations: ops,
			checkpoints,
		};
	}, [spec]);

	const completeSession = useMutation(api.architectSessions.complete);
	const createMission = useMutation(api.missions.createFromProposal);

	const handleConfirm = async () => {
		const proposal = extractProposal();
		if (!proposal) {
			setError("Could not extract plan data. Try asking the Architect again.");
			return;
		}

		setIsConfirming(true);
		setError(null);

		try {
			const missionId = await createMission({
				workspaceId,
				proposal,
			});

			await completeSession({
				sessionId,
				missionId: missionId as Id<"missions">,
			});

			onConfirmed(missionId as Id<"missions">);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create mission");
		} finally {
			setIsConfirming(false);
		}
	};

	return (
		<div className="border-t border-border bg-[oklch(0.17_0.01_240)] px-4 py-3">
			<div className="flex items-center justify-between gap-4">
				<div>
					<p className="text-sm font-medium text-[oklch(0.93_0.01_240)]">
						Plan ready
					</p>
					<p className="text-xs text-[oklch(0.65_0.01_240)]">
						Confirm to create mission and operations in your workspace.
					</p>
					{error && (
						<p className="text-xs text-[oklch(0.65_0.2_25)] mt-1">{error}</p>
					)}
				</div>
				<Button
					onClick={handleConfirm}
					disabled={isConfirming}
					className="rounded-full shrink-0 font-medium"
					size="sm"
					aria-label="Confirm and create mission"
				>
					{isConfirming ? "Creating..." : "Confirm plan"}
				</Button>
			</div>
		</div>
	);
}

// ============================================================================
// MAIN CHAT INTERFACE
// ============================================================================

export function ChatInterface({
	sessionId,
	workspaceId,
	onPlanConfirmed,
}: ChatInterfaceProps) {
	const sentinelRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [input, setInput] = useState("");

	const addMessage = useMutation(api.architectSessions.addMessage);

	// Build API URL with session + workspace context
	const apiUrl = `/api/architect/chat?sessionId=${sessionId}&workspaceId=${workspaceId}`;

	const { messages, isStreaming, error, send } = useChatUI({
		api: apiUrl,
		onComplete: async (msg) => {
			// Save assistant message to Convex after stream completes
			if (msg.role === "assistant") {
				await addMessage({
					sessionId,
					role: "assistant",
					content: msg.text || "[plan]",
				}).catch(() => {}); // Non-blocking — Convex history is secondary
			}
		},
	});

	// Last assistant message's spec (for confirm bar)
	const lastAssistantMessage = [...messages]
		.reverse()
		.find((m) => m.role === "assistant");
	const activePlan = lastAssistantMessage?.spec ?? null;

	// Auto-scroll to bottom — sentinel approach avoids ScrollArea ref issues
	// biome-ignore lint/correctness/useExhaustiveDependencies: messages.length and isStreaming are intentional triggers; sentinelRef is stable
	useEffect(() => {
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
			<ScrollArea className="flex-1">
				<div className="px-4 md:px-6 py-6 space-y-6 max-w-3xl mx-auto">
					{messages.length === 0 && !isStreaming && (
						<div className="py-16 text-center">
							<p className="text-[oklch(0.65_0.01_240)] text-sm leading-relaxed max-w-sm mx-auto">
								Describe what you want to accomplish. I'll design an agent
								workforce and execution plan.
							</p>
						</div>
					)}

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

					{/* Streaming indicator for first response */}
					{isStreaming && messages.length === 0 && (
						<AssistantBubble text="" spec={null} isStreaming />
					)}

					{/* Scroll sentinel */}
					<div ref={sentinelRef} aria-hidden="true" />
				</div>
			</ScrollArea>

			{/* Error display */}
			{error && (
				<div className="px-4 py-2 border-t border-border bg-[oklch(0.65_0.2_25)]/10">
					<p className="text-xs text-[oklch(0.65_0.2_25)]">{error.message}</p>
				</div>
			)}

			{/* Confirm plan bar — shows when last message contains a plan */}
			{activePlan && !isStreaming && (
				<ConfirmPlanBar
					spec={activePlan}
					sessionId={sessionId}
					workspaceId={workspaceId}
					onConfirmed={onPlanConfirmed}
				/>
			)}

			{/* Input */}
			<div className="border-t border-border px-4 md:px-6 py-4">
				<form
					onSubmit={(e) => {
						e.preventDefault();
						submitMessage();
					}}
					className="flex items-end gap-3"
				>
					<Textarea
						ref={textareaRef}
						value={input}
						onChange={(e) => {
							setInput(e.target.value);
							e.target.style.height = "auto";
							const newH = Math.min(Math.max(e.target.scrollHeight, 44), 160);
							e.target.style.height = `${newH}px`;
						}}
						onKeyDown={handleKeyDown}
						placeholder="Describe your goal..."
						disabled={isStreaming}
						rows={1}
						className={cn(
							"flex-1 resize-none min-h-[44px] max-h-[160px]",
							"bg-[oklch(0.17_0.01_240)] border-border rounded-[6px]",
							"text-sm text-[oklch(0.93_0.01_240)] placeholder:text-[oklch(0.65_0.01_240)]",
							"focus-visible:ring-[oklch(0.62_0.18_240)]",
						)}
						aria-label="Message to Architect"
					/>
					<Button
						type="submit"
						disabled={!input.trim() || isStreaming}
						className="rounded-full shrink-0 h-11 px-5 font-medium"
						aria-label="Send message"
					>
						{isStreaming ? "Thinking..." : "Send"}
					</Button>
				</form>
			</div>
		</div>
	);
}
