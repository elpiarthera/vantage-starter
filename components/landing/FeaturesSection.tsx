"use client";

import type React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
	Bot,
	Brain,
	Coins,
	Globe,
	Layers,
	ShieldCheck,
	Sparkles,
	Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type FeatureItem = {
	icon: React.ReactNode;
	titleKey: string;
	descKey: string;
	accent?: boolean;
	primary?: boolean;
};

const FEATURES: FeatureItem[] = [
	// 1 — primary differentiator (full-width hero card)
	{
		icon: <Sparkles className="size-5" aria-hidden="true" />,
		titleKey: "generative_ui_title",
		descKey: "generative_ui_desc",
		accent: true,
		primary: true,
	},
	// 3 pillars
	{
		icon: <Coins className="size-5" aria-hidden="true" />,
		titleKey: "credits_title",
		descKey: "credits_desc",
	},
	{
		icon: <Zap className="size-5" aria-hidden="true" />,
		titleKey: "realtime_title",
		descKey: "realtime_desc",
	},
	{
		icon: <Bot className="size-5" aria-hidden="true" />,
		titleKey: "agents_title",
		descKey: "agents_desc",
	},
	// 4 proof points
	{
		icon: <Brain className="size-5" aria-hidden="true" />,
		titleKey: "rag_title",
		descKey: "rag_desc",
	},
	{
		icon: <ShieldCheck className="size-5" aria-hidden="true" />,
		titleKey: "accessibility_title",
		descKey: "accessibility_desc",
	},
	{
		icon: <Layers className="size-5" aria-hidden="true" />,
		titleKey: "stack_title",
		descKey: "stack_desc",
	},
	{
		icon: <Globe className="size-5" aria-hidden="true" />,
		titleKey: "no_sql_title",
		descKey: "no_sql_desc",
	},
];

// Shared animation variants — useReducedMotion collapses y movement
function useCardVariants() {
	const reduced = useReducedMotion();
	return {
		hidden: { opacity: 0, y: reduced ? 0 : 20 },
		visible: { opacity: 1, y: 0 },
	};
}

export function FeaturesSection() {
	const t = useTranslations("landing.features");
	const cardVariants = useCardVariants();

	return (
		<section
			id="features"
			aria-labelledby="features-heading"
			className="py-20 md:py-32"
		>
			<div className="max-w-5xl mx-auto px-6">
				{/* Section header — fade in on scroll */}
				<motion.div
					className="mb-12 md:mb-16 max-w-xl"
					initial={{ opacity: 0, y: 12 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-100px" }}
					transition={{ duration: 0.4, ease: "easeOut" }}
				>
					<h2
						id="features-heading"
						className="text-3xl md:text-4xl font-semibold tracking-[-0.03em] text-foreground mb-4"
					>
						{t("heading")}
					</h2>
					<p className="text-muted-foreground text-lg leading-relaxed">
						{t("subheading")}
					</p>
				</motion.div>

				{/* 1+3+4 grid */}
				<div className="grid grid-cols-1 gap-6 md:gap-8">
					{/* Row 1: primary differentiator — full width, elevated treatment */}
					<motion.div
						initial={cardVariants.hidden}
						whileInView={cardVariants.visible}
						viewport={{ once: true, margin: "-100px" }}
						transition={{ duration: 0.4, ease: "easeOut" }}
					>
						<PrimaryFeatureCard feature={FEATURES[0]} t={t} />
					</motion.div>

					{/* Row 2: 3 pillars — staggered */}
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8">
						{FEATURES.slice(1, 4).map((f, i) => (
							<motion.div
								key={f.titleKey}
								initial={cardVariants.hidden}
								whileInView={cardVariants.visible}
								viewport={{ once: true, margin: "-100px" }}
								transition={{ duration: 0.4, ease: "easeOut", delay: i * 0.08 }}
							>
								<FeatureCard feature={f} t={t} />
							</motion.div>
						))}
					</div>

					{/* Row 3: 4 proof points — staggered */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
						{FEATURES.slice(4).map((f, i) => (
							<motion.div
								key={f.titleKey}
								initial={cardVariants.hidden}
								whileInView={cardVariants.visible}
								viewport={{ once: true, margin: "-100px" }}
								transition={{ duration: 0.4, ease: "easeOut", delay: i * 0.08 }}
							>
								<FeatureCard feature={f} t={t} compact />
							</motion.div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}

// Full-width primary card — the Generative UI differentiator gets elevated treatment
function PrimaryFeatureCard({
	feature,
	t,
}: {
	feature: FeatureItem;
	t: ReturnType<typeof useTranslations>;
}) {
	return (
		<article
			className={cn(
				"rounded-xl border p-8 md:p-10",
				// Primary accent — electric blue border
				"border-primary/40",
				// Subtle primary background tint
				"bg-gradient-to-br from-primary/8 via-primary/4 to-transparent",
				"dark:from-primary/12 dark:via-primary/6 dark:to-transparent",
				// Hover: primary border glow, not scale
				"transition-shadow duration-200",
				"hover:shadow-[0_0_0_1px_oklch(var(--primary)/0.35),0_4px_24px_oklch(var(--primary)/0.12)]",
				"md:flex md:items-start md:gap-10",
			)}
		>
			{/* Icon — primary, prominent */}
			<div
				className={cn(
					"flex-shrink-0 flex items-center justify-center",
					"size-12 rounded-xl",
					"bg-primary/15 border border-primary/25",
					"text-primary",
					"mb-5 md:mb-0 md:mt-1",
				)}
			>
				{feature.icon}
			</div>

			<div>
				{/* Differentiator badge */}
				<span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary mb-3 tracking-[0.01em]">
					Zero competitors
				</span>
				<h3 className="text-xl md:text-2xl font-semibold text-foreground tracking-[-0.02em] mb-2">
					{t(feature.titleKey)}
				</h3>
				<p className="text-muted-foreground leading-relaxed max-w-2xl">
					{t(feature.descKey)}
				</p>
			</div>
		</article>
	);
}

// Standard feature card — 3 pillars and 4 proof points
function FeatureCard({
	feature,
	t,
	compact,
}: {
	feature: FeatureItem;
	t: ReturnType<typeof useTranslations>;
	compact?: boolean;
}) {
	return (
		<article
			className={cn(
				"rounded-xl border border-border p-6",
				"bg-card",
				// Hover: primary border glow, no scale
				"transition-shadow duration-150",
				"hover:border-primary/30",
				"hover:shadow-[0_0_0_1px_oklch(var(--primary)/0.20),0_2px_12px_oklch(var(--primary)/0.08)]",
			)}
		>
			{/* Icon container — primary tinted */}
			<div
				className={cn(
					"flex items-center justify-center",
					"size-9 rounded-lg mb-4",
					"bg-primary/10 border border-primary/20",
					"text-primary",
				)}
				aria-hidden="true"
			>
				{feature.icon}
			</div>

			<h3
				className={cn(
					"font-semibold text-foreground mb-1.5 tracking-[-0.02em]",
					compact ? "text-sm" : "text-base",
				)}
			>
				{t(feature.titleKey)}
			</h3>
			<p
				className={cn(
					"text-muted-foreground leading-relaxed",
					compact ? "text-xs" : "text-sm",
				)}
			>
				{t(feature.descKey)}
			</p>
		</article>
	);
}
