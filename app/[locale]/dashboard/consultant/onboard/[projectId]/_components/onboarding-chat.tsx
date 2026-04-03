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
import { JSONUIProvider, Renderer, useChatUI } from "@json-render/react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
	generateConfig,
	type OnboardingConfigSpec,
	type SelectedAgent,
	type SelectedSkill,
	type SelectedTeam,
} from "@/lib/consultant/config-generator";
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
	thinkingLabel = "Thinking",
}: {
	text: string;
	spec: Spec | null;
	isStreaming?: boolean;
	thinkingLabel?: string;
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
					<JSONUIProvider registry={vantageOSRegistry}>
						<Renderer
							spec={spec}
							registry={vantageOSRegistry}
							loading={isStreaming}
						/>
					</JSONUIProvider>
				)}
				{!text && !spec && isStreaming && (
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<output className="sr-only">{thinkingLabel}</output>
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
	projectName,
	clientName,
	sector,
	onConfirmed,
}: {
	spec: Spec;
	projectId: Id<"consultantProjects">;
	projectName: string;
	clientName: string;
	sector: string;
	onConfirmed: () => void;
}) {
	const t = useTranslations("consultant");
	const [isConfirming, setIsConfirming] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const updateProject = useMutation(api.consultantProjects.update);
	const updateStatus = useMutation(api.consultantProjects.updateStatus);

	/**
	 * Extract the full OnboardingConfigSpec from the json-render spec tree.
	 * Walks OnboardingConfig → TeamSelection → AgentSelection → SkillSelection.
	 */
	const extractConfigSpec = useCallback((): {
		configSpec: OnboardingConfigSpec;
		selectedTeamIds: string[];
		selectedAgentIds: string[];
		selectedSkillIds: string[];
	} | null => {
		if (!spec?.elements || !spec.root) return null;

		const root = spec.elements[spec.root as string];
		if (!root || root.type !== "OnboardingConfig") return null;

		const rootProps = root.props as Record<string, unknown>;
		const summary =
			typeof rootProps.summary === "string" ? rootProps.summary : "";
		const painPoints = Array.isArray(rootProps.painPoints)
			? (rootProps.painPoints as string[])
			: [];

		const teams: SelectedTeam[] = [];
		const selectedTeamIds: string[] = [];
		const selectedAgentIds: string[] = [];
		const selectedSkillIds: string[] = [];

		for (const childId of root.children ?? []) {
			const teamEl = spec.elements[childId as string];
			if (!teamEl || teamEl.type !== "TeamSelection") continue;

			const tp = teamEl.props as Record<string, unknown>;
			const teamId =
				typeof tp.teamId === "string" ? tp.teamId : String(childId);
			const isTeamSelected = Boolean(tp.selected);

			const agents: SelectedAgent[] = [];
			const teamSkills: SelectedSkill[] = [];

			for (const agentChildId of teamEl.children ?? []) {
				const agentEl = spec.elements[agentChildId as string];
				if (!agentEl || agentEl.type !== "AgentSelection") continue;

				const ap = agentEl.props as Record<string, unknown>;
				const agentId =
					typeof ap.agentId === "string" ? ap.agentId : String(agentChildId);
				const isAgentSelected = Boolean(ap.selected);

				const agentSkillIds: string[] = Array.isArray(ap.skills)
					? (ap.skills as string[])
					: [];

				// Collect skill definitions from agent's children
				for (const skillChildId of agentEl.children ?? []) {
					const skillEl = spec.elements[skillChildId as string];
					if (!skillEl || skillEl.type !== "SkillSelection") continue;

					const sp = skillEl.props as Record<string, unknown>;
					const skillId =
						typeof sp.skillId === "string" ? sp.skillId : String(skillChildId);
					const isSkillSelected = Boolean(sp.selected);

					const skill: SelectedSkill = {
						skillId,
						name: typeof sp.name === "string" ? sp.name : skillId,
						description:
							typeof sp.description === "string" ? sp.description : "",
						category: typeof sp.category === "string" ? sp.category : "",
						selected: isSkillSelected,
					};

					// Add to teamSkills (deduplicated later by generateConfig)
					if (!teamSkills.some((s) => s.skillId === skillId)) {
						teamSkills.push(skill);
					}

					if (isSkillSelected) {
						selectedSkillIds.push(skillId);
					}
				}

				const agent: SelectedAgent = {
					agentId,
					name: typeof ap.name === "string" ? ap.name : agentId,
					role: typeof ap.role === "string" ? ap.role : "",
					description: typeof ap.description === "string" ? ap.description : "",
					skills: agentSkillIds,
					teamId,
					selected: isAgentSelected,
				};

				agents.push(agent);
				if (isAgentSelected) {
					selectedAgentIds.push(agentId);
				}
			}

			const team: SelectedTeam = {
				teamId,
				name: typeof tp.name === "string" ? tp.name : teamId,
				description: typeof tp.description === "string" ? tp.description : "",
				category: typeof tp.category === "string" ? tp.category : "",
				agentCount:
					typeof tp.agentCount === "number" ? tp.agentCount : agents.length,
				selected: isTeamSelected,
				matchedPains: Array.isArray(tp.matchedPains)
					? (tp.matchedPains as string[])
					: undefined,
				agents,
				skills: teamSkills,
			};

			teams.push(team);
			if (isTeamSelected) {
				selectedTeamIds.push(teamId);
			}
		}

		const configSpec: OnboardingConfigSpec = {
			projectName,
			clientName,
			sector,
			summary,
			painPoints,
			teams,
		};

		return { configSpec, selectedTeamIds, selectedAgentIds, selectedSkillIds };
	}, [spec, projectName, clientName, sector]);

	const handleDownload = useCallback(() => {
		const extracted = extractConfigSpec();
		if (!extracted) return;

		setIsDownloading(true);
		try {
			const generated = generateConfig(extracted.configSpec);
			const payload = JSON.stringify(
				{
					generatedAt: new Date().toISOString(),
					summary: generated.summary,
					stats: {
						teamCount: generated.teamCount,
						agentCount: generated.agentCount,
						skillCount: generated.skillCount,
					},
					files: generated.files,
				},
				null,
				2,
			);
			const blob = new Blob([payload], { type: "application/json" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${projectName.replace(/\s+/g, "-").toLowerCase()}-config.json`;
			a.click();
			URL.revokeObjectURL(url);
		} finally {
			setIsDownloading(false);
		}
	}, [extractConfigSpec, projectName]);

	const handleConfirm = async () => {
		const extracted = extractConfigSpec();
		if (!extracted) {
			setError(t("configExtractError"));
			return;
		}

		setIsConfirming(true);
		setError(null);

		try {
			await updateProject({
				projectId,
				config: spec,
				selectedTeams: extracted.selectedTeamIds,
				selectedAgents: extracted.selectedAgentIds,
				selectedSkills: extracted.selectedSkillIds,
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
		<div className="border-t border-border py-3 bg-muted/30">
			<div className="flex items-center justify-between gap-4 px-4 md:px-6 max-w-3xl mx-auto">
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
				<div className="flex items-center gap-2 shrink-0">
					<button
						type="button"
						onClick={handleDownload}
						disabled={isDownloading || isConfirming}
						className="rounded-full h-11 px-4 text-sm font-medium border border-border bg-transparent text-foreground hover:bg-muted disabled:opacity-50 disabled:pointer-events-none transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-2"
						aria-label={t("downloadConfig")}
					>
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
							aria-hidden="true"
						>
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
							<polyline points="7 10 12 15 17 10" />
							<line x1="12" y1="15" x2="12" y2="3" />
						</svg>
						{isDownloading ? t("downloading") : t("downloadConfig")}
					</button>
					<button
						type="button"
						onClick={handleConfirm}
						disabled={isConfirming || isDownloading}
						className="btn-shadow active-scale rounded-full h-11 px-5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						aria-label={t("deployConfig")}
					>
						{isConfirming ? t("saving") : t("deployConfig")}
					</button>
				</div>
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
		<div className="flex flex-col flex-1 min-h-0 overflow-hidden">
			{/* ================================================================
			    RIGHT PANEL — chat interface (full width, no session sidebar)
			    ================================================================ */}
			<section
				className="flex-1 flex flex-col min-w-0 overflow-hidden"
				aria-label={t("title")}
			>
				{/* Header */}
				<div className="border-b border-border shrink-0">
					<div className="flex items-center justify-between px-4 md:px-6 py-4 max-w-3xl mx-auto">
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
										thinkingLabel={t("thinking")}
									/>
								)}
							</div>
						))}

						{isStreaming && messages.length === 0 && (
							<AssistantBubble
								text=""
								spec={null}
								isStreaming
								thinkingLabel={t("thinking")}
							/>
						)}

						<div ref={sentinelRef} aria-hidden="true" />
					</div>
				</ScrollArea>

				{/* Error display */}
				{error && (
					<div className="py-2 border-t border-border bg-[oklch(0.65_0.2_25)]/10">
						<p
							className="text-xs px-4 md:px-6 max-w-3xl mx-auto"
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
						projectName={project.name}
						clientName={project.clientName}
						sector={project.sector}
						onConfirmed={handleConfirmed}
					/>
				)}

				{/* Input */}
				<div className="border-t border-border py-4">
					<form
						onSubmit={(e) => {
							e.preventDefault();
							submitMessage();
						}}
						className="flex items-end gap-3 px-4 md:px-6 max-w-3xl mx-auto"
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
