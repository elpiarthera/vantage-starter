"use client";

import { cn } from "@/lib/utils";

export type ToolCallState = "streaming" | "call" | "result" | "partial-call";

interface ToolCallIndicatorProps {
	toolName: string;
	state: ToolCallState;
	className?: string;
}

const TOOL_LABELS: Record<string, { active: string; done: string }> = {
	searchKB: {
		active: "Searching knowledge base...",
		done: "Knowledge base searched",
	},
	searchUserData: {
		active: "Searching your data...",
		done: "Data retrieved",
	},
	memory: {
		active: "Accessing memory...",
		done: "Memory updated",
	},
	analyzeData: {
		active: "Analyzing data...",
		done: "Analysis complete",
	},
	browseWeb: {
		active: "Browsing the web...",
		done: "Web results ready",
	},
	generateReport: {
		active: "Generating report...",
		done: "Report generated",
	},
};

function getToolLabel(toolName: string, isActive: boolean): string {
	const label = TOOL_LABELS[toolName];
	if (label) return isActive ? label.active : label.done;
	// Fallback: convert camelCase to readable label
	const readable = toolName
		.replace(/([A-Z])/g, " $1")
		.toLowerCase()
		.trim();
	return isActive ? `Using ${readable}...` : `${readable} complete`;
}

export function ToolCallIndicator({
	toolName,
	state,
	className,
}: ToolCallIndicatorProps) {
	const isActive =
		state === "streaming" || state === "call" || state === "partial-call";
	const isDone = state === "result";

	return (
		<output
			aria-label={getToolLabel(toolName, isActive)}
			className={cn(
				"flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium w-fit",
				isActive &&
					"bg-[oklch(0.62_0.16_44_/_0.12)] text-[oklch(0.52_0.16_44)]",
				isDone && "bg-muted text-muted-foreground",
				className,
			)}
		>
			{/* Spinner or checkmark */}
			{isActive ? (
				<span
					className="size-3 rounded-full border-2 border-[oklch(0.62_0.16_44)] border-t-transparent animate-spin shrink-0"
					aria-hidden="true"
				/>
			) : (
				<svg
					className="size-3 shrink-0"
					viewBox="0 0 12 12"
					fill="none"
					aria-hidden="true"
				>
					<path
						d="M2 6l3 3 5-5"
						stroke="currentColor"
						strokeWidth="1.5"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			)}
			<span>{getToolLabel(toolName, isActive)}</span>
		</output>
	);
}
