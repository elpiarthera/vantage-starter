"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/routing";

function TerminalMockup() {
	const t = useTranslations("landing.hero");
	const [copied, setCopied] = useState(false);
	const command = "npx create-vantage-app my-saas";

	const handleCopy = async () => {
		await navigator.clipboard.writeText(command);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="code-block overflow-hidden rounded-xl terminal-glow">
			<div className="flex items-center gap-2 border-b border-gray-800 px-4 py-3">
				<div className="flex gap-1.5">
					<div className="h-3 w-3 rounded-full bg-gray-700 transition-all hover:bg-red-400 hover:scale-110" />
					<div className="h-3 w-3 rounded-full bg-gray-700 transition-all hover:bg-yellow-400 hover:scale-110" />
					<div className="h-3 w-3 rounded-full bg-gray-700 transition-all hover:bg-green-400 hover:scale-110" />
				</div>
				<span className="ml-2 text-xs text-gray-500 font-medium">Terminal</span>
			</div>
			<div className="p-5">
				<code className="font-mono text-sm flex items-center gap-3">
					<span className="text-gray-500 select-none" aria-hidden="true">
						$
					</span>
					<span className="text-white">
						<span className="font-semibold">npx</span> create-vantage-app
						my-saas
					</span>
					<button
						type="button"
						onClick={handleCopy}
						aria-label={copied ? t("copied") : t("copy_command")}
						className="ml-auto rounded-md p-1.5 text-gray-500 transition-all hover:bg-gray-800 hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
					>
						{copied ? (
							<svg
								className="h-4 w-4 text-green-400"
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
						) : (
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
						)}
					</button>
				</code>
				{copied && (
					<span className="mt-1 block text-xs text-green-400 text-right animate-fade-in-up">
						{t("copied")}
					</span>
				)}
			</div>
		</div>
	);
}

export function HeroSection() {
	const t = useTranslations("landing.hero");

	return (
		<section
			aria-label={t("aria_label")}
			className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-32"
		>
			{/* Background decorations */}
			<div
				className="pointer-events-none absolute inset-0 grid-pattern"
				aria-hidden="true"
			/>
			<div
				className="pointer-events-none absolute inset-0 hero-gradient"
				aria-hidden="true"
			/>

			{/* Decorative circles with subtle pulsing */}
			<div
				className="pointer-events-none absolute -left-32 top-20 h-64 w-64 rounded-full bg-gray-100 dark:bg-gray-800 opacity-60 blur-3xl animate-[pulse_8s_ease-in-out_infinite]"
				aria-hidden="true"
			/>
			<div
				className="pointer-events-none absolute -right-32 top-40 h-80 w-80 rounded-full bg-gray-100 dark:bg-gray-800 opacity-50 blur-3xl animate-[pulse_10s_ease-in-out_infinite_2s]"
				aria-hidden="true"
			/>

			<div className="relative mx-auto max-w-6xl px-6">
				<div className="text-center">
					{/* Badge */}
					<div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-gray-200/80 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/80 px-4 py-2 shadow-[0_1px_2px_oklch(0_0_0/0.04),inset_0_1px_0_oklch(1_0_0/0.8)] backdrop-blur-sm animate-fade-in-up opacity-0 stagger-1">
						<span className="relative flex h-2 w-2" aria-hidden="true">
							<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gray-400 dark:bg-gray-500 opacity-75" />
							<span className="relative inline-flex h-2 w-2 rounded-full bg-gray-900 dark:bg-gray-100" />
						</span>
						<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
							{t("badge")}
						</span>
					</div>

					{/* Main headline — preserved word cycling animation */}
					<h1 className="mb-6 text-4xl font-extrabold tracking-[-0.03em] text-gray-900 dark:text-gray-100 sm:text-5xl md:text-6xl lg:text-7xl animate-fade-in-up opacity-0 stagger-2">
						{t("headline_line1")}
						<br />
						<span className="whitespace-nowrap text-gradient">
							{t("headline_not")}{" "}
							{/* Animated words — stacked, only one visible at a time */}
							<span className="sr-only">{t("headline_animated_aria")}</span>
							<span className="inline-grid" aria-hidden="true">
								<span
									className="hero-animated-word hero-word-1"
									style={{ gridArea: "1 / 1" }}
									aria-hidden="true"
								>
									{t("headline_word1")}
								</span>
								<span
									className="hero-animated-word hero-word-2"
									style={{ gridArea: "1 / 1" }}
									aria-hidden="true"
								>
									{t("headline_word2")}
								</span>
								<span
									className="hero-animated-word hero-word-3"
									style={{ gridArea: "1 / 1" }}
									aria-hidden="true"
								>
									{t("headline_word3")}
								</span>
							</span>
							{t("headline_period")}
						</span>
					</h1>

					{/* Subheadline */}
					<p className="mx-auto mb-12 max-w-2xl text-lg text-gray-500 dark:text-gray-400 md:text-xl leading-relaxed animate-fade-in-up opacity-0 stagger-3">
						{t("subline")}
					</p>

					{/* CTA buttons */}
					<div className="flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-in-up opacity-0 stagger-4">
						<Link
							href="/sign-up"
							className="group flex items-center gap-2 rounded-xl bg-gray-900 dark:bg-gray-100 px-7 py-3.5 text-base font-bold text-white dark:text-gray-900 transition-all hover:bg-gray-800 dark:hover:bg-gray-200 hover:shadow-lg active:scale-[0.98] btn-shadow focus-ring"
						>
							{t("cta_primary")}
							<svg
								className="h-4 w-4 transition-transform group-hover:translate-x-1"
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
						</Link>
						<a
							href="https://github.com/vantage-starter"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-7 py-3.5 text-base font-semibold text-gray-900 dark:text-gray-100 transition-all hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-md active:scale-[0.98] shadow-sm focus-ring"
						>
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
							{t("cta_secondary")}
						</a>
					</div>
				</div>

				{/* Quick install command */}
				<div className="mx-auto mt-16 max-w-md animate-fade-in-up opacity-0 stagger-5">
					<TerminalMockup />
				</div>
			</div>

			{/* Bottom fade */}
			<div
				className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bottom-fade"
				aria-hidden="true"
			/>
		</section>
	);
}
