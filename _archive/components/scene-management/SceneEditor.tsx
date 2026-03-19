"use client";

import { ImageIcon, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Scene } from "@/components/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Id } from "@/convex/_generated/dataModel";
import { VideoGenerator } from "../video-generation/VideoGenerator";
import { FrameAssignment } from "./FrameAssignment";

interface SceneEditorProps {
	scene: Scene;
	projectId: string; // Required for AI chat in VideoGenerator
	// Project-level context from Step 1 & Step 2b (for video generation)
	visualStyle?: string;
	occasion?: string;
	theme?: string;
	emotionalStory?: string;
	/** Validation state from parent (derived from Convex) */
	isValidated?: boolean;
	// Callbacks
	onUpdateScene: (id: string, updates: Partial<Scene>) => void;
	onRemoveScene?: (id: string) => void;
	onValidateVideo?: (sceneId: string) => void;
	onGenerateVideo?: (sceneId: string) => void;
	onRegenerateApproved?: (sceneId: string) => void;
	onDeleteFrame?: (id: string, frameType: "start" | "end") => void;
	onFrameChanged?: (sceneId: string) => void;
}

export function SceneEditor({
	scene,
	projectId,
	visualStyle,
	occasion,
	theme,
	emotionalStory,
	isValidated,
	onUpdateScene,
	onRemoveScene,
	onValidateVideo,
	onGenerateVideo,
	onRegenerateApproved,
	onDeleteFrame,
	onFrameChanged,
}: SceneEditorProps) {
	const t = useTranslations("scene_editor");
	return (
		<div className="space-y-6">
			{/* Scene Details */}
			<Card className="bg-[#182634] border-[#223649]">
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle className="text-white flex items-center gap-2">
							<ImageIcon className="h-5 w-5" />
							{t("scene_details_title")}
						</CardTitle>
						{onRemoveScene && (
							<Button
								onClick={() => onRemoveScene(scene.id)}
								variant="ghost"
								size="sm"
								className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						)}
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<label
							className="text-white font-medium mb-2 block"
							htmlFor={`title-${scene.id}`}
						>
							{t("scene_title_visible_label")}
						</label>
						<input
							id={`title-${scene.id}`}
							type="text"
							value={scene.title}
							onChange={(e) =>
								onUpdateScene(scene.id, { title: e.target.value })
							}
							className="w-full bg-[#223649] border border-[#314d68] rounded-lg p-3 text-white"
							placeholder={t("scene_title_placeholder")}
							aria-label={t("scene_title_label")}
						/>
					</div>

					<div>
						<label
							className="text-white font-medium mb-2 block"
							htmlFor={`description-${scene.id}`}
						>
							{t("scene_description_visible_label")}
						</label>
						<Textarea
							id={`description-${scene.id}`}
							value={scene.description}
							onChange={(e) =>
								onUpdateScene(scene.id, { description: e.target.value })
							}
							className="w-full bg-[#223649] border border-[#314d68] rounded-lg p-3 text-white resize-none"
							placeholder={t("scene_description_placeholder")}
							rows={3}
							aria-label={t("scene_description_label")}
						/>
					</div>

					<div>
						<label
							className="text-white font-medium mb-2 block"
							htmlFor={`duration-${scene.id}`}
						>
							{t("duration_visible_label")}
						</label>
						<Select
							value={scene.duration.toString()}
							onValueChange={(value) =>
								onUpdateScene(scene.id, {
									duration: Number.parseInt(value, 10) as 5 | 10,
								})
							}
						>
							<SelectTrigger
								id={`duration-${scene.id}`}
								className="bg-[#223649] border-[#314d68] text-white"
								aria-label={t("duration_label")}
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent className="bg-[#223649] border-[#314d68]">
								<SelectItem value="5" className="text-white hover:bg-[#314d68]">
									{t("duration_5_seconds")}
								</SelectItem>
								<SelectItem
									value="10"
									className="text-white hover:bg-[#314d68]"
								>
									{t("duration_10_seconds")}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Frame Assignment */}
			<FrameAssignment
				key={`${scene.id}-${scene.startFrameImage || "no-start"}-${scene.endFrameImage || "no-end"}`}
				scene={scene}
				projectId={projectId as Id<"projects">}
				onUpdateScene={onUpdateScene}
				visualStyle={visualStyle}
				onDeleteFrame={onDeleteFrame}
				onFrameChanged={onFrameChanged}
			/>

			{/* Video Generation */}
			{scene.startFrameImage && scene.endFrameImage && (
				<VideoGenerator
					sceneId={scene.id}
					projectId={projectId}
					startFrameImage={scene.startFrameImage}
					endFrameImage={scene.endFrameImage}
					duration={scene.duration}
					cinematicStyles={scene.cinematicStyles}
					sceneTitle={scene.title}
					sceneDescription={scene.description}
					visualStyle={visualStyle}
					occasion={occasion}
					theme={theme}
					emotionalStory={emotionalStory}
					isValidated={isValidated}
					onValidateVideo={onValidateVideo}
					onGenerateVideo={onGenerateVideo}
					onRegenerateApproved={onRegenerateApproved}
				/>
			)}
		</div>
	);
}
