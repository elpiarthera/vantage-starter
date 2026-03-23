"use client";

import type { UserResource } from "@clerk/types";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
// biome-ignore lint/correctness/noUnusedImports: NotificationsTab used when Notifications tab is uncommented (see Post-MVP-Improvement.md)
import { NotificationsTab } from "@/components/dashboard/account/tabs/NotificationsTab";
import { ProfileTab } from "@/components/dashboard/account/tabs/ProfileTab";
import { SubscriptionTab } from "@/components/dashboard/account/tabs/SubscriptionTab";
import { UsageCreditsTab } from "@/components/dashboard/account/tabs/UsageCreditsTab";

interface AccountTabsProps {
	user: UserResource;
}

type TabId = "profile" | "subscription" | "usage" | "notifications";

// Inline SVG icons — no icon library imports
function IconUser({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<circle cx="12" cy="8" r="4" />
			<path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
		</svg>
	);
}

function IconCreditCard({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<rect x="2" y="5" width="20" height="14" rx="2" />
			<line x1="2" y1="10" x2="22" y2="10" />
		</svg>
	);
}

function IconBarChart({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<line x1="18" y1="20" x2="18" y2="10" />
			<line x1="12" y1="20" x2="12" y2="4" />
			<line x1="6" y1="20" x2="6" y2="14" />
		</svg>
	);
}

// biome-ignore lint/correctness/noUnusedVariables: IconBell used when Notifications tab is uncommented (see Post-MVP-Improvement.md)
function IconBell({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
			<path d="M13.73 21a2 2 0 0 1-3.46 0" />
		</svg>
	);
}

interface Tab {
	id: TabId;
	label: string;
	icon: ({ className }: { className?: string }) => React.ReactElement;
}

const tabs: Tab[] = [
	{ id: "profile", label: "profile", icon: IconUser },
	{ id: "subscription", label: "subscription", icon: IconCreditCard },
	{ id: "usage", label: "usage", icon: IconBarChart },
	/* COMMENT DO NOT DELETE - Notifications tab: see Post-MVP-Improvement.md
	{ id: "notifications", label: "notifications", icon: IconBell },
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
	const t = useTranslations("account_tabs");

	return (
		<div className="w-full">
			{/* Tab Navigation */}
			<div className="border-b border-border sticky top-14 md:top-16 z-40 bg-background px-4 md:px-6">
				<div className="flex gap-0 overflow-x-auto scrollbar-hide">
					{tabs.map((tab) => {
						const Icon = tab.icon;
						const isActive = activeTab === tab.id;

						return (
							<button
								key={tab.id}
								type="button"
								onClick={() => setActiveTab(tab.id)}
								className={`
                  flex items-center gap-1.5 px-3 py-2.5
                  text-sm font-medium whitespace-nowrap
                  border-b transition-colors duration-150
                  min-h-[40px] min-w-[44px] -mb-px
                  ${isActive ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}
                `}
							>
								<Icon className="h-3.5 w-3.5 shrink-0" />
								<span>{t(tab.label)}</span>
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
