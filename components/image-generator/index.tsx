"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { History, ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdaptiveModal } from "@/components/adaptive/AdaptiveModal";
import { InsufficientCreditsModal } from "@/components/credits/InsufficientCreditsModal";
import { Button } from "@/components/ui/button";
import { ProjectSelector } from "@/components/voice-generator/ProjectSelector";
import { useDevice } from "@/contexts/DeviceContext";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
	useCreditCost,
	useHasEnoughCredits,
} from "@/hooks/business-logic/useCredits";
import { usePurchaseSuccessToast } from "@/hooks/business-logic/usePurchaseSuccessToast";
import { cn } from "@/lib/utils";
import { FloatingOptionsPanel } from "./FloatingOptionsPanel";
import { FloatingPromptBar } from "./FloatingPromptBar";
import { FullscreenViewer } from "./fullscreen-viewer";
import { GenerationHistory } from "./generation-history";
import { GlobalDropZone } from "./global-drop-zone";
import { useAspectRatio } from "./hooks/use-aspect-ratio";
import { useConvexImageHistory } from "./hooks/use-convex-image-history";
import { useConvexSchemas } from "./hooks/use-convex-schemas";
import { useImageGeneration } from "./hooks/use-image-generation";
import { useImageUpload } from "./hooks/use-image-upload";
import { usePersistentHistory } from "./hooks/use-persistent-history";
import { ModelSelector } from "./ModelSelector";
import { OutputSection } from "./output-section";
import { PremiumTabSystem } from "./PremiumTabSystem";
import { type RefItem, RefsPanel } from "./RefsPanel";
import { ToastNotification } from "./toast-notification";
import type { ModelSchema } from "./types/schema";

export { PremiumTabSystem };

export interface ImageCombinerProps {
	/** When provided, "Use in Video" calls this with the image URL. When not provided, copies URL to clipboard and shows toast. */
	onUseInVideo?: (url: string) => void;
}

export function ImageCombiner({ onUseInVideo }: ImageCombinerProps = {}) {
	const t = useTranslations("image_generator");
	const { isMobile, isTablet, orientation } = useDevice();
	const isTouchDevice = isMobile || isTablet;
	const { user } = useUser();
	const clerkUserId = user?.id ?? "";
	const saveToProjectMutation = useMutation(api.imageToolHistory.saveToProject);

	// Canvas-first layout: explicit mode controlled by PremiumTabSystem
	const [mode, setMode] = useState<"generate" | "edit">("generate");
	const [historyOpen, setHistoryOpen] = useState(false);
	const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
	const [refsOpen, setRefsOpen] = useState(false);
	const [editRefs, setEditRefs] = useState<RefItem[]>([]);

	// Sprint 30d.5: Fetch schemas from Convex (zero-code model onboarding)
	const {
		t2iSchemas,
		i2iSchemas,
		hasI2IModels,
		isLoading: schemasLoading,
		getSchemaById,
		getDefaultT2ISchema,
		getDefaultI2ISchema,
		getDefaultParamsFromSchema,
	} = useConvexSchemas();

	// Schema selection state (Task 30d.1, updated 30d.5 for Convex)
	const [selectedT2ISchemaId, setSelectedT2ISchemaId] = useState<string | null>(
		null,
	);
	const [selectedI2ISchemaId, setSelectedI2ISchemaId] = useState<string | null>(
		null,
	);

	// Initialize schema IDs when Convex data loads
	useEffect(() => {
		if (!schemasLoading) {
			const defaultT2I = getDefaultT2ISchema();
			const defaultI2I = getDefaultI2ISchema();
			if (defaultT2I && !selectedT2ISchemaId) {
				setSelectedT2ISchemaId(defaultT2I.id);
			}
			if (defaultI2I && !selectedI2ISchemaId) {
				setSelectedI2ISchemaId(defaultI2I.id);
			}
		}
	}, [
		schemasLoading,
		getDefaultT2ISchema,
		getDefaultI2ISchema,
		selectedT2ISchemaId,
		selectedI2ISchemaId,
	]);

	const [prompt, setPrompt] = useState(t("default_prompt"));
	const [useUrls, setUseUrls] = useState(false);
	const [showFullscreen, setShowFullscreen] = useState(false);
	const [fullscreenImageUrl, setFullscreenImageUrl] = useState("");
	const [toast, setToast] = useState<{
		message: string;
		type: "success" | "error";
	} | null>(null);
	const [isDraggingOver, setIsDraggingOver] = useState(false);
	const [_dragCounter, setDragCounter] = useState(0);
	const [dropZoneHover, setDropZoneHover] = useState<1 | 2 | null>(null);
	const [showInsufficientCredits, setShowInsufficientCredits] = useState(false);
	const [showSaveModal, setShowSaveModal] = useState(false);
	const [isSavingToProject, setIsSavingToProject] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);

	// Schema-driven params (defaults from schema, reset when schema changes)
	// Sprint 30d.5: Initialize empty, will be set when schema loads from Convex
	const [params, setParams] = useState<Record<string, unknown>>({});

	const showToast = useCallback(
		(message: string, type: "success" | "error" = "success") => {
			setToast({ message, type });
			setTimeout(() => setToast(null), 3000);
		},
		[],
	);

	// Show "Credits added successfully" toast when returning from Polar checkout
	usePurchaseSuccessToast(showToast);

	// Convex history when signed in; otherwise localStorage (demo)
	const convexHistory = useConvexImageHistory(50);
	const persistentHistory = usePersistentHistory(showToast);
	const persistedGenerations = clerkUserId
		? convexHistory.generations
		: persistentHistory.generations;
	const historyLoading = clerkUserId
		? convexHistory.isLoading
		: persistentHistory.isLoading;
	const hasMore = clerkUserId
		? convexHistory.hasMore
		: persistentHistory.hasMore;
	const loadMore = clerkUserId
		? convexHistory.loadMore
		: persistentHistory.loadMore;
	const isLoadingMore = clerkUserId
		? convexHistory.isLoadingMore
		: persistentHistory.isLoadingMore;
	const setPersistedGenerations = clerkUserId
		? () => {}
		: persistentHistory.setGenerations;
	const addGeneration = clerkUserId
		? async () => {}
		: persistentHistory.addGeneration;
	const deleteGeneration = useCallback(
		async (id: string) => {
			if (clerkUserId) {
				// Convex history: no delete mutation in MVP
				return;
			}
			await persistentHistory.deleteGeneration(id);
		},
		[clerkUserId, persistentHistory],
	);

	const startGenericGeneration = useMutation(
		api.imageTool.startGenericGeneration,
	);

	const {
		image1,
		image1Preview: _image1Preview,
		image1Url,
		image2,
		image2Preview: _image2Preview,
		image2Url,
		isConvertingHeic,
		heicProgress,
		handleImageUpload,
		handleUrlChange,
		clearImage,
		showToast: uploadShowToast,
	} = useImageUpload(t);

	// Schema selection driven by explicit mode (canvas-first)
	// Sprint 30d.5: Now uses Convex schemas
	const selectedSchema = useMemo((): ModelSchema | null => {
		const id = mode === "edit" ? selectedI2ISchemaId : selectedT2ISchemaId;
		if (!id) return null;
		const schema = getSchemaById(id);
		if (schema) return schema;
		// Fallback to defaults if ID not found
		const fallback =
			mode === "edit" ? getDefaultI2ISchema() : getDefaultT2ISchema();
		return fallback ?? null;
	}, [
		mode,
		selectedT2ISchemaId,
		selectedI2ISchemaId,
		getSchemaById,
		getDefaultT2ISchema,
		getDefaultI2ISchema,
	]);

	// Per-model credit check — uses schema's creditActionType (Sprint 34 fix)
	const currentCreditActionType = selectedSchema?.creditActionType ?? "";
	const creditCheck = useHasEnoughCredits(clerkUserId, currentCreditActionType);
	const creditCostData = useCreditCost(currentCreditActionType);

	// Update params when schema changes
	useEffect(() => {
		if (selectedSchema) {
			setParams(getDefaultParamsFromSchema(selectedSchema));
		}
	}, [selectedSchema, getDefaultParamsFromSchema]);

	const {
		aspectRatio,
		setAspectRatio: _setAspectRatio,
		availableAspectRatios: _availableAspectRatios,
		detectAspectRatio: _detectAspectRatio,
	} = useAspectRatio();

	// Credit check uses current mode (T2I vs I2I)
	// Sprint 34 fix: use schema.type field instead of fragile string matching
	const isI2IMode = selectedSchema?.type === "i2i";
	const hasEnough = creditCheck.hasEnough;
	const required = creditCheck.required;
	const balance = creditCheck.balance;
	const creditCost = creditCostData.cost;

	const onStartT2I = useCallback(
		async (_opts: { prompt: string; aspectRatio: string }) => {
			if (!clerkUserId) {
				showToast(t("sign_in_to_generate"), "error");
				return;
			}
			if (!selectedSchema) {
				showToast(t("select_model_first"), "error");
				return;
			}
			if (!hasEnough && (required ?? 0) > 0) {
				setShowInsufficientCredits(true);
				return;
			}
			try {
				const body: Record<string, unknown> = {
					prompt: prompt.trim(),
					...params,
				};
				if (isI2IMode) {
					// I2I: use editRefs (populated by RefsPanel) — NOT legacy image1Url/image2Url slots
					const refUrls = editRefs.map((r) => r.url).filter(Boolean);
					// Determine whether this model expects image_urls (array) or image_url (single)
					// by checking its param schema — O3 I2I and NB Pro I2I use image_urls (multi-ref);
					// Kling v3 I2I and Grok I2I use image_url (single). Must match allowedParams in seed.
					const usesImageUrls = selectedSchema.params.some(
						(p) => p.key === "image_urls" && p.refType === "multi",
					);
					if (usesImageUrls) {
						// Multi-ref model: always send as array (even for 1 image)
						body.image_urls = refUrls;
					} else {
						// Single-ref model: always use the first ref regardless of how many were added
						body.image_url = refUrls[0];
					}
				}
				await startGenericGeneration({
					modelId: selectedSchema.modelId,
					params: body,
				});
				setIsGenerating(true);
			} catch (err) {
				setIsGenerating(false);
				showToast(
					err instanceof Error ? err.message : t("generation_failed"),
					"error",
				);
			}
		},
		[
			clerkUserId,
			hasEnough,
			required,
			showToast,
			t,
			prompt,
			params,
			selectedSchema,
			isI2IMode,
			editRefs,
			startGenericGeneration,
		],
	);

	const {
		selectedGenerationId,
		setSelectedGenerationId,
		imageLoaded,
		setImageLoaded,
		generateImage: runGeneration,
		cancelGeneration,
		loadGeneratedAsInput: _loadGeneratedAsInput,
	} = useImageGeneration({
		prompt,
		aspectRatio,
		image1,
		image2,
		image1Url,
		image2Url,
		useUrls,
		generations: persistedGenerations,
		setGenerations: setPersistedGenerations,
		addGeneration,
		onToast: showToast,
		onImageUpload: handleImageUpload,
		onStartT2I: clerkUserId ? onStartT2I : undefined,
	});

	// When Convex history updates after submit, select the newest entry
	const prevHistoryLengthRef = useRef(0);
	useEffect(() => {
		if (!clerkUserId || !isGenerating) return;
		const len = persistedGenerations.length;
		if (len > prevHistoryLengthRef.current && len > 0) {
			setSelectedGenerationId(persistedGenerations[0].id);
			setIsGenerating(false);
		}
		prevHistoryLengthRef.current = len;
	}, [
		clerkUserId,
		isGenerating,
		persistedGenerations,
		setSelectedGenerationId,
	]);

	// Safety timeout: if the background action fails silently (no history entry written),
	// reset the generating state after 3 minutes to unblock the UI.
	useEffect(() => {
		if (!isGenerating) return;
		const safetyTimer = setTimeout(
			() => {
				setIsGenerating(false);
			},
			3 * 60 * 1000,
		);
		return () => clearTimeout(safetyTimer);
	}, [isGenerating]);

	const selectedGeneration =
		persistedGenerations.find((g) => g.id === selectedGenerationId) ||
		persistedGenerations[0];
	const _isLoading = persistedGenerations.some((g) => g.status === "loading");
	const generatedImage =
		selectedGeneration?.status === "complete" && selectedGeneration.imageUrl
			? { url: selectedGeneration.imageUrl, prompt: selectedGeneration.prompt }
			: null;

	const hasImages = useUrls ? !!(image1Url || image2Url) : !!(image1 || image2);
	const currentMode = hasImages ? "image-editing" : "text-to-image";
	const isI2ISchema = selectedSchema?.type === "i2i";
	const hasRefForI2I = !isI2ISchema || editRefs.length > 0;
	const canGenerate = prompt.trim().length > 0 && hasRefForI2I;

	useEffect(() => {
		if (
			selectedGeneration?.status === "complete" &&
			selectedGeneration?.imageUrl
		) {
			setImageLoaded(false);
		}
	}, [
		selectedGeneration?.imageUrl,
		setImageLoaded,
		selectedGeneration?.status,
	]);

	useEffect(() => {
		uploadShowToast.current = showToast;
	}, [uploadShowToast, showToast]);

	useEffect(() => {
		return () => {
			document.body.style.overflow = "unset";
		};
	}, []);

	const openFullscreen = useCallback(() => {
		if (generatedImage?.url) {
			setFullscreenImageUrl(generatedImage.url);
			setShowFullscreen(true);
			document.body.style.overflow = "hidden";
		}
	}, [generatedImage?.url]);

	const closeFullscreen = useCallback(() => {
		setShowFullscreen(false);
		setFullscreenImageUrl("");
		document.body.style.overflow = "unset";
	}, []);

	const downloadImage = useCallback(async () => {
		if (!generatedImage) return;
		try {
			const response = await fetch(generatedImage.url);
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `myshortreel-${currentMode}-result.png`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error("Error downloading image:", error);
			window.open(generatedImage.url, "_blank");
		}
	}, [generatedImage, currentMode]);

	const openImageInNewTab = useCallback(() => {
		if (!generatedImage?.url) {
			console.error("No image URL available");
			return;
		}

		try {
			if (generatedImage.url.startsWith("data:")) {
				const parts = generatedImage.url.split(",");
				const mime = parts[0].match(/:(.*?);/)?.[1] || "image/png";
				const bstr = atob(parts[1]);
				const n = bstr.length;
				const u8arr = new Uint8Array(n);
				for (let i = 0; i < n; i++) {
					u8arr[i] = bstr.charCodeAt(i);
				}
				const blob = new Blob([u8arr], { type: mime });
				const blobUrl = URL.createObjectURL(blob);
				const newWindow = window.open(blobUrl, "_blank", "noopener,noreferrer");
				if (newWindow) {
					setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
				}
			} else {
				window.open(generatedImage.url, "_blank", "noopener,noreferrer");
			}
		} catch (error) {
			console.error("Error opening image:", error);
			window.open(generatedImage.url, "_blank");
		}
	}, [generatedImage]);

	const handleUseInVideo = useCallback(
		(url: string) => {
			if (onUseInVideo) {
				onUseInVideo(url);
				return;
			}
			navigator.clipboard
				.writeText(url)
				.then(() => showToast(t("use_in_video_copied"), "success"))
				.catch(() => showToast(t("copy_failed"), "error"));
		},
		[onUseInVideo, showToast, t],
	);

	// Save to project (mirror voice Phase 7): only when signed in and selection is from Convex history
	const handleSaveToProject = useCallback(
		async (title: string, projectId: Id<"projects"> | null) => {
			if (!selectedGeneration?.id) return;
			setIsSavingToProject(true);
			try {
				await saveToProjectMutation({
					entryId: selectedGeneration.id as Id<"imageToolHistory">,
					title,
					projectId: projectId ?? undefined,
				});
				showToast(t("save_success"), "success");
				setShowSaveModal(false);
			} catch {
				showToast(t("save_error"), "error");
			} finally {
				setIsSavingToProject(false);
			}
		},
		[selectedGeneration?.id, saveToProjectMutation, showToast, t],
	);

	// Task 30d.3 + 30d.5: "Use as Input" handler - adds to editRefs, switches to Edit mode,
	// and auto-selects an appropriate I2I model (matching family if possible)
	const handleLoadAsInput = useCallback(async () => {
		const gen = persistedGenerations.find((g) => g.id === selectedGenerationId);
		if (!gen?.imageUrl) return;

		// Sprint 30d.5: Only show if I2I models are available
		if (!hasI2IModels) {
			showToast(t("no_edit_models_available"), "error");
			return;
		}

		const imageUrl = gen.imageUrl; // Type narrowing for TypeScript

		// Sprint 34 fix: add to editRefs respecting the target I2I schema's slot count.
		// Single-slot models (Kling v3 I2I, Grok I2I) replace the existing ref rather than
		// accumulating multiple refs (which would bypass canGenerate and send no image to FAL).
		const currentFamily = selectedSchema?.id.replace(/-t2i$/, "") ?? "";
		const targetI2I =
			i2iSchemas.find((s) => s.id.startsWith(currentFamily)) ??
			(i2iSchemas.length > 0 ? i2iSchemas[0] : null);
		const isMultiSlot = targetI2I?.capabilities?.multiImage ?? false;
		setEditRefs((prev) => {
			const newRef = { id: crypto.randomUUID(), url: imageUrl };
			if (!isMultiSlot) {
				// Single-slot model: replace (don't accumulate multiple refs)
				return [newRef];
			}
			// Multi-slot model: append, capped at MAX_MULTI_REFS (10)
			return [...prev, newRef].slice(0, 10);
		});

		// Sprint 30d.5: Auto-select matching I2I model family if possible
		if (targetI2I) {
			setSelectedI2ISchemaId(targetI2I.id);
		}

		// Switch to Edit mode
		setMode("edit");

		// Show toast
		showToast(t("image_loaded_as_input"), "success");
	}, [
		selectedGenerationId,
		persistedGenerations,
		showToast,
		t,
		hasI2IModels,
		selectedSchema,
		i2iSchemas,
	]);

	const copyImageToClipboard = useCallback(async () => {
		if (!generatedImage) return;
		try {
			const convertToPngBlob = async (imageUrl: string): Promise<Blob> => {
				return new Promise((resolve, reject) => {
					const img = new Image();
					img.crossOrigin = "anonymous";

					img.onload = () => {
						const canvas = document.createElement("canvas");
						canvas.width = img.width;
						canvas.height = img.height;
						const ctx = canvas.getContext("2d");

						if (!ctx) {
							reject(new Error(t("canvas_context_error")));
							return;
						}

						ctx.drawImage(img, 0, 0);
						canvas.toBlob(
							(blob) => {
								if (blob) {
									resolve(blob);
								} else {
									reject(new Error("Failed to convert to blob"));
								}
							},
							"image/png",
							1.0,
						);
					};

					img.onerror = () => reject(new Error("Failed to load image"));
					img.src = imageUrl;
				});
			};

			if (isMobile) {
				try {
					const pngBlob = await convertToPngBlob(generatedImage.url);
					const clipboardItem = new ClipboardItem({ "image/png": pngBlob });
					await navigator.clipboard.write([clipboardItem]);
					setToast({ message: t("image_copied"), type: "success" });
					setTimeout(() => setToast(null), 2000);
					return;
				} catch (_clipboardError) {
					try {
						const response = await fetch(generatedImage.url);
						const blob = await response.blob();
						const reader = new FileReader();
						reader.onloadend = async () => {
							try {
								await navigator.clipboard.writeText(reader.result as string);
								setToast({
									message: t("image_data_copied"),
									type: "success",
								});
								setTimeout(() => setToast(null), 3000);
							} catch (_err) {
								throw new Error("Clipboard not supported");
							}
						};
						reader.readAsDataURL(blob);
						return;
					} catch (_fallbackError) {
						setToast({
							message: t("copy_not_supported"),
							type: "error",
						});
						setTimeout(() => setToast(null), 3000);
						return;
					}
				}
			}

			setToast({ message: t("copying_image"), type: "success" });
			window.focus();

			const pngBlob = await convertToPngBlob(generatedImage.url);
			const clipboardItem = new ClipboardItem({ "image/png": pngBlob });
			await navigator.clipboard.write([clipboardItem]);

			setToast({ message: t("image_copied"), type: "success" });
			setTimeout(() => setToast(null), 2000);
		} catch (error) {
			console.error("Error copying image:", error);
			if (error instanceof Error && error.message.includes("not focused")) {
				setToast({
					message: t("copy_click_first"),
					type: "error",
				});
			} else {
				setToast({ message: t("copy_image_failed"), type: "error" });
			}
			setTimeout(() => setToast(null), 2000);
		}
	}, [generatedImage, isMobile, t]);

	const handleGlobalKeyboard = useCallback(
		(e: KeyboardEvent) => {
			const activeElement = document.activeElement;
			const isTyping =
				activeElement?.tagName === "TEXTAREA" ||
				activeElement?.tagName === "INPUT";

			if (
				(e.metaKey || e.ctrlKey) &&
				e.key === "c" &&
				generatedImage &&
				!e.shiftKey
			) {
				if (!isTyping) {
					e.preventDefault();
					copyImageToClipboard();
				}
			}
			if ((e.metaKey || e.ctrlKey) && e.key === "d" && generatedImage) {
				if (!isTyping) {
					e.preventDefault();
					downloadImage();
				}
			}
			if ((e.metaKey || e.ctrlKey) && e.key === "u" && generatedImage) {
				if (!isTyping) {
					e.preventDefault();
					handleLoadAsInput();
				}
			}
			// Layered Escape dismiss: close topmost overlay first
			if (e.key === "Escape") {
				if (showFullscreen) {
					closeFullscreen();
					return;
				}
				// ModelSelector (Dialog) & AdaptiveModal (Drawer) handle Escape internally.
				// Explicit fallback for any non-Radix overlay:
				if (historyOpen) {
					setHistoryOpen(false);
					return;
				}
				if (refsOpen) {
					setRefsOpen(false);
					return;
				}
			}
			if (
				showFullscreen &&
				(e.key === "ArrowLeft" || e.key === "ArrowRight") &&
				!isTyping
			) {
				e.preventDefault();
				const completedGenerations = persistedGenerations.filter(
					(g) => g.status === "complete" && g.imageUrl,
				);
				if (completedGenerations.length <= 1) return;

				const currentIndex = completedGenerations.findIndex(
					(g) => g.imageUrl === fullscreenImageUrl,
				);
				if (currentIndex === -1) return;

				if (e.key === "ArrowLeft") {
					const prevIndex =
						currentIndex === 0
							? completedGenerations.length - 1
							: currentIndex - 1;
					const prev = completedGenerations[prevIndex];
					if (prev?.imageUrl) {
						setFullscreenImageUrl(prev.imageUrl);
						setSelectedGenerationId(prev.id);
					}
				} else if (e.key === "ArrowRight") {
					const nextIndex =
						currentIndex === completedGenerations.length - 1
							? 0
							: currentIndex + 1;
					const next = completedGenerations[nextIndex];
					if (next?.imageUrl) {
						setFullscreenImageUrl(next.imageUrl);
						setSelectedGenerationId(next.id);
					}
				}
			}
		},
		[
			generatedImage,
			showFullscreen,
			historyOpen,
			refsOpen,
			copyImageToClipboard,
			downloadImage,
			handleLoadAsInput,
			closeFullscreen,
			persistedGenerations,
			fullscreenImageUrl,
			setSelectedGenerationId,
		],
	);

	const handleGlobalPaste = useCallback(
		async (e: ClipboardEvent) => {
			const activeElement = document.activeElement;
			if (
				activeElement?.tagName !== "TEXTAREA" &&
				activeElement?.tagName !== "INPUT"
			) {
				const items = e.clipboardData?.items;
				if (items) {
					for (let i = 0; i < items.length; i++) {
						const item = items[i];
						if (item.type.startsWith("image/")) {
							e.preventDefault();
							const file = item.getAsFile();
							if (file) {
								setUseUrls(false);
								if (!image1) {
									await handleImageUpload(file, 1);
									showToast(t("image_pasted_ok"), "success");
								} else if (!image2) {
									await handleImageUpload(file, 2);
									showToast(t("image_pasted_second"), "success");
								} else {
									await handleImageUpload(file, 1);
									showToast(t("image_replaced_first"), "success");
								}
							}
							return;
						}
					}
				}

				const pastedText = e.clipboardData?.getData("text");

				if (!pastedText) return;

				const urlPattern = /https?:\/\/[^\s]+/i;
				const imagePattern =
					/\.(jpg|jpeg|png|gif|webp|bmp|svg)|format=(jpg|jpeg|png|gif|webp)/i;

				const match = pastedText.match(urlPattern);

				if (match) {
					const url = match[0];
					if (
						imagePattern.test(url) ||
						url.includes("/media/") ||
						url.includes("/images/")
					) {
						e.preventDefault();

						const targetSlot = !image1Url ? 1 : !image2Url ? 2 : 1;

						setUseUrls(true);

						setTimeout(() => {
							handleUrlChange(url, targetSlot);
							showToast(
								targetSlot === 1
									? t("url_pasted_first")
									: t("url_pasted_second"),
								"success",
							);
						}, 150);
					}
				}
			}
		},
		[
			image1,
			image2,
			image1Url,
			image2Url,
			handleImageUpload,
			handleUrlChange,
			showToast,
			t,
		],
	);

	const _handlePromptPaste = useCallback(
		async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
			const pastedText = e.clipboardData.getData("text");

			const urlPattern = /https?:\/\/[^\s]+/i;
			const imagePattern =
				/\.(jpg|jpeg|png|gif|webp|bmp|svg)|format=(jpg|jpeg|png|gif|webp)/i;

			const match = pastedText.match(urlPattern);

			if (match) {
				const url = match[0];
				if (
					imagePattern.test(url) ||
					url.includes("/media/") ||
					url.includes("/images/")
				) {
					e.preventDefault();

					if (!useUrls) {
						setUseUrls(true);
					}

					if (!image1Url) {
						handleUrlChange(url, 1);
						showToast(t("url_loaded_first"), "success");
					} else if (!image2Url) {
						handleUrlChange(url, 2);
						showToast(t("url_loaded_second"), "success");
					} else {
						handleUrlChange(url, 1);
						showToast(t("url_replaced_first"), "success");
					}
				}
			}
		},
		[useUrls, image1Url, image2Url, handleUrlChange, showToast, t],
	);

	const handleGlobalDragEnter = useCallback((e: DragEvent) => {
		e.preventDefault();
		setDragCounter((prev) => prev + 1);
		const items = e.dataTransfer?.items;
		if (items) {
			for (let i = 0; i < items.length; i++) {
				if (items[i].kind === "file" && items[i].type.startsWith("image/")) {
					setIsDraggingOver(true);
					break;
				}
			}
		}
	}, []);

	const handleGlobalDragOver = useCallback((e: DragEvent) => {
		e.preventDefault();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = "copy";
		}
	}, []);

	const handleGlobalDragLeave = useCallback((e: DragEvent) => {
		e.preventDefault();
		setDragCounter((prev) => {
			const newCount = prev - 1;
			if (newCount <= 0) {
				setIsDraggingOver(false);
				return 0;
			}
			return newCount;
		});
	}, []);

	const handleGlobalDrop = useCallback(
		async (e: DragEvent | React.DragEvent, slot?: 1 | 2) => {
			e.preventDefault();
			setIsDraggingOver(false);
			setDragCounter(0);
			setDropZoneHover(null);

			const files = e.dataTransfer?.files;
			if (files && files.length > 0) {
				const file = files[0];
				if (file.type.startsWith("image/")) {
					setUseUrls(false);
					const targetSlot = slot || 1;
					await handleImageUpload(file, targetSlot);
					showToast(
						targetSlot === 1
							? t("image_dropped_first")
							: t("image_dropped_second"),
						"success",
					);
				}
			}
		},
		[handleImageUpload, showToast, t],
	);

	useEffect(() => {
		document.addEventListener("keydown", handleGlobalKeyboard);
		document.addEventListener("paste", handleGlobalPaste);
		document.addEventListener("dragover", handleGlobalDragOver);
		document.addEventListener("dragleave", handleGlobalDragLeave);
		document.addEventListener("dragenter", handleGlobalDragEnter);
		return () => {
			document.removeEventListener("keydown", handleGlobalKeyboard);
			document.removeEventListener("paste", handleGlobalPaste);
			document.removeEventListener("dragover", handleGlobalDragOver);
			document.removeEventListener("dragleave", handleGlobalDragLeave);
			document.removeEventListener("dragenter", handleGlobalDragEnter);
		};
	}, [
		handleGlobalKeyboard,
		handleGlobalPaste,
		handleGlobalDragOver,
		handleGlobalDragLeave,
		handleGlobalDragEnter,
	]);

	const _clearAll = useCallback(() => {
		setPrompt("");
		clearImage(1);
		clearImage(2);
	}, [clearImage]);

	const handleFullscreenNavigate = useCallback(
		(direction: "prev" | "next") => {
			const completedGenerations = persistedGenerations.filter(
				(g) => g.status === "complete" && g.imageUrl,
			);
			const currentIndex = completedGenerations.findIndex(
				(g) => g.imageUrl === fullscreenImageUrl,
			);
			if (currentIndex === -1) return;

			let newIndex: number;
			if (direction === "prev") {
				newIndex =
					currentIndex === 0
						? completedGenerations.length - 1
						: currentIndex - 1;
			} else {
				newIndex =
					currentIndex === completedGenerations.length - 1
						? 0
						: currentIndex + 1;
			}

			const item = completedGenerations[newIndex];
			if (item?.imageUrl) {
				setFullscreenImageUrl(item.imageUrl);
				setSelectedGenerationId(item.id);
			}
		},
		[persistedGenerations, fullscreenImageUrl, setSelectedGenerationId],
	);

	/* Resize handlers removed — split-screen layout dismantled (Sprint 30c Task 1) */

	// JSON-LD for SEO (injected via effect to avoid dangerouslySetInnerHTML)
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "WebApplication",
		name: "MyShortReel Image Generator",
		alternateName: "MyShortReel Image Tool",
		description:
			"MyShortReel Image Generator is a powerful AI image generation and editing tool. Create, edit, and transform images with natural language prompts using Kling, Grok, and Nano Banana models.",
		url: "https://myshortreel.com/tools/image-generator",
		applicationCategory: "MultimediaApplication",
		operatingSystem: "Web Browser",
		offers: {
			"@type": "Offer",
			price: "0",
			priceCurrency: "USD",
		},
		creator: {
			"@type": "Organization",
			name: "MyShortReel",
			url: "https://myshortreel.com",
		},
		keywords:
			"AI image generation, AI image editor, text to image, image to image, Kling image, Grok image, Nano Banana, MyShortReel",
	};
	useEffect(() => {
		const script = document.createElement("script");
		script.type = "application/ld+json";
		script.textContent = JSON.stringify(jsonLd);
		document.head.appendChild(script);
		return () => {
			document.head.removeChild(script);
		};
	}, []);

	return (
		<div className="relative min-h-[calc(100vh-64px)] bg-background select-none">
			{/* Modals & overlays */}
			{toast && <ToastNotification message={toast.message} type={toast.type} />}

			<InsufficientCreditsModal
				isOpen={showInsufficientCredits}
				onClose={() => setShowInsufficientCredits(false)}
				required={creditCost?.credits ?? required ?? 0}
				available={balance ?? 0}
				actionName={t("run")}
				returnUrl={
					typeof window !== "undefined" ? window.location.href : undefined
				}
			/>

			{isDraggingOver && (
				<GlobalDropZone
					dropZoneHover={dropZoneHover}
					onSetDropZoneHover={setDropZoneHover}
					onDrop={handleGlobalDrop}
					input1Label={t("drop_zone_input1")}
					input2Label={t("drop_zone_input2")}
					dropFirstLabel={t("drop_zone_first")}
					dropSecondLabel={t("drop_zone_second")}
				/>
			)}

			{/* ── Layer 0: Canvas — OutputSection stops above the floating prompt bar ── */}
			<div
				className="absolute inset-x-0 top-0 z-0"
				style={{ bottom: "var(--ig-canvas-bottom-offset, 180px)" }}
			>
				<OutputSection
					selectedGeneration={selectedGeneration}
					generations={persistedGenerations}
					selectedGenerationId={selectedGenerationId}
					setSelectedGenerationId={setSelectedGenerationId}
					isConvertingHeic={isConvertingHeic}
					heicProgress={heicProgress}
					imageLoaded={imageLoaded}
					setImageLoaded={setImageLoaded}
					onCancelGeneration={cancelGeneration}
					onDeleteGeneration={deleteGeneration}
					onOpenFullscreen={openFullscreen}
					onLoadAsInput={handleLoadAsInput}
					onCopy={copyImageToClipboard}
					onDownload={downloadImage}
					onOpenInNewTab={openImageInNewTab}
					onUseInVideo={handleUseInVideo}
					useInVideoLabel={t("use_in_video")}
					hasI2IModels={hasI2IModels}
					onSaveToProject={
						clerkUserId && selectedGeneration?.id
							? () => setShowSaveModal(true)
							: undefined
					}
					saveToProjectLabel={t("save_to_project")}
				/>
			</div>

			{/* ── Layer 1: Top — PremiumTabSystem (z-40) — Model selector now in pills */}
			<PremiumTabSystem
				mode={mode}
				setMode={setMode}
				selectedModelName={selectedSchema?.name ?? t("loading_models")}
				onModelSelectorOpen={() => setModelSelectorOpen(true)}
				showModelSelector={false}
			/>

			{/* ── Layer 5: ModelSelector modal (z-50 via Dialog) ── */}
			<ModelSelector
				open={modelSelectorOpen}
				onOpenChange={setModelSelectorOpen}
				selectedSchema={selectedSchema}
				t2iSchemas={t2iSchemas}
				i2iSchemas={i2iSchemas}
				onSelectSchema={(schema) => {
					// Task 30d.1 + 30d.5: Wire model selection state (now from Convex)
					// Sprint 34 fix: use schema.type field instead of fragile modelId string matching
					if (schema.type === "i2i") {
						setSelectedI2ISchemaId(schema.id);
						setMode("edit");
					} else {
						setSelectedT2ISchemaId(schema.id);
						setMode("generate");
					}
					setParams(getDefaultParamsFromSchema(schema));
				}}
			/>

			{/* Save to project modal (reuse voice ProjectSelector) */}
			<ProjectSelector
				open={showSaveModal}
				onOpenChange={setShowSaveModal}
				onConfirm={handleSaveToProject}
				isConfirming={isSavingToProject}
				translationNamespace="image_generator.project_selector"
			/>

			{/* ── Layer 2: Bottom — Floating Prompt Bar (z-40) with inline pills ── */}
			<FloatingPromptBar
				prompt={prompt}
				onPromptChange={setPrompt}
				onGenerate={runGeneration}
				creditCost={creditCost?.credits ?? 0}
				canGenerate={canGenerate}
				isLoading={isGenerating}
				schema={selectedSchema}
				params={params}
				onParamChange={(key, value) =>
					setParams((prev) => ({ ...prev, [key]: value }))
				}
				onModelSelectorOpen={() => setModelSelectorOpen(true)}
				mode={mode}
			/>

			{/* ── Layer 3: Floating Options (z-30) ── */}
			{selectedSchema && (
				<FloatingOptionsPanel
					key={selectedSchema.id}
					schema={selectedSchema}
					params={params}
					onParamsChange={(key, value) =>
						setParams((prev) => ({ ...prev, [key]: value }))
					}
					mode={mode}
				/>
			)}

			{/* ── Layer 4: Edit mode — Floating RefsPanel (z-30) ── */}
			{mode === "edit" && selectedSchema && (
				<>
					{/* Desktop (lg+): floating left glass panel */}
					<div className="hidden lg:block fixed top-24 left-6 w-80 z-30">
						<div className="rounded-xl backdrop-blur-md bg-background/60 border border-border/50 shadow-lg p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
							<RefsPanel
								schema={selectedSchema}
								refs={editRefs}
								onRefsChange={setEditRefs}
								generations={persistedGenerations.filter(
									(g) => g.status === "complete" && g.imageUrl,
								)}
								onUpload={async (file) => {
									const url = URL.createObjectURL(file);
									setEditRefs((prev) => [
										...prev,
										{ id: crypto.randomUUID(), url },
									]);
								}}
							/>
						</div>
					</div>

					{/* Tablet/Mobile: floating trigger + Drawer */}
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setRefsOpen(true)}
						className="fixed left-4 z-30 min-h-[44px] min-w-[44px] rounded-xl backdrop-blur-md bg-background/60 border border-border/50 shadow-lg active:scale-95 transition-smooth lg:hidden"
						style={{ bottom: "var(--ig-mobile-button-offset, 140px)" }}
						aria-label={t("edit_refs_label")}
					>
						<ImageIcon className="size-5" aria-hidden="true" />
					</Button>
					<AdaptiveModal
						isOpen={refsOpen}
						onClose={() => setRefsOpen(false)}
						title={t("edit_refs_label")}
					>
						<div
							className={`${orientation === "landscape" ? "max-h-[80vh]" : "max-h-[60vh]"} overflow-y-auto px-1`}
						>
							<RefsPanel
								schema={selectedSchema}
								refs={editRefs}
								onRefsChange={setEditRefs}
								generations={persistedGenerations.filter(
									(g) => g.status === "complete" && g.imageUrl,
								)}
								onUpload={async (file) => {
									const url = URL.createObjectURL(file);
									setEditRefs((prev) => [
										...prev,
										{ id: crypto.randomUUID(), url },
									]);
								}}
							/>
						</div>
					</AdaptiveModal>
				</>
			)}

			{/* ── History trigger — floating button ── */}
			<Button
				variant="ghost"
				size="icon"
				onClick={() => setHistoryOpen(true)}
				className={cn(
					"fixed z-30 min-h-[44px] min-w-[44px] rounded-xl backdrop-blur-md bg-background/60 border border-border/50 shadow-lg active:scale-95 transition-smooth",
					"lg:bottom-6 lg:left-6",
					// Mobile/Tablet: left in Generate mode, right in Edit mode (Refs is on left)
					mode === "edit" ? "right-4 lg:left-6 lg:right-auto" : "left-4",
				)}
				style={
					isTouchDevice
						? { bottom: "var(--ig-mobile-button-offset, 140px)" }
						: undefined
				}
				aria-label={t("history")}
			>
				<History className="size-5" aria-hidden="true" />
			</Button>

			{/* ── History modal (AdaptiveModal: Dialog on desktop, Drawer on mobile) ── */}
			<AdaptiveModal
				isOpen={historyOpen}
				onClose={() => setHistoryOpen(false)}
				title={t("history")}
			>
				<GenerationHistory
					generations={persistedGenerations}
					selectedId={selectedGenerationId}
					onSelect={(id) => {
						setSelectedGenerationId(id);
						setHistoryOpen(false);
					}}
					onCancel={cancelGeneration}
					onDelete={deleteGeneration}
					isLoading={historyLoading}
					hasMore={hasMore}
					onLoadMore={loadMore}
					isLoadingMore={isLoadingMore}
					historyLabel={t("history")}
					noGenerationsLabel={t("empty_history_title")}
					cancelLabel={t("cancel")}
					loadMoreLabel={t("load_more")}
					deleteAriaLabel={t("delete_generation")}
					failedLabel={t("generation_failed_label")}
					emptyStateTitle={t("empty_history_title")}
					emptyStateDescription={t("empty_history_description")}
					emptyStateCtaLabel={t("empty_history_cta")}
					onEmptyStateCta={() => {
						setHistoryOpen(false);
						runGeneration();
					}}
				/>
			</AdaptiveModal>

			{/* ── Fullscreen viewer ── */}
			{showFullscreen && fullscreenImageUrl && (
				<FullscreenViewer
					imageUrl={fullscreenImageUrl}
					generations={persistedGenerations}
					onClose={closeFullscreen}
					onNavigate={handleFullscreenNavigate}
				/>
			)}
		</div>
	);
}

export default ImageCombiner;
