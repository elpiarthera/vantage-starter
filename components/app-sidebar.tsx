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
 * Active state: subtle bg-accent fill, no border accent.
 */

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
	"h-9 min-h-[44px] rounded-md px-3 text-sm font-medium text-muted-foreground",
	"transition-colors hover:bg-sidebar-accent hover:text-foreground",
	// Active: subtle bg fill matching v0 sidebar-accent
	"data-[active=true]:bg-sidebar-accent data-[active=true]:text-foreground",
);

// Duration matches the easing token defined in globals.css
const navTransition = "150ms cubic-bezier(0.16, 1, 0.3, 1)";

export function AppSidebar() {
	const pathname = usePathname();
	const { setOpenMobile } = useSidebar();

	const handleNavClick = () => setOpenMobile(false);

	return (
		<TooltipProvider delayDuration={0}>
			<Sidebar
				collapsible="offcanvas"
				className="group-data-[side=left]:border-r border-sidebar-border bg-sidebar-background"
				aria-label="Main navigation"
			>
				{/* ── Header: Logo ── */}
				<SidebarHeader className="flex flex-row items-center px-4 h-14">
					<Link
						href="/dashboard"
						onClick={handleNavClick}
						aria-label="VantageStarter home"
						className="font-heading font-bold tracking-[-0.03em] text-foreground hover:opacity-80 transition-opacity"
					>
						VantageStarter
					</Link>
				</SidebarHeader>

				{/* ── Content ── */}
				<SidebarContent>
					{/* ─── OVERVIEW ─── */}
					<SidebarGroup>
						<SidebarGroupLabel className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
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
										style={{ transition: `color ${navTransition}` }}
									>
										<Link href="/dashboard" onClick={handleNavClick}>
											<svg
												width="18"
												height="18"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="1.5"
												className="shrink-0"
												aria-hidden="true"
											>
												<rect x="3" y="3" width="7" height="7" rx="1" />
												<rect x="14" y="3" width="7" height="7" rx="1" />
												<rect x="3" y="14" width="7" height="7" rx="1" />
												<rect x="14" y="14" width="7" height="7" rx="1" />
											</svg>
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
										style={{ transition: `color ${navTransition}` }}
									>
										<Link href="/dashboard/chat" onClick={handleNavClick}>
											<svg
												width="18"
												height="18"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="1.5"
												className="shrink-0"
												aria-hidden="true"
											>
												<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
											</svg>
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
										style={{ transition: `color ${navTransition}` }}
									>
										<Link href="/dashboard/missions" onClick={handleNavClick}>
											<svg
												width="18"
												height="18"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="1.5"
												className="shrink-0"
												aria-hidden="true"
											>
												<line x1="8" y1="6" x2="21" y2="6" />
												<line x1="8" y1="12" x2="21" y2="12" />
												<line x1="8" y1="18" x2="21" y2="18" />
												<line x1="3" y1="6" x2="3.01" y2="6" />
												<line x1="3" y1="12" x2="3.01" y2="12" />
												<line x1="3" y1="18" x2="3.01" y2="18" />
											</svg>
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
										style={{ transition: `color ${navTransition}` }}
									>
										<Link href="/dashboard/architect" onClick={handleNavClick}>
											<svg
												width="18"
												height="18"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="1.5"
												className="shrink-0"
												aria-hidden="true"
											>
												<path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
												<path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75L19 15z" />
												<path d="M5 3l.5 1.5L7 5l-1.5.5L5 7l-.5-1.5L3 5l1.5-.5L5 3z" />
											</svg>
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
						<SidebarGroupLabel className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
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
										style={{ transition: `color ${navTransition}` }}
									>
										<Link href="/dashboard/account" onClick={handleNavClick}>
											<svg
												width="18"
												height="18"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="1.5"
												className="shrink-0"
												aria-hidden="true"
											>
												<circle cx="12" cy="12" r="3" />
												<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
											</svg>
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
