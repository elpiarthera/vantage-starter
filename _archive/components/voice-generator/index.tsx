"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { History } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { InsufficientCreditsModal } from "@/components/credits/InsufficientCreditsModal";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
	useCreditCost,
	useHasEnoughCredits,
} from "@/hooks/business-logic/useCredits";
import { usePurchaseSuccessToast } from "@/hooks/business-logic/usePurchaseSuccessToast";
import { cn } from "@/lib/utils";
import { CanvasSection } from "./CanvasSection";
import { FloatingOptionsPanel } from "./FloatingOptionsPanel";
import { FloatingPromptBar } from "./FloatingPromptBar";
import { useConvexVoiceHistory } from "./hooks/use-convex-voice-history";
import type { VoiceModelSchema } from "./hooks/use-convex-voice-schemas";
import { useConvexVoiceSchemas } from "./hooks/use-convex-voice-schemas";
import { PremiumTabSystem } from "./PremiumTabSystem";
import { ProjectSelector } from "./ProjectSelector";
import { VoiceLibrary } from "./VoiceLibrary";
import { VoiceModelSelector } from "./VoiceModelSelector";
import { VoiceRecordingPanel } from "./VoiceRecordingPanel";

export interface VoiceGeneratorProps {
	/** When provided, "Use in Project" calls this with the audio URL. */
	onUseInProject?: (url: string) => void;
	/** Optional project ID for saving voices to a specific project */
	projectId?: string;
	/** Initial tab to open: "generate" (default) or "record" */
	initialMode?: "generate" | "record";
}

export function VoiceGenerator({
	onUseInProject,
	projectId,
	initialMode,
}: VoiceGeneratorProps = {}) {
	const t = useTranslations("voice_generator");
	const tModels = useTranslations("voice_models");
	const { user } = useUser();
	const clerkUserId = user?.id ?? "";

	// ── UI state ──────────────────────────────────────────────────────────────
	const [mode, setMode] = useState<"generate" | "record">(
		initialMode ?? "generate",
	);
	const [historyOpen, setHistoryOpen] = useState(false);
	const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
	const [showInsufficientCredits, setShowInsufficientCredits] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const [showSaveModal, setShowSaveModal] = useState(false);
	// Recording-specific save modal state — lifted out of VoiceRecordingPanel
	const [pendingRecordingBlob, setPendingRecordingBlob] = useState<{
		blob: Blob;
		duration: number;
	} | null>(null);
	const [showRecordingSaveModal, setShowRecordingSaveModal] = useState(false);
	const [toast, setToast] = useState<{
		message: string;
		type: "success" | "error";
	} | null>(null);

	// Dedicated prompt state — not baked into params so it survives model switches
	const [promptText, setPromptText] = useState("");

	// ── Schemas ───────────────────────────────────────────────────────────────
	const {
		ttsSchemas,
		isLoading: schemasLoading,
		getSchemaById,
		getDefaultSchema,
		getDefaultParamsFromSchema,
	} = useConvexVoiceSchemas();

	const [selectedSchemaId, setSelectedSchemaId] = useState<string | null>(null);

	useEffect(() => {
		if (!schemasLoading && !selectedSchemaId) {
			const defaultSchema = getDefaultSchema();
			if (defaultSchema) setSelectedSchemaId(defaultSchema.schemaId);
		}
	}, [schemasLoading, selectedSchemaId, getDefaultSchema]);

	const selectedSchema = useMemo((): VoiceModelSchema | null => {
		if (!selectedSchemaId) return null;
		return getSchemaById(selectedSchemaId) ?? null;
	}, [selectedSchemaId, getSchemaById]);

	// Schema-driven params — prompt excluded (lives in promptText)
	const [params, setParams] = useState<Record<string, unknown>>({});

	useEffect(() => {
		if (!selectedSchema) return;
		const defaults = getDefaultParamsFromSchema(selectedSchema);
		delete defaults.prompt;
		delete defaults.text;
		setParams(defaults);
	}, [selectedSchema, getDefaultParamsFromSchema]);

	// ── History ───────────────────────────────────────────────────────────────
	const {
		history,
		isLoading: historyLoading,
		hasMore,
		loadMore,
	} = useConvexVoiceHistory();

	// ── Credits ───────────────────────────────────────────────────────────────
	const { hasEnough: hasEnoughCredits, balance: userCredits } =
		useHasEnoughCredits(
			clerkUserId,
			selectedSchema?.creditActionType ?? "voice_generation_minimax_28_hd",
		);
	const { cost: creditCostData } = useCreditCost(
		selectedSchema?.creditActionType ?? "voice_generation_minimax_28_hd",
	);
	const creditCost = creditCostData?.credits ?? 0;

	// Bulk credit costs map for VoiceModelSelector cards
	const rawCreditCosts = useQuery(
		api.credits.listCreditCostsByTypes,
		ttsSchemas.length > 0
			? { actionTypes: ttsSchemas.map((s) => s.creditActionType) }
			: "skip",
	);
	const creditCostsMap = useMemo<Record<string, number>>(() => {
		if (!rawCreditCosts) return {};
		return Object.fromEntries(
			rawCreditCosts.map((c) => [c.actionType, c.credits]),
		);
	}, [rawCreditCosts]);

	// Resolve latest audioTrack storageId → playable URL for CanvasSection
	const latestTrack = history[0];
	const latestAudioUrl = useQuery(
		api.files.getFileUrl,
		latestTrack?.storageId ? { storageId: latestTrack.storageId } : "skip",
	);

	// ── Mutations ─────────────────────────────────────────────────────────────
	const startGenericVoiceGeneration = useMutation(
		api.voiceTool.startGenericVoiceGeneration,
	);
	const startRecordedVoiceProcessing = useMutation(
		api.voiceTool.startRecordedVoiceProcessing,
	);
	const generateUploadUrl = useMutation(api.files.generateUploadUrl);
	const removeAudioTrack = useMutation(api.audioTracks.remove);

	// ── Helpers ───────────────────────────────────────────────────────────────
	const dismissRecordingMode = useCallback(() => {
		setMode("generate");
		setShowRecordingSaveModal(false);
		setPendingRecordingBlob(null);
	}, []);

	const showToast = useCallback(
		(message: string, type: "success" | "error" = "success") => {
			setToast({ message, type });
			setTimeout(() => setToast(null), 3000);
		},
		[],
	);

	// Show "Credits added successfully" toast when returning from Polar checkout
	usePurchaseSuccessToast(showToast);

	const canGenerate = !!promptText.trim() && !!selectedSchema && !isGenerating;

	// ── Handlers ──────────────────────────────────────────────────────────────

	/** Validate then open ProjectSelector — actual generation fires in handleSaveGeneration. */
	const handleGenerate = useCallback(() => {
		if (!clerkUserId) {
			showToast(t("sign_in_to_generate"), "error");
			return;
		}
		if (!selectedSchema) {
			showToast(t("select_model_first"), "error");
			return;
		}
		if (!hasEnoughCredits) {
			setShowInsufficientCredits(true);
			return;
		}
		setShowSaveModal(true);
	}, [clerkUserId, selectedSchema, hasEnoughCredits, showToast, t]);

	/** Called by ProjectSelector — triggers the actual Convex mutation. */
	const handleSaveGeneration = useCallback(
		async (title: string, projectId: Id<"projects"> | null) => {
			if (!selectedSchema || !clerkUserId) return;
			setIsGenerating(true);
			try {
				// Inject the prompt into params with the correct key for this model
				const promptKey =
					selectedSchema.params.find(
						(p) => p.key === "text" || p.key === "prompt",
					)?.key ?? "prompt";
				const fullParams = { ...params, [promptKey]: promptText };

				await startGenericVoiceGeneration({
					modelId: selectedSchema.modelId,
					params: fullParams,
					title,
					projectId: projectId ?? undefined,
				});

				showToast(t("save.success"));
				setShowSaveModal(false);
				setPromptText("");
			} catch (error) {
				console.error("Voice generation failed:", error);
				showToast(
					error instanceof Error
						? error.message
						: t("errors.generation_failed"),
					"error",
				);
			} finally {
				setIsGenerating(false);
			}
		},
		[
			selectedSchema,
			clerkUserId,
			params,
			promptText,
			startGenericVoiceGeneration,
			showToast,
			t,
		],
	);

	/** Called by VoiceRecordingPanel — closes the overlay first, then opens ProjectSelector. */
	const handleSaveRecording = useCallback(
		(audioBlob: Blob, duration: number) => {
			if (!clerkUserId) {
				showToast(t("sign_in_to_generate"), "error");
				return;
			}
			// Close the recording overlay BEFORE opening the modal so there is no
			// z-index conflict between the overlay (z-60) and the modal portal (z-50).
			setMode("generate");
			setPendingRecordingBlob({ blob: audioBlob, duration });
			setShowRecordingSaveModal(true);
		},
		[clerkUserId, showToast, t],
	);

	/** Called by the recording ProjectSelector — performs the actual upload + Convex mutation. */
	const handleConfirmRecordingSave = useCallback(
		async (title: string, projectId: Id<"projects"> | null) => {
			if (!pendingRecordingBlob) return;
			const { blob: audioBlob, duration } = pendingRecordingBlob;
			setIsGenerating(true);
			try {
				const mimeType = audioBlob.type || "audio/mpeg";
				const uploadUrl = await generateUploadUrl();
				const uploadResponse = await fetch(uploadUrl, {
					method: "POST",
					headers: { "Content-Type": mimeType },
					body: audioBlob,
				});
				if (!uploadResponse.ok) {
					throw new Error(`Upload failed: ${uploadResponse.status}`);
				}
				const { storageId } = await uploadResponse.json();
				await startRecordedVoiceProcessing({
					storageId,
					duration,
					title,
					projectId: projectId ?? undefined,
					enhance: false,
					generateTranscript: false,
				});
				showToast(t("recording.save_success"));
				setShowRecordingSaveModal(false);
				setPendingRecordingBlob(null);
				setMode("generate");
			} catch (error) {
				console.error("Failed to save recording:", error);
				showToast(
					error instanceof Error ? error.message : t("recording.save_failed"),
					"error",
				);
			} finally {
				setIsGenerating(false);
			}
		},
		[
			pendingRecordingBlob,
			generateUploadUrl,
			startRecordedVoiceProcessing,
			showToast,
			t,
		],
	);

	const handleDeleteAudio = useCallback(async () => {
		if (!latestTrack) return;
		try {
			await removeAudioTrack({ id: latestTrack._id });
		} catch (error) {
			console.error("Failed to delete audio:", error);
		}
	}, [latestTrack, removeAudioTrack]);

	const handleDeleteHistoryItem = useCallback(
		async (id: string) => {
			await removeAudioTrack({ id: id as Id<"audioTracks"> });
		},
		[removeAudioTrack],
	);

	// ── Derived display name ──────────────────────────────────────────────────
	const selectedModelName = useMemo(() => {
		if (!selectedSchema) return t("select_model_first");
		return selectedSchema.nameTranslationKey
			? tModels(
					selectedSchema.nameTranslationKey.replace(
						"voice_models.",
						"",
					) as never,
				)
			: selectedSchema.name;
	}, [selectedSchema, t, tModels]);

	// ── Render ────────────────────────────────────────────────────────────────
	return (
		<div className="relative w-full h-full bg-background select-none overflow-hidden">
			{/* ── Layer 0: Canvas ── */}
			<div className="absolute inset-0 z-0">
				{mode === "generate" ? (
					<CanvasSection
						audioUrl={latestAudioUrl ?? undefined}
						isLoading={isGenerating && mode === "generate"}
						onDelete={latestTrack ? handleDeleteAudio : undefined}
					/>
				) : (
					<div className="flex h-full items-start justify-center px-4 pt-[calc(6rem+env(safe-area-inset-top))] pb-[calc(2rem+env(safe-area-inset-bottom))] overflow-y-auto sm:pt-[calc(7rem+env(safe-area-inset-top))]">
						<VoiceRecordingPanel
							onSave={handleSaveRecording}
							disabled={isGenerating}
							className="w-full max-w-2xl"
						/>
					</div>
				)}
			</div>

			{/* ── Layer 1 (z-40): PremiumTabSystem ── */}
			<PremiumTabSystem
				mode={mode}
				setMode={setMode}
				selectedModelName={selectedModelName}
				onModelSelectorOpen={() => setModelSelectorOpen(true)}
			/>

			{/* ── Layer 2 (z-40): FloatingPromptBar — generate mode only ── */}
			{mode === "generate" && (
				<FloatingPromptBar
					prompt={promptText}
					onPromptChange={setPromptText}
					onGenerate={handleGenerate}
					creditCost={creditCost}
					canGenerate={canGenerate}
					isLoading={isGenerating}
					maxPromptLength={selectedSchema?.maxPromptLength ?? 10_000}
				/>
			)}

			{/* ── Layer 3 (z-30): FloatingOptionsPanel — generate mode only ── */}
			{selectedSchema && mode === "generate" && (
				<FloatingOptionsPanel
					schema={selectedSchema}
					params={params}
					onParamsChange={setParams}
					disabled={isGenerating}
				/>
			)}

			{/* ── Layer 4 (z-30): Floating History Trigger ── */}
			<Button
				variant="ghost"
				size="icon"
				onClick={() => setHistoryOpen(true)}
				className="fixed bottom-[calc(7rem+env(safe-area-inset-bottom))] left-4 z-30 min-h-[44px] min-w-[44px] rounded-xl border border-border/50 bg-background/60 shadow-lg backdrop-blur-md active:scale-95 transition-smooth md:bottom-[calc(1.5rem+env(safe-area-inset-bottom))] md:left-6"
				aria-label={t("history_trigger_aria")}
			>
				<History className="size-5" />
			</Button>

			{/* Overlay variant — preserved for future reuse */}
			{false && mode === "record" && (
				<>
					{/* Scrim: dims canvas without hiding it entirely; tap to dismiss */}
					<div
						className="fixed inset-0 z-[55] bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
						aria-hidden="true"
						onClick={dismissRecordingMode}
					/>
					<div className="fixed inset-x-4 z-[60] top-[max(1rem,env(safe-area-inset-top))] max-h-[85dvh] overflow-y-auto animate-in fade-in slide-in-from-bottom duration-300 md:inset-x-auto md:left-1/2 md:w-[500px] md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2">
						<VoiceRecordingPanel
							onSave={handleSaveRecording}
							onClose={dismissRecordingMode}
							disabled={isGenerating}
						/>
					</div>
				</>
			)}

			{/* ── Layer 6+: Modals (z-50+) ── */}
			<VoiceModelSelector
				open={modelSelectorOpen}
				onOpenChange={setModelSelectorOpen}
				selectedSchema={selectedSchema}
				onSelectSchema={(schema) => setSelectedSchemaId(schema.schemaId)}
				ttsSchemas={ttsSchemas}
				creditCosts={creditCostsMap}
			/>

			<VoiceLibrary
				open={historyOpen}
				onOpenChange={setHistoryOpen}
				history={history}
				isLoading={historyLoading}
				hasMore={hasMore}
				onLoadMore={loadMore}
				onUseInProject={onUseInProject}
				onDelete={handleDeleteHistoryItem}
			/>

			<InsufficientCreditsModal
				isOpen={showInsufficientCredits}
				onClose={() => setShowInsufficientCredits(false)}
				required={creditCost}
				available={userCredits ?? 0}
				actionName={t("page_title")}
				returnUrl={
					typeof window !== "undefined" ? window.location.href : undefined
				}
			/>

			<ProjectSelector
				open={showSaveModal}
				onOpenChange={setShowSaveModal}
				onConfirm={handleSaveGeneration}
				disabled={isGenerating}
				initialProjectId={projectId as Id<"projects"> | undefined}
			/>

			{/* ProjectSelector for recording flow — rendered at top level to portal above overlay */}
			<ProjectSelector
				open={showRecordingSaveModal}
				onOpenChange={(open) => {
					setShowRecordingSaveModal(open);
					if (!open) setPendingRecordingBlob(null);
				}}
				onConfirm={handleConfirmRecordingSave}
				disabled={isGenerating}
				initialProjectId={projectId as Id<"projects"> | undefined}
			/>

			{/* Toast */}
			{toast && (
				<div
					role="alert"
					aria-live="assertive"
					className={cn(
						"fixed right-4 z-50 rounded-lg p-4 shadow-lg transition-smooth animate-in slide-in-from-bottom duration-300",
						mode === "generate"
							? "bottom-[calc(6rem+env(safe-area-inset-bottom))]"
							: "bottom-[calc(1rem+env(safe-area-inset-bottom))]",
						toast.type === "success"
							? "bg-primary text-primary-foreground"
							: "bg-destructive text-destructive-foreground",
					)}
				>
					{toast.message}
				</div>
			)}
		</div>
	);
}
