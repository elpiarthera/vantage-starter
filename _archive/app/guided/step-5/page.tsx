"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import {
	AlertCircle,
	CheckCircle,
	Edit3,
	GripVertical,
	ImageIcon,
	Loader2,
	Play,
	RefreshCw,
	Sparkles,
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type React from "react";
import { Suspense, useEffect, useState } from "react";
import { StepHeader } from "@/components/shared/step-header";
import {
	type TransitionConfig,
	TransitionSelector,
} from "@/components/transitions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useChatMessages } from "@/hooks/business-logic/useChatMessages";
import { useSceneData } from "@/hooks/business-logic/useSceneData";

interface SceneUI {
	id: string;
	title: string;
	description: string;
	duration: number;
	startFrame?: string;
	endFrame?: string;
	generatedVideo?: string;
	cinematicStyles?: {
		ambiance?: string;
		cameraMovement?: string;
		colorTone?: string;
		visualStyle?: string;
	};
}

// Loading component for Suspense
function Loading() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-[#101a23]">
			<Loader2 className="h-12 w-12 animate-spin text-[#0d7ff2]" />
		</div>
	);
}

function GuidedStep5Content() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const t = useTranslations("guided_step5");

	// Get projectId from URL query params
	const projectIdFromUrl = searchParams.get("projectId");
	const projectId = projectIdFromUrl
		? (projectIdFromUrl as Id<"projects">)
		: undefined;

	// ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURN
	const [script, setScript] = useState("");
	const [scenes, setScenes] = useState<SceneUI[]>([]);
	const [draggedScene, setDraggedScene] = useState<string | null>(null);

	// Load scenes from Convex
	const { scenes: convexScenes, isLoading: scenesLoading } =
		useSceneData(projectId);

	// Load narration script from Step 3b chat messages
	const { messages: narrationMessages } = useChatMessages(projectId, 3);

	// Load project for transitionConfig
	const project = useQuery(
		api.projects.get,
		projectId ? { projectId } : "skip",
	);
	const updateProject = useMutation(api.projects.update);

	// Assembly action for re-assemble functionality
	const buildFinalVideo = useAction(api.actions.videoAssembly.buildFinalVideo);
	const [isReassembling, setIsReassembling] = useState(false);
	const [isAssembling, setIsAssembling] = useState(false);

	// Transition configuration state
	const [transitionConfig, setTransitionConfig] = useState<TransitionConfig>({
		mode: "xfade",
		xfadeType: "circleopen",
		transitionDuration: 1.0,
	});

	// Sync transitionConfig with project data (respect DB value, default to hard_cut if undefined)
	useEffect(() => {
		if (project?.transitionConfig) {
			setTransitionConfig({
				mode: project.transitionConfig.mode ?? "hard_cut",
				xfadeType:
					(project.transitionConfig
						.xfadeType as TransitionConfig["xfadeType"]) ?? "circleopen",
				transitionDuration: project.transitionConfig.transitionDuration ?? 1.0,
			});
		}
	}, [project?.transitionConfig]);

	// Redirect to Step 1 if projectId is missing (graceful handling)
	useEffect(() => {
		if (!projectIdFromUrl) {
			console.warn("Missing projectId in URL - redirecting to Step 1");
			router.replace("/guided/step-1");
		}
	}, [projectIdFromUrl, router]);

	// Load narration script from Step 3b chat messages
	useEffect(() => {
		if (narrationMessages && narrationMessages.length > 0) {
			// Get the last assistant message (approved narration script)
			const lastAssistantMessage = [...narrationMessages]
				.reverse()
				.find((msg) => msg.role === "assistant");
			if (lastAssistantMessage) {
				setScript(lastAssistantMessage.content);
			}
		}
	}, [narrationMessages]);

	// Convert Convex scenes to local format for UI
	useEffect(() => {
		if (convexScenes && !scenesLoading) {
			const formattedScenes = convexScenes.map((scene) => ({
				id: scene._id,
				title: scene.title,
				description: scene.description,
				duration: scene.duration,
				startFrame: scene.startFrame as string | undefined,
				endFrame: scene.endFrame as string | undefined,
				generatedVideo: scene.videoUrl,
				cinematicStyles: scene.cinematicStyles,
			}));
			setScenes(formattedScenes);
		}
	}, [convexScenes, scenesLoading]);

	const totalDuration = scenes.reduce(
		(sum, scene) => sum + (scene.duration || 10),
		0,
	);
	const hasScenes = scenes.length > 0;
	const canContinue = true; // Always allow continue for demo purposes

	// Assembly status detection for skip button
	const hasCompletedVideo =
		project?.assemblyStatus === "completed" && !!project?.finalVideoUrl;

	const isAssemblyInProgress =
		!!project?.assemblyStatus &&
		!["completed", "failed"].includes(project.assemblyStatus);

	const isAssemblyFailed = project?.assemblyStatus === "failed";

	const handleDragStart = (sceneId: string) => {
		setDraggedScene(sceneId);
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
	};

	const handleDrop = (e: React.DragEvent, targetId: string) => {
		e.preventDefault();
		if (draggedScene === null) return;

		const draggedIndex = scenes.findIndex((s) => s.id === draggedScene);
		const targetIndex = scenes.findIndex((s) => s.id === targetId);

		const newScenes = [...scenes];
		const [draggedItem] = newScenes.splice(draggedIndex, 1);
		newScenes.splice(targetIndex, 0, draggedItem);

		setScenes(newScenes);
		setDraggedScene(null);
	};

	// Show loading while redirecting or if no projectId
	if (!projectIdFromUrl) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[#101a23]">
				<Loader2 className="h-12 w-12 animate-spin text-[#0d7ff2]" />
			</div>
		);
	}

	const handleEditScript = () => {
		router.push(`/guided/step-3b?projectId=${projectId}`);
	};

	const handleEditScene = (sceneId: string) => {
		router.push(`/guided/step-3?projectId=${projectId}&sceneId=${sceneId}`);
	};

	const handleContinue = async () => {
		if (!canContinue) return;

		// Validate prerequisites before assembly
		if (!projectId || !project || !convexScenes || convexScenes.length === 0) {
			console.error("[Step 5] Missing required data for assembly");
			return;
		}

		if (!project.narrationAudioUrl) {
			console.error("[Step 5] Missing narration audio - cannot assemble");
			return;
		}

		if (!project.musicAudioUrl) {
			console.error("[Step 5] Missing music audio - cannot assemble");
			return;
		}

		setIsAssembling(true);
		try {
			console.log("[Step 5] Starting final video assembly...");

			// Call the assembly action with all required parameters
			await buildFinalVideo({
				projectId,
				sceneIds: convexScenes.map((scene) => scene._id as Id<"scenes">),
				narrationUrl: project.narrationAudioUrl,
				musicUrl: project.musicAudioUrl,
				narrationDurationMs: project.narrationDurationMs,
				targetResolution: "1080p",
				transitionConfig: {
					mode: transitionConfig.mode,
					xfadeType: transitionConfig.xfadeType,
					transitionDuration: transitionConfig.transitionDuration,
				},
			});

			console.log("[Step 5] Assembly started successfully");
			// Navigate to Step 6 to show progress modal
			router.push(`/guided/step-6?projectId=${projectId}`);
		} catch (error) {
			console.error("[Step 5] Assembly failed:", error);
			setIsAssembling(false);
			// TODO: Show error toast to user
		}
	};

	// Handle re-assembly: Start the assembly process directly, then navigate to Step 6
	const handleReassemble = async () => {
		if (!projectId || !project || !convexScenes) {
			console.error("[Step 5] Missing required data for re-assembly");
			return;
		}

		if (!project.narrationAudioUrl) {
			console.error("[Step 5] Missing narration audio for re-assembly");
			return;
		}

		setIsReassembling(true);
		try {
			console.log("[Step 5] Starting re-assembly...");

			// Call the assembly action directly
			await buildFinalVideo({
				projectId,
				sceneIds: convexScenes.map((scene) => scene._id as Id<"scenes">),
				narrationUrl: project.narrationAudioUrl,
				musicUrl: project.musicAudioUrl as string, // Required - user must select music
				transitionConfig: project.transitionConfig ?? { mode: "hard_cut" },
			});

			console.log("[Step 5] Re-assembly started successfully");
			// Navigate to Step 6 to show progress
			router.push(`/guided/step-6?projectId=${projectId}`);
		} catch (error) {
			console.error("[Step 5] Re-assembly failed:", error);
			setIsReassembling(false);
		}
	};

	// Handle transition config changes
	const handleTransitionChange = async (config: TransitionConfig) => {
		setTransitionConfig(config);

		if (projectId) {
			await updateProject({
				projectId,
				transitionConfig: {
					mode: config.mode,
					xfadeType: config.xfadeType,
					transitionDuration: config.transitionDuration,
				},
			});
		}
	};

	// Safe rendering of highlighted text - script comes from Convex DB, keywords are controlled
	const renderHighlightedScript = (text: string) => {
		const keywords = [
			"love",
			"joy",
			"celebration",
			"together",
			"special",
			"beautiful",
			"amazing",
			"wonderful",
			"excited",
			"happy",
		];

		// Split text by keywords and render as React elements
		const parts: React.ReactNode[] = [];
		const currentText = text;
		let key = 0;

		keywords.forEach((keyword) => {
			const regex = new RegExp(`\\b${keyword}\\b`, "gi");
			const newParts: React.ReactNode[] = [];

			parts.length === 0
				? [currentText]
				: parts.forEach((part) => {
						if (typeof part === "string") {
							const matches = part.split(regex);
							matches.forEach((match, index) => {
								if (match) newParts.push(match);
								if (index < matches.length - 1) {
									newParts.push(
										<span
											key={`${keyword}-${key++}`}
											className="text-blue-400 font-medium"
										>
											{keyword}
										</span>,
									);
								}
							});
						} else {
							newParts.push(part);
						}
					});

			if (parts.length === 0) {
				const matches = currentText.split(regex);
				matches.forEach((match, index) => {
					if (match) newParts.push(match);
					if (index < matches.length - 1) {
						newParts.push(
							<span
								key={`${keyword}-${key++}`}
								className="text-blue-400 font-medium"
							>
								{keyword}
							</span>,
						);
					}
				});
			}

			parts.length = 0;
			parts.push(...newParts);
		});

		return parts.length > 0 ? parts : currentText;
	};

	return (
		<div
			style={{ backgroundColor: "#101a23" }}
			className="min-h-screen text-white"
		>
			<StepHeader
				currentStep={5}
				backHref={`/guided/step-4?projectId=${projectId}`}
			/>

			<div className="pt-24 p-4 pb-56 md:pb-60">
				<div className="max-w-4xl mx-auto">
					<div className="text-center mb-8">
						<h1 className="text-4xl font-bold text-white mb-2">{t("title")}</h1>
						<p className="text-xl text-blue-400 italic">{t("subtitle")}</p>
					</div>

					<div className="space-y-8">
						<Card
							style={{ backgroundColor: "#182634" }}
							className="border-[#314d68]"
						>
							<CardHeader>
								<CardTitle className="text-white flex items-center justify-between">
									<span>{t("narration_script")}</span>
									<Button
										onClick={handleEditScript}
										variant="outline"
										className="border-[#314d68] text-white hover:bg-[#223649] bg-transparent"
									>
										<Edit3 className="h-4 w-4 mr-2" />
										{t("edit_script")}
									</Button>
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-base leading-relaxed text-gray-200 bg-[#223649] border border-[#314d68] rounded-lg p-4 min-h-[120px]">
									{renderHighlightedScript(script || t("no_script_content"))}
								</div>
							</CardContent>
						</Card>

						<Card
							style={{ backgroundColor: "#182634" }}
							className="border-[#314d68]"
						>
							<CardHeader>
								<CardTitle className="text-white">
									{t("interactive_storyboard")}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{scenes.length === 0 ? (
										<div className="text-center py-8 text-gray-400">
											<p>{t("no_scenes_message")}</p>
										</div>
									) : (
										scenes.map((scene, index) => (
											<button
												type="button"
												key={scene.id}
												draggable
												onDragStart={() => handleDragStart(scene.id)}
												onDragOver={handleDragOver}
												onDrop={(e) => handleDrop(e, scene.id)}
												style={{ backgroundColor: "#223649" }}
												className={`border border-[#314d68] rounded-lg p-4 cursor-move hover:bg-[#2a3f56] transition-colors ${
													draggedScene === scene.id ? "opacity-50" : ""
												} w-full text-left`}
											>
												<div className="flex items-start gap-4">
													<GripVertical className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />

													<div className="flex-1 min-w-0">
														<div className="flex items-center justify-between mb-3">
															<h4 className="font-semibold text-white text-lg">
																{t("scene_card_title", {
																	number: index + 1,
																	title: scene.title,
																})}
															</h4>
															<Button
																onClick={() => handleEditScene(scene.id)}
																variant="outline"
																size="sm"
																className="border-[#314d68] text-white hover:bg-[#314d68] bg-transparent flex-shrink-0"
															>
																<Edit3 className="h-4 w-4 mr-2" />
																{t("edit_scene")}
															</Button>
														</div>

														<p className="text-gray-300 mb-4">
															{scene.description}
														</p>

														<div className="space-y-4 mb-4">
															{/* Start and End Frames Row */}
															<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
																<div className="space-y-2">
																	<div className="text-sm font-medium text-gray-400 mb-2">
																		{t("start_frame")}
																	</div>
																	<div className="aspect-video bg-[#314d68] border border-[#4a5568] rounded-lg flex items-center justify-center overflow-hidden relative">
																		{scene.startFrame ? (
																			<Image
																				src={scene.startFrame}
																				alt={t("start_frame_alt")}
																				fill
																				className="object-cover"
																			/>
																		) : (
																			<div className="flex flex-col items-center justify-center text-gray-500">
																				<ImageIcon className="h-8 w-8 mb-2" />
																				<span className="text-sm">
																					{t("no_start_frame")}
																				</span>
																			</div>
																		)}
																	</div>
																</div>

																<div className="space-y-2">
																	<div className="text-sm font-medium text-gray-400 mb-2">
																		{t("end_frame")}
																	</div>
																	<div className="aspect-video bg-[#314d68] border border-[#4a5568] rounded-lg flex items-center justify-center overflow-hidden relative">
																		{scene.endFrame ? (
																			<Image
																				src={scene.endFrame}
																				alt={t("end_frame_alt")}
																				fill
																				className="object-cover"
																			/>
																		) : (
																			<div className="flex flex-col items-center justify-center text-gray-500">
																				<ImageIcon className="h-8 w-8 mb-2" />
																				<span className="text-sm">
																					{t("no_end_frame")}
																				</span>
																			</div>
																		)}
																	</div>
																</div>
															</div>

															{/* Generated Video Row */}
															<div className="space-y-2">
																<div className="text-sm font-medium text-gray-400 mb-2">
																	{t("generated_video")}
																</div>
																<div className="aspect-video bg-[#314d68] border border-[#4a5568] rounded-lg flex items-center justify-center overflow-hidden">
																	{scene.generatedVideo ? (
																		<div className="relative w-full h-full">
																			<video
																				src={scene.generatedVideo}
																				className="w-full h-full object-cover"
																				controls
																				preload="metadata"
																			>
																				<track kind="captions" />
																			</video>
																			<div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
																				<Play className="h-12 w-12 text-white" />
																			</div>
																		</div>
																	) : (
																		<div className="flex flex-col items-center justify-center text-gray-500">
																			<Play className="h-8 w-8 mb-2" />
																			<span className="text-sm">
																				{t("no_video_generated")}
																			</span>
																		</div>
																	)}
																</div>
															</div>
														</div>

														<div className="flex items-center gap-4">
															<span className="bg-[#0d7ff2] text-white px-3 py-1 rounded-full text-sm font-medium">
																{scene.duration || 10}s
															</span>
															{scene.cinematicStyles && (
																<div className="flex gap-2 text-xs text-gray-400">
																	{scene.cinematicStyles.ambiance && (
																		<span className="bg-[#314d68] px-2 py-1 rounded">
																			{scene.cinematicStyles.ambiance}
																		</span>
																	)}
																	{scene.cinematicStyles.cameraMovement && (
																		<span className="bg-[#314d68] px-2 py-1 rounded">
																			{scene.cinematicStyles.cameraMovement}
																		</span>
																	)}
																</div>
															)}
														</div>
													</div>
												</div>
											</button>
										))
									)}
								</div>
							</CardContent>
						</Card>

						{/* Transition Style Selection - Sprint 11 Phase 2 */}
						<TransitionSelector
							value={transitionConfig}
							onChange={handleTransitionChange}
							sceneCount={scenes.length || 3}
							disabled={scenesLoading}
							projectId={projectId}
							scenes={convexScenes?.map((scene) => ({
								_id: scene._id,
								sceneNumber: scene.sceneNumber,
								title: scene.title,
								outgoingTransition: scene.outgoingTransition,
							}))}
						/>
					</div>
				</div>
			</div>

			<div
				className="fixed bottom-0 left-0 right-0 p-4 border-t border-[#314d68]"
				style={{ backgroundColor: "#182634" }}
			>
				<div className="max-w-4xl mx-auto space-y-3">
					{/* CASE 1: Video already assembled - Show Skip + Re-assemble options */}
					{hasCompletedVideo && (
						<>
							<Button
								onClick={() =>
									router.push(`/guided/step-6?projectId=${projectId}`)
								}
								className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-8 rounded-lg text-lg"
							>
								<CheckCircle className="h-5 w-5 mr-2" />
								{t("skip_to_final_video")}
								<Badge
									variant="secondary"
									className="ml-2 bg-green-800 text-white"
								>
									{t("free")}
								</Badge>
							</Button>
							<p className="text-sm text-gray-400 text-center">
								{t("skip_to_final_video_hint")}
							</p>
							<Button
								onClick={handleReassemble}
								disabled={isReassembling}
								variant="outline"
								className="w-full border-[#314d68] text-white hover:bg-[#223649] font-semibold py-3 px-8 rounded-lg"
							>
								{isReassembling ? (
									<>
										<Loader2 className="h-5 w-5 mr-2 animate-spin" />
										{t("reassembling") || "Re-assembling..."}
									</>
								) : (
									<>
										<RefreshCw className="h-5 w-5 mr-2" />
										{t("reassemble_with_changes")}
										<Badge variant="secondary" className="ml-2 bg-[#223649]">
											5 {t("credits")}
										</Badge>
									</>
								)}
							</Button>
							<p className="text-xs text-gray-500 text-center">
								{t("reassemble_hint")}
							</p>
						</>
					)}

					{/* CASE 2: Assembly in progress - Show View Progress button */}
					{isAssemblyInProgress && (
						<>
							<Button
								onClick={() =>
									router.push(`/guided/step-6?projectId=${projectId}`)
								}
								className="w-full bg-[#0d7ff2] hover:bg-[#0c6fd1] text-white font-semibold py-4 px-8 rounded-lg text-lg"
							>
								<Loader2 className="h-5 w-5 mr-2 animate-spin" />
								{t("view_assembly_progress")}
							</Button>
							<p className="text-sm text-gray-400 text-center">
								{t("view_assembly_progress_hint")}
							</p>
						</>
					)}

					{/* CASE 3: Assembly failed - Show Retry button */}
					{isAssemblyFailed && (
						<>
							<Button
								onClick={() =>
									router.push(`/guided/step-6?projectId=${projectId}`)
								}
								className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-4 px-8 rounded-lg text-lg"
							>
								<AlertCircle className="h-5 w-5 mr-2" />
								{t("retry_assembly")}
							</Button>
							<p className="text-sm text-gray-400 text-center">
								{t("retry_assembly_hint")}
							</p>
						</>
					)}

					{/* CASE 4: Default - No assembly yet */}
					{!hasCompletedVideo && !isAssemblyInProgress && !isAssemblyFailed && (
						<>
							<Button
								onClick={handleContinue}
								disabled={
									isAssembling ||
									!project?.narrationAudioUrl ||
									!project?.musicAudioUrl ||
									!convexScenes?.length
								}
								className="w-full bg-[#0d7ff2] hover:bg-[#0c6fd1] text-white font-semibold py-4 px-8 rounded-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isAssembling ? (
									<Loader2 className="h-5 w-5 mr-2 animate-spin" />
								) : (
									<Sparkles className="h-5 w-5 mr-2" />
								)}
								{isAssembling
									? t("assembling") || "Assembling..."
									: t("assemble_render")}
							</Button>
							{!hasScenes && (
								<p className="text-sm text-gray-400 text-center">
									{t("no_scenes_warning")}
								</p>
							)}
							{hasScenes && totalDuration > 0 && (
								<p className="text-sm text-gray-400 text-center">
									{t("total_duration", { duration: totalDuration })}
								</p>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
}

export default function GuidedStep5() {
	return (
		<Suspense fallback={<Loading />}>
			<GuidedStep5Content />
		</Suspense>
	);
}
