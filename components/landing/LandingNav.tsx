"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingNav() {
	const t = useTranslations("landing");
	const [mobileOpen, setMobileOpen] = useState(false);
	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			setScrolled(window.scrollY > 10);
		};
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return (
		<>
			<header
				className={cn(
					"fixed top-0 left-0 right-0 z-50 w-full transition-all duration-200",
					scrolled
						? "bg-background/80 backdrop-blur-md border-b border-border"
						: "bg-transparent"
				)}
			>
				<div className="max-w-5xl mx-auto px-4 sm:px-6 flex h-16 items-center justify-between">
					{/* Logo — text only, no icon box */}
					<Link
						href="/"
						className="font-heading font-bold text-foreground tracking-[-0.02em]"
						aria-label="VantageStarter home"
					>
						VantageStarter
					</Link>

					{/* Desktop nav links */}
					<nav
						aria-label={t("nav.aria_label")}
						className="hidden md:flex items-center gap-6"
					>
						<a
							href="#features"
							className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-150 ease-out"
						>
							{t("nav.features")}
						</a>
						<a
							href="#pricing"
							className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-150 ease-out"
						>
							{t("nav.pricing")}
						</a>
					</nav>

					{/* Actions */}
					<div className="flex items-center gap-2">
						<LanguageSwitcher />
						<ThemeToggle />
						<Link href="/sign-in" className="hidden sm:block">
							<Button
								variant="ghost"
								size="sm"
								className="text-sm text-muted-foreground hover:text-foreground"
							>
								{t("nav.sign_in")}
							</Button>
						</Link>
						<Link href="/sign-up" className="hidden sm:block">
							<Button
								size="sm"
								className="h-8 px-4 text-sm rounded-full bg-primary text-primary-foreground"
							>
								{t("nav.get_started")}
							</Button>
						</Link>

						{/* Mobile hamburger */}
						<button
							type="button"
							aria-label={mobileOpen ? "Close menu" : "Open menu"}
							aria-expanded={mobileOpen}
							aria-controls="mobile-menu"
							className="md:hidden flex items-center justify-center size-9 text-muted-foreground hover:text-foreground transition-colors duration-150"
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
			</header>

			{/* Mobile full-screen overlay */}
			{mobileOpen && (
				<div
					id="mobile-menu"
					role="dialog"
					aria-modal="true"
					aria-label={t("nav.aria_label")}
					className="fixed inset-0 bg-background z-50 md:hidden flex flex-col"
				>
					{/* Header row */}
					<div className="flex h-16 items-center justify-between px-4 sm:px-6 border-b border-border">
						<Link
							href="/"
							className="font-heading font-bold text-foreground tracking-[-0.02em]"
							onClick={() => setMobileOpen(false)}
						>
							VantageStarter
						</Link>
						<button
							type="button"
							aria-label="Close menu"
							className="flex items-center justify-center size-9 text-muted-foreground hover:text-foreground transition-colors duration-150"
							onClick={() => setMobileOpen(false)}
						>
							<X className="size-5" aria-hidden="true" />
						</button>
					</div>

					{/* Nav links */}
					<nav className="flex flex-col px-4 sm:px-6 pt-6 gap-1 flex-1">
						<a
							href="#features"
							onClick={() => setMobileOpen(false)}
							className="flex items-center h-12 text-base font-medium text-muted-foreground hover:text-foreground transition-colors duration-150"
						>
							{t("nav.features")}
						</a>
						<a
							href="#pricing"
							onClick={() => setMobileOpen(false)}
							className="flex items-center h-12 text-base font-medium text-muted-foreground hover:text-foreground transition-colors duration-150"
						>
							{t("nav.pricing")}
						</a>
					</nav>

					{/* CTA buttons */}
					<div className="px-4 sm:px-6 pb-8 flex flex-col gap-3">
						<Link href="/sign-in" onClick={() => setMobileOpen(false)}>
							<Button variant="ghost" size="lg" className="w-full text-muted-foreground hover:text-foreground">
								{t("nav.sign_in")}
							</Button>
						</Link>
						<Link href="/sign-up" onClick={() => setMobileOpen(false)}>
							<Button size="lg" className="w-full rounded-full bg-primary text-primary-foreground">
								{t("nav.get_started")}
							</Button>
						</Link>
					</div>
				</div>
			)}
		</>
	);
}
