"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/shared/EmptyState";
import type { Doc } from "@/convex/_generated/dataModel";
import { useRouter } from "@/i18n/routing";
import { ProjectCard } from "./ProjectCard";

interface ProjectsListProps {
	projects: Doc<"projects">[];
	viewMode: "grid" | "list";
}

export function ProjectsList({ projects, viewMode }: ProjectsListProps) {
	const router = useRouter();
	const tEmptyStates = useTranslations("empty_states");
	const tProjectsList = useTranslations("project_list");

	if (projects.length === 0) {
		return (
			<EmptyState
				icon={<Plus className="h-12 w-12 text-gray-400" />}
				title={tEmptyStates("no_projects")}
				description={tEmptyStates("no_projects_description")}
				actionLabel={tProjectsList("create_project_button")}
				onAction={() => router.push("/guided/step-1")}
			/>
		);
	}

	return (
		<div
			className={`
        grid gap-4 md:gap-6
        ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}
      `}
		>
			{projects.map((project) => (
				<ProjectCard key={project._id} project={project} viewMode={viewMode} />
			))}
		</div>
	);
}
