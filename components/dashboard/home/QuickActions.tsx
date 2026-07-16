"use client";

import { useTranslations } from "next-intl";

export function QuickActions() {
	const t = useTranslations("dashboard");

	return (
		<div className="bg-card border border-border rounded-xl p-6">
			<h3 className="text-sm font-medium text-foreground mb-4">
				{t("quick_actions.title")}
			</h3>
			{/* TODO: Add product-specific quick actions */}
			<p className="text-sm text-muted-foreground">
				{t("quick_actions.empty")}
			</p>
		</div>
	);
}
