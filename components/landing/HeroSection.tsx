"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

export function HeroSection() {
	const t = useTranslations("landing.hero");

	return (
		<section
			aria-label={t("aria_label")}
			className={[
				// Impeccable spec: typographic-only, diagonal gradient sweep, OKLCH lightness sweep
				// Light: 0.98 → 0.93 with warm amber tint
				// Dark: 0.08 → 0.14 with warm undertone
				"relative overflow-hidden py-20 md:py-32",
				"bg-gradient-to-br",
				"from-[oklch(0.98_0.015_44)] via-[oklch(0.96_0.025_44)] to-[oklch(0.92_0.04_44)]",
				"dark:from-[oklch(0.08_0.025_44)] dark:via-[oklch(0.11_0.03_44)] dark:to-[oklch(0.15_0.04_44)]",
			].join(" ")}
		>
			{/* Subtle radial warmth at top-right — no blobs, pure lightness sweep */}
			<div
				className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-20"
				aria-hidden="true"
				style={{
					background:
						"radial-gradient(ellipse 60% 50% at 70% 0%, oklch(0.88 0.08 44 / 0.3) 0%, transparent 70%)",
				}}
			/>

			<div className="relative max-w-5xl mx-auto px-6 text-center">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.35, ease: "easeOut" }}
				>
					{/* Badge */}
					<span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3.5 py-1 text-xs font-medium text-primary mb-8 tracking-[0.01em]">
						{t("badge")}
					</span>

					{/* Headline — the declaration */}
					<h1
						className={[
							"font-semibold text-foreground",
							"text-5xl sm:text-6xl md:text-7xl",
							"tracking-[-0.03em] leading-[1.04]",
							"mb-6",
						].join(" ")}
					>
						{t("headline")}
					</h1>

					{/* Subline */}
					<p className="mx-auto max-w-xl text-lg md:text-xl text-muted-foreground mb-3 leading-relaxed tracking-[-0.01em]">
						{t("subline")}
					</p>

					{/* Supporting detail */}
					<p className="mx-auto max-w-lg text-sm text-muted-foreground/70 mb-10 leading-relaxed">
						{t("subline_detail")}
					</p>

					{/* CTAs */}
					<motion.div
						className="flex flex-col sm:flex-row items-center justify-center gap-3"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, ease: "easeOut", delay: 0.12 }}
					>
						<Link href="/sign-up">
							<Button
								size="lg"
								className="min-w-[180px] gap-2 shadow-[0_2px_16px_oklch(0.62_0.16_44/0.25)] hover:shadow-[0_4px_20px_oklch(0.62_0.16_44/0.35)] transition-shadow duration-200"
							>
								{t("cta_primary")}
								<ArrowRight className="size-4" aria-hidden="true" />
							</Button>
						</Link>
						<a href="#features">
							<Button variant="ghost" size="lg" className="min-w-[160px] gap-2 text-muted-foreground hover:text-foreground">
								<Play className="size-4" aria-hidden="true" />
								{t("cta_secondary")}
							</Button>
						</a>
					</motion.div>

					{/* Social proof micro-line */}
					<motion.p
						className="mt-8 text-xs text-muted-foreground/60 tracking-[0.01em]"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.3, delay: 0.25 }}
					>
						{t("social_proof_micro")}
					</motion.p>
				</motion.div>
			</div>
		</section>
	);
}
