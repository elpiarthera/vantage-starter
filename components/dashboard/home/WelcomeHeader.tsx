"use client";

import { useUser } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { useDevice } from "@/contexts/DeviceContext";
import { QuickStatsCards } from "./QuickStatsCards";

interface WelcomeHeaderProps {
	totalProjects: number;
	creditsRemaining: number;
	videosGenerated: number;
	storageUsed: { totalGB: number };
}

export function WelcomeHeader({
	totalProjects,
	creditsRemaining,
	videosGenerated,
	storageUsed,
}: WelcomeHeaderProps) {
	const { isMobile } = useDevice();
	const { user } = useUser();
	const t = useTranslations("dashboard");

	const displayName = user?.firstName || user?.username || "there";

	return (
		<div className="space-y-4 md:space-y-6">
			<div className={isMobile ? "text-center" : "text-left"}>
				<h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
					{t("welcome", { name: displayName })}
				</h1>
				<p className="text-sm md:text-base text-gray-400">{t("subtitle")}</p>
			</div>
			<QuickStatsCards
				totalProjects={totalProjects}
				creditsRemaining={creditsRemaining}
				videosGenerated={videosGenerated}
				storageUsed={storageUsed}
			/>
		</div>
	);
}
