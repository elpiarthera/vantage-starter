"use client";

/**
 * AppSidebar — VantageStarter
 *
 * Adapted from VantageOS Studio AppSidebar (sprint-UX-improvement-01032026).
 * Studio-specific items removed (brainstorm, knowledge base, design studio,
 * missions, operations, agents, workforce).
 *
 * Groups:
 *   OVERVIEW  — Dashboard + [YOUR_NAV_ITEM_HERE] slots (2 placeholders)
 *   WORKSPACE — Settings + [YOUR_NAV_ITEM_HERE] slot
 *
 * Mobile: hidden at <md, opens as Sheet drawer via hamburger trigger in layout.
 * Touch targets: all nav items min-h-[44px].
 * ThemeToggle: wired into SidebarUserNav footer dropdown.
 *
 * TODO: add Convex connection status indicator in sidebar footer area
 *       (post-v1 — comment placed per plan)
 */

import { useUser } from "@clerk/nextjs";
import { LayoutGrid, MessageSquare, Settings, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarUserNav } from "@/components/sidebar-user-nav";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { cn } from "@/lib/utils";

export function AppSidebar() {
	const pathname = usePathname();
	const { setOpenMobile } = useSidebar();
	const { user, isLoaded } = useUser();

	const handleNavClick = () => setOpenMobile(false);

	return (
		<Sidebar
			className="group-data-[side=left]:border-r border-border"
			aria-label="Main navigation"
		>
			{/* ── Header: Logo ── */}
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							asChild
							className="h-10 min-h-[44px] rounded-xl px-3 gap-2"
						>
							<Link
								href="/dashboard"
								onClick={handleNavClick}
								aria-label="VantageStarter home"
							>
								<div className="size-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
									<Zap
										className="size-3.5 text-primary-foreground"
										aria-hidden="true"
									/>
								</div>
								<span className="text-base font-semibold tracking-[-0.03em]">
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
					<SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
						Overview
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{/* Dashboard */}
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									isActive={
										pathname === "/dashboard" || pathname.endsWith("/dashboard")
									}
									className={cn(
										"h-9 min-h-[44px] rounded-xl px-3 text-muted-foreground",
										"data-[active=true]:text-foreground data-[active=true]:bg-sidebar-accent",
									)}
								>
									<Link href="/dashboard" onClick={handleNavClick}>
										<LayoutGrid className="size-4" aria-hidden="true" />
										<span>Dashboard</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>

							{/* Chat */}
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									isActive={pathname.includes("/dashboard/chat")}
									className={cn(
										"h-9 min-h-[44px] rounded-xl px-3 text-muted-foreground",
										"data-[active=true]:text-foreground data-[active=true]:bg-sidebar-accent",
									)}
								>
									<Link href="/dashboard/chat" onClick={handleNavClick}>
										<MessageSquare className="size-4" aria-hidden="true" />
										<span>Chat</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>

							{/*
                ┌─────────────────────────────────────────────────────────────┐
                │  [YOUR_NAV_ITEM_HERE] #2                                    │
                │  Add your secondary nav item here. Same pattern as above.  │
                └─────────────────────────────────────────────────────────────┘
              */}

							{/*
                ┌─────────────────────────────────────────────────────────────┐
                │  [YOUR_NAV_ITEM_HERE] #2                                    │
                │  Add your secondary nav item here. Same pattern as above.  │
                └─────────────────────────────────────────────────────────────┘
              */}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				{/* ─── WORKSPACE ─── */}
				<SidebarGroup>
					<SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
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
									className={cn(
										"h-9 min-h-[44px] rounded-xl px-3 text-muted-foreground",
										"data-[active=true]:text-foreground data-[active=true]:bg-sidebar-accent",
									)}
								>
									<Link href="/dashboard/account" onClick={handleNavClick}>
										<Settings className="size-4" aria-hidden="true" />
										<span>Settings</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			{/* ── Footer: WorkspaceSwitcher + UserNav ── */}
			<SidebarFooter>
				{/*
          WorkspaceSwitcher: renders OrganizationSwitcher (Clerk).
          Shows loading skeleton while Clerk hydrates.
        */}
				<WorkspaceSwitcher />

				{/*
          SidebarUserNav: avatar + name + theme toggle + sign out.
          Only renders once Clerk user is loaded.
          TODO: add Convex connection status indicator here (post-v1).
        */}
				{isLoaded && user && <SidebarUserNav />}

				{/* Loading skeleton — shown while Clerk user hydrates */}
				{!isLoaded && (
					<div className="flex items-center gap-2 px-3 py-2">
						<Skeleton className="size-6 rounded-full" />
						<Skeleton className="h-4 w-24" />
					</div>
				)}
			</SidebarFooter>
		</Sidebar>
	);
}
