"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { AdaptiveModal } from "@/components/adaptive/AdaptiveModal";
import { Input } from "@/components/ui/input";
import type { VoiceModelSchema } from "./hooks/use-convex-voice-schemas";
import { VoiceModelGrid } from "./VoiceModelGrid";

interface VoiceModelSelectorProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	selectedSchema: VoiceModelSchema | null;
	onSelectSchema: (schema: VoiceModelSchema) => void;
	/** TTS schemas from Convex. */
	ttsSchemas: VoiceModelSchema[];
	/** Map of creditActionType -> credits (optional). */
	creditCosts?: Record<string, number>;
}

export function VoiceModelSelector({
	open,
	onOpenChange,
	selectedSchema,
	onSelectSchema,
	ttsSchemas,
	creditCosts,
}: VoiceModelSelectorProps) {
	const t = useTranslations("voice_generator");
	const [search, setSearch] = useState("");

	const filteredSchemas = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return ttsSchemas;
		return ttsSchemas.filter(
			(s) =>
				s.name.toLowerCase().includes(q) ||
				s.schemaId.toLowerCase().includes(q) ||
				s.modelId.toLowerCase().includes(q),
		);
	}, [ttsSchemas, search]);

	const isEmpty = filteredSchemas.length === 0;

	return (
		<AdaptiveModal
			isOpen={open}
			onClose={() => onOpenChange(false)}
			title={t("model_selector_title")}
		>
			<div className="flex flex-col gap-4 min-h-0 flex-1 overflow-hidden">
				{/* Search */}
				<div className="relative flex-shrink-0">
					<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						type="search"
						placeholder={t("search_models")}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="pl-9 min-h-[44px] text-base"
						aria-label={t("search_models")}
					/>
				</div>
				{/* Grid or empty state */}
				<div
					className="min-h-0 flex-1 overflow-y-auto"
					aria-live="polite"
					aria-atomic="false"
				>
					{isEmpty ? (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<div className="mb-4 rounded-full bg-muted p-6">
								<Search className="size-6 text-muted-foreground" />
							</div>
							<h3 className="mb-2 text-lg font-semibold">
								{t("no_models_found")}
							</h3>
							<p className="mb-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
								{search
									? t("no_models_match", { search })
									: t("loading_models")}
							</p>
						</div>
					) : (
						<VoiceModelGrid
							schemas={filteredSchemas}
							creditCosts={creditCosts}
							selectedSchema={selectedSchema}
							onSelectSchema={(schema) => {
								onSelectSchema(schema);
								onOpenChange(false);
							}}
						/>
					)}
				</div>
			</div>
		</AdaptiveModal>
	);
}
