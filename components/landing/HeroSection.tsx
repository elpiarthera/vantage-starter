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
				// Light: near-white diagonal from top-left, lightness 0.98 → 0.93, warm amber tint
				// Dark: deep near-black diagonal, lightness 0.08 → 0.14, warm undertone
				"relative overflow-hidden py-20 md:py-32",
				"bg-gradient-to-br",
				"from-[oklch(0.98_0.01_44)] to-[oklch(0.93_0.03_44)]",
				"dark:from-[oklch(0.08_0.02_44)] dark:to-[oklch(0.14_0.03_44)]",
			].join(" ")}
		>
			<div className="max-w-5xl mx-auto px-6 text-center">
				<motion.div
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3, ease: "easeOut" }}
				>
					{/* Badge */}
					<span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-8">
						{t("badge")}
					</span>

					{/* Headline */}
					<h1
						className={[
							"font-semibold text-foreground",
							"text-4xl sm:text-5xl md:text-6xl lg:text-7xl",
							"tracking-[-0.03em] leading-[1.05]",
							"mb-6",
						].join(" ")}
					>
						{t("headline")}
					</h1>

					{/* Subline */}
					<p className="mx-auto max-w-2xl text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
						{t("subline")}
					</p>

					{/* CTAs */}
					<motion.div
						className="flex flex-col sm:flex-row items-center justify-center gap-3"
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
					>
						<Link href="/sign-up">
							<Button size="lg" className="min-w-[160px] gap-2">
								{t("cta_primary")}
								<ArrowRight className="size-4" aria-hidden="true" />
							</Button>
						</Link>
						<a href="#features">
							<Button variant="ghost" size="lg" className="min-w-[160px] gap-2">
								<Play className="size-4" aria-hidden="true" />
								{t("cta_secondary")}
							</Button>
						</a>
					</motion.div>
				</motion.div>
			</div>
		</section>
	);
}
