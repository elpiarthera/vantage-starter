"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

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
				<div className="flex flex-col sm:flex-row items-center justify-center gap-4 hero-enter-delay-2">
					<Link href="/sign-up">
						<Button
							size="lg"
							className="h-12 px-8 rounded-full border-0 bg-primary text-primary-foreground hover:opacity-90 btn-shadow active-scale transition-all duration-150 ease-out-expo"
						>
							{t("cta_primary")}
						</Button>
					</Link>
					<a href="#features">
						<Button
							variant="ghost"
							size="lg"
							className="h-12 px-8 rounded-full bg-transparent border border-border text-foreground hover:bg-transparent hover:border-border-hover hover:opacity-80 active-scale transition-all duration-150 ease-out-expo"
						>
							{t("cta_secondary")}
						</Button>
					</a>
				</div>

				{/* Social proof line */}
				<p className="mt-8 text-xs tracking-[0.01em] text-muted-foreground/50 hero-enter-delay-3">
					{t("social_proof_micro")}
				</p>
			</div>

			{/* Bottom fade — blends into FeaturesSection */}
			<div
				className="pointer-events-none absolute bottom-0 left-0 right-0 h-[180px] bottom-fade"
				aria-hidden="true"
			/>
		</section>
	);
}
