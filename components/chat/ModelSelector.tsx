"use client";

import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import {
	startTransition,
	useEffect,
	useMemo,
	useOptimistic,
	useRef,
	useState,
} from "react";
import { api } from "@/convex/_generated/api";

// ── Types ─────────────────────────────────────────────────────────────────────

type ModelCategory =
	| "flagship"
	| "balanced"
	| "fast"
	| "reasoning"
	| "coding"
	| "vision";

type ModelProvider =
	| "anthropic"
	| "openai"
	| "google"
	| "xai"
	| "deepseek"
	| "meta"
	| "mistral";

type AiModel = {
	_id: string;
	modelId: string;
	displayName: string;
	description: string;
	bestAt: string;
	provider: ModelProvider;
	category: ModelCategory;
	isEnabled: boolean;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORY_ORDER: ModelCategory[] = [
	"flagship",
	"balanced",
	"fast",
	"reasoning",
	"coding",
	"vision",
];

const CATEGORY_LABEL_KEYS: Record<ModelCategory, string> = {
	flagship: "modelSelector.categories.flagship",
	balanced: "modelSelector.categories.balanced",
	fast: "modelSelector.categories.fast",
	reasoning: "modelSelector.categories.reasoning",
	coding: "modelSelector.categories.coding",
	vision: "modelSelector.categories.vision",
};

// Provider badge — Tailwind color classes (standard, not custom tokens)
const PROVIDER_CONFIG: Record<
	ModelProvider,
	{ label: string; className: string }
> = {
	anthropic: {
		label: "A",
		className:
			"bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
	},
	openai: {
		label: "O",
		className:
			"bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
	},
	google: {
		label: "G",
		className:
			"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
	},
	xai: {
		label: "X",
		className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
	},
	deepseek: {
		label: "D",
		className:
			"bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
	},
	meta: {
		label: "M",
		className:
			"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
	},
	mistral: {
		label: "Mi",
		className:
			"bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
	},
};

// ── Sub-components ────────────────────────────────────────────────────────────

function ProviderBadge({ provider }: { provider: ModelProvider }) {
	const cfg = PROVIDER_CONFIG[provider];
	return (
		<span
			className={`inline-flex items-center justify-center size-5 rounded text-[10px] font-semibold shrink-0 leading-none ${cfg.className}`}
			aria-hidden="true"
		>
			{cfg.label}
		</span>
	);
}

function CheckIcon() {
	return (
		<svg
			viewBox="0 0 16 16"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="size-3.5 shrink-0"
			aria-hidden="true"
		>
			<path d="M2.5 8.5L6 12 13.5 4" />
		</svg>
	);
}

function ChevronIcon({ open }: { open: boolean }) {
	return (
		<svg
			viewBox="0 0 16 16"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="size-3 shrink-0 transition-transform duration-150"
			style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
			aria-hidden="true"
		>
			<path d="M4 6l4 4 4-4" />
		</svg>
	);
}

// ── Main component ────────────────────────────────────────────────────────────

interface ModelSelectorProps {
	selectedModelId: string;
	onModelChange?: (modelId: string) => void;
	className?: string;
}

export function ModelSelector({
	selectedModelId,
	onModelChange,
	className,
}: ModelSelectorProps) {
	const t = useTranslations("chat");
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const rawModels = useQuery(api.aiModels.list);
	const models = (rawModels ?? []) as AiModel[];

	// Optimistic selection for instant UI feedback
	const [optimisticModelId, setOptimisticModelId] =
		useOptimistic(selectedModelId);

	// Close on outside click
	useEffect(() => {
		if (!open) return;
		const handler = (e: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [open]);

	// Close on Escape
	useEffect(() => {
		if (!open) return;
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") setOpen(false);
		};
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [open]);

	const selectedModel = models.find((m) => m.modelId === optimisticModelId);

	// TODO: add entitlements filtering when credit tiers are wired
	// (see vantage-studio model-selector.tsx:178-187)

	// Group by category in canonical order — memoized
	const byCategory = useMemo(
		() =>
			CATEGORY_ORDER.reduce<Record<string, AiModel[]>>((acc, cat) => {
				const group = models.filter((m) => m.category === cat && m.isEnabled);
				if (group.length > 0) acc[cat] = group;
				return acc;
			}, {}),
		[models],
	);

	function handleSelect(modelId: string) {
		startTransition(() => {
			setOptimisticModelId(modelId);
			onModelChange?.(modelId);
		});
		setOpen(false);
	}

	return (
		<div
			ref={containerRef}
			className={`relative${className ? ` ${className}` : ""}`}
		>
			{/* Trigger button */}
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-haspopup="listbox"
				aria-expanded={open}
				className="border border-border rounded-lg px-2 h-[34px] gap-2 flex items-center text-sm bg-transparent hover:bg-muted/50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
			>
				{selectedModel ? (
					<ProviderBadge provider={selectedModel.provider} />
				) : null}
				<span className="truncate max-w-[120px] text-foreground">
					{selectedModel?.displayName ?? t("modelSelector.selectPlaceholder")}
				</span>
				<ChevronIcon open={open} />
			</button>

			{/* Dropdown */}
			{open && (
				<div
					role="listbox"
					aria-label={t("modelSelector.ariaLabel")}
					className="absolute top-full left-0 mt-1.5 z-50 min-w-[320px] max-h-[400px] overflow-y-auto rounded-xl border border-border bg-card shadow-lg"
				>
					{CATEGORY_ORDER.map((cat, catIdx) => {
						const group = byCategory[cat];
						if (!group) return null;

						return (
							<div key={cat}>
								{/* Separator between categories */}
								{catIdx > 0 && (
									<div className="h-px bg-border mx-2" aria-hidden="true" />
								)}
								{/* Category label */}
								<div className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-3 py-1.5">
									{t(CATEGORY_LABEL_KEYS[cat])}
								</div>
								{/* Models */}
								{group.map((model) => {
									const isSelected = model.modelId === optimisticModelId;
									return (
										<button
											type="button"
											role="option"
											aria-selected={isSelected}
											key={model.modelId}
											onClick={() => handleSelect(model.modelId)}
											className="flex items-center gap-3 w-full px-3 py-2 min-h-[44px] cursor-pointer hover:bg-muted/50 rounded-md mx-1 transition-colors text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
											style={{ width: "calc(100% - 0.5rem)" }}
										>
											<ProviderBadge provider={model.provider} />
											<div className="flex-1 min-w-0">
												<div className="text-sm font-medium text-foreground">
													{model.displayName}
												</div>
												<div className="text-xs text-muted-foreground truncate">
													{model.bestAt || model.description}
												</div>
											</div>
											<span
												className="text-primary transition-opacity duration-100 shrink-0"
												style={{ opacity: isSelected ? 1 : 0 }}
												aria-hidden="true"
											>
												<CheckIcon />
											</span>
										</button>
									);
								})}
							</div>
						);
					})}

					{/* Empty state */}
					{models.length === 0 && (
						<div className="px-3 py-4 text-sm text-muted-foreground text-center">
							{t("modelSelector.loading")}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
