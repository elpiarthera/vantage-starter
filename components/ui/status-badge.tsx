/**
 * Adapted from mcpcn (https://www.mcpcn.dev) — MIT License.
 * The upstream source ships no license header of its own; this attribution
 * notice is added here per this repo's licensing policy, it is not a
 * preserved original notice.
 *
 * Ported for VantageStarter: the upstream `apps-sdk.css` theme is NOT
 * adopted (it defines its own token set that would conflict with this
 * repo's OKLCH tokens). Every class below is mapped onto tokens already
 * defined in `app/globals.css` (`--success`, `--warning`, `--destructive`,
 * `--muted`, `--border`, `--foreground`, `--background`). The
 * `data-apps-sdk-status` attribute (which only had meaning paired with the
 * un-adopted stylesheet) has been removed.
 */
"use client";

import {
	AlertCircle,
	Check,
	Clock,
	Loader2,
	Truck,
	XCircle,
} from "lucide-react";
import type { ComponentProps, ElementType } from "react";
import { createContext, useContext } from "react";

import { cn } from "@/lib/utils";

export type StatusType =
	| "success"
	| "pending"
	| "processing"
	| "warning"
	| "error"
	| "shipped"
	| "delivered"
	| "cancelled";

interface StatusConfig {
	className: string;
	defaultLabel: string;
	icon: ElementType;
}

const STATUS_CONFIG: Record<StatusType, StatusConfig> = {
	cancelled: {
		className: "border-border bg-muted text-muted-foreground",
		defaultLabel: "Cancelled",
		icon: XCircle,
	},
	delivered: {
		className: "border-foreground bg-foreground text-background",
		defaultLabel: "Delivered",
		icon: Check,
	},
	error: {
		className: "border-destructive/20 bg-destructive/10 text-destructive",
		defaultLabel: "Error",
		icon: XCircle,
	},
	pending: {
		className: "border-border bg-muted text-muted-foreground",
		defaultLabel: "Pending",
		icon: Clock,
	},
	processing: {
		className: "border-warning/20 bg-warning/10 text-warning",
		defaultLabel: "Processing",
		icon: Loader2,
	},
	shipped: {
		className: "border-border bg-muted text-foreground",
		defaultLabel: "Shipped",
		icon: Truck,
	},
	success: {
		className: "border-success/20 bg-success/10 text-success",
		defaultLabel: "Success",
		icon: Check,
	},
	warning: {
		className: "border-warning/20 bg-warning/10 text-warning",
		defaultLabel: "Warning",
		icon: AlertCircle,
	},
};

const SIZE_CLASSES = {
	lg: "gap-2 px-3 py-1.5 text-sm",
	md: "gap-1.5 px-2.5 py-1 text-sm",
	sm: "gap-1 px-2 py-0.5 text-xs",
};

const ICON_SIZES = {
	lg: "size-4",
	md: "size-3.5",
	sm: "size-3",
};

interface StatusBadgeContextValue {
	config: StatusConfig;
	label: string;
	size: keyof typeof SIZE_CLASSES;
	status: StatusType;
}

const StatusBadgeContext = createContext<StatusBadgeContextValue | null>(null);

export const useStatusBadge = () => {
	const context = useContext(StatusBadgeContext);

	if (!context) {
		throw new Error("StatusBadge components must be used within StatusBadge");
	}

	return context;
};

export interface StatusBadgeProps extends ComponentProps<"span"> {
	appearance?: {
		label?: string;
		size?: "sm" | "md" | "lg";
	};
	data?: {
		status?: StatusType;
	};
}

export const StatusBadgeIcon = ({
	className,
	...props
}: ComponentProps<"svg">) => {
	const { config, size, status } = useStatusBadge();
	const Icon = config.icon;

	return (
		<Icon
			className={cn(
				ICON_SIZES[size],
				status === "processing" && "animate-spin",
				className,
			)}
			{...props}
		/>
	);
};

export const StatusBadgeLabel = ({
	children,
	...props
}: ComponentProps<"span">) => {
	const { label } = useStatusBadge();

	return <span {...props}>{children ?? label}</span>;
};

const StatusBadgeRoot = ({
	appearance,
	children,
	className,
	data,
	...props
}: StatusBadgeProps & { children: React.ReactNode }) => {
	const status = data?.status ?? "processing";
	const config = STATUS_CONFIG[status];
	const size = appearance?.size ?? "md";
	const context: StatusBadgeContextValue = {
		config,
		label: appearance?.label ?? config.defaultLabel,
		size,
		status,
	};

	return (
		<StatusBadgeContext.Provider value={context}>
			<span
				data-slot="status-badge"
				className={cn(
					"inline-flex items-center rounded-full border font-medium",
					config.className,
					SIZE_CLASSES[size],
					className,
				)}
				{...props}
			>
				{children}
			</span>
		</StatusBadgeContext.Provider>
	);
};

export const StatusBadge = StatusBadgeRoot;
