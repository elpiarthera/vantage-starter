"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

export function HeroSection() {
	const t = useTranslations("landing.hero");

	return (
		<section
			aria-label={t("aria_label")}
			className="relative min-h-[100vh] flex items-center justify-center overflow-hidden"
			style={{ backgroundColor: "oklch(0.13 0.01 240)" }}
		>
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
						<span
							className="inline-grid"
							aria-label={t("headline_animated_aria")}
							aria-live="polite"
						>
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
					className="text-lg leading-relaxed mb-10 hero-enter-delay-1"
					style={{
						color: "oklch(0.65 0.01 240)",
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
							className="h-12 px-8 rounded-full border-0 hover:opacity-90 transition-opacity duration-150"
							style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
						>
							{t("cta_primary")}
						</Button>
					</Link>
					<a href="#features">
						<Button
							variant="ghost"
							size="lg"
							className="h-12 px-8 rounded-full bg-transparent hover:bg-transparent hover:opacity-80 transition-opacity duration-150"
							style={{
								border: "1px solid oklch(0.25 0.01 240)",
								color: "oklch(0.93 0.01 240)",
							}}
						>
							{t("cta_secondary")}
						</Button>
					</a>
				</div>

				{/* Social proof line */}
				<p
					className="mt-8 text-xs tracking-[0.01em] hero-enter-delay-3"
					style={{ color: "oklch(0.93 0.01 240 / 0.35)" }}
				>
					{t("social_proof_micro")}
				</p>
			</div>

			{/* Bottom fade — blends into next section */}
			<div
				className="pointer-events-none absolute bottom-0 left-0 right-0 h-[200px]"
				aria-hidden="true"
				style={{
					background: "linear-gradient(to bottom, transparent, var(--background))",
				}}
			/>
		</section>
	);
}
