"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export function LandingNav() {
	const t = useTranslations("landing");

	return (
		<header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-sm">
			<div className="max-w-5xl mx-auto px-6 flex h-16 items-center justify-between">
				{/* Logo */}
				<Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
					<span className="text-primary">VS</span>
					<span>VantageStarter</span>
				</Link>

				{/* Nav links — hidden on mobile */}
				<nav
					aria-label={t("nav.aria_label")}
					className="hidden md:flex items-center gap-6 text-sm text-muted-foreground"
				>
					<a href="#features" className="hover:text-foreground transition-colors duration-150 ease-out">
						{t("nav.features")}
					</a>
					<a href="#pricing" className="hover:text-foreground transition-colors duration-150 ease-out">
						{t("nav.pricing")}
					</a>
				</nav>

				{/* Actions */}
				<div className="flex items-center gap-3">
					<LanguageSwitcher />
					<ThemeToggle />
					<Link href="/sign-in">
						<Button variant="ghost" size="sm" className="hidden sm:inline-flex">
							{t("nav.sign_in")}
						</Button>
					</Link>
					<Link href="/sign-up">
						<Button size="sm">
							{t("nav.get_started")}
						</Button>
					</Link>
				</div>
			</div>
		</header>
	);
}
