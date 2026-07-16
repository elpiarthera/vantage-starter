"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type ToolCallState = "streaming" | "call" | "result" | "partial-call";

interface ToolCallIndicatorProps {
	toolName: string;
	state: ToolCallState;
	className?: string;
}

const TOOL_LABEL_KEYS: Record<string, { active: string; done: string }> = {
	searchKB: {
		active: "tools.searchKB.active",
		done: "tools.searchKB.done",
	},
	searchUserData: {
		active: "tools.searchUserData.active",
		done: "tools.searchUserData.done",
	},
	memory: {
		active: "tools.memory.active",
		done: "tools.memory.done",
	},
	analyzeData: {
		active: "tools.analyzeData.active",
		done: "tools.analyzeData.done",
	},
	browseWeb: {
		active: "tools.browseWeb.active",
		done: "tools.browseWeb.done",
	},
	generateReport: {
		active: "tools.generateReport.active",
		done: "tools.generateReport.done",
	},
};

function useToolLabel(toolName: string, isActive: boolean): string {
	const t = useTranslations("chat");
	const keys = TOOL_LABEL_KEYS[toolName];
	if (keys) return isActive ? t(keys.active) : t(keys.done);
	// Fallback: convert camelCase to readable label, tool name is dynamic content
	const readable = toolName
		.replace(/([A-Z])/g, " $1")
		.toLowerCase()
		.trim();
	return isActive
		? t("tools.fallbackActive", { tool: readable })
		: t("tools.fallbackDone", { tool: readable });
}

export function ToolCallIndicator({
	toolName,
	state,
	className,
}: ToolCallIndicatorProps) {
	const isActive =
		state === "streaming" || state === "call" || state === "partial-call";
	const isDone = state === "result";
	const label = useToolLabel(toolName, isActive);

	return (
		<output
			aria-label={label}
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
			<span>{label}</span>
		</output>
	);
}
