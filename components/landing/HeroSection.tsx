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
			className="relative min-h-[85vh] flex items-center overflow-hidden bg-background"
		>
			{/* Layer 0 — Generative Branching Tree (Canvas 2D, reads --primary + --background CSS vars) */}
			<GenerativeTree className="z-0" />

			{/* Layer 1 — warm radial glow — depth anchor, invisible in light mode */}
			<div
				className="pointer-events-none absolute inset-0 z-5"
				aria-hidden="true"
				style={{
					background:
						"radial-gradient(ellipse 70% 50% at 50% 20%, oklch(0.68 0.15 65 / 0.08) 0%, transparent 70%)",
				}}
			/>

			{/* Layer 2 — gradient fade to background at bottom */}
			<div
				className="pointer-events-none absolute inset-0 z-10"
				aria-hidden="true"
				style={{
					background:
						"linear-gradient(to bottom, transparent 0%, transparent 50%, var(--background) 100%)",
				}}
			/>

			{/* Layer 3 — dark vignette edges for text readability */}
			<div
				className="pointer-events-none absolute inset-0 z-10"
				aria-hidden="true"
				style={{
					background: [
						"linear-gradient(to bottom, oklch(0.06 0.02 232 / 0.4) 0%, transparent 35%)",
						"radial-gradient(ellipse 70% 60% at 50% 50%, oklch(0.06 0.02 232 / 0.3) 0%, transparent 70%)",
					].join(", "),
				}}
			/>

			{/* Layer 4 — content */}
			<div className="relative z-20 max-w-5xl mx-auto px-6 py-20 md:py-28 w-full">
				<motion.div
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, ease: EXPO_OUT }}
				>
					{/* Eyebrow badge */}
					<span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/12 px-3.5 py-1 text-xs font-medium text-primary mb-8 tracking-[0.01em]">
						{t("badge")}
					</span>

					{/* H1 — bold, larger, tight. Accent word from translation key. */}
					<h1
						className="font-bold text-foreground text-balance mb-6"
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
						className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-3 leading-relaxed tracking-[-0.01em]"
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, ease: EXPO_OUT, delay: 0.1 }}
					>
						{t("subline")}
					</motion.p>

					{/* Supporting detail */}
					<p className="text-sm text-muted-foreground/70 max-w-lg mb-10 leading-relaxed">
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
								className="min-w-[180px] gap-2 shadow-[0_2px_8px_oklch(var(--primary)/0.30)] hover:shadow-[0_4px_16px_oklch(var(--primary)/0.40)] transition-shadow duration-200"
							>
								{t("cta_primary")}
								<ArrowRight className="size-4" aria-hidden="true" />
							</Button>
						</Link>
						<a href="#features">
							<Button
								variant="ghost"
								size="lg"
								className="min-w-[160px] gap-2 text-muted-foreground hover:text-foreground hover:bg-accent"
							>
								<Play className="size-4" aria-hidden="true" />
								{t("cta_secondary")}
							</Button>
						</a>
					</motion.div>

					{/* Social proof — specific stack names, not generic */}
					<motion.p
						className="mt-8 text-xs text-muted-foreground/60 tracking-[0.01em]"
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
