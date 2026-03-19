"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useDevice } from "@/contexts/DeviceContext";

interface TemplateFiltersProps {
	typeFilter: "all" | "system" | "custom";
	categoryFilter: string;
	sortBy: "popular" | "recent" | "name";
	onTypeFilterChange: (value: "all" | "system" | "custom") => void;
	onCategoryFilterChange: (value: string) => void;
	onSortByChange: (value: "popular" | "recent" | "name") => void;
}

export function TemplateFilters({
	typeFilter,
	categoryFilter,
	sortBy,
	onTypeFilterChange,
	onCategoryFilterChange,
	onSortByChange,
}: TemplateFiltersProps) {
	const { isMobile } = useDevice();
	const [isExpanded, setIsExpanded] = useState(false);
	const t = useTranslations("template_filters");
	const tTemplatesCategories = useTranslations("create_template_modal");
	const tTemplatesCard = useTranslations("template_card");

	const categories = [
		{ value: "all", label: t("all_categories") },
		{ value: "wedding", label: tTemplatesCategories("category_wedding") },
		{ value: "birthday", label: tTemplatesCategories("category_birthday") },
		{
			value: "anniversary",
			label: tTemplatesCategories("category_anniversary"),
		},
		{ value: "business", label: tTemplatesCategories("category_business") },
	];

	const types = [
		{ value: "all", label: t("all_templates") },
		{
			value: "system",
			label: `${tTemplatesCard("system_badge")} ${t("templates_suffix")}`,
		},
		{
			value: "custom",
			label: `${tTemplatesCard("custom_badge")} ${t("templates_suffix")}`,
		},
	];

	const sortOptions = [
		{ value: "popular", label: t("most_popular") },
		{ value: "recent", label: t("most_recent") },
		{ value: "name", label: t("name_az") },
	];

	// Mobile: Collapsible filters
	if (isMobile) {
		return (
			<div className="px-4 py-3">
				{/* Toggle Button */}
				<Button
					variant="outline"
					onClick={() => setIsExpanded(!isExpanded)}
					className="w-full min-h-[44px] justify-between active:scale-95"
				>
					<span>{t("filters_sort_button")}</span>
					{isExpanded ? (
						<ChevronUp className="h-4 w-4" />
					) : (
						<ChevronDown className="h-4 w-4" />
					)}
				</Button>

				{/* Expanded Filters */}
				{isExpanded && (
					<div className="mt-3 space-y-3">
						{/* Type Filter */}
						<div>
							<label
								htmlFor="mobile-type-filter"
								className="text-xs font-medium text-muted-foreground mb-2 block"
							>
								{t("type_label")}
							</label>
							<Select
								value={typeFilter}
								onValueChange={(value) =>
									onTypeFilterChange(value as "all" | "system" | "custom")
								}
							>
								<SelectTrigger id="mobile-type-filter" className="min-h-[48px]">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{types.map((type) => (
										<SelectItem key={type.value} value={type.value}>
											{type.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Category Filter */}
						<div>
							<label
								htmlFor="mobile-category-filter"
								className="text-xs font-medium text-muted-foreground mb-2 block"
							>
								{t("category_label")}
							</label>
							<Select
								value={categoryFilter}
								onValueChange={onCategoryFilterChange}
							>
								<SelectTrigger
									id="mobile-category-filter"
									className="min-h-[48px]"
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{categories.map((category) => (
										<SelectItem key={category.value} value={category.value}>
											{category.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Sort By */}
						<div>
							<label
								htmlFor="mobile-sort-filter"
								className="text-xs font-medium text-muted-foreground mb-2 block"
							>
								{t("sort_by_label")}
							</label>
							<Select
								value={sortBy}
								onValueChange={(value) =>
									onSortByChange(value as "popular" | "recent" | "name")
								}
							>
								<SelectTrigger id="mobile-sort-filter" className="min-h-[48px]">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{sortOptions.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				)}
			</div>
		);
	}

	// Desktop: Top bar filters
	return (
		<div className="px-6 py-4 flex items-center gap-4">
			{/* Type Filter */}
			<div className="flex items-center gap-2">
				<label
					htmlFor="desktop-type-filter"
					className="text-sm font-medium text-muted-foreground whitespace-nowrap"
				>
					{t("type_label")}:
				</label>
				<Select
					value={typeFilter}
					onValueChange={(value) =>
						onTypeFilterChange(value as "all" | "system" | "custom")
					}
				>
					<SelectTrigger id="desktop-type-filter" className="w-[180px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{types.map((type) => (
							<SelectItem key={type.value} value={type.value}>
								{type.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Category Filter */}
			<div className="flex items-center gap-2">
				<label
					htmlFor="desktop-category-filter"
					className="text-sm font-medium text-muted-foreground whitespace-nowrap"
				>
					{t("category_label")}:
				</label>
				<Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
					<SelectTrigger id="desktop-category-filter" className="w-[180px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{categories.map((category) => (
							<SelectItem key={category.value} value={category.value}>
								{category.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Sort By */}
			<div className="flex items-center gap-2 ml-auto">
				<label
					htmlFor="desktop-sort-filter"
					className="text-sm font-medium text-muted-foreground whitespace-nowrap"
				>
					{t("sort_by_label")}:
				</label>
				<Select
					value={sortBy}
					onValueChange={(value) =>
						onSortByChange(value as "popular" | "recent" | "name")
					}
				>
					<SelectTrigger id="desktop-sort-filter" className="w-[180px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{sortOptions.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
