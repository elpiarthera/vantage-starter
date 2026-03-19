"use client";

import { AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastNotificationProps {
	message: string;
	type: "success" | "error";
}

export function ToastNotification({ message, type }: ToastNotificationProps) {
	return (
		<div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300 select-none">
			<div
				role="alert"
				aria-live={type === "error" ? "assertive" : "polite"}
				aria-atomic="true"
				className={cn(
					"rounded-lg bg-card backdrop-blur-sm border p-4 shadow-lg max-w-sm",
					type === "success" ? "border-primary/50" : "border-destructive/50",
				)}
			>
				<div className="flex items-center gap-3">
					{type === "success" ? (
						<CheckCircle
							className="w-5 h-5 text-primary flex-shrink-0"
							aria-hidden="true"
						/>
					) : (
						<AlertCircle
							className="w-5 h-5 text-destructive flex-shrink-0"
							aria-hidden="true"
						/>
					)}
					<p className="text-sm font-medium text-foreground">{message}</p>
				</div>
			</div>
		</div>
	);
}
