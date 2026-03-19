import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { ThemeToggle } from "@/components/theme-toggle";

export function LandingFooter() {
	const t = useTranslations("landing.footer");

	return (
		<footer className="border-t border-border" role="contentinfo">
			<div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
				{/* Legal links */}
				<nav aria-label={t("legal_nav_aria")}>
					<ul className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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

				{/* Language + Theme */}
				<div className="flex items-center gap-2">
					<LanguageSwitcher />
					<ThemeToggle />
				</div>
			</div>
		</footer>
	);
}
