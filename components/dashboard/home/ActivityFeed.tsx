"use client";

import { useTranslations } from "next-intl";

export function ActivityFeed() {
	const t = useTranslations("dashboard");

	return (
		<div className="bg-card border border-border rounded-xl p-6">
			<h3 className="text-sm font-medium text-foreground mb-4">
				{t("activity_feed.title")}
			</h3>
			{/* TODO: Wire up to product-specific activity data */}
			<p className="text-sm text-muted-foreground">
				{t("activity_feed.empty")}
			</p>
		</div>
	);
}
