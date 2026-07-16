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

import { useTranslations } from "next-intl";
import * as React from "react";
import { SearchModal } from "@/components/search-modal";
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
import { Link, usePathname } from "@/i18n/routing";
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
	const { setOpenMobile, state, setOpen } = useSidebar();
	const isHoverExpandedRef = React.useRef(false);
	const [searchOpen, setSearchOpen] = React.useState(false);
	const [newMenuOpen, setNewMenuOpen] = React.useState(false);
	const t = useTranslations("app_sidebar");

	// Close new-menu when clicking outside
	const newMenuRef = React.useRef<HTMLDivElement>(null);
	React.useEffect(() => {
		if (!newMenuOpen) return;
		const handlePointerDown = (e: PointerEvent) => {
			if (
				newMenuRef.current &&
				!newMenuRef.current.contains(e.target as Node)
			) {
				setNewMenuOpen(false);
			}
		};
		document.addEventListener("pointerdown", handlePointerDown);
		return () => document.removeEventListener("pointerdown", handlePointerDown);
	}, [newMenuOpen]);

	const handleNavClick = () => setOpenMobile(false);

	// Cmd+K / Ctrl+K global shortcut
	React.useEffect(() => {
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setSearchOpen((prev) => !prev);
			}
		};
		document.addEventListener("keydown", handleKey);
		return () => document.removeEventListener("keydown", handleKey);
	}, []);

	const handleMouseEnter = () => {
		if (state === "collapsed") {
			isHoverExpandedRef.current = true;
			setOpen(true);
		}
	};

	const handleMouseLeave = () => {
		if (isHoverExpandedRef.current) {
			isHoverExpandedRef.current = false;
			setOpen(false);
		}
	};

	return (
		<TooltipProvider delayDuration={0}>
			<Sidebar
				collapsible="icon"
				className="group-data-[side=left]:border-r border-sidebar-border bg-sidebar-background"
				aria-label="Main navigation"
				data-hover-open={isHoverExpandedRef.current ? "true" : undefined}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
			>
				{/* ── Header: Logo ── */}
				<SidebarHeader className="flex flex-row items-center px-4 h-14">
					<Link
						href="/dashboard"
						onClick={handleNavClick}
						aria-label="VantageStarter home"
						className="font-heading font-bold tracking-[-0.03em] text-foreground hover:opacity-80 transition-opacity group-data-[collapsible=icon]:hidden"
					>
						VantageStarter
					</Link>
				</SidebarHeader>

				{/* ── Search Modal ── */}
				<SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

				{/* ── Content ── */}
				<SidebarContent>
					{/* ─── NEW BUTTON ─── */}
					<SidebarGroup className="pb-0 group-data-[collapsible=icon]:hidden">
						<SidebarGroupContent>
							<SidebarMenu>
								<SidebarMenuItem>
									<div ref={newMenuRef} className="relative px-2">
										<div className="flex items-center gap-1">
											<Link
												href="/dashboard/chat"
												onClick={handleNavClick}
												className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
											>
												{t("new_chat")}
											</Link>
											<button
												type="button"
												onClick={() => setNewMenuOpen((prev) => !prev)}
												className="rounded-lg bg-primary px-2 py-2 text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
												aria-label={t("more_new_options")}
												aria-expanded={newMenuOpen}
											>
												<svg
													width="16"
													height="16"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth="2"
													aria-hidden="true"
													style={{
														transform: newMenuOpen
															? "rotate(180deg)"
															: "rotate(0deg)",
														transition: `transform 150ms cubic-bezier(0.16, 1, 0.3, 1)`,
													}}
												>
													<path
														d="M6 9l6 6 6-6"
														strokeLinecap="round"
														strokeLinejoin="round"
													/>
												</svg>
											</button>
										</div>
										{newMenuOpen && (
											<div
												className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-border p-1.5 shadow-lg"
												style={{
													backgroundColor: "oklch(0.269 0 0)",
													color: "oklch(0.985 0 0)",
												}}
											>
												<Link
													href="/dashboard/chat"
													onClick={() => {
														handleNavClick();
														setNewMenuOpen(false);
													}}
													className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-popover-foreground transition-colors hover:bg-accent"
												>
													{t("new_chat")}
												</Link>
												<Link
													href="/dashboard/missions"
													onClick={() => {
														handleNavClick();
														setNewMenuOpen(false);
													}}
													className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-popover-foreground transition-colors hover:bg-accent"
												>
													{t("new_mission")}
												</Link>
												<Link
													href="/dashboard/architect"
													onClick={() => {
														handleNavClick();
														setNewMenuOpen(false);
													}}
													className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-popover-foreground transition-colors hover:bg-accent"
												>
													{t("new_architect_session")}
												</Link>
											</div>
										)}
									</div>
								</SidebarMenuItem>
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>

					{/* Collapsed: icon-only "+" button */}
					<SidebarGroup className="hidden pb-0 group-data-[collapsible=icon]:block">
						<SidebarGroupContent>
							<SidebarMenu>
								<SidebarMenuItem>
									<SidebarMenuButton
										asChild
										className="flex h-9 min-h-[44px] w-full items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
										aria-label={t("new_chat")}
									>
										<Link href="/dashboard/chat" onClick={handleNavClick}>
											<svg
												width="18"
												height="18"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
												aria-hidden="true"
											>
												<path
													d="M12 5v14M5 12h14"
													strokeLinecap="round"
													strokeLinejoin="round"
												/>
											</svg>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>

					{/* ─── SEARCH ─── */}
					<SidebarGroup className="pb-0">
						<SidebarGroupContent>
							<SidebarMenu>
								<SidebarMenuItem>
									<SidebarMenuButton
										className={cn(navItemClass, "w-full")}
										style={{ transition: `color ${navTransition}` }}
										onClick={() => setSearchOpen(true)}
									>
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
											<circle cx="11" cy="11" r="8" />
											<path d="m21 21-4.35-4.35" />
										</svg>
										<span>{t("nav_search")}</span>
										<kbd className="ml-auto hidden text-[10px] text-muted-foreground/60 font-mono group-data-[collapsible=icon]:hidden sm:inline-flex items-center gap-0.5">
											⌘K
										</kbd>
									</SidebarMenuButton>
								</SidebarMenuItem>
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>

					<SidebarSeparator className="mx-3" />

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
											<span>{t("nav_dashboard")}</span>
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
											<span>{t("nav_chat")}</span>
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
											<span>{t("nav_missions")}</span>
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
											<span>{t("nav_architect")}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>

								{/* Consultant Onboarding */}
								<SidebarMenuItem>
									<SidebarMenuButton
										asChild
										isActive={pathname.includes("/dashboard/consultant")}
										className={navItemClass}
										style={{ transition: `color ${navTransition}` }}
									>
										<Link
											href="/dashboard/consultant/onboard"
											onClick={handleNavClick}
										>
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
												<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
												<circle cx="9" cy="7" r="4" />
												<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
												<path d="M16 3.13a4 4 0 0 1 0 7.75" />
											</svg>
											<span>{t("consultant_onboarding")}</span>
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
											<span>{t("nav_settings")}</span>
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
