import type React from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { DashboardBreadcrumbProvider } from "@/contexts/DashboardBreadcrumbContext";
import { DeviceProvider } from "@/contexts/DeviceContext";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<DeviceProvider>
			<DashboardBreadcrumbProvider>
				<div className="min-h-screen bg-background">
					{/* Dashboard Header with org switcher and user menu */}
					<DashboardHeader />

					{/* Navigation Breadcrumbs */}
					<DashboardNav />

					{/* Main Content */}
					<main className="min-h-[calc(100vh-8rem)]">{children}</main>
				</div>
			</DashboardBreadcrumbProvider>
		</DeviceProvider>
	);
}
