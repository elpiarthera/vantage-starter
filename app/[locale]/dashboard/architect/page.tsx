"use client";

import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ChatInterface } from "./_components/chat-interface";
import { SessionList } from "./_components/session-list";

// ============================================================================
// LOADING / EMPTY STATES
// ============================================================================

function WorkspaceLoading() {
	return (
		<div className="flex items-center justify-center h-full">
			<div className="space-y-2 w-48">
				<div className="h-2.5 bg-muted animate-pulse rounded-sm" />
				<div className="h-2.5 bg-muted animate-pulse w-3/4 rounded-sm" />
			</div>
		</div>
	);
}

function NoWorkspace() {
	const t = useTranslations("architect");
	return (
		<div className="flex items-center justify-center h-full px-4">
			<div className="flex flex-col items-center gap-4 text-center max-w-xs">
				<div className="icon-container" aria-hidden="true">
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
						className="text-muted-foreground"
						aria-hidden="true"
					>
						<path d="M12 2L2 7l10 5 10-5-10-5z" />
						<path d="M2 17l10 5 10-5" />
						<path d="M2 12l10 5 10-5" />
					</svg>
				</div>
				<div className="space-y-1">
					<p className="text-sm font-medium text-foreground tracking-[-0.015em]">
						{t("no_workspace_found")}
					</p>
					<p className="text-xs text-muted-foreground leading-relaxed">
						{t("create_workspace_to_use_architect")}
					</p>
				</div>
			</div>
		</div>
	);
}

function EmptyState({ onNew }: { onNew: () => void }) {
	const t = useTranslations("architect");
	return (
		<div className="flex items-center justify-center h-full">
			<div className="flex flex-col items-center gap-4 text-center max-w-xs mx-auto py-12">
				<div className="icon-container" aria-hidden="true">
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
						className="text-muted-foreground"
						aria-hidden="true"
					>
						<path d="M12 2L2 7l10 5 10-5-10-5z" />
						<path d="M2 17l10 5 10-5" />
						<path d="M2 12l10 5 10-5" />
					</svg>
				</div>
				<div className="space-y-1">
					<h2 className="font-heading text-sm font-semibold text-foreground tracking-[-0.03em]">
						Architect
					</h2>
					<p className="text-sm text-muted-foreground leading-relaxed">
						{t("describe_what_you_want_to_accomplish")}.{" "}
						{t("ai_will_design_workforce")}
					</p>
				</div>
				<button
					type="button"
					onClick={onNew}
					className="btn-shadow rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					aria-label={t("start_new_planning_session_aria")}
				>
					{t("start_planning")}
				</button>
			</div>
		</div>
	);
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ArchitectPage() {
	const t = useTranslations("architect");
	const router = useRouter();
	const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

	const workspaces = useQuery(api.workspaces.list);
	const workspaceId = workspaces?.[0]?._id;

	const createSession = useMutation(api.architectSessions.create);

	const handleNewSession = async () => {
		if (!workspaceId) return;
		try {
			const sessionId = await createSession({ workspaceId });
			setActiveSessionId(sessionId);
		} catch (err) {
			console.error("[architect] Failed to create session:", err);
		}
	};

	const handlePlanConfirmed = (missionId: Id<"missions">) => {
		router.push(`/dashboard/missions/${missionId}`);
	};

	if (workspaces === undefined) {
		return (
			<div className="h-full">
				<WorkspaceLoading />
			</div>
		);
	}

	if (!workspaceId) {
		return (
			<div className="h-full">
				<NoWorkspace />
			</div>
		);
	}

	return (
		<div className="flex flex-col h-[calc(100vh-8rem)] overflow-hidden">
			{/* Page header — always visible */}
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
					<div>
						<h1 className="text-base font-semibold text-foreground">
							Architect
						</h1>
						<p className="text-xs text-muted-foreground">
							{t("describe_what_you_want_to_build")}
						</p>
					</div>

					{/* New session action */}
					<button
						type="button"
						onClick={handleNewSession}
						className="ml-auto text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
					>
						{t("new_session")}
					</button>
				</div>
			</div>

			{/* Main content */}
			<div className="flex-1 overflow-hidden">
				{activeSessionId ? (
					<ChatInterface
						sessionId={activeSessionId as Id<"architectSessions">}
						workspaceId={workspaceId}
						onPlanConfirmed={handlePlanConfirmed}
					/>
				) : (
					<div className="h-full overflow-y-auto">
						<div className="max-w-2xl mx-auto p-6 md:p-8 space-y-8">
							<SessionList
								workspaceId={workspaceId}
								activeSessionId={activeSessionId}
								onSessionSelect={setActiveSessionId}
								onNewSession={handleNewSession}
							/>
							<EmptyState onNew={handleNewSession} />
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
