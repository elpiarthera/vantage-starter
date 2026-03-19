"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { DynamicField } from "@/components/image-generator/DynamicField";
import type { ParamSchema } from "@/components/image-generator/types/schema";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { VoiceModelSchema } from "./hooks/use-convex-voice-schemas";

interface VoiceSettingsPanelProps {
	schema: VoiceModelSchema;
	params: Record<string, unknown>;
	onParamsChange: (params: Record<string, unknown>) => void;
	disabled?: boolean;
	/** When true, hides the prompt/text textarea (used inside FloatingOptionsPanel). */
	hidePrompt?: boolean;
}

export function VoiceSettingsPanel({
	schema,
	params,
	onParamsChange,
	disabled = false,
	hidePrompt = false,
}: VoiceSettingsPanelProps) {
	const t = useTranslations("voice_generator");
	const [advancedOpen, setAdvancedOpen] = useState(false);

	// Find the prompt/text parameter (different models use different keys)
	const promptParam = schema.params.find(
		(p) => p.key === "prompt" || p.key === "text",
	);
	const promptKey = promptParam?.key ?? "prompt";
	const promptValue = (params[promptKey] as string) ?? "";
	const maxLength = promptParam?.maxLength ?? schema.maxPromptLength ?? 10000;

	// Convert voice schema params to ParamSchema format
	const convertToParamSchema = (p: (typeof schema.params)[0]): ParamSchema => ({
		key: p.key,
		control: p.control as ParamSchema["control"],
		label: p.label,
		default: p.default,
		// Coerce numeric option values to strings for DynamicField compatibility
		options: p.options?.map((opt) => ({
			...opt,
			value: String(opt.value),
		})),
		min: p.min,
		max: p.max,
		step: p.step,
		maxLength: p.maxLength,
		advanced: p.advanced,
		showWhen: p.showWhen
			? { param: p.showWhen.param, value: p.showWhen.value }
			: undefined,
	});

	// Evaluate showWhen condition: return true if param should be rendered
	const shouldShowParam = (
		param: (typeof schema.params)[0],
		currentParams: Record<string, unknown>,
	): boolean => {
		if (!param.showWhen) return true;
		const dependencyValue = currentParams[param.showWhen.param];
		if (param.showWhen.value === "!empty" || param.showWhen.value === "") {
			return !!dependencyValue && dependencyValue !== "";
		}
		return dependencyValue === param.showWhen.value;
	};

	// All other parameters (non-prompt), filtered by showWhen condition
	const settingParams = schema.params.filter(
		(p) =>
			p.key !== "prompt" &&
			p.key !== "text" &&
			!p.advanced &&
			shouldShowParam(p, params),
	);

	const handleParamChange = (key: string, value: unknown) => {
		onParamsChange({
			...params,
			[key]: value,
		});
	};

	return (
		<div className="space-y-4 md:space-y-6">
			{/* Text Input (Prompt/Script) */}
			{!hidePrompt && promptParam && (
				<div className="space-y-2">
					<Label
						htmlFor="voice-prompt"
						className="text-sm font-medium leading-relaxed"
					>
						{t("prompt_label")}
					</Label>
					<div className="glass-inner-field p-3 md:p-4">
						<Textarea
							id="voice-prompt"
							value={promptValue}
							onChange={(e) => handleParamChange(promptKey, e.target.value)}
							placeholder={t("prompt_placeholder")}
							maxLength={maxLength}
							disabled={disabled}
							className="bg-transparent border-0 resize-none text-base text-foreground placeholder:text-muted-foreground leading-relaxed min-h-[120px] focus:outline-none"
							rows={4}
						/>
					</div>
					<p className="text-xs text-muted-foreground leading-relaxed">
						{t("prompt_characters", {
							count: promptValue.length,
							max: maxLength,
						})}
					</p>
				</div>
			)}

			{/* Voice Settings (Dynamic from Schema) */}
			{settingParams.length > 0 && (
				<div className="space-y-4">
					<h3 className="text-sm font-semibold leading-relaxed">
						{t("settings.title")}
					</h3>
					<div className="space-y-3">
						{settingParams.map((param) => (
							<DynamicField
								key={param.key}
								param={convertToParamSchema(param)}
								value={params[param.key]}
								onChange={(value) => handleParamChange(param.key, value)}
								disabled={disabled}
								translationNamespace="voice_generator"
							/>
						))}
					</div>
				</div>
			)}

			{/* Advanced Settings (if any) */}
			{schema.params.some((p) => p.advanced) && (
				<Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
					<CollapsibleTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							className="w-full justify-between min-h-[44px] text-sm font-medium text-muted-foreground transition-smooth hover:text-foreground active:scale-95"
						>
							{t("settings.advanced")}
							<ChevronDown
								className={cn(
									"size-4 transition-transform",
									advancedOpen && "rotate-180",
								)}
							/>
						</Button>
					</CollapsibleTrigger>
					<CollapsibleContent>
						<div className="mt-3 space-y-3">
							{schema.params
								.filter((p) => p.advanced && shouldShowParam(p, params))
								.map((param) => (
									<DynamicField
										key={param.key}
										param={convertToParamSchema(param)}
										value={params[param.key]}
										onChange={(value) => handleParamChange(param.key, value)}
										disabled={disabled}
										translationNamespace="voice_generator"
									/>
								))}
						</div>
					</CollapsibleContent>
				</Collapsible>
			)}
		</div>
	);
}
