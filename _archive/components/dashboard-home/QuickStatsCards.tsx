"use client";

import { CreditCard, FolderOpen, HardDrive, Video } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { useDevice } from "@/contexts/DeviceContext";

interface QuickStatsCardsProps {
	totalProjects: number;
	creditsRemaining: number;
	videosGenerated: number;
	storageUsed: { totalGB: number };
}

export function QuickStatsCards({
	totalProjects,
	creditsRemaining,
	videosGenerated,
	storageUsed,
}: QuickStatsCardsProps) {
	const { isMobile } = useDevice();
	const t = useTranslations("dashboard.quick_stats");

	const stats = [
		{
			icon: <FolderOpen className="h-5 w-5 text-blue-400" />,
			label: t("projects"),
			value: totalProjects.toString(),
		},
		{
			icon: <CreditCard className="h-5 w-5 text-green-400" />,
			label: t("credits"),
			value: creditsRemaining.toString(),
		},
		{
			icon: <Video className="h-5 w-5 text-purple-400" />,
			label: t("videos"),
			value: videosGenerated.toString(),
		},
		{
			icon: <HardDrive className="h-5 w-5 text-orange-400" />,
			label: t("storage"),
			value: `${storageUsed.totalGB} GB`,
		},
	];

	return (
		<div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
			{stats.map((stat) => (
				<Card
					key={stat.label}
					className={`
            bg-slate-800 border-slate-700 min-h-[80px]
            ${isMobile ? "active:bg-slate-700" : "hover:bg-slate-700"}
            transition-colors
          `}
				>
					<CardContent className="p-4 md:p-6">
						<div className="flex items-center gap-3 mb-2">
							{stat.icon}
							<p className="text-xs md:text-sm text-gray-400">{stat.label}</p>
						</div>
						<p className="text-xl md:text-2xl font-bold text-white">
							{stat.value}
						</p>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
