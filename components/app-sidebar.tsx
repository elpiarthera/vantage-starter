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
import {
	ChevronLeft,
	ChevronRight,
	LayoutGrid,
	LayoutList,
	MessageSquare,
	Settings,
	Sparkles,
} from "lucide-react";
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
	SidebarSeparator,
	useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { cn } from "@/lib/utils";

export function AppSidebar() {
	const pathname = usePathname();
	const { setOpenMobile, toggleSidebar, state } = useSidebar();
	const { user, isLoaded } = useUser();

	const handleNavClick = () => setOpenMobile(false);
	const isCollapsed = state === "collapsed";

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
										className={cn(
											"h-9 min-h-[44px] rounded-none px-4 text-sm font-medium text-muted-foreground transition-colors duration-150",
											"hover:text-foreground data-[active=true]:text-foreground data-[active=true]:border-l-2 data-[active=true]:border-primary data-[active=true]:pl-[14px]",
										)}
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
										className={cn(
											"h-9 min-h-[44px] rounded-none px-4 text-sm font-medium text-muted-foreground transition-colors duration-150",
											"hover:text-foreground data-[active=true]:text-foreground data-[active=true]:border-l-2 data-[active=true]:border-primary data-[active=true]:pl-[14px]",
										)}
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
										className={cn(
											"h-9 min-h-[44px] rounded-none px-4 text-sm font-medium text-muted-foreground transition-colors duration-150",
											"hover:text-foreground data-[active=true]:text-foreground data-[active=true]:border-l-2 data-[active=true]:border-primary data-[active=true]:pl-[14px]",
										)}
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
										className={cn(
											"h-9 min-h-[44px] rounded-none px-4 text-sm font-medium text-muted-foreground transition-colors duration-150",
											"hover:text-foreground data-[active=true]:text-foreground data-[active=true]:border-l-2 data-[active=true]:border-primary data-[active=true]:pl-[14px]",
										)}
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
										className={cn(
											"h-9 min-h-[44px] rounded-none px-4 text-sm font-medium text-muted-foreground transition-colors duration-150",
											"hover:text-foreground data-[active=true]:text-foreground data-[active=true]:border-l-2 data-[active=true]:border-primary data-[active=true]:pl-[14px]",
										)}
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

				{/* ── Footer: WorkspaceSwitcher + UserNav + Collapse trigger ── */}
				<SidebarFooter className="gap-1 pb-3">
					{/* Org switcher — full in expanded, icon only when collapsed */}
					<div className="group-data-[collapsible=icon]:hidden">
						<WorkspaceSwitcher />
					</div>
					<div className="hidden group-data-[collapsible=icon]:flex items-center justify-center py-1">
						<Tooltip>
							<TooltipTrigger asChild>
								<div className="size-7 flex items-center justify-center">
									<span
										className="font-heading font-bold text-xs text-foreground select-none"
										aria-hidden="true"
									>
										VS
									</span>
								</div>
							</TooltipTrigger>
							<TooltipContent side="right">Workspace</TooltipContent>
						</Tooltip>
					</div>

					{/* Thin separator between org and user */}
					<div className="h-px bg-sidebar-border mx-3 group-data-[collapsible=icon]:hidden" />

					{/* SidebarUserNav: avatar + name + theme toggle + sign out */}
					{isLoaded && user && <SidebarUserNav />}

					{/* Loading skeleton — shown while Clerk user hydrates */}
					{!isLoaded && (
						<div className="flex items-center gap-2 px-3 py-2">
							<Skeleton className="size-6 rounded-full" />
							<Skeleton className="h-4 w-24 group-data-[collapsible=icon]:hidden" />
						</div>
					)}

					{/* Collapse trigger at bottom of sidebar */}
					<div className="h-px bg-sidebar-border mx-3" />
					<SidebarMenu>
						<SidebarMenuItem>
							<Tooltip>
								<TooltipTrigger asChild>
									<SidebarMenuButton
										onClick={toggleSidebar}
										className="h-9 min-h-[44px] rounded-none px-3 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors duration-150"
										aria-label={
											isCollapsed ? "Expand sidebar" : "Collapse sidebar"
										}
									>
										{isCollapsed ? (
											<ChevronRight
												className="size-4 shrink-0"
												aria-hidden="true"
											/>
										) : (
											<>
												<ChevronLeft
													className="size-4 shrink-0"
													aria-hidden="true"
												/>
												<span className="text-sm">Collapse</span>
											</>
										)}
									</SidebarMenuButton>
								</TooltipTrigger>
								{isCollapsed && (
									<TooltipContent side="right">Expand sidebar</TooltipContent>
								)}
							</Tooltip>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarFooter>
			</Sidebar>
		</TooltipProvider>
	);
}
