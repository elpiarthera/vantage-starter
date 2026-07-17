"use client";

import { useTranslations } from "next-intl";

export function RecentProjects() {
	const t = useTranslations("dashboard");

	return (
		<div className="bg-card border border-border rounded-xl p-6">
			<h3 className="text-sm font-medium text-foreground mb-4">
				{t("recent_projects.title")}
			</h3>
			{/* TODO: Wire up to product-specific data */}
			<p className="text-sm text-muted-foreground">
				{t("recent_projects.empty")}
			</p>
		</div>
	);
}
