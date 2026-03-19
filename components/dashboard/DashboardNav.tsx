"use client";

import { useQuery } from "convex/react";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDashboardBreadcrumb } from "@/contexts/DashboardBreadcrumbContext";
import { useDevice } from "@/contexts/DeviceContext";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface Breadcrumb {
	label: string;
	href: string;
}

export function DashboardNav() {
	const pathname = usePathname();
	const { isMobile } = useDevice();
	const breadcrumbContext = useDashboardBreadcrumb();

	const paths = pathname.split("/").filter(Boolean);
	const projectsIdx = paths.indexOf("projects");
	const templatesIdx = paths.indexOf("templates");
	const isProjectDetailPage =
		projectsIdx >= 0 && projectsIdx === paths.length - 2;
	const isTemplateDetailPage =
		templatesIdx >= 0 && templatesIdx === paths.length - 2;
	const projectIdFromPath = isProjectDetailPage
		? (paths[paths.length - 1] as Id<"projects">)
		: undefined;

	const project = useQuery(
		api.projects.get,
		projectIdFromPath ? { projectId: projectIdFromPath } : "skip",
	);

	// Generate breadcrumbs from pathname (template name from context — TemplateDetail sets it to avoid duplicate query)
	const generateBreadcrumbs = (): Breadcrumb[] => {
		const breadcrumbs: Breadcrumb[] = [
			{ label: "Home", href: "/" },
			{ label: "Dashboard", href: "/dashboard" },
		];

		// Add additional breadcrumbs based on path
		if (paths.length > 1) {
			for (let i = 1; i < paths.length; i++) {
				const path = paths[i];
				const href = `/${paths.slice(0, i + 1).join("/")}`;

				const isLastSegment = i === paths.length - 1;
				const useProjectName =
					isProjectDetailPage && isLastSegment && project?.name;
				const useTemplateName =
					isTemplateDetailPage &&
					isLastSegment &&
					breadcrumbContext?.templateName;

				const label = useProjectName
					? project.name
					: useTemplateName
						? (breadcrumbContext?.templateName ?? "Template")
						: path
								.split("-")
								.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
								.join(" ");

				breadcrumbs.push({ label, href });
			}
		}

		return breadcrumbs;
	};

	const breadcrumbs = generateBreadcrumbs();

	const visibleBreadcrumbs =
		isMobile && breadcrumbs.length > 2 ? breadcrumbs.slice(-2) : breadcrumbs;

	return (
		<nav
			className="flex items-center gap-2 px-4 md:px-6 py-3 text-sm text-muted-foreground border-b border-border"
			aria-label="Breadcrumb"
		>
			{visibleBreadcrumbs.map((breadcrumb, index) => (
				<div key={breadcrumb.href} className="flex items-center gap-2">
					{index === 0 && !isMobile && <Home className="h-4 w-4" />}
					{index > 0 && <ChevronRight className="h-4 w-4" />}
					{index === visibleBreadcrumbs.length - 1 ? (
						<span className="font-medium text-foreground">
							{breadcrumb.label}
						</span>
					) : (
						<Link
							href={breadcrumb.href}
							className={`transition-colors min-h-[44px] flex items-center ${
								isMobile ? "active:text-foreground" : "hover:text-foreground"
							}`}
						>
							{breadcrumb.label}
						</Link>
					)}
				</div>
			))}
		</nav>
	);
}
