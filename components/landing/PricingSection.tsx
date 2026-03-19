"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Tier = {
	nameKey: string;
	price: string;
	earlyBirdPrice?: string;
	descKey: string;
	ctaKey: string;
	ctaHref: string;
	featuresKey: string[];
	highlighted?: boolean;
	calloutKey?: string;
};

const TIERS: Tier[] = [
	{
		nameKey: "starter_name",
		price: "$0",
		descKey: "starter_desc",
		ctaKey: "starter_cta",
		ctaHref: "/sign-up",
		featuresKey: [
			"starter_f1",
			"starter_f2",
			"starter_f3",
			"starter_f4",
		],
	},
	{
		nameKey: "pro_name",
		price: "$499",
		earlyBirdPrice: "$399",
		descKey: "pro_desc",
		ctaKey: "pro_cta",
		ctaHref: "https://polar.sh/checkout/[POLAR_PRO_PRODUCT_ID]",
		featuresKey: [
			"pro_f1",
			"pro_f2",
			"pro_f3",
			"pro_f4",
			"pro_f5",
		],
		highlighted: true,
		calloutKey: "pro_callout",
	},
	{
		nameKey: "team_name",
		price: "$899",
		descKey: "team_desc",
		ctaKey: "team_cta",
		ctaHref: "https://polar.sh/checkout/[POLAR_TEAM_PRODUCT_ID]",
		featuresKey: [
			"team_f1",
			"team_f2",
			"team_f3",
			"team_f4",
			"team_f5",
			"team_f6",
		],
	},
];

export function PricingSection() {
	const t = useTranslations("landing.pricing");
	const reduced = useReducedMotion();

	const cardVariants = {
		hidden: { opacity: 0, y: reduced ? 0 : 20 },
		visible: { opacity: 1, y: 0 },
	};

	return (
		<section
			id="pricing"
			aria-labelledby="pricing-heading"
			className={cn(
				"py-20 md:py-32",
				"bg-gradient-to-b from-muted/20 to-muted/40",
				"dark:from-muted/10 dark:to-muted/20",
			)}
		>
			<div className="max-w-5xl mx-auto px-6">
				{/* Header */}
				<motion.div
					className="mb-12 md:mb-16 max-w-xl"
					initial={{ opacity: 0, y: 12 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-100px" }}
					transition={{ duration: 0.4, ease: "easeOut" }}
				>
					<h2
						id="pricing-heading"
						className="text-3xl md:text-4xl font-semibold tracking-[-0.03em] text-foreground mb-4"
					>
						{t("heading")}
					</h2>
					<p className="text-muted-foreground text-lg leading-relaxed">
						{t("subheading")}
					</p>
				</motion.div>

				{/* Tiers grid — staggered reveal */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:items-start">
					{TIERS.map((tier, i) => (
						<motion.div
							key={tier.nameKey}
							initial={cardVariants.hidden}
							whileInView={cardVariants.visible}
							viewport={{ once: true, margin: "-100px" }}
							transition={{ duration: 0.4, ease: "easeOut", delay: i * 0.08 }}
						>
							<PricingCard tier={tier} t={t} />
						</motion.div>
					))}
				</div>

				<p className="mt-8 text-xs text-muted-foreground text-center">
					{t("one_time_note")}
				</p>
			</div>
		</section>
	);
}

function PricingCard({
	tier,
	t,
}: {
	tier: Tier;
	t: ReturnType<typeof useTranslations>;
}) {
	return (
		<article
			className={cn(
				"rounded-xl p-6 flex flex-col relative h-full",
				tier.highlighted
					? [
							"border-2 border-primary/60",
							"bg-card",
							"shadow-[0_0_0_4px_oklch(var(--primary)/0.08),0_8px_32px_oklch(var(--primary)/0.15)]",
							"bg-gradient-to-b from-primary/4 to-transparent",
					  ].join(" ")
					: [
							"border border-border",
							"bg-card",
					  ].join(" "),
			)}
		>
			{/* Popular badge — Pro only */}
			{tier.highlighted && (
				<span className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground whitespace-nowrap tracking-[0.01em]">
					{t("popular_badge")}
				</span>
			)}

			{/* Tier name */}
			<h3
				className={cn(
					"text-base font-semibold tracking-[-0.02em]",
					tier.highlighted ? "text-foreground mt-2" : "text-foreground",
				)}
			>
				{t(tier.nameKey)}
			</h3>

			{/* Description */}
			<p className="text-sm text-muted-foreground mt-1 mb-5 leading-relaxed">
				{t(tier.descKey)}
			</p>

			{/* Price */}
			<div className="mb-2 flex items-baseline gap-2">
				<span className="text-4xl font-semibold tracking-[-0.03em] text-foreground">
					{tier.price}
				</span>
				{tier.price !== "$0" && (
					<span className="text-sm text-muted-foreground">
						{t("one_time_label")}
					</span>
				)}
			</div>

			{/* Early bird note */}
			{tier.earlyBirdPrice && (
				<p className="text-xs text-primary font-medium mb-5">
					{t("early_bird_note", { price: tier.earlyBirdPrice })}
				</p>
			)}

			{/* Pro callout — "The AI layer." */}
			{tier.calloutKey && (
				<p className="text-xs text-muted-foreground border-l-2 border-primary/50 pl-3 mb-5 italic leading-relaxed">
					{t(tier.calloutKey)}
				</p>
			)}

			{/* Divider */}
			<div className={cn("h-px mb-5", tier.highlighted ? "bg-primary/20" : "bg-border")} />

			{/* Features list */}
			<ul
				className="space-y-3 mb-8 flex-1"
				aria-label={`${t(tier.nameKey)} ${t("features_aria")}`}
			>
				{tier.featuresKey.map((fk) => (
					<li key={fk} className="flex items-start gap-2.5 text-sm text-foreground">
						<Check
							className={cn(
								"size-4 shrink-0 mt-0.5",
								tier.highlighted ? "text-primary" : "text-muted-foreground",
							)}
							aria-hidden="true"
						/>
						{t(fk)}
					</li>
				))}
			</ul>

			{/* CTA */}
			<a href={tier.ctaHref} className="block">
				<Button
					variant={tier.highlighted ? "default" : "outline"}
					className={cn(
						"w-full",
						tier.highlighted && [
							"shadow-[0_2px_12px_oklch(var(--primary)/0.30)]",
							"hover:shadow-[0_4px_16px_oklch(var(--primary)/0.40)]",
							"transition-shadow duration-200",
						].join(" "),
					)}
				>
					{t(tier.ctaKey)}
				</Button>
			</a>
		</article>
	);
}
