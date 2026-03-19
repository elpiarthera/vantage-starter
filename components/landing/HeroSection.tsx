"use client";

import { motion } from "framer-motion";
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
			className="relative min-h-[100vh] flex items-center justify-center overflow-hidden"
			style={{ background: "#000000" }}
		>
			{/* Layer 0 — Radiant Generative Tree shader */}
			<GenerativeTree className="z-0" />

			{/* Layer 1 — dark overlay at 40% opacity — shader becomes texture, not hero */}
			<div
				className="pointer-events-none absolute inset-0 z-10 bg-black/40"
				aria-hidden="true"
			/>

			{/* Layer 2 — content centered */}
			<div className="relative z-30 max-w-4xl mx-auto px-4 sm:px-6 py-16 md:py-28 w-full flex flex-col items-center text-center">
				<motion.div
					className="flex flex-col items-center"
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, ease: EXPO_OUT }}
				>
					{/* Eyebrow */}
					<span
						className="mb-8 block text-xs font-medium uppercase tracking-[0.05em]"
						style={{ color: "oklch(0.75 0.14 65)" }}
					>
						{t("badge")}
					</span>

					{/* H1 */}
					<h1
						className="font-heading font-bold text-white text-balance mb-6 max-w-[18ch]"
						style={{
							fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
							lineHeight: 1.05,
							letterSpacing: "-0.03em",
						}}
					>
						{t("headline_pre")}{" "}
						{t("headline_accent")}{" "}
						{t("headline_post")}
					</h1>

					{/* Subline */}
					<motion.p
						className="text-lg text-muted-foreground max-w-[50ch] mb-10 leading-relaxed tracking-[-0.01em]"
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, ease: EXPO_OUT, delay: 0.1 }}
					>
						{t("subline")}
					</motion.p>

					{/* CTAs */}
					<motion.div
						className="flex flex-row items-center justify-center gap-4"
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, ease: EXPO_OUT, delay: 0.2 }}
					>
						<Link href="/sign-up">
							<Button
								size="lg"
								className="h-12 px-8 rounded-full bg-primary text-primary-foreground border-0 hover:opacity-90 transition-opacity duration-100"
							>
								{t("cta_primary")}
							</Button>
						</Link>
						<a href="#features">
							<Button
								variant="ghost"
								size="lg"
								className="h-12 px-8 rounded-full bg-transparent border border-border text-foreground hover:opacity-90 transition-opacity duration-100 hover:bg-transparent"
							>
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

			{/* Layer 3 — bottom fade: 200px gradient from #000 to --background */}
			<div
				className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 h-[200px] bg-gradient-to-b from-[#000000] to-background"
				aria-hidden="true"
			/>
		</section>
	);
}
