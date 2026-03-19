"use client";

import { useTranslations } from "next-intl";
import { AdaptiveModal } from "@/components/adaptive/AdaptiveModal";
import { DynamicField } from "@/components/image-generator/DynamicField";
import type { ParamSchema } from "@/components/image-generator/types/schema";
import { Button } from "@/components/ui/button";
import { useCanGenerateScene } from "./hooks/use-convex-video-schemas";
import { SceneInputArea } from "./SceneInputArea";
import type { SceneData, VideoModelSchema } from "./types/schema";

/**
 * Evaluates showWhen condition — return true if param should be rendered.
 */
function shouldShowParam(
	param: { showWhen?: { param: string; value: string | boolean } },
	currentParams: Record<string, unknown>,
): boolean {
	if (!param.showWhen) return true;
	const dependencyValue = currentParams[param.showWhen.param];
	if (param.showWhen.value === "!empty" || param.showWhen.value === "") {
		return !!dependencyValue && dependencyValue !== "";
	}
	return dependencyValue === param.showWhen.value;
}

interface SceneDetailModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	scene: SceneData;
	sceneNumber: number;
	schema: VideoModelSchema;
	onUpdate: (patch: Partial<SceneData>) => void;
	onGenerate: () => void;
	disabled?: boolean;
}

export function SceneDetailModal({
	open,
	onOpenChange,
	scene,
	sceneNumber,
	schema,
	onUpdate,
	onGenerate,
	disabled,
}: SceneDetailModalProps) {
	const t = useTranslations("storyboard");
	const canGenerate = useCanGenerateScene(scene, schema);
	const isGenerating =
		scene.status === "generating" || scene.status === "queued";

	const promptParam = schema.params.find((p) => p.key === "prompt");
	const durationParam = schema.params.find((p) => p.key === "duration");
	const sceneParams = schema.params.filter(
		(p) => p.scope === "scene" && p.key !== "prompt",
	);

	return (
		<AdaptiveModal
			isOpen={open}
			onClose={() => onOpenChange(false)}
			title={t("scene_label", { number: sceneNumber })}
		>
			<div className="flex flex-col gap-4 overflow-y-auto pb-4">
				{/* Input area */}
				<SceneInputArea
					schema={schema}
					scene={scene}
					onUpdate={onUpdate}
					disabled={disabled || isGenerating}
				/>

				{/* Full prompt textarea */}
				{promptParam && (
					<div className="flex flex-col gap-1.5">
						<label
							htmlFor={`detail-prompt-${scene.id}`}
							className="text-sm font-medium text-muted-foreground"
						>
							{promptParam.label?.replace("video_generator.", "") ?? "Prompt"}
							{promptParam.required && (
								<span className="ml-0.5 text-destructive" aria-hidden>
									*
								</span>
							)}
						</label>
						<textarea
							id={`detail-prompt-${scene.id}`}
							value={scene.prompt}
							onChange={(e) => onUpdate({ prompt: e.target.value })}
							placeholder={promptParam.placeholder ?? ""}
							maxLength={promptParam.maxLength ?? schema.maxPromptLength}
							rows={5}
							disabled={disabled || isGenerating}
							className="min-h-[44px] w-full rounded-lg border border-border/30 bg-transparent px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none leading-relaxed"
						/>
					</div>
				)}

				{/* Duration override — only if capabilities.supportsDuration */}
				{schema.capabilities.supportsDuration && durationParam && (
					<DynamicField
						param={durationParam as unknown as ParamSchema}
						value={scene.durationSeconds}
						onChange={(v) => onUpdate({ durationSeconds: v as number })}
						translationNamespace="video_generator"
						disabled={disabled || isGenerating}
					/>
				)}

				{/* Per-scene params — scope: "scene", excluding "prompt" */}
				{sceneParams.map((p) =>
					shouldShowParam(p, scene.params ?? {}) ? (
						<DynamicField
							key={p.key}
							param={p as unknown as ParamSchema}
							value={scene.params?.[p.key]}
							onChange={(v) =>
								onUpdate({
									params: {
										...scene.params,
										[p.key]: v as string | number | boolean,
									},
								})
							}
							translationNamespace="video_generator"
							disabled={disabled || isGenerating}
						/>
					) : null,
				)}

				{/* Generate button */}
				<Button
					type="button"
					onClick={() => {
						onGenerate();
						onOpenChange(false);
					}}
					disabled={disabled || !canGenerate || isGenerating}
					className="min-h-[44px] w-full"
				>
					{isGenerating ? t("generating") : t("generate_scene")}
				</Button>
			</div>
		</AdaptiveModal>
	);
}
