"use client";

import { MessageCircle } from "lucide-react";

interface AIAvatarDotsProps {
	variant?: "default" | "success";
	isAnswered?: boolean;
}

export function AIAvatarDots({
	variant = "default",
	isAnswered = false,
}: AIAvatarDotsProps) {
	if (isAnswered) {
		return (
			<div className="flex-none w-10 h-10 rounded-full bg-accent/50 flex items-center justify-center">
				<MessageCircle className="w-5 h-5 text-accent-foreground/70" />
			</div>
		);
	}

	const dotColor =
		variant === "success"
			? "bg-gradient-to-r from-emerald-400 to-emerald-200"
			: "bg-gradient-to-r from-white to-white/60";

	return (
		<div className="flex-none w-10 h-10 flex items-center justify-center gap-1.5">
			<div className={`w-2 h-2 rounded-full ${dotColor} animate-dot-pulse`} />
			<div
				className={`w-2 h-2 rounded-full ${dotColor} animate-dot-pulse-delay-1`}
			/>
			<div
				className={`w-2 h-2 rounded-full ${dotColor} animate-dot-pulse-delay-2`}
			/>
		</div>
	);
}
