"use client";

import type { UserResource } from "@clerk/types";
// biome-ignore lint/correctness/noUnusedImports: Bell used when Notifications tab is uncommented (see Post-MVP-Improvement.md)
import { BarChart3, Bell, CreditCard, User } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type React from "react";
import { useState } from "react";
// biome-ignore lint/correctness/noUnusedImports: NotificationsTab used when Notifications tab is uncommented (see Post-MVP-Improvement.md)
import { NotificationsTab } from "@/components/dashboard/account/tabs/NotificationsTab";
import { ProfileTab } from "@/components/dashboard/account/tabs/ProfileTab";
import { SubscriptionTab } from "@/components/dashboard/account/tabs/SubscriptionTab";
import { UsageCreditsTab } from "@/components/dashboard/account/tabs/UsageCreditsTab";
import { useDevice } from "@/contexts/DeviceContext";

interface AccountTabsProps {
	user: UserResource;
}

type TabId = "profile" | "subscription" | "usage" | "notifications";

interface Tab {
	id: TabId;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
}

const tabs: Tab[] = [
	{ id: "profile", label: "profile", icon: User },
	{ id: "subscription", label: "subscription", icon: CreditCard },
	{ id: "usage", label: "usage", icon: BarChart3 },
	/* COMMENT DO NOT DELETE - Notifications tab: see Post-MVP-Improvement.md
	{ id: "notifications", label: "notifications", icon: Bell },
	*/
];

export function AccountTabs({ user }: AccountTabsProps) {
	const searchParams = useSearchParams();
	const tabParam = searchParams.get("tab") as TabId | null;
	const validTabs: TabId[] = [
		"profile",
		"subscription",
		"usage",
		"notifications",
	];
	const initialTab: TabId =
		tabParam && validTabs.includes(tabParam) ? tabParam : "profile";

	const [activeTab, setActiveTab] = useState<TabId>(initialTab);
	const { isMobile } = useDevice();
	const t = useTranslations("account_tabs");

	return (
		<div className="w-full">
			{/* Tab Navigation */}
			<div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-14 md:top-16 z-40">
				<div
					className={`
            flex gap-1 px-4 md:px-6
            ${isMobile ? "overflow-x-auto scrollbar-hide" : ""}
          `}
					style={
						!isMobile
							? {
									display: "grid",
									gridTemplateColumns: `repeat(${tabs.length}, 1fr)`,
								}
							: undefined
					}
				>
					{tabs.map((tab) => {
						const Icon = tab.icon;
						const isActive = activeTab === tab.id;

						return (
							<button
								key={tab.id}
								type="button"
								onClick={() => setActiveTab(tab.id)}
								className={`
                  flex items-center justify-center gap-2 px-4 py-3 md:py-4
                  text-sm md:text-base font-medium whitespace-nowrap
                  border-b-2 transition-colors
                  min-h-[44px] min-w-[44px]
                  ${isMobile ? "flex-shrink-0" : ""}
                  ${isActive ? "border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100" : "border-transparent text-gray-500 dark:text-gray-400"}
                  ${isMobile ? "active:bg-gray-100 dark:active:bg-gray-800" : "hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"}
                `}
							>
								<Icon className="h-4 w-4" />
								<span className={isMobile ? "text-xs" : ""}>
									{t(tab.label)}
								</span>
							</button>
						);
					})}
				</div>
			</div>

			{/* Tab Content */}
			<div className="px-4 py-6 md:px-6 md:py-8">
				{activeTab === "profile" && <ProfileTab user={user} />}

				{activeTab === "subscription" && <SubscriptionTab user={user} />}

				{activeTab === "usage" && <UsageCreditsTab user={user} />}

				{/* COMMENT DO NOT DELETE - Notifications tab content: see Post-MVP-Improvement.md
				{activeTab === "notifications" && <NotificationsTab user={user} />}
				*/}
			</div>
		</div>
	);
}
