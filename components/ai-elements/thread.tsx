"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ThreadProps {
	children: ReactNode;
	className?: string;
}

export function Thread({ children, className }: ThreadProps) {
	return (
		<div
			className={cn("flex-1 overflow-y-auto p-4 space-y-4 min-h-0", className)}
		>
			{children}
		</div>
	);
}
