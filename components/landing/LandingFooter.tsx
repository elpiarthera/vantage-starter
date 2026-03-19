import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export function LandingFooter() {
	const t = useTranslations("landing.footer");

	return (
		<footer className="border-t border-border bg-background" role="contentinfo">
			<div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
				{/* Single row on desktop, stacked on mobile */}
				<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
					{/* Logo text */}
					<span className="font-heading font-bold text-foreground tracking-[-0.02em]">
						VantageStarter
					</span>

					{/* Legal links */}
					<nav aria-label={t("legal_nav_aria")}>
						<ul className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
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

					{/* Copyright */}
					<p className="text-sm text-muted-foreground">
						&copy; {new Date().getFullYear()} VantageStarter
					</p>
				</div>
			</div>
		</footer>
	);
}
