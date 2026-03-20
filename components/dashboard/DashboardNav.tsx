"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDashboardBreadcrumb } from "@/contexts/DashboardBreadcrumbContext";
import { useDevice } from "@/contexts/DeviceContext";

interface Breadcrumb {
	label: string;
	href: string;
}

export function DashboardNav() {
	const pathname = usePathname();
	const { isMobile } = useDevice();
	const breadcrumbContext = useDashboardBreadcrumb();

	const paths = pathname.split("/").filter(Boolean);

	// Generate breadcrumbs from pathname.
	// "Home" and root "Dashboard" are omitted — only shown on nested pages.
	const generateBreadcrumbs = (): Breadcrumb[] => {
		const breadcrumbs: Breadcrumb[] = [];

		if (paths.length > 1) {
			// Add "Dashboard" as first crumb when on a nested page
			breadcrumbs.push({ label: "Dashboard", href: "/dashboard" });

			for (let i = 1; i < paths.length; i++) {
				const path = paths[i];
				const href = `/${paths.slice(0, i + 1).join("/")}`;
				const isLastSegment = i === paths.length - 1;
				const contextLabel =
					isLastSegment && breadcrumbContext?.templateName
						? breadcrumbContext.templateName
						: null;

				const label = contextLabel
					? contextLabel
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

	// On root dashboard, breadcrumbs is empty — render nothing
	if (breadcrumbs.length === 0) return null;

	const visibleBreadcrumbs =
		isMobile && breadcrumbs.length > 2 ? breadcrumbs.slice(-2) : breadcrumbs;

	return (
		<nav
			className="flex items-center gap-2 px-4 md:px-6 py-3 text-sm text-muted-foreground border-b border-border"
			aria-label="Breadcrumb"
		>
			{visibleBreadcrumbs.map((breadcrumb, index) => (
				<div key={breadcrumb.href} className="flex items-center gap-2">
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
