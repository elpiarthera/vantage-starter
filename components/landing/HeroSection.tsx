"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ShaderBackground } from "@/components/landing/ShaderBackground";

export function HeroSection() {
	const t = useTranslations("landing.hero");

	return (
		<section
			aria-label={t("aria_label")}
			className="relative overflow-hidden py-20 md:py-32"
		>
			{/* Layer 0 — Radiant WebGL shader (z-0, fills section) */}
			<ShaderBackground opacity={0.85} />

			{/* Layer 1 — Dark gradient overlay for text readability (z-10) */}
			<div
				className="pointer-events-none absolute inset-0 z-10"
				aria-hidden="true"
				style={{
					background: [
						// Deep vignette from top + bottom edges
						"linear-gradient(to bottom, oklch(0.06 0.02 44 / 0.55) 0%, transparent 35%, transparent 60%, oklch(0.05 0.015 44 / 0.7) 100%)",
					].join(", "),
				}}
			/>

			{/* Layer 2 — Subtle centre radial to lift text legibility */}
			<div
				className="pointer-events-none absolute inset-0 z-10"
				aria-hidden="true"
				style={{
					background:
						"radial-gradient(ellipse 70% 60% at 50% 50%, oklch(0.06 0.02 44 / 0.45) 0%, transparent 70%)",
				}}
			/>

			<div className="relative z-20 max-w-5xl mx-auto px-6 text-center">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.35, ease: "easeOut" }}
				>
					{/* Badge — amber border/tint over dark shader */}
					<span className="inline-flex items-center gap-1.5 rounded-full border border-[oklch(0.78_0.14_44/0.5)] bg-[oklch(0.78_0.14_44/0.12)] px-3.5 py-1 text-xs font-medium text-[oklch(0.88_0.12_44)] mb-8 tracking-[0.01em]">
						{t("badge")}
					</span>

					{/* Headline — white on dark shader */}
					<h1
						className={[
							"font-semibold text-white",
							"text-5xl sm:text-6xl md:text-7xl",
							"tracking-[-0.03em] leading-[1.04]",
							"mb-6",
							// Subtle text-shadow to lift off shader
							"drop-shadow-[0_2px_24px_oklch(0.78_0.14_44/0.3)]",
						].join(" ")}
					>
						{t("headline")}
					</h1>

					{/* Subline — light warm gray */}
					<p className="mx-auto max-w-xl text-lg md:text-xl text-white/75 mb-3 leading-relaxed tracking-[-0.01em]">
						{t("subline")}
					</p>

					{/* Supporting detail */}
					<p className="mx-auto max-w-lg text-sm text-white/50 mb-10 leading-relaxed">
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
								className="min-w-[180px] gap-2 shadow-[0_2px_24px_oklch(0.62_0.16_44/0.45)] hover:shadow-[0_4px_28px_oklch(0.62_0.16_44/0.6)] transition-shadow duration-200"
							>
								{t("cta_primary")}
								<ArrowRight className="size-4" aria-hidden="true" />
							</Button>
						</Link>
						<a href="#features">
							<Button
								variant="ghost"
								size="lg"
								className="min-w-[160px] gap-2 text-white/70 hover:text-white hover:bg-white/10"
							>
								<Play className="size-4" aria-hidden="true" />
								{t("cta_secondary")}
							</Button>
						</a>
					</motion.div>

					{/* Social proof micro-line */}
					<motion.p
						className="mt-8 text-xs text-white/40 tracking-[0.01em]"
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
