"use client";

import { useUser } from "@clerk/nextjs";
import { useAction, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import {
	AlertTriangle,
	ChevronDown,
	ChevronUp,
	Edit,
	Loader2,
	Mic,
	Music,
	Plus,
	Sparkles,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { InsufficientCreditsModal } from "@/components/credits/InsufficientCreditsModal";
import { StepHeader } from "@/components/shared/step-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useDevice } from "@/contexts/DeviceContext";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useCreditCost, useCredits } from "@/hooks/business-logic/useCredits";
import { useProjectData } from "@/hooks/business-logic/useProjectData";
import { usePurchaseSuccessToast } from "@/hooks/business-logic/usePurchaseSuccessToast";
import { Link } from "@/i18n/routing";
import { MINIMAX_VOICES, THEME_EMOTION_MAP } from "@/lib/constants/audio";

/**
 * Clean narration script for TTS
 * Removes ALL formatting, keeping only spoken text
 * More robust version that handles various AI output formats
 * @param rawScript - The raw narration script
 * @param keepPauseMarkers - If true, preserves <#X.X#> pause markers; if false, removes them
 */
function cleanNarrationScript(
	rawScript: string,
	keepPauseMarkers = true,
): string {
	if (!rawScript) return "";

	let cleaned = rawScript;

	// Step 1: Remove markdown formatting
	cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, "$1"); // Bold
	cleaned = cleaned.replace(/\*([^*]+)\*/g, "$1"); // Italic
	cleaned = cleaned.replace(/~~([^~]+)~~/g, "$1"); // Strikethrough
	cleaned = cleaned.replace(/`([^`]+)`/g, "$1"); // Inline code
	cleaned = cleaned.replace(/^#+\s+/gm, ""); // Headers

	// Step 2: Remove section headers with timing
	cleaned = cleaned.replace(
		/^[A-Za-z\s]+\s*\(\d+\s*seconds?\)\s*:?\s*$/gim,
		"",
	);
	cleaned = cleaned.replace(
		/^\*\*[A-Za-z\s]+\*\*\s*\(\d+\s*seconds?\)\s*$/gim,
		"",
	);
	cleaned = cleaned.replace(/^Scene\s+\d+\s*[:—-]\s*/gim, "");

	// Step 3: Remove meta-text patterns that shouldn't be spoken
	const metaPatterns = [
		/^Narration Script:?\s*/gim,
		/^Here's your personalized.*narration\.?\s*/gim,
		/^This (?:warm|script|narration)[^.]*\.\s*/gim,
		/^---+\s*$/gm,
		/^\*[^*]+\*$/gm, // Italic-only lines (usually instructions)
		/^[A-Z][A-Za-z\s]+:\s*$/gm, // Section headers with colon
	];
	for (const pattern of metaPatterns) {
		cleaned = cleaned.replace(pattern, "");
	}

	// Step 4: Check if text has quoted content - if mostly quoted, extract quotes only
	const hasOnlyQuotedContent =
		/^[\s\S]*"[^"]+"/m.test(cleaned) &&
		!/[a-zA-Z]{15,}/m.test(cleaned.replace(/"[^"]*"/g, ""));
	if (hasOnlyQuotedContent) {
		const quotedParts = cleaned.match(/"([^"]+)"/g);
		if (quotedParts && quotedParts.length > 0) {
			cleaned = quotedParts.map((q) => q.replace(/"/g, "")).join(" ");
		}
	}

	// Step 5: Optionally remove pause markers <#X.X#> for display
	if (!keepPauseMarkers) {
		cleaned = cleaned.replace(/<#[\d.]+#>/g, "");
	}

	// Step 6: Clean up whitespace
	cleaned = cleaned.replace(/\n{3,}/g, " "); // Multiple newlines to space
	cleaned = cleaned.replace(/\n/g, " "); // All newlines to space
	cleaned = cleaned.replace(/\s{2,}/g, " "); // Multiple spaces to single
	cleaned = cleaned.trim();

	return cleaned;
}

// Loading component for Suspense
function Loading() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-[#101a23]">
			<Loader2 className="h-12 w-12 animate-spin text-[#0d7ff2]" />
		</div>
	);
}

function GuidedStep4Content() {
	const t = useTranslations("guided_step4");
	const tVG = useTranslations("voice_generator.library");
	// Narrator state
	const [selectedVoice, setSelectedVoice] = useState("");
	const [pacing, setPacing] = useState([50]);
	const [pitch, setPitch] = useState([50]);
	const [energy, setEnergy] = useState([50]);
	const [narrationTakes, setNarrationTakes] = useState<
		Array<{
			id: string;
			name: string;
			voice: string;
			settings: { pacing: number; pitch: number; energy: number };
			audioUrl?: string;
			audioStorageId?: Id<"_storage">;
			durationMs?: number;
		}>
	>([]);
	const [selectedNarrationTake, setSelectedNarrationTake] = useState("");
	const [isGeneratingNarration, setIsGeneratingNarration] = useState(false);
	const [narrationGenerationError, setNarrationGenerationError] = useState<
		"timeout" | "failed" | null
	>(null);

	// Music state
	const [musicPrompt, setMusicPrompt] = useState("");
	const [musicTakes, setMusicTakes] = useState<
		Array<{
			id: string;
			name: string;
			prompt: string;
			audioUrl?: string;
			audioStorageId?: Id<"_storage">;
		}>
	>([]);
	const [selectedMusicTrack, setSelectedMusicTrack] = useState("");
	const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
	const [musicGenerationError, setMusicGenerationError] = useState<
		"timeout" | "failed" | null
	>(null);

	// Audio mix state
	const [narrationVolume, setNarrationVolume] = useState([80]);
	const [musicVolume, setMusicVolume] = useState([60]);

	// Script preview state
	const [showScriptPreview, setShowScriptPreview] = useState(false);
	const [showPauseMarkers, setShowPauseMarkers] = useState(false);

	// Validation states
	const [narratorValidated, setNarratorValidated] = useState(false);
	const [musicValidated, setMusicValidated] = useState(false);

	// Track if initial data has been loaded (prevents overwriting on mount)
	const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
	// Ref to prevent Convex subscription updates from overwriting local state
	const hasSyncedFromConvex = useRef(false);

	// Narrator mode: "ai" = generate with MiniMax, "recorded" = use voice generator recording
	const [narratorMode, setNarratorMode] = useState<"ai" | "recorded">("ai");
	const step4DataRef = useRef<NonNullable<typeof project>["step4Data"] | null>(
		null,
	);
	const hasSyncedNarratorMode = useRef(false);

	const router = useRouter();
	const searchParams = useSearchParams();
	const { user } = useUser();

	// Get projectId from URL query params
	const projectIdFromUrl = searchParams.get("projectId");
	const projectId = projectIdFromUrl
		? (projectIdFromUrl as Id<"projects">)
		: undefined;

	// Initialize Convex hook for project data - MUST be before early return
	const {
		project,
		update,
		isLoading: projectLoading,
	} = useProjectData(projectId);

	const projectNarrations = useQuery(
		api.audioTracks.getProjectNarrations,
		projectId ? { projectId } : "skip",
	);

	// Credits
	const { balance, deductCredits, refundCredits, isProcessing } = useCredits(
		user?.id ?? "",
	);
	usePurchaseSuccessToast();
	const { cost: narrationCost } = useCreditCost("audio_narration");
	const { cost: musicCost } = useCreditCost("audio_music");
	const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] =
		useState(false);
	const [requiredCredits, setRequiredCredits] = useState(0);
	// Track which action triggered the credit wall so we can resume after payment
	const [pendingCreditAction, setPendingCreditAction] = useState<
		"narration" | "music" | null
	>(
		(searchParams.get("pendingAction") as "narration" | "music" | null) ?? null,
	);

	// Actions
	const generateNarrationAction = useAction(
		api.actions.narrationGeneration.generateNarration,
	);
	const generateMusicAction = useAction(
		api.actions.musicGeneration.generateMusic,
	);

	const { isMobile } = useDevice();

	const MAX_NARRATION_DURATION_SEC = 30;
	// Words per second for MiniMax TTS at speed=1.0 (pacing=50).
	// Empirically ~2.2 wps (not 2.5) to give a safe buffer below 30s.
	const BASE_WPS = 2.2;
	const [showNarrationTooLongModal, setShowNarrationTooLongModal] =
		useState(false);
	const [narrationTooLongTakeId, setNarrationTooLongTakeId] = useState<
		string | null
	>(null);

	// MiniMax voices list
	const miniMaxVoices = [
		"Emma - Warm & Friendly",
		"James - Professional & Clear",
		"Sofia - Elegant & Sophisticated",
		"Marcus - Deep & Authoritative",
		"Luna - Soft & Romantic",
		"Oliver - Energetic & Upbeat",
		"Isabella - Calm & Soothing",
		"Noah - Confident & Strong",
	];

	// Redirect to Step 1 if projectId is missing (graceful handling)
	useEffect(() => {
		if (!projectIdFromUrl) {
			console.warn("Missing projectId in URL - redirecting to Step 1");
			router.replace("/guided/step-1");
		}
	}, [projectIdFromUrl, router]);

	useEffect(() => {
		if (selectedNarrationTake) {
			setNarratorValidated(true);
		} else {
			setNarratorValidated(false);
			setMusicValidated(false);
		}
	}, [selectedNarrationTake]);

	useEffect(() => {
		if (selectedMusicTrack) {
			setMusicValidated(true);
		} else {
			setMusicValidated(false);
		}
	}, [selectedMusicTrack]);

	// Load from Convex project when available - ONLY ONCE on first load
	// Using ref to prevent Convex subscription updates from overwriting local state
	useEffect(() => {
		if (project && !projectLoading && !hasSyncedFromConvex.current) {
			hasSyncedFromConvex.current = true; // Mark as synced - won't run again

			const step4Data = project.step4Data;
			if (step4Data) {
				setSelectedVoice(step4Data.selectedVoice || "");
				setPacing(step4Data.pacing || [50]);
				setPitch(step4Data.pitch || [50]);
				setEnergy(step4Data.energy || [50]);
				setNarrationTakes(step4Data.narrationTakes || []);
				setSelectedNarrationTake(step4Data.selectedNarrationTake || "");
				setMusicPrompt(step4Data.musicPrompt || "");
				setMusicTakes(step4Data.musicTakes || []);
				setSelectedMusicTrack(step4Data.selectedMusicTrack || "");
				setNarrationVolume([step4Data.narrationVolume || 80]);
				setMusicVolume([step4Data.musicVolume || 60]);
				setNarratorValidated(step4Data.narratorValidated || false);
				setMusicValidated(step4Data.musicValidated || false);
			}

			// Set smart music prompt based on project data if not already set
			if (!step4Data?.musicPrompt) {
				const eventType = project.occasion || "Wedding";
				const theme = project.theme || "Joyful Celebration";
				setMusicPrompt(
					`Create an elegant and emotional ${theme.toLowerCase()} background music for a ${eventType.toLowerCase()}. Soft, cinematic, with gentle strings and piano.`,
				);
			}

			// Mark initial data as loaded (prevents save from overwriting)
			step4DataRef.current = step4Data ?? null;
			setHasLoadedInitialData(true);
		}
	}, [project, projectLoading]);

	// Save to Convex helper function
	const saveAudioSettings = () => {
		if (!projectId) return;

		// Get the selected narration take's URL, storage ID, and duration
		const selectedTake = narrationTakes.find(
			(take) => take.id === selectedNarrationTake,
		);
		const narrationAudioUrl = selectedTake?.audioUrl;
		const narrationAudioStorageId = selectedTake?.audioStorageId;
		const narrationDurationMs = selectedTake?.durationMs;

		// Get the selected music track's URL and storage ID
		const selectedMusic = musicTakes.find(
			(track) => track.id === selectedMusicTrack,
		);
		const musicAudioUrl = selectedMusic?.audioUrl;
		const musicAudioStorageId = selectedMusic?.audioStorageId;

		update({
			// Top-level fields for easy access in step-6
			narrationAudioUrl,
			narrationAudioStorageId,
			narrationDurationMs,
			musicAudioUrl,
			musicAudioStorageId,
			step4Data: {
				selectedVoice,
				pacing,
				pitch,
				energy,
				narrationTakes,
				selectedNarrationTake,
				musicPrompt,
				musicTakes,
				selectedMusicTrack,
				narrationVolume: narrationVolume[0], // Convert array to number
				musicVolume: musicVolume[0], // Convert array to number
				narratorValidated,
				musicValidated,
			},
		});
	};

	// Memoized cleaned script for preview (must be before early return)
	// When showPauseMarkers is true, we display <#X.X#> markers; otherwise hide them
	const cleanedNarration = useMemo(() => {
		if (!project?.approvedNarrationScript) return "";
		return cleanNarrationScript(
			project.approvedNarrationScript,
			showPauseMarkers,
		);
	}, [project?.approvedNarrationScript, showPauseMarkers]);

	// Word count and estimated duration
	const wordCount = useMemo(() => {
		return cleanedNarration.split(/\s+/).filter(Boolean).length;
	}, [cleanedNarration]);

	const estimatedDuration = useMemo(() => {
		// pacing slider: 0-100, maps to speed factor pacing/50.
		// speed=1.0 at pacing=50, speed=0.5 at pacing=25, speed=2.0 at pacing=100.
		// Lower speed → more seconds per word. Guard against division by zero.
		const speedFactor = Math.max(pacing[0] / 50, 0.1);
		const effectiveWps = BASE_WPS * speedFactor;
		return Math.round(wordCount / effectiveWps);
	}, [wordCount, pacing]);

	// Save on changes (debounced via update hook)
	// Only save after initial data has been loaded to prevent overwriting
	// biome-ignore lint/correctness/useExhaustiveDependencies: comprehensive dependency list for audio settings
	useEffect(() => {
		if (projectId && hasLoadedInitialData) {
			saveAudioSettings();
		}
	}, [
		selectedVoice,
		pacing,
		pitch,
		energy,
		narrationTakes,
		selectedNarrationTake,
		musicPrompt,
		musicTakes,
		selectedMusicTrack,
		narrationVolume,
		musicVolume,
		narratorValidated,
		musicValidated,
		hasLoadedInitialData,
	]);

	// intentional one-shot effect on projectNarrations — only run after initial sync
	useEffect(() => {
		if (
			!hasSyncedFromConvex.current ||
			hasSyncedNarratorMode.current ||
			projectNarrations === undefined
		)
			return;

		const savedTakeId = step4DataRef.current?.selectedNarrationTake;
		if (!savedTakeId) {
			hasSyncedNarratorMode.current = true;
			return;
		}

		const matchingTrack = projectNarrations.find((t) => t._id === savedTakeId);
		if (!matchingTrack || !matchingTrack.storageId) {
			hasSyncedNarratorMode.current = true;
			return;
		}

		hasSyncedNarratorMode.current = true;
		setNarratorMode("recorded");
		const freshTake = {
			id: matchingTrack._id,
			name: matchingTrack.title,
			voice: "recorded" as const,
			settings: { pacing: 50, pitch: 50, energy: 50 },
			audioStorageId: matchingTrack.storageId,
			audioUrl: matchingTrack.audioUrl ?? undefined,
			durationMs: matchingTrack.duration * 1000,
		};
		setNarrationTakes((prev) => {
			const withoutSynthetic = prev.filter((t) => t.voice !== "recorded");
			return [...withoutSynthetic, freshTake];
		});
		setSelectedNarrationTake(matchingTrack._id);
	}, [projectNarrations]);

	useEffect(() => {
		if (
			hasLoadedInitialData &&
			searchParams.get("returnedFrom") === "voice-generator"
		) {
			setNarratorMode("recorded");
			const nextParams = new URLSearchParams(searchParams.toString());
			nextParams.delete("returnedFrom");
			router.replace(`?${nextParams.toString()}`);
		}
	}, [hasLoadedInitialData, searchParams, router]);

	// Auto-trigger pending narration/music generation after a successful credits purchase.
	const creditsAddedParam = searchParams.get("creditsAdded");
	const pendingActionParam = searchParams.get("pendingAction");
	const autoTriggerStep4Ref = useRef(false);
	// Function refs — initialized to null, assigned after function declarations.
	// Using null initial value avoids "used before declaration" TS errors while
	// still satisfying the Rules of Hooks (useRef called unconditionally here).
	const generateNarrationTakeRef = useRef<(() => Promise<void>) | null>(null);
	const generateMusicTrackRef = useRef<(() => Promise<void>) | null>(null);
	useEffect(() => {
		if (creditsAddedParam !== "1") return;
		if (autoTriggerStep4Ref.current) return;
		if (!hasLoadedInitialData) return;

		const params = new URLSearchParams(searchParams.toString());
		params.delete("creditsAdded");
		params.delete("pendingAction");
		const newUrl = `${window.location.pathname}?${params.toString()}`;

		if (!pendingActionParam) {
			router.replace(newUrl);
			return;
		}

		autoTriggerStep4Ref.current = true;
		setPendingCreditAction(null);
		router.replace(newUrl);

		const timer = setTimeout(() => {
			if (pendingActionParam === "narration") {
				generateNarrationTakeRef.current?.();
			} else if (pendingActionParam === "music") {
				generateMusicTrackRef.current?.();
			}
		}, 300);
		return () => clearTimeout(timer);
	}, [
		creditsAddedParam,
		pendingActionParam,
		hasLoadedInitialData,
		router,
		searchParams,
	]);

	const voiceGeneratorUrl = projectId
		? `/tools/voice-generator?projectId=${projectId}&tab=record&returnTo=${encodeURIComponent(
				`/guided/step-4?projectId=${projectId}&returnedFrom=voice-generator`,
			)}`
		: "/tools/voice-generator?tab=record";

	const handleSwitchToAI = () => {
		setNarrationTakes((prev) => prev.filter((t) => t.voice !== "recorded"));
		setSelectedNarrationTake("");
		setNarratorMode("ai");
	};

	const handleSwitchToRecorded = () => {
		setSelectedNarrationTake("");
		setNarratorMode("recorded");
	};

	const handleSelectRecording = (
		track: NonNullable<typeof projectNarrations>[0],
	) => {
		if (!track.storageId) return;
		const syntheticTake = {
			id: track._id,
			name: track.title,
			voice: "recorded" as const,
			settings: { pacing: 50, pitch: 50, energy: 50 },
			audioStorageId: track.storageId,
			audioUrl: track.audioUrl ?? undefined,
			durationMs: track.duration * 1000,
		};
		setNarrationTakes((prev) => {
			const withoutSynthetic = prev.filter((t) => t.voice !== "recorded");
			return [...withoutSynthetic, syntheticTake];
		});
		setSelectedNarrationTake(track._id);
	};

	const generateNarrationTake = async () => {
		if (
			!selectedVoice ||
			!projectId ||
			!project?.approvedNarrationScript ||
			isProcessing
		)
			return;

		// Hard block: do not allow generation if script is too long
		if (estimatedDuration > MAX_NARRATION_DURATION_SEC) {
			setShowNarrationTooLongModal(true);
			return;
		}

		const needed = narrationCost?.credits ?? 10;
		if (balance < needed) {
			setRequiredCredits(needed);
			setPendingCreditAction("narration");
			setShowInsufficientCreditsModal(true);
			return;
		}

		setNarrationGenerationError(null);
		setIsGeneratingNarration(true);
		let transactionId: Id<"creditTransactions"> | undefined;

		try {
			const deductResult = await deductCredits({
				actionType: "audio_narration",
				projectId,
			});
			if (!deductResult.success) {
				setRequiredCredits(needed);
				setPendingCreditAction("narration");
				setShowInsufficientCreditsModal(true);
				return;
			}
			transactionId = deductResult.transactionId;

			// Clean the narration script to remove markdown and meta-text
			const cleanedScript = cleanNarrationScript(
				project.approvedNarrationScript || "",
			);
			console.log("[Step 4] Cleaned narration script:", cleanedScript);

			const result = await generateNarrationAction({
				projectId,
				prompt: cleanedScript,
				voiceId:
					MINIMAX_VOICES[selectedVoice as keyof typeof MINIMAX_VOICES] ??
					selectedVoice,
				language: project.language,
				speed: pacing[0] / 50,
				pitch: Math.round((pitch[0] - 50) / 4),
				emotion: THEME_EMOTION_MAP[project.theme] ?? "neutral",
			});

			const takeNumber = narrationTakes.length + 1;
			const newTake = {
				id: `take-${takeNumber}`,
				name: takeNumber.toString(),
				voice: selectedVoice,
				settings: { pacing: pacing[0], pitch: pitch[0], energy: energy[0] },
				audioUrl: result.audioUrl,
				...(result.narrationAudioStorageId && {
					audioStorageId: result.narrationAudioStorageId,
				}),
				durationMs: result.durationMs,
			};

			setNarrationTakes([...narrationTakes, newTake]);

			// Post-generation hard check: if actual audio still exceeds 30s, warn and
			// do NOT auto-select this take so the user cannot continue until they fix it.
			const actualDurationSec = result.durationMs
				? Math.ceil(result.durationMs / 1000)
				: 0;
			if (actualDurationSec > MAX_NARRATION_DURATION_SEC) {
				setNarrationTooLongTakeId(newTake.id);
				setShowNarrationTooLongModal(true);
			}
		} catch (error) {
			console.error("[Step 4] Narration generation failed:", error);
			const errorCode =
				error instanceof ConvexError
					? (error.data as { code?: string }).code
					: null;
			setNarrationGenerationError(
				errorCode === "MUSIC_TIMEOUT" ? "timeout" : "failed",
			);
			if (transactionId) {
				try {
					await refundCredits(transactionId, "Narration generation failed");
				} catch (refundError) {
					console.error("[Step 4] Failed to refund credits:", refundError);
				}
			}
		} finally {
			setIsGeneratingNarration(false);
		}
	};

	const generateMusicTrack = async () => {
		if (!musicPrompt.trim() || !projectId || isProcessing) return;

		const needed = musicCost?.credits ?? 10;
		if (balance < needed) {
			setRequiredCredits(needed);
			setPendingCreditAction("music");
			setShowInsufficientCreditsModal(true);
			return;
		}

		setMusicGenerationError(null);
		setIsGeneratingMusic(true);
		let transactionId: Id<"creditTransactions"> | undefined;

		try {
			const deductResult = await deductCredits({
				actionType: "audio_music",
				projectId,
			});
			if (!deductResult.success) {
				setRequiredCredits(needed);
				setPendingCreditAction("music");
				setShowInsufficientCreditsModal(true);
				return;
			}
			transactionId = deductResult.transactionId;

			const result = await generateMusicAction({
				projectId,
				prompt: musicPrompt,
				negativePrompt: "low quality, distorted, vocals",
			});

			const trackNumber = musicTakes.length + 1;
			const newTrack = {
				id: `track-${trackNumber}`,
				name: trackNumber.toString(),
				prompt: musicPrompt,
				audioUrl: result.audioUrl,
				...(result.musicAudioStorageId && {
					audioStorageId: result.musicAudioStorageId,
				}),
			};

			setMusicTakes([...musicTakes, newTrack]);
		} catch (error) {
			console.error("[Step 4] Music generation failed:", error);
			const errorCode =
				error instanceof ConvexError
					? (error.data as { code?: string }).code
					: null;
			setMusicGenerationError(
				errorCode === "MUSIC_TIMEOUT" ? "timeout" : "failed",
			);
			if (transactionId) {
				try {
					await refundCredits(transactionId, "Music generation failed");
				} catch (refundError) {
					console.error("[Step 4] Failed to refund credits:", refundError);
				}
			}
		} finally {
			setIsGeneratingMusic(false);
		}
	};

	// Show loading while redirecting or if no projectId
	if (!projectIdFromUrl) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[#101a23]">
				<Loader2 className="h-12 w-12 animate-spin text-[#0d7ff2]" />
			</div>
		);
	}

	const canContinue = selectedNarrationTake && selectedMusicTrack;

	const handleContinue = () => {
		// Data is already auto-saved to Convex
		// Just navigate to next step
		router.push(`/guided/step-5?projectId=${projectId}`);
	};

	// Update the function refs so the auto-trigger useEffect (declared above) can
	// call the latest version of each handler after the component re-renders.
	generateNarrationTakeRef.current = generateNarrationTake;
	generateMusicTrackRef.current = generateMusicTrack;

	return (
		<div className="min-h-screen" style={{ backgroundColor: "#101a23" }}>
			<StepHeader
				currentStep={4}
				backHref={`/guided/step-3b?projectId=${projectId}`}
			/>

			{/* Main Content */}
			<div className="pt-32 md:pt-36 pb-[calc(6rem+env(safe-area-inset-bottom))] p-4">
				<div className="max-w-4xl mx-auto">
					<div className="text-center mb-8">
						<h1 className="text-4xl font-bold text-white mb-2">{t("title")}</h1>
						<p className="text-xl text-blue-400 italic">{t("subtitle")}</p>
					</div>

					<div className="space-y-6">
						{/* Narration Script Preview */}
						{project?.approvedNarrationScript && (
							<Card
								style={{ backgroundColor: "#182634", borderColor: "#314d68" }}
							>
								<CardHeader className="flex flex-row items-center justify-between pb-2">
									<CardTitle className="text-white">
										{t("script_preview_title") || "Narration Script"}
									</CardTitle>
									<div className="flex items-center gap-2">
										<Link href={`/guided/step-3b?projectId=${projectId}`}>
											<Button
												variant="ghost"
												size="sm"
												className="text-gray-400 hover:text-white hover:bg-[#223649]"
											>
												<Edit className="h-4 w-4 mr-1" />
												{t("edit_in_step3b") || "Edit"}
											</Button>
										</Link>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setShowScriptPreview(!showScriptPreview)}
											className="text-gray-400 hover:text-white hover:bg-[#223649]"
										>
											{showScriptPreview ? (
												<>
													<ChevronUp className="h-4 w-4 mr-1" />
													{t("hide_script") || "Hide"}
												</>
											) : (
												<>
													<ChevronDown className="h-4 w-4 mr-1" />
													{t("show_script") || "Show"}
												</>
											)}
										</Button>
									</div>
								</CardHeader>
								{showScriptPreview && (
									<CardContent>
										{/* Pause markers toggle */}
										<div className="flex items-center justify-end mb-3">
											<button
												type="button"
												onClick={() => setShowPauseMarkers(!showPauseMarkers)}
												className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
													showPauseMarkers
														? "bg-blue-600 text-white"
														: "bg-[#223649] text-gray-400 hover:text-white"
												}`}
											>
												<span className="font-mono">&lt;#...#&gt;</span>
												{showPauseMarkers
													? t("pause_markers_visible") || "Pauses visible"
													: t("pause_markers_hidden") || "Pauses hidden"}
											</button>
										</div>
										<div className="bg-[#223649] p-4 rounded-lg">
											<p className="text-white whitespace-pre-wrap text-sm leading-relaxed">
												{cleanedNarration}
											</p>
										</div>
										<div className="flex justify-between text-xs text-gray-400 mt-3">
											<span>
												{wordCount} {t("words") || "words"}
											</span>
											<span>
												~{estimatedDuration}s{" "}
												{t("estimated_duration") || "estimated"}
											</span>
										</div>
										<p className="text-xs text-gray-500 mt-2 italic">
											{showPauseMarkers
												? t("pause_markers_hint") ||
													"Pause markers like <#1.0#> add natural pauses. Edit them to control timing."
												: t("script_will_be_spoken") ||
													"This text will be sent to the narrator voice."}
										</p>
									</CardContent>
								)}
							</Card>
						)}

						{/* Narrator Panel */}
						<Card
							style={{ backgroundColor: "#182634", borderColor: "#314d68" }}
						>
							<CardHeader>
								<CardTitle className="text-white">
									{t("narrator_panel")}
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{/* Segmented toggle: AI vs Recorded */}
								<div className="flex w-full rounded-lg overflow-hidden border border-[#314d68] mb-4">
									<button
										type="button"
										onClick={handleSwitchToAI}
										className={`flex-1 min-h-[44px] text-sm font-medium transition-colors px-3 ${
											narratorMode === "ai"
												? "bg-[#0d7ff2] text-white active:opacity-80"
												: "bg-[#223649] text-gray-300 hover:text-white active:opacity-70"
										}`}
									>
										{t("narrator_mode_ai")}
									</button>
									<button
										type="button"
										onClick={handleSwitchToRecorded}
										className={`flex-1 min-h-[44px] text-sm font-medium transition-colors px-3 ${
											narratorMode === "recorded"
												? "bg-[#0d7ff2] text-white active:opacity-80"
												: "bg-[#223649] text-gray-300 hover:text-white active:opacity-70"
										}`}
									>
										{t("narrator_mode_recordings")}
									</button>
								</div>

								{narratorMode === "ai" && (
									<>
										<div>
											<Label className="text-gray-300 mb-2 block">
												{t("narrator_voice")}
											</Label>
											<Select
												value={selectedVoice}
												onValueChange={setSelectedVoice}
											>
												<SelectTrigger className="bg-[#223649] border-[#314d68] text-white">
													<SelectValue
														placeholder={t("select_voice_placeholder")}
													/>
												</SelectTrigger>
												<SelectContent className="bg-[#223649] border-[#314d68]">
													{miniMaxVoices.map((voice) => (
														<SelectItem
															key={voice}
															value={voice}
															className="text-white hover:bg-[#314d68]"
														>
															{voice}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>

										<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
											<div>
												<Label className="text-gray-300 mb-2 block">
													{t("pacing_label")}
												</Label>
												<Slider
													value={pacing}
													onValueChange={setPacing}
													max={100}
													step={1}
													className="w-full"
												/>
												<div className="flex justify-between text-xs text-gray-400 mt-1">
													<span>{t("pacing_slower")}</span>
													<span>{t("pacing_faster")}</span>
												</div>
											</div>

											<div>
												<Label className="text-gray-300 mb-2 block">
													{t("pitch_label")}
												</Label>
												<Slider
													value={pitch}
													onValueChange={setPitch}
													max={100}
													step={1}
													className="w-full"
												/>
												<div className="flex justify-between text-xs text-gray-400 mt-1">
													<span>{t("pitch_lower")}</span>
													<span>{t("pitch_higher")}</span>
												</div>
											</div>

											<div>
												<Label className="text-gray-300 mb-2 block">
													{t("energy_label")}
												</Label>
												<Slider
													value={energy}
													onValueChange={setEnergy}
													max={100}
													step={1}
													className="w-full"
												/>
												<div className="flex justify-between text-xs text-gray-400 mt-1">
													<span>{t("energy_softer")}</span>
													<span>{t("energy_louder")}</span>
												</div>
											</div>
										</div>

										<Button
											onClick={generateNarrationTake}
											disabled={
												!selectedVoice ||
												isGeneratingNarration ||
												isProcessing ||
												!project?.approvedNarrationScript ||
												estimatedDuration > MAX_NARRATION_DURATION_SEC
											}
											className="w-full bg-[#0d7ff2] hover:bg-[#0a6bd1] text-white disabled:opacity-50 disabled:cursor-not-allowed"
										>
											{isGeneratingNarration ? (
												<Loader2 className="h-4 w-4 mr-2 animate-spin" />
											) : (
												<Sparkles className="h-4 w-4 mr-2" />
											)}
											{t("generate_narration")}
											<span className="ml-2 text-xs text-white/80">
												{t("credits_required", {
													credits: narrationCost?.credits ?? 10,
												})}
											</span>
										</Button>

										{narrationGenerationError && (
											<div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 space-y-2">
												<div className="flex items-start gap-3">
													<AlertTriangle
														className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5"
														aria-hidden="true"
													/>
													<div className="flex-1 min-w-0">
														<p className="text-sm font-semibold text-amber-300">
															{narrationGenerationError === "timeout"
																? t("narration_timeout_title")
																: t("narration_failed_title")}
														</p>
														<p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
															{narrationGenerationError === "timeout"
																? t("narration_timeout_description")
																: t("narration_failed_description")}
														</p>
													</div>
												</div>
												<Button
													onClick={generateNarrationTake}
													disabled={
														!selectedVoice ||
														isGeneratingNarration ||
														isProcessing ||
														!project?.approvedNarrationScript
													}
													size="sm"
													className="w-full bg-amber-600 hover:bg-amber-500 text-white"
												>
													<Sparkles className="h-4 w-4 mr-2" />
													{t("music_retry_cta")}
												</Button>
											</div>
										)}

										{/* Hard block warning when script is too long */}
										{estimatedDuration > MAX_NARRATION_DURATION_SEC && (
											<p className="text-sm text-amber-400 text-center mt-1">
												⚠️{" "}
												{t("narration_too_long_description", {
													estimatedDuration,
												})}{" "}
												<Link
													href={`/guided/step-3b?projectId=${projectId}`}
													className="underline text-amber-300 hover:text-amber-200"
												>
													{t("narration_too_long_cta")}
												</Link>
											</p>
										)}

										{narrationTakes.length > 0 && (
											<div className="space-y-2">
												<Label className="text-gray-300">
													{t("generated_takes")}
												</Label>
												<RadioGroup
													value={selectedNarrationTake}
													onValueChange={(value) => {
														// Prevent selecting a take that is known to be over the limit
														const take = narrationTakes.find(
															(tk) => tk.id === value,
														);
														const takeDurationSec = take?.durationMs
															? Math.ceil(take.durationMs / 1000)
															: 0;
														if (takeDurationSec > MAX_NARRATION_DURATION_SEC) {
															setNarrationTooLongTakeId(value);
															setShowNarrationTooLongModal(true);
															return;
														}
														setSelectedNarrationTake(value);
													}}
												>
													{narrationTakes.map((take) => {
														const takeDurationSec = take.durationMs
															? Math.ceil(take.durationMs / 1000)
															: 0;
														const isOverLimit =
															takeDurationSec > MAX_NARRATION_DURATION_SEC;
														return (
															<div
																key={take.id}
																className={`space-y-2 p-2 rounded ${isOverLimit ? "bg-amber-950/40 border border-amber-700" : "bg-[#223649]"}`}
															>
																<div className="flex items-center space-x-2">
																	<RadioGroupItem
																		value={take.id}
																		id={take.id}
																		disabled={isOverLimit}
																	/>
																	<Label
																		htmlFor={take.id}
																		className={`whitespace-nowrap ${isOverLimit ? "text-amber-400" : "text-white"}`}
																	>
																		{t("take_name", { number: take.name })}
																		{take.durationMs && (
																			<span className="ml-2 text-xs text-gray-400">
																				{takeDurationSec}s
																			</span>
																		)}
																		{isOverLimit && (
																			<span className="ml-2 flex items-center gap-1 text-xs text-amber-400">
																				<AlertTriangle
																					className="h-3 w-3"
																					aria-hidden="true"
																				/>
																				{t("recording_too_long")}
																			</span>
																		)}
																	</Label>
																</div>
																{take.audioUrl && (
																	<audio
																		controls
																		src={take.audioUrl}
																		aria-label={t("take_name", {
																			number: take.name,
																		})}
																		className="w-full"
																	>
																		<track kind="captions" />
																	</audio>
																)}
															</div>
														);
													})}
												</RadioGroup>
											</div>
										)}
									</>
								)}

								{narratorMode === "recorded" && (
									<div className="space-y-3">
										<p className="text-xs text-gray-400">
											{t("state_loss_notice")}
										</p>

										{/* Loading state */}
										{projectNarrations === undefined && (
											<div className="space-y-2">
												{[1, 2].map((i) => (
													<div
														key={i}
														className="h-16 bg-[#223649] rounded animate-pulse"
													/>
												))}
											</div>
										)}

										{/* Empty state */}
										{projectNarrations !== undefined &&
											projectNarrations.length === 0 && (
												<div className="flex flex-col items-center gap-4 py-8">
													<p className="text-gray-400 text-sm">
														{t("no_recordings_yet")}
													</p>
													<Button
														onClick={() => router.push(voiceGeneratorUrl)}
														className="bg-[#0d7ff2] hover:bg-[#0a6bd1] text-white min-h-[44px]"
													>
														<Mic className="h-4 w-4 mr-2" aria-hidden="true" />
														{t("record_a_voice_cta")}
													</Button>
												</div>
											)}

										{/* Non-empty list */}
										{projectNarrations !== undefined &&
											projectNarrations.length > 0 && (
												<>
													<RadioGroup
														value={selectedNarrationTake}
														onValueChange={(id) => {
															const track = projectNarrations.find(
																(tr) => tr._id === id,
															);
															if (track) handleSelectRecording(track);
														}}
													>
														{projectNarrations.map((track) => {
															const durationSec = Math.ceil(track.duration);
															const isOverLimit =
																durationSec > MAX_NARRATION_DURATION_SEC;
															const isUnavailable = !track.storageId;
															return (
																// biome-ignore lint/a11y/useSemanticElements: contains <audio> so <button> nesting is invalid
																<div
																	key={track._id}
																	role="button"
																	tabIndex={
																		isOverLimit || isUnavailable ? -1 : 0
																	}
																	onClick={() =>
																		!isOverLimit &&
																		!isUnavailable &&
																		handleSelectRecording(track)
																	}
																	onKeyDown={(e) => {
																		if (e.key === "Enter" || e.key === " ") {
																			e.preventDefault();
																			if (!isOverLimit && !isUnavailable)
																				handleSelectRecording(track);
																		}
																	}}
																	className={`flex flex-col gap-2 md:flex-row md:items-center md:gap-4 p-2 rounded cursor-pointer ${
																		isOverLimit
																			? "bg-amber-950/40 border border-amber-700"
																			: isUnavailable
																				? "bg-[#223649] opacity-50"
																				: "bg-[#223649]"
																	}`}
																>
																	<div className="flex flex-wrap items-center gap-1 min-w-0">
																		<RadioGroupItem
																			value={track._id}
																			id={`rec-${track._id}`}
																			disabled={isOverLimit || isUnavailable}
																			onClick={(e) => e.stopPropagation()}
																		/>
																		<Label
																			htmlFor={`rec-${track._id}`}
																			className="text-white cursor-pointer"
																		>
																			{track.title}
																		</Label>
																		<span className="text-xs text-gray-400">
																			{tVG("voice_duration", {
																				duration: durationSec,
																			})}
																		</span>
																		<span className="text-xs px-1.5 py-0.5 rounded-full bg-[#314d68] text-gray-300">
																			{track.source === "recorded"
																				? tVG("voice_mode_recorded")
																				: tVG("voice_mode_generated")}
																		</span>
																		{isOverLimit && (
																			<span className="flex items-center gap-1 text-xs text-amber-400">
																				<AlertTriangle
																					className="h-3 w-3"
																					aria-hidden="true"
																				/>
																				{t("recording_too_long")}
																			</span>
																		)}
																		{isUnavailable && (
																			<span className="text-xs text-gray-500">
																				{t("recording_unavailable")}
																			</span>
																		)}
																	</div>
																	<audio
																		controls
																		src={track.audioUrl ?? undefined}
																		aria-label={track.title}
																		className="w-full min-h-[44px] md:flex-1"
																	>
																		<track kind="captions" />
																	</audio>
																</div>
															);
														})}
													</RadioGroup>
													<div className="mt-3">
														<Button
															variant="ghost"
															onClick={() => router.push(voiceGeneratorUrl)}
															className="text-blue-400 hover:text-blue-300 active:text-blue-500 min-h-[44px]"
														>
															<Plus
																className="h-4 w-4 mr-1"
																aria-hidden="true"
															/>
															{t("record_another_voice")}
														</Button>
													</div>
												</>
											)}
									</div>
								)}
							</CardContent>
						</Card>

						{/* Music Panel */}
						{narratorValidated && (
							<div className="animate-slideUp">
								<Card
									style={{ backgroundColor: "#182634", borderColor: "#314d68" }}
								>
									<CardHeader>
										<CardTitle className="text-white">
											{t("music_panel")}
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<div>
											<Label className="text-gray-300 mb-2 block">
												{t("music_prompt_label")}
											</Label>
											<Textarea
												value={musicPrompt}
												onChange={(e) => setMusicPrompt(e.target.value)}
												className="bg-[#223649] border-[#314d68] text-white min-h-[100px]"
												placeholder={t("music_prompt_placeholder")}
											/>
										</div>

										<Button
											onClick={generateMusicTrack}
											disabled={
												!musicPrompt.trim() || isGeneratingMusic || isProcessing
											}
											className="w-full bg-[#0d7ff2] hover:bg-[#0a6bd1] text-white"
										>
											{isGeneratingMusic ? (
												<Loader2 className="h-4 w-4 mr-2 animate-spin" />
											) : (
												<Music className="h-4 w-4 mr-2" />
											)}
											{t("generate_music")}
											<span className="ml-2 text-xs text-white/80">
												{t("credits_required", {
													credits: musicCost?.credits ?? 10,
												})}
											</span>
										</Button>

										{musicGenerationError && (
											<div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 space-y-2">
												<div className="flex items-start gap-3">
													<AlertTriangle
														className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5"
														aria-hidden="true"
													/>
													<div className="flex-1 min-w-0">
														<p className="text-sm font-semibold text-amber-300">
															{musicGenerationError === "timeout"
																? t("music_timeout_title")
																: t("music_failed_title")}
														</p>
														<p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
															{musicGenerationError === "timeout"
																? t("music_timeout_description")
																: t("music_failed_description")}
														</p>
													</div>
												</div>
												<Button
													onClick={generateMusicTrack}
													disabled={
														!musicPrompt.trim() ||
														isGeneratingMusic ||
														isProcessing
													}
													size="sm"
													className="w-full bg-amber-600 hover:bg-amber-500 text-white"
												>
													<Music className="h-4 w-4 mr-2" />
													{t("music_retry_cta")}
												</Button>
											</div>
										)}

										{musicTakes.length > 0 && (
											<div className="space-y-2">
												<Label className="text-gray-300">
													{t("generated_tracks")}
												</Label>
												<RadioGroup
													value={selectedMusicTrack}
													onValueChange={setSelectedMusicTrack}
												>
													{musicTakes.map((track) => (
														<div
															key={track.id}
															className="space-y-2 p-2 bg-[#223649] rounded"
														>
															<div className="flex items-center space-x-2">
																<RadioGroupItem
																	value={track.id}
																	id={track.id}
																/>
																<Label
																	htmlFor={track.id}
																	className="text-white whitespace-nowrap"
																>
																	{t("track_name", { number: track.name })}
																</Label>
															</div>
															{track.audioUrl && (
																<audio
																	controls
																	src={track.audioUrl}
																	aria-label={t("track_name", {
																		number: track.name,
																	})}
																	className="w-full"
																>
																	<track kind="captions" />
																</audio>
															)}
														</div>
													))}
												</RadioGroup>
											</div>
										)}
									</CardContent>
								</Card>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Sticky Footer */}
			<div
				className="fixed bottom-0 left-0 right-0 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
				style={{ backgroundColor: "#101a23", borderTop: "1px solid #314d68" }}
			>
				<div className="max-w-4xl mx-auto">
					<Button
						onClick={handleContinue}
						disabled={!canContinue}
						className={`w-full ${canContinue ? "bg-[#0d7ff2] hover:bg-[#0a6bd1]" : "bg-[#314d68] cursor-not-allowed"} text-white text-lg py-6`}
					>
						{t("continue_button")}
					</Button>
				</div>
			</div>

			<InsufficientCreditsModal
				isOpen={showInsufficientCreditsModal}
				onClose={() => setShowInsufficientCreditsModal(false)}
				required={requiredCredits}
				available={balance ?? 0}
				returnUrl={
					typeof window !== "undefined" && pendingCreditAction
						? (() => {
								const url = new URL(window.location.href);
								url.searchParams.set("pendingAction", pendingCreditAction);
								return url.toString();
							})()
						: typeof window !== "undefined"
							? window.location.href
							: undefined
				}
			/>

			{isMobile ? (
				<Drawer
					open={showNarrationTooLongModal}
					onOpenChange={(open) => {
						if (!open) {
							setShowNarrationTooLongModal(false);
							setNarrationTooLongTakeId(null);
						}
					}}
				>
					<DrawerContent
						style={{ backgroundColor: "#182634", borderColor: "#314d68" }}
					>
						<DrawerHeader className="text-center">
							<DrawerTitle className="text-white">
								{t("narration_too_long_title")}
							</DrawerTitle>
							<DrawerDescription className="text-gray-400 mt-2">
								{narrationTooLongTakeId
									? t("narration_too_long_actual", {
											actualDuration: Math.ceil(
												(narrationTakes.find(
													(tk) => tk.id === narrationTooLongTakeId,
												)?.durationMs ?? 0) / 1000,
											),
										}) ||
										`The generated audio is ${Math.ceil(
											(narrationTakes.find(
												(tk) => tk.id === narrationTooLongTakeId,
											)?.durationMs ?? 0) / 1000,
										)}s — over the 30s limit. Please shorten your narration script.`
									: t("narration_too_long_description", {
											estimatedDuration,
										})}
							</DrawerDescription>
						</DrawerHeader>
						<div className="px-4 pb-8">
							<Link href={`/guided/step-3b?projectId=${projectId}`}>
								<Button className="w-full bg-[#0d7ff2] hover:bg-[#0a6bd1] text-white">
									{t("narration_too_long_cta")}
								</Button>
							</Link>
						</div>
					</DrawerContent>
				</Drawer>
			) : (
				<Dialog
					open={showNarrationTooLongModal}
					onOpenChange={(open) => {
						if (!open) {
							setShowNarrationTooLongModal(false);
							setNarrationTooLongTakeId(null);
						}
					}}
				>
					<DialogContent
						className="sm:max-w-md"
						style={{ backgroundColor: "#182634", borderColor: "#314d68" }}
					>
						<DialogHeader className="text-center">
							<DialogTitle className="text-white">
								{t("narration_too_long_title")}
							</DialogTitle>
							<DialogDescription className="text-gray-400 mt-2">
								{narrationTooLongTakeId
									? t("narration_too_long_actual", {
											actualDuration: Math.ceil(
												(narrationTakes.find(
													(tk) => tk.id === narrationTooLongTakeId,
												)?.durationMs ?? 0) / 1000,
											),
										}) ||
										`The generated audio is ${Math.ceil(
											(narrationTakes.find(
												(tk) => tk.id === narrationTooLongTakeId,
											)?.durationMs ?? 0) / 1000,
										)}s — over the 30s limit. Please shorten your narration script.`
									: t("narration_too_long_description", {
											estimatedDuration,
										})}
							</DialogDescription>
						</DialogHeader>
						<Link href={`/guided/step-3b?projectId=${projectId}`}>
							<Button className="w-full bg-[#0d7ff2] hover:bg-[#0a6bd1] text-white">
								{t("narration_too_long_cta")}
							</Button>
						</Link>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}

export default function GuidedStep4() {
	return (
		<Suspense fallback={<Loading />}>
			<GuidedStep4Content />
		</Suspense>
	);
}
