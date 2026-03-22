"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/routing";

function TerminalMockup() {
	const [copied, setCopied] = useState(false);
	const command = "npx create-vantage-app my-saas";

	function handleCopy() {
		navigator.clipboard.writeText(command).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 1800);
		});
	}

	return (
		<figure
			className="rounded-xl overflow-hidden code-block terminal-glow"
			aria-label="Terminal showing installation command"
		>
			{/* macOS window chrome */}
			<div className="flex items-center gap-2 px-4 py-3 border-b border-border/30">
				<div
					className="h-3 w-3 rounded-full bg-muted-foreground/30 transition-all hover:bg-[oklch(0.65_0.22_25)] hover:scale-110"
					aria-hidden="true"
				/>
				<div
					className="h-3 w-3 rounded-full bg-muted-foreground/30 transition-all hover:bg-[oklch(0.75_0.18_65)] hover:scale-110"
					aria-hidden="true"
				/>
				<div
					className="h-3 w-3 rounded-full bg-muted-foreground/30 transition-all hover:bg-[oklch(0.60_0.18_145)] hover:scale-110"
					aria-hidden="true"
				/>
				<span className="flex-1 text-center text-xs text-muted-foreground/40 font-mono select-none">
					terminal
				</span>
			</div>

			{/* Command line */}
			<div className="flex items-center justify-between px-4 py-4 gap-4">
				<div className="flex items-center gap-3 min-w-0">
					{/* Prompt symbol */}
					<span
						className="text-sm font-mono shrink-0 text-muted-foreground"
						aria-hidden="true"
					>
						$
					</span>
					<code className="text-sm font-mono text-foreground/90 truncate">
						{command}
					</code>
				</div>

				{/* Copy button */}
				<button
					type="button"
					onClick={handleCopy}
					aria-label={copied ? "Copied!" : "Copy command"}
					className="shrink-0 p-1.5 rounded transition-colors duration-150 text-muted-foreground/50 hover:text-foreground hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
				>
					{copied ? (
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<path d="M20 6 9 17l-5-5" />
						</svg>
					) : (
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
							<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
						</svg>
					)}
				</button>
			</div>
		</figure>
	);
}

export function HeroSection() {
	const t = useTranslations("landing.hero");

	return (
		<section
			aria-label={t("aria_label")}
			className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-32 bg-background"
		>
			{/* Grid pattern background */}
			<div
				className="pointer-events-none absolute inset-0 grid-pattern"
				aria-hidden="true"
			/>

			{/* Radial gradient overlay — top-center brighten */}
			<div
				className="pointer-events-none absolute inset-0 hero-gradient"
				aria-hidden="true"
			/>

			{/* Decorative blobs — left and right */}
			<div
				className="pointer-events-none absolute -left-32 top-20 h-64 w-64 rounded-full bg-muted opacity-60 blur-3xl animate-[pulse_8s_ease-in-out_infinite]"
				aria-hidden="true"
			/>
			<div
				className="pointer-events-none absolute -right-32 top-40 h-80 w-80 rounded-full bg-muted opacity-50 blur-3xl animate-[pulse_10s_ease-in-out_infinite_2s]"
				aria-hidden="true"
			/>

			{/* Content */}
			<div className="relative z-10 max-w-6xl mx-auto px-6 w-full flex flex-col items-center text-center">
				{/* Badge pill — above H1 */}
				<div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-border/80 bg-card/80 px-4 py-2 shadow-[0_1px_2px_oklch(0_0_0/0.04),inset_0_1px_0_oklch(1_0_0/0.8)] backdrop-blur-sm hero-enter">
					<span className="relative flex h-2 w-2" aria-hidden="true">
						<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-muted-foreground/40 opacity-75" />
						<span className="relative inline-flex h-2 w-2 rounded-full bg-foreground" />
					</span>
					<span className="text-sm font-medium text-muted-foreground">
						AI-Native SaaS Boilerplate
					</span>
				</div>

				{/* H1 — two lines: "Born agentic." then "Not [animated word]." */}
				<h1 className="mb-6 text-4xl font-extrabold tracking-[-0.03em] text-foreground sm:text-5xl md:text-6xl lg:text-7xl hero-enter">
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

				{/* Subline */}
				<p className="mx-auto mb-12 max-w-2xl text-lg text-muted-foreground md:text-xl leading-relaxed hero-enter-delay-1">
					{t("subline")}
				</p>

				{/* CTAs */}
				<div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-0 hero-enter-delay-2">
					<Link href="/sign-up">
						<ui-button variant="primary" size="lg">
							{t("cta_primary")}
							<span slot="icon-end">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									aria-hidden="true"
								>
									<path d="M5 12h14" />
									<path d="m12 5 7 7-7 7" />
								</svg>
							</span>
						</ui-button>
					</Link>
					<a
						href="https://github.com/vantage-starter"
						target="_blank"
						rel="noopener noreferrer"
					>
						<ui-button variant="outline" size="lg">
							<span slot="icon-start">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="currentColor"
									aria-hidden="true"
								>
									<path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
								</svg>
							</span>
							{t("cta_secondary")}
						</ui-button>
					</a>
				</div>

				{/* Terminal mockup */}
				<div className="mx-auto mt-16 max-w-md w-full hero-enter-delay-3">
					<TerminalMockup />
				</div>
			</div>

			{/* Bottom fade — blends into FeaturesSection */}
			<div
				className="pointer-events-none absolute bottom-0 left-0 right-0 h-[180px] bottom-fade"
				aria-hidden="true"
			/>
		</section>
	);
}
