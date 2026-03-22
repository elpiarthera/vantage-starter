import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export function LandingFooter() {
	const t = useTranslations("landing.footer");

	return (
		<footer className="relative border-t border-border bg-muted/30">
			<div className="max-w-6xl mx-auto px-6 lg:px-12 py-16 md:py-20">
				<div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
					{/* Logo + tagline + social icons */}
					<div className="lg:col-span-2">
						<span className="font-heading font-bold text-foreground tracking-[-0.02em] text-xl">
							VantageStarter
						</span>
						<p className="mt-4 max-w-xs text-sm text-muted-foreground leading-relaxed">
							{t("tagline")}
						</p>

						{/* Social icons */}
						<div className="mt-6 flex items-center gap-3">
							<a
								href="https://github.com/vantage-starter/vantage-starter"
								target="_blank"
								rel="noopener noreferrer"
								className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-transparent hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								<span className="sr-only">GitHub</span>
								<svg
									className="h-5 w-5"
									fill="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path
										fillRule="evenodd"
										clipRule="evenodd"
										d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"
									/>
								</svg>
							</a>
							<a
								href="https://x.com"
								target="_blank"
								rel="noopener noreferrer"
								className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-transparent hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								<span className="sr-only">X (Twitter)</span>
								<svg
									className="h-4 w-4"
									fill="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
								</svg>
							</a>
						</div>
					</div>

					{/* Product links */}
					<div>
						<h4 className="mb-4 text-sm font-semibold text-foreground">
							{t("col_product")}
						</h4>
						<ul className="space-y-3">
							<li>
								<a
									href="#features"
									className="footer-link text-sm text-muted-foreground transition-colors hover:text-foreground"
								>
									{t("features")}
								</a>
							</li>
							<li>
								<a
									href="#pricing"
									className="footer-link text-sm text-muted-foreground transition-colors hover:text-foreground"
								>
									{t("pricing")}
								</a>
							</li>
							<li>
								<a
									href="https://github.com/vantage-starter/vantage-starter"
									target="_blank"
									rel="noopener noreferrer"
									className="footer-link text-sm text-muted-foreground transition-colors hover:text-foreground"
								>
									{t("github")}
								</a>
							</li>
						</ul>
					</div>

					{/* Legal links */}
					<div>
						<h4 className="mb-4 text-sm font-semibold text-foreground">
							{t("col_legal")}
						</h4>
						<ul className="space-y-3">
							<li>
								<Link
									href="/legal"
									className="footer-link text-sm text-muted-foreground transition-colors hover:text-foreground"
								>
									{t("legal")}
								</Link>
							</li>
							<li>
								<Link
									href="/privacy"
									className="footer-link text-sm text-muted-foreground transition-colors hover:text-foreground"
								>
									{t("privacy")}
								</Link>
							</li>
							<li>
								<a
									href="mailto:hello@vantagestarter.ai"
									className="footer-link text-sm text-muted-foreground transition-colors hover:text-foreground"
								>
									{t("contact")}
								</a>
							</li>
						</ul>
					</div>
				</div>

				{/* Copyright bar */}
				<div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-8 sm:flex-row">
					<p className="text-sm text-muted-foreground">
						&copy; {new Date().getFullYear()} VantageStarter
					</p>
					<p className="text-sm text-muted-foreground">{t("legal_nav_aria")}</p>
				</div>
			</div>
		</footer>
	);
}
