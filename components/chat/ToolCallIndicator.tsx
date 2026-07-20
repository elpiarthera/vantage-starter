"use client";

import { useTranslations } from "next-intl";
import {
	StatusBadge,
	StatusBadgeIcon,
	StatusBadgeLabel,
} from "@/components/ui/status-badge";
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
	const label = useToolLabel(toolName, isActive);

	return (
		<output aria-label={label} className="contents">
			<StatusBadge
				data={{ status: isActive ? "processing" : "success" }}
				appearance={{ label, size: "md" }}
				className={cn("w-fit", className)}
			>
				<StatusBadgeIcon />
				<StatusBadgeLabel />
			</StatusBadge>
		</output>
	);
}
