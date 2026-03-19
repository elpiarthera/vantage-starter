"use client";

import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { TemplateCard } from "./TemplateCard";

interface TemplatesListProps {
	typeFilter: "all" | "system" | "custom";
	categoryFilter: string;
	sortBy: "popular" | "recent" | "name";
}

export function TemplatesList({
	typeFilter,
	categoryFilter,
	sortBy,
}: TemplatesListProps) {
	// Fetch real templates from Convex
	const templates = useQuery(api.templates.listAll);
	const t = useTranslations("templates_list");

	const isLoading = templates === undefined;

	// Filter and sort templates
	const filteredTemplates = useMemo(() => {
		if (!templates) return [];

		let filtered = [...templates];

		// Filter by type
		if (typeFilter === "system") {
			filtered = filtered.filter((t) => t.isSystem);
		} else if (typeFilter === "custom") {
			filtered = filtered.filter((t) => !t.isSystem);
		}

		// Filter by category
		if (categoryFilter !== "all") {
			filtered = filtered.filter(
				(t) => t.category.toLowerCase() === categoryFilter.toLowerCase(),
			);
		}

		// Sort
		if (sortBy === "popular") {
			filtered.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
		} else if (sortBy === "recent") {
			filtered.sort((a, b) => b.createdAt - a.createdAt);
		} else if (sortBy === "name") {
			filtered.sort((a, b) => a.name.localeCompare(b.name));
		}

		return filtered;
	}, [templates, typeFilter, categoryFilter, sortBy]);

	// Loading state
	if (isLoading) {
		return (
			<div
				className={`
        grid gap-4 md:gap-6
        grid-cols-1 md:grid-cols-2 lg:grid-cols-3
      `}
			>
				{[1, 2, 3, 4, 5, 6].map((i) => (
					<Skeleton key={i} className="h-[300px] md:h-[320px]" />
				))}
			</div>
		);
	}

	// Empty state
	if (filteredTemplates.length === 0) {
		return (
			<EmptyState
				icon="file-text"
				title={t("no_templates_found_title")}
				description={
					typeFilter === "custom"
						? t("no_custom_templates_description")
						: t("adjust_filters_description")
				}
			/>
		);
	}

	return (
		<div
			className={`
      grid gap-4 md:gap-6
      grid-cols-1 md:grid-cols-2 lg:grid-cols-3
    `}
		>
			{filteredTemplates.map((template) => (
				<TemplateCard key={template._id} template={template} />
			))}
		</div>
	);
}
