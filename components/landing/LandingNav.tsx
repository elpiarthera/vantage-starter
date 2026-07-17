"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

// biome-ignore format: import order managed by Biome

const NAV_LINKS = [
	{ href: "#features", labelKey: "nav.features" as const },
	{ href: "#pricing", labelKey: "nav.pricing" as const },
	{ href: "#faq", labelKey: "nav.faq" as const },
];

export function LandingNav() {
	const t = useTranslations("landing");
	const [isScrolled, setIsScrolled] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [activeSection, setActiveSection] = useState("");
	const menuRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const firstLinkRef = useRef<HTMLAnchorElement>(null);

	// Scroll detection + active section tracking
	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 10);

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
		if (!mobileMenuOpen) return;

		const handleClickOutside = (e: MouseEvent) => {
			if (
				menuRef.current &&
				!menuRef.current.contains(e.target as Node) &&
				buttonRef.current &&
				!buttonRef.current.contains(e.target as Node)
			) {
				setMobileMenuOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [mobileMenuOpen]);

	// Focus trap within mobile menu
	const handleMenuKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (!mobileMenuOpen) return;

			if (e.key === "Escape") {
				setMobileMenuOpen(false);
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
		[mobileMenuOpen],
	);

	// Focus first link when menu opens
	useEffect(() => {
		if (mobileMenuOpen) {
			requestAnimationFrame(() => {
				firstLinkRef.current?.focus();
			});
		}
	}, [mobileMenuOpen]);

	// Close mobile menu on resize above md breakpoint
	useEffect(() => {
		const mq = window.matchMedia("(min-width: 768px)");
		const handler = () => {
			if (mq.matches) setMobileMenuOpen(false);
		};
		mq.addEventListener("change", handler);
		return () => mq.removeEventListener("change", handler);
	}, []);

	const closeMobileMenu = () => setMobileMenuOpen(false);

	return (
		<header
			className={cn(
				"fixed top-0 left-0 right-0 z-50 transition-all duration-500",
				isScrolled
					? "border-b border-gray-200/80 bg-white/90 backdrop-blur-md shadow-[0_1px_3px_oklch(0_0_0/0.04)] dark:border-gray-800/80 dark:bg-gray-950/90"
					: "bg-transparent",
			)}
		>
			<nav
				aria-label={t("nav.aria_label")}
				className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4"
			>
				{/* Logo */}
				<Link
					href="/"
					className="group flex items-center gap-2.5 no-underline"
					aria-label={t("nav.home_aria")}
				>
					{/* Brand monogram — logo initials, not sentence content, never translated */}
					<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-xs font-bold shadow-sm transition-transform duration-300 group-hover:scale-105 group-hover:rotate-[-2deg]">
						VS
					</span>
					<span className="text-xl font-bold text-gray-900 dark:text-gray-100 transition-all duration-300 group-hover:tracking-wide">
						VantageStarter
					</span>
				</Link>

				{/* Desktop nav links */}
				<div className="hidden items-center gap-1 md:flex">
					{NAV_LINKS.map((link) => (
						<a
							key={link.href}
							href={link.href}
							aria-current={activeSection === link.href ? "true" : undefined}
							className={cn(
								"group relative rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-ring",
								activeSection === link.href
									? "text-gray-900 dark:text-gray-100"
									: "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100",
							)}
						>
							{t(link.labelKey)}
							<span
								aria-hidden="true"
								className={cn(
									"absolute bottom-1.5 left-4 right-4 h-px bg-gray-900 dark:bg-gray-100 origin-left transition-transform duration-300",
									activeSection === link.href
										? "scale-x-100"
										: "scale-x-0 group-hover:scale-x-100",
								)}
							/>
						</a>
					))}
				</div>

				{/* Actions */}
				<div className="flex items-center gap-3">
					<LanguageSwitcher />
					<ThemeToggle />

					{/* Hamburger button (mobile only) */}
					<button
						ref={buttonRef}
						type="button"
						onClick={() => setMobileMenuOpen((prev) => !prev)}
						aria-label={
							mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"
						}
						aria-expanded={mobileMenuOpen}
						aria-controls="mobile-menu"
						className="relative flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 focus-ring md:hidden"
					>
						<svg
							className={cn(
								"h-5 w-5 transition-transform duration-300",
								mobileMenuOpen ? "rotate-90 opacity-0" : "rotate-0 opacity-100",
							)}
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={2}
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M4 6h16M4 12h16M4 18h16"
							/>
						</svg>
						<svg
							className={cn(
								"absolute h-5 w-5 transition-transform duration-300",
								mobileMenuOpen
									? "rotate-0 opacity-100"
									: "-rotate-90 opacity-0",
							)}
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={2}
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>

					<Link
						href="/sign-in"
						className="hidden rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 no-underline transition-colors focus-ring sm:inline-flex"
					>
						{t("nav.sign_in")}
					</Link>

					<Link
						href="/sign-up"
						className="hidden rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white no-underline transition-all hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 btn-shadow focus-ring sm:inline-flex"
					>
						{t("nav.get_started")}
					</Link>
				</div>
			</nav>

			{/* Mobile menu — dropdown panel */}
			{mobileMenuOpen && (
				<nav
					id="mobile-menu"
					ref={menuRef as React.RefObject<HTMLElement>}
					aria-label={t("nav.aria_label")}
					onKeyDown={handleMenuKeyDown}
					className="border-t border-gray-200/80 bg-white/95 backdrop-blur-md dark:border-gray-800/80 dark:bg-gray-950/95 md:hidden mobile-menu-enter"
				>
					<div className="mx-auto max-w-6xl space-y-1 px-6 py-4">
						{NAV_LINKS.map((link, i) => (
							<a
								key={link.href}
								ref={i === 0 ? firstLinkRef : undefined}
								href={link.href}
								onClick={closeMobileMenu}
								aria-current={activeSection === link.href ? "true" : undefined}
								className={cn(
									"block rounded-lg px-4 py-3 text-base font-medium transition-colors focus-ring",
									activeSection === link.href
										? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
										: "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-100",
								)}
							>
								{t(link.labelKey)}
							</a>
						))}
					</div>

					{/* Mobile CTA buttons */}
					<div className="mx-auto max-w-6xl border-t border-gray-200/60 dark:border-gray-800/60 px-6 pb-6 pt-4 flex flex-col gap-3">
						<Link
							href="/sign-in"
							onClick={closeMobileMenu}
							className="block rounded-lg px-4 py-3 text-center text-base font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 no-underline transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 focus-ring"
						>
							{t("nav.sign_in")}
						</Link>
						<Link
							href="/sign-up"
							onClick={closeMobileMenu}
							className="block rounded-lg bg-gray-900 px-4 py-3 text-center text-base font-medium text-white no-underline transition-all hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 btn-shadow focus-ring"
						>
							{t("nav.get_started")}
						</Link>
					</div>
				</nav>
			)}
		</header>
	);
}
