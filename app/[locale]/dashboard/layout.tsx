import type React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
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
				<SidebarProvider>
					<div className="flex min-h-screen w-full bg-background">
						{/*
              AppSidebar:
              - Desktop (md+): visible as persistent left panel
              - Mobile (<md): hidden, opens as Sheet drawer via SidebarTrigger
              The shadcn SidebarProvider handles the Sheet/panel duality.
            */}
						<AppSidebar />

						{/* Main area: header + breadcrumbs + content */}
						<SidebarInset className="flex flex-col flex-1 min-w-0">
							{/*
                DashboardHeader: existing top bar with org switcher, credits,
                language switcher, notifications, user menu.
                SidebarTrigger (hamburger) is inserted here for mobile only.
                The DashboardHeader's own mobile Sheet (user menu) is preserved.
              */}
							<DashboardHeader sidebarTrigger={<SidebarTrigger />} />

							{/* Navigation Breadcrumbs */}
							<DashboardNav />

							{/* Main Content */}
							<main
								id="main-content"
								className="flex-1 min-h-[calc(100vh-8rem)]"
							>
								{children}
							</main>
						</SidebarInset>
					</div>
				</SidebarProvider>
			</DashboardBreadcrumbProvider>
		</DeviceProvider>
	);
}
