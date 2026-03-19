"use client";

import { useTranslations } from "next-intl";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export function QuickActions() {
	const t = useTranslations("dashboard");

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">{t("quick_actions")}</CardTitle>
			</CardHeader>
			<CardContent>
				{/* TODO: Add product-specific quick actions */}
				<p className="text-sm text-muted-foreground">
					No actions configured yet.
				</p>
			</CardContent>
		</Card>
	);
}
