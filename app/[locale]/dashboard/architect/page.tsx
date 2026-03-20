"use client";

import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
				<div className="h-3 bg-[oklch(0.17_0.01_240)] animate-pulse" />
				<div className="h-3 bg-[oklch(0.17_0.01_240)] animate-pulse w-3/4" />
			</div>
		</div>
	);
}

function NoWorkspace() {
	return (
		<div className="flex items-center justify-center h-full px-4">
			<div className="text-center max-w-sm">
				<p className="text-sm font-medium text-[oklch(0.93_0.01_240)] mb-1">
					No workspace found
				</p>
				<p className="text-xs text-[oklch(0.65_0.01_240)] leading-relaxed">
					Create a workspace to use the Architect.
				</p>
			</div>
		</div>
	);
}

function NoSessionSelected({ onNew }: { onNew: () => void }) {
	return (
		<div className="flex flex-col items-center justify-center h-full px-6 text-center">
			<div className="max-w-sm">
				<div
					className="w-12 h-12 border border-border flex items-center justify-center mx-auto mb-6"
					aria-hidden="true"
				>
					<svg
						width="20"
						height="20"
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

				<h2 className="font-space-grotesk text-base font-semibold text-[oklch(0.93_0.01_240)] mb-2">
					Architect
				</h2>
				<p className="text-sm text-[oklch(0.65_0.01_240)] leading-relaxed mb-6">
					Describe what you want to accomplish. I'll design an agent workforce
					and execution plan.
				</p>

				<Button
					onClick={onNew}
					className="rounded-full px-8 font-medium"
					aria-label="Start a new planning session"
				>
					Start planning
				</Button>
			</div>
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

	// Resolve workspace
	const workspaces = useQuery(api.workspaces.list);
	const workspaceId = workspaces?.[0]?._id;

	const createSession = useMutation(api.architectSessions.create);

	const handleNewSession = async () => {
		if (!workspaceId) return;
		try {
			const sessionId = await createSession({ workspaceId });
			setActiveSessionId(sessionId);
			setSidebarOpen(false); // Close sidebar on mobile after starting session
		} catch (err) {
			console.error("[architect] Failed to create session:", err);
		}
	};

	const handlePlanConfirmed = (missionId: Id<"missions">) => {
		// Navigate to mission board after confirmation
		router.push(`/dashboard/missions/${missionId}`);
	};

	// Loading state
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
					"shrink-0 border-r border-border bg-[oklch(0.13_0.01_240)]",
					// Desktop: static sidebar
					"hidden md:flex md:flex-col md:w-64",
				)}
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
					"fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-[oklch(0.13_0.01_240)]",
					"flex flex-col md:hidden",
					"transition-transform duration-200 ease-out",
					sidebarOpen ? "translate-x-0" : "-translate-x-full",
				)}
				aria-label="Session history"
				aria-hidden={!sidebarOpen}
			>
				{/* Mobile close button */}
				<div className="flex items-center justify-between px-4 py-3 border-b border-border">
					<span className="text-xs font-medium text-[oklch(0.65_0.01_240)] uppercase tracking-wider">
						Sessions
					</span>
					<button
						type="button"
						onClick={() => setSidebarOpen(false)}
						className="text-[oklch(0.65_0.01_240)] hover:text-[oklch(0.93_0.01_240)] transition-colors p-1"
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
						className="text-[oklch(0.65_0.01_240)] hover:text-[oklch(0.93_0.01_240)] transition-colors"
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
					<h1 className="font-space-grotesk text-sm font-semibold text-[oklch(0.93_0.01_240)]">
						Architect
					</h1>
				</div>

				{/* Desktop page header */}
				<div className="hidden md:flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
					<h1 className="font-space-grotesk text-sm font-semibold text-[oklch(0.93_0.01_240)]">
						Architect
					</h1>
					{activeSessionId && (
						<Button
							onClick={handleNewSession}
							variant="outline"
							size="sm"
							className="rounded-full text-xs h-7"
						>
							New session
						</Button>
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
