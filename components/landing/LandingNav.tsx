"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Link } from "@/i18n/routing";
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
					"fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ease-out-expo",
					scrolled
						? "bg-background/80 backdrop-blur-md border-b border-border"
						: "bg-transparent",
				)}
			>
				<div className="max-w-6xl mx-auto px-6 lg:px-12 flex h-16 items-center justify-between">
					{/* Logo — text with subtle glow halo */}
					<Link
						href="/"
						className="relative font-heading font-bold text-foreground tracking-[-0.02em] no-underline"
						aria-label="VantageStarter home"
					>
						{/* Logo glow layer */}
						<span
							className="pointer-events-none absolute inset-0 rounded-2xl bg-foreground/5 blur-2xl"
							aria-hidden="true"
						/>
						<span className="relative">VantageStarter</span>
					</Link>

					{/* Desktop nav links */}
					<nav
						aria-label={t("nav.aria_label")}
						className="hidden md:flex items-center gap-6"
					>
						<a
							href="#features"
							className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-150 ease-out-expo"
						>
							{t("nav.features")}
						</a>
						<a
							href="#pricing"
							className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-150 ease-out-expo"
						>
							{t("nav.pricing")}
						</a>
						<a
							href="#faq"
							className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-150 ease-out-expo"
						>
							{t("nav.faq")}
						</a>
					</nav>

					{/* Actions */}
					<div className="flex items-center gap-2">
						<LanguageSwitcher />
						<ThemeToggle />
						<Link
							href="/sign-in"
							className="hidden sm:inline-flex no-underline"
						>
							<ui-button variant="ghost" size="sm">
								{t("nav.sign_in")}
							</ui-button>
						</Link>
						<Link
							href="/sign-up"
							className="hidden sm:inline-flex no-underline"
						>
							<ui-button variant="primary" size="sm">
								{t("nav.get_started")}
							</ui-button>
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
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									aria-hidden="true"
								>
									<path d="M18 6 6 18" />
									<path d="m6 6 12 12" />
								</svg>
							) : (
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									aria-hidden="true"
								>
									<line x1="4" x2="20" y1="12" y2="12" />
									<line x1="4" x2="20" y1="6" y2="6" />
									<line x1="4" x2="20" y1="18" y2="18" />
								</svg>
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
					className="fixed inset-0 bg-background z-50 md:hidden flex flex-col mobile-menu-enter"
				>
					{/* Header row */}
					<div className="flex h-16 items-center justify-between px-6 lg:px-12 border-b border-border">
						<Link
							href="/"
							className="font-heading font-bold text-foreground tracking-[-0.02em] no-underline"
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
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
							>
								<path d="M18 6 6 18" />
								<path d="m6 6 12 12" />
							</svg>
						</button>
					</div>

					{/* Nav links */}
					<nav className="flex flex-col px-6 pt-6 gap-1 flex-1">
						{/* biome-ignore lint/a11y/useValidAnchor: anchor navigates to a page section; onClick closes the mobile overlay */}
						<a
							href="#features"
							onClick={() => setMobileOpen(false)}
							className="flex items-center h-12 text-base font-medium text-muted-foreground hover:text-foreground transition-colors duration-150"
						>
							{t("nav.features")}
						</a>
						{/* biome-ignore lint/a11y/useValidAnchor: anchor navigates to a page section; onClick closes the mobile overlay */}
						<a
							href="#pricing"
							onClick={() => setMobileOpen(false)}
							className="flex items-center h-12 text-base font-medium text-muted-foreground hover:text-foreground transition-colors duration-150"
						>
							{t("nav.pricing")}
						</a>
						{/* biome-ignore lint/a11y/useValidAnchor: anchor navigates to a page section; onClick closes the mobile overlay */}
						<a
							href="#faq"
							onClick={() => setMobileOpen(false)}
							className="flex items-center h-12 text-base font-medium text-muted-foreground hover:text-foreground transition-colors duration-150"
						>
							{t("nav.faq")}
						</a>
					</nav>

					{/* CTA buttons */}
					<div className="px-6 pb-8 flex flex-col gap-3">
						<Link
							href="/sign-in"
							onClick={() => setMobileOpen(false)}
							className="w-full no-underline"
						>
							<ui-button variant="ghost" size="lg" class="w-full">
								{t("nav.sign_in")}
							</ui-button>
						</Link>
						<Link
							href="/sign-up"
							onClick={() => setMobileOpen(false)}
							className="w-full no-underline"
						>
							<ui-button variant="primary" size="lg" class="w-full">
								{t("nav.get_started")}
							</ui-button>
						</Link>
					</div>
				</div>
			)}
		</>
	);
}
