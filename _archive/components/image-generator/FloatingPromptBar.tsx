"use client";

import { SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { Button } from "@/components/ui/button";
import { PromptPillBar } from "./PromptPillBar";
import type { ModelSchema } from "./types/schema";

interface FloatingPromptBarProps {
	prompt: string;
	onPromptChange: (prompt: string) => void;
	onGenerate: () => void;
	creditCost: number;
	canGenerate: boolean;
	isLoading?: boolean;
	/** Sprint 30e.1: Schema for inline pills */
	schema?: ModelSchema | null;
	/** Sprint 30e.1: Current params for pills */
	params?: Record<string, unknown>;
	/** Sprint 30e.1: Callback to update params */
	onParamChange?: (key: string, value: unknown) => void;
	/** Sprint 30e.1: Opens model selector */
	onModelSelectorOpen?: () => void;
	/** Sprint 30e.1: Current mode */
	mode?: "generate" | "edit";
	/** Sprint 30e.1: Show inline pills (default: true) */
	showPills?: boolean;
}

export function FloatingPromptBar({
	prompt,
	onPromptChange,
	onGenerate,
	creditCost,
	canGenerate,
	isLoading = false,
	schema,
	params = {},
	onParamChange,
	onModelSelectorOpen,
	mode = "generate",
	showPills = true,
}: FloatingPromptBarProps) {
	const t = useTranslations("image_generator");
	const PROMPT_MAX = 2500;
	const WARN_AT = 2000;
	const [showCharCounter, setShowCharCounter] = useState(false);

	const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const newPrompt = e.target.value;
		onPromptChange(newPrompt);
		setShowCharCounter(newPrompt.length > WARN_AT);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
			e.preventDefault();
			onGenerate();
		}
	};

	// Show pills only if all required props are provided
	const canShowPills =
		showPills && schema && onParamChange && onModelSelectorOpen;

	return (
		<div className="fixed bottom-6 left-1/2 z-40 w-[90%] max-w-3xl -translate-x-1/2 pb-[env(safe-area-inset-bottom)]">
			<div className="flex flex-col gap-2 rounded-2xl border border-border/50 bg-background/60 p-3 shadow-lg backdrop-blur-md focus-within:border-primary/70 focus-within:ring-1 focus-within:ring-primary/30">
				{/* Sprint 30e.1: Inline Pills Row */}
				{canShowPills && (
					<PromptPillBar
						schema={schema}
						params={params}
						onParamChange={onParamChange}
						onModelSelectorOpen={onModelSelectorOpen}
						mode={mode}
						disabled={isLoading}
					/>
				)}

				{/* Prompt Input Row */}
				<div className="relative flex items-end gap-3">
					<TextareaAutosize
						value={prompt}
						onChange={handlePromptChange}
						onKeyDown={handleKeyDown}
						placeholder={t("floating_prompt_placeholder")}
						aria-label={t("floating_prompt_placeholder")}
						maxLength={PROMPT_MAX}
						className="min-h-[44px] max-h-[40vh] flex-1 resize-none border-none bg-transparent p-2 text-base leading-relaxed focus:outline-none"
						minRows={1}
						maxRows={10}
						disabled={isLoading}
					/>

					<Button
						type="button"
						onClick={onGenerate}
						disabled={!canGenerate || isLoading}
						aria-label={isLoading ? t("generating") : t("run")}
						className="flex min-h-[44px] min-w-[44px] flex-shrink-0 items-center gap-1 rounded-lg px-3 active:scale-95 transition-smooth"
					>
						{isLoading ? (
							<div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
						) : (
							<SparklesIcon className="size-4" aria-hidden="true" />
						)}
						<span className="sr-only">
							{t("generate_with_cost", { cost: creditCost })}
						</span>
						<span className="text-xs opacity-70" data-testid="credit-cost">
							{creditCost}c
						</span>
					</Button>

					{showCharCounter && (
						<div className="absolute bottom-2 right-16 text-xs text-muted-foreground">
							{t("prompt_characters", {
								count: prompt.length,
								max: PROMPT_MAX,
							})}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
