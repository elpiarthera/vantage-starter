"use client";

import { useUser } from "@clerk/nextjs";
import { useAction, useMutation, useQuery } from "convex/react";
import { ArrowLeft, CreditCard, Home, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { InsufficientCreditsModal } from "@/components/credits/InsufficientCreditsModal";
import { PurchaseCreditsModal } from "@/components/dashboard/account/modals/PurchaseCreditsModal";
import { SceneManager } from "@/components/scene-management/SceneManager";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import type { Scene } from "@/components/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useCredits } from "@/hooks/business-logic/useCredits";
import { usePurchaseSuccessToast } from "@/hooks/business-logic/usePurchaseSuccessToast";
import { useSceneData } from "@/hooks/business-logic/useSceneData";
import { Link } from "@/i18n/routing";

// Zustand hydration removed - no longer needed after full Convex migration

// Loading component for Suspense
function Loading() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-[#101a23]">
			<Loader2 className="h-12 w-12 animate-spin text-[#0d7ff2]" />
		</div>
	);
}

function Step3Content() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { user } = useUser();
	const t = useTranslations("guided_step3");
	const tCredits = useTranslations("credits");

	// Get projectId from URL query params
	const projectIdFromUrl = searchParams.get("projectId");
	const projectId = projectIdFromUrl
		? (projectIdFromUrl as Id<"projects">)
		: undefined;
	const returnTo = searchParams.get("returnTo");

	// ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURN

	// Credit system for video generation
	const videoGenerationCostData = useQuery(api.credits.getCreditCost, {
		actionType: "video_generation",
	});
	const VIDEO_GENERATION_CREDITS = videoGenerationCostData?.credits ?? 20;
	const { balance: currentCredits, isLoading: creditsLoading } = useCredits(
		user?.id || "",
	);
	usePurchaseSuccessToast();
	const deductCredits = useMutation(api.credits.deductCreditsPublic);
	const refundCredits = useMutation(api.credits.refundCreditsPublic);
	const markNeedsRegeneration = useMutation(api.scenes.markNeedsRegeneration);

	// Video generation action
	const generateVideoAction = useAction(
		api.actions.videoGeneration.generateVideo,
	);

	// Modal state for insufficient credits
	const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] =
		useState(false);
	const [showPurchaseModal, setShowPurchaseModal] = useState(false);
	// The scene that triggered the insufficient-credits modal — persisted
	// through the Polar redirect via URL param so the auto-trigger on return
	// can resume generation for the correct scene (not just "first pending").
	const [pendingSceneIdForCredits, setPendingSceneIdForCredits] = useState<
		string | null
	>(searchParams.get("pendingSceneId"));

	// Load scenes from Convex FIRST (moved up so we can derive state from it)
	const {
		scenes: convexScenes,
		isLoading: scenesLoading,
		update: updateSceneInConvex,
		saveNow: saveSceneNow, // Immediate save (no debounce) for validation
		create: createSceneInConvex,
		remove: removeSceneInConvex,
	} = useSceneData(projectId);

	// DERIVED STATE FROM CONVEX - No local state needed!
	// Video generation states derived from Convex scenes
	const videoGenerationStates = useMemo(() => {
		const states: Record<
			string,
			"idle" | "generating" | "completed" | "error"
		> = {};
		for (const scene of convexScenes || []) {
			const sceneId = scene._id as string;
			if (scene.status === "completed" || scene.videoUrl) {
				states[sceneId] = "completed";
			} else if (scene.status === "generating") {
				states[sceneId] = "generating";
			} else if (scene.status === "failed") {
				states[sceneId] = "error";
			} else {
				states[sceneId] = "idle";
			}
		}
		return states;
	}, [convexScenes]);

	// Video validation states derived from Convex scenes
	const videoValidationStates = useMemo(() => {
		const states: Record<string, boolean> = {};
		for (const scene of convexScenes || []) {
			states[scene._id as string] = scene.validated || false;
		}
		return states;
	}, [convexScenes]);

	// Load project to get visualStyle
	const project = useQuery(
		api.projects.get,
		projectId ? { projectId } : "skip",
	);

	// UI-only state: active scene ID
	const [activeSceneId, setActiveSceneId] = useState<string>("");
	const hasSetInitialActiveScene = useRef(false);

	// Convert Convex scenes to UI Scene format (template-sourced frames: use startFrameImageUrl/endFrameImageUrl or videoGeneration URLs)
	const scenes: Scene[] = (convexScenes || []).map((convexScene) => {
		const startUrl =
			(convexScene as { videoGeneration?: { startFrameUrl?: string } })
				?.videoGeneration?.startFrameUrl ??
			(convexScene as { startFrameImageUrl?: string }).startFrameImageUrl ??
			(typeof convexScene.startFrame === "string"
				? convexScene.startFrame
				: undefined);
		const endUrl =
			(convexScene as { videoGeneration?: { endFrameUrl?: string } })
				?.videoGeneration?.endFrameUrl ??
			(convexScene as { endFrameImageUrl?: string }).endFrameImageUrl ??
			(typeof convexScene.endFrame === "string"
				? convexScene.endFrame
				: undefined);
		return {
			id: convexScene._id as string,
			title: convexScene.title,
			description: convexScene.description,
			duration: convexScene.duration as 5 | 10,
			startFrameImage: startUrl ?? undefined,
			endFrameImage: endUrl ?? undefined,
			cinematicStyles: {
				ambiance: convexScene.cinematicStyles?.ambiance || "",
				cameraMovement: convexScene.cinematicStyles?.cameraMovement || "",
				colorTone: convexScene.cinematicStyles?.colorTone || "",
				visualStyle: convexScene.cinematicStyles?.visualStyle || "",
			},
		};
	});

	// Set initial active scene when scenes load (init-once)
	useEffect(() => {
		if (hasSetInitialActiveScene.current) return;
		if (scenes.length === 0) return;
		setActiveSceneId(scenes[0].id);
		hasSetInitialActiveScene.current = true;
	}, [scenes]);

	// SERVER-SIDE ATOMIC scene initialization from generatedStory
	// Uses Convex mutation that checks for existing scenes INSIDE the transaction
	// This prevents duplicate scenes even with React StrictMode or multiple tabs
	const initializeFromStoryMutation = useMutation(
		api.scenes.initializeFromStory,
	);

	useEffect(() => {
		// Only initialize scenes when:
		// 1. projectId exists
		// 2. Not loading
		// 3. NO scenes exist yet (prevents re-creating deleted scenes)
		// 4. Project has generatedStory.scenes
		if (
			projectId &&
			!scenesLoading &&
			convexScenes !== undefined &&
			convexScenes.length === 0 &&
			project?.generatedStory?.scenes &&
			project.generatedStory.scenes.length > 0
		) {
			// Call mutation - server handles deduplication atomically
			initializeFromStoryMutation({ projectId }).catch((err) => {
				console.error("[Step 3] Failed to initialize scenes:", err);
			});
		}
	}, [
		projectId,
		scenesLoading,
		convexScenes,
		project?.generatedStory?.scenes,
		initializeFromStoryMutation,
	]);

	// NOTE: Validation and generation states are now derived directly from Convex (useMemo above)
	// No useEffect sync needed - Convex subscriptions handle real-time updates automatically

	// Track which scene sections are expanded in the UI
	const [_expandedSections, _setExpandedSections] = useState<Set<string>>(
		new Set(["scene-1"]),
	);

	// Update scene in Convex
	const updateScene = (id: string, updates: Partial<Scene>) => {
		// Find corresponding Convex scene
		const scenesArray = (convexScenes || []) as Array<{ _id: Id<"scenes"> }>;
		const convexScene = scenesArray.find((s) => String(s._id) === id);
		if (convexScene && projectId) {
			// Build update object with only defined fields
			const convexUpdates: Record<string, unknown> = {};

			if (updates.title !== undefined) {
				convexUpdates.title = updates.title;
			}
			if (updates.description !== undefined) {
				convexUpdates.description = updates.description;
			}
			if (updates.duration !== undefined) {
				convexUpdates.duration = updates.duration;
			}
			if (updates.cinematicStyles !== undefined) {
				convexUpdates.cinematicStyles = updates.cinematicStyles;
			}
			// Store frame images: set BOTH the asset reference AND the URL field that UI prioritizes
			if (updates.startFrameImage !== undefined) {
				convexUpdates.startFrame = updates.startFrameImage || null;
				convexUpdates.startFrameImageUrl = updates.startFrameImage || null;
			}
			if (updates.endFrameImage !== undefined) {
				convexUpdates.endFrame = updates.endFrameImage || null;
				convexUpdates.endFrameImageUrl = updates.endFrameImage || null;
			}

			// Only update if there are actual changes
			if (Object.keys(convexUpdates).length > 0) {
				updateSceneInConvex(convexScene._id, convexUpdates);
			}
		} else {
			console.error("[Step 3] Could not find scene to update:", {
				id,
				convexScene,
				projectId,
			});
		}
	};

	// Delete frame immediately (no debounce) - for red cross button
	const deleteFrameImmediate = async (
		id: string,
		frameType: "start" | "end",
	) => {
		// Find corresponding Convex scene
		const scenesArray = (convexScenes || []) as Array<{ _id: Id<"scenes"> }>;
		const convexScene = scenesArray.find((s) => String(s._id) === id);
		if (convexScene && projectId) {
			try {
				// Use saveNow for immediate persistence (no debounce)
				// Clear BOTH the asset reference AND the URL that UI prioritizes
				const frameUpdate: {
					startFrame?: Id<"assets"> | string | null;
					endFrame?: Id<"assets"> | string | null;
					startFrameImageUrl?: string | null;
					endFrameImageUrl?: string | null;
				} =
					frameType === "start"
						? { startFrame: null, startFrameImageUrl: null }
						: { endFrame: null, endFrameImageUrl: null };

				await saveSceneNow(
					convexScene._id,
					frameUpdate as Parameters<typeof saveSceneNow>[1],
				);
			} catch (error) {
				console.error("[Step 3] Failed to delete frame:", error);
			}
		} else {
			console.error("[Step 3] Could not find scene to delete frame:", {
				id,
				convexScene,
				projectId,
			});
		}
	};

	// Add new scene
	const addScene = async () => {
		if (!projectId) return;

		const newSceneNumber = scenes.length + 1;
		// Use project's visualStyle if available
		const projectVisualStyle = project?.visualStyle || "";

		try {
			const convexId = await createSceneInConvex({
				sceneNumber: newSceneNumber,
				title: `Scene ${newSceneNumber}`,
				description: "",
				duration: 10,
				cinematicStyles: {
					ambiance: "",
					cameraMovement: "",
					colorTone: "",
					visualStyle: projectVisualStyle, // Inherit from project
				},
			});

			// Set new scene as active
			setActiveSceneId(convexId as string);
		} catch (err) {
			console.error("[Step 3] Failed to create scene:", err);
		}
	};

	const validateVideo = async (sceneId: string) => {
		// Use saveNow for IMMEDIATE save (no debounce) to prevent UI flicker
		const scenesArray = (convexScenes || []) as Array<{ _id: Id<"scenes"> }>;
		const convexScene = scenesArray.find((s) => String(s._id) === sceneId);
		if (convexScene && projectId) {
			try {
				await saveSceneNow(convexScene._id, {
					validated: true,
				});
			} catch (error) {
				console.error(`[Step 3] Failed to validate scene:`, error);
			}
		} else {
			console.error(`[Step 3] Could not find scene to validate: ${sceneId}`);
		}

		// No auto-advance - let the button guide the user through the linear flow
	};

	const handleGenerateVideoClick = useCallback(
		async (sceneId: string) => {
			if (!user?.id || !projectId) {
				console.error("[Step 3] Missing user or projectId");
				return;
			}

			// Find the scene data from convexScenes (include template-sourced startFrameImageUrl/endFrameImageUrl and videoGeneration)
			type ConvexSceneType = {
				_id: Id<"scenes">;
				description?: string;
				startFrame?: string;
				endFrame?: string;
				startFrameImageUrl?: string;
				endFrameImageUrl?: string;
				videoGeneration?: { startFrameUrl?: string; endFrameUrl?: string };
				duration?: number;
				cinematicStyles?: {
					ambiance?: string;
					cameraMovement?: string;
					colorTone?: string;
					visualStyle?: string;
				};
			};
			const scenesArray = (convexScenes || []) as ConvexSceneType[];
			const convexScene = scenesArray.find((s) => String(s._id) === sceneId);
			if (!convexScene) {
				console.error(`[Step 3] Scene not found: ${sceneId}`);
				return;
			}

			// Resolve frame URLs: prefer videoGeneration, then template-sourced startFrameImageUrl/endFrameImageUrl, then startFrame/endFrame
			const startFrameUrl =
				convexScene.videoGeneration?.startFrameUrl ??
				convexScene.startFrameImageUrl ??
				(typeof convexScene.startFrame === "string"
					? convexScene.startFrame
					: "");
			const endFrameUrl =
				convexScene.videoGeneration?.endFrameUrl ??
				convexScene.endFrameImageUrl ??
				(typeof convexScene.endFrame === "string"
					? convexScene.endFrame
					: undefined);

			if (!startFrameUrl) {
				console.error(
					`[Step 3] Scene ${sceneId} missing start frame (need videoGeneration, startFrameImageUrl, or startFrame)`,
				);
				return;
			}

			// Check credits first
			if ((currentCredits ?? 0) < VIDEO_GENERATION_CREDITS) {
				setPendingSceneIdForCredits(sceneId);
				setShowInsufficientCreditsModal(true);
				return;
			}

			let transactionId: Id<"creditTransactions"> | undefined;

			try {
				// Deduct credits before generation
				const deductResult = await deductCredits({
					clerkUserId: user.id,
					actionType: "video_generation",
					projectId: projectId as string,
				});

				if (!deductResult.success) {
					setPendingSceneIdForCredits(sceneId);
					setShowInsufficientCreditsModal(true);
					return;
				}
				transactionId = deductResult.transactionId;

				// Build cinematicStyles array from scene data
				const cinematicStylesArray = convexScene.cinematicStyles
					? [
							convexScene.cinematicStyles.ambiance,
							convexScene.cinematicStyles.cameraMovement,
							convexScene.cinematicStyles.colorTone,
							convexScene.cinematicStyles.visualStyle,
						].filter((s): s is string => Boolean(s))
					: undefined;

				// Call the video generation action with all context (template frames: startFrameUrl/endFrameUrl resolved above)
				await generateVideoAction({
					sceneId: sceneId as Id<"scenes">,
					sceneDescription: convexScene.description || "",
					startFrameUrl,
					endFrameUrl,
					cinematicStyles: cinematicStylesArray,
					duration: convexScene.duration || 10,
					// Project-level context from Step 1 & Step 2b
					visualStyle: project?.visualStyle,
					occasion: project?.occasion,
					theme: project?.theme,
					emotionalStory: project?.eventDetails?.emotionalStory,
				});
			} catch (error) {
				console.error("[Step 3] Video generation failed:", error);

				// Refund credits on failure
				if (transactionId) {
					try {
						await refundCredits({
							transactionId,
							reason: "Video generation failed",
						});
					} catch (refundError) {
						console.error("[Step 3] Failed to refund credits:", refundError);
					}
				}
			}
		},
		[
			user?.id,
			projectId,
			convexScenes,
			currentCredits,
			VIDEO_GENERATION_CREDITS,
			deductCredits,
			refundCredits,
			generateVideoAction,
			project,
		],
	);

	const handleRegenerateApproved = async (sceneId: string) => {
		// Reset validation in Convex - UI will update via subscription
		const scenesArray = (convexScenes || []) as Array<{ _id: Id<"scenes"> }>;
		const convexScene = scenesArray.find((s) => String(s._id) === sceneId);
		if (convexScene && projectId) {
			updateSceneInConvex(convexScene._id, {
				validated: false,
			});
		}
		// Note: Actual regeneration is handled by VideoGenerator component
	};

	const handleFrameChanged = useCallback(
		async (sceneId: string) => {
			await markNeedsRegeneration({
				sceneId: sceneId as Id<"scenes">,
				value: true,
			});
		},
		[markNeedsRegeneration],
	);

	const getNextAction = useCallback(() => {
		// Loading state
		if (scenesLoading) {
			return {
				text: t("loading_scenes"),
				disabled: true,
				type: "loading" as const,
				action: () => {},
			};
		}

		// No scenes
		if (scenes.length === 0) {
			return {
				text: t("add_first_scene"),
				disabled: false,
				type: "add_scene" as const,
				action: () => {},
			};
		}

		// LINEAR FLOW: Find first scene that needs action (in order: 1, 2, 3...)
		// Sort scenes by sceneNumber to ensure correct order
		const sortedScenes = [...scenes].sort((a, b) => {
			const numA = Number.parseInt(a.title.replace(/\D/g, ""), 10) || 0;
			const numB = Number.parseInt(b.title.replace(/\D/g, ""), 10) || 0;
			return numA - numB;
		});

		for (const scene of sortedScenes) {
			const sceneIndex = sortedScenes.indexOf(scene);
			const sceneNumber = sceneIndex + 1;
			const isGenerated = videoGenerationStates[scene.id] === "completed";
			const isValidated = videoValidationStates[scene.id] === true;
			const hasFrames = scene.startFrameImage && scene.endFrameImage;

			// Scene needs video generated
			if (!isGenerated) {
				if (!hasFrames) {
					// Check if previous scene is validated (allows progression to next scene)
					const previousScene =
						sceneIndex > 0 ? sortedScenes[sceneIndex - 1] : null;
					const previousSceneValidated = previousScene
						? videoValidationStates[previousScene.id] === true
						: false;

					// Enable button if this is the first scene OR previous scene is validated
					const shouldEnable = sceneIndex === 0 || previousSceneValidated;

					return {
						text: t("select_frames", { number: sceneNumber }),
						disabled: !shouldEnable,
						type: "select_frames" as const,
						action: shouldEnable
							? () => {
									setActiveSceneId(scene.id);
									// Scroll to the scene
									requestAnimationFrame(() => {
										const element = document.getElementById(
											`accordion-${scene.id}`,
										);
										if (element) {
											element.scrollIntoView({
												behavior: "smooth",
												block: "start",
											});
										}
									});
								}
							: () => {},
					};
				}
				return {
					text: t("generate_scene_video", { number: sceneNumber }),
					disabled: false,
					type: "generate_video" as const,
					action: () => {
						setActiveSceneId(scene.id);
						handleGenerateVideoClick(scene.id);
					},
				};
			}

			// Scene has video but needs validation
			if (isGenerated && !isValidated) {
				return {
					text: t("validate_scene_video", { number: sceneNumber }),
					disabled: false,
					type: "validate" as const,
					action: () => {
						setActiveSceneId(scene.id);
						// Scroll to the scene
						requestAnimationFrame(() => {
							const element = document.getElementById(`accordion-${scene.id}`);
							if (element) {
								element.scrollIntoView({ behavior: "smooth", block: "start" });
							}
						});
					},
				};
			}

			// Scene is complete (generated + validated), continue to next scene
		}

		// All scenes are validated → Continue to narration step
		// Check if narration is already approved - offer skip option
		if (project?.approvedNarrationScript) {
			return {
				text: t("continue_sound_design"),
				disabled: false,
				type: "navigate" as const,
				action: () => {
					const nextStep = returnTo ?? "step-4";
					router.push(`/guided/${nextStep}?projectId=${projectId}`);
				},
			};
		}

		return {
			text: t("continue_narration"),
			disabled: false,
			type: "navigate" as const,
			action: () => {
				const nextStep = returnTo ?? "step-3b";
				router.push(`/guided/${nextStep}?projectId=${projectId}`);
			},
		};
	}, [
		scenes,
		videoGenerationStates,
		videoValidationStates,
		router,
		handleGenerateVideoClick,
		scenesLoading,
		projectId,
		project?.approvedNarrationScript,
		returnTo,
		t,
	]);

	const handleContinue = () => {
		const nextAction = getNextAction();
		if (
			nextAction.action &&
			typeof nextAction.action === "function" &&
			!nextAction.disabled
		) {
			nextAction.action();
		}
	};

	// Auto-trigger video generation after a successful credits purchase.
	// When Polar redirects back with ?creditsAdded=1 the user shouldn't have
	// to click again — detect the flag, wait until credits and scenes are
	// fully loaded, then fire the next generation action automatically and
	// clean up the URL param so it doesn't linger across refreshes.
	const creditsAddedParam = searchParams.get("creditsAdded");
	const pendingSceneIdParam = searchParams.get("pendingSceneId");
	const autoTriggerFiredRef = useRef(false);
	useEffect(() => {
		if (creditsAddedParam !== "1") return;
		if (autoTriggerFiredRef.current) return;
		// Wait until Convex has returned real credit data and scenes are ready.
		// creditsLoading is true while Convex query is in-flight (balance would
		// be 0 fallback, which would wrongly re-show InsufficientCreditsModal).
		if (creditsLoading || scenesLoading || scenes.length === 0) return;

		// Strip ?creditsAdded and ?pendingSceneId so they never linger in URL
		const params = new URLSearchParams(searchParams.toString());
		params.delete("creditsAdded");
		params.delete("pendingSceneId");
		const newUrl = `${window.location.pathname}?${params.toString()}`;

		// If we know the exact scene that triggered the credit wall, target it
		// directly instead of relying on getNextAction() which always returns
		// the "first pending scene" and may pick the wrong one.
		if (pendingSceneIdParam) {
			const targetScene = scenes.find((s) => s.id === pendingSceneIdParam);
			if (targetScene) {
				autoTriggerFiredRef.current = true;
				setPendingSceneIdForCredits(null);
				router.replace(newUrl);
				const timer = setTimeout(() => {
					setActiveSceneId(targetScene.id);
					handleGenerateVideoClick(targetScene.id);
				}, 300);
				return () => clearTimeout(timer);
			}
		}

		const nextAction = getNextAction();

		// Only auto-trigger when the next action is a video generation.
		// Set the ref FIRST (primary guard) before any async work.
		if (nextAction.type !== "generate_video") {
			router.replace(newUrl);
			return;
		}

		autoTriggerFiredRef.current = true;
		router.replace(newUrl);

		// Fire the action — brief timeout lets the router.replace settle first
		const timer = setTimeout(() => {
			nextAction.action();
		}, 300);
		return () => clearTimeout(timer);
	}, [
		creditsAddedParam,
		pendingSceneIdParam,
		creditsLoading,
		scenesLoading,
		scenes,
		getNextAction,
		handleGenerateVideoClick,
		router,
		searchParams,
	]);

	// Redirect to Step 1 if projectId is missing (graceful handling)
	useEffect(() => {
		if (!projectIdFromUrl) {
			console.warn("Missing projectId in URL - redirecting to Step 1");
			router.replace("/guided/step-1");
		}
	}, [projectIdFromUrl, router]);

	// Show loading while redirecting or if no projectId
	if (!projectIdFromUrl) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[#101a23]">
				<Loader2 className="h-12 w-12 animate-spin text-[#0d7ff2]" />
			</div>
		);
	}

	const nextAction = getNextAction();

	// USER'S VISION: Always show scene builder FIRST, fetch in background
	// NO loading screen - just show empty state if no scenes yet

	return (
		<div className="min-h-screen bg-[#0a0f1a] text-white">
			<div className="fixed top-0 left-0 right-0 z-50 bg-[#101a23] border-b border-[#314d68]">
				<div className="flex items-center justify-between px-4 py-4">
					<button
						type="button"
						onClick={() => {
							router.push(`/guided/step-2b?projectId=${projectId}`);
						}}
						className="flex items-center gap-2 text-white hover:bg-[#223649] px-3 py-2 rounded-lg transition-colors"
					>
						<ArrowLeft className="h-4 w-4" />
						<span className="hidden md:inline">{t("back")}</span>
					</button>

					<div className="flex-1 max-w-md mx-4 md:mx-8">
						<Progress
							value={50}
							className="h-2 mb-2"
							style={{ backgroundColor: "#314d68" }}
						/>
						<div className="flex justify-between text-xs text-gray-400">
							<span className="flex items-center gap-1">
								<div
									className="w-5 h-5 md:w-6 md:h-6 rounded-full text-white flex items-center justify-center text-xs"
									style={{ backgroundColor: "#0d7ff2" }}
								>
									1
								</div>
							</span>
							<span className="flex items-center gap-1">
								<div
									className="w-5 h-5 md:w-6 md:h-6 rounded-full text-white flex items-center justify-center text-xs"
									style={{ backgroundColor: "#0d7ff2" }}
								>
									2
								</div>
							</span>
							<span className="flex items-center gap-1">
								<div
									className="w-5 h-5 md:w-6 md:h-6 rounded-full text-white flex items-center justify-center text-xs"
									style={{ backgroundColor: "#0d7ff2" }}
								>
									3
								</div>
								<span className="hidden sm:inline">🎨</span>
							</span>
							{[4, 5, 6].map((num) => (
								<span key={num} className="flex items-center gap-1">
									<div
										className="w-5 h-5 md:w-6 md:h-6 rounded-full text-gray-400 flex items-center justify-center text-xs"
										style={{ backgroundColor: "#314d68" }}
									>
										{num}
									</div>
								</span>
							))}
						</div>
					</div>

					<LanguageSwitcher />

					<Link href="/">
						<button
							type="button"
							className="flex items-center gap-2 text-foreground hover:bg-secondary px-3 py-2 min-h-[44px] rounded-lg transition-colors"
						>
							<Home className="h-4 w-4" />
							<span className="hidden md:inline">{t("home")}</span>
						</button>
					</Link>
					<button
						type="button"
						onClick={() => setShowPurchaseModal(true)}
						className="flex items-center gap-1 min-h-[44px] px-2 rounded-md hover:bg-secondary active:scale-95 transition-colors cursor-pointer"
						aria-label={tCredits("your_balance", { balance: currentCredits })}
					>
						<CreditCard className="h-4 w-4 text-muted-foreground" />
						<Badge
							variant="outline"
							className="text-xs border-muted text-muted-foreground hover:border-primary hover:text-foreground cursor-pointer transition-colors"
						>
							{tCredits("your_balance", { balance: currentCredits })}
						</Badge>
					</button>
				</div>
			</div>

			<div className="text-center mb-8 pt-32 md:pt-36">
				<h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
					{t("title")}
				</h1>
				<p className="text-blue-400 text-lg italic">
					{t("subtitle")} —{" "}
					{scenes.length === 1
						? t("scene_count", { count: scenes.length })
						: t("scene_count_plural", { count: scenes.length })}
				</p>
			</div>

			<div className="pt-4 md:pt-8 pb-20" style={{ scrollPaddingTop: "8rem" }}>
				<div className="max-w-7xl mx-auto px-4">
					<SceneManager
						projectId={projectId || ""}
						scenes={scenes}
						activeSceneId={activeSceneId}
						setActiveSceneId={setActiveSceneId}
						// Project-level context from Step 1 & Step 2b for video generation
						visualStyle={project?.visualStyle}
						occasion={project?.occasion}
						theme={project?.theme}
						emotionalStory={project?.eventDetails?.emotionalStory}
						// Video validation states from Convex for "Approve Video" button
						videoValidationStates={videoValidationStates}
						onUpdateScene={updateScene}
						onDeleteFrame={deleteFrameImmediate}
						onRemoveScene={async (id: string) => {
							// Remove from Convex (optimistic updates handled by useSceneData)
							const scenesArray = (convexScenes || []) as Array<{
								_id: Id<"scenes">;
							}>;
							const convexScene = scenesArray.find((s) => String(s._id) === id);
							if (convexScene) {
								await removeSceneInConvex(convexScene._id);
							}
							// Update active scene if needed
							if (activeSceneId === id && scenes.length > 1) {
								const remainingScenes = scenes.filter((s) => s.id !== id);
								if (remainingScenes.length > 0) {
									setActiveSceneId(remainingScenes[0].id);
								}
							}
						}}
						onAddScene={addScene}
						onValidateVideo={validateVideo}
						onGenerateVideo={handleGenerateVideoClick}
						onRegenerateApproved={handleRegenerateApproved}
						onFrameChanged={
							returnTo === "step-6" ? handleFrameChanged : undefined
						}
					/>
				</div>
			</div>

			<div className="fixed bottom-0 left-0 right-0 bg-[#101a23] border-t border-[#314d68] p-4 z-40">
				<div className="max-w-7xl mx-auto flex justify-end gap-3">
					{/* Show option to regenerate narration when already approved */}
					{project?.approvedNarrationScript &&
						nextAction.text === t("continue_sound_design") && (
							<Button
								onClick={() =>
									router.push(`/guided/step-3b?projectId=${projectId}`)
								}
								variant="outline"
								className="px-6 py-3 text-lg font-medium border-[#314d68] text-white hover:bg-[#223649]"
							>
								{t("regenerate_narration")}
							</Button>
						)}
					<Button
						onClick={handleContinue}
						disabled={nextAction.disabled}
						className={`px-8 py-3 text-lg font-medium ${
							nextAction.disabled
								? "bg-gray-600 text-gray-400 cursor-not-allowed"
								: nextAction.text === t("continue_sound_design")
									? "bg-green-600 hover:bg-green-700 text-white"
									: "bg-[#0d7ff2] hover:bg-blue-600 text-white"
						}`}
					>
						{nextAction.text === t("continue_sound_design")
							? t("continue_sound_design_free")
							: nextAction.text}
					</Button>
				</div>
			</div>

			{/* Insufficient Credits Modal */}
			<InsufficientCreditsModal
				isOpen={showInsufficientCreditsModal}
				onClose={() => setShowInsufficientCreditsModal(false)}
				required={VIDEO_GENERATION_CREDITS}
				available={currentCredits ?? 0}
				actionName={t("generate_video_action")}
				returnUrl={
					typeof window !== "undefined" && pendingSceneIdForCredits
						? (() => {
								const url = new URL(window.location.href);
								url.searchParams.set(
									"pendingSceneId",
									pendingSceneIdForCredits,
								);
								return url.toString();
							})()
						: typeof window !== "undefined"
							? window.location.href
							: undefined
				}
			/>
			<PurchaseCreditsModal
				isOpen={showPurchaseModal}
				onClose={() => setShowPurchaseModal(false)}
				successUrl={
					typeof window !== "undefined" ? window.location.href : undefined
				}
			/>
		</div>
	);
}

export default function Step3() {
	return (
		<Suspense fallback={<Loading />}>
			<Step3Content />
		</Suspense>
	);
}
