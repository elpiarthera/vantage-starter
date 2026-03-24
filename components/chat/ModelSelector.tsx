"use client";

import { useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
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

const CATEGORY_LABELS: Record<ModelCategory, string> = {
	flagship: "Flagship",
	balanced: "Balanced",
	fast: "Fast",
	reasoning: "Reasoning",
	coding: "Coding",
	vision: "Vision",
};

// Provider badge colors in OKLCH — no hex, no Tailwind gray-*
const PROVIDER_CONFIG: Record<
	ModelProvider,
	{ label: string; bg: string; color: string }
> = {
	anthropic: {
		label: "A",
		bg: "oklch(0.93 0.04 30)",
		color: "oklch(0.45 0.15 30)",
	},
	openai: {
		label: "O",
		bg: "oklch(0.90 0.01 145)",
		color: "oklch(0.40 0.08 145)",
	},
	google: {
		label: "G",
		bg: "oklch(0.90 0.04 250)",
		color: "oklch(0.42 0.15 250)",
	},
	xai: {
		label: "X",
		bg: "oklch(0.88 0.0 0)",
		color: "oklch(0.30 0.0 0)",
	},
	deepseek: {
		label: "D",
		bg: "oklch(0.90 0.04 200)",
		color: "oklch(0.42 0.14 200)",
	},
	meta: {
		label: "M",
		bg: "oklch(0.90 0.04 250)",
		color: "oklch(0.42 0.15 250)",
	},
	mistral: {
		label: "Mi",
		bg: "oklch(0.90 0.04 280)",
		color: "oklch(0.42 0.14 280)",
	},
};

// ── Sub-components ────────────────────────────────────────────────────────────

function ProviderBadge({ provider }: { provider: ModelProvider }) {
	const cfg = PROVIDER_CONFIG[provider];
	return (
		<span
			style={{ background: cfg.bg, color: cfg.color }}
			className="inline-flex items-center justify-center size-5 rounded text-[10px] font-semibold shrink-0 leading-none"
			aria-hidden="true"
		>
			{cfg.label}
		</span>
	);
}

// Checkmark SVG (no icon library)
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

// Chevron SVG
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
	onModelChange: (modelId: string) => void;
}

export function ModelSelector({
	selectedModelId,
	onModelChange,
}: ModelSelectorProps) {
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const rawModels = useQuery(api.aiModels.list);

	// Cast to our local type — Convex returns the full doc shape
	const models = (rawModels ?? []) as AiModel[];

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

	const selectedModel = models.find((m) => m.modelId === selectedModelId);

	// Group by category in canonical order
	const byCategory = CATEGORY_ORDER.reduce<Record<string, AiModel[]>>(
		(acc, cat) => {
			const group = models.filter((m) => m.category === cat);
			if (group.length > 0) acc[cat] = group;
			return acc;
		},
		{},
	);

	return (
		<div ref={containerRef} className="relative">
			{/* Trigger button */}
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-haspopup="listbox"
				aria-expanded={open}
				className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-border bg-card text-foreground text-sm font-medium hover:bg-muted transition-colors duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
			>
				{selectedModel ? (
					<ProviderBadge provider={selectedModel.provider} />
				) : null}
				<span className="truncate max-w-[120px]">
					{selectedModel?.displayName ?? "Select model"}
				</span>
				<ChevronIcon open={open} />
			</button>

			{/* Dropdown */}
			{open && (
				<div
					role="listbox"
					aria-label="Select AI model"
					className="absolute top-full left-0 mt-1.5 z-50 w-[300px] max-h-[360px] overflow-y-auto rounded-xl border border-border bg-card shadow-lg"
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
								<div className="px-3 pt-2 pb-1">
									<span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
										{CATEGORY_LABELS[cat]}
									</span>
								</div>
								{/* Models */}
								{group.map((model) => {
									const isSelected = model.modelId === selectedModelId;
									return (
										<button
											type="button"
											role="option"
											aria-selected={isSelected}
											key={model.modelId}
											onClick={() => {
												onModelChange(model.modelId);
												setOpen(false);
											}}
											className="flex items-center gap-2.5 w-full px-3 py-2 text-left hover:bg-muted transition-colors duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
										>
											<ProviderBadge provider={model.provider} />
											<div className="flex-1 min-w-0">
												<div className="text-sm font-medium text-foreground truncate">
													{model.displayName}
												</div>
												<div className="text-xs text-muted-foreground truncate">
													{model.bestAt || model.description}
												</div>
											</div>
											<span
												className="text-primary transition-opacity duration-100"
												style={{ opacity: isSelected ? 1 : 0 }}
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
							Loading models…
						</div>
					)}
				</div>
			)}
		</div>
	);
}
