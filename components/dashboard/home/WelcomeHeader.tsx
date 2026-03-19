"use client";

import { useUser } from "@clerk/nextjs";
import { useTranslations } from "next-intl";

interface WelcomeHeaderProps {
	creditsRemaining: number;
	storageUsed: { totalGB: number };
}

export function WelcomeHeader({
	creditsRemaining,
	storageUsed,
}: WelcomeHeaderProps) {
	const { user } = useUser();
	const t = useTranslations("dashboard");

	const displayName = user?.firstName || user?.username || "there";

	return (
		<div className="space-y-2">
			<h1 className="text-2xl md:text-3xl font-bold text-foreground">
				{t("welcome", { name: displayName })}
			</h1>
			<p className="text-sm md:text-base text-muted-foreground">
				{t("subtitle")}
			</p>
			<div className="flex gap-4 text-sm text-muted-foreground pt-2">
				<span>{creditsRemaining} credits remaining</span>
				<span>{storageUsed.totalGB.toFixed(2)} GB used</span>
			</div>
		</div>
	);
}
