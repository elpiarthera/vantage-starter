"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { VoiceModelSchema } from "./hooks/use-convex-voice-schemas";
import { VoiceModelCard } from "./VoiceModelCard";

interface VoiceModelGridProps {
	schemas: VoiceModelSchema[];
	/** Map of creditActionType -> credits (from Convex creditCosts). */
	creditCosts?: Record<string, number>;
	selectedSchema?: VoiceModelSchema | null;
	onSelectSchema: (schema: VoiceModelSchema) => void;
	className?: string;
}

export function VoiceModelGrid({
	schemas,
	creditCosts,
	selectedSchema,
	onSelectSchema,
	className,
}: VoiceModelGridProps) {
	const t = useTranslations("voice_generator");
	return (
		<ul
			className={cn(
				"grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 md:gap-4 list-none p-0 m-0",
				className,
			)}
			aria-label={t("model_selector_title")}
		>
			{schemas.map((schema) => (
				<li key={schema.schemaId} className="list-none">
					<VoiceModelCard
						schema={schema}
						creditCost={creditCosts?.[schema.creditActionType]}
						selected={selectedSchema?.schemaId === schema.schemaId}
						onSelect={() => onSelectSchema(schema)}
					/>
				</li>
			))}
		</ul>
	);
}
