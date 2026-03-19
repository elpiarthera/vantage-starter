"use client";

import { Expand, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { DynamicField } from "@/components/image-generator/DynamicField";
import type { ParamSchema } from "@/components/image-generator/types/schema";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCanGenerateScene } from "./hooks/use-convex-video-schemas";
import { SceneDetailModal } from "./SceneDetailModal";
import { SceneInputArea } from "./SceneInputArea";
import { SceneStatusBadge } from "./SceneStatusBadge";
import type { SceneData, VideoModelSchema } from "./types/schema";

/**
 * Evaluates showWhen condition — return true if param should be rendered.
 * Mirrors VoiceSettingsPanel.tsx shouldShowParam exactly.
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

interface SceneCardProps {
	scene: SceneData;
	sceneNumber: number;
	schema: VideoModelSchema | null;
	onUpdate: (id: string, patch: Partial<SceneData>) => void;
	onGenerate: (id: string) => void;
	onRemove: (id: string) => void;
	disabled?: boolean;
}

export function SceneCard({
	scene,
	sceneNumber,
	schema,
	onUpdate,
	onGenerate,
	onRemove,
	disabled,
}: SceneCardProps) {
	const t = useTranslations("storyboard");
	const [detailOpen, setDetailOpen] = useState(false);

	const canGenerate = useCanGenerateScene(scene, schema ?? undefined);
	const isGenerating =
		scene.status === "generating" || scene.status === "queued";

	const promptParam = schema?.params.find((p) => p.key === "prompt");
	const sceneParams =
		schema?.params.filter((p) => p.scope === "scene" && p.key !== "prompt") ??
		[];

	const handleUpdate = (patch: Partial<SceneData>) => onUpdate(scene.id, patch);

	return (
		<>
			<div
				className={cn(
					"flex flex-col gap-3 rounded-xl border bg-background p-4 shadow-sm transition-smooth",
					scene.status === "error" && "border-destructive/30",
					scene.status === "complete" && "border-success/30",
					scene.status === "generating" && "border-primary/30",
				)}
			>
				{/* Header */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span className="rounded-full bg-muted/60 px-2 py-0.5 text-xs font-medium text-muted-foreground">
							{t("scene_label", { number: sceneNumber })}
						</span>
						<SceneStatusBadge status={scene.status} />
					</div>
					<div className="flex items-center gap-1">
						{/* Mobile expand */}
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={() => setDetailOpen(true)}
							className="size-9 min-h-[44px] min-w-[44px] md:hidden"
							aria-label={`Expand scene ${sceneNumber}`}
						>
							<Expand className="size-4" />
						</Button>
						{/* Delete */}
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={() => onRemove(scene.id)}
							disabled={disabled || isGenerating}
							className="size-9 min-h-[44px] min-w-[44px] text-muted-foreground hover:text-destructive"
							aria-label={t("remove_scene")}
						>
							<Trash2 className="size-4" />
						</Button>
					</div>
				</div>

				{/* Video preview when complete */}
				{scene.status === "complete" && scene.generatedVideoUrl ? (
					// biome-ignore lint/a11y/useMediaCaption: generated video output has no captioning available
					<video
						src={scene.generatedVideoUrl}
						className="w-full aspect-video rounded-lg object-cover"
						controls
						playsInline
					/>
				) : (
					<>
						{/* Input area */}
						{schema && (
							<SceneInputArea
								schema={schema}
								scene={scene}
								onUpdate={handleUpdate}
								disabled={disabled || isGenerating}
							/>
						)}

						{/* Prompt textarea */}
						{promptParam && (
							<div className="flex flex-col gap-1">
								<label
									htmlFor={`prompt-${scene.id}`}
									className="text-xs font-medium text-muted-foreground"
								>
									{promptParam.label
										? promptParam.label.replace("video_generator.", "")
										: "Prompt"}
									{promptParam.required && (
										<span className="ml-0.5 text-destructive" aria-hidden>
											*
										</span>
									)}
								</label>
								<textarea
									id={`prompt-${scene.id}`}
									value={scene.prompt}
									onChange={(e) => handleUpdate({ prompt: e.target.value })}
									placeholder={promptParam.placeholder ?? ""}
									maxLength={promptParam.maxLength ?? schema?.maxPromptLength}
									rows={3}
									disabled={disabled || isGenerating}
									className="min-h-[44px] w-full rounded-lg border border-border/30 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none leading-relaxed"
								/>
							</div>
						)}

						{/* Per-scene params — scope: "scene", excluding "prompt" */}
						{schema &&
							sceneParams.map((p) =>
								shouldShowParam(p, scene.params ?? {}) ? (
									<DynamicField
										key={p.key}
										param={p as unknown as ParamSchema}
										value={scene.params?.[p.key]}
										onChange={(v) =>
											handleUpdate({
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
					</>
				)}

				{/* Per-scene generate button */}
				<Button
					type="button"
					variant="outline"
					onClick={() => onGenerate(scene.id)}
					disabled={disabled || !canGenerate || isGenerating}
					className="min-h-[44px] w-full"
				>
					{isGenerating ? t("generating") : t("generate_scene")}
				</Button>

				{/* Error message */}
				{scene.status === "error" && scene.error && (
					<p className="text-xs text-destructive">{scene.error}</p>
				)}
			</div>

			{/* Mobile detail modal */}
			{schema && (
				<SceneDetailModal
					open={detailOpen}
					onOpenChange={setDetailOpen}
					scene={scene}
					sceneNumber={sceneNumber}
					schema={schema}
					onUpdate={handleUpdate}
					onGenerate={() => onGenerate(scene.id)}
					disabled={disabled}
				/>
			)}
		</>
	);
}
