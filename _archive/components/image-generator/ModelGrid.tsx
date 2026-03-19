"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ModelCard } from "./ModelCard";
import type { ModelSchema } from "./types/schema";

interface ModelGridProps {
	schemas: ModelSchema[];
	/** Map of creditActionType -> credits (from Convex creditCosts). */
	creditCosts?: Record<string, number>;
	selectedSchema?: ModelSchema | null;
	onSelectSchema: (schema: ModelSchema) => void;
	className?: string;
}

export function ModelGrid({
	schemas,
	creditCosts,
	selectedSchema,
	onSelectSchema,
	className,
}: ModelGridProps) {
	const t = useTranslations("image_generator");
	return (
		<ul
			className={cn(
				"grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 list-none p-0 m-0",
				className,
			)}
			aria-label={t("model_grid_aria_label")}
		>
			{schemas.map((schema) => (
				<li key={schema.id} className="list-none">
					<ModelCard
						schema={schema}
						creditCost={creditCosts?.[schema.creditActionType]}
						selected={selectedSchema?.id === schema.id}
						onSelect={() => onSelectSchema(schema)}
					/>
				</li>
			))}
		</ul>
	);
}
