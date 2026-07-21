import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ROUTES } from "@/lib/routes";

export function LandingFooter() {
	const t = useTranslations("landing.footer");

	const linkClass =
		"relative text-sm text-gray-500 dark:text-gray-400 transition-colors hover:text-gray-900 dark:hover:text-gray-100 after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-gray-400 dark:after:bg-gray-500 after:transition-all after:duration-300 hover:after:w-full";

	const socialClass =
		"flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 transition-all hover:-translate-y-0.5 hover:border-transparent hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-gray-900 focus-ring";

	return (
		<footer className="relative border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
			<div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
				<div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
					{/* Logo + tagline + social icons */}
					<div className="lg:col-span-2">
						<span className="text-xl font-bold text-gray-900 dark:text-gray-100">
							VantageStarter
						</span>
						<p className="mt-4 max-w-xs text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
							{t("tagline")}
						</p>

						{/* Social icons */}
						<div className="mt-6 flex items-center gap-4">
							<a
								href="https://github.com/vantage-starter/vantage-starter"
								target="_blank"
								rel="noopener noreferrer"
								className={socialClass}
							>
								<span className="sr-only">{t("github_sr")}</span>
								<svg
									className="h-5 w-5"
									fill="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path
										fillRule="evenodd"
										clipRule="evenodd"
										d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"
									/>
								</svg>
							</a>
							<a
								href="https://x.com"
								target="_blank"
								rel="noopener noreferrer"
								className={socialClass}
							>
								<span className="sr-only">{t("twitter_sr")}</span>
								<svg
									className="h-5 w-5"
									fill="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
								</svg>
							</a>
							<a
								href="https://discord.com"
								target="_blank"
								rel="noopener noreferrer"
								className={socialClass}
							>
								<span className="sr-only">{t("discord")}</span>
								<svg
									className="h-5 w-5"
									fill="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
								</svg>
							</a>
						</div>
					</div>

					{/* Product links */}
					<div>
						<h4 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
							{t("col_product")}
						</h4>
						<ul className="space-y-3">
							<li>
								<a href="#features" className={linkClass}>
									{t("features")}
								</a>
							</li>
							<li>
								<a href="#pricing" className={linkClass}>
									{t("pricing")}
								</a>
							</li>
							<li>
								<a href="#faq" className={linkClass}>
									{t("faq")}
								</a>
							</li>
							<li>
								<a
									href="https://github.com/vantage-starter/vantage-starter"
									target="_blank"
									rel="noopener noreferrer"
									className={linkClass}
								>
									{t("github")}
								</a>
							</li>
						</ul>
					</div>

					{/* Legal links */}
					<div>
						<h4 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
							{t("col_legal")}
						</h4>
						<ul className="space-y-3">
							<li>
								<Link href={ROUTES.legal} className={linkClass}>
									{t("legal")}
								</Link>
							</li>
							<li>
								<Link href={ROUTES.privacy} className={linkClass}>
									{t("privacy")}
								</Link>
							</li>
							<li>
								<a href="mailto:hello@vantagestarter.ai" className={linkClass}>
									{t("contact")}
								</a>
							</li>
						</ul>
					</div>
				</div>

				{/* Copyright bar */}
				<div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-gray-200/60 dark:border-gray-800/60 pt-8 sm:flex-row">
					<p className="text-sm text-gray-500 dark:text-gray-400">
						{t("copyright_line", { year: new Date().getFullYear() })}
					</p>
					<p className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
						{t("built_with")}
						<a
							href="https://nextjs.org"
							target="_blank"
							rel="noopener noreferrer"
							className="font-medium text-gray-700 dark:text-gray-300 transition-colors hover:text-gray-900 dark:hover:text-gray-100"
						>
							{t("res_nextjs")}
						</a>
						+
						<a
							href="https://convex.dev"
							target="_blank"
							rel="noopener noreferrer"
							className="font-medium text-gray-700 dark:text-gray-300 transition-colors hover:text-gray-900 dark:hover:text-gray-100"
						>
							{t("res_convex")}
						</a>
					</p>
				</div>
			</div>
		</footer>
	);
}
