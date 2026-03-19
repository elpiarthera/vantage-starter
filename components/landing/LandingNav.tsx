"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export function LandingNav() {
	const t = useTranslations("landing");
	const [mobileOpen, setMobileOpen] = useState(false);

	return (
		<header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/90 backdrop-blur-sm">
			<div className="max-w-5xl mx-auto px-4 sm:px-6 flex h-16 items-center justify-between">
				{/* Logo */}
				<Link
					href="/"
					className="flex items-center gap-2 font-semibold text-foreground tracking-[-0.02em]"
					aria-label="VantageStarter home"
				>
					<span
						className="flex items-center justify-center size-7 rounded-lg bg-primary/15 border border-primary/25 text-primary text-xs font-bold"
						aria-hidden="true"
					>
						VS
					</span>
					<span className="hidden sm:inline">VantageStarter</span>
				</Link>

				{/* Desktop nav links */}
				<nav
					aria-label={t("nav.aria_label")}
					className="hidden md:flex items-center gap-6 text-sm text-muted-foreground"
				>
					<a
						href="#features"
						className="hover:text-foreground transition-colors duration-150 ease-out"
					>
						{t("nav.features")}
					</a>
					<a
						href="#pricing"
						className="hover:text-foreground transition-colors duration-150 ease-out"
					>
						{t("nav.pricing")}
					</a>
				</nav>

				{/* Actions */}
				<div className="flex items-center gap-1.5 sm:gap-2">
					<LanguageSwitcher />
					<ThemeToggle />
					<Link href="/sign-in" className="hidden sm:block">
						<Button
							variant="ghost"
							size="sm"
							className="text-muted-foreground hover:text-foreground"
						>
							{t("nav.sign_in")}
						</Button>
					</Link>
					<Link href="/sign-up" className="hidden sm:block">
						<Button size="sm" className="gap-1.5">
							{t("nav.get_started")}
						</Button>
					</Link>

					{/* Mobile hamburger */}
					<button
						type="button"
						aria-label={mobileOpen ? "Close menu" : "Open menu"}
						aria-expanded={mobileOpen}
						aria-controls="mobile-menu"
						className="md:hidden flex items-center justify-center size-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150"
						onClick={() => setMobileOpen((v) => !v)}
					>
						{mobileOpen ? (
							<X className="size-5" aria-hidden="true" />
						) : (
							<Menu className="size-5" aria-hidden="true" />
						)}
					</button>
				</div>
			</div>

			{/* Mobile menu panel */}
			{mobileOpen && (
				<nav
					id="mobile-menu"
					aria-label={t("nav.aria_label")}
					className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-sm"
				>
					<div className="max-w-5xl mx-auto px-4 py-4 flex flex-col gap-1">
						<a
							href="#features"
							onClick={() => setMobileOpen(false)}
							className="flex items-center h-11 px-3 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150"
						>
							{t("nav.features")}
						</a>
						<a
							href="#pricing"
							onClick={() => setMobileOpen(false)}
							className="flex items-center h-11 px-3 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150"
						>
							{t("nav.pricing")}
						</a>
						<div className="pt-3 mt-2 border-t border-border/40 flex flex-col gap-2">
							<Link href="/sign-in" onClick={() => setMobileOpen(false)}>
								<Button
									variant="ghost"
									size="sm"
									className="w-full justify-start text-muted-foreground hover:text-foreground"
								>
									{t("nav.sign_in")}
								</Button>
							</Link>
							<Link href="/sign-up" onClick={() => setMobileOpen(false)}>
								<Button size="sm" className="w-full gap-1.5">
									{t("nav.get_started")}
								</Button>
							</Link>
						</div>
					</div>
				</nav>
			)}
		</header>
	);
}
