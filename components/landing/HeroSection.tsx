"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { GenerativeTree } from "@/components/landing/GenerativeTree";

// Expo Out — arrives with authority, settles clean. No drift.
const EXPO_OUT = [0.16, 1, 0.3, 1] as const;

export function HeroSection() {
	const t = useTranslations("landing.hero");

	return (
		<section
			aria-label={t("aria_label")}
			// Hero is always dark — the Radiant shader renders on #0a0a0a canvas.
			// Dark hero on light page is a premium pattern (Vercel, Linear, etc).
			className="relative min-h-[85vh] flex items-center overflow-hidden"
			style={{ background: "#0a0a0a" }}
		>
			{/* Layer 0 — Radiant Generative Tree shader (iframe, original Radiant source) */}
			<GenerativeTree className="z-0" />

			{/* Layer 1 — gradient fade to dark at bottom (matches the dark hero bg) */}
			<div
				className="pointer-events-none absolute inset-0 z-10"
				aria-hidden="true"
				style={{
					background:
						"linear-gradient(to bottom, transparent 0%, transparent 50%, #0a0a0a 100%)",
				}}
			/>

			{/* Layer 2 — vignette edges for text readability */}
			<div
				className="pointer-events-none absolute inset-0 z-10"
				aria-hidden="true"
				style={{
					background:
						"radial-gradient(ellipse 80% 70% at 50% 50%, transparent 30%, rgba(4, 4, 4, 0.55) 100%)",
				}}
			/>

			{/* Layer 3 — content */}
			<div className="relative z-20 max-w-5xl mx-auto px-6 py-20 md:py-28 w-full">
				<motion.div
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, ease: EXPO_OUT }}
				>
					{/* Eyebrow badge */}
					<span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/40 bg-blue-500/10 px-3.5 py-1 text-xs font-medium text-blue-300 mb-8 tracking-[0.01em]">
						{t("badge")}
					</span>

					{/* H1 */}
					<h1
						className="font-bold text-white text-balance mb-6"
						style={{
							fontSize: "clamp(2.75rem, 7vw, 6rem)",
							lineHeight: 1.0,
							letterSpacing: "-0.04em",
						}}
					>
						{t("headline_pre")}{" "}
						<span className="text-gradient">{t("headline_accent")}</span>{" "}
						{t("headline_post")}
					</h1>

					{/* Subline */}
					<motion.p
						className="text-lg md:text-xl text-white/70 max-w-2xl mb-3 leading-relaxed tracking-[-0.01em]"
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, ease: EXPO_OUT, delay: 0.1 }}
					>
						{t("subline")}
					</motion.p>

					{/* Supporting detail */}
					<p className="text-sm text-white/45 max-w-lg mb-10 leading-relaxed">
						{t("subline_detail")}
					</p>

					{/* CTAs */}
					<motion.div
						className="flex flex-col sm:flex-row items-center justify-start gap-4"
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, ease: EXPO_OUT, delay: 0.2 }}
					>
						<Link href="/sign-up">
							<Button
								size="lg"
								className="min-w-[180px] gap-2 bg-blue-500 hover:bg-blue-400 text-white shadow-[0_2px_16px_rgba(59,130,246,0.35)] hover:shadow-[0_4px_24px_rgba(59,130,246,0.50)] transition-all duration-200 border-0"
							>
								{t("cta_primary")}
								<ArrowRight className="size-4" aria-hidden="true" />
							</Button>
						</Link>
						<a href="#features">
							<Button
								variant="ghost"
								size="lg"
								className="min-w-[160px] gap-2 text-white/60 hover:text-white hover:bg-white/8"
							>
								<Play className="size-4" aria-hidden="true" />
								{t("cta_secondary")}
							</Button>
						</a>
					</motion.div>

					{/* Social proof */}
					<motion.p
						className="mt-8 text-xs text-white/40 tracking-[0.01em]"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.4, ease: EXPO_OUT, delay: 0.3 }}
					>
						Built on Convex. Shipped with Clerk. Powered by AI SDK v6.
					</motion.p>
				</motion.div>
			</div>
		</section>
	);
}
