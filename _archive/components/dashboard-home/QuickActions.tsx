"use client";

import { BookTemplate, FolderOpen, Plus, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDevice } from "@/contexts/DeviceContext";
import { Link } from "@/i18n/routing";

export function QuickActions() {
	const { isMobile } = useDevice();
	const t = useTranslations("dashboard.quick_actions");

	const actions = [
		{
			icon: <Plus className="h-5 w-5" />,
			label: t("create_project"),
			href: "/guided/step-1",
			color: "bg-blue-600",
			hoverColor: isMobile ? "active:bg-blue-700" : "hover:bg-blue-700",
		},
		{
			icon: <BookTemplate className="h-5 w-5" />,
			label: t("browse_templates"),
			href: "/dashboard/templates",
			color: "bg-green-600",
			hoverColor: isMobile ? "active:bg-green-700" : "hover:bg-green-700",
		},
		{
			icon: <FolderOpen className="h-5 w-5" />,
			label: t("view_projects"),
			href: "/dashboard/projects",
			color: "bg-purple-600",
			hoverColor: isMobile ? "active:bg-purple-700" : "hover:bg-purple-700",
		},
		{
			icon: <Settings className="h-5 w-5" />,
			label: t("manage_account"),
			href: "/dashboard/account",
			color: "bg-orange-600",
			hoverColor: isMobile ? "active:bg-orange-700" : "hover:bg-orange-700",
		},
	];

	return (
		<Card className="bg-slate-800 border-slate-700">
			<CardContent className="p-4 md:p-6">
				<h2 className="text-lg md:text-xl font-semibold text-white mb-4">
					{t("title")}
				</h2>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
					{actions.map((action) => (
						<Link key={action.href} href={action.href}>
							<Button
								className={`
                  w-full h-auto min-h-[80px] md:min-h-[100px] 
                  flex flex-col items-center justify-center gap-2 
                  ${action.color} ${action.hoverColor} text-white
                  transition-colors
                `}
							>
								{action.icon}
								<span className="text-xs md:text-sm text-center">
									{action.label}
								</span>
							</Button>
						</Link>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
