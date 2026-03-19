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
	primary?: boolean;
};

const FEATURES: FeatureItem[] = [
	{
		icon: <Sparkles className="size-5" aria-hidden="true" />,
		titleKey: "generative_ui_title",
		descKey: "generative_ui_desc",
		primary: true,
	},
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

function useSectionVariants(delay = 0) {
	const reduced = useReducedMotion();
	return {
		hidden: { opacity: 0, y: reduced ? 0 : 20 },
		visible: {
			opacity: 1,
			y: 0,
			transition: { duration: 0.4, ease: "easeOut", delay },
		},
	};
}

export function FeaturesSection() {
	const t = useTranslations("landing.features");
	const headerVariants = useSectionVariants(0);
	const gridVariants = useSectionVariants(0.1);

	return (
		<section
			id="features"
			aria-labelledby="features-heading"
			className="py-20 md:py-32"
		>
			<div className="max-w-5xl mx-auto px-4 sm:px-6">
				{/* Section header */}
				<motion.div
					className="mb-12 md:mb-16 max-w-xl"
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, amount: 0.15 }}
					variants={headerVariants}
				>
					{/* Eyebrow — uppercase, wide tracking, accent-warm */}
					<p
						className="text-xs font-medium uppercase tracking-[0.05em] mb-3"
						style={{ color: "var(--accent-warm)" }}
					>
						{t("eyebrow")}
					</p>
					<h2
						id="features-heading"
						className="font-heading font-bold text-foreground mb-4"
					>
						{t("heading")}
					</h2>
					<p className="text-muted-foreground text-lg leading-relaxed">
						{t("subheading")}
					</p>
				</motion.div>

				{/* 3-column grid — flat layout, all cards equal */}
				<motion.div
					className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, amount: 0.15 }}
					variants={gridVariants}
				>
					{FEATURES.map((f) => (
						<FeatureCard key={f.titleKey} feature={f} t={t} />
					))}
				</motion.div>
			</div>
		</section>
	);
}

function FeatureCard({
	feature,
	t,
}: {
	feature: FeatureItem;
	t: ReturnType<typeof useTranslations>;
}) {
	return (
		<article
			className={cn(
				// Shape: sharp, editorial
				"rounded-none border border-[var(--border)]",
				// Surface
				"bg-[var(--card)]",
				// Spacing
				"p-6 md:p-8",
				// Hover: color shift only — no shadow, no scale
				"transition-colors duration-150",
				"hover:bg-[var(--card-hover)] hover:border-[var(--border-hover)]",
				// Primary card: left border accent only
				feature.primary && "border-l-4 border-l-primary",
			)}
		>
			{/* Icon — bare, 20px, muted-foreground, no container */}
			<div className="mb-5 text-muted-foreground" aria-hidden="true">
				{feature.icon}
			</div>

			{/* Title — H3, Space Grotesk 500, 20px */}
			<h3 className="font-heading font-medium text-[1.25rem] leading-[1.3] tracking-[-0.015em] text-foreground mb-2">
				{t(feature.titleKey)}
			</h3>

			{/* Description — body, muted */}
			<p className="text-muted-foreground text-sm leading-relaxed">
				{t(feature.descKey)}
			</p>
		</article>
	);
}
