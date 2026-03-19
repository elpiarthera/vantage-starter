import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { ThemeToggle } from "@/components/theme-toggle";

export function LandingFooter() {
	const t = useTranslations("landing.footer");

	return (
		<footer className="border-t border-border/50" role="contentinfo">
			<div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
				{/* Branding + legal nav */}
				<div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
					{/* Logo mark */}
					<span className="text-xs font-semibold text-muted-foreground tracking-[-0.01em]">
						<span className="text-primary">VS</span> VantageStarter
					</span>

					{/* Legal links */}
					<nav aria-label={t("legal_nav_aria")}>
						<ul className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground/70">
							<li>
								<Link
									href="/legal"
									className="hover:text-foreground transition-colors duration-150 ease-out"
								>
									{t("legal")}
								</Link>
							</li>
							<li>
								<Link
									href="/privacy"
									className="hover:text-foreground transition-colors duration-150 ease-out"
								>
									{t("privacy")}
								</Link>
							</li>
							<li>
								<a
									href="mailto:[YOUR_SUPPORT_EMAIL]"
									className="hover:text-foreground transition-colors duration-150 ease-out"
								>
									{t("contact")}
								</a>
							</li>
						</ul>
					</nav>
				</div>

				{/* Language + Theme */}
				<div className="flex items-center gap-2">
					<LanguageSwitcher />
					<ThemeToggle />
				</div>
			</div>
		</footer>
	);
}
