"use client";

import {
	Film,
	ImageIcon,
	ImagePlus,
	Music,
	Settings,
	Share2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDevice } from "@/contexts/DeviceContext";
import type { Doc } from "@/convex/_generated/dataModel";
import { Link } from "@/i18n/routing";
import { AssetsTab } from "./tabs/AssetsTab";
import { AudioTab } from "./tabs/AudioTab";
import { ImagesTab } from "./tabs/ImagesTab";
import { ScenesTab } from "./tabs/ScenesTab";
import { SettingsTab } from "./tabs/SettingsTab";

interface ProjectTabsProps {
	projectId: string;
	project: Doc<"projects">;
	activeTab: string;
	onTabChange: (tab: string) => void;
}

const tabs = [
	{ id: "scenes", label: "scenes", icon: Film },
	{ id: "assets", label: "assets", icon: ImageIcon },
	{ id: "images", label: "images", icon: ImagePlus },
	{ id: "audio", label: "audio", icon: Music },
	{ id: "share", label: "share", icon: Share2 },
	{ id: "settings", label: "settings", icon: Settings },
];

export function ProjectTabs({
	projectId,
	project,
	activeTab,
	onTabChange,
}: ProjectTabsProps) {
	const { isMobile } = useDevice();
	const t = useTranslations("project_tabs");

	return (
		<div className="space-y-4 md:space-y-6">
			{/* Tab Navigation */}
			<div
				className={`
          flex gap-2 pb-2
          ${isMobile ? "overflow-x-auto scrollbar-hide" : "overflow-x-visible"}
        `}
			>
				{tabs.map((tab) => {
					const Icon = tab.icon;
					const isActive = activeTab === tab.id;

					// Share tab redirects to step-6 for share link / social share
					if (tab.id === "share") {
						return (
							<Link
								key={tab.id}
								href={`/guided/step-6?projectId=${projectId}`}
								className={`
                  flex items-center justify-center min-h-[44px] min-w-[120px] flex-shrink-0 px-4 rounded-md border
                  ${isMobile ? "active:scale-98" : "hover:scale-105"}
                  transition-transform
                  bg-secondary border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary
                `}
							>
								<Icon className="h-4 w-4 mr-2" />
								{t(tab.label)}
							</Link>
						);
					}

					return (
						<Button
							key={tab.id}
							variant={isActive ? "default" : "outline"}
							onClick={() => onTabChange(tab.id)}
							className={`
                min-h-[44px] min-w-[120px] flex-shrink-0
                ${isMobile ? "active:scale-98" : "hover:scale-105"}
                transition-transform
                ${isActive ? "" : "bg-secondary text-muted-foreground border-border hover:bg-secondary/80 hover:text-foreground"}
              `}
						>
							<Icon className="h-4 w-4 mr-2" />
							{t(tab.label)}
						</Button>
					);
				})}
			</div>

			{/* Tab Content */}
			<Card className="bg-card border-border p-4 md:p-6">
				{activeTab === "scenes" && <ScenesTab projectId={projectId} />}

				{activeTab === "assets" && <AssetsTab projectId={projectId} />}

				{activeTab === "images" && <ImagesTab projectId={projectId} />}

				{activeTab === "audio" && <AudioTab projectId={projectId} />}

				{activeTab === "settings" && (
					<SettingsTab projectId={projectId} project={project} />
				)}
			</Card>
		</div>
	);
}
