"use client";

import { useTranslations } from "next-intl";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export function RecentProjects() {
	const t = useTranslations("dashboard");

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">{t("recent_items")}</CardTitle>
			</CardHeader>
			<CardContent>
				{/* TODO: Wire up to product-specific data */}
				<p className="text-sm text-muted-foreground">No items yet.</p>
			</CardContent>
		</Card>
	);
}
