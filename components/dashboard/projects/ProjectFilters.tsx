"use client";

import { Filter } from "lucide-react";
import { useTranslations } from "next-intl";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useDevice } from "@/contexts/DeviceContext";

interface ProjectFiltersProps {
	statusFilter: string;
	setStatusFilter: (value: string) => void;
	occasionFilter: string;
	setOccasionFilter: (value: string) => void;
	sortBy: string;
	setSortBy: (value: string) => void;
}

export function ProjectFilters({
	statusFilter,
	setStatusFilter,
	occasionFilter,
	setOccasionFilter,
	sortBy,
	setSortBy,
}: ProjectFiltersProps) {
	const { isMobile } = useDevice();
	const t = useTranslations("project_filters");
	const tStatus = useTranslations("status");
	const tOccasions = useTranslations("occasions");

	const filterContent = (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
			{/* Status Filter */}
			<div className="space-y-2">
				<label
					className="text-sm font-medium text-foreground"
					htmlFor="status-filter"
				>
					Status
				</label>
				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger id="status-filter" className="min-h-[48px]">
						<SelectValue placeholder={t("all_statuses_placeholder")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">{t("all_statuses")}</SelectItem>
						<SelectItem value="draft">{tStatus("draft")}</SelectItem>
						<SelectItem value="in-progress">
							{tStatus("in_progress")}
						</SelectItem>
						<SelectItem value="completed">{tStatus("completed")}</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Occasion Filter */}
			<div className="space-y-2">
				<label
					className="text-sm font-medium text-foreground"
					htmlFor="occasion-filter"
				>
					Occasion
				</label>
				<Select value={occasionFilter} onValueChange={setOccasionFilter}>
					<SelectTrigger id="occasion-filter" className="min-h-[48px]">
						<SelectValue placeholder={t("all_occasions_placeholder")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">{t("all_occasions")}</SelectItem>
						<SelectItem value="wedding">{tOccasions("wedding")}</SelectItem>
						<SelectItem value="birthday">{tOccasions("birthday")}</SelectItem>
						<SelectItem value="anniversary">
							{tOccasions("anniversary")}
						</SelectItem>
						<SelectItem value="business">{tOccasions("business")}</SelectItem>
						<SelectItem value="baby shower">
							{tOccasions("baby_shower")}
						</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Sort By */}
			<div className="space-y-2">
				<label
					className="text-sm font-medium text-foreground"
					htmlFor="sort-filter"
				>
					Sort By
				</label>
				<Select value={sortBy} onValueChange={setSortBy}>
					<SelectTrigger id="sort-filter" className="min-h-[48px]">
						<SelectValue placeholder={t("sort_by_placeholder")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="recent">{t("most_recent")}</SelectItem>
						<SelectItem value="name">{t("name_az")}</SelectItem>
						<SelectItem value="status">{t("status")}</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	);

	// Mobile: Collapsible accordion
	if (isMobile) {
		return (
			<Accordion type="single" collapsible className="w-full">
				<AccordionItem value="filters" className="border rounded-lg px-4">
					<AccordionTrigger className="hover:no-underline">
						<div className="flex items-center gap-2">
							<Filter className="h-4 w-4" />
							<span className="font-medium">{t("filters_label")}</span>
						</div>
					</AccordionTrigger>
					<AccordionContent className="pt-4">{filterContent}</AccordionContent>
				</AccordionItem>
			</Accordion>
		);
	}

	// Desktop: Top bar with dropdowns
	return (
		<div className="bg-card border border-border rounded-lg p-4 md:p-6">
			{filterContent}
		</div>
	);
}
