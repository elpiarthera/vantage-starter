"use client";

/**
 * AppSidebar — VantageStarter
 *
 * Groups:
 *   OVERVIEW  — Dashboard, Chat, Missions, Architect
 *   WORKSPACE — Settings
 *
 * Mobile: hidden at <md, opens as Sheet drawer via hamburger trigger in layout.
 * Touch targets: all nav items min-h-[44px].
 * Footer removed — org switcher + user profile live in the top header bar.
 * Active state: 2px left border only, no background fill.
 */

import {
	LayoutGrid,
	LayoutList,
	MessageSquare,
	Settings,
	Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarSeparator,
	useSidebar,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const navItemClass = cn(
	"h-9 min-h-[44px] rounded-none px-4 text-sm font-medium text-muted-foreground transition-colors duration-150",
	"hover:bg-transparent hover:text-foreground",
	"data-[active=true]:bg-transparent data-[active=true]:text-foreground data-[active=true]:border-l-2 data-[active=true]:border-primary data-[active=true]:pl-[14px]",
);

export function AppSidebar() {
	const pathname = usePathname();
	const { setOpenMobile } = useSidebar();

	const handleNavClick = () => setOpenMobile(false);

	return (
		<TooltipProvider delayDuration={0}>
			<Sidebar
				collapsible="icon"
				className="group-data-[side=left]:border-r border-sidebar-border bg-sidebar-background"
				aria-label="Main navigation"
			>
				{/* ── Header: Logo ── */}
				<SidebarHeader>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton
								asChild
								className="h-10 min-h-[44px] rounded-none px-3 gap-2 hover:bg-transparent"
							>
								<Link
									href="/dashboard"
									onClick={handleNavClick}
									aria-label="VantageStarter home"
								>
									<span className="font-heading font-bold tracking-[-0.02em] text-foreground">
										VantageStarter
									</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarHeader>

				{/* ── Content ── */}
				<SidebarContent>
					{/* ─── OVERVIEW ─── */}
					<SidebarGroup>
						<SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
							Overview
						</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{/* Dashboard */}
								<SidebarMenuItem>
									<SidebarMenuButton
										asChild
										isActive={
											pathname === "/dashboard" ||
											pathname.endsWith("/dashboard")
										}
										className={navItemClass}
									>
										<Link href="/dashboard" onClick={handleNavClick}>
											<LayoutGrid
												className="size-[18px] shrink-0"
												aria-hidden="true"
											/>
											<span>Dashboard</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>

								{/* Chat */}
								<SidebarMenuItem>
									<SidebarMenuButton
										asChild
										isActive={pathname.includes("/dashboard/chat")}
										className={navItemClass}
									>
										<Link href="/dashboard/chat" onClick={handleNavClick}>
											<MessageSquare
												className="size-[18px] shrink-0"
												aria-hidden="true"
											/>
											<span>Chat</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>

								{/* Missions */}
								<SidebarMenuItem>
									<SidebarMenuButton
										asChild
										isActive={pathname.includes("/dashboard/missions")}
										className={navItemClass}
									>
										<Link href="/dashboard/missions" onClick={handleNavClick}>
											<LayoutList
												className="size-[18px] shrink-0"
												aria-hidden="true"
											/>
											<span>Missions</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>

								{/* Architect */}
								<SidebarMenuItem>
									<SidebarMenuButton
										asChild
										isActive={pathname.includes("/dashboard/architect")}
										className={navItemClass}
									>
										<Link href="/dashboard/architect" onClick={handleNavClick}>
											<Sparkles
												className="size-[18px] shrink-0"
												aria-hidden="true"
											/>
											<span>Architect</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>

					{/* Clean separator between groups */}
					<SidebarSeparator className="mx-3" />

					{/* ─── WORKSPACE ─── */}
					<SidebarGroup>
						<SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
							Workspace
						</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{/*
                ┌─────────────────────────────────────────────────────────────┐
                │  [YOUR_NAV_ITEM_HERE]                                       │
                │  Workspace-scoped nav item (e.g. Members, Billing, etc.)   │
                └─────────────────────────────────────────────────────────────┘
              */}

								{/* Settings */}
								<SidebarMenuItem>
									<SidebarMenuButton
										asChild
										isActive={pathname.startsWith("/dashboard/settings")}
										className={navItemClass}
									>
										<Link href="/dashboard/account" onClick={handleNavClick}>
											<Settings
												className="size-[18px] shrink-0"
												aria-hidden="true"
											/>
											<span>Settings</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>
			</Sidebar>
		</TooltipProvider>
	);
}
