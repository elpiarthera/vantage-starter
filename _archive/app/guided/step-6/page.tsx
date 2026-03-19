"use client";

import { useUser } from "@clerk/nextjs";
import { useAction, useMutation, useQuery } from "convex/react";
import {
	AlertCircle,
	AlertTriangle,
	ArrowLeft,
	CheckCircle,
	Copy,
	Download,
	Edit,
	ExternalLink,
	Facebook,
	Headphones,
	Home,
	Loader2,
	MessageCircle,
	Palette,
	Play,
	RefreshCw,
	Save,
	Share2,
	Sparkles,
	Twitter,
	Volume2,
	VolumeX,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { InsufficientCreditsModal } from "@/components/credits/InsufficientCreditsModal";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useCredits } from "@/hooks/business-logic/useCredits";
import { useProjectData } from "@/hooks/business-logic/useProjectData";
import { usePurchaseSuccessToast } from "@/hooks/business-logic/usePurchaseSuccessToast";
import { Link } from "@/i18n/routing";

// Loading component for Suspense
function Loading() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-[#101a23]">
			<Loader2 className="h-12 w-12 animate-spin text-[#0d7ff2]" />
		</div>
	);
}

function GuidedStep6Content() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { user } = useUser();
	const t = useTranslations("guided_step6");
	const locale = useLocale();

	// Get projectId from URL query params
	const projectIdFromUrl = searchParams.get("projectId");
	const projectId = projectIdFromUrl
		? (projectIdFromUrl as Id<"projects">)
		: undefined;

	// ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURN
	const [isRendering, setIsRendering] = useState(false);
	const [renderStep, setRenderStep] = useState(0);
	const [renderError, setRenderError] = useState(false);
	const [isPlaying, setIsPlaying] = useState(false);
	const [isMuted, setIsMuted] = useState(false);
	const [_currentTime, setCurrentTime] = useState(0);
	const [duration] = useState(30);
	const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
	const [templateName, setTemplateName] = useState("");
	const [isTemplatePublic, setIsTemplatePublic] = useState(false);
	const [isTemplateSaved, setIsTemplateSaved] = useState(false);
	const [isSavingTemplate, setIsSavingTemplate] = useState(false);
	const [shareToast, setShareToast] = useState("");
	const [showIterationModal, setShowIterationModal] = useState(false);
	const [customMessage, setCustomMessage] = useState("");
	const [includeRSVP, setIncludeRSVP] = useState(false);
	const [rsvpLink, setRsvpLink] = useState("");
	const [isAssembling, setIsAssembling] = useState(false);
	const [assemblyProgressDismissed, setAssemblyProgressDismissed] =
		useState(false);
	const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] =
		useState(false);
	const [requiredCredits, setRequiredCredits] = useState(5);
	const [isRegenerating, setIsRegenerating] = useState(false);
	const [regenerationProgressDismissed, setRegenerationProgressDismissed] =
		useState(false);
	const [_regenerationError, setRegenerationError] = useState<string | null>(
		null,
	);

	// Load project data from Convex
	const { project, isLoading: projectLoading } = useProjectData(projectId);
	const scenes = useQuery(api.scenes.list, projectId ? { projectId } : "skip");
	const videoGenerationCostData = useQuery(api.credits.getCreditCost, {
		actionType: "video_generation",
	});

	const scenesNeedingRegeneration = useMemo(
		() =>
			(scenes ?? []).filter(
				(s) => s.needsRegeneration === true && s.status !== "generating",
			),
		[scenes],
	);
	const hasScenesToRegenerate = scenesNeedingRegeneration.length > 0;
	const hasRegenerationFailure = (scenes ?? []).some(
		(s) => s.needsRegeneration === true && s.status === "failed",
	);

	const allFlaggedScenesComplete =
		!hasScenesToRegenerate &&
		!isRegenerating &&
		(scenes ?? []).every((s) => s.needsRegeneration !== true);

	const hasTriggeredRegeneration = useRef(false);
	const hasAutoTriggeredReassembly = useRef(false);

	const assemblyStatus = project?.assemblyStatus;
	const finalVideoUrl = project?.finalVideoUrl;
	const buildFinalVideo = useAction(api.actions.videoAssembly.buildFinalVideo);
	const assemblyCostCredits = 5;
	const VIDEO_GENERATION_CREDITS = videoGenerationCostData?.credits ?? 20;
	const { balance } = useCredits(user?.id ?? "");
	usePurchaseSuccessToast();

	// Mutation to update project status
	const updateProject = useMutation(api.projects.update);
	const createTemplate = useMutation(api.templates.create);
	const generateVideoAction = useAction(
		api.actions.videoGeneration.generateVideo,
	);
	const deductCreditsMutation = useMutation(api.credits.deductCreditsPublic);
	const refundCreditsMutation = useMutation(api.credits.refundCreditsPublic);
	const markNeedsRegeneration = useMutation(api.scenes.markNeedsRegeneration);

	// Redirect to Step 1 if projectId is missing (graceful handling)
	useEffect(() => {
		if (!projectIdFromUrl) {
			console.warn("Missing projectId in URL - redirecting to Step 1");
			router.replace("/guided/step-1");
		}
	}, [projectIdFromUrl, router]);

	// Regeneration trigger: auto-start video regeneration for flagged scenes on Step 6 entry
	// biome-ignore lint/correctness/useExhaustiveDependencies: useRef guard (hasTriggeredRegeneration) prevents re-firing; intentionally fires only once on mount when scenes need regeneration
	useEffect(() => {
		if (!hasScenesToRegenerate) return;
		if (!projectId || !project || !scenes) return;
		if (hasTriggeredRegeneration.current) return;

		hasTriggeredRegeneration.current = true;
		setIsRegenerating(true);
		setRegenerationProgressDismissed(false); // reset dismiss state for new cycle

		const triggerRegeneration = async () => {
			for (const scene of scenesNeedingRegeneration) {
				const startFrameUrl =
					scene.videoGeneration?.startFrameUrl ??
					scene.startFrameImageUrl ??
					(typeof scene.startFrame === "string" ? scene.startFrame : "");
				const endFrameUrl =
					scene.videoGeneration?.endFrameUrl ??
					scene.endFrameImageUrl ??
					(typeof scene.endFrame === "string" ? scene.endFrame : undefined);

				if (!startFrameUrl) {
					console.error(
						`[Step 6] Scene ${scene._id} missing start frame — skipping`,
					);
					await markNeedsRegeneration({ sceneId: scene._id, value: false });
					continue;
				}

				if ((balance ?? 0) < VIDEO_GENERATION_CREDITS) {
					setShowInsufficientCreditsModal(true);
					setIsRegenerating(false);
					hasTriggeredRegeneration.current = false;
					return;
				}

				let transactionId: Id<"creditTransactions"> | undefined;

				try {
					const deductResult = await deductCreditsMutation({
						clerkUserId: user?.id ?? "",
						actionType: "video_generation",
						projectId: projectId as string,
					});

					if (!deductResult.success) {
						setShowInsufficientCreditsModal(true);
						setIsRegenerating(false);
						hasTriggeredRegeneration.current = false;
						return;
					}
					transactionId = deductResult.transactionId;

					const cinematicStylesArray = scene.cinematicStyles
						? [
								scene.cinematicStyles.ambiance,
								scene.cinematicStyles.cameraMovement,
								scene.cinematicStyles.colorTone,
								scene.cinematicStyles.visualStyle,
							].filter((s): s is string => Boolean(s))
						: undefined;

					await generateVideoAction({
						sceneId: scene._id,
						sceneDescription: scene.description || "",
						startFrameUrl,
						endFrameUrl,
						cinematicStyles: cinematicStylesArray,
						duration: scene.duration || 10,
						visualStyle: project?.visualStyle,
						occasion: project?.occasion,
						theme: project?.theme,
						emotionalStory: project?.eventDetails?.emotionalStory,
					});

					await markNeedsRegeneration({ sceneId: scene._id, value: false });
				} catch (error) {
					console.error(
						`[Step 6] Regeneration failed for scene ${scene._id}:`,
						error,
					);
					setIsRegenerating(false);
					if (transactionId) {
						try {
							await refundCreditsMutation({
								transactionId,
								reason: "regeneration_failed",
							});
						} catch (refundError) {
							console.error("[Step 6] Refund failed:", refundError);
						}
					}
				}
			}
		};

		triggerRegeneration().catch(console.error);
	}, [hasScenesToRegenerate]); // eslint-disable-line react-hooks/exhaustive-deps — useRef guard prevents re-firing

	// Clear isRegenerating when all flagged scenes are done
	useEffect(() => {
		if (!isRegenerating) return;
		const allDone = (scenes ?? [])
			.filter((s) => s.needsRegeneration === true)
			.every((s) => s.status === "completed" || s.status === "failed");
		if (allDone) {
			setIsRegenerating(false);
			hasTriggeredRegeneration.current = false;
		}
	}, [scenes, isRegenerating]);

	// Auto-reassembly after regeneration completes is defined after handleAssemble below

	const renderSteps = [
		t("render_step_clips"),
		t("render_step_merge"),
		t("render_step_audio"),
		t("render_step_polish"),
	];

	const _emotionalTimestamps = [
		{ time: 5, label: t("timestamp_joy"), emoji: "❤️" },
		{ time: 15, label: t("timestamp_heartfelt"), emoji: "💕" },
		{ time: 25, label: t("timestamp_celebration"), emoji: "🎉" },
	];

	// Load eventDetails from Convex project
	useEffect(() => {
		if (project && !projectLoading) {
			const eventDetails = project.eventDetails;
			if (eventDetails?.rsvpLink) {
				setRsvpLink(eventDetails.rsvpLink);
				setIncludeRSVP(true);
				if (!customMessage.includes(eventDetails.rsvpLink)) {
					setCustomMessage(
						(prev) => `${prev}\n\nRSVP: ${eventDetails.rsvpLink}`,
					);
				}
			}
		}
	}, [project, projectLoading, customMessage]);

	const handleRSVPToggle = (checked: boolean) => {
		setIncludeRSVP(checked);

		if (checked && rsvpLink) {
			if (!customMessage.includes(rsvpLink)) {
				setCustomMessage((prev) => `${prev}\n\nRSVP: ${rsvpLink}`);
			}
		} else if (!checked && rsvpLink) {
			setCustomMessage((prev) =>
				prev
					.replace(`\n\nRSVP: ${rsvpLink}`, "")
					.replace(`RSVP: ${rsvpLink}`, ""),
			);
		}
	};

	const handleAssemble = async () => {
		if (!projectId || !project) {
			setShareToast(t("toast_project_not_found"));
			setTimeout(() => setShareToast(""), 2000);
			return;
		}

		if (!project.narrationAudioUrl) {
			setShareToast(t("toast_narration_missing"));
			setTimeout(() => setShareToast(""), 2000);
			return;
		}

		if (!scenes?.length) {
			setShareToast(t("toast_no_scenes"));
			setTimeout(() => setShareToast(""), 2000);
			return;
		}

		const required = assemblyCostCredits;
		setRequiredCredits(required);
		if (balance < required) {
			setShowInsufficientCreditsModal(true);
			return;
		}

		setIsAssembling(true);
		try {
			await buildFinalVideo({
				projectId,
				sceneIds: scenes.map((scene) => scene._id as Id<"scenes">),
				narrationUrl: project.narrationAudioUrl,
				musicUrl: project.musicAudioUrl as string, // Required - user must select music
				narrationDurationMs: project.narrationDurationMs,
				targetResolution: "1080p",
				transitionConfig: project.transitionConfig ?? { mode: "hard_cut" },
			});
		} catch (error) {
			console.error("[Step 6] Assembly failed:", error);
			setShareToast(t("toast_assembly_failed"));
			setTimeout(() => setShareToast(""), 3000);
		} finally {
			setIsAssembling(false);
		}
	};

	// Auto-reassembly after regeneration completes
	// biome-ignore lint/correctness/useExhaustiveDependencies: useRef guard (hasAutoTriggeredReassembly) prevents re-firing; handleAssemble and updateProject are stable Convex-generated functions
	useEffect(() => {
		if (!allFlaggedScenesComplete) return;
		if (!hasTriggeredRegeneration.current) return;
		if (hasAutoTriggeredReassembly.current) return;
		if (!projectId || !project?.narrationAudioUrl) return;
		if (
			assemblyStatus !== "completed" &&
			assemblyStatus !== "failed" &&
			assemblyStatus !== undefined
		)
			return;

		const autoReassemble = async () => {
			if (assemblyStatus === "completed" || assemblyStatus === "failed") {
				await updateProject({
					projectId: projectId as Id<"projects">,
					// assemblyStatus intentionally omitted → clears field to undefined
				});
			}
			hasAutoTriggeredReassembly.current = true;
			await handleAssemble();
		};

		autoReassemble().catch(console.error);
	}, [
		allFlaggedScenesComplete,
		assemblyStatus,
		projectId,
		project?.narrationAudioUrl,
	]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		if (isRendering) {
			const stepsCount = renderSteps.length;
			const stepInterval = setInterval(() => {
				setRenderStep((prev) => {
					if (prev < stepsCount - 1) {
						return prev + 1;
					} else {
						clearInterval(stepInterval);
						setTimeout(() => {
							setIsRendering(false);
						}, 1000);
						return prev;
					}
				});
			}, 2000);

			return () => clearInterval(stepInterval);
		}
	}, [isRendering, renderSteps.length]);

	useEffect(() => {
		let interval: NodeJS.Timeout;
		if (isPlaying && !isRendering) {
			interval = setInterval(() => {
				setCurrentTime((prev) => {
					if (prev >= duration) {
						setIsPlaying(false);
						return 0;
					}
					return prev + 1;
				});
			}, 1000);
		}
		return () => clearInterval(interval);
	}, [isPlaying, duration, isRendering]);

	const handleDownloadVideo = () => {
		if (!projectId || !finalVideoUrl) return;
		const url = `/api/download-video?projectId=${encodeURIComponent(projectId)}`;
		const a = document.createElement("a");
		a.href = url;
		a.download = "my-short-reel.mp4";
		a.target = "_blank";
		a.rel = "noopener noreferrer";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	};

	const handleShare = (platform: string) => {
		const message = customMessage;
		// Use public watch page URL with locale prefix
		const shareUrl = projectId
			? `${window.location.origin}/${locale}/watch/${projectId}`
			: window.location.href;

		switch (platform) {
			case "twitter":
				window.open(
					`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(shareUrl)}`,
				);
				break;
			case "facebook":
				window.open(
					`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
				);
				break;
			case "whatsapp":
				window.open(
					`https://wa.me/?text=${encodeURIComponent(`${message} ${shareUrl}`)}`,
				);
				break;
			case "copy":
				navigator.clipboard.writeText(shareUrl);
				setShareToast(t("toast_link_copied"));
				setTimeout(() => setShareToast(""), 2000);
				break;
		}
	};

	const handleSaveTemplate = async () => {
		if (!templateName.trim() || !projectId || !project) return;

		setIsSavingTemplate(true);
		try {
			const typeMap: Record<
				string,
				"wedding" | "birthday" | "anniversary" | "business" | "custom"
			> = {
				wedding: "wedding",
				birthday: "birthday",
				anniversary: "anniversary",
				business: "business",
			};
			const occasion = (project.occasion ?? "").toLowerCase();
			const type = typeMap[occasion] ?? "custom";

			const defaultScenes = (scenes ?? []).map((scene) => ({
				sceneNumber: scene.sceneNumber,
				title: scene.title,
				description: scene.description,
				duration: scene.duration,
				cinematicStyles: scene.cinematicStyles ?? undefined,
				startFrameUrl: (
					scene as { videoGeneration?: { startFrameUrl?: string } }
				)?.videoGeneration?.startFrameUrl,
				endFrameUrl: (scene as { videoGeneration?: { endFrameUrl?: string } })
					?.videoGeneration?.endFrameUrl,
			}));

			// Build the full validated story from step 2 (title + narration + scenes)
			const generatedStory = (
				project as {
					generatedStory?: {
						title?: string;
						narration?: string;
						emotionalArc?: string;
						scenes?: { number: number; description: string; mood: string }[];
						musicSuggestion?: string;
					};
				}
			).generatedStory;
			let validatedStory = "";
			if (generatedStory) {
				const parts: string[] = [];
				if (generatedStory.title) parts.push(generatedStory.title);
				if (generatedStory.narration) parts.push(generatedStory.narration);
				if (generatedStory.emotionalArc)
					parts.push(`Emotional Arc: ${generatedStory.emotionalArc}`);
				if (generatedStory.scenes && generatedStory.scenes.length > 0) {
					for (const scene of generatedStory.scenes) {
						parts.push(
							`Scene ${scene.number}: ${scene.description} (${scene.mood})`,
						);
					}
				}
				validatedStory = parts.join("\n\n");
			}

			await createTemplate({
				name: templateName.trim(),
				description: project.eventDetails?.description ?? "",
				category: project.occasion ?? "",
				type,
				projectId,
				thumbnail: project.finalVideoUrl ?? undefined,
				config: {
					defaultScenes,
					defaultSettings: (project as { step4Data?: object }).step4Data ?? {},
					suggestedMusic: project.musicAudioUrl ? [project.musicAudioUrl] : [],
					suggestedStyles: project.visualStyle ? [project.visualStyle] : [],
					emotionalStory: project.eventDetails?.emotionalStory ?? "",
					approvedNarrationScript:
						(project as { approvedNarrationScript?: string })
							.approvedNarrationScript ?? "",
					validatedStory,
				},
				isPublic: isTemplatePublic,
			});
			setIsTemplateSaved(true);
			setIsTemplateModalOpen(false);
			setShareToast(t("toast_template_saved"));
			setTimeout(() => setShareToast(""), 3000);
		} catch (_error) {
			setShareToast(t("toast_template_failed"));
			setTimeout(() => setShareToast(""), 3000);
		} finally {
			setIsSavingTemplate(false);
		}
	};

	const handleRetryRender = () => {
		setRenderError(false);
		setIsRendering(true);
		setRenderStep(0);
	};

	// Show loading while redirecting or if no projectId
	if (!projectIdFromUrl) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[#101a23]">
				<Loader2 className="h-12 w-12 animate-spin text-[#0d7ff2]" />
			</div>
		);
	}

	const handleIterationChoice = (step: string) => {
		setShowIterationModal(false);
		router.push(`/guided/${step}?projectId=${projectId}&returnTo=step-6`);
	};

	const handleFinishAndSaveToDashboard = async () => {
		if (!projectId) {
			setShareToast(t("toast_project_id_missing"));
			setTimeout(() => setShareToast(""), 3000);
			return;
		}

		try {
			// Update project status to completed
			await updateProject({
				projectId,
				status: "completed",
			});

			console.log("[Step 6] Project marked as completed:", projectId);

			// Show success message
			setShareToast(t("toast_video_saved"));
			setTimeout(() => setShareToast(""), 2000);

			setTimeout(() => {
				router.push("/dashboard/projects");
			}, 2000);
		} catch (error) {
			console.error("[Step 6] Failed to save video:", error);
			setShareToast(t("toast_save_failed"));
			setTimeout(() => setShareToast(""), 3000);
		}
	};

	// Assembly status screens (takes precedence)
	if (
		assemblyStatus &&
		assemblyStatus !== "completed" &&
		assemblyStatus !== "failed" &&
		!assemblyProgressDismissed
	) {
		const PROGRESS_MAP: Record<string, number> = {
			preparing_assets: 10,
			processing_media: 50,
			finalizing_video: 80,
			saving_video: 95,
		};
		const STATUS_MESSAGES: Record<string, string> = {
			preparing_assets: t("status_preparing_assets"),
			processing_media: t("status_processing_media"),
			finalizing_video: t("status_finalizing_video"),
			saving_video: t("status_saving_video"),
		};

		const progressValue = PROGRESS_MAP[assemblyStatus] || 10;
		return (
			<div className="min-h-screen flex items-center justify-center bg-[#101a23] p-4">
				<Card className="w-full max-w-2xl border border-[#314d68] bg-[#182634] text-white">
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="flex items-center gap-2 text-white">
								<Loader2 className="h-5 w-5 animate-spin text-[#0d7ff2]" />
								{t("assembly_in_progress")}
							</CardTitle>
							<Button
								variant="ghost"
								onClick={() => setAssemblyProgressDismissed(true)}
								className="text-gray-400 hover:text-white min-h-[44px] px-3"
							>
								{t("assembly_view_in_background")}
							</Button>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						<div
							role="progressbar"
							aria-valuenow={progressValue}
							aria-valuemin={0}
							aria-valuemax={100}
							aria-label={t("assembly_progress_aria_label")}
							className="w-full bg-[#314d68] rounded-full h-3"
						>
							<div
								className="bg-[#0d7ff2] h-3 rounded-full transition-all duration-500"
								style={{ width: `${progressValue}%` }}
							/>
						</div>
						<p
							className="text-sm text-gray-300 animate-pulse text-center"
							aria-live="polite"
							aria-atomic="true"
						>
							{STATUS_MESSAGES[assemblyStatus] ?? t("status_processing")}
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	// NOTE: Removed simplified "completed" early return - full UI handles this case
	// The full UI (below) shows the real video when finalVideoUrl exists

	if (assemblyStatus === "failed") {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[#101a23] p-4">
				<Card className="w-full max-w-2xl border border-red-500/40 bg-[#182634] text-white">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-white">
							<AlertCircle className="h-5 w-5 text-red-400" />
							{t("assembly_failed_title")}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<p className="text-sm text-gray-300">
							{t("assembly_failed_description")}
						</p>
					</CardContent>
					<CardFooter className="flex justify-end">
						<Button onClick={handleAssemble} disabled={isAssembling}>
							<RefreshCw className="h-4 w-4 mr-2" />
							{t("retry_button")}
						</Button>
					</CardFooter>
				</Card>
			</div>
		);
	}

	// ============================================
	// FAKE RENDERING ANIMATION (for demo/preview - not auto-started)
	// ============================================
	if (isRendering) {
		return (
			<div
				style={{ backgroundColor: "#101a23" }}
				className="min-h-screen flex items-center justify-center text-white"
			>
				<div className="text-center max-w-md mx-auto px-4">
					<div className="relative mb-8">
						<div className="w-32 h-32 border-4 border-[#0d7ff2] border-t-transparent rounded-full animate-spin mx-auto"></div>
						<div className="absolute inset-0 flex items-center justify-center">
							<div className="w-16 h-16 bg-[#0d7ff2] rounded-full animate-pulse"></div>
						</div>
					</div>

					<h2 className="text-3xl font-bold mb-6">
						{t("assembling_masterpiece")}
					</h2>

					<div className="space-y-4 mb-8">
						{renderSteps.map((step, idx) => (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: renderSteps is a static array that never reorders
								key={`render-step-${idx}`}
								className="flex items-center gap-3 text-left"
							>
								{idx < renderStep ? (
									<CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
								) : idx === renderStep ? (
									<div className="h-5 w-5 border-2 border-[#0d7ff2] border-t-transparent rounded-full animate-spin flex-shrink-0" />
								) : (
									<div className="h-5 w-5 border-2 border-[#314d68] rounded-full flex-shrink-0" />
								)}
								<span
									className={idx <= renderStep ? "text-white" : "text-gray-400"}
								>
									{step}
								</span>
							</div>
						))}
					</div>

					<div
						style={{ backgroundColor: "#182634" }}
						className="rounded-lg p-4 border border-[#314d68]"
					>
						<div className="flex justify-between text-sm mb-2">
							<span>{t("progress_label")}</span>
							<span>
								{Math.round(((renderStep + 1) / renderSteps.length) * 100)}%
							</span>
						</div>
						<div className="w-full bg-[#314d68] rounded-full h-2">
							<div
								className="bg-[#0d7ff2] h-2 rounded-full transition-all duration-500"
								style={{
									width: `${((renderStep + 1) / renderSteps.length) * 100}%`,
								}}
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (renderError) {
		return (
			<div
				style={{ backgroundColor: "#101a23" }}
				className="min-h-screen flex items-center justify-center p-4 text-white"
			>
				<div className="text-center max-w-md mx-auto">
					<AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
					<h2 className="text-2xl font-bold text-red-400 mb-2">
						{t("render_failed_title")}
					</h2>
					<p className="text-gray-300 mb-6">{t("render_failed_description")}</p>
					<Button
						onClick={handleRetryRender}
						className="bg-[#0d7ff2] hover:bg-[#0c6fd1]"
					>
						<RefreshCw className="h-4 w-4 mr-2" />
						{t("retry_render")}
					</Button>
				</div>
			</div>
		);
	}

	if (
		isRegenerating &&
		!hasRegenerationFailure &&
		!regenerationProgressDismissed
	) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[#101a23] p-4">
				<Card className="w-full max-w-2xl border border-[#314d68] bg-[#182634] text-white">
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="flex items-center gap-2 text-white">
								<Loader2 className="h-5 w-5 animate-spin text-[#0d7ff2]" />
								{t("regenerating_updated_scenes")}
							</CardTitle>
							<Button
								variant="ghost"
								onClick={() => setRegenerationProgressDismissed(true)}
								className="text-gray-400 hover:text-white min-h-[44px] px-3"
							>
								{t("assembly_view_in_background")}
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-gray-300">
							{t("regenerating_scenes_description", {
								count: scenesNeedingRegeneration.length,
							})}
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (hasRegenerationFailure) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[#101a23] p-4">
				<Card className="w-full max-w-2xl border border-red-500/40 bg-[#182634] text-white">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-white">
							<AlertTriangle className="h-5 w-5 text-red-400" />
							{t("regeneration_failed_title")}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="text-sm text-gray-300">
							{t("regeneration_failed_description")}
						</p>
						<Button
							onClick={() => {
								setIsRegenerating(false);
								setRegenerationError(null);
								hasTriggeredRegeneration.current = false;
								for (const scene of (scenes ?? []).filter(
									(s) => s.needsRegeneration === true && s.status === "failed",
								)) {
									markNeedsRegeneration({ sceneId: scene._id, value: false });
								}
								router.push(`/guided/step-3?projectId=${projectId}`);
							}}
							className="bg-[#0d7ff2] hover:bg-[#0a6fd4] text-white min-h-[44px]"
						>
							{t("regeneration_failed_cta")}
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div
			style={{ backgroundColor: "#101a23" }}
			className="min-h-screen text-white"
		>
			<div
				style={{ backgroundColor: "#182634" }}
				className="border-b border-[#314d68] p-4 fixed top-0 w-full z-40"
			>
				<div className="max-w-4xl mx-auto flex items-center justify-between">
					<Link href={`/guided/step-5?projectId=${projectId}`}>
						<Button
							variant="ghost"
							className="text-white hover:bg-[#223649]"
							aria-label={t("back_aria_label")}
						>
							<ArrowLeft className="h-4 w-4 mr-2" />
							{t("back")}
						</Button>
					</Link>

					<div className="flex items-center gap-2">
						{[1, 2, 3, 4, 5, 6].map((step) => (
							<div
								key={step}
								className="w-8 h-8 rounded-full bg-[#0d7ff2] text-white text-sm font-medium flex items-center justify-center"
							>
								{step}
							</div>
						))}
					</div>

					<Link href="/">
						<Button
							variant="ghost"
							className="text-white hover:bg-[#223649]"
							aria-label={t("home_aria_label")}
						>
							<Home className="h-4 w-4 mr-2" />
							{t("home")}
						</Button>
					</Link>
				</div>
			</div>

			<div className="pt-24 p-4">
				<div className="max-w-4xl mx-auto">
					<div className="text-center mb-8">
						<h1 className="text-4xl font-bold mb-2">{t("title")}</h1>
						<p className="text-xl text-[#0d7ff2] italic">{t("subtitle")}</p>
					</div>

					{/* Sprint 21: Assembly button moved to Step 5 - commenting out, not deleting
					<div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-[#182634] border border-[#314d68] rounded-xl px-4 py-3">
						<div className="flex items-center gap-3 text-sm text-gray-300">
							<Badge variant="secondary" className="bg-[#0d7ff2]/20 text-white">
								{t("credits_for_assembly", { credits: assemblyCostCredits })}
							</Badge>
							<span className="text-xs text-[#9eb8d0]">
								{t("balance_display", { balance })}
							</span>
						</div>
						<Button
							onClick={handleAssemble}
							disabled={isAssembling}
							className="bg-[#0d7ff2] hover:bg-[#0c6fd1]"
						>
							{isAssembling ? (
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
							) : (
								<Sparkles className="h-4 w-4 mr-2" />
							)}
							{t("assemble_final_video")}
						</Button>
					</div>
					*/}

					<Card
						style={{ backgroundColor: "#182634" }}
						className="mb-8 overflow-hidden border-[#314d68]"
					>
						<div className="relative bg-black aspect-video max-h-[70vh] mx-auto">
							{/* Show REAL video if available, otherwise placeholder */}
							{finalVideoUrl ? (
								<video
									src={finalVideoUrl}
									controls
									muted={isMuted}
									className="w-full h-full object-contain"
									onPlay={() => setIsPlaying(true)}
									onPause={() => setIsPlaying(false)}
								>
									<track kind="captions" />
								</video>
							) : (
								<>
									<div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center">
										<div className="text-center text-white">
											<div className="text-6xl mb-4">🎥</div>
											<h3 className="text-2xl font-bold mb-2">
												{t("your_invitation_movie")}
											</h3>
											<p className="text-gray-300">
												{t("click_assemble_to_create")}
											</p>
										</div>
									</div>

									<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
										<div className="flex items-center gap-4 mb-2">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setIsPlaying(!isPlaying)}
												className="text-white hover:bg-white/20"
												disabled
											>
												<Play className="h-5 w-5" />
											</Button>

											<div className="flex-1 bg-white/30 rounded-full h-2">
												<div className="bg-white/50 h-2 rounded-full w-0" />
											</div>

											<span className="text-white text-sm">0:00</span>

											<Button
												variant="ghost"
												size="sm"
												onClick={() => setIsMuted(!isMuted)}
												className="text-white hover:bg-white/20"
											>
												{isMuted ? (
													<VolumeX className="h-5 w-5" />
												) : (
													<Volume2 className="h-5 w-5" />
												)}
											</Button>
										</div>
									</div>
								</>
							)}
						</div>
						{finalVideoUrl && (
							<CardFooter className="flex justify-between items-center p-4 border-t border-[#314d68]">
								<span className="text-sm text-gray-400">
									{t("scenes_count", { count: scenes?.length ?? 0 })}
								</span>
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => window.open(finalVideoUrl, "_blank")}
										className="text-white border-[#314d68] hover:bg-[#223649]"
									>
										<ExternalLink className="h-4 w-4 mr-2" />
										{t("open_in_tab")}
									</Button>
								</div>
							</CardFooter>
						)}
					</Card>

					<div className="grid lg:grid-cols-2 gap-6 mb-8">
						<Card
							style={{ backgroundColor: "#182634" }}
							className="border-[#314d68]"
						>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-white">
									<Share2 className="h-5 w-5" />
									{t("share_the_moment")}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-gray-300 mb-4">{t("share_description")}</p>
								<div className="space-y-4 mb-4">
									<div>
										<label
											htmlFor="customMessage"
											className="text-sm text-gray-300 mb-2 block"
										>
											{t("your_message")}
										</label>
										<Textarea
											id="customMessage"
											value={customMessage}
											onChange={(e) => setCustomMessage(e.target.value)}
											placeholder={t("message_placeholder")}
											className="bg-[#223649] border-[#314d68] text-white placeholder:text-gray-400 min-h-[100px]"
										/>
									</div>
									<div className="flex items-center space-x-2">
										<Checkbox
											id="include-rsvp"
											checked={includeRSVP}
											onCheckedChange={handleRSVPToggle}
											className="border-[#314d68] data-[state=checked]:bg-[#0d7ff2]"
										/>
										<label
											htmlFor="include-rsvp"
											className="text-sm text-gray-300 cursor-pointer"
										>
											{t("include_rsvp_message")}
										</label>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<Button
										variant="outline"
										onClick={() => handleShare("whatsapp")}
										className="flex items-center gap-2 h-auto py-3 border-[#314d68] text-white hover:bg-[#223649]"
									>
										<MessageCircle className="h-5 w-5" />
										<span>{t("share_whatsapp")}</span>
									</Button>
									<Button
										variant="outline"
										onClick={() => handleShare("twitter")}
										className="flex items-center gap-2 h-auto py-3 border-[#314d68] text-white hover:bg-[#223649]"
									>
										<Twitter className="h-5 w-5" />
										<span>{t("share_twitter")}</span>
									</Button>
									<Button
										variant="outline"
										onClick={() => handleShare("facebook")}
										className="flex items-center gap-2 h-auto py-3 border-[#314d68] text-white hover:bg-[#223649]"
									>
										<Facebook className="h-5 w-5" />
										<span>{t("share_facebook")}</span>
									</Button>
									<Button
										variant="outline"
										onClick={() => handleShare("copy")}
										className="flex items-center gap-2 h-auto py-3 border-[#314d68] text-white hover:bg-[#223649] col-span-2"
									>
										<Copy className="h-5 w-5" />
										<span>{t("copy_share_link")}</span>
									</Button>
								</div>
							</CardContent>
						</Card>

						<Card
							style={{ backgroundColor: "#182634" }}
							className="border-[#314d68]"
						>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-white">
									<Download className="h-5 w-5" />
									{t("download_save")}
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<Button
									variant="outline"
									className="w-full border-[#314d68] text-white hover:bg-[#223649] bg-transparent"
									onClick={handleDownloadVideo}
									disabled={!finalVideoUrl}
								>
									<Download className="h-4 w-4 mr-2" />
									{t("download_your_film")}
								</Button>

								<Dialog
									open={isTemplateModalOpen}
									onOpenChange={setIsTemplateModalOpen}
								>
									<DialogTrigger asChild>
										<Button
											variant="outline"
											className="w-full border-[#314d68] text-white hover:bg-[#223649] bg-transparent"
											disabled={isTemplateSaved}
										>
											<Save className="h-4 w-4 mr-2" />
											{isTemplateSaved
												? t("template_saved_button")
												: t("save_as_template")}
										</Button>
									</DialogTrigger>
									<DialogContent
										style={{ backgroundColor: "#182634" }}
										className="border-[#314d68] text-white"
										aria-describedby={undefined}
									>
										<DialogHeader>
											<DialogTitle className="text-white">
												{t("template_modal_title")}
											</DialogTitle>
										</DialogHeader>
										<div className="space-y-4">
											<Input
												placeholder={t("template_name_placeholder")}
												value={templateName}
												onChange={(e) => setTemplateName(e.target.value)}
												className="bg-[#223649] border-[#314d68] text-white"
											/>
											<div className="flex items-center space-x-2">
												<Checkbox
													id="template-public"
													checked={isTemplatePublic}
													onCheckedChange={(checked) =>
														setIsTemplatePublic(checked === true)
													}
													className="border-[#314d68] data-[state=checked]:bg-[#0d7ff2]"
												/>
												<label
													htmlFor="template-public"
													className="text-sm text-gray-300 cursor-pointer"
												>
													{t("template_make_public")}
												</label>
											</div>
											<div className="flex gap-2">
												<Button
													onClick={handleSaveTemplate}
													disabled={!templateName.trim() || isSavingTemplate}
													className="flex-1 bg-[#0d7ff2] hover:bg-[#0c6fd1]"
												>
													{isSavingTemplate
														? t("saving_template")
														: t("save_template")}
												</Button>
												<Button
													variant="outline"
													onClick={() => setIsTemplateModalOpen(false)}
													className="border-[#314d68] text-white hover:bg-[#223649]"
												>
													{t("cancel")}
												</Button>
											</div>
										</div>
									</DialogContent>
								</Dialog>
							</CardContent>
						</Card>
					</div>

					<div className="text-center mb-8">
						<Button
							variant="outline"
							onClick={() => setShowIterationModal(true)}
							className="border-[#314d68] text-white hover:bg-[#223649]"
						>
							{t("make_a_change")}
						</Button>
					</div>

					<Dialog
						open={showIterationModal}
						onOpenChange={setShowIterationModal}
					>
						<DialogContent
							style={{ backgroundColor: "#182634" }}
							className="border-[#314d68] text-white"
							aria-describedby={undefined}
						>
							<DialogHeader>
								<DialogTitle className="text-white">
									{t("iteration_modal_title")}
								</DialogTitle>
							</DialogHeader>
							<div className="space-y-3">
								<Button
									onClick={() => handleIterationChoice("step-2")}
									className="w-full justify-start bg-[#223649] hover:bg-[#314d68] text-white"
								>
									<Edit className="h-4 w-4 mr-2" />
									{t("edit_story_script")}
								</Button>
								<Button
									onClick={() => handleIterationChoice("step-3")}
									className="w-full justify-start bg-[#223649] hover:bg-[#314d68] text-white"
								>
									<Palette className="h-4 w-4 mr-2" />
									{t("edit_visuals_styles")}
								</Button>
								<Button
									onClick={() => handleIterationChoice("step-4")}
									className="w-full justify-start bg-[#223649] hover:bg-[#314d68] text-white"
								>
									<Headphones className="h-4 w-4 mr-2" />
									{t("edit_sound_audio")}
								</Button>
							</div>
						</DialogContent>
					</Dialog>

					<div className="text-center">
						<Button
							onClick={handleFinishAndSaveToDashboard}
							className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
						>
							<Sparkles className="h-4 w-4 mr-2" />
							{t("finish_dashboard")}
						</Button>
					</div>
				</div>
			</div>

			{shareToast && (
				<div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
					{shareToast}
				</div>
			)}

			<InsufficientCreditsModal
				isOpen={showInsufficientCreditsModal}
				onClose={() => {
					setShowInsufficientCreditsModal(false);
					hasAutoTriggeredReassembly.current = false; // Allow retry after credits top-up
				}}
				required={requiredCredits}
				available={balance ?? 0}
				returnUrl={
					typeof window !== "undefined" ? window.location.href : undefined
				}
			/>
		</div>
	);
}

export default function GuidedStep6() {
	return (
		<Suspense fallback={<Loading />}>
			<GuidedStep6Content />
		</Suspense>
	);
}
