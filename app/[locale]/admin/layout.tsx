"use client";

import { useConvexAuth, useQuery } from "convex/react";
import {
	ChevronLeft,
	ChevronRight,
	FolderTree,
	ImageIcon,
	Layers,
	LayoutGrid,
	Menu,
	Palette,
	Settings,
	Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type React from "react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { api } from "@/convex/_generated/api";

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const t = useTranslations("admin");
	const locale = useLocale();
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
	const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
	const currentUser = useQuery(
		api.users.getCurrentUser,
		isAuthenticated ? {} : "skip",
	);

	const navigation = [
		{
			name: t("sidebar.meta_categories"),
			href: `/${locale}/admin/meta-categories`,
			icon: Layers,
		},
		{
			name: t("sidebar.categories"),
			href: `/${locale}/admin/categories`,
			icon: LayoutGrid,
		},
		{
			name: t("sidebar.subcategories"),
			href: `/${locale}/admin/subcategories`,
			icon: FolderTree,
		},
		{
			name: t("sidebar.themes"),
			href: `/${locale}/admin/themes`,
			icon: Palette,
		},
		{
			name: t("sidebar.refinement_flows"),
			href: `/${locale}/admin/refinement-flows`,
			icon: Sparkles,
		},
		{ name: t("sidebar.ads"), href: `/${locale}/admin/ads`, icon: ImageIcon },
		{
			name: t("sidebar.wall_builder"),
			href: `/${locale}/admin/wall-builder`,
			icon: Palette,
		},
	];

	if (authLoading || (isAuthenticated && currentUser === undefined)) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center">
					<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4" />
					<p className="text-muted-foreground">{t("loading")}</p>
				</div>
			</div>
		);
	}

	if (!isAuthenticated) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center max-w-md px-4">
					<h1 className="text-2xl font-bold text-foreground mb-2">
						{t("auth_required_title")}
					</h1>
					<p className="text-muted-foreground leading-relaxed mb-6">
						{t("auth_required_description")}
					</p>
					<Link
						href={`/${locale}/sign-in`}
						className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-smooth"
					>
						{t("sign_in_button")}
					</Link>
				</div>
			</div>
		);
	}

	if (
		currentUser &&
		currentUser.role !== "admin" &&
		currentUser.role !== "owner"
	) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center max-w-md px-4">
					<h1 className="text-2xl font-bold text-foreground mb-2">
						{t("admin_required_title")}
					</h1>
					<p className="text-muted-foreground leading-relaxed mb-6">
						{t("admin_required_description")}
					</p>
					<Link
						href={`/${locale}/dashboard`}
						className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-smooth"
					>
						{t("back_to_dashboard")}
					</Link>
				</div>
			</div>
		);
	}

	const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => (
		<div className="flex flex-col h-full">
			{/* Admin Header */}
			<div
				className={`h-[88px] px-6 flex items-center border-b border-border ${collapsed ? "px-3" : ""}`}
			>
				<Link href={`/${locale}`} className="flex items-center gap-3 group">
					<div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
						<Settings className="w-5 h-5 text-accent-foreground" />
					</div>
					{!collapsed && (
						<div>
							<h1 className="text-lg font-semibold text-foreground">
								{t("panel_title")}
							</h1>
							<p className="text-xs text-muted-foreground">
								{t("panel_subtitle")}
							</p>
						</div>
					)}
				</Link>
			</div>

			{/* Navigation Links */}
			<nav className="flex-1 px-3 py-4 space-y-1">
				{navigation.map((item) => (
					<Link
						key={item.name}
						href={item.href}
						className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-all duration-200"
						title={collapsed ? item.name : undefined}
					>
						<item.icon className="w-5 h-5 flex-shrink-0" />
						{!collapsed && item.name}
					</Link>
				))}
			</nav>

			{/* Footer */}
			{!collapsed && (
				<div className="px-6 py-4 border-t border-border">
					<Link
						href={`/${locale}`}
						className="text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						{t("sidebar.back_to_app")}
					</Link>
				</div>
			)}
		</div>
	);

	return (
		<div className="flex h-screen bg-background">
			<aside
				className={`hidden md:flex border-r border-border bg-background/50 backdrop-blur-xl flex-shrink-0 transition-all duration-300 ${
					isSidebarCollapsed ? "w-[72px]" : "w-64"
				}`}
			>
				<div className="relative w-full">
					<SidebarContent collapsed={isSidebarCollapsed} />

					<button
						onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
						className="absolute -right-3 top-6 w-6 h-6 rounded-full border border-border bg-background shadow-sm hover:bg-accent/10 transition-colors flex items-center justify-center"
						aria-label={
							isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
						}
					>
						{isSidebarCollapsed ? (
							<ChevronRight className="w-4 h-4" />
						) : (
							<ChevronLeft className="w-4 h-4" />
						)}
					</button>
				</div>
			</aside>

			{/* Main Content */}
			<main className="flex-1 flex flex-col overflow-hidden">
				<div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-background/50 backdrop-blur-xl">
					<h1 className="text-lg font-semibold">{t("panel_title")}</h1>
					<Sheet>
						<SheetTrigger asChild>
							<button className="p-2 hover:bg-accent/10 rounded-lg transition-colors">
								<Menu className="w-6 h-6" />
							</button>
						</SheetTrigger>
						<SheetContent side="left" className="w-64 p-0">
							<SidebarContent />
						</SheetContent>
					</Sheet>
				</div>

				<div className="flex-1 overflow-auto">{children}</div>
			</main>
		</div>
	);
}
