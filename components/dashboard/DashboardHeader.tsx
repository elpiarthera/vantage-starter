"use client";

import { OrganizationSwitcher, SignOutButton, useUser } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import type React from "react";
import { useState } from "react";
import { PurchaseCreditsModal } from "@/components/dashboard/account/modals/PurchaseCreditsModal";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { useDevice } from "@/contexts/DeviceContext";
import { useCredits } from "@/hooks/business-logic/useCredits";
import { Link } from "@/i18n/routing";

interface DashboardHeaderProps {
	/**
	 * SidebarTrigger (panel toggle) rendered on all breakpoints.
	 * Passed from dashboard layout when AppSidebar is active.
	 */
	sidebarTrigger?: React.ReactNode;
}

export function DashboardHeader({ sidebarTrigger }: DashboardHeaderProps) {
	const { isMobile } = useDevice();
	const { user } = useUser();
	const t = useTranslations("dashboard_header");
	const tCredits = useTranslations("credits");
	const { balance } = useCredits(user?.id || "");
	const [showPurchaseModal, setShowPurchaseModal] = useState(false);

	const userName = user?.fullName || user?.username || "User";
	const userImage = user?.imageUrl;
	const userInitials = userName
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	const UserMenuMobile = () => (
		<Sheet>
			<SheetTrigger asChild>
				<Button
					variant="ghost"
					className="gap-2 px-2 min-h-[44px] min-w-[44px] active:scale-95"
					aria-label="User menu"
				>
					<Avatar className="h-8 w-8">
						<AvatarImage src={userImage} alt={userName} />
						<AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
					</Avatar>
				</Button>
			</SheetTrigger>
			<SheetContent side="bottom" className="h-auto">
				<SheetHeader>
					<SheetTitle>{t("my_account")}</SheetTitle>
				</SheetHeader>
				<div className="flex flex-col gap-2 mt-4">
					<Button
						variant="ghost"
						className="w-full justify-start min-h-[48px] active:scale-95"
						onClick={() => setShowPurchaseModal(true)}
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
							className="mr-2 shrink-0"
							aria-hidden="true"
						>
							<rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
							<line x1="1" y1="10" x2="23" y2="10" />
						</svg>
						<span>{t("credits")}</span>
						<Badge variant="secondary" className="ml-auto text-xs">
							{tCredits("your_balance", { balance })}
						</Badge>
					</Button>
					<Link href="/dashboard/account">
						<Button
							variant="ghost"
							className="w-full justify-start min-h-[48px] active:scale-95"
						>
							<svg
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.5"
								className="mr-2 shrink-0"
								aria-hidden="true"
							>
								<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
								<circle cx="12" cy="7" r="4" />
							</svg>
							<span>{t("profile")}</span>
						</Button>
					</Link>
					<Link href="/dashboard/account">
						<Button
							variant="ghost"
							className="w-full justify-start min-h-[48px] active:scale-95"
						>
							<svg
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.5"
								className="mr-2 shrink-0"
								aria-hidden="true"
							>
								<circle cx="12" cy="12" r="3" />
								<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
							</svg>
							<span>{t("settings")}</span>
						</Button>
					</Link>
					<SignOutButton>
						<Button
							variant="ghost"
							className="w-full justify-start min-h-[48px] text-destructive active:scale-95"
						>
							<svg
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.5"
								className="mr-2 shrink-0"
								aria-hidden="true"
							>
								<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
								<polyline points="16 17 21 12 16 7" />
								<line x1="21" y1="12" x2="9" y2="12" />
							</svg>
							<span>{t("log_out")}</span>
						</Button>
					</SignOutButton>
				</div>
			</SheetContent>
		</Sheet>
	);

	const UserMenuDesktop = () => (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					className="gap-2 px-2 min-h-[44px] hover:bg-accent"
					aria-label="User menu"
				>
					<Avatar className="h-8 w-8">
						<AvatarImage src={userImage} alt={userName} />
						<AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
					</Avatar>
					<span className="md:hidden text-sm">{userName}</span>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
						className="md:hidden opacity-50 shrink-0"
						aria-hidden="true"
					>
						<polyline points="6 9 12 15 18 9" />
					</svg>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel>{t("my_account")}</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="cursor-pointer"
					onClick={() => setShowPurchaseModal(true)}
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
						className="mr-2 shrink-0"
						aria-hidden="true"
					>
						<rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
						<line x1="1" y1="10" x2="23" y2="10" />
					</svg>
					<span>{t("credits")}</span>
					<Badge variant="secondary" className="ml-auto text-xs">
						{tCredits("your_balance", { balance })}
					</Badge>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Link href="/dashboard/account" className="cursor-pointer">
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
							className="mr-2 shrink-0"
							aria-hidden="true"
						>
							<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
							<circle cx="12" cy="7" r="4" />
						</svg>
						<span>{t("profile")}</span>
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<Link href="/dashboard/account" className="cursor-pointer">
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
							className="mr-2 shrink-0"
							aria-hidden="true"
						>
							<circle cx="12" cy="12" r="3" />
							<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
						</svg>
						<span>{t("settings")}</span>
					</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<SignOutButton>
					<DropdownMenuItem className="cursor-pointer text-destructive">
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
							className="mr-2 shrink-0"
							aria-hidden="true"
						>
							<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
							<polyline points="16 17 21 12 16 7" />
							<line x1="21" y1="12" x2="9" y2="12" />
						</svg>
						<span>{t("log_out")}</span>
					</DropdownMenuItem>
				</SignOutButton>
			</DropdownMenuContent>
		</DropdownMenu>
	);

	return (
		<>
			<header className="sticky top-0 z-50 w-full border-b border-border bg-background">
				<div className="container flex h-12 md:h-14 items-center justify-between px-4 md:px-6">
					{/* Left: Sidebar toggle (all breakpoints) + Org Switcher */}
					<div className="flex items-center gap-2">
						{/* SidebarTrigger: always visible so user can re-open collapsed sidebar */}
						{sidebarTrigger}
						{/* Org Switcher — visible on all breakpoints */}
						<OrganizationSwitcher
							hidePersonal={false}
							afterCreateOrganizationUrl="/dashboard"
							afterLeaveOrganizationUrl="/dashboard"
							afterSelectOrganizationUrl="/dashboard"
							afterSelectPersonalUrl="/dashboard"
							createOrganizationMode="modal"
							appearance={{
								elements: {
									rootBox: "flex items-center",
									organizationSwitcherTrigger:
										"min-h-[36px] px-3 py-1.5 rounded-lg hover:bg-muted transition-colors duration-150 ease-out text-sm gap-2 text-foreground",
								},
							}}
						/>
					</div>

					{/* Right: Language Switcher (mobile only) + Credits + Notifications + User Menu */}
					<div className="flex items-center gap-2 md:gap-4">
						{/* Language Switcher — mobile only */}
						<div className="md:hidden">
							<LanguageSwitcher />
						</div>

						{/* Credit balance — visible on desktop, opens purchase modal */}
						<button
							type="button"
							onClick={() => setShowPurchaseModal(true)}
							className="hidden md:flex items-center gap-1.5 min-h-[44px] px-2 rounded-md hover:bg-muted transition-colors cursor-pointer"
							aria-label={tCredits("your_balance", { balance })}
						>
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.5"
								className="text-muted-foreground shrink-0"
								aria-hidden="true"
							>
								<rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
								<line x1="1" y1="10" x2="23" y2="10" />
							</svg>
							<span className="text-sm text-muted-foreground">{balance}</span>
						</button>

						{/* Notifications */}
						<Button
							variant="ghost"
							size="icon"
							className={`relative min-h-[44px] min-w-[44px] ${isMobile ? "active:scale-95" : "hover:bg-accent"}`}
							aria-label="Notifications"
						>
							<svg
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.5"
								aria-hidden="true"
							>
								<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
								<path d="M13.73 21a2 2 0 0 1-3.46 0" />
							</svg>
							<span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
						</Button>

						{/* User Menu - Adaptive (Sheet on mobile, Dropdown on desktop) */}
						{isMobile ? <UserMenuMobile /> : <UserMenuDesktop />}
					</div>
				</div>
			</header>

			<PurchaseCreditsModal
				isOpen={showPurchaseModal}
				onClose={() => setShowPurchaseModal(false)}
			/>
		</>
	);
}
