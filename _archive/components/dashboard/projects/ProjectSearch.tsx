"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";

interface ProjectSearchProps {
	searchQuery: string;
	setSearchQuery: (value: string) => void;
}

export function ProjectSearch({
	searchQuery,
	setSearchQuery,
}: ProjectSearchProps) {
	const t = useTranslations("project_search");
	return (
		<div className="relative">
			<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
			<Input
				type="text"
				placeholder={t("search_projects_placeholder")}
				value={searchQuery}
				onChange={(e) => setSearchQuery(e.target.value)}
				className="pl-10 min-h-[48px]"
			/>
		</div>
	);
}
