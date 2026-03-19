"use client";

import { useTranslations } from "next-intl";
import { DynamicField } from "@/components/image-generator/DynamicField";
import type { ParamSchema } from "@/components/image-generator/types/schema";
import { ElementsPanel } from "./ElementsPanel";
import { ImageUploadZone } from "./ImageUploadZone";
import { MultiShotPanel } from "./MultiShotPanel";
import { StyleRefStrip } from "./StyleRefStrip";
import type { SceneData, VideoModelSchema } from "./types/schema";
import { VideoUploadZone } from "./VideoUploadZone";

interface SceneInputAreaProps {
	schema: VideoModelSchema;
	scene: SceneData;
	onUpdate: (patch: Partial<SceneData>) => void;
	disabled?: boolean;
}

/**
 * Single capability-driven input area. No type branching (schema.type).
 * All rendering is controlled by schema.capabilities flags.
 */
export function SceneInputArea({
	schema,
	scene,
	onUpdate,
	disabled,
}: SceneInputAreaProps) {
	const t = useTranslations("storyboard");
	const startImageParamKey = schema.startImageParam ?? "start_image_url";
	const videoParamKey = schema.videoInputParam ?? "video_url";

	const keepAudioParam = schema.params.find((p) => p.key === "keep_audio");

	return (
		<div className="flex flex-col gap-3">
			{/* Video input — only when requiresVideoInput */}
			{schema.capabilities.requiresVideoInput && (
				<VideoUploadZone
					value={scene.mediaInputs[videoParamKey] as string | undefined}
					onChange={(url) =>
						onUpdate({
							mediaInputs: { ...scene.mediaInputs, [videoParamKey]: url ?? "" },
						})
					}
					required
					label={t("upload_video")}
					hint={t("upload_video_hint")}
					disabled={disabled}
				/>
			)}

			{/* Keep audio — only when capabilities.keepAudio (V2V models) */}
			{schema.capabilities.keepAudio && keepAudioParam && (
				<DynamicField
					param={keepAudioParam as unknown as ParamSchema}
					value={scene.params?.keep_audio ?? false}
					onChange={(v) =>
						onUpdate({ params: { ...scene.params, keep_audio: v as boolean } })
					}
					translationNamespace="video_generator"
				/>
			)}

			{/* Start image — shown for I2V (required) and R2V (optional), but not V2V */}
			{!schema.capabilities.requiresVideoInput && (
				<ImageUploadZone
					value={scene.mediaInputs[startImageParamKey] as string | undefined}
					onChange={(url) =>
						onUpdate({
							mediaInputs: {
								...scene.mediaInputs,
								[startImageParamKey]: url ?? "",
							},
						})
					}
					required={schema.capabilities.requiresStartImage ?? false}
					label={t("upload_start_image")}
					disabled={disabled}
				/>
			)}

			{/* End frame — only when capabilities.supportsEndImage */}
			{schema.capabilities.supportsEndImage && (
				<ImageUploadZone
					value={scene.mediaInputs.end_image_url as string | undefined}
					onChange={(url) =>
						onUpdate({
							mediaInputs: { ...scene.mediaInputs, end_image_url: url ?? "" },
						})
					}
					required={false}
					label={t("upload_end_image")}
					hint={t("end_image_hint")}
					disabled={disabled}
				/>
			)}

			{/* Style reference strip — only when capabilities.supportsStyleImages */}
			{schema.capabilities.supportsStyleImages && (
				<StyleRefStrip
					urls={(scene.mediaInputs.image_urls as string[]) ?? []}
					onChange={(urls) =>
						onUpdate({
							mediaInputs: { ...scene.mediaInputs, image_urls: urls },
						})
					}
					max={4}
					disabled={disabled}
				/>
			)}

			{/* Elements panel — only when capabilities.supportsElements */}
			{schema.capabilities.supportsElements && (
				<ElementsPanel scene={scene} onUpdate={onUpdate} disabled={disabled} />
			)}

			{/* Multi-shot — only when capabilities.multiShot */}
			{schema.capabilities.multiShot && (
				<MultiShotPanel scene={scene} onUpdate={onUpdate} disabled={disabled} />
			)}
		</div>
	);
}
