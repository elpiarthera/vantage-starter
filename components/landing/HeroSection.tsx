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
			className="relative min-h-[85vh] flex items-center overflow-hidden"
		>
			{/* Layer 0 — fluid-amber WebGL shader (opacity 0.55, timeScale 0.07) */}
			<ShaderBackground src="/shaders/fluid-amber.html" opacity={0.55} timeScale={0.07} />

			{/* Layer 1 — gradient fade to background at bottom */}
			<div
				className="pointer-events-none absolute inset-0 z-10"
				aria-hidden="true"
				style={{
					background:
						"linear-gradient(to bottom, transparent 0%, transparent 50%, var(--background) 100%)",
				}}
			/>

			{/* Layer 2 — dark vignette edges for text readability */}
			<div
				className="pointer-events-none absolute inset-0 z-10"
				aria-hidden="true"
				style={{
					background: [
						"linear-gradient(to bottom, oklch(0.06 0.02 44 / 0.5) 0%, transparent 30%)",
						"radial-gradient(ellipse 70% 60% at 50% 50%, oklch(0.06 0.02 44 / 0.35) 0%, transparent 70%)",
					].join(", "),
				}}
			/>

			{/* Layer 3 — content */}
			<div className="relative z-20 max-w-5xl mx-auto px-6 py-24 md:py-32 w-full">
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, ease: "easeOut" }}
				>
					{/* Eyebrow badge */}
					<span className="inline-flex items-center gap-1.5 rounded-full border border-[oklch(0.78_0.14_44/0.5)] bg-[oklch(0.78_0.14_44/0.12)] px-3.5 py-1 text-xs font-medium text-[oklch(0.88_0.12_44)] mb-8 tracking-[0.01em]">
						{t("badge")}
					</span>

					{/* H1 — white on dark shader, tight tracking */}
					<h1
						className="font-semibold text-white text-balance mb-6 drop-shadow-[0_2px_24px_oklch(0.78_0.14_44/0.3)]"
						style={{
							fontSize: "clamp(3rem, 6vw, 5rem)",
							lineHeight: 1.05,
							letterSpacing: "-0.03em",
						}}
					>
						{t("headline")}
					</h1>

					{/* Subline */}
					<motion.p
						className="text-lg md:text-xl text-white/75 max-w-2xl mb-3 leading-relaxed tracking-[-0.01em]"
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.4, ease: "easeOut", delay: 0.08 }}
					>
						{t("subline")}
					</motion.p>

					{/* Supporting detail */}
					<p className="text-sm text-white/50 max-w-lg mb-10 leading-relaxed">
						{t("subline_detail")}
					</p>

					{/* CTAs */}
					<motion.div
						className="flex flex-col sm:flex-row items-center justify-start gap-4"
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.4, ease: "easeOut", delay: 0.16 }}
					>
						<Link href="/sign-up">
							<Button
								size="lg"
								className="min-w-[180px] gap-2 shadow-amber-sm hover:shadow-amber-md transition-shadow duration-200"
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
