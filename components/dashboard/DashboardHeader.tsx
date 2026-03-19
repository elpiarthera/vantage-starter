"use client";

import { SignOutButton, useUser } from "@clerk/nextjs";
import {
	Bell,
	ChevronDown,
	CreditCard,
	LogOut,
	Settings,
	User,
} from "lucide-react";
import { useTranslations } from "next-intl";
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

export function DashboardHeader() {
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
						<CreditCard className="mr-2 h-5 w-5" />
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
							<User className="mr-2 h-5 w-5" />
							<span>{t("profile")}</span>
						</Button>
					</Link>
					<Link href="/dashboard/account">
						<Button
							variant="ghost"
							className="w-full justify-start min-h-[48px] active:scale-95"
						>
							<Settings className="mr-2 h-5 w-5" />
							<span>{t("settings")}</span>
						</Button>
					</Link>
					<SignOutButton>
						<Button
							variant="ghost"
							className="w-full justify-start min-h-[48px] text-red-600 active:scale-95"
						>
							<LogOut className="mr-2 h-5 w-5" />
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
					className="gap-2 px-3 min-h-[44px] hover:bg-accent"
					aria-label="User menu"
				>
					<Avatar className="h-8 w-8">
						<AvatarImage src={userImage} alt={userName} />
						<AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
					</Avatar>
					<span className="text-sm">{userName}</span>
					<ChevronDown className="h-4 w-4 opacity-50" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel>{t("my_account")}</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="cursor-pointer"
					onClick={() => setShowPurchaseModal(true)}
				>
					<CreditCard className="mr-2 h-4 w-4" />
					<span>{t("credits")}</span>
					<Badge variant="secondary" className="ml-auto text-xs">
						{tCredits("your_balance", { balance })}
					</Badge>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Link href="/dashboard/account" className="cursor-pointer">
						<User className="mr-2 h-4 w-4" />
						<span>{t("profile")}</span>
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<Link href="/dashboard/account" className="cursor-pointer">
						<Settings className="mr-2 h-4 w-4" />
						<span>{t("settings")}</span>
					</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<SignOutButton>
					<DropdownMenuItem className="cursor-pointer text-red-600">
						<LogOut className="mr-2 h-4 w-4" />
						<span>{t("log_out")}</span>
					</DropdownMenuItem>
				</SignOutButton>
			</DropdownMenuContent>
		</DropdownMenu>
	);

	return (
		<>
			<header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="container flex h-14 md:h-16 items-center justify-between px-4 md:px-6">
					{/* Left: Organization Switcher (Placeholder) */}
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							className={`gap-2 px-2 md:px-3 text-sm md:text-base min-h-[44px] min-w-[44px] ${
								isMobile ? "active:scale-95" : "hover:bg-accent"
							}`}
						>
							<span className="font-semibold">VantageStarter</span>
							<ChevronDown className="h-4 w-4 opacity-50" />
						</Button>
					</div>

					{/* Right: Language Switcher + Credits + Notifications + User Menu */}
					<div className="flex items-center gap-2 md:gap-4">
						{/* Language Switcher */}
						<LanguageSwitcher />

						{/* Credit balance — visible on desktop, opens purchase modal */}
						<button
							type="button"
							onClick={() => setShowPurchaseModal(true)}
							className="hidden md:flex items-center gap-1 min-h-[44px] px-2 rounded-md hover:bg-accent transition-colors cursor-pointer"
							aria-label={tCredits("your_balance", { balance })}
						>
							<CreditCard className="h-4 w-4 text-muted-foreground" />
							<Badge
								variant="outline"
								className="text-xs border-muted text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
							>
								{tCredits("your_balance", { balance })}
							</Badge>
						</button>

						{/* Notifications */}
						<Button
							variant="ghost"
							size="icon"
							className={`relative min-h-[44px] min-w-[44px] ${isMobile ? "active:scale-95" : "hover:bg-accent"}`}
							aria-label="Notifications"
						>
							<Bell className="h-5 w-5" />
							<span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
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
