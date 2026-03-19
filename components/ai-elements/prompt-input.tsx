"use client";

import { Send } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const PromptInput = React.forwardRef<
	HTMLFormElement,
	React.FormHTMLAttributes<HTMLFormElement>
>(({ className, ...props }, ref) => (
	<form
		ref={ref}
		className={cn("border rounded-lg p-3 max-w-[80%]", className)}
		style={{ backgroundColor: "#223649", borderColor: "#314d68" }}
		{...props}
	/>
));
PromptInput.displayName = "PromptInput";

const PromptInputTextarea = React.forwardRef<
	HTMLTextAreaElement,
	React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
	<Textarea
		ref={ref}
		className={cn(
			"border-none bg-transparent text-white resize-none focus:ring-0 focus:outline-none",
			className,
		)}
		rows={1}
		{...props}
	/>
));
PromptInputTextarea.displayName = "PromptInputTextarea";

const PromptInputToolbar = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("flex items-center justify-between mt-2", className)}
		{...props}
	/>
));
PromptInputToolbar.displayName = "PromptInputToolbar";

const PromptInputTools = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("flex items-center gap-2", className)}
		{...props}
	/>
));
PromptInputTools.displayName = "PromptInputTools";

const PromptInputButton = React.forwardRef<
	HTMLButtonElement,
	React.ButtonHTMLAttributes<HTMLButtonElement> & {
		variant?: "default" | "ghost";
	}
>(({ className, variant = "ghost", ...props }, ref) => (
	<Button
		ref={ref}
		variant={variant === "ghost" ? "ghost" : "default"}
		size="sm"
		className={cn("text-white", className)}
		{...props}
	/>
));
PromptInputButton.displayName = "PromptInputButton";

const PromptInputSubmit = React.forwardRef<
	HTMLButtonElement,
	React.ButtonHTMLAttributes<HTMLButtonElement> & {
		status?: string;
	}
>(({ className, status, disabled, ...props }, ref) => (
	<Button
		ref={ref}
		type="submit"
		size="sm"
		disabled={disabled || status === "streaming"}
		className={cn("", className)}
		style={{ backgroundColor: "#0d7ff2" }}
		{...props}
	>
		<Send className="h-4 w-4" />
	</Button>
));
PromptInputSubmit.displayName = "PromptInputSubmit";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

// Placeholder components for model select
const PromptInputModelSelect = ({ children, ...props }: DivProps) => (
	<div {...props}>{children}</div>
);
const PromptInputModelSelectTrigger = ({ children, ...props }: DivProps) => (
	<div {...props}>{children}</div>
);
const PromptInputModelSelectValue = ({ children, ...props }: DivProps) => (
	<div {...props}>{children}</div>
);
const PromptInputModelSelectContent = ({ children, ...props }: DivProps) => (
	<div {...props}>{children}</div>
);
const PromptInputModelSelectItem = ({ children, ...props }: DivProps) => (
	<div {...props}>{children}</div>
);

export {
	PromptInput,
	PromptInputTextarea,
	PromptInputToolbar,
	PromptInputTools,
	PromptInputButton,
	PromptInputSubmit,
	PromptInputModelSelect,
	PromptInputModelSelectTrigger,
	PromptInputModelSelectValue,
	PromptInputModelSelectContent,
	PromptInputModelSelectItem,
};
