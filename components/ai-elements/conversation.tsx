"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const Conversation = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div ref={ref} className={cn("flex flex-col h-full", className)} {...props} />
));
Conversation.displayName = "Conversation";

const ConversationContent = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("flex-1 overflow-y-auto p-4 space-y-4", className)}
		{...props}
	/>
));
ConversationContent.displayName = "ConversationContent";

const ConversationScrollButton = React.forwardRef<
	HTMLButtonElement,
	React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
	<button
		ref={ref}
		className={cn(
			"fixed bottom-20 right-4 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hidden md:block",
			className,
		)}
		{...props}
	>
		↓
	</button>
));
ConversationScrollButton.displayName = "ConversationScrollButton";

export { Conversation, ConversationContent, ConversationScrollButton };
