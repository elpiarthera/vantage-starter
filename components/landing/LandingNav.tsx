"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
	{ href: "#features", labelKey: "nav.features" as const },
	{ href: "#pricing", labelKey: "nav.pricing" as const },
	{ href: "#faq", labelKey: "nav.faq" as const },
];

export function LandingNav() {
	const t = useTranslations("landing");
	const [mobileOpen, setMobileOpen] = useState(false);
	const [scrolled, setScrolled] = useState(false);
	const [activeSection, setActiveSection] = useState("");
	const menuRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const firstLinkRef = useRef<HTMLAnchorElement>(null);

	// Scroll detection + active section tracking
	useEffect(() => {
		const handleScroll = () => {
			setScrolled(window.scrollY > 10);

			const scrollY = window.scrollY + 120;
			let current = "";

			for (const link of NAV_LINKS) {
				const id = link.href.slice(1);
				const el = document.getElementById(id);
				if (el && el.offsetTop <= scrollY) {
					current = link.href;
				}
			}

			setActiveSection(current);
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	// Close mobile menu on outside click
	useEffect(() => {
		if (!mobileOpen) return;

		const handleClickOutside = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setMobileOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [mobileOpen]);

	// Close on resize above md
	useEffect(() => {
		const mq = window.matchMedia("(min-width: 768px)");
		const handler = () => {
			if (mq.matches) setMobileOpen(false);
		};
		mq.addEventListener("change", handler);
		return () => mq.removeEventListener("change", handler);
	}, []);

	// Focus trap within mobile menu
	const handleMenuKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (!mobileOpen) return;

			if (e.key === "Escape") {
				setMobileOpen(false);
				buttonRef.current?.focus();
				return;
			}

			if (e.key === "Tab") {
				const focusableEls = menuRef.current?.querySelectorAll<HTMLElement>(
					"a[href], button:not([disabled])",
				);
				if (!focusableEls || focusableEls.length === 0) return;

				const first = focusableEls[0];
				const last = focusableEls[focusableEls.length - 1];

				if (e.shiftKey && document.activeElement === first) {
					e.preventDefault();
					last.focus();
				} else if (!e.shiftKey && document.activeElement === last) {
					e.preventDefault();
					first.focus();
				}
			}
		},
		[mobileOpen],
	);

	// Focus first link when menu opens
	useEffect(() => {
		if (mobileOpen) {
			requestAnimationFrame(() => {
				firstLinkRef.current?.focus();
			});
		}
	}, [mobileOpen]);

	return (
		<>
			<header
				className={cn(
					"fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500",
					scrolled
						? "border-b border-border/80 bg-background/90 backdrop-blur-md shadow-[0_1px_3px_oklch(0_0_0/0.04)]"
						: "bg-transparent",
				)}
			>
				<div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
					{/* Logo */}
					<Link
						href="/"
						className="group flex items-center gap-2.5 no-underline"
						aria-label="VantageStarter home"
					>
						<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-sm transition-transform duration-300 group-hover:scale-105 group-hover:rotate-[-2deg]">
							VS
						</span>
						<span className="font-heading font-bold text-foreground tracking-[-0.02em] transition-all duration-300 group-hover:tracking-wide">
							VantageStarter
						</span>
					</Link>

					{/* Desktop nav links — active underline indicator */}
					<nav
						aria-label={t("nav.aria_label")}
						className="hidden md:flex items-center gap-1"
					>
						{NAV_LINKS.map((link) => (
							<a
								key={link.href}
								href={link.href}
								aria-current={activeSection === link.href ? "true" : undefined}
								className={cn(
									"group relative rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
									activeSection === link.href
										? "text-foreground"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								{t(link.labelKey)}
								{/* Animated underline — slides in on hover / stays for active */}
								<span
									className={cn(
										"absolute bottom-1.5 left-4 right-4 h-px bg-foreground origin-left transition-transform duration-300",
										activeSection === link.href
											? "scale-x-100"
											: "scale-x-0 group-hover:scale-x-100",
									)}
									aria-hidden="true"
								/>
							</a>
						))}
					</nav>

					{/* Actions */}
					<div className="flex items-center gap-3">
						<LanguageSwitcher />
						<ThemeToggle />
						<Link
							href="/sign-in"
							className="hidden sm:inline-flex rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring no-underline"
						>
							{t("nav.sign_in")}
						</Link>
						<Link
							href="/sign-up"
							className="hidden sm:inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 btn-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring no-underline"
						>
							{t("nav.get_started")}
						</Link>

						{/* Mobile hamburger — animated icon swap */}
						<button
							ref={buttonRef}
							type="button"
							aria-label={mobileOpen ? "Close menu" : "Open menu"}
							aria-expanded={mobileOpen}
							aria-controls="mobile-menu"
							className="md:hidden relative flex items-center justify-center size-10 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-150"
							onClick={() => setMobileOpen((v) => !v)}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
								className={cn(
									"absolute transition-all duration-300",
									mobileOpen ? "rotate-90 opacity-0" : "rotate-0 opacity-100",
								)}
							>
								<line x1="4" x2="20" y1="6" y2="6" />
								<line x1="4" x2="20" y1="12" y2="12" />
								<line x1="4" x2="20" y1="18" y2="18" />
							</svg>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
								className={cn(
									"absolute transition-all duration-300",
									mobileOpen ? "rotate-0 opacity-100" : "-rotate-90 opacity-0",
								)}
							>
								<path d="M18 6 6 18" />
								<path d="m6 6 12 12" />
							</svg>
						</button>
					</div>
				</div>
			</header>

			{/* Mobile menu — slide down panel, not full-screen overlay */}
			{mobileOpen && (
				<nav
					id="mobile-menu"
					ref={menuRef}
					aria-label={t("nav.aria_label")}
					onKeyDown={handleMenuKeyDown}
					className="fixed top-16 left-0 right-0 z-50 border-t border-border/80 bg-background/95 backdrop-blur-md md:hidden mobile-menu-enter"
				>
					<div className="max-w-6xl mx-auto px-6 py-4 space-y-1">
						{NAV_LINKS.map((link, i) => (
							<a
								key={link.href}
								ref={i === 0 ? firstLinkRef : undefined}
								href={link.href}
								onClick={() => setMobileOpen(false)}
								aria-current={activeSection === link.href ? "true" : undefined}
								className={cn(
									"block rounded-lg px-4 py-3 text-base font-medium transition-colors",
									activeSection === link.href
										? "bg-muted text-foreground"
										: "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
								)}
							>
								{t(link.labelKey)}
							</a>
						))}
					</div>

					{/* CTA buttons */}
					<div className="max-w-6xl mx-auto px-6 pb-6 flex flex-col gap-3 border-t border-border/60 pt-4">
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
				</nav>
			)}
		</>
	);
}
