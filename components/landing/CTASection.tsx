"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/routing";
import { ROUTES } from "@/lib/routes";

export function CTASection() {
	const t = useTranslations("landing.cta");
	const [copied, setCopied] = useState(false);
	const command = "npx create-vantage-app my-saas";

	const sectionRef = useRef<HTMLDivElement>(null);
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const el = sectionRef.current;
		if (!el) return;

		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			setIsVisible(true);
			return;
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setIsVisible(true);
					observer.disconnect();
				}
			},
			{ threshold: 0.2 },
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	async function handleCopy() {
		await navigator.clipboard.writeText(command);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}

	return (
		<section
			id="get-started"
			aria-labelledby="cta-heading"
			className="relative py-24 md:py-32 overflow-hidden"
		>
			{/* Background decorations */}
			<div
				className="pointer-events-none absolute inset-0 grid-pattern opacity-50"
				aria-hidden="true"
			/>
			<div
				className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white via-transparent to-white dark:from-gray-950 dark:to-gray-950"
				aria-hidden="true"
			/>

			{/* Decorative circles with floating animation */}
			<div
				className="pointer-events-none absolute -left-48 top-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-gray-100 dark:bg-gray-800 opacity-40 blur-3xl animate-[float_20s_ease-in-out_infinite]"
				aria-hidden="true"
			/>
			<div
				className="pointer-events-none absolute -right-48 top-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-gray-100 dark:bg-gray-800 opacity-40 blur-3xl animate-[float_25s_ease-in-out_infinite_5s]"
				aria-hidden="true"
			/>

			<div ref={sectionRef} className="relative mx-auto max-w-6xl px-6">
				<div className="text-center">
					<p
						className={`mb-4 text-sm font-semibold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400 reveal ${isVisible ? "revealed" : ""}`}
					>
						{t("eyebrow")}
					</p>

					<h2
						id="cta-heading"
						className={`mb-6 text-3xl font-bold tracking-[-0.02em] text-gray-900 dark:text-gray-100 md:text-4xl lg:text-5xl reveal ${isVisible ? "revealed" : ""}`}
						style={{ transitionDelay: "0.05s" }}
					>
						{t("heading")}
					</h2>

					<p
						className={`mx-auto mb-12 max-w-xl text-lg text-gray-500 dark:text-gray-400 leading-relaxed reveal ${isVisible ? "revealed" : ""}`}
						style={{ transitionDelay: "0.1s" }}
					>
						{t("subline")}
					</p>

					<div
						className={`flex flex-col items-center justify-center gap-4 sm:flex-row reveal ${isVisible ? "revealed" : ""}`}
						style={{ transitionDelay: "0.15s" }}
					>
						<Link
							href={ROUTES.signUp}
							className="group rounded-xl bg-gray-900 dark:bg-gray-100 px-8 py-4 text-lg font-bold text-white dark:text-gray-900 transition-all hover:bg-gray-800 dark:hover:bg-gray-200 hover:shadow-lg active:scale-[0.98] btn-shadow focus-ring"
						>
							<span className="flex items-center gap-2">
								{t("cta_primary")}
								<svg
									className="h-5 w-5 transition-transform group-hover:translate-x-1"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M13 7l5 5m0 0l-5 5m5-5H6"
									/>
								</svg>
							</span>
						</Link>

						<a
							href="https://github.com/vantage-starter"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-8 py-4 text-lg font-semibold text-gray-900 dark:text-gray-100 shadow-sm transition-all hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-md active:scale-[0.98] focus-ring"
						>
							<svg
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="currentColor"
								aria-hidden="true"
							>
								<path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
							</svg>
							{t("cta_secondary")}
						</a>
					</div>

					{/* Quick command */}
					<div
						className={`mt-14 reveal ${isVisible ? "revealed" : ""}`}
						style={{ transitionDelay: "0.2s" }}
					>
						<p className="mb-4 text-sm font-medium text-gray-500 dark:text-gray-400">
							{t("quick_label")}
						</p>
						<div className="inline-flex items-center gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-3 shadow-sm transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700">
							{/* CLI command literal — shell syntax, not sentence content, never translated */}
							<code className="font-mono text-sm">
								<span
									className="text-gray-400 dark:text-gray-500"
									aria-hidden="true"
								>
									$
								</span>{" "}
								<span className="font-semibold text-gray-900 dark:text-gray-100">
									npx
								</span>{" "}
								<span className="text-gray-700 dark:text-gray-300">
									create-vantage-app my-saas
								</span>
							</code>
							<button
								type="button"
								onClick={handleCopy}
								aria-label={copied ? t("copied") : t("copy_command")}
								className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 transition-all hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
							>
								{copied ? (
									<>
										<svg
											className="h-4 w-4"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											aria-hidden="true"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M5 13l4 4L19 7"
											/>
										</svg>
										{t("copied")}
									</>
								) : (
									<>
										<svg
											className="h-4 w-4"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											aria-hidden="true"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
											/>
										</svg>
										{t("copy")}
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
