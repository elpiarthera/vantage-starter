"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/routing";

// Compact tech logos for inline hero display — 24px, grayscale
const HERO_TECH = [
	{
		name: "Next.js",
		icon: (
			<svg
				aria-hidden="true"
				viewBox="0 0 180 180"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
			>
				<mask
					id="hero-mask-nextjs"
					style={{ maskType: "alpha" as const }}
					maskUnits="userSpaceOnUse"
					x="0"
					y="0"
					width="180"
					height="180"
				>
					<circle cx="90" cy="90" r="90" fill="black" />
				</mask>
				<g mask="url(#hero-mask-nextjs)">
					<circle cx="90" cy="90" r="90" fill="currentColor" />
					<path
						d="M149.508 157.52L69.142 54H54V125.97H66.1V69.3L139.999 164.845C143.333 162.614 146.509 160.165 149.508 157.52Z"
						fill="white"
					/>
					<rect x="115" y="54" width="12" height="72" fill="white" />
				</g>
			</svg>
		),
	},
	{
		name: "Convex",
		icon: (
			<svg
				aria-hidden="true"
				viewBox="0 0 256 256"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
			>
				<rect width="256" height="256" rx="60" fill="currentColor" />
				<path
					d="M210.358 60.0001L128 210L45.6421 60.0001H210.358Z"
					fill="white"
				/>
			</svg>
		),
	},
	{
		name: "Clerk",
		icon: (
			<svg
				aria-hidden="true"
				viewBox="0 0 40 40"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
			>
				<rect width="40" height="40" rx="8" fill="currentColor" />
				<path
					d="M27.456 25.388a1.385 1.385 0 0 1-.974-.399l-2.378-2.326a3.705 3.705 0 0 1-4.208 0l-2.378 2.326a1.385 1.385 0 1 1-1.948-1.972l2.374-2.323a3.705 3.705 0 0 1 0-4.388l-2.374-2.323a1.385 1.385 0 0 1 1.948-1.972l2.378 2.326a3.705 3.705 0 0 1 4.208 0l2.378-2.326a1.385 1.385 0 1 1 1.948 1.972l-2.374 2.323a3.705 3.705 0 0 1 0 4.388l2.374 2.323a1.385 1.385 0 0 1-.974 2.371z"
					fill="white"
				/>
			</svg>
		),
	},
	{
		name: "Polar",
		icon: (
			<svg
				aria-hidden="true"
				viewBox="0 0 100 100"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
			>
				<rect width="100" height="100" rx="20" fill="currentColor" />
				<circle cx="50" cy="50" r="28" stroke="white" strokeWidth="6" />
				<circle cx="50" cy="50" r="14" fill="white" />
			</svg>
		),
	},
	{
		name: "AI SDK",
		icon: (
			<svg
				aria-hidden="true"
				viewBox="0 0 116 100"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
			>
				<path d="M57.5 0L115 100H0L57.5 0Z" fill="currentColor" />
			</svg>
		),
	},
];

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
			className="w-full max-w-lg mx-auto rounded-lg border border-border overflow-hidden hero-enter-delay-3"
			style={{ background: "oklch(0.12 0.02 232)" }}
			aria-label="Terminal showing installation command"
		>
			{/* macOS window chrome */}
			<div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
				<span
					className="w-3 h-3 rounded-full"
					style={{ background: "oklch(0.62 0.22 25)" }}
					aria-hidden="true"
				/>
				<span
					className="w-3 h-3 rounded-full"
					style={{ background: "oklch(0.75 0.18 65)" }}
					aria-hidden="true"
				/>
				<span
					className="w-3 h-3 rounded-full"
					style={{ background: "oklch(0.60 0.18 145)" }}
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
						className="text-sm font-mono shrink-0"
						style={{ color: "oklch(0.68 0.22 232)" }}
						aria-hidden="true"
					>
						$
					</span>
					<code
						className="text-sm font-mono text-foreground/90 truncate"
						style={{ fontFamily: "var(--font-mono, 'Geist Mono', monospace)" }}
					>
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
			className="relative min-h-[100vh] flex items-center justify-center overflow-hidden bg-background"
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

			{/* Colored blob — behind headline, neutral-blue tinted */}
			<div
				className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[480px] w-[640px] rounded-full blur-3xl opacity-20"
				style={{ background: "var(--primary)" }}
				aria-hidden="true"
			/>

			{/* Content */}
			<div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-12 py-24 w-full flex flex-col items-center text-center">
				{/* Badge pill — above H1 */}
				<div
					className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium mb-6 hero-enter"
					style={{
						background: "color-mix(in oklch, var(--primary) 10%, transparent)",
						borderColor: "color-mix(in oklch, var(--primary) 20%, transparent)",
						color: "var(--primary)",
					}}
				>
					<span
						className="w-1.5 h-1.5 rounded-full"
						style={{ background: "var(--primary)" }}
						aria-hidden="true"
					/>
					AI-Native SaaS Boilerplate
				</div>

				{/* H1 — two lines: "Born agentic." then "Not [animated word]." */}
				<h1
					className="font-heading font-bold text-foreground text-balance mb-8 hero-enter"
					style={{
						fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
						lineHeight: 1.05,
						letterSpacing: "-0.03em",
						maxWidth: "22ch",
					}}
				>
					{t("headline_line1")}
					<br />
					<span className="whitespace-nowrap">
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
				<p
					className="text-lg leading-relaxed text-muted-foreground mb-10 hero-enter-delay-1"
					style={{
						maxWidth: "52ch",
						letterSpacing: "-0.01em",
					}}
				>
					{t("subline")}
				</p>

				{/* CTAs */}
				<div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 hero-enter-delay-2">
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

				{/* Tech logos inline — grayscale social proof */}
				<ul
					className="flex items-center justify-center gap-1 flex-wrap mb-10 hero-enter-delay-3 list-none p-0 m-0"
					aria-label="Built with"
				>
					{HERO_TECH.map(({ name, icon }, i) => (
						<li key={name} className="flex items-center">
							<span
								className="w-5 h-5 opacity-30 grayscale hover:opacity-70 hover:grayscale-0 transition-all duration-200"
								title={name}
							>
								{icon}
							</span>
							{i < HERO_TECH.length - 1 && (
								<span
									className="mx-2 h-3 w-px bg-muted-foreground/20"
									aria-hidden="true"
								/>
							)}
						</li>
					))}
				</ul>

				{/* Terminal mockup */}
				<TerminalMockup />
			</div>

			{/* Bottom fade — blends into FeaturesSection */}
			<div
				className="pointer-events-none absolute bottom-0 left-0 right-0 h-[180px] bottom-fade"
				aria-hidden="true"
			/>
		</section>
	);
}
