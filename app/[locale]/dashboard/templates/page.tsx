"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CreateTemplateModal } from "@/components/dashboard/templates/CreateTemplateModal";
import { TemplateFilters } from "@/components/dashboard/templates/TemplateFilters";
import { TemplatesList } from "@/components/dashboard/templates/TemplatesList";
import { Button } from "@/components/ui/button";
import { useDevice } from "@/contexts/DeviceContext";

export default function TemplatesPage() {
	const { isMobile } = useDevice();
	const t = useTranslations("templates_page");
	const [typeFilter, setTypeFilter] = useState<"all" | "system" | "custom">(
		"all",
	);
	const [categoryFilter, setCategoryFilter] = useState<string>("all");
	const [sortBy, setSortBy] = useState<"popular" | "recent" | "name">(
		"popular",
	);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

	return (
		<div className="min-h-screen bg-background">
			{/* Page Header */}
			<div className="border-b border-border bg-card">
				<div className="container mx-auto px-4 py-6 md:px-6 md:py-8">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
						<div>
							<h1 className="text-2xl md:text-3xl font-bold text-foreground">
								{t("title")}
							</h1>
							<p className="text-sm md:text-base text-muted-foreground mt-2">
								{t("subtitle")}
							</p>
						</div>
						<Button
							onClick={() => setIsCreateModalOpen(true)}
							className={`min-h-[44px] ${isMobile ? "w-full active:scale-98" : "hover:bg-primary/90"}`}
						>
							<Plus className="h-5 w-5 mr-2" />
							{t("create_button")}
						</Button>
					</div>
				</div>
			</div>

			{/* Filters */}
			<div className="border-b border-border bg-card">
				<div className="container mx-auto">
					<TemplateFilters
						typeFilter={typeFilter}
						categoryFilter={categoryFilter}
						sortBy={sortBy}
						onTypeFilterChange={setTypeFilter}
						onCategoryFilterChange={setCategoryFilter}
						onSortByChange={setSortBy}
					/>
				</div>
			</div>

			{/* Templates List */}
			<div className="container mx-auto px-4 py-6 md:px-6 md:py-8">
				<TemplatesList
					typeFilter={typeFilter}
					categoryFilter={categoryFilter}
					sortBy={sortBy}
				/>
			</div>

			<CreateTemplateModal
				isOpen={isCreateModalOpen}
				onClose={() => setIsCreateModalOpen(false)}
				onSuccess={() => setIsCreateModalOpen(false)}
			/>
		</div>
	);
}
