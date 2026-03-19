"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { AdaptiveModal } from "@/components/adaptive/AdaptiveModal";
import { useDevice } from "@/contexts/DeviceContext";
import { cn } from "@/lib/utils";
import type { VideoModelSchema, VideoModelType } from "./types/schema";
import { VideoModelCard } from "./VideoModelCard";

interface VideoModelSelectorProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	selectedSchema: VideoModelSchema | null;
	onSelectSchema: (schema: VideoModelSchema) => void;
	schemas: VideoModelSchema[];
	/** Map of actionType → credit cost for default tier. */
	creditCosts?: Record<string, number>;
}

const TYPE_GROUP_KEY: Record<VideoModelType, string> = {
	i2v: "group_i2v",
	r2v: "group_r2v",
	v2v: "group_v2v",
};

export function VideoModelSelector({
	open,
	onOpenChange,
	selectedSchema,
	onSelectSchema,
	schemas,
	creditCosts = {},
}: VideoModelSelectorProps) {
	const t = useTranslations("storyboard");
	const tModels = useTranslations("video_models");
	const { isMobile } = useDevice();

	/** Derive unique types in order they appear, for dynamic grouping. */
	const groups = useMemo(() => {
		const seen = new Set<VideoModelType>();
		const order: VideoModelType[] = [];
		for (const s of schemas) {
			if (!seen.has(s.type)) {
				seen.add(s.type);
				order.push(s.type);
			}
		}
		return order.map((type) => ({
			type,
			schemas: schemas.filter((s) => s.type === type),
		}));
	}, [schemas]);

	const handleSelect = (schema: VideoModelSchema) => {
		onSelectSchema(schema);
		onOpenChange(false);
	};

	return (
		<AdaptiveModal
			isOpen={open}
			onClose={() => onOpenChange(false)}
			title={t("model_selector")}
			size="large"
		>
			<div className="flex flex-col gap-6 overflow-y-auto pb-4">
				{groups.map(({ type, schemas: groupSchemas }) => (
					<div key={type} className="flex flex-col gap-3">
						<h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
							{tModels(TYPE_GROUP_KEY[type] as never)}
						</h3>
						<div
							className={cn(
								"grid gap-3",
								isMobile ? "grid-cols-2" : "grid-cols-3",
							)}
						>
							{groupSchemas.map((schema) => {
								const defaultTier = schema.creditTiers[0];
								const cost = defaultTier
									? (creditCosts[defaultTier.actionType] ?? undefined)
									: undefined;
								return (
									<VideoModelCard
										key={schema.schemaId}
										schema={schema}
										creditCost={cost}
										selected={selectedSchema?.schemaId === schema.schemaId}
										onSelect={() => handleSelect(schema)}
									/>
								);
							})}
						</div>
					</div>
				))}
				{schemas.length === 0 && (
					<p className="py-8 text-center text-sm text-muted-foreground">
						{t("model_selector")}
					</p>
				)}
			</div>
		</AdaptiveModal>
	);
}
