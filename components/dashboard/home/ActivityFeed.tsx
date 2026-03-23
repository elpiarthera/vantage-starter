"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ActivityFeed() {
	const t = useTranslations("dashboard");

	return (
		<Card className="rounded-2xl card-elevated border-border">
			<CardHeader>
				<CardTitle className="text-base">{t("activity_feed.title")}</CardTitle>
			</CardHeader>
			<CardContent>
				{/* TODO: Wire up to product-specific activity data */}
				<p className="text-sm text-muted-foreground">No recent activity.</p>
			</CardContent>
		</Card>
	);
}
