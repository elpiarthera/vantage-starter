"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { InsufficientCreditsModal } from "@/components/credits/InsufficientCreditsModal";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useHasEnoughCredits } from "@/hooks/business-logic/useCredits";
import { cn } from "@/lib/utils";
import { FloatingGenerateBar } from "./FloatingGenerateBar";
import { FloatingVideoSettingsPanel } from "./FloatingVideoSettingsPanel";
import { useConvexVideoSchemas } from "./hooks/use-convex-video-schemas";
import { SceneTimeline } from "./SceneTimeline";
import { StoryboardTopBar } from "./StoryboardTopBar";
import type { SceneData, VideoModelSchema } from "./types/schema";
import { VideoModelSelector } from "./VideoModelSelector";

export function StoryboardGenerator() {
	const t = useTranslations("storyboard");
	const { user } = useUser();
	const clerkUserId = user?.id ?? "";

	// ── UI state ──────────────────────────────────────────────────────────────
	const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
	const [showInsufficientCredits, setShowInsufficientCredits] = useState(false);
	const [isGeneratingAll, setIsGeneratingAll] = useState(false);
	const [toast, setToast] = useState<{
		message: string;
		type: "success" | "error";
	} | null>(null);

	// ── Schemas ───────────────────────────────────────────────────────────────
	const {
		schemas,
		isLoading: schemasLoading,
		getSchemaById,
		getDefaultSchema,
		getDefaultParamsFromSchema,
		createDefaultScene,
	} = useConvexVideoSchemas();

	const [selectedSchemaId, setSelectedSchemaId] = useState<string | null>(null);

	useEffect(() => {
		if (!schemasLoading && !selectedSchemaId) {
			const defaultSchema = getDefaultSchema();
			if (defaultSchema) setSelectedSchemaId(defaultSchema.schemaId);
		}
	}, [schemasLoading, selectedSchemaId, getDefaultSchema]);

	const selectedSchema = useMemo((): VideoModelSchema | null => {
		if (!selectedSchemaId) return null;
		return getSchemaById(selectedSchemaId) ?? null;
	}, [selectedSchemaId, getSchemaById]);

	// ── Global params (schema-driven, excluding prompt) ───────────────────────
	const [globalParams, setGlobalParams] = useState<Record<string, unknown>>({});
	const [selectedTier, setSelectedTier] = useState<string>("");

	useEffect(() => {
		if (!selectedSchema) return;
		const defaults = getDefaultParamsFromSchema(selectedSchema);
		delete defaults.prompt;
		setGlobalParams(defaults);
		// Auto-select first tier
		if (selectedSchema.creditTiers.length > 0 && !selectedTier) {
			setSelectedTier(selectedSchema.creditTiers[0].tier);
		}
	}, [selectedSchema, getDefaultParamsFromSchema, selectedTier]);

	// ── Scenes ────────────────────────────────────────────────────────────────
	const [scenes, setScenes] = useState<SceneData[]>([]);

	// ── Credits ───────────────────────────────────────────────────────────────
	const currentTierActionType = useMemo(() => {
		if (!selectedSchema) return "";
		const tier = selectedSchema.creditTiers.find(
			(t) => t.tier === selectedTier,
		);
		return tier?.actionType ?? selectedSchema.creditTiers[0]?.actionType ?? "";
	}, [selectedSchema, selectedTier]);

	const {
		hasEnough: hasEnoughCredits,
		required: creditsRequired,
		balance: creditsBalance,
	} = useHasEnoughCredits(clerkUserId, currentTierActionType);

	// Credit costs for model selector
	const rawCreditCosts = useQuery(
		api.credits.listCreditCostsByTypes,
		schemas.length > 0
			? {
					actionTypes: schemas.flatMap((s) =>
						s.creditTiers.map((tier) => tier.actionType),
					),
				}
			: "skip",
	);
	const creditCostsMap = useMemo<Record<string, number>>(() => {
		if (!rawCreditCosts) return {};
		return Object.fromEntries(
			rawCreditCosts.map((c) => [c.actionType, c.credits]),
		);
	}, [rawCreditCosts]);

	// Total credits for all pending scenes
	const totalCredits = useMemo(() => {
		if (!selectedSchema || !rawCreditCosts) return 0;
		const tier = selectedSchema.creditTiers.find(
			(t) => t.tier === selectedTier,
		);
		if (!tier) return 0;
		const baseCost = creditCostsMap[tier.actionType] ?? 0;
		const pendingScenes = scenes.filter(
			(s) => s.status === "idle" || s.status === "error",
		);
		return pendingScenes.reduce((sum, s) => {
			if (!selectedSchema.supportsDurationScaling) return sum + baseCost;
			const scale = s.durationSeconds / selectedSchema.creditBaseDuration;
			return sum + Math.ceil(baseCost * scale);
		}, 0);
	}, [scenes, selectedSchema, selectedTier, creditCostsMap, rawCreditCosts]);

	// ── Mutations ─────────────────────────────────────────────────────────────
	const startGenericVideoGeneration = useMutation(
		api.videoTool.startGenericVideoGeneration,
	);

	// ── Helpers ───────────────────────────────────────────────────────────────
	const showToast = useCallback(
		(message: string, type: "success" | "error" = "success") => {
			setToast({ message, type });
			setTimeout(() => setToast(null), 3000);
		},
		[],
	);

	// ── Handlers ──────────────────────────────────────────────────────────────
	const handleAddScene = useCallback(() => {
		if (!selectedSchema) return;
		const scene = createDefaultScene(selectedSchema);
		setScenes((prev) => [...prev, scene]);
	}, [selectedSchema, createDefaultScene]);

	const handleSceneUpdate = useCallback(
		(id: string, patch: Partial<SceneData>) => {
			setScenes((prev) =>
				prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
			);
		},
		[],
	);

	const handleSceneRemove = useCallback((id: string) => {
		setScenes((prev) => prev.filter((s) => s.id !== id));
	}, []);

	const handleGenerateScene = useCallback(
		async (id: string) => {
			if (!selectedSchema || !clerkUserId) return;
			if (!hasEnoughCredits) {
				setShowInsufficientCredits(true);
				return;
			}

			const scene = scenes.find((s) => s.id === id);
			if (!scene) return;

			// Mark as queued optimistically
			setScenes((prev) =>
				prev.map((s) =>
					s.id === id ? { ...s, status: "queued" as const } : s,
				),
			);

			try {
				// convexSceneId must exist before generation — scenes are saved to Convex on creation
				const convexSceneId = scene.convexSceneId as Id<"scenes"> | undefined;
				if (!convexSceneId) {
					throw new Error("Scene not yet saved to Convex — cannot generate");
				}

				// Collect media inputs
				const startImageUrl = selectedSchema.startImageParam
					? (scene.mediaInputs[selectedSchema.startImageParam] as
							| string
							| undefined)
					: undefined;
				const inputVideoUrl = selectedSchema.videoInputParam
					? (scene.mediaInputs[selectedSchema.videoInputParam] as
							| string
							| undefined)
					: undefined;

				await startGenericVideoGeneration({
					sceneId: convexSceneId,
					schemaId: selectedSchema.schemaId,
					startImageUrl,
					inputVideoUrl,
					durationSeconds: scene.durationSeconds,
					params: { ...globalParams, ...scene.params, prompt: scene.prompt },
					selectedTier,
				});
			} catch (error) {
				console.error("Scene generation failed:", error);
				setScenes((prev) =>
					prev.map((s) =>
						s.id === id
							? {
									...s,
									status: "error" as const,
									error: error instanceof Error ? error.message : t("error"),
								}
							: s,
					),
				);
				showToast(error instanceof Error ? error.message : t("error"), "error");
			}
		},
		[
			selectedSchema,
			clerkUserId,
			hasEnoughCredits,
			scenes,
			globalParams,
			selectedTier,
			startGenericVideoGeneration,
			showToast,
			t,
		],
	);

	const handleGenerateAll = useCallback(async () => {
		if (!selectedSchema || isGeneratingAll) return;
		if (!hasEnoughCredits) {
			setShowInsufficientCredits(true);
			return;
		}
		setIsGeneratingAll(true);
		const pendingIds = scenes
			.filter((s) => s.status === "idle" || s.status === "error")
			.map((s) => s.id);
		for (const id of pendingIds) {
			await handleGenerateScene(id);
		}
		setIsGeneratingAll(false);
	}, [
		selectedSchema,
		isGeneratingAll,
		hasEnoughCredits,
		scenes,
		handleGenerateScene,
	]);

	// ── Render ────────────────────────────────────────────────────────────────
	return (
		<div className="relative w-full min-h-[calc(100vh-64px)] bg-background select-none">
			{/* ── Layer 0 (z-0): Full-screen scene timeline canvas ── */}
			<div className="absolute inset-0 z-0">
				<SceneTimeline
					scenes={scenes}
					selectedSchema={selectedSchema}
					onSceneUpdate={handleSceneUpdate}
					onSceneGenerate={handleGenerateScene}
					onSceneRemove={handleSceneRemove}
					onAddScene={handleAddScene}
					disabled={isGeneratingAll}
				/>
			</div>

			{/* ── Layer 40: Top bar + bottom generate bar ── */}
			<StoryboardTopBar
				selectedSchema={selectedSchema}
				onModelOpen={() => setModelSelectorOpen(true)}
				sceneCount={scenes.length}
			/>
			<FloatingGenerateBar
				scenes={scenes}
				onGenerateAll={handleGenerateAll}
				isGenerating={isGeneratingAll}
				hasEnoughCredits={hasEnoughCredits}
				totalCredits={totalCredits}
			/>

			{/* ── Layer 30: Settings panel ── */}
			<FloatingVideoSettingsPanel
				schema={selectedSchema}
				params={globalParams}
				onParamsChange={setGlobalParams}
				selectedTier={selectedTier}
				onTierChange={setSelectedTier}
				disabled={isGeneratingAll}
			/>

			{/* ── Layer 50: Model selector ── */}
			<VideoModelSelector
				open={modelSelectorOpen}
				onOpenChange={setModelSelectorOpen}
				selectedSchema={selectedSchema}
				onSelectSchema={(schema) => setSelectedSchemaId(schema.schemaId)}
				schemas={schemas}
				creditCosts={creditCostsMap}
			/>

			{/* ── Layer 60: Modals ── */}
			<InsufficientCreditsModal
				isOpen={showInsufficientCredits}
				onClose={() => setShowInsufficientCredits(false)}
				required={creditsRequired}
				available={creditsBalance}
				actionName={t("generate_scene")}
				returnUrl={
					typeof window !== "undefined" ? window.location.href : undefined
				}
			/>

			{/* Toast */}
			{toast && (
				<div
					role="alert"
					aria-live="assertive"
					className={cn(
						"fixed bottom-4 right-4 z-50 rounded-lg p-4 shadow-lg transition-smooth animate-in slide-in-from-bottom duration-300 mb-[env(safe-area-inset-bottom)]",
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
