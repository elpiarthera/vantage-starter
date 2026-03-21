import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export function LandingFooter() {
	const t = useTranslations("landing.footer");

	return (
		<footer className="relative border-t border-border bg-background overflow-hidden">
			{/* Top fade — bleeds from content above */}
			<div
				className="pointer-events-none absolute top-0 left-0 right-0 h-16 section-fade-top"
				aria-hidden="true"
			/>

			<div className="relative max-w-6xl mx-auto px-6 lg:px-12 py-8">
				{/* Single row on desktop, stacked on mobile */}
				<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
					{/* Logo text */}
					<span className="font-heading font-bold text-foreground tracking-[-0.02em]">
						VantageStarter
					</span>

					{/* Legal links */}
					<nav aria-label={t("legal_nav_aria")}>
						<ul className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground list-none m-0 p-0">
							<li>
								<Link
									href="/legal"
									className="hover:text-foreground transition-colors duration-150 ease-out-expo"
								>
									{t("legal")}
								</Link>
							</li>
							<li>
								<Link
									href="/privacy"
									className="hover:text-foreground transition-colors duration-150 ease-out-expo"
								>
									{t("privacy")}
								</Link>
							</li>
							<li>
								<a
									href="mailto:hello@vantagestarter.ai"
									className="hover:text-foreground transition-colors duration-150 ease-out-expo"
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
