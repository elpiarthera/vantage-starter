"use client";

import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import TextareaAutosize from "react-textarea-autosize";
import { Button } from "@/components/ui/button";

interface FloatingPromptBarProps {
	prompt: string;
	onPromptChange: (prompt: string) => void;
	onGenerate: () => void;
	creditCost: number;
	canGenerate: boolean;
	isLoading?: boolean;
	/** Per-model character limit from schema.maxPromptLength. Defaults to 10 000. */
	maxPromptLength?: number;
}

export function FloatingPromptBar({
	prompt,
	onPromptChange,
	onGenerate,
	creditCost,
	canGenerate,
	isLoading = false,
	maxPromptLength = 10_000,
}: FloatingPromptBarProps) {
	const t = useTranslations("voice_generator");

	return (
		<div className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-1/2 z-40 w-[90%] max-w-3xl -translate-x-1/2">
			<div className="flex flex-col gap-2 rounded-xl border border-border/50 bg-background/60 p-3 shadow-lg backdrop-blur-md">
				<div className="relative flex items-end gap-3">
					<TextareaAutosize
						value={prompt}
						onChange={(e) => onPromptChange(e.target.value)}
						placeholder={t("floating_prompt_placeholder")}
						maxLength={maxPromptLength}
						aria-label={t("floating_prompt_aria_label")}
						className="min-h-[44px] max-h-[40vh] flex-1 resize-none border-none bg-transparent p-2 text-base leading-relaxed focus:outline-none focus:ring-0"
						minRows={1}
						maxRows={10}
						disabled={isLoading}
					/>
					<Button
						type="button"
						onClick={onGenerate}
						disabled={!canGenerate || isLoading}
						aria-label={
							isLoading
								? t("generating")
								: t("generate_with_cost", { cost: creditCost })
						}
						className="flex min-h-[44px] min-w-[44px] flex-shrink-0 items-center gap-1.5 rounded-lg px-3 transition-smooth active:scale-95"
					>
						{isLoading ? (
							<div
								aria-hidden="true"
								className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
							/>
						) : (
							<Sparkles className="size-4" />
						)}
						<span className="text-xs opacity-70" aria-hidden="true">
							{t("credit_count", { count: creditCost })}
						</span>
					</Button>
				</div>
			</div>
		</div>
	);
}
