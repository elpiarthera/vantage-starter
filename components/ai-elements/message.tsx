"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MessageProps {
	role: "user" | "assistant";
	children: ReactNode;
	className?: string;
}

export function Message({ role, children, className }: MessageProps) {
	return (
		<div
			className={cn(
				"flex",
				role === "user" ? "justify-end" : "justify-start",
				className,
			)}
		>
			<div
				className={cn(
					"max-w-[95%] md:max-w-[80%] rounded-lg p-4",
					role === "user"
						? "bg-[#0d7ff2] text-white"
						: "bg-[#223649] text-white border border-[#314d68]",
				)}
			>
				{children}
			</div>
		</div>
	);
}

interface MessageContentProps {
	children: ReactNode;
	className?: string;
}

export function MessageContent({ children, className }: MessageContentProps) {
	return (
		<div
			className={cn("whitespace-pre-wrap text-sm leading-relaxed", className)}
		>
			{children}
		</div>
	);
}
