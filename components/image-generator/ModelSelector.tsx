"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ModelGrid } from "./ModelGrid";
import type { ModelSchema } from "./types/schema";

export type ModelCategory = "all" | "t2i" | "i2i";

interface ModelSelectorProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	selectedSchema: ModelSchema | null;
	onSelectSchema: (schema: ModelSchema) => void;
	/** Sprint 30d.5: T2I schemas from Convex. */
	t2iSchemas: ModelSchema[];
	/** Sprint 30d.5: I2I schemas from Convex. */
	i2iSchemas: ModelSchema[];
	/** Map of creditActionType -> credits (optional). */
	creditCosts?: Record<string, number>;
}

export function ModelSelector({
	open,
	onOpenChange,
	selectedSchema,
	onSelectSchema,
	t2iSchemas,
	i2iSchemas,
	creditCosts,
}: ModelSelectorProps) {
	const t = useTranslations("image_generator");
	const [search, setSearch] = useState("");
	const [category, setCategory] = useState<ModelCategory>("all");

	const schemasByCategory = useMemo(() => {
		if (category === "t2i") return t2iSchemas;
		if (category === "i2i") return i2iSchemas;
		return [...t2iSchemas, ...i2iSchemas];
	}, [category, t2iSchemas, i2iSchemas]);

	const filteredSchemas = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return schemasByCategory;
		return schemasByCategory.filter(
			(s) =>
				s.name.toLowerCase().includes(q) ||
				s.id.toLowerCase().includes(q) ||
				s.modelId.toLowerCase().includes(q),
		);
	}, [schemasByCategory, search]);

	const isEmpty = filteredSchemas.length === 0;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-h-[90vh] max-w-2xl overflow-hidden flex flex-col"
				aria-describedby={undefined}
			>
				<DialogHeader>
					<DialogTitle>{t("model_selector_title")}</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-4 min-h-0 flex-1 overflow-hidden">
					{/* Search */}
					<div className="relative flex-shrink-0">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="search"
							placeholder={t("search_models")}
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-9 min-h-[48px] text-base"
							aria-label={t("search_models")}
						/>
					</div>
					{/* Category tabs */}
					<div className="flex flex-shrink-0 gap-1 rounded-lg border border-border bg-muted/30 p-1">
						{(
							[
								["all", t("category_all")],
								["t2i", t("category_text_to_image")],
								["i2i", t("category_image_to_image")],
							] as const
						).map(([value, label]) => (
							<button
								key={value}
								type="button"
								onClick={() => setCategory(value)}
								className={`min-h-[44px] flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-smooth ${
									category === value
										? "bg-background text-foreground shadow-sm"
										: "text-muted-foreground hover:text-foreground"
								}`}
								aria-pressed={category === value}
							>
								{label}
							</button>
						))}
					</div>
					{/* Grid or empty state */}
					<div className="min-h-0 flex-1 overflow-y-auto">
						{isEmpty ? (
							<div className="flex flex-col items-center justify-center py-12 text-center">
								<div className="mb-4 rounded-full bg-muted p-6">
									<Search className="size-6 text-muted-foreground" />
								</div>
								<h3 className="mb-2 text-lg font-semibold">
									{t("no_models_found")}
								</h3>
								<p className="mb-6 text-sm text-muted-foreground max-w-sm">
									{t("no_models_found_desc")}
								</p>
							</div>
						) : (
							<ModelGrid
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
			</DialogContent>
		</Dialog>
	);
}
