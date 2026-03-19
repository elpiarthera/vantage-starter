"use client";

import { AlertCircle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { SceneStatus } from "./types/schema";

interface SceneStatusBadgeProps {
	status: SceneStatus;
	className?: string;
}

const STATUS_CONFIG = {
	idle: { labelKey: null, Icon: null, className: "" },
	queued: {
		labelKey: "queued" as const,
		Icon: Clock,
		className: "bg-warning/10 text-warning border-warning/30",
	},
	generating: {
		labelKey: "generating" as const,
		Icon: Loader2,
		className: "bg-primary/10 text-primary border-primary/30",
		spin: true,
	},
	complete: {
		labelKey: "complete" as const,
		Icon: CheckCircle2,
		className: "bg-success/10 text-success border-success/30",
	},
	error: {
		labelKey: "error" as const,
		Icon: AlertCircle,
		className: "bg-destructive/10 text-destructive border-destructive/30",
	},
} as const;

export function SceneStatusBadge({ status, className }: SceneStatusBadgeProps) {
	const t = useTranslations("storyboard");
	const config = STATUS_CONFIG[status];

	if (!config.labelKey || !config.Icon) return null;

	const { Icon, spin } = config as { Icon: typeof Clock; spin?: boolean };

	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
				config.className,
				className,
			)}
		>
			<Icon
				className={cn("size-3", spin && "animate-spin")}
				aria-hidden="true"
			/>
			{t(config.labelKey)}
		</span>
	);
}
