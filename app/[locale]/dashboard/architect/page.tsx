"use client";

import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
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
						No workspace found
					</p>
					<p className="text-xs text-muted-foreground leading-relaxed">
						Create a workspace to use the Architect.
					</p>
				</div>
			</div>
		</div>
	);
}

function NoSessionSelected({ onNew }: { onNew: () => void }) {
	return (
		<div className="flex flex-col items-center justify-center h-full px-6 text-center gap-6">
			<div className="flex flex-col items-center gap-4 max-w-xs">
				<div className="icon-container" aria-hidden="true">
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
						className="text-[oklch(0.62_0.18_240)]"
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
						Describe what you want to accomplish. I&apos;ll design an agent
						workforce and execution plan.
					</p>
				</div>
			</div>
			<button
				type="button"
				onClick={onNew}
				className="btn-shadow active-scale rounded-full px-8 py-2 font-medium text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				aria-label="Start a new planning session"
			>
				Start planning
			</button>
		</div>
	);
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ArchitectPage() {
	const router = useRouter();
	const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
	const [sidebarOpen, setSidebarOpen] = useState(false);

	const workspaces = useQuery(api.workspaces.list);
	const workspaceId = workspaces?.[0]?._id;

	const createSession = useMutation(api.architectSessions.create);

	const handleNewSession = async () => {
		if (!workspaceId) return;
		try {
			const sessionId = await createSession({ workspaceId });
			setActiveSessionId(sessionId);
			setSidebarOpen(false);
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
		<div className={cn("flex h-[calc(100vh-8rem)] overflow-hidden")}>
			{/* ================================================================
			    LEFT SIDEBAR — session list
			    Desktop: always visible (w-64)
			    Mobile: slide-in drawer controlled by sidebarOpen
			    ================================================================ */}
			<aside
				className={cn(
					"shrink-0 border-r border-border",
					"hidden md:flex md:flex-col md:w-64",
				)}
				style={{ backgroundColor: "oklch(0.115 0.01 240)" }}
				aria-label="Session history"
			>
				<SessionList
					workspaceId={workspaceId}
					activeSessionId={activeSessionId}
					onSessionSelect={setActiveSessionId}
					onNewSession={handleNewSession}
				/>
			</aside>

			{/* Mobile sidebar overlay */}
			{sidebarOpen && (
				<div
					className="fixed inset-0 z-40 md:hidden"
					onClick={() => setSidebarOpen(false)}
					aria-hidden="true"
				>
					<div className="absolute inset-0 bg-black/60" />
				</div>
			)}

			<aside
				className={cn(
					"fixed inset-y-0 left-0 z-50 w-72 border-r border-border",
					"flex flex-col md:hidden",
					"transition-transform duration-300",
					sidebarOpen ? "translate-x-0" : "-translate-x-full",
				)}
				style={{
					backgroundColor: "oklch(0.115 0.01 240)",
					transitionTimingFunction: "var(--ease-out-expo)",
				}}
				aria-label="Session history"
				aria-hidden={!sidebarOpen}
			>
				{/* Mobile close button */}
				<div className="flex items-center justify-between px-4 py-3 border-b border-border">
					<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
						Sessions
					</span>
					<button
						type="button"
						onClick={() => setSidebarOpen(false)}
						className="text-muted-foreground hover:text-foreground transition-colors duration-150 p-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						aria-label="Close session list"
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
							<path d="M18 6L6 18M6 6l12 12" />
						</svg>
					</button>
				</div>
				<SessionList
					workspaceId={workspaceId}
					activeSessionId={activeSessionId}
					onSessionSelect={(id) => {
						setActiveSessionId(id);
						setSidebarOpen(false);
					}}
					onNewSession={handleNewSession}
				/>
			</aside>

			{/* ================================================================
			    RIGHT PANEL — chat interface
			    ================================================================ */}
			<section
				className="flex-1 flex flex-col min-w-0 overflow-hidden"
				aria-label="Architect chat"
			>
				{/* Mobile header with sidebar toggle */}
				<div className="flex items-center gap-3 px-4 py-3 border-b border-border md:hidden shrink-0">
					<button
						type="button"
						onClick={() => setSidebarOpen(true)}
						className="text-muted-foreground hover:text-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
						aria-label="Open session list"
					>
						<svg
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
							aria-hidden="true"
						>
							<path d="M3 6h18M3 12h18M3 18h18" />
						</svg>
					</button>
					<h1 className="font-heading text-sm font-semibold text-foreground tracking-[-0.03em]">
						Architect
					</h1>
				</div>

				{/* Desktop page header */}
				<div className="hidden md:flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
					<h1 className="font-heading text-sm font-semibold text-foreground tracking-[-0.03em]">
						Architect
					</h1>
					{activeSessionId && (
						<button
							type="button"
							onClick={handleNewSession}
							className="rounded-full text-xs h-7 px-3 border border-border bg-transparent text-foreground hover:bg-muted transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							New session
						</button>
					)}
				</div>

				{/* Chat or empty state */}
				<div className="flex-1 overflow-hidden">
					{activeSessionId ? (
						<ChatInterface
							sessionId={activeSessionId as Id<"architectSessions">}
							workspaceId={workspaceId}
							onPlanConfirmed={handlePlanConfirmed}
						/>
					) : (
						<NoSessionSelected onNew={handleNewSession} />
					)}
				</div>
			</section>
		</div>
	);
}
