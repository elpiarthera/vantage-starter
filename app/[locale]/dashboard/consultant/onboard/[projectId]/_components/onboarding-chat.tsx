"use client";

/**
 * OnboardingChat — Discovery Chat Interface for Consultant Onboarding
 *
 * Loads project data from Convex, passes it to the streaming endpoint,
 * renders json-render spec (OnboardingConfig, TeamSelection, etc.) when
 * the AI produces structured output.
 *
 * Pattern: mirrors architect chat-interface.tsx but with onboarding-specific
 * behavior: project context injection, OnboardingConfig confirm flow.
 */

import type { Spec } from "@json-render/core";
import { Renderer, useChatUI } from "@json-render/react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { vantageOSRegistry } from "@/lib/json-render/registry";
import { cn } from "@/lib/utils";

// ============================================================================
// PROPS
// ============================================================================

interface OnboardingChatProps {
	projectId: string;
}

// ============================================================================
// MESSAGE BUBBLES (same pattern as architect chat-interface)
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
	return (
		<div className="flex justify-start">
			<div className="max-w-[95%] w-full space-y-3">
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
				{spec && (
					<Renderer
						spec={spec}
						registry={vantageOSRegistry}
						loading={isStreaming}
					/>
				)}
				{!text && !spec && isStreaming && (
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<output className="sr-only">Thinking</output>
						<StreamingDots />
					</div>
				)}
			</div>
		</div>
	);
}

// ============================================================================
// CONFIRM CONFIG BAR
// ============================================================================

function ConfirmConfigBar({
	spec,
	projectId,
	onConfirmed,
}: {
	spec: Spec;
	projectId: Id<"consultantProjects">;
	onConfirmed: () => void;
}) {
	const t = useTranslations("consultant");
	const [isConfirming, setIsConfirming] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const updateProject = useMutation(api.consultantProjects.update);
	const updateStatus = useMutation(api.consultantProjects.updateStatus);

	const extractConfig = useCallback(() => {
		if (!spec?.elements || !spec.root) return null;

		const root = spec.elements[spec.root as string];
		if (!root || root.type !== "OnboardingConfig") return null;

		const p = root.props as Record<string, unknown>;

		const selectedTeams: string[] = [];
		const selectedAgents: string[] = [];
		const selectedSkills: string[] = [];

		for (const childId of root.children ?? []) {
			const team = spec.elements[childId as string];
			if (!team || team.type !== "TeamSelection") continue;

			const tp = team.props as Record<string, unknown>;
			if (tp.selected && typeof tp.teamId === "string") {
				selectedTeams.push(tp.teamId);
			}

			for (const agentChildId of team.children ?? []) {
				const agent = spec.elements[agentChildId as string];
				if (!agent || agent.type !== "AgentSelection") continue;

				const ap = agent.props as Record<string, unknown>;
				if (ap.selected && typeof ap.agentId === "string") {
					selectedAgents.push(ap.agentId);
				}

				for (const skillChildId of agent.children ?? []) {
					const skill = spec.elements[skillChildId as string];
					if (!skill || skill.type !== "SkillSelection") continue;

					const sp = skill.props as Record<string, unknown>;
					if (sp.selected && typeof sp.skillId === "string") {
						selectedSkills.push(sp.skillId);
					}
				}
			}
		}

		return {
			config: spec,
			selectedTeams,
			selectedAgents,
			selectedSkills,
			summary: typeof p.summary === "string" ? p.summary : "",
		};
	}, [spec]);

	const handleConfirm = async () => {
		const extracted = extractConfig();
		if (!extracted) {
			setError(t("configExtractError"));
			return;
		}

		setIsConfirming(true);
		setError(null);

		try {
			await updateProject({
				projectId,
				config: extracted.config,
				selectedTeams: extracted.selectedTeams,
				selectedAgents: extracted.selectedAgents,
				selectedSkills: extracted.selectedSkills,
			});
			await updateStatus({ projectId, status: "review" });
			onConfirmed();
		} catch (err) {
			setError(err instanceof Error ? err.message : t("saveConfigError"));
		} finally {
			setIsConfirming(false);
		}
	};

	return (
		<div className="border-t border-border px-4 py-3 bg-muted/30">
			<div className="flex items-center justify-between gap-4">
				<div>
					<p className="text-sm font-medium text-foreground tracking-[-0.015em]">
						{t("configReady")}
					</p>
					<p className="text-xs text-muted-foreground mt-0.5">
						{t("configReadyDesc")}
					</p>
					{error && (
						<p
							className="text-xs mt-1"
							style={{ color: "oklch(0.65 0.2 25)" }}
							role="alert"
						>
							{error}
						</p>
					)}
				</div>
				<button
					type="button"
					onClick={handleConfirm}
					disabled={isConfirming}
					className="btn-shadow active-scale rounded-full shrink-0 h-11 px-5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					aria-label={t("deployConfig")}
				>
					{isConfirming ? t("saving") : t("deployConfig")}
				</button>
			</div>
		</div>
	);
}

// ============================================================================
// CHAT EMPTY HINT
// ============================================================================

function ChatEmptyHint() {
	const t = useTranslations("consultant");
	return (
		<div className="py-16 flex flex-col items-center justify-center text-center gap-3">
			<p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
				{t("chatEmptyHint")}
			</p>
		</div>
	);
}

// ============================================================================
// LOADING / ERROR STATES
// ============================================================================

function ProjectLoading() {
	const t = useTranslations("consultant");
	return (
		<div className="flex items-center justify-center h-full">
			<div className="space-y-2 w-48">
				<div className="h-2.5 bg-muted animate-pulse rounded-sm" />
				<div className="h-2.5 bg-muted animate-pulse w-3/4 rounded-sm" />
				<p className="text-xs text-muted-foreground text-center pt-2">
					{t("loadingProject")}
				</p>
			</div>
		</div>
	);
}

function ProjectNotFound() {
	const t = useTranslations("consultant");
	return (
		<div className="flex items-center justify-center h-full px-4">
			<div className="flex flex-col items-center gap-4 text-center max-w-xs">
				<div className="space-y-1">
					<p className="text-sm font-medium text-foreground">
						{t("projectNotFound")}
					</p>
					<p className="text-xs text-muted-foreground leading-relaxed">
						{t("projectNotFoundDesc")}
					</p>
				</div>
			</div>
		</div>
	);
}

// ============================================================================
// MAIN ONBOARDING CHAT
// ============================================================================

export function OnboardingChat({ projectId }: OnboardingChatProps) {
	const t = useTranslations("consultant");
	const locale = useLocale();
	const router = useRouter();
	const sentinelRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [input, setInput] = useState("");

	// Load project data from Convex
	const project = useQuery(api.consultantProjects.get, {
		projectId: projectId as Id<"consultantProjects">,
	});

	const addMessage = useMutation(api.architectSessions.addMessage);

	const apiUrl = project
		? `/api/consultant/onboard?projectId=${projectId}`
		: null;

	const { messages, isStreaming, error, send } = useChatUI({
		api: apiUrl ?? "/api/consultant/onboard",
		onComplete: async (msg) => {
			if (msg.role === "assistant" && project?.sessionId) {
				await addMessage({
					sessionId: project.sessionId,
					role: "assistant",
					content: msg.text || "[config]",
				}).catch(() => {});
			}
		},
	});

	const lastAssistantMessage = [...messages]
		.reverse()
		.find((m) => m.role === "assistant");
	const activeSpec = lastAssistantMessage?.spec ?? null;

	// biome-ignore lint/correctness/useExhaustiveDependencies: messages.length and isStreaming are intentional triggers
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
		if (!input.trim() || isStreaming || !apiUrl) return;
		const text = input.trim();
		setInput("");
		if (textareaRef.current) {
			textareaRef.current.style.height = "44px";
		}
		await send(text);
	};

	const handleConfirmed = () => {
		router.push(`/${locale}/dashboard/consultant/onboard`);
	};

	// Loading state
	if (project === undefined) {
		return <ProjectLoading />;
	}

	// Not found
	if (project === null) {
		return <ProjectNotFound />;
	}

	return (
		<div className={cn("flex h-[calc(100vh-8rem)] overflow-hidden")}>
			{/* ================================================================
			    RIGHT PANEL — chat interface (full width, no session sidebar)
			    ================================================================ */}
			<section
				className="flex-1 flex flex-col min-w-0 overflow-hidden"
				aria-label={t("title")}
			>
				{/* Header */}
				<div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-border shrink-0">
					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={() =>
								router.push(`/${locale}/dashboard/consultant/onboard`)
							}
							className="flex items-center justify-center min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm p-2"
							aria-label={t("back")}
						>
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.5"
								aria-hidden="true"
							>
								<path d="M19 12H5M12 5l-7 7 7 7" />
							</svg>
						</button>
						<div>
							<h1 className="font-heading text-sm font-semibold text-foreground tracking-[-0.03em]">
								{project.name}
							</h1>
							<p className="text-xs text-muted-foreground">
								{project.clientName}
							</p>
						</div>
					</div>

					{/* Status badge */}
					<span className="text-xs px-2.5 py-1 rounded-full border border-[oklch(0.62_0.18_240)]/50 text-[oklch(0.62_0.18_240)] uppercase tracking-wider">
						{project.sector}
					</span>
				</div>

				{/* Messages */}
				<ScrollArea className="flex-1">
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

				{/* Error display */}
				{error && (
					<div className="px-4 py-2 border-t border-border bg-[oklch(0.65_0.2_25)]/10">
						<p
							className="text-xs"
							style={{ color: "oklch(0.65 0.2 25)" }}
							role="alert"
						>
							{error.message}
						</p>
					</div>
				)}

				{/* Confirm config bar */}
				{activeSpec && !isStreaming && (
					<ConfirmConfigBar
						spec={activeSpec}
						projectId={projectId as Id<"consultantProjects">}
						onConfirmed={handleConfirmed}
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
						<textarea
							ref={textareaRef}
							value={input}
							onChange={(e) => {
								setInput(e.target.value);
								e.target.style.height = "auto";
								const newH = Math.min(Math.max(e.target.scrollHeight, 44), 160);
								e.target.style.height = `${newH}px`;
							}}
							onKeyDown={handleKeyDown}
							placeholder={t("chatPlaceholder")}
							disabled={isStreaming || !apiUrl}
							rows={1}
							className={cn(
								"flex-1 resize-none min-h-[44px] max-h-[160px]",
								"bg-muted/50 border border-border rounded-sm",
								"text-sm text-foreground placeholder:text-muted-foreground",
								"px-3 py-2.5",
								"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
								"transition-colors duration-150",
							)}
							aria-label={t("chatPlaceholder")}
						/>
						<button
							type="submit"
							disabled={!input.trim() || isStreaming || !apiUrl}
							className={cn(
								"btn-shadow active-scale rounded-full shrink-0 h-11 px-5 font-medium text-sm",
								"bg-primary text-primary-foreground hover:bg-primary/90",
								"disabled:opacity-50 disabled:pointer-events-none",
								"transition-[box-shadow,transform,opacity] duration-150",
								"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
							)}
							style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
							aria-label={t("send")}
						>
							{isStreaming ? t("thinking") : t("send")}
						</button>
					</form>
				</div>
			</section>
		</div>
	);
}
