"use client";

import { useQuery } from "convex/react";
import { Grid3x3, List, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ProjectFilters } from "@/components/dashboard/projects/ProjectFilters";
import { ProjectSearch } from "@/components/dashboard/projects/ProjectSearch";
import { ProjectsList } from "@/components/dashboard/projects/ProjectsList";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDevice } from "@/contexts/DeviceContext";
import { api } from "@/convex/_generated/api";
import { Link } from "@/i18n/routing";

export default function ProjectsPage() {
	const { isMobile } = useDevice();
	const t = useTranslations("projects_page");

	// Fetch real data from Convex
	const projects = useQuery(api.projects.list);

	// Local state for filters and view
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [occasionFilter, setOccasionFilter] = useState<string>("all");
	const [sortBy, setSortBy] = useState<string>("recent");

	// Loading state
	const isLoading = projects === undefined;

	// Error state
	const hasError = projects === null;

	// Apply filters and search using useMemo for performance
	const filteredProjects = useMemo(() => {
		if (!projects) return [];

		let filtered = [...projects];

		// Search filter
		if (searchQuery) {
			filtered = filtered.filter((project) =>
				project.name.toLowerCase().includes(searchQuery.toLowerCase()),
			);
		}

		// Status filter
		if (statusFilter !== "all") {
			filtered = filtered.filter((project) => project.status === statusFilter);
		}

		// Occasion filter
		if (occasionFilter !== "all") {
			filtered = filtered.filter(
				(project) => project.occasion === occasionFilter,
			);
		}

		// Sort
		if (sortBy === "recent") {
			filtered.sort((a, b) => b.updatedAt - a.updatedAt);
		} else if (sortBy === "name") {
			filtered.sort((a, b) => a.name.localeCompare(b.name));
		} else if (sortBy === "status") {
			filtered.sort((a, b) => a.status.localeCompare(b.status));
		}

		return filtered;
	}, [projects, searchQuery, statusFilter, occasionFilter, sortBy]);

	const handleRetry = () => {
		window.location.reload();
	};

	if (isLoading) {
		return (
			<div className="container mx-auto px-4 md:px-6 py-6 md:py-10 space-y-6 md:space-y-8 animate-in fade-in duration-300">
				{/* Header Skeleton */}
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-10 w-full md:w-40" />
				</div>

				{/* Filters Skeleton */}
				<Skeleton className="h-12 w-full" />

				{/* Projects Grid Skeleton */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
					{[1, 2, 3, 4, 5, 6].map((i) => (
						<Skeleton key={i} className="h-48" />
					))}
				</div>
			</div>
		);
	}

	if (hasError) {
		return (
			<div className="container mx-auto px-4 md:px-6 py-6 md:py-10 animate-in fade-in duration-300">
				<ErrorState
					title={t("error_title")}
					description={t("error_description")}
					actionLabel={t("retry")}
					onAction={handleRetry}
				/>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 md:px-6 py-6 md:py-10 space-y-6 md:space-y-8 animate-in fade-in duration-300">
			{/* Page Header */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="text-2xl md:text-3xl font-bold text-foreground">
						{t("title")}
					</h1>
					<p className="text-sm md:text-base text-muted-foreground mt-1">
						{t("subtitle")}
					</p>
				</div>

				<div className="flex items-center gap-2">
					{/* View Toggle - Desktop only */}
					{!isMobile && (
						<div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setViewMode("grid")}
								className={`min-h-[44px] min-w-[44px] ${
									viewMode === "grid"
										? "bg-primary text-primary-foreground"
										: ""
								}`}
							>
								<Grid3x3 className="h-4 w-4" />
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setViewMode("list")}
								className={`min-h-[44px] min-w-[44px] ${
									viewMode === "list"
										? "bg-primary text-primary-foreground"
										: ""
								}`}
							>
								<List className="h-4 w-4" />
							</Button>
						</div>
					)}

					<Link href="/guided/step-1" className="w-full md:w-auto">
						<Button className="min-h-[44px] w-full">
							<Plus className="h-4 w-4 mr-2" />
							{isMobile ? t("create_short") : t("create_button")}
						</Button>
					</Link>
				</div>
			</div>

			{/* Search */}
			<ProjectSearch
				searchQuery={searchQuery}
				setSearchQuery={setSearchQuery}
			/>

			{/* Filters */}
			<ProjectFilters
				statusFilter={statusFilter}
				setStatusFilter={setStatusFilter}
				occasionFilter={occasionFilter}
				setOccasionFilter={setOccasionFilter}
				sortBy={sortBy}
				setSortBy={setSortBy}
			/>

			{/* Projects List */}
			<ProjectsList projects={filteredProjects} viewMode={viewMode} />
		</div>
	);
}
